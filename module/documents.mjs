/**
 * Extend the base Actor document to implement Runequest 3 specific logic
 */
export class RQ3Actor extends Actor {

  /**
   * Map weapon types to attack skills
   * @param {string} weaponType - The weapon type
   * @returns {string} The corresponding attack skill key
   */
  static getAttackSkillForWeaponType(weaponType) {
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
    
    return weaponTypeToSkillMap[weaponType] || null;
  }

  /**
   * Get the attack skill value for a weapon
   * @param {string} weaponType - The weapon type
   * @returns {number} The attack skill total value
   */
  getAttackSkillValue(weaponType) {
    const skillKey = RQ3Actor.getAttackSkillForWeaponType(weaponType);
    if (!skillKey) return 0;
    
    // Get the skill data
    const skillData = this.system.skills?.weapon?.[skillKey];
    if (!skillData) return 0;
    
    // Calculate category bonus (same as manipulation: INT, DEX = Primary, STR = Secondary)
    const characteristics = this.system.characteristics;
    const calculatePrimaryInfluence = (charValue) => charValue - 10;
    const calculateSecondaryInfluence = (charValue) => {
      const effectiveValue = Math.min(charValue, 30);
      const diff = effectiveValue - 10;
      let modifier;
      if (diff > 0) {
        modifier = Math.ceil(diff / 2);
      } else {
        modifier = Math.floor(diff / 2);
      }
      return Math.max(-10, Math.min(10, modifier));
    };
    
    const categoryBonus = 
      calculatePrimaryInfluence(characteristics.int?.current || 10) +
      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
      calculateSecondaryInfluence(characteristics.str?.current || 10);
    
    // Calculate total: base + invested + category bonus
    const baseValue = CONFIG.RQ3.skills.weapon.skills[skillKey]?.baseChance || 0;
    const investedValue = skillData.value || 0;
    
    return Math.max(0, baseValue + investedValue + categoryBonus);
  }

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareDerivedData() {
    try {
      super.prepareDerivedData();
      
      const systemData = this.system;
      
      // Sync current values with original values if current is not set
      this._syncCurrentValues();
      
      // Calculate characteristic modifiers
      this._calculateCharacteristicModifiers();
      
      // Calculate hit points and magic points
      this._calculateHitPoints();
      this._calculateMagicPoints();
      
      // Calculate movement rates
      this._calculateMovement();
      
      // Calculate derived stats
      this._calculateDerivedStats();
      
      // Calculate magic stats
      this._calculateMagicStats();
      
      // Calculate hit location hit points
      this._calculateHitLocationHP();
      
      // Calculate encumbrance and fatigue limits
      this._calculateEncumbrance();
    } catch (error) {
      console.error("RQ3 | Error in prepareDerivedData:", error);
    }
  }

  /**
   * Sync current characteristic values with original values if current is not set
   */
  _syncCurrentValues() {
    try {
      const chars = this.system.characteristics;
      
      if (!chars || typeof chars !== 'object') {
        console.warn("RQ3 | Invalid characteristics data for value synchronization");
        return;
      }
      
      for (let [key, char] of Object.entries(chars)) {
        if (char && typeof char === 'object') {
          // If current value is not set or is 0, sync it with the original value
          if (char.current === undefined || char.current === 0) {
            char.current = char.value;
          }
        }
      }
    } catch (error) {
      console.error("RQ3 | Error synchronizing characteristic values:", error);
    }
  }

  /**
   * Calculate characteristic modifiers based on values
   */
  _calculateCharacteristicModifiers() {
    try {
      const chars = this.system.characteristics;
      
      if (!chars || typeof chars !== 'object') {
        console.warn("RQ3 | Invalid characteristics data for modifier calculation");
        return;
      }
      
      for (let [key, char] of Object.entries(chars)) {
        if (char && char.current !== undefined && typeof char.current === 'number') {
          // Standard RQ3 characteristic modifier calculation using current values
          if (char.current <= 6) char.modifier = -2;
          else if (char.current <= 8) char.modifier = -1;
          else if (char.current <= 12) char.modifier = 0;
          else if (char.current <= 16) char.modifier = 1;
          else if (char.current <= 20) char.modifier = 2;
          else char.modifier = 3;
        }
      }
    } catch (error) {
      console.error("RQ3 | Error calculating characteristic modifiers:", error);
    }
  }

  /**
   * Calculate total hit points based on CON and SIZ
   */
  _calculateHitPoints() {
    try {
      const con = this.system.characteristics?.con?.current;
      const siz = this.system.characteristics?.siz?.current;
      
      // Validate input values
      if (con === undefined || siz === undefined || con < 1 || siz < 1) {
        console.warn("RQ3 | Invalid CON or SIZ values for HP calculation:", { con, siz });
        return;
      }
      
      // RQ3 hit point calculation: (CON + SIZ) / 2 rounded up
      const totalHP = Math.ceil((con + siz) / 2);
      
      if (this.system.characteristics.con.hitPoints.max !== totalHP) {
        this.system.characteristics.con.hitPoints.max = totalHP;
        
        // Set current HP to max if it's a new character or higher than max
        if (this.system.characteristics.con.hitPoints.value > totalHP || this.system.characteristics.con.hitPoints.value === 0) {
          this.system.characteristics.con.hitPoints.value = totalHP;
        }
      }
    } catch (error) {
      console.error("RQ3 | Error calculating hit points:", error);
    }
  }

  /**
   * Calculate magic points based on POW
   */
  _calculateMagicPoints() {
    try {
      const pow = this.system.characteristics?.pow?.current;
      
      // Validate input values
      if (pow === undefined || pow < 1) {
        console.warn("RQ3 | Invalid POW value for MP calculation:", pow);
        return;
      }
      
      // RQ3 magic point calculation: equal to POW
      if (this.system.characteristics.pow.magicPoints.max !== pow) {
        this.system.characteristics.pow.magicPoints.max = pow;
        
        // Set current MP to max if it's higher than max (but allow it to be 0)
        if (this.system.characteristics.pow.magicPoints.value > pow) {
          this.system.characteristics.pow.magicPoints.value = pow;
        }
      }
    } catch (error) {
      console.error("RQ3 | Error calculating magic points:", error);
    }
  }

  /**
   * Calculate movement rates based on DEX and SIZ
   */
  _calculateMovement() {
    try {
      const dex = this.system.characteristics?.dex?.current;
      const siz = this.system.characteristics?.siz?.current;
      
      // Validate input values
      if (dex === undefined || siz === undefined || dex < 1 || siz < 1) {
        console.warn("RQ3 | Invalid DEX or SIZ values for movement calculation:", { dex, siz });
        return;
      }
      
      // Base movement rate calculation
      let baseMove = 8;
      if (dex > siz) baseMove = 9;
      if (dex > siz + 5) baseMove = 10;
      if (dex > siz + 10) baseMove = 11;
      if (dex > siz + 15) baseMove = 12;
      
      this.system.attributes.movement.walk = baseMove;
      this.system.attributes.movement.run = baseMove * 3;
    } catch (error) {
      console.error("RQ3 | Error calculating movement:", error);
    }
  }

  /**
   * Calculate derived stats
   */
  _calculateDerivedStats() {
    try {
      const str = this.system.characteristics?.str?.current;
      const siz = this.system.characteristics?.siz?.current;
      const dex = this.system.characteristics?.dex?.current;
      
      // Validate input values
      if (str === undefined || siz === undefined || dex === undefined || 
          str < 1 || siz < 1 || dex < 1) {
        console.warn("RQ3 | Invalid characteristic values for derived stats calculation:", { str, siz, dex });
        return;
      }
      
      // Calculate damage modifier based on STR + SIZ
      const strSizTotal = str + siz;
      let damageModifier = "";
      if (strSizTotal <= 12) damageModifier = "-1d4";
      else if (strSizTotal <= 16) damageModifier = "-1d2";
      else if (strSizTotal <= 24) damageModifier = "+0";
      else if (strSizTotal <= 32) damageModifier = "+1d4";
      else if (strSizTotal <= 40) damageModifier = "+1d6";
      else if (strSizTotal <= 56) damageModifier = "+2d6";
      else damageModifier = "+3d6";
      
      // Calculate 2 Hand DM (one increment larger than 1 Hand DM)
      const damageModifierProgression = ["-1d4", "-1d2", "+0", "+1d4", "+1d6", "+2d6", "+3d6"];
      const currentIndex = damageModifierProgression.indexOf(damageModifier);
      const twoHandDamageModifier = currentIndex < damageModifierProgression.length - 1 
        ? damageModifierProgression[currentIndex + 1] 
        : damageModifier; // If already at max, keep the same
      
      // Calculate DEX Strike Rank Modifier
      let dexSRM = 0;
      if (dex <= 8) dexSRM = 3;
      else if (dex <= 12) dexSRM = 2;
      else if (dex <= 16) dexSRM = 1;
      else if (dex <= 20) dexSRM = 0;
      else dexSRM = -1;
      
      // Calculate Size Strike Rank Modifier
      // SIZ 01-09: SRM = 3
      // SIZ 10-15: SRM = 2
      // SIZ 16-19: SRM = 1
      // SIZ 20+: SRM = 0
      let sizeSRM = 0;
      if (siz <= 9) sizeSRM = 3;
      else if (siz <= 15) sizeSRM = 2;
      else if (siz <= 19) sizeSRM = 1;
      else sizeSRM = 0; // siz >= 20
    
    // Calculate Melee Strike Rank Modifier (DEX SRM + Size SRM)
    const meleeSRM = dexSRM + sizeSRM;
    
    // Store derived stats
    if (!this.system.derivedStats) {
      this.system.derivedStats = {};
    }
    
    this.system.derivedStats.damageModifier = damageModifier;
    this.system.derivedStats.twoHandDamageModifier = twoHandDamageModifier;
    this.system.derivedStats.moveRate = this.system.attributes.movement.walk;
    this.system.derivedStats.dexSRM = dexSRM;
    this.system.derivedStats.sizeSRM = sizeSRM;
    this.system.derivedStats.meleeSRM = meleeSRM;
    } catch (error) {
      console.error("RQ3 | Error calculating derived stats:", error);
    }
  }

  /**
   * Calculate magic stats (Magic Rating, Free INT)
   */
  _calculateMagicStats() {
    try {
      // Skip if not a character
      if (this.type !== 'character') {
        return;
      }

      // Ensure magic object exists
      if (!this.system.magic) {
        this.system.magic = {
          magicRating: { value: 0 },
          freeInt: { base: 10, bonus: 0, current: 10 },
          ceremony: { base: 5, invested: 0 },
          summon: { base: 0, invested: 0 },
          enchant: { base: 0, invested: 0 }
        };
      }

      // Calculate Magic Rating base value
      // Magic Rating = (INT excess) + (POW excess) + ceil((DEX excess) / 2)
      // Excess = value - 10 (values above 10)
      const int = this.system.characteristics.int?.current || 10;
      const pow = this.system.characteristics.pow?.current || 10;
      const dex = this.system.characteristics.dex?.current || 10;
      
      const intExcess = Math.max(0, int - 10);
      const powExcess = Math.max(0, pow - 10);
      const dexExcess = Math.max(0, dex - 10);
      
      const magicRatingBase = intExcess + powExcess + Math.ceil(dexExcess / 2);
      this.system.magic.magicRating.value = magicRatingBase;
      
      // Calculate Free INT
      // Free INT = current INT + bonus from items/spells
      this.system.magic.freeInt.base = int;
      const bonus = this.system.magic.freeInt.bonus || 0;
      this.system.magic.freeInt.current = int + bonus;
      
      console.log('RQ3 | Magic stats calculated:', {
        magicRating: this.system.magic.magicRating.value,
        freeInt: this.system.magic.freeInt.current,
        formula: `INT(${int}-10=${intExcess}) + POW(${pow}-10=${powExcess}) + ceil(DEX ${dex}-10/2=${Math.ceil(dexExcess/2)}) = ${magicRatingBase}`
      });
      
    } catch (error) {
      console.error("RQ3 | Error calculating magic stats:", error);
    }
  }

  /**
   * Calculate hit location hit points
   */
  _calculateHitLocationHP() {
    try {
      const maxHP = this.system.characteristics.con.hitPoints.max;
      const locations = this.system.hitLocations;
      
      if (!maxHP || !locations) {
        console.warn("RQ3 | Invalid max HP or hitLocations for HP calculation");
        return;
      }
      
      // RQ3 Hit Location HP Distribution Table for Humans
      // Based on Total HP ranges: 01-03, 04-06, 07-09, 10-12, 13-15, 16-18, 19-21
      const getHitLocationHP = (maxHP, location) => {
        let rangeIndex = 0;
        
        if (maxHP >= 1 && maxHP <= 3) rangeIndex = 0;
        else if (maxHP >= 4 && maxHP <= 6) rangeIndex = 1;
        else if (maxHP >= 7 && maxHP <= 9) rangeIndex = 2;
        else if (maxHP >= 10 && maxHP <= 12) rangeIndex = 3;
        else if (maxHP >= 13 && maxHP <= 15) rangeIndex = 4;
        else if (maxHP >= 16 && maxHP <= 18) rangeIndex = 5;
        else if (maxHP >= 19 && maxHP <= 21) rangeIndex = 6;
        else if (maxHP > 21) rangeIndex = 6; // Cap at highest range for superhuman HP
        
        const hpTables = {
          head: [1, 2, 3, 4, 5, 6, 7],
          leftArm: [1, 2, 3, 3, 4, 5, 6],
          rightArm: [1, 2, 3, 3, 4, 5, 6],
          chest: [2, 3, 4, 5, 6, 8, 9],
          abdomen: [1, 2, 3, 4, 5, 6, 7],
          leftLeg: [1, 2, 3, 4, 5, 6, 7],
          rightLeg: [1, 2, 3, 4, 5, 6, 7]
        };
        
        return hpTables[location] ? hpTables[location][rangeIndex] : 1;
      };
      
      // Calculate HP for each hit location
      const hpDistribution = {
        head: getHitLocationHP(maxHP, 'head'),
        leftArm: getHitLocationHP(maxHP, 'leftArm'),
        rightArm: getHitLocationHP(maxHP, 'rightArm'),
        chest: getHitLocationHP(maxHP, 'chest'),
        abdomen: getHitLocationHP(maxHP, 'abdomen'),
        leftLeg: getHitLocationHP(maxHP, 'leftLeg'),
        rightLeg: getHitLocationHP(maxHP, 'rightLeg')
      };
      
      // Apply the distribution
      for (let [location, hp] of Object.entries(hpDistribution)) {
        if (locations[location]) {
          locations[location].maxHitPoints = hp;
          // Initialize damage to 0 if not set
          if (locations[location].damage === undefined) {
            locations[location].damage = 0;
          }
          // Cap damage to max HP to prevent negative effective HP
          if (locations[location].damage > hp) {
            locations[location].damage = hp;
          }
        }
      }
    } catch (error) {
      console.error("RQ3 | Error calculating hit location HP:", error);
    }
  }

