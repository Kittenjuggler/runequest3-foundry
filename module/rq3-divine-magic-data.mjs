/**
 * RuneQuest 3rd Edition Divine Magic Data
 * 
 * This file contains all divine magic spell definitions for the compendium.
 * Each spell includes a version number indicating when it was introduced.
 */

export const RQ3_DIVINE_MAGIC_DATA = {
  "bless": {
    version: "1.0.3",
    data: {
      name: "Bless",
      type: "spell",
      img: "icons/magic/holy/angel-winged-humanoid-blue.webp",
      system: {
        spellType: "divine",
        magicPointCost: 1,
        range: "Touch",
        duration: "1 hour",
        description: "<p>This spell provides the target with a +20% bonus to one specified skill for the duration. The caster must specify which skill when casting.</p>",
        stackable: false,
        deity: "Any",
        runeRequirement: "Power or Form rune at 60%+",
        resist: "None",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  },

  "heal_body": {
    version: "1.0.3",
    data: {
      name: "Heal Body",
      type: "spell",
      img: "icons/magic/life/crosses-trio-green.webp",
      system: {
        spellType: "divine",
        magicPointCost: 3,
        range: "Touch",
        duration: "Instant",
        description: "<p>This spell completely heals all hit point damage to the target. It also heals any broken bones, internal injuries, and other physical trauma.</p>",
        stackable: false,
        deity: "Chalana Arroy, other healing deities",
        runeRequirement: "Harmony rune at 70%+",
        resist: "None",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  },

  "lightning": {
    version: "1.0.3",
    data: {
      name: "Lightning",
      type: "spell",
      img: "icons/magic/lightning/bolt-strike-blue.webp",
      system: {
        spellType: "divine",
        magicPointCost: 3,
        range: "100 meters",
        duration: "Instant",
        description: "<p>This spell creates a bolt of lightning that strikes the target for 3d6 damage. The target may attempt to dodge. Metal armor provides no protection.</p>",
        stackable: false,
        deity: "Orlanth, other storm deities",
        runeRequirement: "Air rune at 70%+",
        resist: "Dodge only",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  },

  "shield": {
    version: "1.0.3",
    data: {
      name: "Shield",
      type: "spell",
      img: "icons/magic/defensive/shield-barrier-blue.webp",
      system: {
        spellType: "divine",
        magicPointCost: 2,
        range: "Touch",
        duration: "10 minutes",
        description: "<p>This spell provides 6 points of magical armor that protects against both physical and magical attacks. This armor does not encumber the target.</p>",
        stackable: false,
        deity: "Any protective deity",
        runeRequirement: "Protection rune at 60%+",
        resist: "None",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  },

  "fear": {
    version: "1.0.3",
    data: {
      name: "Fear",
      type: "spell",
      img: "icons/magic/unholy/strike-beam-blood-red.webp",
      system: {
        spellType: "divine",
        magicPointCost: 2,
        range: "50 meters",
        duration: "10 minutes",
        description: "<p>This spell causes the target to become frightened and must make a POW vs POW resistance roll or flee for the duration.</p>",
        stackable: false,
        deity: "Death or Disorder deities",
        runeRequirement: "Death or Disorder rune at 60%+",
        resist: "POW vs POW",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  },

  "command": {
    version: "1.0.3",
    data: {
      name: "Command (Cult Spirit)",
      type: "spell",
      img: "icons/magic/control/control-influence-puppet.webp",
      system: {
        spellType: "divine",
        magicPointCost: 1,
        range: "100 meters",
        duration: "10 minutes",
        description: "<p>This spell allows the caster to command a spirit associated with their cult. The spirit must make a POW vs POW resistance roll or obey simple commands.</p>",
        stackable: false,
        deity: "Any (spirit must be associated with cult)",
        runeRequirement: "Appropriate cult rune at 60%+",
        resist: "POW vs POW (spirit)",
        components: "Holy symbol",
        castingTime: "1 round"
      }
    }
  }
}; 