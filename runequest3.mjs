// Import document classes
import { RQ3Actor, RQ3Item } from "./module/documents.mjs";

// Import sheet classes
import { RQ3CharacterSheet, RQ3NPCSheet, RQ3CreatureSheet } from "./module/actor-sheets.mjs";
import { RQ3ItemSheet } from "./module/item-sheets.mjs";

// Import data models
import { 
  CharacterDataModel, 
  NPCDataModel, 
  CreatureDataModel,
  WeaponDataModel,
  ArmorDataModel,
  SkillDataModel,
  SpellDataModel,
  RuneDataModel,
  EquipmentDataModel,
  SpeciesDataModel
} from "./module/data-models.mjs";

// Import skills data
import { RQ3_SKILLS, getAllSkills, getSkillsByCategory, getSkillById } from "./module/rq3-skills-data.mjs";

// Species data is now loaded from JSON via data-loader.mjs

// Import JSON data loader (supports both JSON and .mjs fallback)
import { loadCompendiumData } from "./module/data-loader.mjs";

// Performance optimization: Lazy loading for large data structures
let _skillsDataLoaded = false;
let _speciesDataLoaded = false;
let _magicDataLoaded = false;
let _equipmentDataLoaded = false;

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once("init", function() {
  console.log("RQ3 | Initializing RuneQuest 3rd Edition System");
  
  // Initialize global RQ3 namespace for system data
  game.rq3 = game.rq3 || {};
  game.rq3.lastOpenedCompendium = null;

  // Assign custom document classes
  CONFIG.Actor.documentClass = RQ3Actor;
  CONFIG.Item.documentClass = RQ3Item;

  // Register data models
  CONFIG.Actor.dataModels = {
    character: CharacterDataModel,
    npc: NPCDataModel,
    creature: CreatureDataModel
  };

  CONFIG.Item.dataModels = {
    weapon: WeaponDataModel,
    armor: ArmorDataModel,
    skill: SkillDataModel,
    spell: SpellDataModel,
    rune: RuneDataModel,
    equipment: EquipmentDataModel,
    species: SpeciesDataModel
  };

  // Debug: Log registered item types
  console.log("RQ3 | Registered Item Types:", Object.keys(CONFIG.Item.dataModels));
  console.log("RQ3 | SpeciesDataModel loaded:", SpeciesDataModel);

  // Configure RQ3 system constants
  CONFIG.RQ3 = {
    characteristics: {
      str: "RQ3.Characteristics.str",
      con: "RQ3.Characteristics.con",
      siz: "RQ3.Characteristics.siz",
      int: "RQ3.Characteristics.int",
      pow: "RQ3.Characteristics.pow",
      dex: "RQ3.Characteristics.dex",
      app: "RQ3.Characteristics.app",
      luck: "RQ3.Characteristics.luck"
    },
    weaponTypes: {
      "axe": "RQ3.WeaponTypes.axe",
      "hammer": "RQ3.WeaponTypes.hammer",
      "dagger": "RQ3.WeaponTypes.dagger",
      "fist": "RQ3.WeaponTypes.fist",
      "mace": "RQ3.WeaponTypes.mace",
      "shield": "RQ3.WeaponTypes.shield",
      "spear": "RQ3.WeaponTypes.spear",
      "javelin": "RQ3.WeaponTypes.javelin",
      "sword": "RQ3.WeaponTypes.sword",
      "tool": "RQ3.WeaponTypes.tool",
      "bow": "RQ3.WeaponTypes.bow",
      "crossbow": "RQ3.WeaponTypes.crossbow",
      "dart": "RQ3.WeaponTypes.dart",
      "sling": "RQ3.WeaponTypes.sling",
      "staff-sling": "RQ3.WeaponTypes.staff-sling",
      "rock": "RQ3.WeaponTypes.rock",
      "club": "RQ3.WeaponTypes.club",
      "net": "RQ3.WeaponTypes.net"
    },
    weaponCategories: {
      "melee": "RQ3.WeaponCategories.melee",
      "ranged": "RQ3.WeaponCategories.ranged",
      "thrown": "RQ3.WeaponCategories.thrown",
      "siege": "RQ3.WeaponCategories.siege"
    },
    weaponHands: {
      "1-handed": "RQ3.WeaponHands.1-handed",
      "2-handed": "RQ3.WeaponHands.2-handed",
      "1-or-2-handed": "RQ3.WeaponHands.1-or-2-handed"
    },
    armorTypes: {
      "clothes": "RQ3.ArmorTypes.clothes",
      "soft-leather": "RQ3.ArmorTypes.soft-leather",
      "stiff-leather": "RQ3.ArmorTypes.stiff-leather",
      "cuirbouilli": "RQ3.ArmorTypes.cuirbouilli",
      "bezainted": "RQ3.ArmorTypes.bezainted",
      "ringmail": "RQ3.ArmorTypes.ringmail",
      "lamellar": "RQ3.ArmorTypes.lamellar",
      "scale": "RQ3.ArmorTypes.scale",
      "chainmail": "RQ3.ArmorTypes.chainmail",
      "brigandine": "RQ3.ArmorTypes.brigandine",
      "plate": "RQ3.ArmorTypes.plate",
      "shield": "RQ3.ArmorTypes.shield"
    },
    // Official RQ3 Armor Statistics Table
    armorStats: {
      "clothes": {
        armorPoints: 0,
        costPerENC: 0, // varies
        encumbrance: {
          small: 2.0,    // SIZ 6-10
          medium: 2.5,   // SIZ 11-15
          large: 3.0,    // SIZ 16-20
          troll: 3.5     // SIZ 21-25
        }
      },
      "soft-leather": {
        armorPoints: 1,
        costPerENC: 20,
        encumbrance: {
          small: 3.0,
          medium: 3.5,
          large: 4.0,
          troll: 5.0
        }
      },
      "stiff-leather": {
        armorPoints: 2,
        costPerENC: 20,
        encumbrance: {
          small: 4.0,
          medium: 5.0,
          large: 6.0,
          troll: 7.0
        }
      },
      "cuirbouilli": {
        armorPoints: 3,
        costPerENC: 45,
        encumbrance: {
          small: 4.0,
          medium: 5.0,
          large: 6.0,
          troll: 7.0
        }
      },
      "bezainted": {
        armorPoints: 4,
        costPerENC: 70,
        encumbrance: {
          small: 6.0,
          medium: 7.5,
          large: 9.0,
          troll: 10.5
        }
      },
      "ringmail": {
        armorPoints: 5,
        costPerENC: 110,
        encumbrance: {
          small: 8.0,
          medium: 10.0,
          large: 12.0,
          troll: 14.0
        }
      },
      "lamellar": {
        armorPoints: 6,
        costPerENC: 200,
        encumbrance: {
          small: 14.0,
          medium: 18.0,
          large: 21.5,
          troll: 25.0
        }
      },
      "scale": {
        armorPoints: 6,
        costPerENC: 120,
        encumbrance: {
          small: 16.0,
          medium: 20.0,
          large: 24.0,
          troll: 28.0
        }
      },
      "chainmail": {
        armorPoints: 7,
        costPerENC: 240,
        encumbrance: {
          small: 16.0,
          medium: 20.0,
          large: 24.0,
          troll: 28.0
        }
      },
      "brigandine": {
        armorPoints: 7,
        costPerENC: 200,
        encumbrance: {
          small: 17.5,
          medium: 22.0,
          large: 26.5,
          troll: 31.0
        }
      },
      "plate": {
        armorPoints: 8,
        costPerENC: 270,
        encumbrance: {
          small: 20.0,
          medium: 25.0,
          large: 30.0,
          troll: 35.0
        }
      },
      "shield": {
        armorPoints: 0, // Variable, shields have their own HP
        costPerENC: 50, // Estimate for shields
        encumbrance: {
          small: 1.0,
          medium: 1.5,
          large: 2.0,
          troll: 2.5
        }
      }
    },
    skillCategories: {
      "agility": "RQ3.SkillCategories.agility",
      "communication": "RQ3.SkillCategories.communication",
      "knowledge": "RQ3.SkillCategories.knowledge",
      "manipulation": "RQ3.SkillCategories.manipulation",
      "perception": "RQ3.SkillCategories.perception",
      "stealth": "RQ3.SkillCategories.stealth",
      "weapon": "RQ3.SkillCategories.weapon"
    },
    skills: RQ3_SKILLS,
    skillsData: {
      getAllSkills,
      getSkillsByCategory,
      getSkillById
    },
    spellTypes: {
      "spirit": "RQ3.SpellTypes.spirit",
      "divine": "RQ3.SpellTypes.divine",
      "sorcery": "RQ3.SpellTypes.sorcery"
    },
    runeTypes: {
      "elemental": "RQ3.RuneTypes.elemental",
      "power": "RQ3.RuneTypes.power",
      "form": "RQ3.RuneTypes.form",
      "condition": "RQ3.RuneTypes.condition"
    },
    equipmentTypes: {
      "tool": "RQ3.EquipmentTypes.tool",
      "container": "RQ3.EquipmentTypes.container",
      "treasure": "RQ3.EquipmentTypes.treasure",
      "consumable": "RQ3.EquipmentTypes.consumable",
      "misc": "RQ3.EquipmentTypes.misc"
    }
  };

  // Utility functions for armor calculations
  CONFIG.RQ3.getCharacterSizeCategory = function(siz) {
    if (siz >= 6 && siz <= 10) return "small";
    if (siz >= 11 && siz <= 15) return "medium";
    if (siz >= 16 && siz <= 20) return "large";
    if (siz >= 21 && siz <= 25) return "troll";
    // Default for out of range values
    if (siz < 6) return "small";
    return "troll";
  };

  // Hit location ENC percentages from official RQ3 table
  CONFIG.RQ3.hitLocationENC = {
    head: 0.1,      // 1/10 = 10%
    leftArm: 0.1,   // 1/10 = 10%
    rightArm: 0.1,  // 1/10 = 10%
    chest: 0.2,     // 2/10 = 20%
    abdomen: 0.1,   // 1/10 = 10%
    leftLeg: 0.2,   // 2/10 = 20%
    rightLeg: 0.2   // 2/10 = 20%
  };

  // Armor location to hit location mapping
  CONFIG.RQ3.armorLocationMapping = {
    // New simplified system
    "head": { head: true },
    "chest": { chest: true },
    "arm": {}, // Special: protects only the slot it's equipped in
    "abdomen": { abdomen: true },
    "leg": {}, // Special: protects only the slot it's equipped in
    
    // Legacy support for existing armor items
    "head-only": { head: true },
    "torso-arms": { chest: true, abdomen: true, leftArm: true, rightArm: true },
    "torso-only": { chest: true, abdomen: true },
    "chest-only": { chest: true },
    "abdomen-only": { abdomen: true },
    "arms-only": { leftArm: true, rightArm: true },
    "left-arm-only": { leftArm: true },
    "right-arm-only": { rightArm: true },
    "legs-only": { leftLeg: true, rightLeg: true },
    "left-leg-only": { leftLeg: true },
    "right-leg-only": { rightLeg: true },
    "full-suit": { head: true, leftArm: true, rightArm: true, chest: true, abdomen: true, leftLeg: true, rightLeg: true },
    "custom": {} // No automatic mapping
  };

  // Function to populate armor hit locations based on armor type and location
  CONFIG.RQ3.populateArmorHitLocations = function(armorType, armorLocation, equippedSlot = null) {
    const armorStats = CONFIG.RQ3.armorStats[armorType];
    const locationMapping = CONFIG.RQ3.armorLocationMapping[armorLocation];
    
    if (!armorStats) {
      return { head: 0, leftArm: 0, rightArm: 0, chest: 0, abdomen: 0, leftLeg: 0, rightLeg: 0 };
    }

    const armorPoints = armorStats.armorPoints;
    const hitLocations = { head: 0, leftArm: 0, rightArm: 0, chest: 0, abdomen: 0, leftLeg: 0, rightLeg: 0 };
    
    // Handle special cases for single arm/leg armor
    if (armorLocation === "arm" && equippedSlot) {
      if (equippedSlot === "leftArm") {
        hitLocations.leftArm = armorPoints;
      } else if (equippedSlot === "rightArm") {
        hitLocations.rightArm = armorPoints;
      }
    } else if (armorLocation === "leg" && equippedSlot) {
      if (equippedSlot === "leftLeg") {
        hitLocations.leftLeg = armorPoints;
      } else if (equippedSlot === "rightLeg") {
        hitLocations.rightLeg = armorPoints;
      }
    } else if (locationMapping) {
      // Standard mapping for other armor types
      Object.keys(hitLocations).forEach(location => {
        hitLocations[location] = locationMapping[location] ? armorPoints : 0;
      });
    }
    
    return hitLocations;
  };

  // Function to calculate total coverage percentage for a location selection
  CONFIG.RQ3.calculateCoveragePercentage = function(armorLocation) {
    const locationMapping = CONFIG.RQ3.armorLocationMapping[armorLocation];
    if (!locationMapping) return 0;
    
    let totalPercentage = 0;
    Object.keys(locationMapping).forEach(location => {
      if (locationMapping[location]) {
        totalPercentage += CONFIG.RQ3.hitLocationENC[location];
      }
    });
    
    return Math.round(totalPercentage * 100); // Convert to percentage
  };

  CONFIG.RQ3.calculateArmorProperties = function(armorType, characterSiz, hitLocations = null) {
    // Input validation
    if (!armorType || typeof armorType !== 'string') {
      console.warn('RQ3 | Invalid armor type provided:', armorType);
      return { armorPoints: 0, encumbrance: 0, cost: 0, hitLocationBreakdown: {} };
    }
    
    if (!characterSiz || typeof characterSiz !== 'number' || characterSiz < 1) {
      console.warn('RQ3 | Invalid character SIZ provided:', characterSiz);
      return { armorPoints: 0, encumbrance: 0, cost: 0, hitLocationBreakdown: {} };
    }
    
    const armorStats = CONFIG.RQ3.armorStats[armorType];
    if (!armorStats) {
      console.warn(`RQ3 | Unknown armor type: ${armorType}`);
      return { armorPoints: 0, encumbrance: 0, cost: 0, hitLocationBreakdown: {} };
    }

    const sizeCategory = CONFIG.RQ3.getCharacterSizeCategory(characterSiz);
    const fullSuitEncumbrance = armorStats.encumbrance[sizeCategory];
    
    // If hitLocations are provided, calculate ENC for specific locations
    let actualEncumbrance = 0;
    let hitLocationBreakdown = {};
    
    if (hitLocations) {
      // Calculate ENC based on which hit locations this armor covers
      for (const [location, armorValue] of Object.entries(hitLocations)) {
        if (armorValue > 0) {
          const locationENC = fullSuitEncumbrance * CONFIG.RQ3.hitLocationENC[location];
          actualEncumbrance += locationENC;
          hitLocationBreakdown[location] = {
            encumbrance: Math.round(locationENC * 100) / 100, // Round to 2 decimal places
            armorPoints: armorValue
          };
        }
      }
    } else {
      // Full suit
      actualEncumbrance = fullSuitEncumbrance;
      for (const location of Object.keys(CONFIG.RQ3.hitLocationENC)) {
        hitLocationBreakdown[location] = {
          encumbrance: Math.round(fullSuitEncumbrance * CONFIG.RQ3.hitLocationENC[location] * 100) / 100,
          armorPoints: armorStats.armorPoints
        };
      }
    }

    const cost = armorStats.costPerENC > 0 ? Math.round(armorStats.costPerENC * actualEncumbrance) : 0;

    return {
      armorPoints: armorStats.armorPoints,
      encumbrance: Math.round(actualEncumbrance * 100) / 100, // Round to 2 decimal places
      cost: cost,
      costPerENC: armorStats.costPerENC,
      hitLocationBreakdown: hitLocationBreakdown,
      fullSuitEncumbrance: fullSuitEncumbrance
    };
  };

  // Helper function to calculate armor properties for a specific piece
  CONFIG.RQ3.calculateArmorPieceProperties = function(armorType, characterSiz, hitLocations) {
    return CONFIG.RQ3.calculateArmorProperties(armorType, characterSiz, hitLocations);
  };

  // Function to calculate armor encumbrance based on type, location, and size
  CONFIG.RQ3.calculateArmorEncumbrance = function(armorType, armorLocation, sizeCategory) {
    // Input validation
    if (!armorType || typeof armorType !== 'string') {
      console.warn('RQ3 | Invalid armor type provided:', armorType);
      return 0;
    }
    
    if (!armorLocation || typeof armorLocation !== 'string') {
      console.warn('RQ3 | Invalid armor location provided:', armorLocation);
      return 0;
    }
    
    if (!sizeCategory || typeof sizeCategory !== 'string') {
      console.warn('RQ3 | Invalid size category provided:', sizeCategory);
      return 0;
    }
    
    const armorStats = CONFIG.RQ3.armorStats[armorType];
    const locationMapping = CONFIG.RQ3.armorLocationMapping[armorLocation];
    
    if (!armorStats || !locationMapping) return 0;
    
    const fullSuitEncumbrance = armorStats.encumbrance[sizeCategory] || armorStats.encumbrance.medium;
    const coveragePercentage = CONFIG.RQ3.calculateCoveragePercentage(armorLocation);
    
    return Math.round((fullSuitEncumbrance * coveragePercentage / 100) * 100) / 100; // Round to 2 decimal places
  };

  // Function to calculate armor cost based on type, location, and size  
  CONFIG.RQ3.calculateArmorCost = function(armorType, armorLocation, sizeCategory) {
    // Input validation
    if (!armorType || typeof armorType !== 'string') {
      console.warn('RQ3 | Invalid armor type provided:', armorType);
      return 0;
    }
    
    if (!armorLocation || typeof armorLocation !== 'string') {
      console.warn('RQ3 | Invalid armor location provided:', armorLocation);
      return 0;
    }
    
    if (!sizeCategory || typeof sizeCategory !== 'string') {
      console.warn('RQ3 | Invalid size category provided:', sizeCategory);
      return 0;
    }
    
    const armorStats = CONFIG.RQ3.armorStats[armorType];
    
    if (!armorStats || armorStats.costPerENC <= 0) return 0;
    
    const encumbrance = CONFIG.RQ3.calculateArmorEncumbrance(armorType, armorLocation, sizeCategory);
    
    return Math.round(armorStats.costPerENC * encumbrance);
  };

  // Configure trackable attributes for tokens
  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: [
        "characteristics.con.hitPoints", 
        "characteristics.pow.magicPoints",
        "attributes.fatigue"
      ],
      value: [
        "characteristics.str.value",
        "characteristics.con.value", 
        "characteristics.siz.value",
        "characteristics.int.value",
        "characteristics.pow.value",
        "characteristics.dex.value",
        "characteristics.app.value"
      ]
    },
    npc: {
      bar: [
        "characteristics.con.hitPoints", 
        "characteristics.pow.magicPoints"
      ],
      value: [
        "characteristics.str.value",
        "characteristics.con.value", 
        "characteristics.siz.value",
        "characteristics.int.value",
        "characteristics.pow.value",
        "characteristics.dex.value",
        "characteristics.app.value"
      ]
    },
    creature: {
      bar: [
        "characteristics.con.hitPoints", 
        "characteristics.pow.magicPoints"
      ],
      value: [
        "characteristics.str.value",
        "characteristics.con.value", 
        "characteristics.siz.value",
        "characteristics.int.value",
        "characteristics.pow.value",
        "characteristics.dex.value",
        "characteristics.app.value"
      ]
    }
  };

  // Register system settings
  registerSystemSettings();

  // Register handlebars helpers
  registerHandlebarsHelpers();

  console.log("RQ3 | System initialization complete");
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  console.log("RQ3 | System ready");
  
  // Register sheet application classes
  try {
    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("runequest3", RQ3CharacterSheet, {
      types: ["character"],
      makeDefault: true,
      label: "RQ3.SheetLabels.Character"
    });
    Actors.registerSheet("runequest3", RQ3NPCSheet, {
      types: ["npc"],
      makeDefault: true,
      label: "RQ3.SheetLabels.NPC"
    });
    Actors.registerSheet("runequest3", RQ3CreatureSheet, {
      types: ["creature"],
      makeDefault: true,
      label: "RQ3.SheetLabels.Creature"
    });
    console.log("RQ3 | Actor sheets registered successfully");
  } catch (error) {
    console.error("RQ3 | Error registering actor sheets:", error);
  }

  try {
    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("runequest3", RQ3ItemSheet, {
      makeDefault: true,
      label: "RQ3.SheetLabels.Item"
    });
    console.log("RQ3 | Item sheets registered successfully");
  } catch (error) {
    console.error("RQ3 | Error registering item sheets:", error);
  }
  
  // Perform any setup that requires the game to be fully loaded
  setupRQ3System();
  
  // Initialize lazy loading for performance
  initializeLazyLoading();
  
  console.log("RQ3 | Ready hook completed");
  
  // Register a global macro for exporting compendiums
  game.rq3.exportCompendium = async function(packId) {
    try {
      const pack = game.packs.get(packId);
      if (!pack) {
        ui.notifications.error("Compendium not found!");
        return;
      }
      
      ui.notifications.info(`Exporting ${pack.metadata.label}...`);
      
      const items = await pack.getDocuments();
      const data = items.map(item => item.toObject());
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${pack.metadata.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      ui.notifications.info(`Exported ${items.length} items from ${pack.metadata.label}`);
      console.log(`RQ3 | Exported ${items.length} items from ${pack.metadata.label}`);
    } catch (error) {
      console.error("RQ3 | Error exporting compendium:", error);
      ui.notifications.error(`Failed to export: ${error.message}`);
    }
  };
  
  console.log("RQ3 | Export function registered. Use: game.rq3.exportCompendium('runequest3.weapons')");
  
  // Register test function for creating compendiums with folders from JSON
  try {
    const { testFoldersFromJSON, autoCreateWorldCompendiums, regenerateAllCompendiums } = await import("./module/compendium-folder-loader.mjs");
    game.rq3.testFoldersFromJSON = testFoldersFromJSON;
    game.rq3.autoCreateWorldCompendiums = autoCreateWorldCompendiums;
    game.rq3.regenerateAllCompendiums = regenerateAllCompendiums;
    console.log("RQ3 | Compendium folder functions registered successfully");
  } catch (error) {
    console.error("RQ3 | Failed to load compendium folder loader:", error);
    ui.notifications.error("RQ3: Failed to load compendium creation functions. Check console for details.");
  }
  
  // Register data converter utilities
  try {
    const { convertAllDataToJSON } = await import("./scripts/convert-to-json.mjs");
    game.rq3.convertAllDataToJSON = convertAllDataToJSON;
    console.log("RQ3 | Data converter registered. Use: game.rq3.convertAllDataToJSON()");
  } catch (error) {
    console.warn("RQ3 | Could not load data converter:", error);
  }
  
  try {
    const { populateJSONFromCompendiums } = await import("./module/populate-json-from-compendiums.mjs");
    game.rq3.populateJSONFromCompendiums = populateJSONFromCompendiums;
    console.log("RQ3 | Compendium exporter registered. Use: game.rq3.populateJSONFromCompendiums()");
  } catch (error) {
    console.warn("RQ3 | Could not load compendium exporter:", error);
  }
  
  try {
    const { writeJSONFiles } = await import("./module/write-json-files.mjs");
    game.rq3.writeJSONFiles = writeJSONFiles;
    console.log("RQ3 | File writer registered. Use: game.rq3.writeJSONFiles() to write directly to data folder");
  } catch (error) {
    console.warn("RQ3 | Could not load file writer:", error);
  }
  
  console.log("RQ3 | Folder functions registered:");
  console.log("  - game.rq3.regenerateAllCompendiums() - Quick command to regenerate all compendiums");
  console.log("  - game.rq3.autoCreateWorldCompendiums() - Create missing compendiums");
  console.log("  - game.rq3.testFoldersFromJSON() - Test with weapons only");
  console.log("  - game.rq3.exportAllDataAsJSON() - Export all data as JSON (for file conversion)");
  
  // Auto-create world compendiums if enabled
  const autoCreate = game.settings.get("runequest3", "autoCreateWorldCompendiums");
  if (autoCreate && game.rq3.autoCreateWorldCompendiums) {
    console.log("RQ3 | Auto-creating organized world compendiums...");
    await game.rq3.autoCreateWorldCompendiums(true);
  } else if (autoCreate && !game.rq3.autoCreateWorldCompendiums) {
    console.error("RQ3 | Auto-create enabled but compendium loader failed to load");
    ui.notifications.error("RQ3: Could not auto-create compendiums. Check console for details.");
  }
});