  /**
   * Calculate encumbrance limits and values
   */
  _calculateEncumbrance() {
    const str = this.system.characteristics.str.current;
    const con = this.system.characteristics.con.current;
    
    // Max encumbrance = STR × 6 (RuneQuest 3 rule)
    this.system.attributes.encumbrance.max = str * 6;
    
    // Calculate total encumbrance from all items
    const { totalEncumbrance, armorAndWeaponEncumbrance } = this._calculateItemEncumbrance();
    
    // Update encumbrance values
    this.system.attributes.encumbrance.total = totalEncumbrance;
    this.system.attributes.encumbrance.armorAndWeapons = armorAndWeaponEncumbrance;
    
    // Fatigue limit = CON
    this.system.attributes.fatigue.max = con;
  }

  /**
   * Calculate encumbrance from all carried items
   * @returns {Object} Object containing total and armor/weapon encumbrance
   * @private
   */
  _calculateItemEncumbrance() {
    let totalEncumbrance = 0;
    let armorAndWeaponEncumbrance = 0;

    // Calculate encumbrance from all items
    for (const item of this.items) {
      let itemEncumbrance = 0;
      let encumbranceMultiplier = 1.0; // Default for carried items

      // Check if item is inside a container - if so, always use 1/3 multiplier
      if (item.system.containerId) {
        encumbranceMultiplier = 1/3; // Items in containers = 1/3 encumbrance
      } else {
        // Determine encumbrance multiplier based on storage location
        const storageLocation = item.system.storageLocation || 'carried';
        switch (storageLocation) {
          case 'worn':
            encumbranceMultiplier = 0.5; // Worn items = 1/2 encumbrance
            break;
          case 'bag':
            encumbranceMultiplier = 1/3; // Bag items = 1/3 encumbrance
            break;
          case 'carried':
          default:
            encumbranceMultiplier = 1.0; // Carried items = full encumbrance
            break;
        }
      }

      if (item.type === 'armor') {
        // Check if armor is equipped
        const isEquipped = Object.values(this.system.equippedArmor || {}).includes(item.id);
        if (isEquipped) {
          // Recalculate ENC based on character's actual SIZ when equipped
          const characterSiz = this.system.characteristics?.siz?.value || 13; // Default to medium if missing
          const sizeCategory = CONFIG.RQ3.getCharacterSizeCategory(characterSiz);
          const dynamicENC = CONFIG.RQ3.calculateArmorEncumbrance(
            item.system.armorType,
            item.system.armorLocation,
            sizeCategory
          ) || item.system.encumbrance || 0; // Fallback to stored ENC if calculation fails
          
          itemEncumbrance = dynamicENC * encumbranceMultiplier;
          armorAndWeaponEncumbrance += itemEncumbrance;
        } else {
          // Unequipped armor uses stored encumbrance (medium size default) and storage location multiplier
          itemEncumbrance = ((item.system.encumbrance || 0) * (item.system.quantity || 1)) * encumbranceMultiplier;
        }
      } else if (item.type === 'weapon') {
        // Check if weapon is equipped
        if (item.system.equipped) {
          itemEncumbrance = ((item.system.weight || 0) * (item.system.quantity || 1)) * encumbranceMultiplier;
          armorAndWeaponEncumbrance += itemEncumbrance;
        } else {
          // Unequipped weapons use regular weight and storage location
          itemEncumbrance = ((item.system.weight || 0) * (item.system.quantity || 1)) * encumbranceMultiplier;
        }
      } else {
        // Regular equipment - apply storage location multiplier
        itemEncumbrance = ((item.system.weight || 0) * (item.system.quantity || 1)) * encumbranceMultiplier;
      }

      totalEncumbrance += itemEncumbrance;
    }

    return {
      totalEncumbrance: Math.round(totalEncumbrance * 100) / 100, // Round to 2 decimal places
      armorAndWeaponEncumbrance: Math.round(armorAndWeaponEncumbrance * 100) / 100
    };
  }

  /**
   * Get effective skill value after encumbrance penalties
   * @param {string} skillName - Name of the skill
   * @param {number} baseValue - Base skill value before penalties
   * @returns {number} Skill value after encumbrance penalties
   */
  getSkillWithEncumbrancePenalty(skillName, baseValue) {
    const totalENC = this.system.attributes.encumbrance.total;
    const armorAndWeaponENC = this.system.attributes.encumbrance.armorAndWeapons;
    
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
  }

