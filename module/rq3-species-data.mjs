/**
 * RuneQuest 3rd Edition Species Data
 * 
 * This file contains all species definitions for the compendium.
 * Each species includes a version number indicating when it was introduced.
 * 
 * When adding new species:
 * 1. Add the species data here with the appropriate version
 * 2. Update the system version in system.json
 * 3. The migration system will automatically add new species to existing worlds
 */

export const RQ3_SPECIES_DATA = {
  "human": {
    version: "1.0.3",
    data: {
      name: "Human",
      type: "species",
      img: "icons/environment/people/group.webp",
      system: {
        description: "<p>Humans are the most common and adaptable of all sentient species in Glorantha. They are versatile, ambitious, and found in nearly every corner of the world.</p><p>Humans form the backbone of most civilizations and are known for their diverse cultures, beliefs, and occupations. They are neither the strongest nor the wisest of species, but their adaptability and determination often see them succeed where others fail.</p>",
        type: "humanoid",
        averageHeight: "1.7m",
        averageWeight: "70kg",
        averageSize: { min: 8, max: 18 },
        characteristicMods: { str: 0, con: 0, siz: 0, int: 0, pow: 0, dex: 0, app: 0 },
        movement: { walk: 8, run: 24 },
        naturalArmor: 0,
        naturalWeapons: [],
        traits: ["Adaptable", "Ambitious", "Diverse"],
        abilities: "<p><strong>Adaptability:</strong> Humans gain a +10% bonus to any skill when first learning it.</p><p><strong>Cultural Diversity:</strong> Humans can choose from any cultural background without penalty.</p><p><strong>Determination:</strong> Once per session, a human character may reroll a failed skill roll.</p>",
        culture: {
          homeland: "Varies by region",
          language: "Common (varies by homeland)",
          commonOccupations: ["Farmer", "Warrior", "Merchant", "Crafter", "Scholar", "Priest"],
          commonCults: ["Orlanth", "Ernalda", "Humakt", "Issaries", "Lhankor Mhy", "Chalana Arroy"]
        },
        lifespan: { maturity: 18, prime: 40, old: 60, venerable: 80 },
        skills: {
          // Agility
          boat: 5,
          climb: 40,
          dodge: 25,
          jump: 25,
          ride: 5,
          swim: 15,
          throw: 25,
          
          // Communication
          fast_talk: 5,
          orate: 5,
          sing: 5,
          speak_own_language: 30,
          speak_trade_talk: 20,
          
          // Knowledge
          animal_lore: 5,
          evaluate: 5,
          first_aid: 10,
          human_lore: 5,
          mineral_lore: 5,
          plant_lore: 5,
          read_write: 0,
          shiphandling: 0,
          world_lore: 10,
          
          // Manipulation
          conceal: 5,
          devise: 5,
          play_instrument: 5,
          sleight: 5,
          
          // Perception
          listen: 5,
          scan: 25,
          search: 25,
          track: 5,
          
          // Stealth
          hide: 10,
          sneak: 10
        },
        price: { value: 0, currency: "lunars" },
        weight: 0,
        quantity: 1
      }
    }
  },

  "elf": {
    version: "1.1.0",
    data: {
      name: "Elf",
      type: "species",
      img: "icons/environment/people/elf.webp",
      system: {
        description: "<p>Elves are an ancient and mystical species, deeply connected to nature and magic...</p>",
        type: "humanoid",
        averageHeight: "1.8m",
        averageWeight: "65kg",
        averageSize: { min: 6, max: 16 },
        characteristicMods: { str: -1, con: 0, siz: -1, int: +1, pow: +2, dex: +1, app: +1 },
        movement: { walk: 8, run: 26 },
        naturalArmor: 0,
        naturalWeapons: [],
        traits: ["Magical Affinity", "Forest Dweller", "Long-lived"],
        abilities: "<p><strong>Magic Sense:</strong> Elves can detect magic within 100m...</p>",
        culture: {
          homeland: "Enchanted Forests",
          language: "Elvish",
          commonOccupations: ["Forest Guardian", "Magician", "Scout", "Healer"],
          commonCults: ["Aldrya", "Ernalda", "Orlanth"]
        },
        lifespan: { maturity: 40, prime: 200, old: 400, venerable: 600 },
        skills: {
          // Agility - Elves are naturally agile
          climb: 50,
          dodge: 0,
          jump: 35,
          ride: 15,
          swim: 20,
          
          // Communication - Elves are often artistic
          fast_talk: 10,
          orate: 20,
          sing: 25,
          speak_own_language: 60,
          
          // Knowledge - High magical and natural knowledge
          animal_lore: 20,
          evaluate: 10,
          first_aid: 15,
          human_lore: 10,
          mineral_lore: 0,
          plant_lore: 25,
          read_write: 15,
          world_lore: 15,
          
          // Manipulation - Skilled crafters
          devise: 15,
          fine_manipulation: 15,
          play_instrument: 20,
          sleight: 10,
          
          // Perception - Excellent senses
          listen: 40,
          scan: 35,
          search: 30,
          track: 15,
          
          // Stealth - Forest dwellers
          hide: 25,
          sneak: 25
        },
        price: { value: 0, currency: "lunars" },
        weight: 0,
        quantity: 1
      }
    }
  },

  "dwarf": {
    version: "1.1.0", 
    data: {
      name: "Dwarf",
      type: "species",
      img: "icons/environment/people/dwarf.webp",
      system: {
        description: "<p>Dwarfs are a sturdy and industrious species, masters of craft and earth magic...</p>",
        type: "humanoid",
        averageHeight: "1.4m", 
        averageWeight: "80kg",
        averageSize: { min: 8, max: 16 },
        characteristicMods: { str: +1, con: +2, siz: -2, int: 0, pow: 0, dex: -1, app: -1 },
        movement: { walk: 6, run: 18 },
        naturalArmor: 1,
        naturalWeapons: [],
        traits: ["Craft Mastery", "Earth Affinity", "Stubborn"],
        abilities: "<p><strong>Craft Bonus:</strong> +20% to all crafting skills...</p>",
        culture: {
          homeland: "Underground Cities",
          language: "Dwarvish",
          commonOccupations: ["Smith", "Miner", "Engineer", "Warrior"],
          commonCults: ["Mostal", "Flintnail", "Gustbran"]
        },
        lifespan: { maturity: 25, prime: 80, old: 150, venerable: 200 },
        skills: {
          // Agility - Dwarfs are less agile
          climb: 30,
          dodge: 0,
          jump: 15,
          ride: 0,
          swim: 15,
          
          // Communication - Practical but not eloquent
          fast_talk: 0,
          orate: 5,
          sing: 15,
          speak_own_language: 50,
          
          // Knowledge - High craft and earth knowledge
          animal_lore: 0,
          evaluate: 15,
          first_aid: 5,
          human_lore: 0,
          mineral_lore: 25,
          plant_lore: 0,
          read_write: 10,
          world_lore: 5,
          
          // Manipulation - Master crafters
          devise: 20,
          fine_manipulation: 20,
          play_instrument: 10,
          sleight: 0,
          
          // Perception - Underground dwellers
          listen: 30,
          scan: 20,
          search: 30,
          track: 0,
          
          // Stealth - Not naturally stealthy
          hide: 5,
          sneak: 5
        },
        price: { value: 0, currency: "lunars" },
        weight: 0,
        quantity: 1
      }
    }
  }
}; 