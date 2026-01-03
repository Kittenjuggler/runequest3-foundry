const { HTMLField, NumberField, SchemaField, StringField, BooleanField, ArrayField, ObjectField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Actor Data Models                           */
/* -------------------------------------------- */

class ActorDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      // Basic characteristics (Runequest core stats)
      characteristics: new SchemaField({
        str: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        con: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 }),
          hitPoints: new SchemaField({
            value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
            max: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
            temp: new NumberField({ required: true, integer: true, initial: 0 })
          })
        }),
        siz: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        int: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        pow: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 }),
          training: new BooleanField({ required: true, initial: false }),
          magicPoints: new SchemaField({
            value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
            max: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
            temp: new NumberField({ required: true, integer: true, initial: 0 })
          })
        }),
        dex: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        app: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        cha: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        luck: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          current: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
          modifier: new NumberField({ required: true, integer: true, initial: 0 })
        })
      }),

      // Secondary attributes
      attributes: new SchemaField({
        fatigue: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        }),
        encumbrance: new SchemaField({
          total: new NumberField({ required: true, number: true, min: 0, initial: 0 }),
          armorAndWeapons: new NumberField({ required: true, number: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 60 })
        }),
        movement: new SchemaField({
          walk: new NumberField({ required: true, integer: true, min: 0, initial: 8 }),
          run: new NumberField({ required: true, integer: true, min: 0, initial: 24 })
        }),
        skillCategory: new SchemaField({
          agility: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          communication: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          knowledge: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          magic: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          manipulation: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          perception: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          stealth: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        generalDamage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      // Derived statistics
      derivedStats: new SchemaField({
        damageModifier: new StringField({ required: true, initial: "+0" }),
        twoHandDamageModifier: new StringField({ required: true, initial: "+1d4" }),
        moveRate: new NumberField({ required: true, integer: true, min: 0, initial: 8 }),
        dexSRM: new NumberField({ required: true, integer: true, initial: 0 }),
        sizeSRM: new NumberField({ required: true, integer: true, initial: 0 }),
        meleeSRM: new NumberField({ required: true, integer: true, initial: 0 })
      }),

      // Hit locations with damage tracking
      hitLocations: new SchemaField({
        head: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        leftArm: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        rightArm: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 2 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        chest: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 4 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        abdomen: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        leftLeg: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        rightLeg: new SchemaField({
          armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          tempArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          maxHitPoints: new NumberField({ required: true, integer: true, min: 0, initial: 3 }),
          damage: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        })
      }),

      background: new SchemaField({
        biography: new HTMLField({ required: true, blank: true }),
        notes: new HTMLField({ required: true, blank: true }),
        homeland: new StringField({ required: true, blank: true }),
        occupation: new StringField({ required: true, blank: true }),
        cult: new StringField({ required: true, blank: true })
      })
    };
  }
}

export class CharacterDataModel extends ActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      // Character-specific fields
      personal: new SchemaField({
        age: new NumberField({ required: true, integer: true, min: 0, initial: 21 }),
        height: new StringField({ required: true, blank: true }),
        weight: new StringField({ required: true, blank: true }),
        gender: new StringField({ required: true, blank: true }),
        species: new StringField({ required: true, blank: true }),
        reputation: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      // Track which containers are expanded/collapsed
      containerStates: new ObjectField(),

      // Track which magic sections are hidden in player mode
      magicVisibility: new ObjectField(),

      // Equipped armor by location
      equippedArmor: new SchemaField({
        head: new StringField({ required: false, blank: true, initial: "" }),
        leftArm: new StringField({ required: false, blank: true, initial: "" }),
        rightArm: new StringField({ required: false, blank: true, initial: "" }),
        chest: new StringField({ required: false, blank: true, initial: "" }),
        abdomen: new StringField({ required: false, blank: true, initial: "" }),
        leftLeg: new StringField({ required: false, blank: true, initial: "" }),
        rightLeg: new StringField({ required: false, blank: true, initial: "" })
      }),

      // Equipped weapons by hand location  
      equippedWeapons: new SchemaField({
        leftHand: new StringField({ required: false, blank: true, initial: "" }),
        rightHand: new StringField({ required: false, blank: true, initial: "" })
      }),

      // Skills with invested points for each category
      skills: new ObjectField(),

      // Custom skills created by players
      customSkills: new ObjectField(),

      passions: new ArrayField(new ObjectField()),
      
      experience: new SchemaField({
        total: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        available: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      runes: new SchemaField({
        elemental: new ObjectField(),
        power: new ObjectField(),
        form: new ObjectField(),
        condition: new ObjectField()
      }),

      // Magic stats
      magic: new SchemaField({
        // Magic Rating - purely derived stat (no invested)
        magicRating: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        // Free INT - base INT + bonus from items/spells
        freeInt: new SchemaField({
          base: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
          bonus: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          current: new NumberField({ required: true, integer: true, min: 0, initial: 10 })
        }),
        // Magic skills
        ceremony: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 5 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        summon: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        enchant: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        intensity: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        range: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        duration: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        multispell: new SchemaField({
          base: new NumberField({ required: true, integer: true, initial: 0 }),
          invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        })
      })
    };
  }
}

export class NPCDataModel extends ActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      npcType: new StringField({
        required: true,
        choices: ["minor", "major", "notable"],
        initial: "minor"
      }),
      
      organization: new StringField({ required: true, blank: true }),
      importance: new NumberField({ required: true, integer: true, min: 1, max: 5, initial: 1 })
    };
  }
}