  /**
   * Apply damage to a specific hit location
   * @param {number} damage - Amount of damage to apply
   * @param {string} location - Hit location to damage
   * @param {boolean} ignoreArmor - Whether to ignore armor
   */
  async applyDamage(damage, location = "chest", ignoreArmor = false) {
    const loc = this.system.hitLocations[location];
    if (!loc) {
      ui.notifications.error(`Invalid hit location: ${location}`);
      return;
    }

    let finalDamage = damage;
    
    if (!ignoreArmor) {
      finalDamage = Math.max(0, damage - loc.armor);
    }

    const newHP = Math.max(0, loc.hitPoints - finalDamage);
    const updateData = {};
    updateData[`system.hitLocations.${location}.hitPoints`] = newHP;

    // Also reduce general hit points
    const currentGeneralHP = this.system.characteristics.con.hitPoints.value;
    const newGeneralHP = Math.max(0, currentGeneralHP - finalDamage);
    updateData[`system.characteristics.con.hitPoints.value`] = newGeneralHP;

    await this.update(updateData);

    // Create chat message
    await ChatMessage.create({
      content: `${this.name} takes ${finalDamage} damage to ${location}${!ignoreArmor && loc.armor > 0 ? ` (${loc.armor} absorbed by armor)` : ""}`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  /**
   * Heal damage to a specific hit location
   * @param {number} healing - Amount of healing to apply
   * @param {string} location - Hit location to heal
   */
  async applyHealing(healing, location = "chest") {
    const loc = this.system.hitLocations[location];
    if (!loc) {
      ui.notifications.error(`Invalid hit location: ${location}`);
      return;
    }

    const newHP = Math.min(loc.maxHitPoints, loc.hitPoints + healing);
    const updateData = {};
    updateData[`system.hitLocations.${location}.hitPoints`] = newHP;

    // Also heal general hit points
    const currentGeneralHP = this.system.characteristics.con.hitPoints.value;
    const maxGeneralHP = this.system.characteristics.con.hitPoints.max;
    const newGeneralHP = Math.min(maxGeneralHP, currentGeneralHP + healing);
    updateData[`system.characteristics.con.hitPoints.value`] = newGeneralHP;

    await this.update(updateData);

    await ChatMessage.create({
      content: `${this.name} heals ${healing} hit points to ${location}`,
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  /**
   * Add descriptive tooltip to a roll
   * @param {Roll} roll - The roll to add tooltip to
   * @param {string} description - The description of the calculation
   * @private
   */
  static _addRollTooltip(roll, description) {
    if (!roll.options) roll.options = {};
    roll.options.tooltip = description;
  }

  /**
   * Calculate RuneQuest roll result type
   * @param {number} rollTotal - The dice roll result (1-100)
   * @param {number} skillValue - The skill/characteristic value to roll against
   * @returns {Object} Object with result type and text
   */
  static calculateRollResult(rollTotal, skillValue) {
    // Critical Success: 1 is always critical, or roll <= skillValue / 20
    const criticalThreshold = Math.floor(skillValue / 20);
    const isCritical = rollTotal === 1 || rollTotal <= criticalThreshold;
    
    // Special Success: 01 to 20% of normal success chance (skillValue / 5)
    // But only if not already a critical
    const specialThreshold = Math.floor(skillValue / 5);
    const isSpecial = !isCritical && rollTotal <= specialThreshold;
    
    // Fumble: 100 is always fumble, or 5% of failure chance
    const failureChance = 100 - skillValue;
    const fumbleChance = Math.ceil(failureChance * 0.05);
    const fumbleThreshold = 101 - fumbleChance;
    const isFumble = rollTotal === 100 || rollTotal >= fumbleThreshold;
    
    // Normal Success: roll <= skillValue but not critical or special
    const isSuccess = !isCritical && !isSpecial && rollTotal <= skillValue;
    
    // Normal Failure: roll > skillValue but not fumble
    const isFailure = !isFumble && rollTotal > skillValue;
    
    // Determine result
    let resultType = 'failure';
    let resultText = 'Failure';
    let resultClass = 'failure';
    
    if (isCritical) {
      resultType = 'critical';
      resultText = 'Critical Success!';
      resultClass = 'critical';
    } else if (isSpecial) {
      resultType = 'special';
      resultText = 'Special Success';
      resultClass = 'special';
    } else if (isFumble) {
      resultType = 'fumble';
      resultText = 'Fumble!';
      resultClass = 'fumble';
    } else if (isSuccess) {
      resultType = 'success';
      resultText = 'Success';
      resultClass = 'success';
    }
    
    return { resultType, resultText, resultClass, isCritical, isSpecial, isFumble, isSuccess, isFailure };
  }

  /**
   * Roll a skill check
   * @param {string} skillName - Name of the skill to roll
   * @param {number} modifier - Modifier to apply to the roll
   */
  async rollSkill(skillName, modifier = 0) {
    // Find the skill in the CONFIG data or custom skills and get its calculated value
    let skillValue = 0;
    let skillKey = null;
    let categoryKey = null;
    let isCustomSkill = false;
    
    // First check custom skills
    const customSkills = this.system.customSkills || {};
    for (const [catKey, categorySkills] of Object.entries(customSkills)) {
      for (const [sKey, skillData] of Object.entries(categorySkills)) {
        if (skillData.name === skillName) {
          skillKey = sKey;
          categoryKey = catKey;
          isCustomSkill = true;
          break;
        }
      }
      if (skillKey) break;
    }
    
    // If not found in custom skills, search through CONFIG skills
    if (!skillKey) {
      for (const [catKey, category] of Object.entries(CONFIG.RQ3.skills)) {
        for (const [sKey, skillData] of Object.entries(category.skills)) {
          if (skillData.name === skillName) {
            skillKey = sKey;
            categoryKey = catKey;
            break;
          }
        }
        if (skillKey) break;
      }
    }
    
    if (!skillKey || !categoryKey) {
      ui.notifications.error(`Skill ${skillName} not found`);
      return;
    }
    
    // Get the actor's calculated skill value from sheet data
    // We need to recalculate the skill value here since we don't have direct access to sheet context
    const system = this.system;
    
    // Calculate skill value
    let baseValue = 0;
    let investedValue = 0;
    
    if (isCustomSkill) {
      // For custom skills, get values directly from the custom skill data
      const customSkill = customSkills[categoryKey][skillKey];
      baseValue = customSkill.baseValue || 0;
      investedValue = customSkill.investedValue || 0;
    } else {
      // For regular skills, use the existing logic
      
      // Get invested points from character data
      const characterSkills = system.skills || {};
      const characterSkill = characterSkills[categoryKey]?.[skillKey];
      if (characterSkill && characterSkill.value !== undefined) {
        investedValue = characterSkill.value;
      }
      
      // Get species base value (simplified version)
      const speciesName = system.personal?.species;
      if (speciesName) {
        // Try to get species data from compendium
        const speciesCompendium = game.packs.get("runequest3.species");
        if (speciesCompendium) {
          try {
            const speciesItems = await speciesCompendium.getDocuments();
            const speciesItem = speciesItems.find(item => item.name === speciesName);
            
            if (speciesItem && speciesItem.system.skills) {
              // Map skill key to species skill key (simplified mapping)
              const skillMapping = {
                // Agility
                boat: 'boat', climb: 'climb', dodge: 'dodge', jump: 'jump',
                ride: 'ride', swim: 'swim', throw: 'throw',
                // Communication
                fastTalk: 'fast_talk', orate: 'orate', sing: 'sing',
                speakOwnLanguage: 'speak_own_language', speakOtherLanguage: 'speak_other_language',
                speakTradeTalk: 'speak_trade_talk',
                // Knowledge
                animalLore: 'animal_lore', evaluateItem: 'evaluate', firstAid: 'first_aid',
                humanLore: 'human_lore', mineralLore: 'mineral_lore', plantLore: 'plant_lore',
                readWriteLanguages: 'read_write', worldLore: 'world_lore', craft: 'craft',
                shiphandling: 'shiphandling', alchemicalLore: 'alchemical_lore',
                // Manipulation
                conceal: 'conceal', devise: 'devise', sleight: 'sleight',
                playInstrument: 'play_instrument',
                // Perception
                listen: 'listen', scan: 'scan', search: 'search', track: 'track',
                tasteAnalysis: 'taste_analysis',
                // Stealth
                hide: 'hide', sneak: 'sneak'
              };
              
              const speciesSkillKey = skillMapping[skillKey];
              if (speciesSkillKey && speciesItem.system.skills[speciesSkillKey] !== undefined) {
                baseValue = Number(speciesItem.system.skills[speciesSkillKey]);
              }
            }
          } catch (error) {
            console.error("Error getting species skill data for roll:", error);
          }
        }
      }
      
      // If no species base value, use the skill's default base chance if there's a species
      if (baseValue === 0 && speciesName) {
        const skillData = CONFIG.RQ3.skills[categoryKey].skills[skillKey];
        baseValue = skillData.baseChance || 0;
      }
    }
    
    // Calculate category bonus (simplified version)
    let categoryBonus = 0;
    const characteristics = system.characteristics;
    
    // Primary Influence: +1% per point above 10, -1% per point below 10
    const calculatePrimaryInfluence = (charValue) => charValue - 10;
    
    // Secondary Influence: +1% per 2 points above 10, -1% per 2 points below 10
    // Maximum +10% bonus (characteristic points above 30 are ignored)
    // Round up for positive values, round down for negative values
    const calculateSecondaryInfluence = (charValue) => {
      const effectiveValue = Math.min(charValue, 30); // Cap at 30
      const difference = effectiveValue - 10;
      let bonus;
      if (difference >= 0) {
        bonus = Math.ceil(difference / 2); // Round up for positive
      } else {
        bonus = Math.floor(difference / 2); // Round down (more negative) for negative
      }
      return Math.max(-10, Math.min(10, bonus)); // Clamp between -10 and +10
    };
    
    // Negative Influence: -1% per point above 10, +1% per point below 10
    const calculateNegativeInfluence = (charValue) => 10 - charValue;
    
    switch (categoryKey) {
      case 'agility':
        categoryBonus = calculatePrimaryInfluence(characteristics.dex?.current || 10) +
                      calculateSecondaryInfluence(characteristics.str?.current || 10) +
                      calculateNegativeInfluence(characteristics.siz?.current || 10);
        break;
      case 'communication':
        categoryBonus = calculatePrimaryInfluence(characteristics.int?.current || 10) +
                      calculateSecondaryInfluence(characteristics.pow?.current || 10) +
                      calculateSecondaryInfluence(characteristics.app?.current || 10);
        break;
      case 'knowledge':
        categoryBonus = calculatePrimaryInfluence(characteristics.int?.current || 10);
        break;
      case 'manipulation':
        categoryBonus = calculatePrimaryInfluence(characteristics.int?.current || 10) +
                      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
                      calculateSecondaryInfluence(characteristics.str?.current || 10);
        break;
      case 'perception':
        categoryBonus = calculatePrimaryInfluence(characteristics.int?.current || 10) +
                      calculateSecondaryInfluence(characteristics.pow?.current || 10) +
                      calculateSecondaryInfluence(characteristics.con?.current || 10);
        break;
      case 'stealth':
        categoryBonus = calculatePrimaryInfluence(characteristics.dex?.current || 10) +
                      calculateNegativeInfluence(characteristics.siz?.current || 10) +
                      calculateNegativeInfluence(characteristics.pow?.current || 10);
        break;
      case 'weapon':
        // Attack Modifier equals Manipulation modifier (INT, DEX = Primary, STR = Secondary)
        categoryBonus = calculatePrimaryInfluence(characteristics.int?.current || 10) +
                      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
                      calculateSecondaryInfluence(characteristics.str?.current || 10);
        break;
    }
    
    // Calculate final skill value: base + invested + category bonus
    // Category bonus applies to all skills (including those with 0 base and 0 invested)
    skillValue = Math.max(0, baseValue + investedValue + categoryBonus);
    
    skillValue += modifier;

    const roll = new Roll("1d100");
    await roll.evaluate(); // Evaluate the roll to get roll.total

    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Skill Roll: ${skillName}</strong><br/>
        Base: ${baseValue}%<br/>
        Invested: ${investedValue}%<br/>
        Category Bonus: ${categoryBonus >= 0 ? '+' : ''}${categoryBonus}%<br/>
        ${modifier !== 0 ? `Modifier: ${modifier >= 0 ? '+' : ''}${modifier}%<br/>` : ''}
        <strong>Total: ${skillValue}%</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);

    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, skillValue);

    // Note: Training ticks are now manually controlled by the user
    // They can click on the training tick icons to toggle training readiness

    // Send to chat
    const messageData = {
      content: `
        <div class="rq3-skill-roll">
          <h3>${skillName}</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${skillValue}
          </div>
          <div class="result-text ${result.resultClass}">
            ${result.resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    };

    await ChatMessage.create(messageData);

    return { 
      roll, 
      success: result.isSuccess || result.isSpecial || result.isCritical, 
      critical: result.isCritical,
      special: result.isSpecial,
      fumble: result.isFumble 
    };
  }

  /**
   * Roll a characteristic check
   * @param {string} characteristic - Characteristic to roll against
   * @param {number} modifier - Modifier to apply
   */
  async rollCharacteristic(characteristic, modifier = 0) {
    const char = this.system.characteristics[characteristic];
    if (!char) {
      ui.notifications.error(`Characteristic ${characteristic} not found`);
      return;
    }

    const target = (char.current * 5) + modifier;
    const roll = new Roll("1d100");
    await roll.evaluate();

    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Characteristic Roll: ${characteristic.toUpperCase()}</strong><br/>
        ${characteristic.toUpperCase()}: ${char.current}<br/>
        Multiplier: x5<br/>
        ${modifier !== 0 ? `Modifier: ${modifier >= 0 ? '+' : ''}${modifier}<br/>` : ''}
        <strong>Target: ${target}</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);

    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, target);

    // Note: POW training ticks are now manually controlled by the user
    // They can click on the training tick icon to toggle training readiness

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x5 Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${result.resultClass}">
            ${result.resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { 
      roll, 
      success: result.isSuccess || result.isSpecial || result.isCritical, 
      critical: result.isCritical,
      special: result.isSpecial,
      fumble: result.isFumble 
    };
  }

  /**
   * Roll a characteristic check with x5 multiplier
   * @param {string} characteristic - Characteristic to roll against
   */
  async rollCharacteristicX5(characteristic) {
    const char = this.system.characteristics[characteristic];
    if (!char) {
      ui.notifications.error(`Characteristic ${characteristic} not found`);
      return;
    }

    const target = char.current * 5;
    const roll = new Roll("1d100");
    await roll.evaluate();

    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Characteristic Roll: ${characteristic.toUpperCase()}</strong><br/>
        ${characteristic.toUpperCase()}: ${char.current}<br/>
        Multiplier: x5<br/>
        <strong>Target: ${target}</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);

    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, target);

    // Note: POW training ticks are now manually controlled by the user
    // They can click on the training tick icon to toggle training readiness

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x5 Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${result.resultClass}">
            ${result.resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { 
      roll, 
      success: result.isSuccess || result.isSpecial || result.isCritical, 
      critical: result.isCritical,
      special: result.isSpecial,
      fumble: result.isFumble 
    };
  }

  /**
   * Roll a characteristic check with custom multiplier
   * @param {string} characteristic - Characteristic to roll against
   */
  /**
   * Reset all current characteristic values to their original values
   */
  async resetCurrentValues() {
    const updateData = {};
    
    for (let [key, char] of Object.entries(this.system.characteristics)) {
      updateData[`system.characteristics.${key}.current`] = char.value;
    }
    
    await this.update(updateData);
    
    ui.notifications.info(`${this.name}'s current characteristic values have been reset to original values.`);
  }
  /**
   * Show the roll multiplier overlay modal
   * @param {string} characteristic - Characteristic name
   * @param {Object} char - Characteristic data
   * @returns {Promise<number|null>} Selected multiplier or null if cancelled
   * @private
   */
  async _showRollMultiplierOverlay(characteristic, char) {
    return new Promise((resolve) => {
      // Create overlay HTML
      const overlayHTML = `
        <div class="rq3-roll-overlay" id="rq3-roll-overlay">
          <div class="rq3-roll-modal">
            <div class="rq3-roll-modal-header">
              <h2 class="rq3-roll-modal-title">${characteristic.toUpperCase()} Custom Roll</h2>
              <button class="rq3-roll-modal-close" data-action="close">&times;</button>
            </div>
            <div class="rq3-roll-modal-content">
              <p class="characteristic-info">Select multiplier for ${characteristic.toUpperCase()} (${char.current})</p>
              <p class="instruction">Click a button to roll immediately</p>
              <div class="rq3-roll-multiplier-grid">
                ${Array.from({length: 10}, (_, i) => {
                  const mult = i + 1;
                  const target = char.current * mult;
                  const isRecommended = mult === 5; // x5 is commonly used
                  return `
                    <button class="rq3-roll-multiplier-btn ${isRecommended ? 'recommended' : ''}" 
                            data-multiplier="${mult}">
                      <div class="multiplier">x${mult}</div>
                      <div class="target">(${target})</div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      `;

      // Add overlay to document body
      const overlayElement = $(overlayHTML);
      $('body').append(overlayElement);

      // Show the overlay with a slight delay for the animation
      setTimeout(() => {
        overlayElement.addClass('show');
      }, 10);

      // Set up click-outside functionality
      const clickHandler = (event) => {
        if (!overlayElement[0].contains(event.target)) {
          this._closeRollOverlay(overlayElement);
          $(document).off('click', clickHandler);
        }
      };
      
      // Set up escape key functionality
      const escapeHandler = (event) => {
        if (event.key === 'Escape') {
          this._closeRollOverlay(overlayElement);
          $(document).off('keydown', escapeHandler);
          resolve(null);
        }
      };
      
      // Set up button click handlers
      overlayElement.find('.rq3-roll-multiplier-btn').on('click', (event) => {
        const multiplier = parseInt($(event.currentTarget).data('multiplier'));
        this._closeRollOverlay(overlayElement);
        $(document).off('keydown', escapeHandler);
        resolve(multiplier);
      });
      
      $(document).on('keydown', escapeHandler);
      $(document).on('click', clickHandler);
      
      // Auto-close after 30 seconds
      setTimeout(() => {
        if ($('body').find(overlayElement).length) {
          this._closeRollOverlay(overlayElement);
          $(document).off('keydown', escapeHandler);
          $(document).off('click', clickHandler);
          resolve(null);
        }
      }, 30000);
    });
  }

  /**
   * Roll a characteristic check with custom multiplier
   * @param {string} characteristic - Characteristic to roll against
   */
  async rollCharacteristicCustom(characteristic, targetElement = null) {
    console.log('RQ3 | rollCharacteristicCustom called with characteristic:', characteristic);
    
    const char = this.system.characteristics[characteristic];
    if (!char) {
      ui.notifications.error(`Characteristic ${characteristic} not found`);
      return;
    }
    
    console.log('RQ3 | Characteristic data:', char);
    
    // Use provided target element or try to find the x5 button
    let buttonElement = targetElement;
    if (!buttonElement) {
      buttonElement = document.querySelector(`[data-characteristic="${characteristic}"].characteristic-roll-x5`);
    }
    
    console.log('RQ3 | Button element found:', buttonElement);
    
    if (!buttonElement) {
      console.error(`Could not find characteristic roll button for ${characteristic}`);
      return;
    }

    console.log('RQ3 | About to call showCharacteristicRollTooltip');
    
    // Show tooltip and get multiplier
    const multiplier = await this.showCharacteristicRollTooltip(characteristic, buttonElement);
    
    console.log('RQ3 | Tooltip returned multiplier:', multiplier);

    if (multiplier === null) return;

    const target = char.current * multiplier;
    const roll = new Roll("1d100");
    await roll.evaluate();

    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Characteristic Roll: ${characteristic.toUpperCase()}</strong><br/>
        ${characteristic.toUpperCase()}: ${char.current}<br/>
        Multiplier: x${multiplier}<br/>
        <strong>Target: ${target}</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);

    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, target);

    // Note: POW training ticks are now manually controlled by the user
    // They can click on the training tick icon to toggle training readiness

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x${multiplier} Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${result.resultClass}">
            ${result.resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { 
      roll, 
      success: result.isSuccess || result.isSpecial || result.isCritical, 
      critical: result.isCritical,
      special: result.isSpecial,
      fumble: result.isFumble 
    };
  }

  /**
   * Close the roll overlay modal with animation
   * @param {jQuery} overlayElement - The overlay element to close
   * @private
   */
  _closeRollOverlay(overlayElement) {
    overlayElement.removeClass('show');
    setTimeout(() => {
      overlayElement.remove();
    }, 300); // Wait for animation to complete
  }

  /**
   * Show hit location damage adjustment tooltip
   * @param {string} hitLocation - Hit location name (head, leftArm, etc.)
   * @param {HTMLElement} targetElement - The HP indicator element to position relative to
   * @returns {Promise<void>}
   */
  async showHitLocationDamageTooltip(hitLocation, targetElement) {
    console.log('RQ3 | showHitLocationDamageTooltip - Starting with:', { hitLocation, targetElement });
    
    return new Promise((resolve) => {
      const hitLocationData = this.system.hitLocations[hitLocation];
      console.log('RQ3 | showHitLocationDamageTooltip - hitLocationData:', hitLocationData);
      
      if (!hitLocationData) {
        console.error(`Hit location ${hitLocation} not found`);
        resolve();
        return;
      }

      const damage = hitLocationData.damage || 0;
      const maxHP = hitLocationData.maxHitPoints || 1;
      const currentHP = Math.max(0, maxHP - damage);
      const percentage = Math.round((currentHP / maxHP) * 100);
      
      // Determine HP status color
      let statusClass = 'healthy';
      if (percentage <= 0) statusClass = 'critical';
      else if (percentage <= 25) statusClass = 'critical';
      else if (percentage <= 50) statusClass = 'wounded';
      else if (percentage <= 75) statusClass = 'injured';

      // Format hit location name for display
      const locationDisplayName = this._formatHitLocationName(hitLocation);

      // Create tooltip HTML
      const tooltipHTML = `
        <div class="rq3-damage-tooltip" id="rq3-damage-tooltip-${hitLocation}">
          <div class="rq3-damage-tooltip-header">
            <div class="rq3-damage-tooltip-title">${locationDisplayName}</div>
          </div>
          
          <div class="rq3-damage-tooltip-content">
            <div class="rq3-damage-info">
              <div class="rq3-damage-current">
                <span>Current HP:</span>
                <span class="rq3-hp-current-value ${statusClass}">${currentHP}/${maxHP}</span>
              </div>
              <div class="rq3-damage-effective">
                <span>Damage Taken:</span>
                <span>${damage}</span>
              </div>
            </div>
            <div class="rq3-damage-controls">
              <button class="rq3-damage-button" data-action="damage" data-amount="1">-</button>
              <div class="rq3-damage-value">${damage}</div>
              <button class="rq3-damage-button" data-action="heal" data-amount="1">+</button>
            </div>
            <button class="rq3-damage-reset" data-action="reset">Reset Damage</button>
          </div>
        </div>
      `;

      // Add tooltip to document body - try both jQuery and native methods
      const tooltipElement = $(tooltipHTML);
      console.log('RQ3 | showHitLocationDamageTooltip - Created tooltip element:', tooltipElement);
      console.log('RQ3 | showHitLocationDamageTooltip - Tooltip HTML:', tooltipHTML);
      
      // Try jQuery append first
      $('body').append(tooltipElement);
      console.log('RQ3 | showHitLocationDamageTooltip - Appended tooltip to body with jQuery');
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(`rq3-damage-tooltip-${hitLocation}`);
      if (!immediateCheck) {
        console.error('RQ3 | showHitLocationDamageTooltip - Tooltip was not added to DOM!');
        resolve();
        return;
      }

      // Position the tooltip vertically centered with the target
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      // Calculate initial position (to the right of the target)
      let left = targetRect.right + 10;
      // Center vertically with the target element
      let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      
      // Adjust for viewport edges
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // If tooltip would go off the right edge, position it to the left
      if (left + tooltipRect.width > viewportWidth - 20) {
        left = targetRect.left - tooltipRect.width - 10;
      }
      
      // Ensure tooltip stays within viewport vertically
      top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));
      
      console.log('RQ3 | showHitLocationDamageTooltip - Final positioning at:', { left, top });
      console.log('RQ3 | showHitLocationDamageTooltip - Viewport dimensions:', { width: viewportWidth, height: viewportHeight });
      
      tooltipElement.css({
        position: 'fixed !important',
        left: left + 'px !important',
        top: top + 'px !important',
        zIndex: 1000,
        // Ensure visibility
        display: 'block !important',
        visibility: 'visible !important',
        opacity: '1 !important',
        pointerEvents: 'auto !important'
      });
      
      // Also set the styles directly on the DOM element to ensure they take precedence
      const tooltipDomElement = tooltipElement[0];
      tooltipDomElement.style.setProperty('position', 'fixed', 'important');
      tooltipDomElement.style.setProperty('left', left + 'px', 'important');
      tooltipDomElement.style.setProperty('top', top + 'px', 'important');
      tooltipDomElement.style.setProperty('z-index', '1000', 'important');
      
      console.log('RQ3 | showHitLocationDamageTooltip - Applied inline styles directly to DOM element');
      console.log('RQ3 | showHitLocationDamageTooltip - Final tooltip styles:', {
        position: tooltipDomElement.style.position,
        left: tooltipDomElement.style.left,
        top: tooltipDomElement.style.top,
        zIndex: tooltipDomElement.style.zIndex
      });

      // Show tooltip immediately
      tooltipElement.addClass('show');
      console.log('RQ3 | showHitLocationDamageTooltip - Added show class, tooltip should be visible now');
      
      // Set up click-outside functionality
      const handleClickOutside = async (event) => {
        const tooltip = document.getElementById(`rq3-damage-tooltip-${hitLocation}`);
        if (!tooltip) return; // Tooltip already closed
        
        if (!tooltip.contains(event.target)) {
          console.log('RQ3 | showHitLocationDamageTooltip - Click outside detected, closing tooltip');
          
          // Create summary chat message if there were changes
          if (changesTracker.length > 0) {
            const finalHP = Math.max(0, maxHP - currentDamageValue);
            const originalHP = currentHP;
            let message = `${this.name}'s ${locationDisplayName} HP: ${originalHP} → ${finalHP}`;

            if (finalHP <= 0) message += " (Disabled!)";
            else if (currentDamageValue === 0) message += " (Fully Healed!)";
            else if (finalHP > originalHP) message += " (Healed)";
            else if (finalHP < originalHP) message += " (Damaged)";

            await ChatMessage.create({
              content: `<div class="rq3-hit-location-hp-change"><strong>${message}</strong></div>`,
              speaker: ChatMessage.getSpeaker({ actor: this })
            });
          }

          // Remove the tooltip
          tooltip.remove();
          
          // Clean up event listeners
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          
          resolve();
        }
      };

      // Set up escape key functionality
      const handleEscape = async (event) => {
        if (event.key === 'Escape') {
          console.log('RQ3 | showHitLocationDamageTooltip - Escape key pressed, closing tooltip');
          
          const tooltip = document.getElementById(`rq3-damage-tooltip-${hitLocation}`);
          if (!tooltip) return;
          
          // Create summary chat message if there were changes
          if (changesTracker.length > 0) {
            const finalHP = Math.max(0, maxHP - currentDamageValue);
            const originalHP = currentHP;
            let message = `${this.name}'s ${locationDisplayName} HP: ${originalHP} → ${finalHP}`;

            if (finalHP <= 0) message += " (Disabled!)";
            else if (currentDamageValue === 0) message += " (Fully Healed!)";
            else if (finalHP > originalHP) message += " (Healed)";
            else if (finalHP < originalHP) message += " (Damaged)";

            await ChatMessage.create({
              content: `<div class="rq3-hit-location-hp-change"><strong>${message}</strong></div>`,
              speaker: ChatMessage.getSpeaker({ actor: this })
            });
          }

          // Remove the tooltip
          tooltip.remove();
          
          // Clean up event listeners
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          
          resolve();
        }
      };

      // Add event listeners
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      console.log('RQ3 | showHitLocationDamageTooltip - Added click-outside and escape key handlers');
      
      // Tooltip is now properly positioned and has event handlers
      console.log('RQ3 | showHitLocationDamageTooltip - Tooltip setup complete');

      let currentDamageValue = damage;
      let changesTracker = [];

      // Update display and auto-save function (now works with damage)
      const updateDisplayAndSave = async (damageChange) => {
        const oldDamage = currentDamageValue;
        const newDamage = currentDamageValue + damageChange; // Allow damage to go negative (HP can exceed max)
        currentDamageValue = newDamage;
        
        const newCurrentHP = Math.max(0, maxHP - newDamage);
        const newPercentage = Math.round((newCurrentHP / maxHP) * 100);
        
        // Update status class
        let newStatusClass = 'healthy';
        if (newCurrentHP <= 0) newStatusClass = 'critical';
        else if (newPercentage <= 25) newStatusClass = 'critical';
        else if (newPercentage <= 50) newStatusClass = 'wounded';
        else if (newPercentage <= 75) newStatusClass = 'injured';

        // Update tooltip display
        tooltipElement.find('.rq3-damage-value').text(newDamage);
        tooltipElement.find('.rq3-damage-effective span').last().text(newDamage);
        tooltipElement.find('.rq3-hp-current-value')
          .text(`${newCurrentHP}/${maxHP}`)
          .removeClass('healthy injured wounded critical')
          .addClass(newStatusClass);
        
        // Update the main HP display
        const hpElement = $(`[data-hit-location="${hitLocation}"] .hp-value`);
        if (hpElement.length) {
          hpElement.text(`${newCurrentHP}/${maxHP}`);
        }

        // Auto-save the damage change
        await this.update({
          [`system.hitLocations.${hitLocation}.damage`]: newDamage
        });

        // Track significant changes for final message
        if (Math.abs(newDamage - oldDamage) >= 1) {
          changesTracker.push({ fromDamage: oldDamage, toDamage: newDamage, fromHP: maxHP - oldDamage, toHP: newCurrentHP });
        }
      };

      // Handle damage adjustment buttons with auto-save
      tooltipElement.on('click', '.rq3-damage-button[data-action="damage"]', async (event) => {
        event.stopPropagation();
        await updateDisplayAndSave(-1); // -1 damage (healing) - + button heals
      });

      tooltipElement.on('click', '.rq3-damage-button[data-action="heal"]', async (event) => {
        event.stopPropagation();
        await updateDisplayAndSave(1); // +1 damage - minus button damages
      });

      // Reset button handler
      tooltipElement.on('click', '.rq3-damage-reset', async (event) => {
        event.stopPropagation();
        const currentDamage = parseInt(tooltipElement.find('.rq3-damage-value').text());
        await updateDisplayAndSave(-currentDamage); // Reset to 0 damage
      });

      // Handle close button
      tooltipElement.on('click', '[data-action="close"]', async () => {
        console.log('RQ3 | showHitLocationDamageTooltip - Close button clicked');
        
        // Create summary chat message if there were changes
        if (changesTracker.length > 0) {
          const finalHP = Math.max(0, maxHP - currentDamageValue);
          const originalHP = currentHP;
          let message = `${this.name}'s ${locationDisplayName} HP: ${originalHP} → ${finalHP}`;
          
          if (finalHP <= 0) message += " (Disabled!)";
          else if (currentDamageValue === 0) message += " (Fully Healed!)";
          else if (finalHP > originalHP) message += " (Healed)";
          else if (finalHP < originalHP) message += " (Damaged)";
          
          await ChatMessage.create({
            content: `<div class="rq3-hit-location-hp-change"><strong>${message}</strong></div>`,
            speaker: ChatMessage.getSpeaker({ actor: this })
          });
        }
        
        // Remove the tooltip
        const tooltip = document.getElementById(`rq3-damage-tooltip-${hitLocation}`);
        if (tooltip) {
          tooltip.remove();
        }
        
        // Clean up event listeners
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        
        resolve();
      });
    });
  }

  /**
   * Show armor damage adjustment tooltip
   * @param {string} hitLocation - Hit location name (head, leftArm, etc.)
   * @param {string} armorId - ID of the armor item
   * @param {HTMLElement} targetElement - The AP indicator element to position relative to
   * @returns {Promise<void>}
   */
  async showArmorDamageTooltip(hitLocation, armorId, targetElement) {
    console.log('RQ3 | showArmorDamageTooltip - Starting with:', { hitLocation, armorId, targetElement });
    
    if (!armorId) {
      console.warn('RQ3 | No armor equipped at this location');
      return;
    }
    
    return new Promise((resolve) => {
      const armorItem = this.items.get(armorId);
      console.log('RQ3 | showArmorDamageTooltip - armorItem:', armorItem);
      
      if (!armorItem) {
        console.error(`Armor item ${armorId} not found`);
        resolve();
        return;
      }

      const maxAP = armorItem.system.hitLocations[hitLocation] || 0;
      const damage = armorItem.system.armorDamage[hitLocation] || 0;
      const currentAP = Math.max(0, maxAP - damage);
      const tempAP = this.system.hitLocations[hitLocation]?.tempArmor || 0;
      const totalAP = currentAP + tempAP;
      const percentage = maxAP > 0 ? Math.round((currentAP / maxAP) * 100) : 0;
      
      // Determine AP status color
      let statusClass = 'healthy';
      if (percentage <= 0) statusClass = 'critical';
      else if (percentage <= 25) statusClass = 'critical';
      else if (percentage <= 50) statusClass = 'wounded';
      else if (percentage <= 75) statusClass = 'injured';

      // Format hit location name for display
      const locationDisplayName = this._formatHitLocationName(hitLocation);

      // Create tooltip HTML
      const tooltipHTML = `
        <div class="rq3-damage-tooltip" id="rq3-armor-tooltip-${hitLocation}">
          <div class="rq3-damage-tooltip-header">
            <div class="rq3-damage-tooltip-title">${locationDisplayName} Armor - ${armorItem.name}</div>
          </div>
          
          <div class="rq3-damage-tooltip-content">
            <div class="rq3-damage-info">
              <div class="rq3-damage-current">
                <span>Current AP:</span>
                <span class="rq3-hp-current-value ${statusClass}">${totalAP}/${maxAP}</span>
              </div>
              <div class="rq3-damage-effective">
                <span>Armor Damage:</span>
                <span>${damage}</span>
              </div>
              <div class="rq3-damage-effective">
                <span>Temporary AP:</span>
                <span>${tempAP}</span>
              </div>
            </div>
            <div class="rq3-damage-controls">
              <button class="rq3-damage-button" data-action="repair" data-amount="1">-</button>
              <div class="rq3-damage-value">${damage}</div>
              <button class="rq3-damage-button" data-action="damage" data-amount="1">+</button>
            </div>
            <button class="rq3-damage-reset" data-action="reset">Repair All</button>
            <div class="rq3-damage-controls">
              <button class="rq3-damage-button" data-action="remove-temp" data-amount="1">-</button>
              <div class="rq3-damage-value">${tempAP}</div>
              <button class="rq3-damage-button" data-action="add-temp" data-amount="1">+</button>
            </div>
            <button class="rq3-damage-reset" data-action="clear-temp">Clear Temp AP</button>
          </div>
        </div>
      `;

      // Add tooltip to document body
      const tooltipElement = $(tooltipHTML);
      console.log('RQ3 | showArmorDamageTooltip - Created tooltip element:', tooltipElement);
      
      $('body').append(tooltipElement);
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(`rq3-armor-tooltip-${hitLocation}`);
      if (!immediateCheck) {
        console.error('RQ3 | showArmorDamageTooltip - Tooltip was not added to DOM!');
        resolve();
        return;
      }

      // Position the tooltip
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      let left = targetRect.right + 10;
      let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      
      // Adjust for viewport edges
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left + tooltipRect.width > viewportWidth) {
        left = targetRect.left - tooltipRect.width - 10;
      }
      
      if (top < 10) top = 10;
      if (top + tooltipRect.height > viewportHeight - 10) {
        top = viewportHeight - tooltipRect.height - 10;
      }

      tooltipElement.css({
        left: `${left}px`,
        top: `${top}px`,
        display: 'block',
        opacity: '1'
      });

      console.log('RQ3 | showArmorDamageTooltip - Positioned tooltip');

      // Add click-outside handler
      const clickOutsideHandler = (e) => {
        const tooltip = document.getElementById(`rq3-armor-tooltip-${hitLocation}`);
        if (tooltip && !tooltip.contains(e.target) && !targetElement.contains(e.target)) {
          console.log('RQ3 | showArmorDamageTooltip - Click outside detected, closing tooltip');
          tooltip.remove();
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', escapeHandler);
          resolve();
        }
      };

      // Add escape key handler
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          console.log('RQ3 | showArmorDamageTooltip - Escape key pressed, closing tooltip');
          const tooltip = document.getElementById(`rq3-armor-tooltip-${hitLocation}`);
          if (tooltip) {
            tooltip.remove();
            document.removeEventListener('click', clickOutsideHandler);
            document.removeEventListener('keydown', escapeHandler);
            resolve();
          }
        }
      };

      // Delay adding handlers to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('click', clickOutsideHandler);
        document.addEventListener('keydown', escapeHandler);
      }, 10);

