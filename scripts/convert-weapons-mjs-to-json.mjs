/**
 * Convert rq3-weapons-data.mjs to weapons.json format
 * 
 * Run this in Foundry console:
 * const script = await import("./scripts/convert-weapons-mjs-to-json.mjs");
 * await script.convertWeaponsToJSON();
 */

import { RQ3_WEAPONS_DATA } from "../module/rq3-weapons-data.mjs";

/**
 * Get folder for weapon based on weaponType
 */
function getWeaponFolder(weaponType) {
  const skillMap = {
    'axe': 'Blade',
    'hammer': 'Blade',
    'dagger': 'Close Combat',
    'fist': 'Close Combat',
    'mace': 'Blunt',
    'club': 'Blunt',
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
    'net': 'Net'
  };
  return skillMap[weaponType] || 'Other';
}

/**
 * Convert a single weapon from .mjs format to .json format
 */
function convertWeapon(key, weaponData) {
  const { version, data } = weaponData;
  const { name, type, img, system } = data;
  
  // Get folder from weaponType
  const folder = getWeaponFolder(system.weaponType);
  
  // Convert price format
  const price = {
    value: system.price || 0,
    currency: "lunars"
  };
  
  // Convert melee1Handed if it exists
  const melee1Handed = system.melee1Handed?.enabled ? {
    enabled: true,
    damage: system.melee1Handed.damage || "1d6",
    baseSkill: system.melee1Handed.baseSkill || 0,
    armor: system.melee1Handed.armor || 0,
    strikeRank: system.melee1Handed.strikeRank || 0,
    impale: system.melee1Handed.impale || false,
    strengthRequirement: system.melee1Handed.minStrength || 0,
    dexterityRequirement: system.melee1Handed.minDexterity || 0
  } : {
    enabled: false,
    damage: "1d6",
    strengthRequirement: 10,
    dexterityRequirement: 10,
    baseSkill: 0,
    armor: 0,
    strikeRank: 0,
    impale: false
  };
  
  // Convert melee2Handed if it exists
  const melee2Handed = system.melee2Handed?.enabled ? {
    enabled: true,
    damage: system.melee2Handed.damage || "1d6",
    baseSkill: system.melee2Handed.baseSkill || 0,
    armor: system.melee2Handed.armor || 0,
    strikeRank: system.melee2Handed.strikeRank || 0,
    impale: system.melee2Handed.impale || false,
    strengthRequirement: system.melee2Handed.minStrength || 0,
    dexterityRequirement: system.melee2Handed.minDexterity || 0
  } : {
    enabled: false,
    damage: "1d6",
    strengthRequirement: 10,
    dexterityRequirement: 10,
    baseSkill: 0,
    armor: 0,
    strikeRank: 0,
    impale: false
  };
  
  // Convert rangedAttack if it exists
  const rangedAttack = system.rangedAttack?.enabled ? {
    enabled: true,
    damage: system.rangedAttack.damage || "1d6",
    strengthRequirement: system.rangedAttack.minStrength || 0,
    dexterityRequirement: system.rangedAttack.minDexterity || 0,
    baseSkill: system.rangedAttack.baseSkill || 0,
    armor: system.rangedAttack.armor || 0,
    strikeRank: system.rangedAttack.strikeRank || 0,
    deadlyBlow: system.rangedAttack.deadlyBlow || false,
    impale: system.rangedAttack.impale || false,
    minRange: system.rangedAttack.minRange || 0,
    maxRange: system.rangedAttack.maxRange || 0,
    rof: system.rangedAttack.rof || 0
  } : {
    enabled: false,
    damage: "1d6",
    strengthRequirement: 10,
    dexterityRequirement: 10,
    baseSkill: 0,
    armor: 0,
    strikeRank: 0,
    deadlyBlow: false,
    impale: false,
    minRange: 0,
    maxRange: 0,
    rof: 0
  };
  
  return {
    version,
    folder,
    data: {
      name,
      type,
      img,
      system: {
        weaponType: system.weaponType,
        quantity: system.quantity || 1,
        price,
        encumbrance: system.encumbrance || 0,
        melee1Handed,
        melee2Handed,
        rangedAttack,
        description: system.description || "",
        weight: 0,
        equipped: false,
        storageLocation: "carried",
        containerId: "",
        category: rangedAttack.enabled ? "ranged" : "melee",
        hands: melee1Handed.enabled && melee2Handed.enabled ? "1-2-handed" : 
               melee1Handed.enabled ? "1-handed" : "2-handed",
        damage: "1d6",
        strengthRequirement: 10,
        dexterityRequirement: 10,
        baseSkill: 0,
        armor: 0,
        strikeRank: 0,
        ap: 0,
        hp: 8,
        reach: 1,
        parry: 0,
        ranged: {
          isRanged: rangedAttack.enabled,
          range: rangedAttack.maxRange || 0
        }
      }
    }
  };
}

/**
 * Convert all weapons and download as JSON
 */
export async function convertWeaponsToJSON() {
  console.log("RQ3 | Converting weapons from .mjs to .json format...");
  
  const converted = {};
  let count = 0;
  
  for (const [key, weaponData] of Object.entries(RQ3_WEAPONS_DATA)) {
    converted[key] = convertWeapon(key, weaponData);
    count++;
  }
  
  const jsonString = JSON.stringify(converted, null, 2);
  
  // Download the file
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'weapons.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log(`RQ3 | Converted ${count} weapons to JSON format`);
  ui.notifications.info(`Converted ${count} weapons - check your downloads folder for weapons.json`);
  
  return converted;
}