export class CreatureDataModel extends ActorDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      creatureType: new StringField({
        required: true,
        choices: ["animal", "monster", "spirit", "undead", "chaos"],
        initial: "animal"
      }),
      
      naturalArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      traits: new ArrayField(new StringField()),
      
      special: new SchemaField({
        abilities: new HTMLField({ required: true, blank: true }),
        weaknesses: new HTMLField({ required: true, blank: true })
      })
    };
  }
}

/* -------------------------------------------- */
/*  Item Data Models                            */
/* -------------------------------------------- */

class ItemDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new HTMLField({ required: true, blank: true }),
      price: new SchemaField({
        value: new NumberField({ required: true, min: 0, initial: 0 }),
        currency: new StringField({ required: true, initial: "lunars" })
      }),
      weight: new NumberField({ required: true, min: 0, initial: 0 }),
      quantity: new NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      equipped: new BooleanField({ initial: false }),
      storageLocation: new StringField({
        required: true,
        choices: ["carried", "worn", "bag"],
        initial: "carried"
      }),
      containerId: new StringField({ required: false, blank: true, initial: "" })
    };
  }
}

export class WeaponDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      category: new StringField({
        required: true,
        choices: ["melee", "ranged", "thrown", "siege"],
        initial: "melee"
      }),
      
      hands: new StringField({
        required: true,
        choices: ["1-handed", "2-handed", "1-or-2-handed"],
        initial: "1-handed"
      }),
      
      damage: new StringField({ required: true, initial: "1d6" }),
      
      strengthRequirement: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
      
      dexterityRequirement: new NumberField({ required: true, integer: true, min: 1, max: 25, initial: 10 }),
      
      encumbrance: new NumberField({ required: true, number: true, min: 0, initial: 1 }),
      
      baseSkill: new NumberField({ required: true, integer: true, min: 0, max: 100, initial: 0 }),
      
      armor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      strikeRank: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      // Note: price field inherited from ItemDataModel (SchemaField with value and currency)
      
      // Legacy fields for backward compatibility
      // Note: No choices restriction to allow migration of old values
      weaponType: new StringField({
        required: false,
        blank: true,
        initial: "sword"
      }),
      
      skill: new StringField({ required: false, blank: true }),
      
      ap: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
      
      hp: new NumberField({ required: false, integer: true, min: 1, initial: 8 }),
      
      reach: new NumberField({ required: false, integer: true, min: 0, initial: 1 }),
      
      parry: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
      
      special: new StringField({ required: false, blank: true }),
      
      ranged: new SchemaField({
        isRanged: new BooleanField({ initial: false }),
        range: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        ammunition: new StringField({ required: false, blank: true })
      }),
      
      // Attack type sections
      melee1Handed: new SchemaField({
        enabled: new BooleanField({ initial: false }),
        damage: new StringField({ required: false, blank: true, initial: "1d6" }),
        strengthRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        dexterityRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        baseSkill: new NumberField({ required: false, integer: true, min: 0, max: 100, initial: 0 }),
        armor: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        strikeRank: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        impale: new BooleanField({ initial: false })
      }),
      
      melee2Handed: new SchemaField({
        enabled: new BooleanField({ initial: false }),
        damage: new StringField({ required: false, blank: true, initial: "1d6" }),
        strengthRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        dexterityRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        baseSkill: new NumberField({ required: false, integer: true, min: 0, max: 100, initial: 0 }),
        armor: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        strikeRank: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        impale: new BooleanField({ initial: false })
      }),
      
      rangedAttack: new SchemaField({
        enabled: new BooleanField({ initial: false }),
        damage: new StringField({ required: false, blank: true, initial: "1d6" }),
        strengthRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        dexterityRequirement: new NumberField({ required: false, integer: true, min: 1, max: 25, initial: 10 }),
        baseSkill: new NumberField({ required: false, integer: true, min: 0, max: 100, initial: 0 }),
        armor: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        strikeRank: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        deadlyBlow: new BooleanField({ initial: false }),
        impale: new BooleanField({ initial: false }),
        minRange: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        maxRange: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        rof: new NumberField({ required: false, integer: true, min: 0, initial: 0 })
      })
    };
  }
}

