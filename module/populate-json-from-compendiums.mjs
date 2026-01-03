/**
 * Populate JSON files from existing compendiums
 * 
 * This function exports data from existing system compendiums,
 * adds folder assignments, and prepares it for JSON files.
 * 
 * Usage: game.rq3.populateJSONFromCompendiums()
 */

/**
 * Get folder for weapon based on weaponType
 */
function getWeaponFolder(weaponType) {
  const skillMap = {
    'axe': 'Blade', 'hammer': 'Blade', 'dagger': 'Close Combat', 'fist': 'Close Combat',
    'mace': 'Blunt', 'shield': 'Shield', 'spear': 'Spear', 'javelin': 'Spear',
    'sword': 'Sword', 'tool': 'Tools', 'bow': 'Bow', 'crossbow': 'Crossbow',
    'dart': 'Dart', 'sling': 'Sling', 'staff-sling': 'Staff Sling',
    'rock': 'Rock', 'club': 'Club', 'net': 'Net'
  };
  return skillMap[weaponType] || 'Other';
}

/**
 * Get folder for armour based on armorType
 */
function getArmorFolder(armorType) {
  const typeMap = {
    'soft-leather': 'Soft Leather', 'stiff-leather': 'Stiff Leather',
    'chainmail': 'Chainmail', 'scale': 'Scale', 'plate': 'Plate',
    'lamellar': 'Lamellar', 'quilted': 'Quilted', 'hide': 'Hide',
    'bone': 'Bone', 'bronze': 'Bronze', 'cuirbouilli': 'Cuirbouilli',
    'bezainted': 'Bezainted', 'ringmail': 'Ringmail', 'brigandine': 'Brigandine',
    'shield': 'Shield'
  };
  if (!typeMap[armorType]) {
    return armorType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return typeMap[armorType] || 'Other';
}

/**
 * Export compendium data and format with folders
 */
export async function populateJSONFromCompendiums() {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can run this!");
    return;
  }
  
  ui.notifications.info("Exporting compendium data to JSON format...");
  
  const packs = [
    { id: "runequest3.weapons", name: "weapons", getFolder: (item) => getWeaponFolder(item.system?.weaponType) },
    { id: "runequest3.armour", name: "armour", getFolder: (item) => getArmorFolder(item.system?.armorType) },
    { id: "runequest3.species", name: "species", getFolder: (item) => {
      const type = item.system?.type || 'Other';
      return type.charAt(0).toUpperCase() + type.slice(1);
    }},
    { id: "runequest3.spirit-magic", name: "spirit-magic", getFolder: () => "Spirit Magic" },
    { id: "runequest3.divine-magic", name: "divine-magic", getFolder: () => "Divine Magic" },
    { id: "runequest3.sorcery", name: "sorcery", getFolder: () => "Sorcery" }
  ];
  
  const results = {};
  
  for (const packInfo of packs) {
    try {
      // Try system compendium first, then world compendium
      let pack = game.packs.get(packInfo.id);
      if (!pack) {
        // Fallback: look for world compendium by label
        const labelMap = {
          "weapons": "Weapons",
          "armour": "Armour",
          "species": "Species",
          "spirit-magic": "Spirit Magic",
          "divine-magic": "Divine Magic",
          "sorcery": "Sorcery"
        };
        const label = labelMap[packInfo.name];
        if (label) {
          pack = game.packs.find(p => p.metadata.label === label && p.metadata.package === "world");
          if (!pack) {
            pack = game.packs.find(p => p.metadata.label === label);
          }
        }
      }
      if (!pack) {
        console.warn(`RQ3 | Pack ${packInfo.id} or world compendium not found, skipping`);
        continue;
      }
      
      const items = await pack.getDocuments();
      const data = {};
      
      for (const item of items) {
        const itemData = item.toObject();
        const key = itemData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const folder = packInfo.getFolder(itemData);
        
        // Get version from item flags or use current system version
        const version = itemData.flags?.runequest3?.version || game.system.version;
        
        data[key] = {
          version: version,
          folder: folder,
          data: itemData
        };
      }
      
      results[packInfo.name] = data;
      console.log(`RQ3 | Exported ${packInfo.name}: ${Object.keys(data).length} items`);
    } catch (error) {
      console.error(`RQ3 | Error exporting ${packInfo.name}:`, error);
    }
  }
  
  // Combine magic types
  if (results['spirit-magic'] && results['divine-magic'] && results['sorcery']) {
    results['magic'] = {
      ...results['spirit-magic'],
      ...results['divine-magic'],
      ...results['sorcery']
    };
    delete results['spirit-magic'];
    delete results['divine-magic'];
    delete results['sorcery'];
  }
  
  // Download JSON files with delay to prevent browser blocking
  const entries = Object.entries(results);
  for (let i = 0; i < entries.length; i++) {
    const [name, data] = entries[i];
    
    setTimeout(() => {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a delay
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`RQ3 | Downloaded ${name}.json (${Object.keys(data).length} items)`);
    }, i * 500); // 500ms delay between each download
  }
  
  ui.notifications.info(`Downloading ${entries.length} JSON files... (check browser download settings if files don't download)`);
  
  ui.notifications.info("All JSON files downloaded! Copy them to packs/runequest3/data/");
  console.log("RQ3 | Files ready! Copy the downloaded JSON files to packs/runequest3/data/");
  
  return results;
}

