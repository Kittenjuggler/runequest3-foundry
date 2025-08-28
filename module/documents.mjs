/**
 * Extend the base Actor document to implement Runequest 3 specific logic
 */
export class RQ3Actor extends Actor {

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
        
        // Set current MP to max if it's a new character or higher than max
        if (this.system.characteristics.pow.magicPoints.value > pow || this.system.characteristics.pow.magicPoints.value === 0) {
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
      
      // Calculate DEX Strike Rank Modifier
      let dexSRM = 0;
      if (dex <= 8) dexSRM = 3;
      else if (dex <= 12) dexSRM = 2;
      else if (dex <= 16) dexSRM = 1;
      else if (dex <= 20) dexSRM = 0;
      else dexSRM = -1;
      
      // Calculate Size Strike Rank Modifier
      let sizeSRM = 0;
      if (siz <= 8) sizeSRM = -1;
      else if (siz <= 16) sizeSRM = 0;
      else if (siz <= 24) sizeSRM = 1;
    else sizeSRM = 2;
    
    // Calculate Melee Strike Rank Modifier (DEX SRM + Size SRM)
    const meleeSRM = dexSRM + sizeSRM;
    
    // Store derived stats
    if (!this.system.derivedStats) {
      this.system.derivedStats = {};
    }
    
    this.system.derivedStats.damageModifier = damageModifier;
    this.system.derivedStats.moveRate = this.system.attributes.movement.walk;
    this.system.derivedStats.dexSRM = dexSRM;
    this.system.derivedStats.sizeSRM = sizeSRM;
    this.system.derivedStats.meleeSRM = meleeSRM;
    } catch (error) {
      console.error("RQ3 | Error calculating derived stats:", error);
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

      if (item.type === 'armor') {
        // Check if armor is equipped
        const isEquipped = Object.values(this.system.equippedArmor || {}).includes(item.id);
        if (isEquipped) {
          itemEncumbrance = (item.system.encumbrance || 0) * encumbranceMultiplier;
          armorAndWeaponEncumbrance += itemEncumbrance;
        } else {
          // Unequipped armor uses regular weight and storage location
          itemEncumbrance = ((item.system.weight || 0) * (item.system.quantity || 1)) * encumbranceMultiplier;
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
    
    const calculatePrimaryInfluence = (charValue) => charValue - 10;
    const calculateSecondaryInfluence = (charValue) => {
      const effectiveValue = Math.min(charValue, 30);
      const modifier = Math.floor((effectiveValue - 10) / 2);
      return Math.max(-10, Math.min(10, modifier));
    };
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
    }
    
    // Calculate final skill value
    if (baseValue === 0 && investedValue === 0) {
      skillValue = 0; // No category bonus for untrained skills
    } else {
      skillValue = Math.max(0, baseValue + investedValue + categoryBonus);
    }
    
    skillValue += modifier;

    const roll = new Roll("1d100");
    await roll.evaluate({async: true}); // Evaluate the roll to get roll.total

    // Check for success and update readyForTraining status
    const isSuccess = roll.total <= skillValue; // Standard d100 success

    if (isSuccess) {
      let updatePathKey;
      let updateDataObject;

      if (isCustomSkill) {
        updatePathKey = `system.customSkills.${categoryKey}.${skillKey}.readyForTraining`;
        updateDataObject = true;
        // For custom skills, the object structure is already there, just set the flag.
        await this.update({ [updatePathKey]: updateDataObject });
      } else {
        // Standard skill
        updatePathKey = `system.skills.${categoryKey}.${skillKey}`;
        const skillDataPath = `skills.${categoryKey}.${skillKey}`;
        const existingSkillData = foundry.utils.getProperty(this.system, skillDataPath);
        
        const currentInvestedValue = existingSkillData?.value || 0;
        // Ensure the skill object exists with its current value and the new training status
        updateDataObject = {
          value: currentInvestedValue,
          readyForTraining: true
        };
        await this.update({ [updatePathKey]: updateDataObject });
      }
    }

    // Send to chat
    const messageData = {
      content: `
        <div class="rq3-skill-roll">
          <div class="skill-name">${skillName}</div>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${skillValue}
          </div>
          <div class="result-text ${isSuccess ? 'success' : 'failure'}">
            ${isSuccess ? "Success" : "Failure"}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    };

    await ChatMessage.create(messageData);

    // Determine critical/fumble for return, you might have specific rules for this
    const critical = roll.total <= Math.floor(skillValue / 20); // Example critical rule
    const fumble = roll.total >= 96; // Example fumble rule

    return { roll, success: isSuccess, critical, fumble };
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

    const success = roll.total <= target;
    const critical = roll.total <= Math.floor(target / 20);
    const fumble = roll.total >= 96;

    let resultText = "";
    if (fumble) resultText = "Fumble!";
    else if (critical) resultText = "Critical Success!";
    else if (success) resultText = "Success";
    else resultText = "Failure";

    if (success && characteristic === 'pow') {
      await this.update({ 'system.characteristics.pow.readyForTraining': true });
    }

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x5 Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${success ? 'success' : 'failure'}">
            ${resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { roll, success, critical, fumble };
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

    const success = roll.total <= target;
    const critical = roll.total <= Math.floor(target / 20);
    const fumble = roll.total >= 96;

    let resultText = "";
    if (fumble) resultText = "Fumble!";
    else if (critical) resultText = "Critical Success!";
    else if (success) resultText = "Success";
    else resultText = "Failure";

    if (success && characteristic === 'pow') {
      await this.update({ 'system.characteristics.pow.readyForTraining': true });
    }

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x5 Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${success ? 'success' : 'failure'}">
            ${resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { roll, success, critical, fumble };
  }

  /**
   * Roll a characteristic check with custom multiplier
   * @param {string} characteristic - Characteristic to roll against
   */
  async rollCharacteristicCustom(characteristic) {
    const char = this.system.characteristics[characteristic];
    if (!char) {
      ui.notifications.error(`Characteristic ${characteristic} not found`);
      return;
    }

    // Find the x? button element to position the tooltip
    const buttonElement = document.querySelector(`[data-characteristic="${characteristic}"].characteristic-roll-custom`);
    if (!buttonElement) {
      console.error(`Could not find characteristic roll button for ${characteristic}`);
      return;
    }

    // Show tooltip and get multiplier
    const multiplier = await this.showCharacteristicRollTooltip(characteristic, buttonElement);

    if (multiplier === null) return;

    const target = char.current * multiplier;
    const roll = new Roll("1d100");
    await roll.evaluate();

    const success = roll.total <= target;
    const critical = roll.total <= Math.floor(target / 20);
    const fumble = roll.total >= 96;

    let resultText = "";
    if (fumble) resultText = "Fumble!";
    else if (critical) resultText = "Critical Success!";
    else if (success) resultText = "Success";
    else resultText = "Failure";

    if (success && characteristic === 'pow') {
      await this.update({ 'system.characteristics.pow.readyForTraining': true });
    }

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x${multiplier} Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${success ? 'success' : 'failure'}">
            ${resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { roll, success, critical, fumble };
  }

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
  async rollCharacteristicCustom(characteristic) {
    const char = this.system.characteristics[characteristic];
    if (!char) {
      ui.notifications.error(`Characteristic ${characteristic} not found`);
      return;
    }
    
    // Find the x? button element to position the tooltip
    const buttonElement = document.querySelector(`[data-characteristic="${characteristic}"].characteristic-roll-custom`);
    if (!buttonElement) {
      console.error(`Could not find characteristic roll button for ${characteristic}`);
      return;
    }

    // Show tooltip and get multiplier
    const multiplier = await this.showCharacteristicRollTooltip(characteristic, buttonElement);

    if (multiplier === null) return;

    const target = char.current * multiplier;
    const roll = new Roll("1d100");
    await roll.evaluate();

    const success = roll.total <= target;
    const critical = roll.total <= Math.floor(target / 20);
    const fumble = roll.total >= 96;

    let resultText = "";
    if (fumble) resultText = "Fumble!";
    else if (critical) resultText = "Critical Success!";
    else if (success) resultText = "Success";
    else resultText = "Failure";

    if (success && characteristic === 'pow') {
      await this.update({ 'system.characteristics.pow.readyForTraining': true });
    }

    await ChatMessage.create({
      content: `
        <div class="rq3-char-roll">
          <h3>${characteristic.toUpperCase()} x${multiplier} Roll</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${target}
          </div>
          <div class="result-text ${success ? 'success' : 'failure'}">
            ${resultText}
          </div>
        </div>
      `,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      rolls: [roll]
    });

    return { roll, success, critical, fumble };
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
            <div class="rq3-damage-tooltip-title">${locationDisplayName} Damage</div>
          </div>
          
          <div class="rq3-damage-tooltip-content">
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
        const newDamage = Math.max(0, Math.min(50, currentDamageValue + damageChange)); // Limit damage to 0-50
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
  async showCharacteristicRollTooltip(characteristic, targetElement) {
    return new Promise((resolve) => {
      const char = this.system.characteristics[characteristic];
      if (!char) {
        console.error(`Characteristic ${characteristic} not found`);
        resolve(null);
        return;
      }

      // Create tooltip HTML
      const tooltipHTML = `
        <div class="rq3-roll-tooltip" id="rq3-roll-tooltip-${characteristic}">
          <div class="rq3-roll-tooltip-header">
            <div class="rq3-roll-tooltip-title">${characteristic.toUpperCase()} Custom Roll</div>
          </div>

          <div class="rq3-roll-tooltip-content">
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
      `;

      // Add tooltip to document body
      const tooltipElement = $(tooltipHTML);
      $('body').append(tooltipElement);

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

      // Show tooltip immediately
      tooltipElement.addClass('show');

      // Set up click-outside functionality
      const handleClickOutside = (event) => {
        const tooltip = document.getElementById(`rq3-roll-tooltip-${characteristic}`);
        if (!tooltip) return; // Tooltip already closed

        if (!tooltip.contains(event.target)) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          resolve(null);
        }
      };

      // Set up escape key functionality
      const handleEscape = (event) => {
        if (event.key === 'Escape') {
          const tooltip = document.getElementById(`rq3-roll-tooltip-${characteristic}`);
          if (tooltip) {
            tooltip.remove();
          }
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          resolve(null);
        }
      };

      // Add event listeners
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      // Set up button click handlers
      tooltipElement.find('.rq3-roll-multiplier-btn').on('click', (event) => {
        const multiplier = parseInt($(event.currentTarget).data('multiplier'));
        const tooltip = document.getElementById(`rq3-roll-tooltip-${characteristic}`);
        if (tooltip) {
          tooltip.remove();
        }
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        resolve(multiplier);
      });

      // Auto-close after 30 seconds
      setTimeout(() => {
        const tooltip = document.getElementById(`rq3-roll-tooltip-${characteristic}`);
        if (tooltip) {
          tooltip.remove();
          document.removeEventListener('click', handleClickOutside);
          document.removeEventListener('keydown', handleEscape);
          resolve(null);
        }
      }, 30000);
    });
  }
}

/**
 * Extend the base Item document to implement Runequest 3 specific logic
 */
export class RQ3Item extends Item {

  /** @override */
  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    
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