      // Track current damage and temp AP values for real-time updates
      let currentDamageValue = damage;
      let currentTempAP = tempAP;

      // Handle damage/repair buttons
      tooltipElement.find('.rq3-damage-button').on('click', async (e) => {
        e.stopPropagation();
        const action = $(e.currentTarget).data('action');
        const amount = parseInt($(e.currentTarget).data('amount')) || 1;
        
        if (action === 'damage') {
          currentDamageValue = Math.min(maxAP, currentDamageValue + amount);
        } else if (action === 'repair') {
          currentDamageValue = Math.max(0, currentDamageValue - amount);
        }
        
        // Update the armor item
        await armorItem.update({
          [`system.armorDamage.${hitLocation}`]: currentDamageValue
        });
        
        // Update the tooltip display
        const newCurrentAP = Math.max(0, maxAP - currentDamageValue);
        const newPercentage = maxAP > 0 ? Math.round((newCurrentAP / maxAP) * 100) : 0;
        
        let newStatusClass = 'healthy';
        if (newPercentage <= 0) newStatusClass = 'critical';
        else if (newPercentage <= 25) newStatusClass = 'critical';
        else if (newPercentage <= 50) newStatusClass = 'wounded';
        else if (newPercentage <= 75) newStatusClass = 'injured';
        
        tooltipElement.find('.rq3-damage-controls .rq3-damage-value').first().text(currentDamageValue);
        tooltipElement.find('.rq3-damage-effective').first().find('span').last().text(currentDamageValue);
        const newTotalAP = newCurrentAP + currentTempAP;
        tooltipElement.find('.rq3-hp-current-value')
          .text(`${newTotalAP}/${maxAP}`)
          .removeClass('healthy injured wounded critical')
          .addClass(newStatusClass);
      });

      // Handle temp AP buttons (using same button class as damage buttons)
      tooltipElement.find('button[data-action="add-temp"], button[data-action="remove-temp"]').on('click', async (e) => {
        e.stopPropagation();
        const action = $(e.currentTarget).data('action');
        const amount = parseInt($(e.currentTarget).data('amount')) || 1;
        
        if (action === 'add-temp') {
          currentTempAP = currentTempAP + amount;
        } else if (action === 'remove-temp') {
          currentTempAP = Math.max(0, currentTempAP - amount);
        }
        
        // Update the actor's hit location temp armor
        await this.update({
          [`system.hitLocations.${hitLocation}.tempArmor`]: currentTempAP
        });
        
        // Update the tooltip display
        const newCurrentAP = Math.max(0, maxAP - currentDamageValue);
        const newTotalAP = newCurrentAP + currentTempAP;
        tooltipElement.find('.rq3-damage-controls .rq3-damage-value').last().text(currentTempAP);
        tooltipElement.find('.rq3-damage-effective').last().find('span').last().text(currentTempAP);
        tooltipElement.find('.rq3-hp-current-value').text(`${newTotalAP}/${maxAP}`);
      });

      // Handle reset buttons
      tooltipElement.find('.rq3-damage-reset').on('click', async (e) => {
        e.stopPropagation();
        const action = $(e.currentTarget).data('action');
        
        if (action === 'reset') {
          // Reset armor damage for this location
          await armorItem.update({
            [`system.armorDamage.${hitLocation}`]: 0
          });
          
          // Close tooltip
          tooltipElement.remove();
          document.removeEventListener('click', clickOutsideHandler);
          document.removeEventListener('keydown', escapeHandler);
          resolve();
        } else if (action === 'clear-temp') {
          // Clear temp AP
          currentTempAP = 0;
          await this.update({
            [`system.hitLocations.${hitLocation}.tempArmor`]: 0
          });
          
          // Update display
          const newCurrentAP = Math.max(0, maxAP - currentDamageValue);
          const newTotalAP = newCurrentAP + 0; // currentTempAP is now 0
          tooltipElement.find('.rq3-damage-controls .rq3-damage-value').last().text(0);
          tooltipElement.find('.rq3-damage-effective').last().find('span').last().text(0);
          tooltipElement.find('.rq3-hp-current-value').text(`${newTotalAP}/${maxAP}`);
        }
      });