export class ArmorDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      armorType: new StringField({
        required: true,
        choices: ["clothes", "soft-leather", "stiff-leather", "cuirbouilli", "bezainted", "ringmail", "lamellar", "scale", "chainmail", "brigandine", "plate", "shield"],
        initial: "soft-leather"
      }),
      
      // Armor location selection - determines which hit locations this piece covers
      armorLocation: new StringField({
        required: true,
        choices: [
          "head",           // Head (10%)
          "chest",          // Chest (20%)
          "arm",            // Single Arm (10%)
          "abdomen",        // Abdomen (10%)
          "leg",            // Single Leg (20%)
          "custom"          // Custom hit location specification
        ],
        initial: "chest"
      }),
      
      // Hit location protection - automatically populated based on armorType and armorLocation
      hitLocations: new SchemaField({
        head: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        leftArm: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        rightArm: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        chest: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        abdomen: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        leftLeg: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        rightLeg: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      
      // Armor damage tracking for each hit location
      armorDamage: new SchemaField({
        head: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        leftArm: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        rightArm: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        chest: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        abdomen: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        leftLeg: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        rightLeg: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      
      // For shields - these don't use hit locations in the same way
      armorPoints: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      parryBonus: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      // Material and coverage info
      material: new StringField({ required: true, blank: true }),
      coverage: new StringField({ required: true, blank: true }),
      size: new StringField({ required: true, blank: true }),
      
      // These will be calculated automatically based on armorType, armorLocation, and character SIZ
      // Note: Removed weight field as requested - encumbrance handles weight
      encumbrance: new NumberField({ required: true, number: true, min: 0, initial: 0 })
    };
  }
}

export class SkillDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      category: new StringField({
        required: true,
        choices: ["agility", "communication", "knowledge", "magic", "manipulation", "perception", "stealth"],
        initial: "agility"
      }),
      
      baseChance: new NumberField({ required: true, integer: true, min: 0, max: 100, initial: 0 }),
      
      value: new NumberField({ required: true, integer: true, min: 0, max: 200, initial: 0 }),
      
      experience: new SchemaField({
        checkmark: new BooleanField({ initial: false }),
        improvements: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      
      characteristic1: new StringField({
        required: true,
        choices: ["str", "con", "siz", "int", "pow", "dex", "cha"],
        initial: "str"
      }),
      
      characteristic2: new StringField({
        required: true,
        choices: ["str", "con", "siz", "int", "pow", "dex", "cha", "none"],
        initial: "none"
      })
    };
  }
}

