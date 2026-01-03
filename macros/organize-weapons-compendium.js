/**
 * RQ3 Organize Weapons Compendium Macro
 * 
 * This macro creates a new world-level compendium called "Weapons (Organized)"
 * and copies all weapons from the system compendium, organizing them into folders by skill.
 * 
 * Usage: Run this macro as a GM to create an organized, editable weapons compendium.
 */

(async () => {
  const sourcePackId = "runequest3.weapons";
  const targetPackName = "Weapons (Organized)";
  
  // Check if user is GM
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can run this macro!");
    return;
  }
  
  // Get source compendium
  const source = game.packs.get(sourcePackId);
  if (!source) {
    ui.notifications.error("RQ3 Weapons compendium not found!");
    return;
  }
  
  // Check if target already exists
  const existingPack = game.packs.find(p => p.metadata.label === targetPackName);
  if (existingPack) {
    const proceed = await Dialog.confirm({
      title: "Compendium Already Exists",
      content: `<p>A compendium named "${targetPackName}" already exists.</p><p>Do you want to delete it and create a fresh one?</p>`,
      yes: () => true,
      no: () => false
    });
    
    if (!proceed) {
      ui.notifications.info("Operation cancelled");
      return;
    }
    
    // Delete existing compendium
    await existingPack.deleteCompendium();
    ui.notifications.info(`Deleted existing "${targetPackName}" compendium`);
  }
  
  // Create new world compendium
  ui.notifications.info("Creating organized weapons compendium...");
  const target = await CompendiumCollection.createCompendium({
    label: targetPackName,
    type: source.documentName,
    package: "world"
  });
  
  // Skill name mapping
  const skillDisplayNames = {
    'blade': 'Blade',
    'close': 'Close Combat',
    'blunt': 'Blunt',
    'shield': 'Shield',
    'spear': 'Spear',
    'sword': 'Sword',
    'tools': 'Tools',
    'bow': 'Bow',
    'crossbow': 'Crossbow',
    'dart': 'Dart',
    'sling': 'Sling',
    'staffSling': 'Staff Sling',
    'rock': 'Rock',
    'club': 'Club',
    'net': 'Net'
  };
  
  // Get all weapons from source
  const weapons = await source.getDocuments();
  
  // Group weapons by skill
  const weaponsBySkill = {};
  for (const weapon of weapons) {
    const weaponType = weapon.system?.weaponType;
    if (!weaponType) continue;
    
    // Use the same logic as the system to determine skill
    const skill = CONFIG.RQ3.Actor?.getAttackSkillForWeaponType?.(weaponType) || 'other';
    
    if (!weaponsBySkill[skill]) {
      weaponsBySkill[skill] = [];
    }
    weaponsBySkill[skill].push(weapon);
  }
  
  // Create folders and import weapons
  const skillFolders = {};
  let totalImported = 0;
  
  for (const [skill, skillWeapons] of Object.entries(weaponsBySkill)) {
    const folderName = skillDisplayNames[skill] || skill.charAt(0).toUpperCase() + skill.slice(1);
    
    // Create folder
    const folder = await Folder.create({
      name: folderName,
      type: 'Item',
      folder: null,
      sorting: 'a',
      color: null
    }, { pack: target.collection });
    
    skillFolders[skill] = folder.id;
    
    // Import weapons into this folder
    for (const weapon of skillWeapons) {
      await target.importDocument(weapon);
      
      // Get the imported weapon and assign it to the folder
      const importedWeapons = await target.getDocuments();
      const importedWeapon = importedWeapons.find(w => w.name === weapon.name);
      if (importedWeapon) {
        await importedWeapon.update({ folder: folder.id });
      }
      
      totalImported++;
    }
    
    console.log(`RQ3 | Created folder "${folderName}" with ${skillWeapons.length} weapons`);
  }
  
  ui.notifications.info(`Created "${targetPackName}" with ${totalImported} weapons organized into ${Object.keys(skillFolders).length} folders!`);
  console.log(`RQ3 | Organized weapons compendium created successfully`);
  
})();




