/**
 * Compendium Folder Loader
 * 
 * This module provides utilities for creating compendiums with folder organization
 * from JSON source data, following the Pathfinder 2e pattern.
 * 
 * Note: System compendiums cannot have folders, so this creates world compendiums.
 */

/**
 * Get folder name for a weapon based on its weaponType
 * @param {string} weaponType - The weapon type
 * @returns {string} The folder name
 */
function getFolderForWeaponType(weaponType) {
  const skillMap = {
    'axe': 'Blade',
    'hammer': 'Blade',
    'dagger': 'Close Combat',
    'fist': 'Close Combat',
    'mace': 'Blunt',
    'shield': 'Shield',
    'spear': 'Spear',
    'javelin': 'Spear',
    'sword': 'Sword',
    'tool': 'Tools',
    'bow': 'Bow',
    'crossbow': 'Crossbow',
    'dart': 'Dart',
    'sling': 'Sling',
    'staff-sling': 'Staff Sling',
    'rock': 'Rock',
    'club': 'Club',
    'net': 'Net'
  };
  
  return skillMap[weaponType] || 'Other';
}

/**
 * Get folder name for armour based on its type
 * @param {string} armorType - The armor type
 * @returns {string} The folder name
 */
function getFolderForArmorType(armorType) {
  const typeMap = {
    'soft-leather': 'Soft Leather',
    'stiff-leather': 'Stiff Leather',
    'chainmail': 'Chainmail',
    'scale': 'Scale',
    'plate': 'Plate',
    'lamellar': 'Lamellar',
    'quilted': 'Quilted',
    'hide': 'Hide',
    'bone': 'Bone',
    'bronze': 'Bronze',
    'cuirbouilli': 'Cuirbouilli',
    'bezainted': 'Bezainted',
    'ringmail': 'Ringmail',
    'brigandine': 'Brigandine',
    'shield': 'Shield',
    'clothes': 'Clothes'
  };
  
  // Convert kebab-case to Title Case if not in map
  if (!typeMap[armorType]) {
    return armorType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return typeMap[armorType] || 'Other';
}

/**
 * Get armor points for a folder name (for sorting)
 * @param {string} folderName - The folder name
 * @returns {number} Armor points value
 */
function getArmorPointsForFolder(folderName) {
  const armorPointsMap = {
    'Clothes': 0,
    'Soft Leather': 1,
    'Stiff Leather': 2,
    'Cuirbouilli': 3,
    'Bezainted': 4,
    'Ringmail': 5,
    'Lamellar': 6,
    'Scale': 6,
    'Chainmail': 7,
    'Brigandine': 7,
    'Plate': 8,
    'Shield': 0, // Shields have variable AP
    'Other': 999 // Put unknown types at the end
  };
  
  return armorPointsMap[folderName] !== undefined ? armorPointsMap[folderName] : 999;
}

/**
 * Get folder name for a spell based on its type and properties
 * @param {Object} itemData - The item data
 * @param {boolean} simpleFolders - If true, only use spell type (no subfolders)
 * @returns {string} The folder name
 */
function getFolderForSpell(itemData, simpleFolders = false) {
  const system = itemData?.system || {};
  
  // For unified magic compendium, always use simple folders
  if (simpleFolders) {
    if (system.spellType === 'spirit') return 'Spirit Magic';
    if (system.spellType === 'divine') return 'Divine Magic';
    if (system.spellType === 'sorcery') return 'Sorcery';
    return 'Other';
  }
  
  // For divine magic, group by deity if available
  if (system.spellType === 'divine' && system.deity && system.deity !== 'Any') {
    return system.deity;
  }
  
  // For sorcery, group by skill if available
  if (system.spellType === 'sorcery' && system.skill) {
    return system.skill;
  }
  
  // Default: use spell type
  if (system.spellType === 'spirit') return 'Spirit Magic';
  if (system.spellType === 'divine') return 'Divine Magic';
  if (system.spellType === 'sorcery') return 'Sorcery';
  
  return 'Other';
}

/**
 * Get folder name for species based on its type
 * @param {Object} itemData - The item data
 * @returns {string} The folder name
 */
function getFolderForSpecies(itemData) {
  const system = itemData?.system || {};
  const type = system.type || 'Other';
  
  // Capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Create a world compendium with folders from JSON data
 * @param {string} packName - Name of the pack (e.g., "weapons")
 * @param {string} targetLabel - Label for the world compendium
 * @param {Object} data - The JSON data object
 * @returns {Promise<CompendiumCollection>} The created compendium
 */
export async function createCompendiumWithFolders(packName, targetLabel, data) {
  if (!game.user.isGM) {
    throw new Error("Only GMs can create compendiums");
  }
  
  // Check if target already exists
  const existingPack = game.packs.find(p => p.metadata.label === targetLabel);
  if (existingPack) {
    const proceed = await Dialog.confirm({
      title: "Compendium Already Exists",
      content: `<p>A compendium named "${targetLabel}" already exists.</p><p>Do you want to delete it and create a fresh one?</p>`,
      yes: () => true,
      no: () => false
    });
    
    if (!proceed) {
      throw new Error("Operation cancelled");
    }
    
    await existingPack.deleteCompendium();
    ui.notifications.info(`Deleted existing "${targetLabel}" compendium`);
  }
  
  // Determine document type from pack name
  const documentTypeMap = {
    "weapons": "Item",
    "armour": "Item",
    "species": "Item",
    "magic": "Item",
    "equipment": "Item",
    "spirit-magic": "Item",
    "divine-magic": "Item",
    "sorcery": "Item"
  };
  
  const documentType = documentTypeMap[packName] || "Item";
  
  // Create new world compendium
  ui.notifications.info(`Creating "${targetLabel}" compendium with folders...`);
  const target = await CompendiumCollection.createCompendium({
    label: targetLabel,
    type: documentType,
    package: "world"
  });
  
  // Group items by folder
  const itemsByFolder = {};
  const itemsWithoutFolder = [];
  
  for (const [itemKey, itemInfo] of Object.entries(data)) {
    let folderName = itemInfo.folder;
    
    // If no folder specified, try to determine from item data
    if (!folderName) {
      const itemData = itemInfo.data;
      const system = itemData?.system || {};
      
      switch (packName) {
        case "weapons":
          if (system.weaponType) {
            folderName = getFolderForWeaponType(system.weaponType);
          }
          break;
        case "armour":
          if (system.armorType) {
            folderName = getFolderForArmorType(system.armorType);
          }
          break;
        case "magic":
          // For unified magic compendium, use simple folders (no subfolders)
          folderName = getFolderForSpell(itemData, true);
          break;
        case "spirit-magic":
        case "divine-magic":
        case "sorcery":
          folderName = getFolderForSpell(itemData);
          break;
        case "species":
          folderName = getFolderForSpecies(itemData);
          break;
        case "equipment":
          // Equipment can be organized by type if needed
          // For now, no automatic folder assignment
          break;
      }
    }
    
    if (folderName) {
      if (!itemsByFolder[folderName]) {
        itemsByFolder[folderName] = [];
      }
      itemsByFolder[folderName].push(itemInfo);
    } else {
      itemsWithoutFolder.push(itemInfo);
    }
  }
  
  // Create folders and import items
  const folderMap = {};
  let totalImported = 0;
  
  // Sort folders by armor points for armor compendium (increasing protection order)
  let sortedFolderNames = Object.keys(itemsByFolder);
  if (packName === "armour") {
    sortedFolderNames = sortedFolderNames.sort((a, b) => {
      const apA = getArmorPointsForFolder(a);
      const apB = getArmorPointsForFolder(b);
      // If same armor points, sort alphabetically
      if (apA === apB) {
        return a.localeCompare(b);
      }
      return apA - apB;
    });
  } else {
    // For other compendiums, sort alphabetically
    sortedFolderNames = sortedFolderNames.sort();
  }
  
  // Create folders first in sorted order
  for (const folderName of sortedFolderNames) {
    const folder = await Folder.create({
      name: folderName,
      type: documentType,
      folder: null,
      sorting: 'a',
      color: null
    }, { pack: target.collection });
    
    folderMap[folderName] = folder.id;
    console.log(`RQ3 | Created folder "${folderName}"`);
  }
  
  // Import items into folders (using sorted order for armor compendium)
  for (const folderName of sortedFolderNames) {
    const items = itemsByFolder[folderName];
    if (!items) continue;
    
    const folderId = folderMap[folderName];
    
    for (const itemInfo of items) {
      try {
        const itemData = foundry.utils.deepClone(itemInfo.data);
        if (!itemData || !itemData.name) {
          console.warn(`RQ3 | Skipping item with missing data:`, itemInfo);
          continue;
        }
        const item = await target.documentClass.create(itemData, { pack: target.collection });
        
        // Assign to folder
        if (folderId) {
          await item.update({ folder: folderId });
        }
        
        totalImported++;
      } catch (error) {
        console.error(`RQ3 | Failed to import item ${itemInfo.data?.name || 'unknown'}:`, error);
        console.error(`RQ3 | Item data:`, itemInfo);
      }
    }
    
    console.log(`RQ3 | Imported ${items.length} items into folder "${folderName}"`);
  }
  
  // Import items without folders
  for (const itemInfo of itemsWithoutFolder) {
    try {
      const itemData = foundry.utils.deepClone(itemInfo.data);
      if (!itemData || !itemData.name) {
        console.warn(`RQ3 | Skipping item with missing data:`, itemInfo);
        continue;
      }
      await target.documentClass.create(itemData, { pack: target.collection });
      totalImported++;
    } catch (error) {
      console.error(`RQ3 | Failed to import item ${itemInfo.data?.name || 'unknown'}:`, error);
      console.error(`RQ3 | Item data:`, itemInfo);
    }
  }
  
  // Compendiums are created unlocked by default
  // To lock a compendium, right-click it in the Compendium Packs sidebar and select "Toggle Edit Lock"
  
  // Set armor compendium to manual sorting
  if (packName === "armour") {
    try {
      const metadata = target.metadata;
      metadata.sorting = "m"; // 'm' = manual sorting
      await target.updateMetadata(metadata);
      console.log(`RQ3 | Set "${targetLabel}" to manual sorting`);
    } catch (error) {
      console.warn(`RQ3 | Could not set sorting mode for "${targetLabel}":`, error);
    }
  }
  
  ui.notifications.info(`Created "${targetLabel}" with ${totalImported} items in ${Object.keys(folderMap).length} folders!`);
  console.log(`RQ3 | Compendium created: ${totalImported} items, ${Object.keys(folderMap).length} folders`);
  
  return target;
}

/**
 * Auto-create world compendiums with folders for all packs
 * @param {boolean} skipExisting - If true, skip packs that already exist
 * @param {boolean} forceRecreate - If true, delete and recreate existing compendiums
 * @returns {Promise<void>}
 */
export async function autoCreateWorldCompendiums(skipExisting = true, forceRecreate = false) {
  if (!game.user.isGM) {
    console.warn("RQ3 | Only GMs can create world compendiums");
    return;
  }
  
  const packs = [
    { name: "weapons", label: "Weapons" },
    { name: "armour", label: "Armour" },
    { name: "species", label: "Species" },
    { name: "magic", label: "Magic" },
    { name: "equipment", label: "Equipment" }
  ];
  
  const { loadCompendiumData } = await import("./data-loader.mjs");
  
  let created = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const pack of packs) {
    try {
      // Check if compendium already exists (both new and old "(Organized)" versions)
      const existing = game.packs.find(p => p.metadata.label === pack.label);
      const existingOld = game.packs.find(p => p.metadata.label === `${pack.label} (Organized)`);
      
      // Delete old "(Organized)" version if it exists
      if (existingOld) {
        try {
          await existingOld.deleteCompendium();
          console.log(`RQ3 | Deleted old "${pack.label} (Organized)" compendium`);
        } catch (error) {
          console.warn(`RQ3 | Could not delete old "${pack.label} (Organized)":`, error);
        }
      }
      
      if (existing) {
        if (forceRecreate) {
          // Delete existing compendium before recreating
          console.log(`RQ3 | Deleting existing ${pack.label} for recreation...`);
          await existing.deleteCompendium();
          ui.notifications.info(`Deleted ${pack.label} for recreation`);
        } else if (skipExisting) {
          console.log(`RQ3 | Skipping ${pack.label} - already exists`);
          skipped++;
          continue;
        } else {
          // Skip but don't count as skipped (user wants to keep existing)
          continue;
        }
      }
      
      // Try to load JSON data
      try {
        const data = await loadCompendiumData(pack.name);
        
        if (!data || Object.keys(data).length === 0) {
          console.warn(`RQ3 | No data found for ${pack.name}, skipping`);
          skipped++;
          continue;
        }
        
        console.log(`RQ3 | Loaded ${Object.keys(data).length} items for ${pack.name}`);
        await createCompendiumWithFolders(pack.name, pack.label, data);
        created++;
      } catch (loadError) {
        // For equipment, it's okay if the file doesn't exist yet
        if (pack.name === "equipment" && loadError.message?.includes("Not Found")) {
          console.log(`RQ3 | Equipment JSON file not found, skipping (this is normal if equipment data hasn't been created yet)`);
          skipped++;
          continue;
        }
        console.warn(`RQ3 | Could not load data for ${pack.name}:`, loadError);
        skipped++;
      }
    } catch (error) {
      console.error(`RQ3 | Error creating ${pack.label}:`, error);
      errors++;
    }
  }
  
  if (created > 0) {
    ui.notifications.info(`RQ3: Created ${created} organized compendium${created !== 1 ? 's' : ''} with folders!`);
  }
  
  if (skipped > 0) {
    console.log(`RQ3 | Auto-creation complete: ${created} created, ${skipped} skipped, ${errors} errors`);
  }
}

/**
 * Quick command to regenerate all organized compendiums
 * Deletes existing compendiums and recreates them fresh
 * Usage: game.rq3.regenerateAllCompendiums()
 */
export async function regenerateAllCompendiums() {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can regenerate compendiums!");
    return;
  }
  
  const proceed = await Dialog.confirm({
    title: "Regenerate All Compendiums",
    content: `<div style="margin-bottom: 1em;">
                <p><strong>This will regenerate all world compendiums from JSON source data:</strong></p>
                <ul>
                  <li>Weapons</li>
                  <li>Armour</li>
                  <li>Species</li>
                  <li>Magic</li>
                  <li>Equipment</li>
                </ul>
              </div>
              <div style="background: #ffe4b5; border: 1px solid #ffa500; border-radius: 4px; padding: 0.75em; margin-bottom: 1em;">
                <p style="margin: 0; font-weight: bold; color: #b8860b;">⚠️ Important:</p>
                <p style="margin: 0.5em 0 0 0;">Items found in JSON will be updated to match the source data. Any manual edits to these items will be overwritten.</p>
                <p style="margin: 0.5em 0 0 0;">Items NOT in JSON (manually added) will be preserved.</p>
              </div>
              <p style="margin: 0;"><strong>Do you want to proceed?</strong></p>`,
    yes: () => true,
    no: () => false,
    defaultYes: false
  });
  
  if (!proceed) {
    ui.notifications.info("Regeneration cancelled");
    return;
  }
  
  ui.notifications.info("Regenerating compendiums (preserving manually added items)...");
  
  // Use forceRecreate=false and skipExisting=false to merge/update instead of delete
  await regenerateCompendiumsWithMerge();
  
  ui.notifications.info("All compendiums regenerated!");
}

