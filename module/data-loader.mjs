/**
 * Data Loader for RuneQuest 3 Compendium Data
 * 
 * This module provides utilities for loading JSON data files,
 * following the Pathfinder 2e pattern of storing source data as JSON.
 * 
 * Supports both JSON files (new) and .mjs exports (legacy) for backward compatibility.
 */

/**
 * Load JSON data from a file path
 * @param {string} path - Path to the JSON file relative to the system root
 * @returns {Promise<Object>} The loaded JSON data
 */
export async function loadJSONData(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`RQ3 | Error loading JSON data from ${path}:`, error);
    throw error;
  }
}

/**
 * Load compendium data from JSON file
 * Supports the structure: { "itemKey": { version: "x.x.x", data: {...} }, ... }
 * 
 * @param {string} packName - Name of the pack (e.g., "weapons", "species")
 * @returns {Promise<Object>} The loaded data object
 */
export async function loadCompendiumData(packName) {
  const jsonPath = `systems/runequest3/packs/runequest3/data/${packName}.json`;
  
  try {
    const data = await loadJSONData(jsonPath);
    console.log(`RQ3 | Loaded ${packName} data from JSON: ${Object.keys(data).length} items`);
    return data;
  } catch (error) {
    // For equipment, if JSON doesn't exist, return empty object instead of trying .mjs fallback
    if (packName === "equipment" && error.message?.includes("Not Found")) {
      console.log(`RQ3 | Equipment JSON file not found, returning empty data`);
      return {};
    }
    console.warn(`RQ3 | Failed to load ${packName} from JSON, falling back to .mjs import`);
    // Fallback to .mjs import for backward compatibility
    return await loadMJSData(packName);
  }
}

/**
 * Load data from .mjs module (legacy support)
 * @param {string} packName - Name of the pack
 * @returns {Promise<Object>} The loaded data object
 */
async function loadMJSData(packName) {
  const moduleMap = {
    "weapons": () => import("./rq3-weapons-data.mjs").then(m => m.RQ3_WEAPONS_DATA),
    "armour": () => import("./rq3-armour-data.mjs").then(m => m.RQ3_ARMOUR_DATA),
    "species": () => import("./rq3-species-data.mjs").then(m => m.RQ3_SPECIES_DATA),
    "spirit-magic": () => import("./rq3-spirit-magic-data.mjs").then(m => m.RQ3_SPIRIT_MAGIC_DATA),
    "divine-magic": () => import("./rq3-divine-magic-data.mjs").then(m => m.RQ3_DIVINE_MAGIC_DATA),
    "sorcery": () => import("./rq3-sorcery-data.mjs").then(m => m.RQ3_SORCERY_DATA),
    "magic": async () => {
      // Combine all magic types for the unified magic compendium
      const [spirit, divine, sorcery] = await Promise.all([
        import("./rq3-spirit-magic-data.mjs").then(m => m.RQ3_SPIRIT_MAGIC_DATA),
        import("./rq3-divine-magic-data.mjs").then(m => m.RQ3_DIVINE_MAGIC_DATA),
        import("./rq3-sorcery-data.mjs").then(m => m.RQ3_SORCERY_DATA)
      ]);
      return { ...spirit, ...divine, ...sorcery };
    }
  };
  
  const loader = moduleMap[packName];
  if (!loader) {
    throw new Error(`No data loader found for pack: ${packName}`);
  }
  
  return await loader();
}

/**
 * Preload all compendium data (for performance optimization)
 * @returns {Promise<Object>} Object containing all loaded data
 */
export async function preloadAllData() {
  const packs = ["weapons", "armour", "species", "magic", "equipment"];
  const data = {};
  
  for (const pack of packs) {
    try {
      data[pack] = await loadCompendiumData(pack);
    } catch (error) {
      console.error(`RQ3 | Failed to preload ${pack}:`, error);
    }
  }
  
  return data;
}