      console.log('RQ3 | showArmorDamageTooltip - Tooltip setup complete');
    });
  }

  /**
   * Format hit location name for display
   * @param {string} hitLocation - Hit location key
   * @returns {string} - Formatted display name
   * @private
   */
  _formatHitLocationName(hitLocation) {
    const nameMap = {
      head: 'Head',
      leftArm: 'Left Arm',
      rightArm: 'Right Arm',
      chest: 'Chest',
      abdomen: 'Abdomen',
      leftLeg: 'Left Leg',
      rightLeg: 'Right Leg'
    };
    return nameMap[hitLocation] || hitLocation;
  }

  /**
   * Show characteristic roll multiplier tooltip
   * @param {string} characteristic - Characteristic name
   * @param {HTMLElement} targetElement - The x? button element to position relative to
   * @returns {Promise<number|null>} Selected multiplier or null if cancelled
   */
  /**
   * Generic multiplier tooltip component - reusable for all roll types
   * @param {Object} config - Configuration object
   * @param {string} config.id - Unique ID for the tooltip
   * @param {string} config.title - Title to display
   * @param {number} config.baseValue - Base value to multiply
   * @param {Array<number>} config.multipliers - Array of multipliers to show
   * @param {number} config.recommendedMultiplier - Which multiplier to mark as recommended (optional)
   * @param {HTMLElement} config.targetElement - Element to position relative to
   * @param {Function} config.calculateTarget - Function to calculate target value (value, multiplier) => number
   * @returns {Promise<number|null>} Selected multiplier or null if cancelled
   */
  async _showMultiplierTooltip(config) {
    const {
      id,
      title,
      baseValue,
      multipliers,
      recommendedMultiplier,
      targetElement,
      calculateTarget = (value, mult) => Math.floor(value * mult)
    } = config;

    return new Promise((resolve) => {
      // Store the last mouse position for fallback positioning
      let lastMouseX = 0;
      let lastMouseY = 0;
      
      // Track mouse movement to get current position
      const trackMouse = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };
      
      document.addEventListener('mousemove', trackMouse);

      // Create tooltip HTML
      const tooltipHTML = `
        <div class="rq3-roll-tooltip" id="${id}">
          <div class="rq3-roll-tooltip-header">
            <div class="rq3-roll-tooltip-title">${title}</div>
          </div>

          <div class="rq3-roll-tooltip-content">
            <div class="rq3-roll-multiplier-grid">
              ${multipliers.map(mult => {
                const target = calculateTarget(baseValue, mult);
                const isRecommended = mult === recommendedMultiplier;
                return `
                  <button class="rq3-roll-multiplier-btn ${isRecommended ? 'recommended' : ''}"
                          data-multiplier="${mult}">
                    <div class="multiplier">x${mult}</div>
                    <div class="target">(${target})</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      // Add tooltip to document body
      const tooltipElement = $(tooltipHTML);
      $('body').append(tooltipElement);
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(id);
      if (!immediateCheck) {
        console.error(`RQ3 | Tooltip ${id} was not added to DOM!`);
        document.removeEventListener('mousemove', trackMouse);
        resolve(null);
        return;
      }

      // Positioning logic (same as characteristic tooltip)
      let left, top;
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      if (targetRect.left > 0 || targetRect.top > 0) {
        left = targetRect.right + 10;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      } else {
        const offsetLeft = targetElement.offsetLeft;
        const offsetTop = targetElement.offsetTop;
        
        if (offsetLeft > 0 || offsetTop > 0) {
          left = offsetLeft + targetElement.offsetWidth + 10;
          top = offsetTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
        } else {
          const buttonPosition = targetElement.getBoundingClientRect();
          const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          
          left = buttonPosition.left + scrollX + targetElement.offsetWidth + 10;
          top = buttonPosition.top + scrollY + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
          
          if (left <= 10 && top <= 10) {
            let currentElement = targetElement;
            let totalLeft = 0;
            let totalTop = 0;
            
            while (currentElement && currentElement !== document.body) {
              totalLeft += currentElement.offsetLeft || 0;
              totalTop += currentElement.offsetTop || 0;
              currentElement = currentElement.offsetParent;
            }
            
            if (totalLeft > 0 || totalTop > 0) {
              left = totalLeft + targetElement.offsetWidth + 10;
              top = totalTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
            }
          }
        }
      }
      
      // Ensure we have valid coordinates
      if (isNaN(left) || isNaN(top) || left < 0 || top < 0) {
        if (lastMouseX > 0 && lastMouseY > 0) {
          left = Math.max(20, Math.min(lastMouseX + 20, window.innerWidth - 520));
          top = Math.max(20, Math.min(lastMouseY - 65, window.innerHeight - 150));
        } else {
          left = Math.max(20, Math.min(window.innerWidth - 520, 100));
          top = Math.max(20, Math.min(window.innerHeight - 150, 100));
        }
      }
      
      // Adjust for viewport edges
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left + tooltipRect.width > viewportWidth - 20) {
        left = Math.max(20, left - tooltipRect.width - targetElement.offsetWidth - 20);
      }

      top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));

      // Position tooltip using CSS custom properties
      tooltipElement.addClass('positioned');
      tooltipElement[0].style.setProperty('--tooltip-left', left + 'px');
      tooltipElement[0].style.setProperty('--tooltip-top', top + 'px');

      // Show tooltip immediately
      tooltipElement.addClass('show');
      
      // Set up click-outside functionality
      const handleClickOutside = (event) => {
        const tooltip = document.getElementById(id);
        if (!tooltip) {
          return;
        }

        if (event.target === targetElement || targetElement.contains(event.target)) {
          return;
        }

        if (!tooltip.contains(event.target)) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Set up escape key functionality
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          const tooltip = document.getElementById(id);
          if (tooltip) {
            tooltip.remove();
          }
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Delay the click-outside handler to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      document.addEventListener('keydown', handleEscape);

      // Set up button click handlers
      tooltipElement.find('.rq3-roll-multiplier-btn').on('click', (event) => {
        const multiplier = parseFloat($(event.currentTarget).data('multiplier'));
        
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
        }
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousemove', trackMouse);
        resolve(multiplier);
      });

      // Auto-close after 30 seconds
      setTimeout(() => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      }, 30000);
    });
  }

  /**
   * Show spirit spell magic points selection tooltip
   * @param {string} spellName - The name of the spell
   * @param {number} maxMP - Maximum magic points for the spell
   * @param {HTMLElement} targetElement - The element to position relative to
   * @returns {Promise<number|null>} The selected MP value or null if cancelled
   */
  async showSpiritSpellMPTooltip(spellName, maxMP, targetElement) {
    console.log('RQ3 | showSpiritSpellMPTooltip - Starting with:', { spellName, maxMP, targetElement });
    
    // Get available magic points (ignore Free INT as requested)
    const currentMP = this.system.characteristics?.pow?.magicPoints?.value || 0;
    
    const mpOptions = Array.from({length: maxMP}, (_, i) => i + 1);
    const id = `rq3-spirit-mp-tooltip-${spellName.replace(/\s+/g, '-')}`;
    
    return new Promise((resolve) => {
      // Store the last mouse position for fallback positioning
      let lastMouseX = 0;
      let lastMouseY = 0;
      
      // Track mouse movement to get current position
      const trackMouse = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };
      
      document.addEventListener('mousemove', trackMouse);

      // Create tooltip HTML
      const tooltipHTML = `
        <div class="rq3-roll-tooltip" id="${id}">
          <div class="rq3-roll-tooltip-header">
            <div class="rq3-roll-tooltip-title">${spellName} - Select Magic Points</div>
          </div>

          <div class="rq3-roll-tooltip-content">
            <div class="rq3-roll-multiplier-grid">
              ${mpOptions.map(mp => {
                const hasEnoughMP = mp <= currentMP;
                const disabledClass = !hasEnoughMP ? 'disabled' : '';
                const disabledAttr = !hasEnoughMP ? 'disabled' : '';
                const opacityStyle = !hasEnoughMP ? 'opacity: 0.4; cursor: not-allowed;' : '';
                return `
                  <button class="rq3-roll-multiplier-btn ${disabledClass}"
                          data-mp="${mp}"
                          ${disabledAttr}
                          style="${opacityStyle}">
                    <div class="multiplier">${mp} MP</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      // Add tooltip to document body
      const tooltipElement = $(tooltipHTML);
      $('body').append(tooltipElement);
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(id);
      if (!immediateCheck) {
        console.error(`RQ3 | Tooltip ${id} was not added to DOM!`);
        document.removeEventListener('mousemove', trackMouse);
        resolve(null);
        return;
      }

      // Positioning logic (same as multiplier tooltip)
      let left, top;
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      if (targetRect.left > 0 || targetRect.top > 0) {
        left = targetRect.right + 10;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      } else {
        const offsetLeft = targetElement.offsetLeft;
        const offsetTop = targetElement.offsetTop;
        
        if (offsetLeft > 0 || offsetTop > 0) {
          left = offsetLeft + targetElement.offsetWidth + 10;
          top = offsetTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
        } else {
          const buttonPosition = targetElement.getBoundingClientRect();
          const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          
          left = buttonPosition.left + scrollX + targetElement.offsetWidth + 10;
          top = buttonPosition.top + scrollY + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
          
          if (left <= 10 && top <= 10) {
            let currentElement = targetElement;
            let totalLeft = 0;
            let totalTop = 0;
            
            while (currentElement && currentElement !== document.body) {
              totalLeft += currentElement.offsetLeft || 0;
              totalTop += currentElement.offsetTop || 0;
              currentElement = currentElement.offsetParent;
            }
            
            if (totalLeft > 0 || totalTop > 0) {
              left = totalLeft + targetElement.offsetWidth + 10;
              top = totalTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
            }
          }
        }
      }
      
      // Ensure we have valid coordinates
      if (isNaN(left) || isNaN(top) || left < 0 || top < 0) {
        if (lastMouseX > 0 && lastMouseY > 0) {
          left = Math.max(20, Math.min(lastMouseX + 20, window.innerWidth - 520));
          top = Math.max(20, Math.min(lastMouseY - 65, window.innerHeight - 150));
        } else {
          left = Math.max(20, Math.min(window.innerWidth - 520, 100));
          top = Math.max(20, Math.min(window.innerHeight - 150, 100));
        }
      }
      
      // Adjust for viewport edges
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left + tooltipRect.width > viewportWidth - 20) {
        left = Math.max(20, left - tooltipRect.width - targetElement.offsetWidth - 20);
      }

      top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));

      // Position tooltip using CSS custom properties
      tooltipElement.addClass('positioned');
      tooltipElement[0].style.setProperty('--tooltip-left', left + 'px');
      tooltipElement[0].style.setProperty('--tooltip-top', top + 'px');

      // Show tooltip immediately
      tooltipElement.addClass('show');
      
      // Set up click-outside functionality
      const handleClickOutside = (event) => {
        const tooltip = document.getElementById(id);
        if (!tooltip) {
          return;
        }

        if (event.target === targetElement || targetElement.contains(event.target)) {
          return;
        }

        if (!tooltip.contains(event.target)) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Set up escape key functionality
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          const tooltip = document.getElementById(id);
          if (tooltip) {
            tooltip.remove();
          }
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Delay the click-outside handler to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      document.addEventListener('keydown', handleEscape);

      // Set up button click handlers
      tooltipElement.find('.rq3-roll-multiplier-btn').on('click', (event) => {
        // Don't process clicks on disabled buttons
        if ($(event.currentTarget).prop('disabled')) {
          return;
        }
        
        const selectedMP = parseInt($(event.currentTarget).data('mp'));
        
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
        }
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousemove', trackMouse);
        resolve(selectedMP);
      });

      // Auto-close after 30 seconds
      setTimeout(() => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      }, 30000);
    });
  }

  /**
   * Show sorcery spell MP allocation popup
   * @param {string} spellName - The name of the spell
   * @param {HTMLElement} targetElement - The element to position relative to
   * @param {Object} spellItem - The spell item document
   * @returns {Promise<Object|null>} The selected MP allocations {intensity, range, duration, multispell} or null if cancelled
   */
  async showSorcerySpellMPAllocationTooltip(spellName, targetElement, spellItem) {
    console.log('RQ3 | showSorcerySpellMPAllocationTooltip - Starting with:', { spellName, targetElement, spellItem });
    
    const id = `rq3-sorcery-mp-allocation-tooltip-${spellName.replace(/\s+/g, '-')}`;
    
    // Get Free INT and skill values
    const freeIntMax = this.system.magic?.freeInt?.current || 0;
    
    // Calculate current available Free INT (what's shown at top of sheet)
    // This matches the calculation in _prepareItems: freeIntRemaining = max - (spirit MP + sorcery count)
    // We need to include ALL spells in standard storage to match the sheet display
    const allSpiritSpells = this.items.filter(i => 
      i.type === 'spell' && 
      i.system.spellType === 'spirit' &&
      (i.system.spellStorageLocation || 'standard') === 'standard'
    );
    const allSpiritMP = allSpiritSpells.reduce((sum, spell) => sum + (spell.system.magicPoints || 0), 0);
    
    const allSorcerySpells = this.items.filter(i => 
      i.type === 'spell' && 
      i.system.spellType === 'sorcery' && 
      (i.system.spellStorageLocation || 'standard') === 'standard'
    );
    const allSorceryCount = allSorcerySpells.length;
    
    // Current available Free INT = max - (all spirit MP + all sorcery count)
    // This matches what's shown on the sheet (freeIntRemaining)
    // The sheet counts sorcery spells as 1 Free INT each, so we do the same here
    const freeIntCurrent = Math.max(0, freeIntMax - allSpiritMP - allSorceryCount);
    
    // Get available magic points
    const currentMP = this.system.characteristics?.pow?.magicPoints?.value || 0;
    const maxMP = this.system.characteristics?.pow?.magicPoints?.max || 0;
    
    const magicRating = this.system.magic?.magicRating?.value || 0;
    const encPenalty = Math.ceil(this.system.attributes?.encumbrance?.total || 0);
    const spellInvested = spellItem?.system?.invested || 0;
    const spellTotalPercent = Math.max(0, spellInvested + magicRating - encPenalty);
    
    // Get skill % values (base + invested + Magic Rating)
    const intensityBase = this.system.magic?.intensity?.base || 0;
    const intensityInvested = this.system.magic?.intensity?.invested || 0;
    const intensityPercent = intensityBase + intensityInvested + magicRating;
    
    const rangeBase = this.system.magic?.range?.base || 0;
    const rangeInvested = this.system.magic?.range?.invested || 0;
    const rangePercent = rangeBase + rangeInvested + magicRating;
    
    const durationBase = this.system.magic?.duration?.base || 0;
    const durationInvested = this.system.magic?.duration?.invested || 0;
    const durationPercent = durationBase + durationInvested + magicRating;
    
    const multispellBase = this.system.magic?.multispell?.base || 0;
    const multispellInvested = this.system.magic?.multispell?.invested || 0;
    const multispellPercent = multispellBase + multispellInvested + magicRating;
    
    return new Promise((resolve) => {
      // Initial MP values: Intensity = 1, others = 0
      let intensityMP = 1;
      let rangeMP = 0;
      let durationMP = 0;
      let multispellMP = 0;
      
      // Store the last mouse position for fallback positioning
      let lastMouseX = 0;
      let lastMouseY = 0;
      
      // Track mouse movement to get current position
      const trackMouse = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      };
      
      document.addEventListener('mousemove', trackMouse);

      // Get duration description based on MP allocation
      const getDurationDescription = (mp) => {
        const durationTable = {
          0: "10 minutes",
          1: "20 minutes",
          2: "40 minutes",
          3: "80 minutes (1 hour+)",
          4: "160 minutes (2 hours+)",
          5: "320 minutes (4 hours+)",
          6: "640 minutes (10 hours+)",
          7: "1280 minutes (21 hours+)",
          8: "2560 minutes (1 day+)",
          9: "5120 minutes (3 days+)",
          10: "10240 minutes (1 week+)",
          11: "20480 minutes (2 weeks+)",
          12: "40960 minutes (4 weeks+)",
          13: "81920 minutes (8 weeks+)",
          14: "163840 minutes (16 weeks+)",
          15: "327680 minutes (32 weeks+)",
          16: "655360 minutes (1 year+)",
          17: "1310720 minutes (2 years+)",
          18: "2621440 minutes (5 years+)",
          19: "5242880 minutes (10 years+)",
          20: "10485760 minutes (20 years+)"
        };
        return durationTable[mp] || `${10 * Math.pow(2, mp)} minutes`;
      };

      // Get range description based on MP allocation
      const getRangeDescription = (mp) => {
        const rangeTable = {
          0: "10m",
          1: "20m",
          2: "40m",
          3: "80m",
          4: "160m",
          5: "320m",
          6: "640m",
          7: "1.28km",
          8: "2.56km",
          9: "5.12km",
          10: "10.24km",
          11: "20.48km",
          12: "40.96km",
          13: "81.92km",
          14: "163.84km",
          15: "327.68km",
          16: "655.36km",
          17: "1310.72km",
          18: "2621.44km",
          19: "5242.88km",
          20: "10485.76km"
        };
        if (rangeTable[mp]) {
          return rangeTable[mp];
        }
        // Fallback calculation: 10m * 2^mp
        const meters = 10 * Math.pow(2, mp);
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)}km`;
        }
        return `${meters}m`;
      };

      // Calculate casting % based on lowest value
      const calculateCastingPercent = () => {
        const values = [spellTotalPercent]; // Start with spell's invested %
        
        // Add skill %s for any that have MP > 0
        if (intensityMP > 0) values.push(intensityPercent);
        if (rangeMP > 0) values.push(rangePercent);
        if (durationMP > 0) values.push(durationPercent);
        if (multispellMP > 0) values.push(multispellPercent);
        
        // Return the lowest value, or 0 if no values
        return values.length > 0 ? Math.min(...values) : 0;
      };

      // Create tooltip HTML with adjustable MP sections
      const createTooltipHTML = () => {
        const totalMP = intensityMP + rangeMP + durationMP + multispellMP;
        const castingPercent = calculateCastingPercent();
        
        // This spell's MP allocation is the Free INT cost (the 1 Intensity MP already accounts for the spell's base cost)
        // Only count this spell if it's in standard storage
        const spellUsesFreeInt = (spellItem?.system?.spellStorageLocation || 'standard') === 'standard';
        const thisSpellFreeIntCost = spellUsesFreeInt ? totalMP : 0;
        
        // Available Free INT = current available (from sheet) - this spell's MP cost
        // freeIntCurrent already accounts for all spells including this one, so we just subtract the MP allocation
        const availableFreeInt = freeIntCurrent - thisSpellFreeIntCost;
        const isOverLimit = availableFreeInt < 0;
        
        // Available Magic Points = current MP - this spell's MP allocation
        const availableMP = currentMP - totalMP;
        const isMPOverLimit = availableMP < 0;
        
        return `
          <div class="rq3-roll-tooltip" id="${id}">
            <div class="rq3-roll-tooltip-header">
              <div class="rq3-roll-tooltip-title">${spellName} - Allocate Magic Points</div>
            </div>

            <div class="rq3-roll-tooltip-content" style="padding: 16px;">
              <!-- Intensity Section -->
              <div class="sorcery-mp-section" style="margin-bottom: 12px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Intensity</div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="sorcery-mp-decrease" data-section="intensity" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">-</button>
                    <span class="sorcery-mp-value" data-section="intensity" style="min-width: 30px; text-align: center; font-weight: 600; color: var(--rq3-success);">${intensityMP}</span>
                    <button class="sorcery-mp-increase" data-section="intensity" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">+</button>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--rq3-text-light); text-align: right;">
                  ${intensityMP > 0 ? `${intensityPercent}%` : 'N/A'}
                </div>
              </div>

              <!-- Range Section -->
              <div class="sorcery-mp-section" style="margin-bottom: 12px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Range <span class="sorcery-range-desc" style="font-weight: 400; color: var(--rq3-text-light); font-size: 0.9em;">${getRangeDescription(rangeMP)}</span></div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="sorcery-mp-decrease" data-section="range" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">-</button>
                    <span class="sorcery-mp-value" data-section="range" style="min-width: 30px; text-align: center; font-weight: 600; color: var(--rq3-success);">${rangeMP}</span>
                    <button class="sorcery-mp-increase" data-section="range" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">+</button>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--rq3-text-light); text-align: right;">
                  ${rangeMP > 0 ? `${rangePercent}%` : 'N/A'}
                </div>
              </div>

              <!-- Duration Section -->
              <div class="sorcery-mp-section" style="margin-bottom: 12px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Duration <span class="sorcery-duration-desc" style="font-weight: 400; color: var(--rq3-text-light); font-size: 0.9em;">${getDurationDescription(durationMP)}</span></div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="sorcery-mp-decrease" data-section="duration" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">-</button>
                    <span class="sorcery-mp-value" data-section="duration" style="min-width: 30px; text-align: center; font-weight: 600; color: var(--rq3-success);">${durationMP}</span>
                    <button class="sorcery-mp-increase" data-section="duration" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">+</button>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--rq3-text-light); text-align: right;">
                  ${durationMP > 0 ? `${durationPercent}%` : 'N/A'}
                </div>
              </div>

              <!-- Multispell Section -->
              <div class="sorcery-mp-section" style="margin-bottom: 16px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Multispell</div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="sorcery-mp-decrease" data-section="multispell" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">-</button>
                    <span class="sorcery-mp-value" data-section="multispell" style="min-width: 30px; text-align: center; font-weight: 600; color: var(--rq3-success);">${multispellMP}</span>
                    <button class="sorcery-mp-increase" data-section="multispell" style="width: 24px; height: 24px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">+</button>
                  </div>
                </div>
                <div style="font-size: 11px; color: var(--rq3-text-light); text-align: right;">
                  ${multispellMP > 0 ? `${multispellPercent}%` : 'N/A'}
                </div>
              </div>

              <!-- Free INT and Casting % Display -->
              <div style="border-top: 1px solid var(--rq3-border); padding-top: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Available Magic Points:</div>
                  <div style="color: ${isMPOverLimit ? 'var(--rq3-danger)' : 'var(--rq3-success)'};">
                    <span class="sorcery-mp-available">${availableMP}</span>/<span class="sorcery-mp-current">${currentMP}</span>
                    ${isMPOverLimit ? ' <span style="color: var(--rq3-danger);">(Exceeded!)</span>' : ''}
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Available Free INT:</div>
                  <div style="color: ${isOverLimit ? 'var(--rq3-danger)' : 'var(--rq3-success)'};">
                    <span class="sorcery-free-int-available">${availableFreeInt}</span>/<span class="sorcery-free-int-current">${freeIntCurrent}</span>
                    ${isOverLimit ? ' <span style="color: var(--rq3-danger);">(Exceeded!)</span>' : ''}
                  </div>
                </div>
                <div class="sorcery-free-int-breakdown" style="font-size: 11px; color: var(--rq3-text-light); margin-bottom: 4px;">
                  ${spellUsesFreeInt ? `This spell: ${totalMP} MP = ${totalMP} Free INT` : 'This spell: Does not use Free INT'}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="font-weight: 600; color: var(--rq3-text);">Casting %:</div>
                  <div style="font-size: 18px; font-weight: 700; color: var(--rq3-success);">
                    <span class="sorcery-casting-percent">${castingPercent}</span>%
                  </div>
                </div>
              </div>

              <!-- Total and Action Buttons -->
              <div style="border-top: 1px solid var(--rq3-border); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 600; color: var(--rq3-text);">
                  Total MP: <span class="sorcery-total-mp" style="color: ${(isOverLimit || isMPOverLimit) ? 'var(--rq3-danger)' : 'var(--rq3-success)'};">${totalMP}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="sorcery-mp-cancel" style="padding: 6px 12px; border: 1px solid var(--rq3-border); background: var(--rq3-dark); color: var(--rq3-text); border-radius: 4px; cursor: pointer;">Cancel</button>
                  <button class="sorcery-mp-confirm" style="padding: 6px 12px; border: 1px solid var(--rq3-primary); background: ${(isOverLimit || isMPOverLimit) ? 'var(--rq3-danger)' : 'var(--rq3-primary)'}; color: white; border-radius: 4px; cursor: pointer; font-weight: 600;" ${(isOverLimit || isMPOverLimit) ? 'disabled' : ''}>Cast</button>
                </div>
              </div>
            </div>
          </div>
        `;
      };

      // Add tooltip to document body
      const tooltipElement = $(createTooltipHTML());
      $('body').append(tooltipElement);
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(id);
      if (!immediateCheck) {
        console.error(`RQ3 | Tooltip ${id} was not added to DOM!`);
        document.removeEventListener('mousemove', trackMouse);
        resolve(null);
        return;
      }

      // Update MP value function
      const updateMPValue = (section, delta) => {
        const minValue = section === 'intensity' ? 1 : 0; // Intensity minimum is 1
        const totalBefore = intensityMP + rangeMP + durationMP + multispellMP;
        const totalAfter = totalBefore + delta;
        
        // This spell's MP allocation is the Free INT cost (the 1 Intensity MP already accounts for the spell's base cost)
        const spellUsesFreeInt = (spellItem?.system?.spellStorageLocation || 'standard') === 'standard';
        
        // Check if adding would exceed available magic points
        const availableMPAfter = currentMP - totalAfter;
        if (delta > 0 && availableMPAfter < 0) {
          ui.notifications.warn(`Cannot allocate more MP: Available magic points (${availableMPAfter}) would be negative.`);
          return;
        }
        
        // Check if adding would exceed Free INT
        if (delta > 0 && spellUsesFreeInt) {
          const currentSpellFreeIntCost = totalBefore;
          const currentAvailableFreeInt = freeIntCurrent - currentSpellFreeIntCost;
          const newSpellFreeIntCost = totalBefore + delta;
          const newAvailableFreeInt = freeIntCurrent - newSpellFreeIntCost;
          if (newAvailableFreeInt < 0) {
            ui.notifications.warn(`Cannot allocate more MP: Available Free INT (${newAvailableFreeInt}) would be negative.`);
            return;
          }
        }
        
        switch(section) {
          case 'intensity':
            intensityMP = Math.max(minValue, intensityMP + delta);
            break;
          case 'range':
            rangeMP = Math.max(0, rangeMP + delta);
            break;
          case 'duration':
            durationMP = Math.max(0, durationMP + delta);
            break;
          case 'multispell':
            multispellMP = Math.max(0, multispellMP + delta);
            break;
        }
        
        const total = intensityMP + rangeMP + durationMP + multispellMP;
        const castingPercent = calculateCastingPercent();
        
        // Calculate Free INT cost (spellUsesFreeInt already declared above)
        const thisSpellFreeIntCost = spellUsesFreeInt ? total : 0;
        // Available Free INT = current available (from sheet) - this spell's MP cost
        const availableFreeInt = freeIntCurrent - thisSpellFreeIntCost;
        const isOverLimit = availableFreeInt < 0;
        
        // Update MP display
        tooltipElement.find(`.sorcery-mp-value[data-section="${section}"]`).text(
          section === 'intensity' ? intensityMP : 
          section === 'range' ? rangeMP :
          section === 'duration' ? durationMP : multispellMP
        );
        
        // Update skill % display for this section
        const skillPercent = 
          section === 'intensity' ? intensityPercent :
          section === 'range' ? rangePercent :
          section === 'duration' ? durationPercent : multispellPercent;
        
        const sectionElement = tooltipElement.find(`.sorcery-mp-section:has([data-section="${section}"])`);
        const percentDisplay = sectionElement.find('div').last();
        if (section === 'intensity' && intensityMP > 0) {
          percentDisplay.text(`${intensityPercent}%`);
        } else if (section === 'range' && rangeMP > 0) {
          percentDisplay.text(`${rangePercent}%`);
        } else if (section === 'duration' && durationMP > 0) {
          percentDisplay.text(`${durationPercent}%`);
        } else if (section === 'multispell' && multispellMP > 0) {
          percentDisplay.text(`${multispellPercent}%`);
        } else {
          percentDisplay.text('N/A');
        }
        
        // Update duration description if this is the duration section
        if (section === 'duration') {
          const durationDescElement = tooltipElement.find('.sorcery-duration-desc');
          if (durationDescElement.length) {
            durationDescElement.text(getDurationDescription(durationMP));
          }
        }
        
        // Update range description if this is the range section
        if (section === 'range') {
          const rangeDescElement = tooltipElement.find('.sorcery-range-desc');
          if (rangeDescElement.length) {
            rangeDescElement.text(getRangeDescription(rangeMP));
          }
        }
        
        // Update total MP
        tooltipElement.find('.sorcery-total-mp').text(total);
        
        // Available Magic Points = current MP - this spell's MP allocation
        const availableMP = currentMP - total;
        const isMPOverLimit = availableMP < 0;
        
        tooltipElement.find('.sorcery-total-mp').css('color', (isOverLimit || isMPOverLimit) ? 'var(--rq3-danger)' : 'var(--rq3-success)');
        
        // Update Magic Points display (show available/current like Free INT)
        const mpAvailableSpan = tooltipElement.find('.sorcery-mp-available');
        if (mpAvailableSpan.length) {
          mpAvailableSpan[0].textContent = availableMP;
        }
        const mpDisplay = tooltipElement.find('.sorcery-mp-available').parent();
        if (mpDisplay.length) {
          mpDisplay.css('color', isMPOverLimit ? 'var(--rq3-danger)' : 'var(--rq3-success)');
          
          // Update or add the exceeded message for MP
          const mpExceededSpan = mpDisplay.find('span[style*="color: var(--rq3-danger)"]');
          if (isMPOverLimit) {
            if (mpExceededSpan.length === 0) {
              mpDisplay.append(' <span style="color: var(--rq3-danger);">(Exceeded!)</span>');
            }
          } else {
            mpExceededSpan.remove();
          }
        }
        
        // Update Free INT display - show available Free INT
        const freeIntAvailableSpan = tooltipElement.find('.sorcery-free-int-available');
        if (freeIntAvailableSpan.length) {
          // Update the text content, preserving the element
          freeIntAvailableSpan[0].textContent = availableFreeInt;
        }
        const freeIntDisplay = freeIntAvailableSpan.parent();
        if (freeIntDisplay.length) {
          freeIntDisplay.css('color', isOverLimit ? 'var(--rq3-danger)' : 'var(--rq3-success)');
          
          // Update or add the exceeded message
          const exceededSpan = freeIntDisplay.find('span[style*="color: var(--rq3-danger)"]');
          if (isOverLimit) {
            if (exceededSpan.length === 0) {
              freeIntDisplay.append(' <span style="color: var(--rq3-danger);">(Exceeded!)</span>');
            }
          } else {
            exceededSpan.remove();
          }
        }
        
        // Update the breakdown text
        const breakdownText = spellUsesFreeInt ? `This spell: ${total} MP = ${total} Free INT` : 'This spell: Does not use Free INT';
        const breakdownElement = tooltipElement.find('.sorcery-free-int-breakdown');
        if (breakdownElement.length) {
          breakdownElement.text(breakdownText);
        }
        
        // Update casting %
        tooltipElement.find('.sorcery-casting-percent').text(castingPercent);
        
        // Update Cast button state (check both Free INT and MP limits)
        const confirmButton = tooltipElement.find('.sorcery-mp-confirm');
        const canCast = !isOverLimit && !isMPOverLimit;
        if (canCast) {
          confirmButton.css('background', 'var(--rq3-primary)');
          confirmButton.prop('disabled', false);
        } else {
          confirmButton.css('background', 'var(--rq3-danger)');
          confirmButton.prop('disabled', true);
        }
      };

      // Set up button handlers
      tooltipElement.find('.sorcery-mp-increase').on('click', (e) => {
        const section = $(e.currentTarget).data('section');
        updateMPValue(section, 1);
      });

      tooltipElement.find('.sorcery-mp-decrease').on('click', (e) => {
        const section = $(e.currentTarget).data('section');
        updateMPValue(section, -1);
      });

      tooltipElement.find('.sorcery-mp-cancel').on('click', () => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
        }
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousemove', trackMouse);
        resolve(null);
      });

      tooltipElement.find('.sorcery-mp-confirm').on('click', () => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
        }
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('mousemove', trackMouse);
        resolve({
          intensity: intensityMP,
          range: rangeMP,
          duration: durationMP,
          multispell: multispellMP
        });
      });

      // Positioning logic (same as other tooltips)
      let left, top;
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      if (targetRect.left > 0 || targetRect.top > 0) {
        left = targetRect.right + 10;
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      } else {
        const offsetLeft = targetElement.offsetLeft;
        const offsetTop = targetElement.offsetTop;
        
        if (offsetLeft > 0 || offsetTop > 0) {
          left = offsetLeft + targetElement.offsetWidth + 10;
          top = offsetTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
        } else {
          const buttonPosition = targetElement.getBoundingClientRect();
          const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          
          left = buttonPosition.left + scrollX + targetElement.offsetWidth + 10;
          top = buttonPosition.top + scrollY + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
          
          if (left <= 10 && top <= 10) {
            let currentElement = targetElement;
            let totalLeft = 0;
            let totalTop = 0;
            
            while (currentElement && currentElement !== document.body) {
              totalLeft += currentElement.offsetLeft || 0;
              totalTop += currentElement.offsetTop || 0;
              currentElement = currentElement.offsetParent;
            }
            
            if (totalLeft > 0 || totalTop > 0) {
              left = totalLeft + targetElement.offsetWidth + 10;
              top = totalTop + (targetElement.offsetHeight / 2) - (tooltipRect.height / 2);
            }
          }
        }
      }
      
      // Ensure we have valid coordinates
      if (isNaN(left) || isNaN(top) || left < 0 || top < 0) {
        if (lastMouseX > 0 && lastMouseY > 0) {
          left = Math.max(20, Math.min(lastMouseX + 20, window.innerWidth - 400));
          top = Math.max(20, Math.min(lastMouseY - 200, window.innerHeight - 400));
        } else {
          left = Math.max(20, Math.min(window.innerWidth - 400, 100));
          top = Math.max(20, Math.min(window.innerHeight - 400, 100));
        }
      }
      
      // Adjust for viewport edges
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left + tooltipRect.width > viewportWidth - 20) {
        left = Math.max(20, left - tooltipRect.width - targetElement.offsetWidth - 20);
      }

      top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));

      // Position tooltip using CSS custom properties
      tooltipElement.addClass('positioned');
      tooltipElement[0].style.setProperty('--tooltip-left', left + 'px');
      tooltipElement[0].style.setProperty('--tooltip-top', top + 'px');

      // Show tooltip immediately
      tooltipElement.addClass('show');
      
      // Set up click-outside functionality
      const handleClickOutside = (event) => {
        const tooltip = document.getElementById(id);
        if (!tooltip) {
          return;
        }

        if (event.target === targetElement || targetElement.contains(event.target)) {
          return;
        }

        if (!tooltip.contains(event.target)) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Set up escape key functionality
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          const tooltip = document.getElementById(id);
          if (tooltip) {
            tooltip.remove();
          }
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      };
      
      // Delay the click-outside handler to prevent immediate closure
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
      
      document.addEventListener('keydown', handleEscape);

      // Auto-close after 60 seconds (longer for more complex interaction)
      setTimeout(() => {
        const tooltip = document.getElementById(id);
        if (tooltip) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          document.removeEventListener('mousemove', trackMouse);
          resolve(null);
        }
      }, 60000);
    });
  }

  async showCharacteristicRollTooltip(characteristic, targetElement) {
    console.log('RQ3 | showCharacteristicRollTooltip called with:', { characteristic, targetElement });
    
    const char = this.system.characteristics[characteristic];
    if (!char) {
      console.error(`Characteristic ${characteristic} not found`);
      return null;
    }

    const multipliers = Array.from({length: 10}, (_, i) => i + 1);
    
    return this._showMultiplierTooltip({
      id: `rq3-roll-tooltip-${characteristic}`,
      title: `${characteristic.toUpperCase()} Custom Roll`,
      baseValue: char.current,
      multipliers: multipliers,
      recommendedMultiplier: 5, // x5 is commonly used for characteristics
      targetElement: targetElement,
      calculateTarget: (value, mult) => value * mult
    });
  }

  /**
   * Show magic skill multiplier selection tooltip (for custom multiplier rolls on magic skills)
   * Uses whole numbers 1-10 instead of fractional multipliers
   * Formatted the same as characteristic roll tooltip
   * @param {string} skillName - The name of the skill
   * @param {number} skillValue - The base skill value
   * @param {HTMLElement} targetElement - The element to position relative to
   * @returns {Promise<number|null>} The selected multiplier or null if cancelled
   */
  async showMagicSkillMultiplierTooltip(skillName, skillValue, targetElement) {
    console.log('RQ3 | showMagicSkillMultiplierTooltip - Starting with:', { skillName, skillValue, targetElement });
    
    const multipliers = Array.from({length: 10}, (_, i) => i + 1);
    
    return this._showMultiplierTooltip({
      id: `rq3-magic-multiplier-tooltip-${skillName}`,
      title: `${skillName} Custom Roll`,
      baseValue: skillValue,
      multipliers: multipliers,
      recommendedMultiplier: 1, // x1 is default for magic skills
      targetElement: targetElement,
      calculateTarget: (value, mult) => Math.floor(value * mult)
    });
  }

  /**
   * Show skill multiplier selection tooltip (for custom multiplier rolls)
   * Uses whole numbers 1-10, formatted the same as characteristic/magic tooltips
   * @param {string} skillName - The name of the skill
   * @param {number} skillValue - The base skill value
   * @param {HTMLElement} targetElement - The element to position relative to
   * @returns {Promise<number|null>} The selected multiplier or null if cancelled
   */
  async showSkillMultiplierTooltip(skillName, skillValue, targetElement) {
    console.log('RQ3 | showSkillMultiplierTooltip - Starting with:', { skillName, skillValue, targetElement });
    
    const multipliers = Array.from({length: 10}, (_, i) => i + 1);
    
    return this._showMultiplierTooltip({
      id: `rq3-skill-multiplier-tooltip-${skillName}`,
      title: `${skillName} Custom Roll`,
      baseValue: skillValue,
      multipliers: multipliers,
      recommendedMultiplier: 1, // x1 is default for skills
      targetElement: targetElement,
      calculateTarget: (value, mult) => Math.floor(value * mult)
    });
  }

  /**
   * Show magic stat adjustment tooltip
   * @param {string} statType - The type of magic stat (magicRating, magicPoints, freeInt, ceremony, summon, enchant)
   * @param {HTMLElement} targetElement - The element to position relative to
   * @param {boolean} editMode - Whether edit mode is enabled
   * @returns {Promise<void>}
   */
  async showMagicStatTooltip(statType, targetElement, editMode = false) {
    console.log('RQ3 | showMagicStatTooltip - Starting with:', { statType, targetElement, editMode });
    
    return new Promise((resolve) => {
      let currentValue, maxValue, baseValue, investedValue, bonusValue, title;
      let updatePath, isPercentage = false;
      let isReadOnly = false;
      
      // Get the appropriate data based on stat type
      switch (statType) {
        case 'magicRating':
          // Magic Rating is purely derived - read only
          const int = this.system.characteristics.int?.current || 10;
          const pow = this.system.characteristics.pow?.current || 10;
          const dex = this.system.characteristics.dex?.current || 10;
          
          const intExcess = Math.max(0, int - 10);
          const powExcess = Math.max(0, pow - 10);
          const dexExcess = Math.max(0, dex - 10);
          const dexComponent = Math.ceil(dexExcess / 2);
          
          currentValue = this.system.magic.magicRating.value || 0;
          title = 'Magic Rating';
          isPercentage = true;
          isReadOnly = true;
          // Store the formula components for display
          baseValue = `(INT ${int}-10=${intExcess}) + (POW ${pow}-10=${powExcess}) + ceil(DEX ${dex}-10/2=${dexComponent})`;
          break;
          
        case 'magicPoints':
          currentValue = this.system.characteristics.pow.magicPoints.value || 0;
          maxValue = this.system.characteristics.pow.magicPoints.max || 0;
          title = 'Magic Points';
          updatePath = 'system.characteristics.pow.magicPoints.max';
          break;
          
        case 'freeInt':
          baseValue = this.system.magic.freeInt.base || 0;
          bonusValue = this.system.magic.freeInt.bonus || 0;
          currentValue = this.system.magic.freeInt.current || 0;
          title = 'Free INT';
          updatePath = 'system.magic.freeInt.bonus';
          break;
          
        case 'ceremony':
          baseValue = this.system.magic.ceremony.base || 5;
          investedValue = this.system.magic.ceremony.invested || 0;
          const ceremonyMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + ceremonyMagicRating;
          title = 'Ceremony';
          updatePath = 'system.magic.ceremony.invested';
          isPercentage = true;
          bonusValue = ceremonyMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'summon':
          baseValue = this.system.magic.summon.base || 0;
          investedValue = this.system.magic.summon.invested || 0;
          const summonMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + summonMagicRating;
          title = 'Summon';
          updatePath = 'system.magic.summon.invested';
          isPercentage = true;
          bonusValue = summonMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'enchant':
          baseValue = this.system.magic.enchant.base || 0;
          investedValue = this.system.magic.enchant.invested || 0;
          const enchantMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + enchantMagicRating;
          title = 'Enchant';
          updatePath = 'system.magic.enchant.invested';
          isPercentage = true;
          bonusValue = enchantMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'intensity':
          baseValue = this.system.magic.intensity.base || 0;
          investedValue = this.system.magic.intensity.invested || 0;
          const intensityMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + intensityMagicRating;
          title = 'Intensity';
          updatePath = 'system.magic.intensity.invested';
          isPercentage = true;
          bonusValue = intensityMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'range':
          baseValue = this.system.magic.range.base || 0;
          investedValue = this.system.magic.range.invested || 0;
          const rangeMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + rangeMagicRating;
          title = 'Range';
          updatePath = 'system.magic.range.invested';
          isPercentage = true;
          bonusValue = rangeMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'duration':
          baseValue = this.system.magic.duration.base || 0;
          investedValue = this.system.magic.duration.invested || 0;
          const durationMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + durationMagicRating;
          title = 'Duration';
          updatePath = 'system.magic.duration.invested';
          isPercentage = true;
          bonusValue = durationMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        case 'multispell':
          baseValue = this.system.magic.multispell.base || 0;
          investedValue = this.system.magic.multispell.invested || 0;
          const multispellMagicRating = this.system.magic.magicRating.value || 0;
          currentValue = baseValue + investedValue + multispellMagicRating;
          title = 'Multispell';
          updatePath = 'system.magic.multispell.invested';
          isPercentage = true;
          bonusValue = multispellMagicRating; // Reuse bonusValue to store magic rating
          break;
          
        default:
          console.error('Unknown magic stat type:', statType);
          resolve();
          return;
      }

      // Create tooltip HTML based on stat type
      let tooltipHTML;
      
      if (statType === 'magicRating') {
        // Magic Rating tooltip (read-only, shows formula)
        tooltipHTML = `
          <div class="rq3-magic-stat-tooltip rq3-damage-tooltip" id="rq3-magic-stat-tooltip-${statType}">
            <div class="rq3-damage-tooltip-header">
              <div class="rq3-damage-tooltip-title">${title}</div>
            </div>
            
            <div class="rq3-damage-tooltip-content">
              <div class="rq3-damage-info">
                <div class="rq3-damage-current">
                  <span>Formula:</span>
                  <span style="font-size: 11px;">${baseValue}</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Total:</span>
                  <span class="rq3-hp-current-value">${currentValue}%</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (statType === 'magicPoints') {
        // Magic Points tooltip (edit max format)
        tooltipHTML = `
          <div class="rq3-magic-stat-tooltip rq3-damage-tooltip" id="rq3-magic-stat-tooltip-${statType}">
            <div class="rq3-damage-tooltip-header">
              <div class="rq3-damage-tooltip-title">${title}</div>
            </div>
            
            <div class="rq3-damage-tooltip-content">
              <div class="rq3-damage-info">
                <div class="rq3-damage-current">
                  <span>Current MP:</span>
                  <span class="rq3-hp-current-value">${currentValue}/${maxValue}</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Max MP:</span>
                  <span class="rq3-hp-max-value">${maxValue}</span>
                </div>
              </div>
              <div class="rq3-damage-controls">
                <button class="rq3-damage-button" data-action="decrease" data-amount="1">-</button>
                <div class="rq3-damage-value">${maxValue}</div>
                <button class="rq3-damage-button" data-action="increase" data-amount="1">+</button>
              </div>
              <button class="rq3-damage-reset" data-action="resetCurrent">Reset to Max MP</button>
            </div>
          </div>
        `;
      } else if (statType === 'freeInt') {
        // Free INT tooltip (base + bonus = current)
        tooltipHTML = `
          <div class="rq3-magic-stat-tooltip rq3-damage-tooltip" id="rq3-magic-stat-tooltip-${statType}">
            <div class="rq3-damage-tooltip-header">
              <div class="rq3-damage-tooltip-title">${title}</div>
            </div>
            
            <div class="rq3-damage-tooltip-content">
              <div class="rq3-damage-info">
                <div class="rq3-damage-current">
                  <span>Base INT:</span>
                  <span>${baseValue}</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Bonus:</span>
                  <span>${bonusValue}</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Current:</span>
                  <span class="rq3-hp-current-value">${currentValue}</span>
                </div>
              </div>
              <div class="rq3-damage-controls">
                <button class="rq3-damage-button" data-action="decrease" data-amount="1">-</button>
                <div class="rq3-damage-value">${bonusValue}</div>
                <button class="rq3-damage-button" data-action="increase" data-amount="1">+</button>
              </div>
              <button class="rq3-damage-reset" data-action="reset">Reset Bonus</button>
            </div>
          </div>
        `;
      } else {
        // Skill-like stats (base + invested + magic rating = total%)
        // Always show controls, regardless of edit mode
        tooltipHTML = `
          <div class="rq3-magic-stat-tooltip rq3-damage-tooltip" id="rq3-magic-stat-tooltip-${statType}">
            <div class="rq3-damage-tooltip-header">
              <div class="rq3-damage-tooltip-title">${title}</div>
            </div>
            
            <div class="rq3-damage-tooltip-content">
              <div class="rq3-damage-info">
                <div class="rq3-damage-current">
                  <span>Base:</span>
                  <span>${baseValue}%</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Invested:</span>
                  <span>${investedValue}%</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Magic Rating:</span>
                  <span>${bonusValue || 0}%</span>
                </div>
                <div class="rq3-damage-effective">
                  <span>Total:</span>
                  <span class="rq3-hp-current-value">${currentValue}%</span>
                </div>
              </div>
              <div class="rq3-damage-controls">
                <button class="rq3-damage-button" data-action="decrease" data-amount="1">-</button>
                <div class="rq3-damage-value">${investedValue}</div>
                <button class="rq3-damage-button" data-action="increase" data-amount="1">+</button>
              </div>
            </div>
          </div>
        `;
      }

      // Add tooltip to document body
      const tooltipElement = $(tooltipHTML);
      $('body').append(tooltipElement);
      
      // Verify tooltip was added to DOM
      const immediateCheck = document.getElementById(`rq3-magic-stat-tooltip-${statType}`);
      if (!immediateCheck) {
        console.error('RQ3 | showMagicStatTooltip - Tooltip was not added to DOM!');
        resolve();
        return;
      }

      // Position the tooltip
      const targetRect = targetElement.getBoundingClientRect();
      const tooltipRect = tooltipElement[0].getBoundingClientRect();
      
      let left = targetRect.right + 10;
      let top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (left + tooltipRect.width > viewportWidth - 20) {
        left = targetRect.left - tooltipRect.width - 10;
      }
      
      top = Math.max(20, Math.min(top, viewportHeight - tooltipRect.height - 20));
      
      tooltipElement.css({
        position: 'fixed',
        left: left + 'px',
        top: top + 'px',
        zIndex: 100000
      });

      tooltipElement.addClass('show');
      
      // Only add button handlers if not read-only
      if (!isReadOnly) {
        // Track current edited value
        let currentEditValue = statType === 'magicPoints' ? maxValue : 
                              statType === 'freeInt' ? bonusValue : investedValue;
        
        // Store magic rating for ceremony/summon/enchant
        const magicRatingValue = (statType === 'ceremony' || statType === 'summon' || statType === 'enchant') 
          ? (this.system.magic.magicRating.value || 0) 
          : 0;
        
        // Handle button clicks
        tooltipElement.on('click', 'button', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const action = $(e.currentTarget).data('action');
          const amount = $(e.currentTarget).data('amount') || 1;
          
          if (action === 'increase') {
            currentEditValue += amount;
          } else if (action === 'decrease') {
            currentEditValue = Math.max(0, currentEditValue - amount);
          } else if (action === 'reset') {
            if (statType === 'magicPoints') {
              // Reset max to POW value
              const pow = this.system.characteristics.pow?.current || 10;
              currentEditValue = pow;
            } else {
              currentEditValue = 0;
            }
          } else if (action === 'resetCurrent') {
            // Reset current MP to max MP (only for magicPoints)
            if (statType === 'magicPoints') {
              const maxMP = this.system.characteristics.pow.magicPoints.max || 0;
              await this.update({
                'system.characteristics.pow.magicPoints.value': maxMP
              }, { render: false });
              
              // Update the display in the tooltip
              tooltipElement.find('.rq3-hp-current-value').text(`${maxMP}/${maxMP}`);
              
              // Update the display on the sheet
              const cogIcon = $(`[data-magic-stat="${statType}"]`);
              if (cogIcon.length) {
                const statItem = cogIcon.closest('.magic-stat-item');
                if (statItem.length) {
                  statItem.find('.magic-stat-value').text(`${maxMP}/${maxMP}`);
                }
              }
              
              return; // Don't continue with the normal update flow
            }
          }
          
          // Update the control display
          tooltipElement.find('.rq3-damage-value').text(currentEditValue);
          
          // Update the breakdown section for ceremony/summon/enchant/intensity/range/duration/multispell
          if (statType === 'ceremony' || statType === 'summon' || statType === 'enchant' || 
              statType === 'intensity' || statType === 'range' || statType === 'duration' || statType === 'multispell') {
            // Update the "Invested" value in the breakdown (first .rq3-damage-effective contains "Invested:")
            const investedBreakdown = tooltipElement.find('.rq3-damage-info .rq3-damage-effective').first();
            if (investedBreakdown.length) {
              // Find the span that contains the value (the second span in that div)
              investedBreakdown.find('span').eq(1).text(`${currentEditValue}%`);
            }
            
            // Calculate new total with magic rating
            const skillMagicRating = (statType === 'ceremony' || statType === 'summon' || statType === 'enchant')
              ? magicRatingValue
              : (this.system.magic.magicRating.value || 0);
            const newTotal = baseValue + currentEditValue + skillMagicRating;
            tooltipElement.find('.rq3-hp-current-value').text(`${newTotal}%`);
          } else {
            // Calculate new total/current value for other stats
            let newDisplayValue;
            if (statType === 'magicPoints') {
              // Update max value display
              const currentMP = this.system.characteristics.pow.magicPoints.value || 0;
              newDisplayValue = `${currentMP}/${currentEditValue}`;
              tooltipElement.find('.rq3-hp-current-value').text(newDisplayValue);
              tooltipElement.find('.rq3-hp-max-value').text(currentEditValue);
            } else if (statType === 'freeInt') {
              newDisplayValue = baseValue + currentEditValue;
            } else {
              newDisplayValue = `${baseValue + currentEditValue}%`;
            }
            
            tooltipElement.find('.rq3-hp-current-value').text(newDisplayValue);
          }
          
          // Update the actor without re-rendering the sheet to prevent edit mode flicker
          let updateData = {};
          if (statType === 'freeInt') {
            updateData[updatePath] = currentEditValue;
            updateData['system.magic.freeInt.current'] = baseValue + currentEditValue;
          } else if (statType === 'magicPoints') {
            // Update max MP, and cap current if it exceeds new max
            const currentMP = this.system.characteristics.pow.magicPoints.value || 0;
            updateData[updatePath] = currentEditValue;
            if (currentMP > currentEditValue) {
              updateData['system.characteristics.pow.magicPoints.value'] = currentEditValue;
            }
          } else {
            updateData[updatePath] = currentEditValue;
          }
          
          // Use render: false to prevent sheet re-render and edit mode flicker
          await this.update(updateData, { render: false });
          
          // Manually update the displayed value on the sheet
          // Find the element by searching for the cog icon with matching data attribute
          const cogIcon = $(`[data-magic-stat="${statType}"]`);
          if (cogIcon.length) {
            const statItem = cogIcon.closest('.magic-stat-item');
            if (statItem.length) {
              if (statType === 'ceremony' || statType === 'summon' || statType === 'enchant') {
                const newTotal = baseValue + currentEditValue + magicRatingValue;
                statItem.find('.magic-stat-value').text(`${newTotal}%`);
              } else if (statType === 'intensity' || statType === 'range' || statType === 'duration' || statType === 'multispell') {
                // Sorcery skills: base + invested + magic rating
                const sorceryMagicRating = this.system.magic.magicRating.value || 0;
                const newTotal = baseValue + currentEditValue + sorceryMagicRating;
                statItem.find('.magic-stat-value').text(`${newTotal}%`);
              } else if (statType === 'freeInt') {
                // Calculate the new freeIntMax
                const newFreeIntMax = baseValue + currentEditValue;
                
                // Calculate freeIntRemaining based on current spells
                const standardSpiritSpells = this.items.filter(i => 
                  i.type === 'spell' && 
                  i.system.spellType === 'spirit' &&
                  (i.system.spellStorageLocation || 'standard') === 'standard'
                );
                const totalSpiritMP = standardSpiritSpells.reduce((sum, spell) => sum + (spell.system.magicPoints || 0), 0);
                
                const standardSorcerySpells = this.items.filter(i => 
                  i.type === 'spell' && 
                  i.system.spellType === 'sorcery' && 
                  (i.system.spellStorageLocation || 'standard') === 'standard'
                );
                const sorcerySpellCount = standardSorcerySpells.length;
                
                const freeIntRemaining = Math.max(0, newFreeIntMax - totalSpiritMP - sorcerySpellCount);
                
                // Update display to show freeIntRemaining/freeIntMax
                statItem.find('.magic-stat-value').text(`${freeIntRemaining}/${newFreeIntMax}`);
              } else if (statType === 'magicPoints') {
                // Update max MP, get current MP (may have been capped)
                const currentMP = this.system.characteristics.pow.magicPoints.value || 0;
                statItem.find('.magic-stat-value').text(`${currentMP}/${currentEditValue}`);
              }
            }
          }
        });
      }
      
      resolve();
    });
  }
}

