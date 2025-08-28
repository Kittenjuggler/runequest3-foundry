/**
 * RuneQuest 3rd Edition Spirit Magic Data
 * 
 * This file contains all spirit magic spell definitions for the compendium.
 * Each spell includes a version number indicating when it was introduced.
 */

export const RQ3_SPIRIT_MAGIC_DATA = {
  "bladesharp": {
    version: "1.0.3",
    data: {
      name: "Bladesharp",
      type: "spell",
      img: "icons/weapons/swords/sword-guard-blue.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell increases the damage done by any edged weapon by +1 point per point of magic invested. The spell affects only edged weapons such as swords, axes, spears, daggers, etc. It does not affect clubs, maces, or missile weapons.</p>",
        stackable: true,
        maxPoints: 4,
        resist: "None",
        components: "None",
        castingTime: "1 round"
      }
    }
  },

  "mobility": {
    version: "1.0.3", 
    data: {
      name: "Mobility",
      type: "spell",
      img: "icons/magic/movement/trail-streak-zigzag-yellow.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell increases the target's movement rate by +1 meter per point of magic invested in the spell.</p>",
        stackable: true,
        maxPoints: 10,
        resist: "None",
        components: "None",
        castingTime: "1 round"
      }
    }
  },

  "protection": {
    version: "1.0.3",
    data: {
      name: "Protection",
      type: "spell", 
      img: "icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell provides 1 point of magical armor per point of magic invested. This armor is effective against both physical and magical attacks. It does not encumber the target.</p>",
        stackable: true,
        maxPoints: 6,
        resist: "None",
        components: "None", 
        castingTime: "1 round"
      }
    }
  },

  "speedart": {
    version: "1.0.3",
    data: {
      name: "Speedart",
      type: "spell",
      img: "icons/weapons/thrown/dart-triple-glowing-green.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch",
        duration: "Instant",
        description: "<p>This spell creates a magical dart that does 1d3 damage per point of magic invested. The dart automatically hits its target within range of 100 meters. Armor protects normally.</p>",
        stackable: true,
        maxPoints: 10,
        resist: "None",
        components: "None",
        castingTime: "1 round"
      }
    }
  },

  "strength": {
    version: "1.0.3",
    data: {
      name: "Strength",
      type: "spell",
      img: "icons/magic/symbols/runes-carved-stone-red.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch", 
        duration: "10 minutes",
        description: "<p>This spell increases the target's STR characteristic by +1 point per point of magic invested. This can affect damage bonuses, skill percentages, and other STR-based calculations.</p>",
        stackable: true,
        maxPoints: 10,
        resist: "None",
        components: "None",
        castingTime: "1 round"
      }
    }
  },

  "heal": {
    version: "1.0.3",
    data: {
      name: "Heal",
      type: "spell",
      img: "icons/magic/life/heart-cross-strong-green.webp",
      system: {
        spellType: "spirit",
        magicPointCost: 1,
        range: "Touch",
        duration: "Instant",
        description: "<p>This spell heals 1d3 hit points per point of magic invested. It cannot heal more damage than the target has actually taken.</p>",
        stackable: true,
        maxPoints: 10,
        resist: "None",
        components: "None",
        castingTime: "1 round"
      }
    }
  }
}; 