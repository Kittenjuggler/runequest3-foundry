/**
 * Data Converter Utility
 * 
 * Converts .mjs data files to JSON format with folder assignments
 * Usage: game.rq3.convertDataToJSON('weapons')
 */

import { RQ3_WEAPONS_DATA } from "./rq3-weapons-data.mjs";
import { RQ3_ARMOUR_DATA } from "./rq3-armour-data.mjs";
import { RQ3_SPECIES_DATA } from "./rq3-species-data.mjs";
import { RQ3_SPIRIT_MAGIC_DATA } from "./rq3-spirit-magic-data.mjs";
import { RQ3_DIVINE_MAGIC_DATA } from "./rq3-divine-magic-data.mjs";
import { RQ3_SORCERY_DATA } from "./rq3-sorcery-data.mjs";

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
 * Get folder for armour based on armorType
 */
function getArmorFolder(armorType) {
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
    'bronze': 'Bronze'
  };
  if (!typeMap[armorType]) {
    return armorType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return typeMap[armorType] || 'Other';
}

/**
 * Convert weapons data to JSON format
 */
export function convertWeaponsData() {
  const result = {};
  for (const [key, value] of Object.entries(RQ3_WEAPONS_DATA)) {
    const weaponType = value.data?.system?.weaponType;
    const folder = weaponType ? getWeaponFolder(weaponType) : 'Other';
    result[key] = {
      version: value.version,
      folder: folder,
      data: value.data
    };
  }
  return result;
}

/**
 * Convert armour data to JSON format
 */
export function convertArmourData() {
  const result = {};
  for (const [key, value] of Object.entries(RQ3_ARMOUR_DATA)) {
    const armorType = value.data?.system?.armorType;
    const folder = armorType ? getArmorFolder(armorType) : 'Other';
    result[key] = {
      version: value.version,
      folder: folder,
      data: value.data
    };
  }
  return result;
}

/**
 * Convert species data to JSON format
 */
export function convertSpeciesData() {
  const result = {};
  for (const [key, value] of Object.entries(RQ3_SPECIES_DATA)) {
    const type = value.data?.system?.type || 'Other';
    const folder = type.charAt(0).toUpperCase() + type.slice(1);
    result[key] = {
      version: value.version,
      folder: folder,
      data: value.data
    };
  }
  return result;
}

/**
 * Convert magic data to JSON format (combined)
 */
export function convertMagicData() {
  const result = {};
  
  // Spirit Magic
  for (const [key, value] of Object.entries(RQ3_SPIRIT_MAGIC_DATA)) {
    result[key] = {
      version: value.version,
      folder: 'Spirit Magic',
      data: value.data
    };
  }
  
  // Divine Magic
  for (const [key, value] of Object.entries(RQ3_DIVINE_MAGIC_DATA)) {
    result[key] = {
      version: value.version,
      folder: 'Divine Magic',
      data: value.data
    };
  }
  
  // Sorcery
  for (const [key, value] of Object.entries(RQ3_SORCERY_DATA)) {
    result[key] = {
      version: value.version,
      folder: 'Sorcery',
      data: value.data
    };
  }
  
  return result;
}

/**
 * Export all data as JSON strings (for copying to files)
 */
export function exportAllDataAsJSON() {
  return {
    weapons: JSON.stringify(convertWeaponsData(), null, 2),
    armour: JSON.stringify(convertArmourData(), null, 2),
    species: JSON.stringify(convertSpeciesData(), null, 2),
    magic: JSON.stringify(convertMagicData(), null, 2)
  };
}