/**
 * Extend the base Item document to implement Runequest 3 specific logic
 */
export class RQ3Item extends Item {

  /** @override */
  async _preCreate(data, options, user) {
    // Auto-set item type based on compendium BEFORE calling super
    const packId = this.pack || options.pack;
    
    if (packId) {
      // Map compendium names to item types
      const compendiumTypeMap = {
        'runequest3.weapons': 'weapon',
        'runequest3.armour': 'armor',
        'runequest3.equipment': 'equipment',
        'runequest3.spirit-magic': 'spell',
        'runequest3.divine-magic': 'spell',
        'runequest3.sorcery': 'spell',
        'runequest3.species': 'species',
        'runequest3.skills': 'skill'
      };
      
      const defaultType = compendiumTypeMap[packId];
      console.log(`RQ3 | _preCreate: Detected compendium ${packId}, default type should be '${defaultType}'`);
      console.log(`RQ3 | _preCreate: Current type is '${this.type}'`);
      
      if (defaultType && this.type !== defaultType) {
        // Directly modify the _source data before super._preCreate processes it
        this._source.type = defaultType;
        console.log(`RQ3 | _preCreate: Changed type to '${defaultType}' for compendium ${packId}`);
      }
    }
    
    // Now call super with the modified source data
    await super._preCreate(data, options, user);
  }

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    // Migrate weaponType from old values to new values
    if (this.type === "weapon" && this.system.weaponType) {
      this._migrateWeaponType();
    }
    