/**
 * Regenerate compendiums by merging with existing data
 * This preserves manually added items while updating items from JSON
 */
async function regenerateCompendiumsWithMerge() {
  if (!game.user.isGM) {
    console.warn("RQ3 | Only GMs can regenerate compendiums");
    return;
  }
  
  const packs = [
    { name: "weapons", label: "Weapons" },
    { name: "armour", label: "Armour" },
    { name: "species", label: "Species" },
    { name: "magic", label: "Magic" },
    { name: "equipment", label: "Equipment" }
  ];
  
  const { loadCompendiumData } = await import("./data-loader.mjs");
  
  let updated = 0;
  let added = 0;
  let preserved = 0;
  let errors = 0;
  
  for (const pack of packs) {
    try {
      // Find existing compendium
      const existing = game.packs.find(p => p.metadata.label === pack.label && p.metadata.package === "world");
      
      if (!existing) {
        // Compendium doesn't exist, create it fresh
        console.log(`RQ3 | Creating new ${pack.label} compendium...`);
        try {
          const data = await loadCompendiumData(pack.name);
          if (data && Object.keys(data).length > 0) {
            await createCompendiumWithFolders(pack.name, pack.label, data);
            added++;
          }
        } catch (loadError) {
          console.warn(`RQ3 | Could not load data for ${pack.name}:`, loadError);
          errors++;
        }
        continue;
      }
      
      // Load JSON data
      let jsonData;
      try {
        jsonData = await loadCompendiumData(pack.name);
        if (!jsonData || Object.keys(jsonData).length === 0) {
          console.warn(`RQ3 | No JSON data for ${pack.name}, skipping`);
          continue;
        }
      } catch (loadError) {
        console.warn(`RQ3 | Could not load JSON data for ${pack.name}:`, loadError);
        errors++;
        continue;
      }
      
      // Get existing items
      const existingItems = await existing.getDocuments();
      const existingItemsMap = new Map(existingItems.map(item => [item.name.toLowerCase(), item]));
      
      // Track items from JSON (to preserve items not in JSON)
      const jsonItemNames = new Set(
        Object.values(jsonData).map(itemInfo => itemInfo.data.name.toLowerCase())
      );
      
      // Update or add items from JSON
      for (const [itemKey, itemInfo] of Object.entries(jsonData)) {
        try {
          const itemData = foundry.utils.deepClone(itemInfo.data);
          const itemName = itemData.name.toLowerCase();
          const existingItem = existingItemsMap.get(itemName);
          
          if (existingItem) {
            // Update existing item
            await existingItem.update(itemData.system ? { system: itemData.system } : {});
            console.log(`RQ3 | Updated ${itemData.name} in ${pack.label}`);
            updated++;
          } else {
            // Add new item from JSON
            const newItem = await existing.documentClass.create(itemData, { pack: existing.collection });
            
            // Assign to folder if specified
            if (itemInfo.folder) {
              // Find or create folder
              let folder = existing.folders?.find(f => f.name === itemInfo.folder);
              if (!folder) {
                folder = await Folder.create({
                  name: itemInfo.folder,
                  type: "Item",
                  folder: null,
                  sorting: 'a',
                  color: null
                }, { pack: existing.collection });
              }
              if (folder) {
                await newItem.update({ folder: folder.id });
              }
            }
            
            console.log(`RQ3 | Added ${itemData.name} to ${pack.label}`);
            added++;
          }
        } catch (error) {
          console.error(`RQ3 | Error processing ${itemInfo.data?.name || itemKey}:`, error);
          errors++;
        }
      }
      
      // Count preserved items (items not in JSON)
      const preservedItems = existingItems.filter(item => !jsonItemNames.has(item.name.toLowerCase()));
      preserved += preservedItems.length;
      if (preservedItems.length > 0) {
        console.log(`RQ3 | Preserved ${preservedItems.length} manually added items in ${pack.label}`);
      }
      
    } catch (error) {
      console.error(`RQ3 | Error regenerating ${pack.label}:`, error);
      errors++;
    }
  }
  
  const message = `Regeneration complete: ${updated} updated, ${added} added, ${preserved} preserved${errors > 0 ? `, ${errors} errors` : ''}`;
  ui.notifications.info(message);
  console.log(`RQ3 | ${message}`);
}

/**
 * Test function to create a weapons compendium with folders from JSON
 * Usage: game.rq3.testFoldersFromJSON()
 */
export async function testFoldersFromJSON() {
  try {
    const { loadCompendiumData } = await import("./data-loader.mjs");
    const weaponsData = await loadCompendiumData("weapons");
    
    await createCompendiumWithFolders(
      "weapons",
      "Weapons (JSON with Folders)",
      weaponsData
    );
    
    ui.notifications.info("Test compendium created! Check the Compendium Packs sidebar.");
  } catch (error) {
    console.error("RQ3 | Error testing folders from JSON:", error);
    ui.notifications.error(`Failed to create test compendium: ${error.message}`);
  }
}