/* -------------------------------------------- */
/*  System Settings                             */
/* -------------------------------------------- */

/**
 * Register system settings for RuneQuest 3
 * @description Sets up all configurable system options including house rules, initiative formulas, and game mechanics
 */
function registerSystemSettings() {
  // House rules settings
  game.settings.register("runequest3", "useHouseRules", {
    name: "Use House Rules",
    hint: "Enable various house rules and optional systems",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  // Initiative variant
  game.settings.register("runequest3", "initiativeFormula", {
    name: "Initiative Formula",
    hint: "Formula used for initiative rolls",
    scope: "world",
    config: true,
    type: String,
    default: "1d10 + @characteristics.dex.modifier",
    choices: {
      "1d10 + @characteristics.dex.modifier": "1d10 + DEX Modifier",
      "1d10 + @characteristics.dex.value": "1d10 + DEX Value",
      "2d6 + @characteristics.dex.modifier": "2d6 + DEX Modifier",
      "1d20 + @characteristics.dex.modifier": "1d20 + DEX Modifier"
    }
  });

  // Skill improvement rules
  game.settings.register("runequest3", "skillImprovementRule", {
    name: "Skill Improvement Rule",
    hint: "How skills improve with experience",
    scope: "world",
    config: true,
    type: String,
    default: "standard",
    choices: {
      "standard": "Standard RQ3 Rules",
      "fast": "Fast Advancement",
      "slow": "Slow Advancement"
    }
  });

  // Magic point recovery rate
  game.settings.register("runequest3", "magicPointRecovery", {
    name: "Magic Point Recovery",
    hint: "How quickly magic points recover",
    scope: "world",
    config: true,
    type: String,
    default: "standard",
    choices: {
      "standard": "1 per hour of rest",
      "fast": "1 per 30 minutes of rest",
      "slow": "1 per 2 hours of rest"
    }
  });

  // Hit location rules
  game.settings.register("runequest3", "hitLocationRules", {
    name: "Hit Location Rules",
    hint: "How hit locations are determined",
    scope: "world",
    config: true,
    type: String,
    default: "roll",
    choices: {
      "roll": "Roll on hit location table",
      "choose": "Attacker chooses",
      "random": "Random location"
    }
  });

  // Species compendium version tracking (for migrations)
  game.settings.register("runequest3", "speciesCompendiumVersion", {
    name: "Species Compendium Version",
    hint: "Tracks the last version of species compendium content applied",
    scope: "world",
    config: false, // Hidden setting
    type: String,
    default: "0.0.0"
  });

  // Spirit Magic compendium version tracking
  game.settings.register("runequest3", "spiritMagicCompendiumVersion", {
    name: "Spirit Magic Compendium Version",
    hint: "Tracks the last version of spirit magic compendium content applied",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  // Divine Magic compendium version tracking
  game.settings.register("runequest3", "divineMagicCompendiumVersion", {
    name: "Divine Magic Compendium Version",
    hint: "Tracks the last version of divine magic compendium content applied",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  // Sorcery compendium version tracking
  game.settings.register("runequest3", "sorceryCompendiumVersion", {
    name: "Sorcery Compendium Version",
    hint: "Tracks the last version of sorcery compendium content applied",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  // Weapons compendium version tracking
  game.settings.register("runequest3", "weaponsCompendiumVersion", {
    name: "Weapons Compendium Version",
    hint: "Tracks the last version of weapons compendium content applied",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  // Armour compendium version tracking
  game.settings.register("runequest3", "armourCompendiumVersion", {
    name: "Armour Compendium Version",
    hint: "Tracks the last version of armour compendium content applied",
    scope: "world",
    config: false,
    type: String,
    default: "0.0.0"
  });

  // Auto-create organized world compendiums
  game.settings.register("runequest3", "autoCreateWorldCompendiums", {
    name: "Auto-Create Organized World Compendiums",
    hint: "Automatically create world compendiums with folder organization from JSON data on system ready",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

/**
 * Register Handlebars template helpers for RuneQuest 3
 * @description Sets up all custom template helpers for formatting, calculations, and conditional logic
 */
function registerHandlebarsHelpers() {
  // Helper to format characteristic values
  Handlebars.registerHelper("formatCharacteristic", function(value, modifier) {
    const mod = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    return `${value} (${mod})`;
  });

  // Helper to calculate skill category modifiers
  Handlebars.registerHelper("skillCategoryMod", function(category, actor) {
    if (!actor?.system?.attributes?.skillCategory) return 0;
    return actor.system.attributes.skillCategory[category] || 0;
  });

  // Helper to format hit location HP
  Handlebars.registerHelper("formatHitLocationHP", function(current, max) {
    const percentage = Math.round((current / max) * 100);
    let cssClass = "healthy";
    
    if (percentage <= 25) cssClass = "critical";
    else if (percentage <= 50) cssClass = "wounded";
    else if (percentage <= 75) cssClass = "injured";
    
    return new Handlebars.SafeString(`<span class="hp-display ${cssClass}">${current}/${max}</span>`);
  });

  // Helper to determine success level
  Handlebars.registerHelper("successLevel", function(roll, target) {
    if (roll >= 96) return "fumble";
    if (roll <= Math.floor(target / 20)) return "critical";
    if (roll <= target) return "success";
    return "failure";
  });

  // Helper to format currency
  Handlebars.registerHelper("formatCurrency", function(value, currency) {
    return `${value} ${currency}`;
  });

  // Helper for rune affinity display
  Handlebars.registerHelper("runeAffinity", function(value) {
    if (value >= 80) return "Master";
    if (value >= 60) return "Adept";
    if (value >= 40) return "Initiate";
    if (value >= 20) return "Novice";
    return "Untrained";
  });

  // Mathematical helpers
  Handlebars.registerHelper("mult", function(a, b) {
    return a * b;
  });

  Handlebars.registerHelper("div", function(a, b) {
    return a / b;
  });

  Handlebars.registerHelper("add", function(a, b) {
    return a + b;
  });

  Handlebars.registerHelper("sub", function(a, b) {
    return a - b;
  });

  // Comparison helpers
  Handlebars.registerHelper("lt", function(a, b) {
    return a < b;
  });

  Handlebars.registerHelper("gt", function(a, b) {
    return a > b;
  });

  Handlebars.registerHelper("eq", function(a, b) {
    return a === b;
  });

  // Logical AND helper for conditional checks
  Handlebars.registerHelper("and", function() {
    for (let i = 0; i < arguments.length - 1; i++) {
      if (!arguments[i]) return false;
    }
    return true;
  });

  // Logical OR helper for conditional checks
  Handlebars.registerHelper("or", function() {
    for (let i = 0; i < arguments.length - 1; i++) {
      if (arguments[i]) return true;
    }
    return false;
  });

  // Logical NOT helper for conditional checks
  Handlebars.registerHelper("not", function(value) {
    return !value;
  });

      // Lookup helper for accessing nested object properties
    Handlebars.registerHelper("lookup", function(obj, key) {
      return obj && obj[key];
    });

    // Calculate effective HP from max HP and damage
    Handlebars.registerHelper("effectiveHP", function(maxHP, damage) {
      return Math.max(0, (maxHP || 0) - (damage || 0));
    });

    // Calculate effective armor points from max AP and armor damage
    Handlebars.registerHelper("effectiveAP", function(maxAP, armorDamage) {
      return Math.max(0, (maxAP || 0) - (armorDamage || 0));
    });

    // Format AP display with temp AP added to current (e.g., "8/6" where 8 = 6 current + 2 temp)
    Handlebars.registerHelper("formatAP", function(maxAP, armorDamage, tempAP) {
      const currentAP = Math.max(0, (maxAP || 0) - (armorDamage || 0));
      const temp = tempAP || 0;
      const totalAP = currentAP + temp;
      return `${totalAP}/${maxAP}`;
    });

    // Calculate effective total HP from max HP, general damage, and all hit location damage
    Handlebars.registerHelper("effectiveTotalHP", function(actor) {
      if (!actor || !actor.system) return 0;

      const maxHP = actor.system.characteristics?.con?.hitPoints?.max || 0;
      const generalDamage = actor.system.attributes?.generalDamage || 0;

      let totalHitLocationDamage = 0;
      const hitLocations = actor.system.hitLocations || {};
      for (const location of Object.values(hitLocations)) {
        totalHitLocationDamage += location.damage || 0;
      }

      const totalDamage = generalDamage + totalHitLocationDamage;
      return Math.max(0, maxHP - totalDamage);
    });

   // Default value helper
  Handlebars.registerHelper("default", function(value, defaultValue) {
    return value !== undefined && value !== null && value !== "" ? value : defaultValue;
  });

  // String concatenation helper
  Handlebars.registerHelper("concat", function() {
    let result = "";
    for (let i = 0; i < arguments.length - 1; i++) {
      result += arguments[i];
    }
    return result;
  });

  // Localization helper with fallback
  Handlebars.registerHelper("localize", function(key) {
    return game.i18n.localize(key) || key;
  });

  // String manipulation helpers
  Handlebars.registerHelper("upper", function(str) {
    return str ? str.toUpperCase() : "";
  });

  Handlebars.registerHelper("substr", function(str, start, length) {
    if (!str) return "";
    return str.substr(start, length);
  });

  // Helper to sort skills alphabetically by localized name
  Handlebars.registerHelper("sortSkills", function(skills, options) {
    if (!skills || typeof skills !== 'object') return '';
    
    // Convert object to array of [key, value] pairs
    const skillsArray = Object.entries(skills);
    
    // Sort by localized skill name
    skillsArray.sort((a, b) => {
      const nameA = game.i18n.localize(`RQ3.Skills.${a[0]}`) || a[1].name;
      const nameB = game.i18n.localize(`RQ3.Skills.${b[0]}`) || b[1].name;
      return nameA.localeCompare(nameB);
    });
    
    // Build the output
    let result = '';
    for (const [skillKey, skill] of skillsArray) {
      result += options.fn({ skillKey: skillKey, skill: skill });
    }
    
    return result;
  });

  // Helper to safely get skill values with fallback
  Handlebars.registerHelper("getSkillValue", function(skillValues, categoryKey, skillKey) {
    if (!skillValues || !skillValues[categoryKey] || skillValues[categoryKey][skillKey] === undefined) {
      return 0;
    }
    return skillValues[categoryKey][skillKey];
  });

  // Helper to safely get skill base values with fallback
  Handlebars.registerHelper("getSkillBaseValue", function(skillBaseValues, categoryKey, skillKey) {
    if (!skillBaseValues || !skillBaseValues[categoryKey] || skillBaseValues[categoryKey][skillKey] === undefined) {
      return 0;
    }
    return skillBaseValues[categoryKey][skillKey];
  });

  // Helper to safely display skill base values, ensuring 0 shows as "0" not falsy
  Handlebars.registerHelper("displaySkillBaseValue", function(skillBaseValues, categoryKey, skillKey) {
    if (!skillBaseValues || !skillBaseValues[categoryKey]) {
      return "0";
    }
    const value = skillBaseValues[categoryKey][skillKey];
    return (value !== undefined && value !== null) ? value.toString() : "0";
  });

  // Helper to safely display skill invested values, ensuring 0 shows as "0" not falsy
  Handlebars.registerHelper("displaySkillInvestedValue", function(skillInvestedValues, categoryKey, skillKey) {
    if (!skillInvestedValues || !skillInvestedValues[categoryKey]) {
      return "0";
    }
    const value = skillInvestedValues[categoryKey][skillKey];
    return (value !== undefined && value !== null) ? value.toString() : "0";
  });

  // Helper to safely display skill total values, ensuring 0 shows as "0" not falsy
  Handlebars.registerHelper("displaySkillTotalValue", function(skillTotalValues, categoryKey, skillKey) {
    if (!skillTotalValues || !skillTotalValues[categoryKey]) {
      return "0";
    }
    const value = skillTotalValues[categoryKey][skillKey];
    return (value !== undefined && value !== null) ? value.toString() : "0";
  });

  // Helper already defined above - removing duplicate

  // Helper to check if an item is currently equipped armor
  Handlebars.registerHelper("isEquippedArmor", function(itemId, equippedArmor) {
    if (!itemId || !equippedArmor) return false;
    
    // Check if this item ID appears in any of the equipped armor slots
    return Object.values(equippedArmor).includes(itemId);
  });

  // Helper to check if an item is currently equipped as a weapon
  Handlebars.registerHelper("isEquippedWeapon", function(itemId, equippedWeapons) {
    if (!itemId || !equippedWeapons) return false;
    
    // Check if this item ID appears in any of the equipped weapon slots
    return Object.values(equippedWeapons).includes(itemId);
  });

  // Helper to get the attack skill value for a weapon type
  Handlebars.registerHelper("getAttackSkillValue", function(context, weaponType) {
    if (!context || !weaponType) return 0;
    
    // Map weapon type to attack skill key
    const weaponTypeToSkillMap = {
      'axe': 'blade',
      'hammer': 'blade',
      'dagger': 'close',
      'fist': 'close',
      'mace': 'blunt',
      'shield': 'shield',
      'spear': 'spear',
      'javelin': 'spear',
      'sword': 'sword',
      'tool': 'tools',
      'bow': 'bow',
      'crossbow': 'crossbow',
      'dart': 'dart',
      'sling': 'sling',
      'staff-sling': 'staffSling',
      'rock': 'rock',
      'club': 'club',
      'net': 'net'
    };
    
    const skillKey = weaponTypeToSkillMap[weaponType];
    if (!skillKey) return 0;
    
    // Use the skillTotalValues from the context (already calculated with base + invested + category bonus)
    if (context.skillTotalValues && context.skillTotalValues.weapon && context.skillTotalValues.weapon[skillKey] !== undefined) {
      return context.skillTotalValues.weapon[skillKey];
    }
    
    return 0;
  });

  // Helper to check if an item is a container
  Handlebars.registerHelper("isContainer", function(item) {
    return item && item.type === 'equipment' && item.system.equipmentType === 'container';
  });

  // Helper to get items inside a container
  Handlebars.registerHelper("getContainerItems", function(containerId, allItems) {
    if (!containerId || !allItems) return [];
    return allItems.filter(item => item.system.containerId === containerId);
  });

  // Helper to check if a container is expanded
  Handlebars.registerHelper("isContainerExpanded", function(containerId, containerStates) {
    if (!containerId) return true; // Default to expanded
    if (!containerStates) return true;
    return containerStates[containerId] !== false; // Expanded if not explicitly set to false
  });

  // Helper to format encumbrance values to 2 decimal places
  Handlebars.registerHelper("formatEnc", function(value) {
    if (value === undefined || value === null) return "0.00";
    return (Math.round(value * 100) / 100).toFixed(2);
  });

  // Helper to calculate worn encumbrance (1/2x) with 2 decimal places
  Handlebars.registerHelper("wornEnc", function(weight, quantity) {
    if (!weight || !quantity) return "0.00";
    const enc = (weight * quantity) / 2;
    return (Math.round(enc * 100) / 100).toFixed(2);
  });

  // Helper to calculate bag encumbrance (1/3x) with 2 decimal places
  Handlebars.registerHelper("bagEnc", function(weight, quantity) {
    if (!weight || !quantity) return "0.00";
    const enc = (weight * quantity) / 3;
    return (Math.round(enc * 100) / 100).toFixed(2);
  });

  // Helper to calculate carried encumbrance (1x) with 2 decimal places
  Handlebars.registerHelper("carriedEnc", function(weight, quantity) {
    if (!weight || !quantity) return "0.00";
    const enc = weight * quantity;
    return (Math.round(enc * 100) / 100).toFixed(2);
  });

  // Helper to calculate armor encumbrance in bag (1/3x) with 2 decimal places
  Handlebars.registerHelper("armorBagEnc", function(encumbrance) {
    if (!encumbrance) return "0.00";
    const enc = encumbrance / 3;
    return (Math.round(enc * 100) / 100).toFixed(2);
  });

  // Helper to calculate skill value with encumbrance penalties
  Handlebars.registerHelper("skillWithEncumbrance", function(actor, skillName, baseValue) {
    if (!actor || !skillName || baseValue === undefined) return baseValue || 0;
    
    const totalENC = actor.system?.attributes?.encumbrance?.total || 0;
    const armorAndWeaponENC = actor.system?.attributes?.encumbrance?.armorAndWeapons || 0;
    
    let penalizedValue = baseValue;
    
    // Dodge penalty: -1% per point of total ENC
    if (skillName.toLowerCase().includes('dodge')) {
      penalizedValue -= totalENC;
    }
    
    // Sneak penalty: -1% per point of armor and weapon ENC
    if (skillName.toLowerCase().includes('sneak')) {
      penalizedValue -= armorAndWeaponENC;
    }
    
    return Math.max(0, Math.round(penalizedValue));
  });

  // Helper to show encumbrance penalty for a skill
  Handlebars.registerHelper("encumbrancePenalty", function(actor, skillName) {
    if (!actor || !skillName) return "";
    
    const totalENC = actor.system?.attributes?.encumbrance?.total || 0;
    const armorAndWeaponENC = actor.system?.attributes?.encumbrance?.armorAndWeapons || 0;
    
    let penalty = 0;
    
    // Dodge penalty: -1% per point of total ENC
    if (skillName.toLowerCase().includes('dodge') && totalENC > 0) {
      penalty = totalENC;
    }
    
    // Sneak penalty: -1% per point of armor and weapon ENC
    if (skillName.toLowerCase().includes('sneak') && armorAndWeaponENC > 0) {
      penalty = armorAndWeaponENC;
    }
    
    return penalty > 0 ? ` (-${penalty}% ENC)` : "";
  });

  // Helper to provide default images for items missing them
  Handlebars.registerHelper("itemImage", function(item) {
    // If item has an image and it's not the default mystery-man, use it
    if (item.img && item.img !== "icons/svg/mystery-man.svg") {
      return item.img;
    }
    
    // Provide default images based on item type
    const defaultImages = {
      weapon: "icons/svg/sword.svg",
      spell: "icons/svg/book.svg", 
      rune: "icons/svg/rune-stone.svg",
      skill: "icons/svg/upgrade.svg",
      species: "icons/svg/mystery-man.svg",
      equipment: "icons/svg/item-bag.svg"
    };
    
    // Special handling for armor based on armor type
    if (item.type === "armor") {
      const armorDefaults = {
        "clothes": "icons/equipment/chest/shirt-simple-white.webp",
        "soft-leather": "icons/equipment/chest/vest-leather-brown.webp",
        "stiff-leather": "icons/equipment/chest/vest-leather-brown.webp",
        "cuirbouilli": "icons/equipment/chest/breastplate-leather-brown.webp",
        "bezainted": "icons/equipment/chest/vest-leather-studded.webp",
        "ringmail": "icons/equipment/chest/shirt-scale-leather.webp",
        "lamellar": "icons/equipment/chest/breastplate-scale-leather.webp",
        "scale": "icons/equipment/chest/breastplate-scale-steel.webp",
        "chainmail": "icons/equipment/chest/shirt-chain-mail.webp",
        "brigandine": "icons/equipment/chest/coat-leather-brown.webp",
        "plate": "icons/equipment/chest/breastplate-layered-steel.webp",
        "shield": "icons/equipment/shield/buckler-wooden-boss-steel.webp"
      };
      return armorDefaults[item.system?.armorType] || "icons/svg/armor.svg";
    }
    
    // Return default for item type or generic item icon
    return defaultImages[item.type] || "icons/svg/item-bag.svg";
  });
}

/* -------------------------------------------- */
/*  System Setup                                */
/* -------------------------------------------- */

/**
 * Set up the core RuneQuest 3 system
 * @description Initializes system configuration, registers document classes, and sets up core functionality
 */
function setupRQ3System() {
  console.log("RQ3 | Setting up RQ3 system...");
  
  // Set up any global system configurations
  
  // Configure combat settings
  CONFIG.Combat.initiative = {
    formula: game.settings.get("runequest3", "initiativeFormula"),
    decimals: 0
  };

  // Set up status effects
  setupStatusEffects();
  
  // Initialize any compendium content
  initializeCompendiums();
  
  console.log("RQ3 | RQ3 system setup completed");
}

/* -------------------------------------------- */
/*  Status Effects                              */
/* -------------------------------------------- */

/**
 * Set up status effects for RuneQuest 3
 * @description Configures status effect icons and behaviors for the system
 */
function setupStatusEffects() {
  CONFIG.statusEffects = [
    {
      id: "unconscious",
      label: "Unconscious",
      icon: "icons/svg/unconscious.svg"
    },
    {
      id: "stunned",
      label: "Stunned", 
      icon: "icons/svg/daze.svg"
    },
    {
      id: "prone",
      label: "Prone",
      icon: "icons/svg/falling.svg"
    },
    {
      id: "fatigued",
      label: "Fatigued",
      icon: "icons/svg/downgrade.svg"
    },
    {
      id: "exhausted",
      label: "Exhausted",
      icon: "icons/svg/sleep.svg"
    },
    {
      id: "encumbered",
      label: "Encumbered",
      icon: "icons/svg/weight.svg"
    },
    {
      id: "bleeding",
      label: "Bleeding",
      icon: "icons/svg/blood.svg"
    },
    {
      id: "poisoned",
      label: "Poisoned",
      icon: "icons/svg/poison.svg"
    },
    {
      id: "diseased",
      label: "Diseased",
      icon: "icons/svg/disease.svg"
    },
    {
      id: "blessed",
      label: "Blessed",
      icon: "icons/svg/angel.svg"
    },
    {
      id: "cursed",
      label: "Cursed",
      icon: "icons/svg/curse.svg"
    },
    {
      id: "invisible",
      label: "Invisible",
      icon: "icons/svg/invisible.svg"
    },
    {
      id: "silenced",
      label: "Silenced",
      icon: "icons/svg/silenced.svg"
    }
  ];
}

/* -------------------------------------------- */
/*  Compendium Initialization                   */
/* -------------------------------------------- */

async function initializeCompendiums() {
  // Migration functions are disabled - we now use JSON files and organized world compendiums
  // Old system compendiums have been removed from system.json
  console.log("RQ3 | Compendium migrations disabled - using JSON files and organized world compendiums");
  
  // Optional: Uncomment below if you want to keep legacy compendiums updated
  // await migrateSpeciesCompendium();
  // await migrateSpiritMagicCompendium();
  // await migrateDivineMagicCompendium();
  // await migrateSorceryCompendium();
  // await migrateWeaponsCompendium();
  // await migrateArmourCompendium();
}

async function migrateSpeciesCompendium() {
  const speciesCompendium = game.packs.get("runequest3.species");
  
  if (!speciesCompendium) {
    console.error("RQ3 | Species compendium not found! Check system.json configuration.");
    return;
  }

  // Get current system version and stored compendium version
  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "speciesCompendiumVersion");
  
  console.log(`RQ3 | Species - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);

  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Species compendium up to date");
    return;
  }

  // Recreate all species from current data
  console.log("RQ3 | Using embedded species data for migration");

  try {
    // Load species data from JSON
    let speciesData;
    try {
      speciesData = await loadCompendiumData('species');
    } catch (error) {
      console.warn("RQ3 | Could not load species data from JSON:", error);
      return; // Skip migration if data can't be loaded
    }
    
    if (!speciesData || Object.keys(speciesData).length === 0) {
      console.warn("RQ3 | No species data found in JSON");
      return;
    }

    // Get existing documents to check what's already there
    const existingDocs = await speciesCompendium.getDocuments();
    const existingNames = existingDocs.map(doc => doc.name.toLowerCase());

    let addedCount = 0;
    let updatedCount = 0;

    // Check each species and add/update if needed
    for (const [speciesKey, speciesInfo] of Object.entries(speciesData)) {
      const speciesName = speciesInfo.data.name.toLowerCase();
      
      // Check if this species should be available in current system version
      if (foundry.utils.isNewerVersion(speciesInfo.version, systemVersion)) {
        continue; // Skip species from future versions
      }
      
      // Check if species already exists
      const existingIndex = existingNames.indexOf(speciesName);
      if (existingIndex === -1) {
        console.log(`RQ3 | Adding missing species: ${speciesInfo.data.name}`);
        await Item.create(speciesInfo.data, { pack: speciesCompendium.collection });
        addedCount++;
      } else {
        // Delete and recreate existing species to get latest data (including new skills)
        const existingDoc = existingDocs[existingIndex];
        console.log(`RQ3 | Updating species: ${speciesInfo.data.name}`);
        await existingDoc.delete();
        await Item.create(speciesInfo.data, { pack: speciesCompendium.collection });
        updatedCount++;
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "speciesCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} species to compendium!`);
      console.log(`RQ3 | Species migration complete: added ${addedCount} new and updated ${updatedCount} species`);
    } else {
      console.log("RQ3 | Species compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate species compendium:", error);
    ui.notifications.warn("RQ3: Failed to update species compendium.");
  }
}

async function migrateSpiritMagicCompendium() {
  const compendium = game.packs.get("runequest3.spirit-magic");
  
  if (!compendium) {
    console.error("RQ3 | Spirit Magic compendium not found!");
    return;
  }

  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "spiritMagicCompendiumVersion");
  
  console.log(`RQ3 | Spirit Magic - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);
  
  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Spirit Magic compendium up to date");
    return;
  }
  
  let spiritMagicData;
  try {
    const magicData = await loadCompendiumData("magic");
    // Filter for spirit magic only
    spiritMagicData = Object.fromEntries(
      Object.entries(magicData).filter(([key, value]) => 
        value.data?.system?.spellType === "spirit"
      )
    );
  } catch (error) {
    console.error("RQ3 | Failed to load spirit magic from JSON:", error);
    ui.notifications.error("Failed to load spirit magic data. Check console for details.");
    return;
  }
  
  console.log(`RQ3 | Migrating Spirit Magic compendium. Total spells in data: ${Object.keys(spiritMagicData).length}`);
  
  try {
    const existingDocs = await compendium.getDocuments();
    const existingNames = existingDocs.map(doc => doc.name.toLowerCase());

    let addedCount = 0;
    let updatedCount = 0;

    for (const [spellKey, spellInfo] of Object.entries(spiritMagicData)) {
      const spellName = spellInfo.data.name.toLowerCase();
      
      if (foundry.utils.isNewerVersion(spellInfo.version, systemVersion)) {
        continue;
      }
      
      const existingIndex = existingNames.indexOf(spellName);
      if (existingIndex === -1) {
        console.log(`RQ3 | Adding spirit magic spell: ${spellInfo.data.name}`);
        await Item.create(spellInfo.data, { pack: compendium.collection });
        addedCount++;
      } else {
        const existingDoc = existingDocs[existingIndex];
        console.log(`RQ3 | Updating spirit magic spell: ${spellInfo.data.name}`);
        await existingDoc.delete();
        await Item.create(spellInfo.data, { pack: compendium.collection });
        updatedCount++;
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "spiritMagicCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} spirit magic spells!`);
      console.log(`RQ3 | Spirit Magic migration complete: added ${addedCount} new and updated ${updatedCount} spells`);
    } else {
      console.log("RQ3 | Spirit Magic compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate spirit magic compendium:", error);
    ui.notifications.warn("RQ3: Failed to update spirit magic compendium.");
  }
}

async function migrateDivineMagicCompendium() {
  const compendium = game.packs.get("runequest3.divine-magic");
  
  if (!compendium) {
    console.error("RQ3 | Divine Magic compendium not found!");
    return;
  }

  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "divineMagicCompendiumVersion");
  
  console.log(`RQ3 | Divine Magic - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);
  
  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Divine Magic compendium up to date");
    return;
  }
  
  let divineMagicData;
  try {
    const magicData = await loadCompendiumData("magic");
    // Filter for divine magic only
    divineMagicData = Object.fromEntries(
      Object.entries(magicData).filter(([key, value]) => 
        value.data?.system?.spellType === "divine"
      )
    );
  } catch (error) {
    console.error("RQ3 | Failed to load divine magic from JSON:", error);
    ui.notifications.error("Failed to load divine magic data. Check console for details.");
    return;
  }
  
  console.log(`RQ3 | Migrating Divine Magic compendium. Total spells in data: ${Object.keys(divineMagicData).length}`);
  
  try {
    const existingDocs = await compendium.getDocuments();
    const existingNames = existingDocs.map(doc => doc.name.toLowerCase());

    let addedCount = 0;
    let updatedCount = 0;

    for (const [spellKey, spellInfo] of Object.entries(divineMagicData)) {
      const spellName = spellInfo.data.name.toLowerCase();
      
      if (foundry.utils.isNewerVersion(spellInfo.version, systemVersion)) {
        continue;
      }
      
      const existingIndex = existingNames.indexOf(spellName);
      if (existingIndex === -1) {
        console.log(`RQ3 | Adding divine magic spell: ${spellInfo.data.name}`);
        await Item.create(spellInfo.data, { pack: compendium.collection });
        addedCount++;
      } else {
        const existingDoc = existingDocs[existingIndex];
        console.log(`RQ3 | Updating divine magic spell: ${spellInfo.data.name}`);
        await existingDoc.delete();
        await Item.create(spellInfo.data, { pack: compendium.collection });
        updatedCount++;
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "divineMagicCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} divine magic spells!`);
      console.log(`RQ3 | Divine Magic migration complete: added ${addedCount} new and updated ${updatedCount} spells`);
    } else {
      console.log("RQ3 | Divine Magic compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate divine magic compendium:", error);
    ui.notifications.warn("RQ3: Failed to update divine magic compendium.");
  }
}

async function migrateSorceryCompendium() {
  const compendium = game.packs.get("runequest3.sorcery");
  
  if (!compendium) {
    console.error("RQ3 | Sorcery compendium not found!");
    return;
  }

  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "sorceryCompendiumVersion");
  
  console.log(`RQ3 | Sorcery - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);
  
  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Sorcery compendium up to date");
    return;
  }
  
  let sorceryData;
  try {
    const magicData = await loadCompendiumData("magic");
    // Filter for sorcery only
    sorceryData = Object.fromEntries(
      Object.entries(magicData).filter(([key, value]) => 
        value.data?.system?.spellType === "sorcery"
      )
    );
  } catch (error) {
    console.error("RQ3 | Failed to load sorcery from JSON:", error);
    ui.notifications.error("Failed to load sorcery data. Check console for details.");
    return;
  }
  
  console.log(`RQ3 | Migrating Sorcery compendium. Total spells in data: ${Object.keys(sorceryData).length}`);
  
  try {
    const existingDocs = await compendium.getDocuments();
    const existingNames = existingDocs.map(doc => doc.name.toLowerCase());

    let addedCount = 0;
    let updatedCount = 0;

    for (const [spellKey, spellInfo] of Object.entries(sorceryData)) {
      const spellName = spellInfo.data.name.toLowerCase();
      
      if (foundry.utils.isNewerVersion(spellInfo.version, systemVersion)) {
        continue;
      }
      
      const existingIndex = existingNames.indexOf(spellName);
      if (existingIndex === -1) {
        console.log(`RQ3 | Adding sorcery spell: ${spellInfo.data.name}`);
        await Item.create(spellInfo.data, { pack: compendium.collection });
        addedCount++;
      } else {
        const existingDoc = existingDocs[existingIndex];
        console.log(`RQ3 | Updating sorcery spell: ${spellInfo.data.name}`);
        await existingDoc.delete();
        await Item.create(spellInfo.data, { pack: compendium.collection });
        updatedCount++;
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "sorceryCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} sorcery spells!`);
      console.log(`RQ3 | Sorcery migration complete: added ${addedCount} new and updated ${updatedCount} spells`);
    } else {
      console.log("RQ3 | Sorcery compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate sorcery compendium:", error);
    ui.notifications.warn("RQ3: Failed to update sorcery compendium.");
  }
}

async function migrateWeaponsCompendium() {
  const compendium = game.packs.get("runequest3.weapons");
  
  if (!compendium) {
    console.error("RQ3 | Weapons compendium not found!");
    return;
  }

  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "weaponsCompendiumVersion");
  
  console.log(`RQ3 | Weapons - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);
  
  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Weapons compendium up to date");
    return;
  }
  
  // Load weapons data (tries JSON first, falls back to .mjs)
  let weaponsData;
  try {
    weaponsData = await loadCompendiumData("weapons");
  } catch (error) {
    console.error("RQ3 | Failed to load weapons from JSON:", error);
    ui.notifications.error("Failed to load weapons data. Check console for details.");
    return;
  }
  
  console.log(`RQ3 | Starting weapons migration. Total weapons in data: ${Object.keys(weaponsData).length}`);
  
  try {
    // Get existing weapons
    const existingDocs = await compendium.getDocuments();
    const existingWeapons = new Map(existingDocs.map(doc => [doc.name, doc]));
    
    let addedCount = 0;
    let updatedCount = 0;
    
    // Process each weapon in the data
    for (const [weaponKey, weaponInfo] of Object.entries(weaponsData)) {
      // Skip weapons from future versions
      if (foundry.utils.isNewerVersion(weaponInfo.version, systemVersion)) {
        continue;
      }
      
      const weaponData = foundry.utils.deepClone(weaponInfo.data);
      const existingWeapon = existingWeapons.get(weaponData.name);
      
      if (existingWeapon) {
        // Update existing weapon
        try {
          await existingWeapon.update(weaponData.system ? { system: weaponData.system } : {});
          updatedCount++;
        } catch (error) {
          console.error(`RQ3 | Failed to update weapon ${weaponKey}:`, error);
        }
      } else {
        // Add new weapon
        try {
          await Item.create(weaponData, { pack: compendium.collection });
          addedCount++;
        } catch (error) {
          console.error(`RQ3 | Failed to add weapon ${weaponKey}:`, error);
        }
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "weaponsCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} weapons!`);
      console.log(`RQ3 | Weapons migration complete: added ${addedCount} new and updated ${updatedCount} weapons`);
    } else {
      console.log("RQ3 | Weapons compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate weapons compendium:", error);
    ui.notifications.warn("RQ3: Failed to update weapons compendium.");
  }
}

async function migrateArmourCompendium() {
  const compendium = game.packs.get("runequest3.armour");
  
  if (!compendium) {
    console.error("RQ3 | Armour compendium not found!");
    return;
  }

  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "armourCompendiumVersion");
  
  console.log(`RQ3 | Armour - System version: ${systemVersion}, Compendium version: ${compendiumVersion}`);
  
  // Skip if already up to date
  if (compendiumVersion === systemVersion) {
    console.log("RQ3 | Armour compendium up to date");
    return;
  }
  
  let armourData;
  try {
    armourData = await loadCompendiumData("armour");
  } catch (error) {
    console.error("RQ3 | Failed to load armour from JSON:", error);
    ui.notifications.error("Failed to load armour data. Check console for details.");
    return;
  }
  
  console.log(`RQ3 | Migrating armour compendium. Total pieces in data: ${Object.keys(armourData).length}`);
  
  try {
    const existingDocs = await compendium.getDocuments();
    const existingNames = existingDocs.map(doc => doc.name.toLowerCase());

    let addedCount = 0;
    let updatedCount = 0;

    for (const [armourKey, armourInfo] of Object.entries(armourData)) {
      const armourName = armourInfo.data.name.toLowerCase();
      
      if (foundry.utils.isNewerVersion(armourInfo.version, systemVersion)) {
        continue;
      }
      
      const existingIndex = existingNames.indexOf(armourName);
      if (existingIndex === -1) {
        console.log(`RQ3 | Adding armour: ${armourInfo.data.name}`);
        await Item.create(armourInfo.data, { pack: compendium.collection });
        addedCount++;
      } else {
        const existingDoc = existingDocs[existingIndex];
        console.log(`RQ3 | Updating armour: ${armourInfo.data.name}`);
        await existingDoc.delete();
        await Item.create(armourInfo.data, { pack: compendium.collection });
        updatedCount++;
      }
    }

    // Update the stored compendium version
    await game.settings.set("runequest3", "armourCompendiumVersion", systemVersion);

    if (addedCount > 0 || updatedCount > 0) {
      ui.notifications.info(`RQ3: Added ${addedCount} new and updated ${updatedCount} armour pieces!`);
      console.log(`RQ3 | Armour migration complete: added ${addedCount} new and updated ${updatedCount} armour pieces`);
    } else {
      console.log("RQ3 | Armour compendium up to date");
    }

  } catch (error) {
    console.error("RQ3 | Failed to migrate armour compendium:", error);
    ui.notifications.warn("RQ3: Failed to update armour compendium.");
  }
}

/* -------------------------------------------- */
/*  Compendium Context Menu                     */
/* -------------------------------------------- */

/**
 * Add export option to compendium context menu (FoundryVTT v13)
 */
Hooks.on("getCompendiumDirectoryEntryContext", (entry, entryOptions) => {
  console.log("RQ3 | getCompendiumDirectoryEntryContext hook called", entry, entryOptions);
  
  // Add export option for runequest3 compendiums
  entryOptions.push({
    name: "Export Compendium Data",
    icon: '<i class="fas fa-download"></i>',
    condition: () => {
      // Try multiple ways to get the pack ID
      const packId = entry?.dataset?.pack || 
                     entry?.getAttribute?.("data-pack") || 
                     $(entry).data("pack") ||
                     entry?.closest?.("[data-pack]")?.dataset?.pack;
      console.log("RQ3 | Checking pack ID:", packId);
      return packId && packId.startsWith("runequest3.");
    },
    callback: async (entry) => {
      try {
        // Try multiple ways to get the pack ID
        const packId = entry?.dataset?.pack || 
                       entry?.getAttribute?.("data-pack") || 
                       $(entry).data("pack") ||
                       entry?.closest?.("[data-pack]")?.dataset?.pack;
        
        console.log("RQ3 | Exporting pack:", packId);
        const pack = game.packs.get(packId);
        
        if (!pack) {
          ui.notifications.error("Compendium not found!");
          return;
        }
        
        ui.notifications.info(`Exporting ${pack.metadata.label}...`);
        
        // Get all documents from the compendium
        const items = await pack.getDocuments();
        const data = items.map(item => item.toObject());
        
        // Create a downloadable JSON file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${pack.metadata.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        ui.notifications.info(`Exported ${items.length} items from ${pack.metadata.label}`);
        console.log(`RQ3 | Exported ${items.length} items from ${pack.metadata.label}`, data);
      } catch (error) {
        console.error("RQ3 | Error exporting compendium:", error);
        ui.notifications.error(`Failed to export compendium: ${error.message}`);
      }
    }
  });
});

/* -------------------------------------------- */
/*  Chat Message Hooks                          */
/* -------------------------------------------- */

Hooks.on("renderChatMessage", async (message, html, data) => {
  // Add click handlers for roll results
  html.find(".rq3-skill-roll, .rq3-char-roll").click(event => {
    event.preventDefault();
    // Could add functionality to re-roll or modify results
  });
  
  // Enhance roll tooltips with custom descriptions and dice results
  if (message.rolls && message.rolls.length > 0) {
    message.rolls.forEach((roll, index) => {
      // Find the roll element in the chat message
      const rollElements = html.find('.dice-roll');
      if (rollElements.length > index) {
        const rollElement = rollElements.eq(index);
        
        // Add hover handler to show enhanced tooltip
        rollElement.on('mouseenter', async function(event) {
          // Create our custom tooltip
          let tooltipElement = $('#rq3-custom-roll-tooltip');
          if (tooltipElement.length === 0) {
            tooltipElement = $('<div id="rq3-custom-roll-tooltip" style="position: fixed; background: rgba(0, 0, 0, 0.95); color: white; padding: 12px; border-radius: 6px; z-index: 10000; pointer-events: none; max-width: 400px; font-size: 13px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 1px solid #666; line-height: 1.5;"></div>');
            $('body').append(tooltipElement);
          }
          
          // Build tooltip content
          let tooltipContent = '';
          
          // Add dice breakdown
          if (roll.terms && roll.terms.length > 0) {
            tooltipContent += '<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #666;">';
            tooltipContent += '<strong>Dice Results:</strong><br/>';
            
            roll.terms.forEach(term => {
              if (term.results) {
                // Dice term
                const results = term.results.map(r => r.result).join(', ');
                tooltipContent += `${term.number}d${term.faces}: [${results}]<br/>`;
              } else if (term.number !== undefined) {
                // Numeric term (modifier)
                const sign = term.number >= 0 ? '+' : '';
                tooltipContent += `Modifier: ${sign}${term.number}<br/>`;
              } else if (typeof term === 'string') {
                // Operator
                // Skip operators in display
              }
            });
            
            tooltipContent += `<strong>Total: ${roll.total}</strong>`;
            tooltipContent += '</div>';
          }
          
          // Add custom description if available
          if (roll.options && roll.options.tooltip) {
            tooltipContent += roll.options.tooltip;
          }
          
          tooltipElement.html(tooltipContent);
          
          // Show tooltip first to get its dimensions
          tooltipElement.show();
          
          // Position tooltip intelligently based on mouse position and viewport
          const mouseX = event.clientX;
          const mouseY = event.clientY;
          const tooltipWidth = tooltipElement.outerWidth();
          const tooltipHeight = tooltipElement.outerHeight();
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Default position (top-left of cursor)
          let left = mouseX - tooltipWidth - 15;
          let top = mouseY - tooltipHeight - 15;
          
          // Check if tooltip would go off left edge
          if (left < 20) {
            // Position to the right of cursor
            left = mouseX + 15;
          }
          
          // Check if tooltip would go off top edge
          if (top < 20) {
            // Position below cursor
            top = mouseY + 15;
          }
          
          // Check if tooltip would go off right edge (after adjusting for left edge)
          if (left + tooltipWidth > viewportWidth - 20) {
            // Position at right edge with margin
            left = viewportWidth - tooltipWidth - 20;
          }
          
          // Check if tooltip would go off bottom edge (after adjusting for top edge)
          if (top + tooltipHeight > viewportHeight - 20) {
            // Position at bottom edge with margin
            top = viewportHeight - tooltipHeight - 20;
          }
          
          tooltipElement.css({
            left: left + 'px',
            top: top + 'px'
          });
        });
        
        rollElement.on('mouseleave', function() {
          $('#rq3-custom-roll-tooltip').hide();
        });
        
        rollElement.on('mousemove', function(event) {
          const tooltipElement = $('#rq3-custom-roll-tooltip');
          if (tooltipElement.is(':visible')) {
            const mouseX = event.clientX;
            const mouseY = event.clientY;
            const tooltipWidth = tooltipElement.outerWidth();
            const tooltipHeight = tooltipElement.outerHeight();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Default position (top-left of cursor)
            let left = mouseX - tooltipWidth - 15;
            let top = mouseY - tooltipHeight - 15;
            
            // Check if tooltip would go off left edge
            if (left < 20) {
              // Position to the right of cursor
              left = mouseX + 15;
            }
            
            // Check if tooltip would go off top edge
            if (top < 20) {
              // Position below cursor
              top = mouseY + 15;
            }
            
            // Check if tooltip would go off right edge (after adjusting for left edge)
            if (left + tooltipWidth > viewportWidth - 20) {
              // Position at right edge with margin
              left = viewportWidth - tooltipWidth - 20;
            }
            
            // Check if tooltip would go off bottom edge (after adjusting for top edge)
            if (top + tooltipHeight > viewportHeight - 20) {
              // Position at bottom edge with margin
              top = viewportHeight - tooltipHeight - 20;
            }
            
            tooltipElement.css({
              left: left + 'px',
              top: top + 'px'
            });
          }
        });
      }
    });
  }
});

/* -------------------------------------------- */
/*  Actor Sheet Hooks                           */
/* -------------------------------------------- */

Hooks.on("renderActorSheet", (sheet, html, data) => {
  // Add any custom sheet behaviors here
  
  // Add click handlers for characteristic rolls
  html.find(".characteristic-roll").click(async (event) => {
    event.preventDefault();
    const characteristic = event.currentTarget.dataset.characteristic;
    await sheet.actor.rollCharacteristic(characteristic);
  });

  // Skill roll handlers are now handled in actor-sheets.mjs to avoid duplicate rolls
  // Removed duplicate handler that was causing double rolls

  // Add click handlers for general damage buttons
  html.find(".damage-btn").click(async (event) => {
    event.preventDefault();
    const action = event.currentTarget.dataset.action;

    if (!action) return;

    const currentDamage = sheet.actor.system.attributes?.generalDamage || 0;
    let newDamage = currentDamage;

    switch (action) {
      case "increase-general-damage":
        newDamage = Math.max(0, currentDamage + 1);
        break;
      case "decrease-general-damage":
        newDamage = Math.max(0, currentDamage - 1);
        break;
      case "reset-general-damage":
        newDamage = 0;
        break;
      default:
        return;
    }

    try {
      await sheet.actor.update({
        "system.attributes.generalDamage": newDamage
      });
      console.log(`General damage ${action}: ${currentDamage} -> ${newDamage}`);
    } catch (error) {
      console.error("Error updating general damage:", error);
    }
  });

  // Add click handlers for skill training ticks (always available)
  html.find(".skill-training-tick").click(async (event) => {
    event.preventDefault();
    
    const element = event.currentTarget;
    const skillCategory = element.dataset.skillCategory;
    const skillKey = element.dataset.skillKey;
    const isCustom = element.dataset.custom === "true";
    
    try {
      let updatePath;
      let currentValue;
      
      if (isCustom) {
        // Ensure custom skill exists
        const customSkills = sheet.actor.system.customSkills || {};
        const categorySkills = customSkills[skillCategory] || {};
        const skill = categorySkills[skillKey] || {};
        
        updatePath = `system.customSkills.${skillCategory}.${skillKey}.readyForTraining`;
        currentValue = skill.readyForTraining || false;
      } else {
        // Ensure regular skill category and skill exist
        const skills = sheet.actor.system.skills || {};
        const categorySkills = skills[skillCategory] || {};
        const skill = categorySkills[skillKey] || {};
        
        updatePath = `system.skills.${skillCategory}.${skillKey}.readyForTraining`;
        currentValue = skill.readyForTraining || false;
        
        // Initialize skill structure if it doesn't exist
        if (!skills[skillCategory]) {
          await sheet.actor.update({
            [`system.skills.${skillCategory}`]: {}
          });
        }
        if (!skills[skillCategory]?.[skillKey]) {
          await sheet.actor.update({
            [`system.skills.${skillCategory}.${skillKey}`]: { value: 0, readyForTraining: false }
          });
        }
      }
      
      // Toggle the value
      const newValue = !currentValue;
      
      await sheet.actor.update({
        [updatePath]: newValue
      });
      
      // Update the visual state
      if (newValue) {
        element.classList.add('ready-for-training');
      } else {
        element.classList.remove('ready-for-training');
      }
      
      console.log(`Training state toggled for ${skillCategory}.${skillKey}: ${currentValue} -> ${newValue}`);
      
    } catch (error) {
      console.error("Error toggling training state:", error);
    }
  });

  // Add click handlers for characteristic training ticks (always available)
  html.find(".characteristic-training-tick").click(async (event) => {
    event.preventDefault();
    
    const element = event.currentTarget;
    const charKey = element.dataset.characteristicKey;
    
    if (!charKey) {
      console.warn("No characteristic key found on element");
      return;
    }
    
    try {
      // Read current value from visual state first (most reliable)
      const hasReadyClass = element.classList.contains('ready-for-training');
      
      // Also try to read from actor data as backup
      const characteristics = sheet.actor.system.characteristics || {};
      const characteristic = characteristics[charKey] || {};
      const dataValue = characteristic.readyForTraining;
      
      // Use visual state as primary, data as fallback
      let currentValue;
      if (dataValue !== undefined) {
        currentValue = dataValue;
      } else {
        currentValue = hasReadyClass;
      }
      
      const updatePath = `system.characteristics.${charKey}.readyForTraining`;
      
      // Initialize characteristic structure if it doesn't exist (though it should)
      if (!characteristics[charKey]) {
        await sheet.actor.update({
          [`system.characteristics.${charKey}`]: { 
            value: 10, 
            current: 10, 
            readyForTraining: false 
          }
        });
      }
      
      // Toggle the value
      const newValue = !currentValue;
      
      await sheet.actor.update({
        [updatePath]: newValue
      });
      
      // Update the visual state immediately
      if (newValue) {
        element.classList.add('ready-for-training');
      } else {
        element.classList.remove('ready-for-training');
      }
      
      console.log(`Characteristic training state toggled for ${charKey}: ${currentValue} -> ${newValue}`);
      
    } catch (error) {
      console.error("Error toggling characteristic training state:", error);
    }
  });
});

/* -------------------------------------------- */
/*  Item Sheet Hooks                            */
/* -------------------------------------------- */

Hooks.on("renderItemSheet", (sheet, html, data) => {
  // Add click handlers for spell casting
  html.find(".cast-spell").click(async (event) => {
    event.preventDefault();
    await sheet.item.cast();
  });

  // Add click handlers for item usage
  html.find(".use-item").click(async (event) => {
    event.preventDefault();
    await sheet.item.use();
  });
});

/* -------------------------------------------- */
/*  Combat Hooks                                */
/* -------------------------------------------- */

Hooks.on("preCreateCombatant", (combatant, data, options, userId) => {
  // Automatically roll initiative when adding combatants
  if (!data.initiative) {
    const formula = game.settings.get("runequest3", "initiativeFormula");
    const roll = new Roll(formula, combatant.actor.getRollData());
    data.initiative = roll.total;
  }
});

/**
 * Modify the item creation dialog to only show the appropriate type for the compendium
 */
// Hook into dialog rendering to modify item type dropdown
Hooks.on("renderDialogV2", (dialog, html) => {
  // Convert html to jQuery if it isn't already
  const $html = html instanceof jQuery ? html : $(html);
  
  // Check if this is an item creation dialog
  const titleElement = $html.find('.window-title');
  const title = titleElement.text();
  
  console.log("RQ3 | Dialog rendered with title:", title);
  
  if (!title || !title.includes("Create Item")) {
    return;
  }
  
  console.log("RQ3 | This is a Create New Item dialog");
  
  // Get the last opened compendium from our global store
  const packId = game.rq3?.lastOpenedCompendium;
  console.log("RQ3 | Using compendium:", packId);
  
  if (!packId) {
    console.log("RQ3 | No compendium found");
    return;
  }
  
  // Get the actual compendium to check its label
  const pack = game.packs.get(packId);
  if (!pack) {
    console.log("RQ3 | Compendium not found:", packId);
    return;
  }
  
  // Map compendium labels to item types (works for both system and world compendiums)
  const compendiumLabelMap = {
    'Weapons': 'weapon',
    'Armour': 'armor',
    'Armor': 'armor', // Alternative spelling
    'Equipment': 'equipment',
    'Spirit Magic': 'spell',
    'Divine Magic': 'spell',
    'Sorcery': 'spell',
    'Magic': 'spell',
    'Species': 'species',
    'Skills': 'skill'
  };
  
  // Also map system compendium IDs for backward compatibility
  const compendiumIdMap = {
    'runequest3.weapons': 'weapon',
    'runequest3.armour': 'armor',
    'runequest3.equipment': 'equipment',
    'runequest3.spirit-magic': 'spell',
    'runequest3.divine-magic': 'spell',
    'runequest3.sorcery': 'spell',
    'runequest3.species': 'species',
    'runequest3.skills': 'skill'
  };
  
  // Try label first (works for world compendiums), then ID (for system compendiums)
  const defaultType = compendiumLabelMap[pack.metadata.label] || compendiumIdMap[packId];
  
  if (!defaultType) {
    console.log("RQ3 | No default type mapping for", packId, "with label", pack.metadata.label);
    return;
  }
  
  console.log("RQ3 | Setting default type to:", defaultType);
  
  // Find the type select dropdown
  const typeSelect = $html.find('select[name="type"]');
  
  if (typeSelect.length) {
    // Remove all options except the default type
    typeSelect.find('option').each((i, option) => {
      if (option.value !== defaultType) {
        option.remove();
      }
    });
    
    // Set the value and disable the dropdown (since there's only one option)
    typeSelect.val(defaultType);
    typeSelect.prop('disabled', true);
    typeSelect.css('opacity', '0.6');
    
    console.log(`RQ3 | Modified type dropdown to only show '${defaultType}'`);
  } else {
    console.log("RQ3 | Could not find type select dropdown");
  }
});

/* -------------------------------------------- */
/*  Export for debugging                        */
/* -------------------------------------------- */

window.RQ3 = {
  Actor: RQ3Actor,
  Item: RQ3Item,
  dataModels: {
    CharacterDataModel,
    NPCDataModel, 
    CreatureDataModel,
    WeaponDataModel,
    ArmorDataModel,
    SkillDataModel,
    SpellDataModel,
    RuneDataModel,
    EquipmentDataModel,
    SpeciesDataModel
  },
  // Alternative update approach - update existing items instead of recreate
  updateSpeciesData: async function() {
    console.log("RQ3 | Updating species data directly...");
    
    const speciesCompendium = game.packs.get("runequest3.species");
    if (!speciesCompendium) {
      console.error("Species compendium not found!");
      return;
    }

    // Get existing documents
    const existingDocs = await speciesCompendium.getDocuments();
    const humanDoc = existingDocs.find(doc => doc.name === "Human");
    
    if (!humanDoc) {
      console.error("Human species not found in compendium!");
      return;
    }
    
    console.log("Found existing Human species:", humanDoc);
    console.log("Current skills:", humanDoc.system.skills);
    
    // New skills data
    const newSkills = {
      // Agility
      boat: 5,
      climb: 40,
      dodge: 0, // Calculated from DEX
      jump: 25,
      ride: 5,
      swim: 25,
      throw: 25,
      
      // Communication
      fast_talk: 5,
      orate: 10,
      sing: 10,
      speak_own_language: 50,
      speak_other_language: 0,
      
      // Knowledge
      animal_lore: 5,
      evaluate: 5,
      first_aid: 10,
      human_lore: 5,
      mineral_lore: 5,
      plant_lore: 5,
      read_write: 0,
      world_lore: 10,
      
      // Manipulation
      conceal: 5,
      craft: 10,
      devise: 5,
      fine_manipulation: 5,
      play_instrument: 5,
      sleight: 5,
      
      // Perception
      listen: 25,
      scan: 25,
      search: 25,
      track: 5,
      
      // Stealth
      hide: 10,
      sneak: 10
    };
    
    console.log("New skills to apply:", newSkills);
    
    // Update the species item
    try {
      await humanDoc.update({
        'system.skills': newSkills
      });
      
      console.log("Successfully updated Human species!");
      
      // Verify the update
      const updatedDoc = await speciesCompendium.getDocument(humanDoc.id);
      console.log("Updated skills:", updatedDoc.system.skills);
      
      // Test specific skills
      const testSkills = ['boat', 'throw', 'conceal', 'alchemy', 'spirit_lore'];
      console.log("Verification - Specific skills:");
      testSkills.forEach(skill => {
        const value = updatedDoc.system.skills?.[skill];
        console.log(`  ${skill}: ${value} (${typeof value})`);
      });
      
      ui.notifications.info("Successfully updated Human species skills!");
      
    } catch (error) {
      console.error("Error updating species:", error);
      ui.notifications.error(`Failed to update species: ${error.message}`);
    }
  },
  // Debug function to check compendium contents
  checkSpeciesData: async function() {
    console.log("=== CHECKING SPECIES COMPENDIUM DATA ===");
    
    const speciesCompendium = game.packs.get("runequest3.species");
    if (!speciesCompendium) {
      console.error("Species compendium not found!");
      return;
    }
    
    const speciesItems = await speciesCompendium.getDocuments();
    console.log(`Found ${speciesItems.length} species in compendium:`);
    
    speciesItems.forEach(item => {
      console.log(`Species: ${item.name} - Type: ${item.type}`);
      if (item.system.skills) {
        console.log(`  Skills:`, Object.keys(item.system.skills));
      }
    });
    
    console.log("=== END SPECIES COMPENDIUM CHECK ===");
  },
  
  // Debug function to demonstrate armor ENC calculations
  testArmorCalculations: function() {
    console.log("=== ARMOR ENC CALCULATION EXAMPLES ===");
    
    // Test different character sizes with plate armor
    const sizes = [
      { name: "Small (SIZ 8)", siz: 8 },
      { name: "Medium (SIZ 13)", siz: 13 },
      { name: "Large (SIZ 18)", siz: 18 },
      { name: "Troll (SIZ 23)", siz: 23 }
    ];
    
    sizes.forEach(size => {
      console.log(`\n${size.name} - Plate Armor:`);
      
      // Full suit calculation
      const fullSuit = CONFIG.RQ3.calculateArmorProperties("plate", size.siz);
      console.log(`  Full Suit: ${fullSuit.encumbrance} ENC, ${fullSuit.cost}p`);
      
      // Individual pieces
      const cuirass = CONFIG.RQ3.calculateArmorPieceProperties("plate", size.siz, {
        head: 0, leftArm: 0, rightArm: 0, chest: 8, abdomen: 8, leftLeg: 0, rightLeg: 0
      });
      console.log(`  Cuirass (chest+abdomen): ${cuirass.encumbrance} ENC, ${cuirass.cost}p`);
      
      const helm = CONFIG.RQ3.calculateArmorPieceProperties("plate", size.siz, {
        head: 8, leftArm: 0, rightArm: 0, chest: 0, abdomen: 0, leftLeg: 0, rightLeg: 0
      });
      console.log(`  Helm (head only): ${helm.encumbrance} ENC, ${helm.cost}p`);
      
      const vambraces = CONFIG.RQ3.calculateArmorPieceProperties("plate", size.siz, {
        head: 0, leftArm: 8, rightArm: 8, chest: 0, abdomen: 0, leftLeg: 0, rightLeg: 0
      });
      console.log(`  Vambraces (both arms): ${vambraces.encumbrance} ENC, ${vambraces.cost}p`);
    });
    
    console.log("\n=== COMPARISON WITH RULEBOOK EXAMPLE ===");
    const mediumPlate = CONFIG.RQ3.calculateArmorProperties("plate", 13);
    console.log(`Medium character full plate: ${mediumPlate.fullSuitEncumbrance} ENC total`);
    console.log("Hit location breakdown:");
    Object.entries(mediumPlate.hitLocationBreakdown).forEach(([location, data]) => {
      console.log(`  ${location}: ${data.encumbrance} ENC`);
    });
    
    console.log("=== END ARMOR CALCULATIONS ===");
  }
};

/* -------------------------------------------- */
/*  Performance Optimization                     */
/* -------------------------------------------- */

/**
 * Initialize lazy loading for large data structures
 */
function initializeLazyLoading() {
  const startTime = performance.now();
  
  // Mark data as loaded when first accessed
  Object.defineProperty(CONFIG.RQ3, 'skills', {
    get: function() {
      if (!_skillsDataLoaded) {
        _skillsDataLoaded = true;
        const loadTime = performance.now() - startTime;
        console.log(`RQ3 | Skills data loaded on first access (${loadTime.toFixed(2)}ms)`);
      }
      return RQ3_SKILLS;
    },
    configurable: true
  });
  
  Object.defineProperty(CONFIG.RQ3, 'species', {
    get: function() {
      if (!_speciesDataLoaded) {
        _speciesDataLoaded = true;
        console.log("RQ3 | Species data loaded on first access");
      }
      // Load species data from JSON - callers must await this
      return loadCompendiumData('species');
    },
    configurable: true
  });
  
  Object.defineProperty(CONFIG.RQ3, 'magic', {
    get: function() {
      if (!_magicDataLoaded) {
        _magicDataLoaded = true;
        console.log("RQ3 | Magic data loaded on first access");
      }
      // Return a promise that callers must await
      return loadCompendiumData('magic').then(magicData => ({
        spirit: Object.fromEntries(
          Object.entries(magicData).filter(([k, v]) => v.data?.system?.spellType === "spirit")
        ),
        divine: Object.fromEntries(
          Object.entries(magicData).filter(([k, v]) => v.data?.system?.spellType === "divine")
        ),
        sorcery: Object.fromEntries(
          Object.entries(magicData).filter(([k, v]) => v.data?.system?.spellType === "sorcery")
        )
      }));
    },
    configurable: true
  });
  
  Object.defineProperty(CONFIG.RQ3, 'equipment', {
    get: function() {
      if (!_equipmentDataLoaded) {
        _equipmentDataLoaded = true;
        console.log("RQ3 | Equipment data loaded on first access");
      }
      // Return a promise that callers must await
      return Promise.all([
        loadCompendiumData('weapons'),
        loadCompendiumData('armour')
      ]).then(([weapons, armor]) => ({
        weapons,
        armor
      }));
    },
    configurable: true
  });
}