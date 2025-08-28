/**
 * RuneQuest 3rd Edition Sorcery Data
 * 
 * This file contains all sorcery spell definitions for the compendium.
 * Each spell includes a version number indicating when it was introduced.
 */

export const RQ3_SORCERY_DATA = {
  "mystic_vision": {
    version: "1.0.3",
    data: {
      name: "Mystic Vision",
      type: "spell",
      img: "icons/magic/perception/eye-ringed-green.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 1,
        range: "Personal",
        duration: "10 minutes",
        description: "<p>This spell allows the sorcerer to see magical auras, enchanted items, and active spells. The intensity of the aura indicates the power level.</p>",
        manipulation: {
          intensity: "Add +1d6 to detection rolls per level",
          duration: "Double duration per level",
          range: "Not applicable"
        },
        resist: "None",
        components: "Concentration",
        castingTime: "1 round",
        skill: "Insight"
      }
    }
  },

  "protective_circle": {
    version: "1.0.3",
    data: {
      name: "Protective Circle",
      type: "spell",
      img: "icons/magic/defensive/barrier-triangle-blue.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 3,
        range: "Touch",
        duration: "1 hour",
        description: "<p>This spell creates a protective barrier with 10 points of magical armor against all attacks. The barrier extends in a 3-meter radius circle.</p>",
        manipulation: {
          intensity: "Add +5 armor points per level",
          duration: "Double duration per level",
          range: "Add +1 meter radius per level"
        },
        resist: "None",
        components: "Circle drawn with blessed chalk",
        castingTime: "10 minutes",
        skill: "Ward"
      }
    }
  },

  "fly": {
    version: "1.0.3",
    data: {
      name: "Fly",
      type: "spell",
      img: "icons/magic/movement/wing-feathered-blue.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 5,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell allows the target to fly at their normal movement rate. The target can ascend or descend at half movement rate.</p>",
        manipulation: {
          intensity: "Not applicable",
          duration: "Double duration per level",
          range: "Can affect additional targets (1 per level)"
        },
        resist: "None",
        components: "Feather from a flying creature",
        castingTime: "1 round",
        skill: "Transport"
      }
    }
  },

  "teleport": {
    version: "1.0.3",
    data: {
      name: "Teleport",
      type: "spell",
      img: "icons/magic/movement/trail-streak-impact-blue.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 10,
        range: "Personal",
        duration: "Instant",
        description: "<p>This spell instantly transports the sorcerer up to 100 meters to any location they can see or have visited before.</p>",
        manipulation: {
          intensity: "Not applicable",
          duration: "Not applicable",
          range: "Double range per level, can bring others (1 per level)"
        },
        resist: "None",
        components: "Piece of the destination location",
        castingTime: "3 rounds",
        skill: "Transport"
      }
    }
  },

  "dominate": {
    version: "1.0.3",
    data: {
      name: "Dominate (Species)",
      type: "spell",
      img: "icons/magic/control/hypnosis-mesmerism-eye.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 8,
        range: "50 meters",
        duration: "1 hour",
        description: "<p>This spell allows the sorcerer to control the actions of a target of the specified species (Human, Elf, etc.). The target must make a POW vs POW resistance roll.</p>",
        manipulation: {
          intensity: "Add +10 to caster's POW per level",
          duration: "Double duration per level",
          range: "Double range per level"
        },
        resist: "POW vs POW",
        components: "Hair or blood from target species",
        castingTime: "5 rounds",
        skill: "Control"
      }
    }
  },

  "animate": {
    version: "1.0.3",
    data: {
      name: "Animate (Substance)",
      type: "spell",
      img: "icons/magic/unholy/hand-claw-fog-green.webp",
      system: {
        spellType: "sorcery",
        magicPointCost: 6,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell animates up to 10 SIZ points of the specified substance (Stone, Wood, Metal, etc.) giving it basic movement and the ability to follow simple commands.</p>",
        manipulation: {
          intensity: "Add +5 SIZ points per level",
          duration: "Double duration per level",
          range: "Can animate at distance (10m per level)"
        },
        resist: "None",
        components: "Sample of the substance to be animated",
        castingTime: "1 round",
        skill: "Animate"
      }
    }
  }
}; 