    // Calculate weapon statistics
    if (this.type === "weapon") {
      this._prepareWeaponData();
    }
    
    // Calculate skill base chances
    if (this.type === "skill") {
      this._prepareSkillData();
    }
  }
  
  /**
   * Migrate old weaponType values to new values
   * @private
   */
  _migrateWeaponType() {
    const oldToNew = {
      "1h-sword": "sword",
      "2h-sword": "sword",
      "1h-axe": "axe",
      "2h-axe": "axe",
      "spear": "spear",
      "dagger": "dagger",
      "mace": "mace",
      "bow": "bow",
      "crossbow": "crossbow",
      "sling": "sling",
      "javelin": "javelin",
      "thrown": "javelin" // Default thrown to javelin, user can change if needed
    };
    
    const currentType = this.system.weaponType;
    
    // Check if it's an old value that needs migration
    if (oldToNew[currentType]) {
      const newType = oldToNew[currentType];
      console.log(`RQ3 | Migrating weaponType "${currentType}" to "${newType}" for ${this.name}`);
      this.updateSource({ "system.weaponType": newType });
    } else if (currentType && !["axe", "hammer", "dagger", "fist", "mace", "shield", "spear", "javelin", "sword", "tool", "bow", "crossbow", "dart", "sling", "staff-sling", "rock", "club", "net"].includes(currentType)) {
      // If it's an invalid value that's not in our migration map, default to sword
      console.warn(`RQ3 | Unknown weaponType "${currentType}" for ${this.name}, defaulting to "sword"`);
      this.updateSource({ "system.weaponType": "sword" });
    }
  }

  /**
   * Prepare weapon-specific derived data
   */
  _prepareWeaponData() {
    // Add any weapon-specific calculations here
    // For example, calculating effective reach, parry bonuses, etc.
  }

  /**
   * Prepare skill-specific derived data
   */
  _prepareSkillData() {
    if (!this.actor) return;
    
    const char1 = this.system.characteristic1;
    const char2 = this.system.characteristic2;
    
    let baseChance = this.system.baseChance;
    
    // Add characteristic bonuses if the skill is based on characteristics
    if (char1 !== "none" && this.actor.system.characteristics[char1]) {
      baseChance += this.actor.system.characteristics[char1].current;
    }
    
    if (char2 !== "none" && this.actor.system.characteristics[char2]) {
      baseChance += this.actor.system.characteristics[char2].current;
    }
    
    // Update the calculated base chance
    this.system.calculatedBase = baseChance;
  }

  /**
   * Cast a spell (for spell items)
   */
  async cast() {
    if (this.type !== "spell") {
      ui.notifications.error("This item is not a spell");
      return;
    }

    if (!this.actor) {
      ui.notifications.error("Spell must be owned by an actor to cast");
      return;
    }

    const cost = this.system.cost;
    const currentMP = this.actor.system.characteristics.pow.magicPoints.value;

    if (currentMP < cost) {
      ui.notifications.error("Not enough magic points to cast this spell");
      return;
    }

    // Deduct magic points
    await this.actor.update({
      "system.characteristics.pow.magicPoints.value": currentMP - cost
    });

    await ChatMessage.create({
      content: `
        <div class="rq3-spell-cast">
          <h3>${this.name}</h3>
          <p><strong>Type:</strong> ${this.system.spellType}</p>
          <p><strong>Cost:</strong> ${cost} MP</p>
          <p><strong>Range:</strong> ${this.system.range}</p>
          <p><strong>Duration:</strong> ${this.system.duration}</p>
          <div class="spell-description">
            ${this.system.description}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }

  /**
   * Use a consumable item
   */
  async use() {
    if (this.type !== "equipment" || !this.system.consumable.isConsumable) {
      ui.notifications.error("This item is not consumable");
      return;
    }

    const currentUses = this.system.consumable.uses.value;
    if (currentUses <= 0) {
      ui.notifications.error("This item has no uses remaining");
      return;
    }

    await this.update({
      "system.consumable.uses.value": currentUses - 1
    });

    await ChatMessage.create({
      content: `${this.actor?.name || "Someone"} uses ${this.name}`,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }
} 