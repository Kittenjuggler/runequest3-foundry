/**
 * RuneQuest 3rd Edition Skills Database
 * Official skill categories and skills
 */

export const RQ3_SKILLS = {
  agility: {
    label: "Agility Skills",
    skills: {
      "boat": {
        name: "Boat",
        baseChance: 5,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "str",
        description: "Handling a small boat, kayak, or raft."
      },
      "climb": {
        name: "Climb",
        baseChance: 40,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "str",
        description: "Climbing up or down walls, trees, cliffs, or any other surfaces."
      },
      "dodge": {
        name: "Dodge",
        baseChance: 0,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "none",
        description: "Avoiding being hit by an attack."
      },
      "jump": {
        name: "Jump",
        baseChance: 25,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "str",
        description: "Leaping for height or distance over obstacles."
      },
      "ride": {
        name: "Ride",
        baseChance: 5,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "pow",
        hasSpecialty: true,
        description: "Riding a horse or other riding animal."
      },
      "swim": {
        name: "Swim",
        baseChance: 15,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "str",
        description: "Staying afloat and moving in a desired direction while in the water."
      },
      "throw": {
        name: "Throw",
        baseChance: 25,
        category: "agility",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "str",
        description: "Hurling objects accurately, including thrown weapons."
      }
    }
  },

  communication: {
    label: "Communication Skills",
    skills: {
      "fastTalk": {
        name: "Fast Talk",
        baseChance: 5,
        category: "communication",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "cha",
        description: "Convincing people to agree with what the speaker is saying through quick talk."
      },
      "orate": {
        name: "Orate",
        baseChance: 10,
        category: "communication",
        canGainExperience: true,
        characteristic1: "cha",
        characteristic2: "pow",
        description: "Using speech to make groups change beliefs, act, or grant significant requests."
      },
      "sing": {
        name: "Sing",
        baseChance: 10,
        category: "communication",
        canGainExperience: true,
        characteristic1: "cha",
        characteristic2: "pow",
        description: "Knowledge of poetry as well as singing or reciting poetry."
      },
      "speakOwnLanguage": {
        name: "Speak Own Language",
        baseChance: 50,
        category: "communication",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "cha",
        description: "Speaking one's native language."
      },
      "speakTradeTalk": {
        name: "Speak Trade Talk",
        baseChance: 0,
        category: "communication",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "cha",
        description: "Speaking the common trade language used by merchants across different cultures."
      }
    }
  },

  knowledge: {
    label: "Knowledge Skills",
    skills: {
      "evaluateItem": {
        name: "Evaluate",
        baseChance: 10,
        category: "knowledge",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Estimating the worth of artifacts, goods, and valuable materials."
      },
      "firstAid": {
        name: "First Aid",
        baseChance: 30,
        category: "knowledge",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Treating wounds and injuries to stop bleeding and stabilize patients."
      },
      "animalLore": {
        name: "Animal Lore",
        baseChance: 5,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Knowledge of animals, their behaviors, physiology, and characteristics."
      },
      "worldLore": {
        name: "World Lore",
        baseChance: 15,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        hasSpecialty: true,
        description: "Knowledge of the geography, history, and cultures of the world."
      },
      "humanLore": {
        name: "Human Lore",
        baseChance: 15,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        hasSpecialty: true,
        description: "Knowledge of human cultures, customs, and societies."
      },
      "mineralLore": {
        name: "Mineral Lore",
        baseChance: 5,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Knowing and identifying different types of minerals, metals, and ores."
      },
      "plantLore": {
        name: "Plant Lore",
        baseChance: 5,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Identifying and using plants for medicinal and other purposes."
      },
      "martialArts": {
        name: "Martial Arts",
        baseChance: 1,
        category: "knowledge",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        hasSpecialty: true,
        description: "Knowledge and practice of unarmed combat techniques."
      },
      "readWriteLanguages": {
        name: "Read/Write Languages",
        baseChance: 0,
        category: "knowledge",
        canGainExperience: false,
        characteristic1: "int",
        characteristic2: "pow",
        hasSpecialty: true,
        description: "Reading and writing in a script."
      },
      "shiphandling": {
        name: "Shiphandling",
        baseChance: 0,
        category: "knowledge",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Steering and maneuvering a ship, galley, trireme, or other large sailing vessel."
      }
    }
  },

  manipulation: {
    label: "Manipulation Skills",
    skills: {
      "conceal": {
        name: "Conceal",
        baseChance: 5,
        category: "manipulation",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Concealing an object so that it may be found only with a Search skill roll."
      },
      "sleight": {
        name: "Sleight",
        baseChance: 5,
        category: "manipulation",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "int",
        description: "Using speed or misdirection to manipulate objects, pick pockets, etc."
      },
      "devise": {
        name: "Devise",
        baseChance: 5,
        category: "manipulation",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Assembling and disassembling mechanisms such as traps and locks."
      },
      "playInstrument": {
        name: "Play Instrument",
        baseChance: 5,
        category: "manipulation",
        canGainExperience: true,
        characteristic1: "dex",
        characteristic2: "cha",
        hasSpecialty: true,
        description: "Being able to play a musical instrument."
      }
    }
  },

  perception: {
    label: "Perception Skills",
    skills: {
      "listen": {
        name: "Listen",
        baseChance: 25,
        category: "perception",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Detecting sounds and determining their nature and location."
      },
      "scan": {
        name: "Scan",
        baseChance: 25,
        category: "perception",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Visually searching an area to detect hidden or obvious things."
      },
      "search": {
        name: "Search",
        baseChance: 25,
        category: "perception",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "pow",
        description: "Actively looking for specific objects or details in a concentrated area."
      },
      "track": {
        name: "Track",
        baseChance: 5,
        category: "perception",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "con",
        description: "Following the trail of a creature or person."
      }
    }
  },

  stealth: {
    label: "Stealth Skills",
    skills: {
      "hide": {
        name: "Hide",
        baseChance: 10,
        category: "stealth",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Using available cover to hide from others."
      },
      "sneak": {
        name: "Sneak",
        baseChance: 10,
        category: "stealth",
        canGainExperience: true,
        characteristic1: "int",
        characteristic2: "dex",
        description: "Moving in silence, without alerting a foe."
      }
    }
  }
};

/**
 * Get all skills as a flat array
 */
export function getAllSkills() {
  const allSkills = [];
  
  for (const categoryKey in RQ3_SKILLS) {
    const category = RQ3_SKILLS[categoryKey];
    for (const skillKey in category.skills) {
      const skill = category.skills[skillKey];
      allSkills.push({
        id: skillKey,
        ...skill
      });
    }
  }
  
  return allSkills;
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(categoryName) {
  if (!RQ3_SKILLS[categoryName]) return [];
  
  const skills = [];
  for (const skillKey in RQ3_SKILLS[categoryName].skills) {
    const skill = RQ3_SKILLS[categoryName].skills[skillKey];
    skills.push({
      id: skillKey,
      ...skill
    });
  }
  
  return skills;
}

/**
 * Get a specific skill by ID
 */
export function getSkillById(skillId) {
  for (const categoryKey in RQ3_SKILLS) {
    const category = RQ3_SKILLS[categoryKey];
    if (category.skills[skillId]) {
      return {
        id: skillId,
        ...category.skills[skillId]
      };
    }
  }
  return null;
} 