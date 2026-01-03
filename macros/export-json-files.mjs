/**
 * Export JSON Files Macro
 * 
 * Creates a dialog with download links for each JSON file
 * and an option to download all files at once.
 * 
 * Usage: Import this as a Script macro in Foundry
 */

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
  
  // Weapons
  const weapons = await getCompendiumDataAsJSON("runequest3.weapons", getWeaponFolder);
  if (weapons) files.weapons = weapons;
  
  // Armour
  const armour = await getCompendiumDataAsJSON("runequest3.armour", getArmorFolder);
  if (armour) files.armour = armour;
  
  // Species
  const species = await getCompendiumDataAsJSON("runequest3.species", getSpeciesFolder);
  if (species) files.species = species;
  
  // Magic (combined)
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

/**
 * Main macro function - creates dialog with download links
 */
export async function exportJSONFilesMacro() {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can export JSON files!");
    return;
  }
  
  // Create dialog content with download links
  const content = `
    <div style="padding: 10px;">
      <h3>Export Compendium Data to JSON</h3>
      <p>Click a link below to download that compendium's data as JSON:</p>
      <div style="margin: 15px 0;">
        <button id="download-weapons" style="margin: 5px; padding: 8px 15px; cursor: pointer;">
          <i class="fas fa-download"></i> Download Weapons.json
        </button>
        <button id="download-armour" style="margin: 5px; padding: 8px 15px; cursor: pointer;">
          <i class="fas fa-download"></i> Download Armour.json
        </button>
        <button id="download-species" style="margin: 5px; padding: 8px 15px; cursor: pointer;">
          <i class="fas fa-download"></i> Download Species.json
        </button>
        <button id="download-magic" style="margin: 5px; padding: 8px 15px; cursor: pointer;">
          <i class="fas fa-download"></i> Download Magic.json
        </button>
      </div>
      <div style="margin: 20px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
        <button id="download-all" style="margin: 5px; padding: 10px 20px; cursor: pointer; font-weight: bold; background: #4CAF50; color: white; border: none; border-radius: 5px;">
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
      html.find("#download-weapons").click(async () => {
        const data = await getCompendiumDataAsJSON("runequest3.weapons", getWeaponFolder);
        if (data) {
          downloadJSON(data, "weapons.json");
          ui.notifications.info(`Downloaded weapons.json (${Object.keys(data).length} items)`);
        } else {
          ui.notifications.error("Weapons compendium not found!");
        }
      });
      
      // Armour download
      html.find("#download-armour").click(async () => {
        const data = await getCompendiumDataAsJSON("runequest3.armour", getArmorFolder);
        if (data) {
          downloadJSON(data, "armour.json");
          ui.notifications.info(`Downloaded armour.json (${Object.keys(data).length} items)`);
        } else {
          ui.notifications.error("Armour compendium not found!");
        }
      });
      
      // Species download
      html.find("#download-species").click(async () => {
        const data = await getCompendiumDataAsJSON("runequest3.species", getSpeciesFolder);
        if (data) {
          downloadJSON(data, "species.json");
          ui.notifications.info(`Downloaded species.json (${Object.keys(data).length} items)`);
        } else {
          ui.notifications.error("Species compendium not found!");
        }
      });
      
      // Magic download
      html.find("#download-magic").click(async () => {
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
      
      // Download all
      html.find("#download-all").click(async () => {
        await downloadAllFiles();
      });
    },
    default: "close"
  }).render(true);
}

