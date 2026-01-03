/**
 * RuneQuest 3rd Edition Weapons Data
 * 
 * This file contains all weapon definitions for the compendium.
 * Each weapon includes a version number indicating when it was introduced.
 * 
 * Ancient World Weapons - European and Mediterranean
 * Based on Ancient World Weapons.pdf
 */

export const RQ3_WEAPONS_DATA = {
  // ========================================
  // MELEE WEAPONS - AXES (1-HANDED)
  // ========================================
  
  "hatchet": {
    version: "1.0.6",
    data: {
      name: "Hatchet",
      type: "weapon",
      img: "icons/weapons/axes/axe-hand-simple.webp",
      system: {
        weaponType: "axe",
        quantity: 1,
        price: 25,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 9,
          baseSkill: 10,
          armor: 6,
          strikeRank: 2,
          impale: false
        },
        description: "A small hand axe, useful as both tool and weapon."
      }
    }
  },

  "sapergis": {
    version: "1.0.6",
    data: {
      name: "Sapergis (Battle Axe)",
      type: "weapon",
      img: "icons/weapons/axes/axe-battle-worn.webp",
      system: {
        weaponType: "axe",
        quantity: 1,
        price: 100,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 9,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Greek battle axe, also known as Epsilon. Can be wielded with one or two hands."
      }
    }
  },

  "epsilon": {
    version: "1.0.6",
    data: {
      name: "Epsilon (Battle Axe)",
      type: "weapon",
      img: "icons/weapons/axes/axe-battle-worn.webp",
      system: {
        weaponType: "axe",
        quantity: 1,
        price: 100,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 9,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Greek battle axe, also known as Sapergis. Can be wielded with one or two hands."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - AXES (2-HANDED)
  // ========================================

  "dolobra": {
    version: "1.0.6",
    data: {
      name: "Dolobra (Mattock)",
      type: "weapon",
      img: "icons/weapons/axes/axe-broad-engraved.webp",
      system: {
        weaponType: "axe",
        quantity: 1,
        price: 40,
        encumbrance: 2.0,
        melee2Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "A heavy two-handed mattock, primarily a tool but effective as a weapon."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - HAMMERS (1-HANDED)
  // ========================================

  "tabar": {
    version: "1.0.6",
    data: {
      name: "Tabar (War Hammer/Pick)",
      type: "weapon",
      img: "icons/weapons/hammers/hammer-war-spiked.webp",
      system: {
        weaponType: "hammer",
        quantity: 1,
        price: 100,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6+2",
          minStrength: 11,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "A war hammer with a pick on the reverse, designed to pierce armor."
      }
    }
  },

  "mallet": {
    version: "1.0.6",
    data: {
      name: "Mallet",
      type: "weapon",
      img: "icons/weapons/hammers/hammer-wooden-round.webp",
      system: {
        weaponType: "hammer",
        quantity: 1,
        price: 2,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 6,
          strikeRank: 3,
          impale: false
        },
        description: "A wooden mallet, more tool than weapon but serviceable in a pinch."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - DAGGERS
  // ========================================

  "pugio": {
    version: "1.0.6",
    data: {
      name: "Pugio (Dagger)",
      type: "weapon",
      img: "icons/weapons/daggers/dagger-straight-steel.webp",
      system: {
        weaponType: "dagger",
        quantity: 1,
        price: 20,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d4+2",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 15,
          armor: 6,
          strikeRank: 3,
          impale: true
        },
        description: "Roman dagger, also known as Acinaces. Can impale."
      }
    }
  },

  "acinaces_short": {
    version: "1.0.6",
    data: {
      name: "Acinaces (Short Dagger)",
      type: "weapon",
      img: "icons/weapons/daggers/dagger-straight-steel.webp",
      system: {
        weaponType: "dagger",
        quantity: 1,
        price: 20,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d4+2",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 15,
          armor: 6,
          strikeRank: 3,
          impale: true
        },
        description: "Persian short dagger, also known as Pugio. Can impale."
      }
    }
  },

  "custro": {
    version: "1.0.6",
    data: {
      name: "Custro (Knife)",
      type: "weapon",
      img: "icons/weapons/daggers/dagger-curved-worn.webp",
      system: {
        weaponType: "dagger",
        quantity: 1,
        price: 10,
        encumbrance: 0.2,
        melee1Handed: {
          enabled: true,
          damage: "1d3+1",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 15,
          armor: 4,
          strikeRank: 3,
          impale: false
        },
        description: "A simple knife, useful for everyday tasks and close combat."
      }
    }
  },

  "sica": {
    version: "1.0.6",
    data: {
      name: "Sica",
      type: "weapon",
      img: "icons/weapons/daggers/dagger-curved-blue.webp",
      system: {
        weaponType: "dagger",
        quantity: 1,
        price: 30,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d3+2",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 25,
          armor: 6,
          strikeRank: 3,
          impale: false
        },
        description: "A curved dagger favored by Thracian gladiators."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - FIST WEAPONS
  // ========================================

  "cestus_heavy": {
    version: "1.0.6",
    data: {
      name: "Cestus (Heavy)",
      type: "weapon",
      img: "icons/equipment/hand/gauntlet-armored-steel.webp",
      system: {
        weaponType: "fist",
        quantity: 1,
        price: 100,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d3+2",
          minStrength: 9,
          minDexterity: 0,
          baseSkill: 15,
          armor: 8,
          strikeRank: 3,
          impale: false
        },
        description: "Heavy leather straps with metal studs or plates, worn by gladiators."
      }
    }
  },

  "cestus_light": {
    version: "1.0.6",
    data: {
      name: "Cestus (Light)",
      type: "weapon",
      img: "icons/equipment/hand/gauntlet-leather-brown.webp",
      system: {
        weaponType: "fist",
        quantity: 1,
        price: 100,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d3+1",
          minStrength: 7,
          minDexterity: 0,
          baseSkill: 15,
          armor: 4,
          strikeRank: 3,
          impale: false
        },
        description: "Light leather wraps with minimal reinforcement for boxing."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - MACES (1-HANDED)
  // ========================================

  "garz_short": {
    version: "1.0.6",
    data: {
      name: "Garz (Light Mace)",
      type: "weapon",
      img: "icons/weapons/maces/mace-round-flanged.webp",
      system: {
        weaponType: "mace",
        quantity: 1,
        price: 80,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 15,
          armor: 6,
          strikeRank: 2,
          impale: false
        },
        description: "A light mace, also known as Tukul. Effective against armor."
      }
    }
  },

  "tukul_short": {
    version: "1.0.6",
    data: {
      name: "Tukul (Light Mace)",
      type: "weapon",
      img: "icons/weapons/maces/mace-round-flanged.webp",
      system: {
        weaponType: "mace",
        quantity: 1,
        price: 80,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 15,
          armor: 6,
          strikeRank: 2,
          impale: false
        },
        description: "A light mace, also known as Garz. Effective against armor."
      }
    }
  },

  "garz_long": {
    version: "1.0.6",
    data: {
      name: "Garz (Heavy Mace)",
      type: "weapon",
      img: "icons/weapons/maces/mace-round-spiked.webp",
      system: {
        weaponType: "mace",
        quantity: 1,
        price: 100,
        encumbrance: 2.5,
        melee1Handed: {
          enabled: true,
          damage: "1d10",
          minStrength: 13,
          minDexterity: 7,
          baseSkill: 15,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d10",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "A heavy mace with a long haft, devastating against armored foes. Can be wielded with one or two hands."
      }
    }
  },

  "tukul_long": {
    version: "1.0.6",
    data: {
      name: "Tukul (Heavy Mace)",
      type: "weapon",
      img: "icons/weapons/maces/mace-round-spiked.webp",
      system: {
        weaponType: "mace",
        quantity: 1,
        price: 100,
        encumbrance: 2.5,
        melee1Handed: {
          enabled: true,
          damage: "1d10",
          minStrength: 13,
          minDexterity: 7,
          baseSkill: 15,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d10",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "A heavy mace with a long haft, also known as Garz. Devastating against armored foes. Can be wielded with one or two hands."
      }
    }
  },

  "club_light": {
    version: "1.0.6",
    data: {
      name: "Club (Light)",
      type: "weapon",
      img: "icons/weapons/clubs/club-simple-wood.webp",
      system: {
        weaponType: "club",
        quantity: 1,
        price: 2,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 7,
          baseSkill: 15,
          armor: 5,
          strikeRank: 2,
          impale: false
        },
        description: "A simple wooden club, the weapon of the poor."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - MACES (2-HANDED)
  // ========================================


  "maul": {
    version: "1.0.6",
    data: {
      name: "Maul (Work)",
      type: "weapon",
      img: "icons/weapons/hammers/hammer-double-steel.webp",
      system: {
        weaponType: "mace",
        quantity: 1,
        price: 5,
        encumbrance: 4.4,
        melee2Handed: {
          enabled: true,
          damage: "1d8",
          minStrength: 13,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "A heavy work maul, cumbersome but powerful."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - SHIELDS
  // ========================================

  "parmula": {
    version: "1.0.6",
    data: {
      name: "Parmula (Buckler)",
      type: "weapon",
      img: "icons/equipment/shield/buckler-wooden-round.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 50,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d4",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 10,
          armor: 12,
          strikeRank: 3,
          impale: false
        },
        description: "Small shield or buckler, also known as Pelta."
      }
    }
  },

  "pelta": {
    version: "1.0.6",
    data: {
      name: "Pelta (Small Shield)",
      type: "weapon",
      img: "icons/equipment/shield/buckler-wooden-round.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 50,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d4",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 10,
          armor: 12,
          strikeRank: 3,
          impale: false
        },
        description: "Small shield or buckler, also known as Parmula."
      }
    }
  },

  "parma": {
    version: "1.0.6",
    data: {
      name: "Parma (Medium Shield)",
      type: "weapon",
      img: "icons/equipment/shield/heater-steel-worn.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 60,
        encumbrance: 3.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 9,
          minDexterity: 0,
          baseSkill: 15,
          armor: 12,
          strikeRank: 3,
          impale: false
        },
        description: "Medium-sized shield, also known as Telamon."
      }
    }
  },

  "telamon": {
    version: "1.0.6",
    data: {
      name: "Telamon (Medium Shield)",
      type: "weapon",
      img: "icons/equipment/shield/heater-steel-worn.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 60,
        encumbrance: 3.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 9,
          minDexterity: 0,
          baseSkill: 15,
          armor: 12,
          strikeRank: 3,
          impale: false
        },
        description: "Medium-sized shield, also known as Parma."
      }
    }
  },

  "scutum": {
    version: "1.0.6",
    data: {
      name: "Scutum (Large Shield)",
      type: "weapon",
      img: "icons/equipment/shield/tower-steel-blue.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 100,
        encumbrance: 7.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 10,
          minDexterity: 0,
          baseSkill: 15,
          armor: 12,
          strikeRank: 3,
          impale: false
        },
        description: "Large Roman shield, light for its size."
      }
    }
  },

  "aspis": {
    version: "1.0.6",
    data: {
      name: "Aspis (Hoplite Shield)",
      type: "weapon",
      img: "icons/equipment/shield/round-wooden-boss-steel.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 150,
        encumbrance: 10.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 12,
          minDexterity: 0,
          baseSkill: 15,
          armor: 18,
          strikeRank: 3,
          impale: false
        },
        description: "Heavy Greek hoplite shield, also known as Clipaeus."
      }
    }
  },

  "clipaeus": {
    version: "1.0.6",
    data: {
      name: "Clipaeus (Large Shield)",
      type: "weapon",
      img: "icons/equipment/shield/round-wooden-boss-steel.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 150,
        encumbrance: 10.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 12,
          minDexterity: 0,
          baseSkill: 15,
          armor: 18,
          strikeRank: 3,
          impale: false
        },
        description: "Heavy Roman shield, also known as Aspis."
      }
    }
  },

  "unrimmed_shield": {
    version: "1.0.6",
    data: {
      name: "Unrimmed Shield (Basic)",
      type: "weapon",
      img: "icons/equipment/shield/round-wooden-boss.webp",
      system: {
        weaponType: "shield",
        quantity: 1,
        price: 40,
        encumbrance: 4.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 15,
          armor: 10,
          strikeRank: 3,
          impale: false
        },
        description: "A basic large shield without metal rim reinforcement."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - SPEARS (1-HANDED)
  // ========================================

  "hasta": {
    version: "1.0.6",
    data: {
      name: "Hasta (Short Spear)",
      type: "weapon",
      img: "icons/weapons/polearms/spear-simple-short.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 20,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 0,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        description: "Roman short spear. Can be wielded with one or two hands. Can impale."
      }
    }
  },

  "pilum": {
    version: "1.0.6",
    data: {
      name: "Pilum (Heavy Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-simple.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 50,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 10,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 1
        },
        description: "Heavy Roman javelin with long metal shank, also known as Falarica. Can be used in melee or thrown. Can impale."
      }
    }
  },

  "falarica": {
    version: "1.0.6",
    data: {
      name: "Falarica (Heavy Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-simple.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 50,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 10,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 1
        },
        description: "Heavy Iberian javelin with long metal shank, also known as Pilum. Can be used in melee or thrown. Can impale."
      }
    }
  },

  "soliferrum": {
    version: "1.0.6",
    data: {
      name: "Soliferrum (All-Iron Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-metal.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 150,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 12,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 10,
          armor: 12,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 12,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 15,
          rof: 1
        },
        description: "Iberian all-metal javelin, also known as Saunion. Feared for armor penetration. Can be used in melee or thrown. Can impale."
      }
    }
  },

  "saunion": {
    version: "1.0.6",
    data: {
      name: "Saunion (All-Iron Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-metal.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 150,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 12,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 10,
          armor: 12,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 12,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 15,
          rof: 1
        },
        description: "Iberian all-metal javelin, also known as Soliferrum. Feared for armor penetration. Can be used in melee or thrown. Can impale."
      }
    }
  },

  "trident_fishing": {
    version: "1.0.6",
    data: {
      name: "Trident (Fishing)",
      type: "weapon",
      img: "icons/weapons/polearms/trident-simple.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 20,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d4+1",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 5,
          armor: 6,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d4+1",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 10,
          armor: 6,
          strikeRank: 2,
          impale: false
        },
        description: "A fishing trident, improvised as a weapon."
      }
    }
  },

  "trident_war": {
    version: "1.0.6",
    data: {
      name: "Trident (War/Gladiatorial)",
      type: "weapon",
      img: "icons/weapons/polearms/trident-steel.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 100,
        encumbrance: 2.2,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 9,
          minDexterity: 11,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        melee2Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 9,
          minDexterity: 11,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "War trident used by gladiators, heavier and more deadly than fishing tridents."
      }
    }
  },

  "veretum": {
    version: "1.0.6",
    data: {
      name: "Veretum (Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-simple-wood.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 30,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 0,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 1
        },
        description: "Standard javelin, also known as Gabalum. Can be used in melee or thrown. Can impale."
      }
    }
  },

  "gabalum": {
    version: "1.0.6",
    data: {
      name: "Gabalum (Javelin)",
      type: "weapon",
      img: "icons/weapons/polearms/javelin-simple-wood.webp",
      system: {
        weaponType: "javelin",
        quantity: 1,
        price: 30,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        melee2Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 0,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: true
        },
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 1
        },
        description: "Standard javelin, also known as Veretum. Can be used in melee or thrown. Can impale."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - SPEARS (2-HANDED)
  // ========================================

  "dory": {
    version: "1.0.6",
    data: {
      name: "Dory (Long Spear)",
      type: "weapon",
      img: "icons/weapons/polearms/spear-simple-long.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 30,
        encumbrance: 3.0,
        melee2Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 1,
          impale: true
        },
        description: "Greek long spear, the primary weapon of hoplites. Can impale."
      }
    }
  },

  "kontos": {
    version: "1.0.6",
    data: {
      name: "Kontos (Mounted Spear)",
      type: "weapon",
      img: "icons/weapons/polearms/lance-steel-blue.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 100,
        encumbrance: 3.5,
        melee2Handed: {
          enabled: true,
          damage: "1d10+1",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 10,
          strikeRank: 0,
          impale: true
        },
        description: "Heavy cavalry lance. Cannot parry. Can only be used from horseback. Can impale."
      }
    }
  },


  "sarissa": {
    version: "1.0.6",
    data: {
      name: "Sarissa (Pike)",
      type: "weapon",
      img: "icons/weapons/polearms/pike-simple-steel.webp",
      system: {
        weaponType: "spear",
        quantity: 1,
        price: 65,
        encumbrance: 4.0,
        melee2Handed: {
          enabled: true,
          damage: "2d6+2",
          minStrength: 11,
          minDexterity: 7,
          baseSkill: 10,
          armor: 10,
          strikeRank: 0,
          impale: true
        },
        description: "Macedonian pike, 4-6 meters long. Pike block only. Can impale."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - SWORDS (1-HANDED)
  // ========================================

  "falcata": {
    version: "1.0.6",
    data: {
      name: "Falcata",
      type: "weapon",
      img: "icons/weapons/swords/sword-curved-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 175,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6+2",
          minStrength: 7,
          minDexterity: 11,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Iberian curved sword, also known as Kopis or Machaeira. Can impale."
      }
    }
  },

  "kopis": {
    version: "1.0.6",
    data: {
      name: "Kopis",
      type: "weapon",
      img: "icons/weapons/swords/sword-curved-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 175,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6+2",
          minStrength: 7,
          minDexterity: 11,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Greek curved sword, also known as Falcata or Machaeira. Can impale."
      }
    }
  },

  "machaeira": {
    version: "1.0.6",
    data: {
      name: "Machaeira",
      type: "weapon",
      img: "icons/weapons/swords/sword-curved-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 175,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6+2",
          minStrength: 7,
          minDexterity: 11,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Greek curved sword, also known as Falcata or Kopis. Can impale."
      }
    }
  },

  "falx_short": {
    version: "1.0.6",
    data: {
      name: "Falx (Short)",
      type: "weapon",
      img: "icons/weapons/swords/scimitar-worn.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 90,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 9,
          baseSkill: 10,
          armor: 10,
          strikeRank: 3,
          impale: true
        },
        description: "Short Dacian curved sword, also known as Harpe. Can impale."
      }
    }
  },

  "harpe": {
    version: "1.0.6",
    data: {
      name: "Harpe",
      type: "weapon",
      img: "icons/weapons/swords/scimitar-worn.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 90,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 7,
          minDexterity: 9,
          baseSkill: 10,
          armor: 10,
          strikeRank: 3,
          impale: true
        },
        description: "Greek curved sword, also known as short Falx. Can impale."
      }
    }
  },

  "falx_agricultural": {
    version: "1.0.6",
    data: {
      name: "Falx (Agricultural)",
      type: "weapon",
      img: "icons/tools/farming/sickle-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 60,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 8,
          strikeRank: 3,
          impale: false
        },
        description: "Agricultural hedging hook, improvised as a weapon."
      }
    }
  },

  "gladius": {
    version: "1.0.6",
    data: {
      name: "Gladius",
      type: "weapon",
      img: "icons/weapons/swords/sword-short-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 100,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Roman short sword, also known as Xiphos or Acinaces. Can impale. Does 1d6+1 when cutting."
      }
    }
  },

  "xiphos": {
    version: "1.0.6",
    data: {
      name: "Xiphos",
      type: "weapon",
      img: "icons/weapons/swords/sword-short-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 100,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Greek short sword, also known as Gladius or Acinaces. Can impale. Does 1d6+1 when cutting."
      }
    }
  },

  "acinaces_long": {
    version: "1.0.6",
    data: {
      name: "Acinaces (Long)",
      type: "weapon",
      img: "icons/weapons/swords/sword-short-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 100,
        encumbrance: 1.5,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Persian short sword, also known as Gladius or Xiphos. Can impale. Does 1d6+1 when cutting."
      }
    }
  },

  "khopesh": {
    version: "1.0.6",
    data: {
      name: "Khopesh",
      type: "weapon",
      img: "icons/weapons/swords/sword-khopesh-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 150,
        encumbrance: 1.0,
        melee1Handed: {
          enabled: true,
          damage: "1d6+2",
          minStrength: 9,
          minDexterity: 0,
          baseSkill: 10,
          armor: 10,
          strikeRank: 3,
          impale: false
        },
        description: "Egyptian sickle-sword with distinctive hooked blade."
      }
    }
  },

  "spatha": {
    version: "1.0.6",
    data: {
      name: "Spatha (Broadsword)",
      type: "weapon",
      img: "icons/weapons/swords/sword-broad-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 175,
        encumbrance: 2.0,
        melee1Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 9,
          minDexterity: 7,
          baseSkill: 10,
          armor: 10,
          strikeRank: 2,
          impale: true
        },
        description: "Roman cavalry sword, longer than the gladius. Can impale."
      }
    }
  },

  "sickle": {
    version: "1.0.6",
    data: {
      name: "Sickle",
      type: "weapon",
      img: "icons/tools/farming/sickle-steel.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 60,
        encumbrance: 0.5,
        melee1Handed: {
          enabled: true,
          damage: "1d4+1",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 5,
          armor: 6,
          strikeRank: 3,
          impale: false
        },
        description: "Farming sickle, improvised as a weapon. Can impale."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - SWORDS (2-HANDED)
  // ========================================

  "falx_long": {
    version: "1.0.6",
    data: {
      name: "Falx (Long)",
      type: "weapon",
      img: "icons/weapons/swords/greatsword-steel-worn.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 150,
        encumbrance: 2.0,
        melee2Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 5,
          armor: 9,
          strikeRank: 2,
          impale: true
        },
        description: "Long Dacian two-handed curved sword, also known as Rhomphaia. Can impale."
      }
    }
  },

  "rhomphaia": {
    version: "1.0.6",
    data: {
      name: "Rhomphaia",
      type: "weapon",
      img: "icons/weapons/swords/greatsword-steel-worn.webp",
      system: {
        weaponType: "sword",
        quantity: 1,
        price: 150,
        encumbrance: 2.0,
        melee2Handed: {
          enabled: true,
          damage: "1d8+2",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 5,
          armor: 9,
          strikeRank: 2,
          impale: true
        },
        description: "Thracian two-handed curved sword, also known as long Falx. Can impale."
      }
    }
  },

  // ========================================
  // MELEE WEAPONS - TOOLS
  // ========================================

  "flail_agricultural": {
    version: "1.0.6",
    data: {
      name: "Flail (Agricultural)",
      type: "weapon",
      img: "icons/weapons/maces/flail-triple-ball.webp",
      system: {
        weaponType: "tool",
        quantity: 1,
        price: 10,
        encumbrance: 2.5,
        melee2Handed: {
          enabled: true,
          damage: "1d8",
          minStrength: 9,
          minDexterity: 0,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Farming flail improvised as a weapon."
      }
    }
  },

  "hoe": {
    version: "1.0.6",
    data: {
      name: "Hoe",
      type: "weapon",
      img: "icons/tools/farming/hoe-simple.webp",
      system: {
        weaponType: "tool",
        quantity: 1,
        price: 40,
        encumbrance: 2.0,
        melee2Handed: {
          enabled: true,
          damage: "1d6",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Farming hoe used as an improvised weapon."
      }
    }
  },

  "scythe": {
    version: "1.0.6",
    data: {
      name: "Scythe",
      type: "weapon",
      img: "icons/tools/farming/scythe-steel.webp",
      system: {
        weaponType: "tool",
        quantity: 1,
        price: 60,
        encumbrance: 2.5,
        melee2Handed: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 11,
          minDexterity: 9,
          baseSkill: 10,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Farming scythe, deadly when improvised as a weapon. Can impale."
      }
    }
  },

  "spade": {
    version: "1.0.6",
    data: {
      name: "Spade",
      type: "weapon",
      img: "icons/tools/farming/shovel-spade-steel.webp",
      system: {
        weaponType: "tool",
        quantity: 1,
        price: 40,
        encumbrance: 1.5,
        melee2Handed: {
          enabled: true,
          damage: "1d8",
          minStrength: 7,
          minDexterity: 7,
          baseSkill: 5,
          armor: 8,
          strikeRank: 2,
          impale: false
        },
        description: "Digging spade used as an improvised weapon."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - BOWS
  // ========================================

  "bow_composite": {
    version: "1.0.6",
    data: {
      name: "Bow (Composite)",
      type: "weapon",
      img: "icons/weapons/bows/bow-recurve-yellow.webp",
      system: {
        weaponType: "bow",
        quantity: 1,
        price: 200,
        encumbrance: 1.0,
        rangedAttack: {
          enabled: true,
          damage: "1d8+1",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 15,
          maxRange: 150,
          rof: 2
        },
        description: "Powerful recurved bow made from horn, wood, and sinew. Can impale."
      }
    }
  },

  "bow_long": {
    version: "1.0.6",
    data: {
      name: "Bow (Long)",
      type: "weapon",
      img: "icons/weapons/bows/bow-simple-wood.webp",
      system: {
        weaponType: "bow",
        quantity: 1,
        price: 200,
        encumbrance: 1.5,
        rangedAttack: {
          enabled: true,
          damage: "1d10+1",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 30,
          maxRange: 175,
          rof: 2
        },
        description: "Tall self bow made from a single piece of wood. Can impale."
      }
    }
  },

  "bow_short": {
    version: "1.0.6",
    data: {
      name: "Bow (Short)",
      type: "weapon",
      img: "icons/weapons/bows/bow-short-leather.webp",
      system: {
        weaponType: "bow",
        quantity: 1,
        price: 75,
        encumbrance: 0.5,
        rangedAttack: {
          enabled: true,
          damage: "1d6+1",
          minStrength: 9,
          minDexterity: 9,
          baseSkill: 15,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 5,
          maxRange: 80,
          rof: 2
        },
        description: "Small bow suitable for hunting and skirmishing. Can impale."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - CROSSBOWS
  // ========================================

  "crossbow_arbalest": {
    version: "1.0.6",
    data: {
      name: "Crossbow (Arbalest)",
      type: "weapon",
      img: "icons/weapons/crossbows/crossbow-steel-brown.webp",
      system: {
        weaponType: "crossbow",
        quantity: 1,
        price: 150,
        encumbrance: 6.0,
        rangedAttack: {
          enabled: true,
          damage: "3d6",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 25,
          armor: 0,
          strikeRank: 5,
          impale: true,
          deadlyBlow: false,
          minRange: 50,
          maxRange: 120,
          rof: 0.25
        },
        description: "Heavy steel crossbow with windlass. Devastating power but slow to reload. Can impale."
      }
    }
  },

  "crossbow_light": {
    version: "1.0.6",
    data: {
      name: "Crossbow (Light)",
      type: "weapon",
      img: "icons/weapons/crossbows/crossbow-simple.webp",
      system: {
        weaponType: "crossbow",
        quantity: 1,
        price: 150,
        encumbrance: 3.0,
        rangedAttack: {
          enabled: true,
          damage: "2d4+2",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 25,
          armor: 0,
          strikeRank: 5,
          impale: true,
          deadlyBlow: false,
          minRange: 20,
          maxRange: 60,
          rof: 0.5
        },
        description: "Light crossbow, easier to reload than heavier versions. Can impale."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - DARTS
  // ========================================

  "dart": {
    version: "1.0.6",
    data: {
      name: "Dart",
      type: "weapon",
      img: "icons/weapons/thrown/dart-simple.webp",
      system: {
        weaponType: "dart",
        quantity: 1,
        price: 5,
        encumbrance: 0.1,
        rangedAttack: {
          enabled: true,
          damage: "1d4",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 3
        },
        description: "Small throwing dart. Can impale."
      }
    }
  },

  "plumbata": {
    version: "1.0.6",
    data: {
      name: "Plumbata (Lead Dart)",
      type: "weapon",
      img: "icons/weapons/thrown/dart-barbed.webp",
      system: {
        weaponType: "dart",
        quantity: 1,
        price: 10,
        encumbrance: 0.2,
        rangedAttack: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 10,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 30,
          rof: 3
        },
        description: "Lead-weighted barbed dart, also known as martiobarbuli. Can impale."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - SLINGS
  // ========================================

  "sling_lead": {
    version: "1.0.6",
    data: {
      name: "Sling (Lead Bullets)",
      type: "weapon",
      img: "icons/weapons/thrown/sling-leather.webp",
      system: {
        weaponType: "sling",
        quantity: 1,
        price: 5,
        encumbrance: 0.1,
        rangedAttack: {
          enabled: true,
          damage: "1d8",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 10,
          maxRange: 200,
          rof: 1
        },
        description: "Sling with molded lead bullets. Best mix of range and damage."
      }
    }
  },

  "sling_stone": {
    version: "1.0.6",
    data: {
      name: "Sling (Stones)",
      type: "weapon",
      img: "icons/weapons/thrown/sling-simple.webp",
      system: {
        weaponType: "sling",
        quantity: 1,
        price: 5,
        encumbrance: 0.1,
        rangedAttack: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 10,
          maxRange: 150,
          rof: 1
        },
        description: "Sling with simple stones. Less effective than lead bullets."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - STAFF SLINGS
  // ========================================

  "staff_sling": {
    version: "1.0.6",
    data: {
      name: "Staff Sling (Fustibalus)",
      type: "weapon",
      img: "icons/weapons/staves/staff-simple-wood.webp",
      system: {
        weaponType: "staff-sling",
        quantity: 1,
        price: 10,
        encumbrance: 1.0,
        rangedAttack: {
          enabled: true,
          damage: "1d10",
          minStrength: 11,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 10,
          maxRange: 150,
          rof: 0.5
        },
        description: "Two-handed staff sling for shooting heavier payloads."
      }
    }
  },

  "fustibalus": {
    version: "1.0.6",
    data: {
      name: "Fustibalus (Staff Sling)",
      type: "weapon",
      img: "icons/weapons/staves/staff-simple-wood.webp",
      system: {
        weaponType: "staff-sling",
        quantity: 1,
        price: 10,
        encumbrance: 1.0,
        rangedAttack: {
          enabled: true,
          damage: "1d10",
          minStrength: 11,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 10,
          maxRange: 150,
          rof: 0.5
        },
        description: "Roman two-handed staff sling for shooting heavier payloads."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - THROWN ROCKS
  // ========================================

  "rock_1h": {
    version: "1.0.6",
    data: {
      name: "Rock (1H Thrown)",
      type: "weapon",
      img: "icons/commodities/stone/pebble-rough-grey.webp",
      system: {
        weaponType: "rock",
        quantity: 1,
        price: 0,
        encumbrance: 0.5,
        rangedAttack: {
          enabled: true,
          damage: "1d4",
          minStrength: 0,
          minDexterity: 0,
          baseSkill: 15,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 30,
          rof: 2
        },
        description: "A rock thrown one-handed. Gains +1d6 per 3m elevation above target."
      }
    }
  },

  "rock_2h": {
    version: "1.0.6",
    data: {
      name: "Rock (2H Thrown)",
      type: "weapon",
      img: "icons/commodities/stone/boulder-grey.webp",
      system: {
        weaponType: "rock",
        quantity: 1,
        price: 0,
        encumbrance: 5.0,
        rangedAttack: {
          enabled: true,
          damage: "2d6",
          minStrength: 13,
          minDexterity: 9,
          baseSkill: 15,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 5,
          maxRange: 20,
          rof: 0.5
        },
        description: "Large rock thrown two-handed. Gains +1d6 per 3m elevation. Subtract 1% per meter above target."
      }
    }
  },

  // ========================================
  // RANGED WEAPONS - THROWN CLUBS
  // ========================================

  "cateia": {
    version: "1.0.6",
    data: {
      name: "Cateia (Boomerang)",
      type: "weapon",
      img: "icons/weapons/thrown/boomerang-steel.webp",
      system: {
        weaponType: "club",
        quantity: 1,
        price: 15,
        encumbrance: 0.5,
        rangedAttack: {
          enabled: true,
          damage: "1d6",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 10,
          maxRange: 50,
          rof: 1
        },
        description: "Gallic throwing weapon like a boomerang, reinforced with metal bands."
      }
    }
  },

  "lagobolon": {
    version: "1.0.6",
    data: {
      name: "Lagobolon (Throwing Stick)",
      type: "weapon",
      img: "icons/weapons/clubs/club-throwing-curved.webp",
      system: {
        weaponType: "club",
        quantity: 1,
        price: 10,
        encumbrance: 1.0,
        rangedAttack: {
          enabled: true,
          damage: "1d8",
          minStrength: 7,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: true,
          minRange: 10,
          maxRange: 40,
          rof: 1
        },
        description: "Greek throwing stick like a shepherd's crook, used primarily for hunting."
      }
    }
  },

  // ========================================
  // SPECIAL WEAPONS - LASSO
  // ========================================

  "lasso": {
    version: "1.0.6",
    data: {
      name: "Lasso",
      type: "weapon",
      img: "icons/sundries/survival/rope-wrapped-brown.webp",
      system: {
        weaponType: "net",
        quantity: 1,
        price: 20,
        encumbrance: 1.0,
        rangedAttack: {
          enabled: true,
          damage: "0",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 5,
          maxRange: 10,
          rof: 1
        },
        description: "Flung noose used by Sagartians and Laquearius gladiators. Entangles target."
      }
    }
  },

  // ========================================
  // SPECIAL WEAPONS - NET
  // ========================================

  "rete": {
    version: "1.0.6",
    data: {
      name: "Rete (Combat Net)",
      type: "weapon",
      img: "icons/sundries/survival/net-simple.webp",
      system: {
        weaponType: "net",
        quantity: 1,
        price: 20,
        encumbrance: 2.0,
        rangedAttack: {
          enabled: true,
          damage: "0",
          minStrength: 0,
          minDexterity: 9,
          baseSkill: 5,
          armor: 0,
          strikeRank: 3,
          impale: true,
          deadlyBlow: false,
          minRange: 5,
          maxRange: 10,
          rof: 1
        },
        description: "Combat net used by Retarius gladiators. Entangles target."
      }
    }
  }
};