export class SpellDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      spellType: new StringField({
        required: true,
        choices: ["spirit", "divine", "sorcery"],
        initial: "spirit"
      }),
      
      // Magic Points (Spirit Magic uses this)
      magicPoints: new NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      
      // Legacy field for compatibility
      cost: new NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      
      // Range - allow any string for flexibility
      range: new StringField({
        required: true,
        initial: "Touch"
      }),
      
      // Duration - allow any string for flexibility
      duration: new StringField({
        required: true,
        initial: "Instant"
      }),
      
      // State dropdown
      state: new StringField({
        required: true,
        choices: ["Active", "Passive"],
        initial: "Active"
      }),
      
      castingTime: new StringField({ required: true, initial: "1 SR" }),
      
      components: new SchemaField({
        verbal: new BooleanField({ initial: true }),
        somatic: new BooleanField({ initial: true }),
        material: new BooleanField({ initial: false }),
        focus: new BooleanField({ initial: false })
      }),
      
      rune: new StringField({ required: true, blank: true }),
      
      intensity: new NumberField({ required: true, integer: true, min: 1, initial: 1 }),
      
      // Divine Magic specific fields
      uses: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      stackable: new BooleanField({ initial: false }),
      
      reusable: new BooleanField({ initial: false }),
      
      // Sorcery Magic specific fields
      invested: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      // Spell storage location within magic type (standard, spell-matrix, int-spirit, unavailable)
      spellStorageLocation: new StringField({
        required: true,
        choices: ["standard", "spell-matrix", "int-spirit", "unavailable"],
        initial: "standard"
      }),
      
      // Whether the spell is offensive (requires hit location roll)
      offensive: new BooleanField({ initial: false })
    };
  }
}

export class RuneDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      runeType: new StringField({
        required: true,
        choices: ["elemental", "power", "form", "condition"],
        initial: "elemental"
      }),
      
      affinityValue: new NumberField({ required: true, integer: true, min: 0, max: 100, initial: 0 }),
      
      opposition: new StringField({ required: true, blank: true }),
      
      associations: new ArrayField(new StringField()),
      
      spells: new ArrayField(new StringField())
    };
  }
}

export class EquipmentDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      equipmentType: new StringField({
        required: true,
        choices: ["tool", "container", "treasure", "consumable", "misc"],
        initial: "misc"
      }),
      
      capacity: new SchemaField({
        value: new NumberField({ required: true, min: 0, initial: 0 }),
        type: new StringField({
          required: true,
          choices: ["weight", "volume", "count"],
          initial: "weight"
        })
      }),
      
      consumable: new SchemaField({
        isConsumable: new BooleanField({ initial: false }),
        uses: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          max: new NumberField({ required: true, integer: true, min: 1, initial: 1 })
        })
      })
    };
  }
}

export class SpeciesDataModel extends ItemDataModel {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      
      type: new StringField({ required: true, initial: "humanoid" }),
      
      averageHeight: new StringField({ required: true, blank: true }),
      averageWeight: new StringField({ required: true, blank: true }),
      
      averageSize: new SchemaField({
        min: new NumberField({ required: true, integer: true, min: 1, initial: 8 }),
        max: new NumberField({ required: true, integer: true, min: 1, initial: 18 })
      }),
      
      characteristicMods: new SchemaField({
        str: new NumberField({ required: true, integer: true, initial: 0 }),
        con: new NumberField({ required: true, integer: true, initial: 0 }),
        siz: new NumberField({ required: true, integer: true, initial: 0 }),
        int: new NumberField({ required: true, integer: true, initial: 0 }),
        pow: new NumberField({ required: true, integer: true, initial: 0 }),
        dex: new NumberField({ required: true, integer: true, initial: 0 }),
        app: new NumberField({ required: true, integer: true, initial: 0 }),
        luck: new NumberField({ required: true, integer: true, initial: 0 })
      }),
      
      movement: new SchemaField({
        walk: new NumberField({ required: true, integer: true, min: 0, initial: 8 }),
        run: new NumberField({ required: true, integer: true, min: 0, initial: 24 })
      }),
      
      naturalArmor: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      
      naturalWeapons: new ArrayField(new StringField()),
      
      traits: new ArrayField(new StringField()),
      
      abilities: new HTMLField({ required: true, blank: true }),
      
      culture: new SchemaField({
        homeland: new StringField({ required: true, blank: true }),
        language: new StringField({ required: true, blank: true }),
        commonOccupations: new ArrayField(new StringField()),
        commonCults: new ArrayField(new StringField())
      }),
      
      lifespan: new SchemaField({
        maturity: new NumberField({ required: true, integer: true, min: 1, initial: 18 }),
        prime: new NumberField({ required: true, integer: true, min: 1, initial: 40 }),
        old: new NumberField({ required: true, integer: true, min: 1, initial: 60 }),
        venerable: new NumberField({ required: true, integer: true, min: 1, initial: 80 })
      }),
      
      skills: new ObjectField()
    };
  }
} 