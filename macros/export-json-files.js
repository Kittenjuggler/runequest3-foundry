/**
 * Export JSON Files Macro
 * 
 * Copy this entire file into a Script macro in Foundry VTT
 * 
 * This macro creates a dialog with download links for each JSON file
 * and an option to download all files at once.
 */

(async () => {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can export JSON files!");
    return;
  }
  
  /**
   * Get data from a compendium and format as JSON with folders
   */
  async function getCompendiumDataAsJSON(packId, getFolderFn) {
    const pack = game.packs.get(packId);
    if (!pack) {
      return null;
    }
    
    const items = await pack.getDocuments();
    const data = {};
    
    for (const item of items) {
      const itemData = item.toObject();
      const key = itemData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const folder = getFolderFn ? getFolderFn(itemData) : 'Other';
      
      // Get version from item flags or use current system version
      const version = itemData.flags?.runequest3?.version || game.system.version;
      
      data[key] = {
        version: version,
        folder: folder,
        data: itemData
      };
    }
    
    return data;
  }
  
  /**
   * Get folder for weapon
   */
  function getWeaponFolder(itemData) {
    const skillMap = {
      'axe': 'Blade', 'hammer': 'Blade', 'dagger': 'Close Combat', 'fist': 'Close Combat',
      'mace': 'Blunt', 'shield': 'Shield', 'spear': 'Spear', 'javelin': 'Spear',
      'sword': 'Sword', 'tool': 'Tools', 'bow': 'Bow', 'crossbow': 'Crossbow',
      'dart': 'Dart', 'sling': 'Sling', 'staff-sling': 'Staff Sling',
      'rock': 'Rock', 'club': 'Club', 'net': 'Net'
    };
    const weaponType = itemData.system?.weaponType;
    return skillMap[weaponType] || 'Other';
  }
  
  /**
   * Get folder for armour
   */
  function getArmorFolder(itemData) {
    const typeMap = {
      'soft-leather': 'Soft Leather', 'stiff-leather': 'Stiff Leather',
      'chainmail': 'Chainmail', 'scale': 'Scale', 'plate': 'Plate',
      'lamellar': 'Lamellar', 'quilted': 'Quilted', 'hide': 'Hide',
      'bone': 'Bone', 'bronze': 'Bronze', 'cuirbouilli': 'Cuirbouilli',
      'bezainted': 'Bezainted', 'ringmail': 'Ringmail', 'brigandine': 'Brigandine',
      'shield': 'Shield'
    };
    const armorType = itemData.system?.armorType;
    if (!typeMap[armorType]) {
      return armorType ? armorType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Other';
    }
    return typeMap[armorType] || 'Other';
  }
  
  /**
   * Get folder for species
   */
  function getSpeciesFolder(itemData) {
    const type = itemData.system?.type || 'Other';
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
  
  /**
   * Get folder for magic spell
   */
  function getMagicFolder(itemData) {
    const spellType = itemData.system?.spellType;
    if (spellType === 'spirit') return 'Spirit Magic';
    if (spellType === 'divine') return 'Divine Magic';
    if (spellType === 'sorcery') return 'Sorcery';
    return 'Other';
  }
  
  /**
   * Download a JSON file
   */
  function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
  
  /**
   * Download all JSON files
   */
  async function downloadAllFiles() {
    ui.notifications.info("Preparing all JSON files for download...");
    
    const files = {};
    
  // Weapons (try both old system and new world compendiums)
  const weaponsPack = game.packs.get("runequest3.weapons") || game.packs.find(p => p.metadata.label === "Weapons");
  if (weaponsPack) {
    const weapons = await getCompendiumDataAsJSON(weaponsPack.collection, getWeaponFolder);
    if (weapons) files.weapons = weapons;
  }
  
  // Armour (try both old system and new world compendiums)
  const armourPack = game.packs.get("runequest3.armour") || game.packs.find(p => p.metadata.label === "Armour");
  if (armourPack) {
    const armour = await getCompendiumDataAsJSON(armourPack.collection, getArmorFolder);
    if (armour) files.armour = armour;
  }
  
  // Species (try both old system and new world compendiums)
  const speciesPack = game.packs.get("runequest3.species") || game.packs.find(p => p.metadata.label === "Species");
  if (speciesPack) {
    const species = await getCompendiumDataAsJSON(speciesPack.collection, getSpeciesFolder);
    if (species) files.species = species;
  }
  
  // Equipment (try both old system and new world compendiums)
  const equipmentPack = game.packs.get("runequest3.equipment") || game.packs.find(p => p.metadata.label === "Equipment");
  if (equipmentPack) {
    const equipment = await getCompendiumDataAsJSON(equipmentPack.collection, null);
    if (equipment) files.equipment = equipment;
  }
  
  // Magic (try unified first, then fallback to individual)
  const magicPack = game.packs.find(p => p.metadata.label === "Magic");
  if (magicPack) {
    const magic = await getCompendiumDataAsJSON(magicPack.collection, getMagicFolder);
    if (magic) files.magic = magic;
  } else {
    // Fallback to individual magic compendiums
    const spiritMagic = await getCompendiumDataAsJSON("runequest3.spirit-magic", getMagicFolder);
    const divineMagic = await getCompendiumDataAsJSON("runequest3.divine-magic", getMagicFolder);
    const sorcery = await getCompendiumDataAsJSON("runequest3.sorcery", getMagicFolder);
    
    if (spiritMagic || divineMagic || sorcery) {
      files.magic = {
        ...(spiritMagic || {}),
        ...(divineMagic || {}),
        ...(sorcery || {})
      };
    }
  }
    
    // Download all with delays
    const entries = Object.entries(files);
    for (let i = 0; i < entries.length; i++) {
      const [name, data] = entries[i];
      setTimeout(() => {
        downloadJSON(data, `${name}.json`);
        console.log(`RQ3 | Downloaded ${name}.json (${Object.keys(data).length} items)`);
      }, i * 500);
    }
    
    ui.notifications.info(`Downloading ${entries.length} JSON files...`);
  }
  
  // Check which compendiums exist (check both old system and new world compendiums)
  const hasWeapons = game.packs.get("runequest3.weapons") || game.packs.find(p => p.metadata.label === "Weapons");
  const hasArmour = game.packs.get("runequest3.armour") || game.packs.find(p => p.metadata.label === "Armour");
  const hasSpecies = game.packs.get("runequest3.species") || game.packs.find(p => p.metadata.label === "Species");
  const hasEquipment = game.packs.get("runequest3.equipment") || game.packs.find(p => p.metadata.label === "Equipment");
  const hasSpiritMagic = game.packs.get("runequest3.spirit-magic");
  const hasDivineMagic = game.packs.get("runequest3.divine-magic");
  const hasSorcery = game.packs.get("runequest3.sorcery");
  const hasMagic = hasSpiritMagic || hasDivineMagic || hasSorcery || game.packs.find(p => p.metadata.label === "Magic");
  
  // Create dialog content with download links
  const content = `
    <div style="padding: 10px;">
      <h3>Export Compendium Data to JSON</h3>
      <p>Click a button below to download that compendium's data as JSON:</p>
      <div style="margin: 15px 0;">
        ${hasWeapons ? `<button id="download-weapons" style="margin: 5px; padding: 8px 15px; cursor: pointer; width: 100%; text-align: left;">
          <i class="fas fa-download"></i> Download Weapons.json
        </button>` : ''}
        ${hasArmour ? `<button id="download-armour" style="margin: 5px; padding: 8px 15px; cursor: pointer; width: 100%; text-align: left;">
          <i class="fas fa-download"></i> Download Armour.json
        </button>` : ''}
        ${hasSpecies ? `<button id="download-species" style="margin: 5px; padding: 8px 15px; cursor: pointer; width: 100%; text-align: left;">
          <i class="fas fa-download"></i> Download Species.json
        </button>` : ''}
        ${hasMagic ? `<button id="download-magic" style="margin: 5px; padding: 8px 15px; cursor: pointer; width: 100%; text-align: left;">
          <i class="fas fa-download"></i> Download Magic.json
        </button>` : ''}
        ${hasEquipment ? `<button id="download-equipment" style="margin: 5px; padding: 8px 15px; cursor: pointer; width: 100%; text-align: left;">
          <i class="fas fa-download"></i> Download Equipment.json
        </button>` : ''}
      </div>
      <div style="margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
        <button id="download-all" style="margin: 5px; padding: 10px 20px; cursor: pointer; font-weight: bold; background: #4CAF50; color: white; border: none; border-radius: 5px; width: 100%;">
          <i class="fas fa-download"></i> Download All Files
        </button>
      </div>
      <p style="font-size: 0.9em; color: #666; margin-top: 15px;">
        <strong>Note:</strong> Files will be downloaded to your browser's Downloads folder.<br>
        Copy them to <code>packs/runequest3/data/</code> to update the source files.
      </p>
    </div>
  `;
  
  const dialog = new Dialog({
    title: "Export JSON Files",
    content: content,
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: "Close"
      }
    },
    render: (html) => {
      // Weapons download
      if (hasWeapons) {
        html.find("#download-weapons").click(async () => {
          const pack = game.packs.get("runequest3.weapons") || game.packs.find(p => p.metadata.label === "Weapons");
          if (!pack) {
            ui.notifications.error("Weapons compendium not found!");
            return;
          }
          const data = await getCompendiumDataAsJSON(pack.collection, getWeaponFolder);
          if (data) {
            downloadJSON(data, "weapons.json");
            ui.notifications.info(`Downloaded weapons.json (${Object.keys(data).length} items)`);
          } else {
            ui.notifications.error("Failed to export weapons data!");
          }
        });
      }
      
      // Armour download
      if (hasArmour) {
        html.find("#download-armour").click(async () => {
          const pack = game.packs.get("runequest3.armour") || game.packs.find(p => p.metadata.label === "Armour");
          if (!pack) {
            ui.notifications.error("Armour compendium not found!");
            return;
          }
          const data = await getCompendiumDataAsJSON(pack.collection, getArmorFolder);
          if (data) {
            downloadJSON(data, "armour.json");
            ui.notifications.info(`Downloaded armour.json (${Object.keys(data).length} items)`);
          } else {
            ui.notifications.error("Failed to export armour data!");
          }
        });
      }
      
      // Species download
      if (hasSpecies) {
        html.find("#download-species").click(async () => {
          const pack = game.packs.get("runequest3.species") || game.packs.find(p => p.metadata.label === "Species");
          if (!pack) {
            ui.notifications.error("Species compendium not found!");
            return;
          }
          const data = await getCompendiumDataAsJSON(pack.collection, getSpeciesFolder);
          if (data) {
            downloadJSON(data, "species.json");
            ui.notifications.info(`Downloaded species.json (${Object.keys(data).length} items)`);
          } else {
            ui.notifications.error("Failed to export species data!");
          }
        });
      }
      
      // Magic download
      if (hasMagic) {
        html.find("#download-magic").click(async () => {
          // Try unified magic compendium first
          const magicPack = game.packs.find(p => p.metadata.label === "Magic");
          if (magicPack) {
            const data = await getCompendiumDataAsJSON(magicPack.collection, getMagicFolder);
            if (data) {
              downloadJSON(data, "magic.json");
              ui.notifications.info(`Downloaded magic.json (${Object.keys(data).length} items)`);
              return;
            }
          }
          
          // Fallback to individual magic compendiums
          const spiritMagic = await getCompendiumDataAsJSON("runequest3.spirit-magic", getMagicFolder);
          const divineMagic = await getCompendiumDataAsJSON("runequest3.divine-magic", getMagicFolder);
          const sorcery = await getCompendiumDataAsJSON("runequest3.sorcery", getMagicFolder);
          
          if (spiritMagic || divineMagic || sorcery) {
            const combined = {
              ...(spiritMagic || {}),
              ...(divineMagic || {}),
              ...(sorcery || {})
            };
            downloadJSON(combined, "magic.json");
            ui.notifications.info(`Downloaded magic.json (${Object.keys(combined).length} items)`);
          } else {
            ui.notifications.error("Magic compendiums not found!");
          }
        });
      }
      
      // Equipment download
      if (hasEquipment) {
        html.find("#download-equipment").click(async () => {
          const pack = game.packs.get("runequest3.equipment") || game.packs.find(p => p.metadata.label === "Equipment");
          if (!pack) {
            ui.notifications.error("Equipment compendium not found!");
            return;
          }
          const data = await getCompendiumDataAsJSON(pack.collection, null); // No folder logic for equipment yet
          if (data) {
            downloadJSON(data, "equipment.json");
            ui.notifications.info(`Downloaded equipment.json (${Object.keys(data).length} items)`);
          } else {
            ui.notifications.error("Failed to export equipment data!");
          }
        });
      }
      
      // Download all
      html.find("#download-all").click(async () => {
        await downloadAllFiles();
      });
    },
    default: "close"
  }).render(true);
})();

