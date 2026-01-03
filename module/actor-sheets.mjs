import { RQ3Actor } from "./documents.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class RQ3ActorSheet extends ActorSheet {

  constructor(...args) {
    super(...args);
    console.log("RQ3 | RQ3ActorSheet constructor called for:", this.actor?.name);
    
    // Initialize edit mode state
    this.editMode = false;
    this.restorationPending = false;
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["runequest3", "sheet", "actor"],
      width: 720,
      height: 680,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }],
      resizable: true
    });
  }

  /** @override */
  getPosition() {
    const savedPosition = this.actor?.getFlag("runequest3", "sheetSize");
    if (savedPosition) {
      return foundry.utils.mergeObject(super.getPosition(), {
        width: savedPosition.width,
        height: savedPosition.height
      });
    }
    return super.getPosition();
  }

  // Base class doesn't have a template - subclasses define their own

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    try {
      console.log("RQ3 | getData called for actor:", this.actor?.name);
      
      // Retrieve the data structure from the base sheet. You can inspect or log
      // the context variable to see the structure, but some key properties for
      // sheets are the actor object, the data object, whether or not it's
      // editable, the items array, and the effects array.
      const context = super.getData();

      // Validate actor data
      if (!this.actor) {
        console.error("RQ3 | No actor found for sheet data preparation");
        return context;
      }

      // Use a safe clone of the actor data for further operations.
      const actorData = this.actor.toObject(false);

      // Validate actor data structure
      if (!actorData || !actorData.system) {
        console.error("RQ3 | Invalid actor data structure");
        return context;
      }

      // Add the actor's data to context.system for easier access, as well as flags.
      context.system = actorData.system;
      context.flags = actorData.flags;

      // Add CONFIG data for skills and other system constants
      context.config = CONFIG.RQ3;

      // Add edit mode state for template conditionals
      context.editMode = this.editMode || false; // Use instance property or default to false

      // Prepare character data and items.
      if (actorData.type === 'character') {
        this._prepareItems(context);
        this._prepareCharacterData(context);
        await this._prepareSkillValues(context);
        this._calculateCastingRatings(context);
      }

      // Prepare NPC data and items.
      if (actorData.type === 'npc') {
        this._prepareItems(context);
      }

      // Prepare creature data and items.
      if (actorData.type === 'creature') {
        this._prepareItems(context);
      }

      // Add roll data for TinyMCE editors.
      context.rollData = this.actor.getRollData();

      // Prepare active effects
      context.effects = this.actor.effects.map(e => foundry.utils.deepClone(e.toObject()));

      console.log("RQ3 | getData completed successfully for actor:", this.actor?.name);
      return context;
    } catch (error) {
      console.error("RQ3 | Error in getData:", error);
      // Return a basic context to prevent sheet failure
      return {
        actor: this.actor,
        system: {},
        flags: {},
        config: CONFIG.RQ3 || {},
        editMode: false,
        skills: [],
        effects: []
      };
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.characteristics)) {
      v.label = game.i18n.localize(CONFIG.RQ3.characteristics[k]) ?? k;
    }
  }

  /**
   * Prepare skill values for all skills, combining owned skills with base values
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  async _prepareSkillValues(context) {
    try {
      console.log("RQ3 | Starting skill value preparation");
      
      // Validate context and system data
      if (!context || !context.system) {
        console.error("RQ3 | Invalid context for skill preparation");
        return;
      }
      
      context.skillValues = {};
      context.skillBaseValues = {};
      context.skillInvestedValues = {}; // New: invested points only
      context.skillTotalValues = {}; // New: total including category bonuses
      context.skillCategoryBonuses = {};
      
      // Validate CONFIG.RQ3.skills exists
      if (!CONFIG.RQ3?.skills) {
        console.error("RQ3 | Skills configuration not found");
        return;
      }
      
      // Initialize skillBaseValues and new structures for all categories
      for (const categoryKey of Object.keys(CONFIG.RQ3.skills)) {
        context.skillBaseValues[categoryKey] = {};
        context.skillInvestedValues[categoryKey] = {};
        context.skillTotalValues[categoryKey] = {};
      }
      
      console.log("RQ3 | Calculating skill category bonuses");
      // Calculate skill category bonuses
      this._calculateSkillCategoryBonuses(context);
      
      console.log("RQ3 | Getting species skill values");
      // Get species base values
      await this._getSpeciesSkillValues(context);
      
      console.log("RQ3 | Processing owned skills");
      // Create a map of owned skills by name for quick lookup
      const ownedSkills = {};
      if (context.skills && Array.isArray(context.skills)) {
        context.skills.forEach(skill => {
          if (skill && skill.name) {
            ownedSkills[skill.name] = skill;
          }
        });
      }

      // Get the character's invested skill points from system.skills
      const characterSkills = context.system.skills || {};
      console.log("RQ3 | Character skills data:", characterSkills);

      // Iterate through all skill categories and skills
      for (const [categoryKey, category] of Object.entries(CONFIG.RQ3.skills)) {
        context.skillValues[categoryKey] = {};
        
        for (const [skillKey, skillData] of Object.entries(category.skills)) {
          try {
            const skillName = skillData.name;
            
            // Calculate base value (species base OR skill's default base chance)
            let baseValue = context.skillBaseValues[categoryKey]?.[skillKey] || 0;
            
            // Handle characteristic multiplier skills (like Dodge = DEX×2)
            if (skillData.isCharacteristicMultiple && skillData.multiplier) {
              const charValue = context.system.characteristics[skillData.characteristic1]?.current || 0;
              baseValue = charValue * skillData.multiplier;
            } else {
              // Only use skill's default base chance if a species is selected AND no species base was set
              const hasSpecies = context.system.personal?.species;
              if (baseValue === 0 && hasSpecies) {
                baseValue = skillData.baseChance || 0;
              }
            }
            
            // Get invested points from character data or owned skill items
            let investedValue = 0;
            const characterSkill = characterSkills[categoryKey]?.[skillKey];
            if (characterSkill && characterSkill.value !== undefined) {
              investedValue = characterSkill.value;
            } else {
              // Check if character has this skill as an item
              const ownedSkill = ownedSkills[skillName];
              if (ownedSkill) {
                investedValue = ownedSkill.system.value || 0;
              }
            }
            
            // Calculate total (base + invested + category bonus)
            const categoryBonus = context.skillCategoryBonuses[categoryKey] || 0;
            
            // Calculate total: base + invested + category bonus
            // Category bonus applies to all skills (including those with 0 base and 0 invested)
            let totalValue = Math.max(0, baseValue + investedValue + categoryBonus);
            
            // Store all the separate values
            context.skillBaseValues[categoryKey][skillKey] = baseValue;
            context.skillInvestedValues[categoryKey][skillKey] = investedValue;
            context.skillTotalValues[categoryKey][skillKey] = totalValue;
            
            // Keep the original skillValues for compatibility 
            context.skillValues[categoryKey][skillKey] = totalValue;
          } catch (skillError) {
            console.error(`RQ3 | Error processing skill ${categoryKey}.${skillKey}:`, skillError);
            // Set safe defaults
            context.skillBaseValues[categoryKey][skillKey] = 0;
            context.skillInvestedValues[categoryKey][skillKey] = 0;
            context.skillTotalValues[categoryKey][skillKey] = 0;
            context.skillValues[categoryKey][skillKey] = 0;
          }
        }
      }
      
      console.log("RQ3 | Skill value preparation complete");
    } catch (error) {
      console.error("RQ3 | Error in _prepareSkillValues:", error);
      // Set safe defaults if everything fails
      context.skillValues = {};
      context.skillBaseValues = {};
      context.skillInvestedValues = {};
      context.skillTotalValues = {};
      context.skillCategoryBonuses = {};
      
      for (const categoryKey of Object.keys(CONFIG.RQ3.skills || {})) {
        context.skillValues[categoryKey] = {};
        context.skillBaseValues[categoryKey] = {};
        context.skillInvestedValues[categoryKey] = {};
        context.skillTotalValues[categoryKey] = {};
      }
    }
  }

  /**
   * Get species-based skill values from the species compendium
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  async _getSpeciesSkillValues(context) {
    const speciesName = context.system.personal?.species;
    
    if (!speciesName) {
      return;
    }

    try {
      // Try to find species in system compendium
      const speciesCompendium = game.packs.get("runequest3.species");
      if (!speciesCompendium) {
        return;
      }

      const speciesItems = await speciesCompendium.getDocuments();
      
      const speciesItem = speciesItems.find(item => item.name === speciesName);
      
      if (!speciesItem) {
        return;
      }

      if (!speciesItem.system.skills) {
        return;
      }
      
      // Map species skill data to our skill structure
      const speciesSkills = speciesItem.system.skills;
      
      // Map the species skill keys to our system - using only skills that exist in the system
      const skillMapping = {
        // Agility - all exist
        boat: 'boat',
        climb: 'climb',
        dodge: 'dodge', 
        jump: 'jump',
        ride: 'ride',
        swim: 'swim',
        throw: 'throw',
        
        // Communication - all exist 
        fast_talk: 'fastTalk',
        orate: 'orate',
        sing: 'sing',
        speak_own_language: 'speakOwnLanguage',
        speak_trade_talk: 'speakTradeTalk',
        
        // Knowledge - only existing ones
        animal_lore: 'animalLore',
        evaluate: 'evaluate',
        first_aid: 'firstAid',
        human_lore: 'humanLore',
        mineral_lore: 'mineralLore', 
        plant_lore: 'plantLore',
        read_write: 'readWriteLanguages',
        world_lore: 'worldLore',
        shiphandling: 'shiphandling',
        
        // Manipulation - only existing ones
        conceal: 'conceal',
        devise: 'devise',
        sleight: 'sleight',
        play_instrument: 'playInstrument',
        fine_manipulation: 'sleight', // Map to sleight since it's similar
        
        // Perception - all exist
        listen: 'listen',
        scan: 'scan',
        search: 'search',
        track: 'track',
        
        // Stealth - all exist
        hide: 'hide',
        sneak: 'sneak'
      };

      let appliedCount = 0;
      
      // Apply species skill values
      for (const [speciesSkillKey, systemSkillKey] of Object.entries(skillMapping)) {
        const speciesValue = speciesSkills[speciesSkillKey];
        
        if (speciesValue !== undefined && speciesValue !== null) {
          // Find which category this skill belongs to
          let found = false;
          for (const [categoryKey, category] of Object.entries(CONFIG.RQ3.skills)) {
            if (category.skills[systemSkillKey]) {
              const skillValue = Number(speciesValue);
              context.skillBaseValues[categoryKey][systemSkillKey] = skillValue;
              appliedCount++;
              found = true;
              break;
            }
          }
          if (!found) {
          }
        }
      }
      
    } catch (error) {
    }
  }

  /**
   * Calculate skill category bonuses based on official RuneQuest 3rd Edition rules
   *
   * @param {Object} context The context to prepare.
   *
   * @return {undefined}
   */
  _calculateSkillCategoryBonuses(context) {
    // Initialize all category bonuses to 0
    context.skillCategoryBonuses = {
      agility: 0,
      communication: 0, 
      knowledge: 0,
      manipulation: 0,
      perception: 0,
      stealth: 0,
      weapon: 0
    };

    const characteristics = context.system.characteristics;
    
    // Primary Influence: +1% per point above 10, -1% per point below 10
    const calculatePrimaryInfluence = (charValue) => {
      return charValue - 10;
    };
    
    // Secondary Influence: +1% per 2 points above 10, -1% per 2 points below 10
    // Maximum +10% bonus (characteristic points above 30 are ignored)
    // Round up for positive values, round down for negative values (towards zero)
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
    const calculateNegativeInfluence = (charValue) => {
      return 10 - charValue;
    };

    // Agility Skills Category Modifier
    // DEX = Primary, STR = Secondary, SIZ = Negative
    context.skillCategoryBonuses.agility = 
      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
      calculateSecondaryInfluence(characteristics.str?.current || 10) +
      calculateNegativeInfluence(characteristics.siz?.current || 10);

    // Communication Skills Modifier  
    // INT = Primary, POW, APP = Secondary
    context.skillCategoryBonuses.communication = 
      calculatePrimaryInfluence(characteristics.int?.current || 10) +
      calculateSecondaryInfluence(characteristics.pow?.current || 10) +
      calculateSecondaryInfluence(characteristics.app?.current || 10);

    // Knowledge Skills Modifier
    // INT = Primary
    context.skillCategoryBonuses.knowledge = 
      calculatePrimaryInfluence(characteristics.int?.current || 10);

    // Manipulation Skills Modifier
    // INT, DEX = Primary, STR = Secondary
    context.skillCategoryBonuses.manipulation = 
      calculatePrimaryInfluence(characteristics.int?.current || 10) +
      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
      calculateSecondaryInfluence(characteristics.str?.current || 10);

    // Perception Skills Modifier
    // INT = Primary, POW, CON = Secondary
    context.skillCategoryBonuses.perception = 
      calculatePrimaryInfluence(characteristics.int?.current || 10) +
      calculateSecondaryInfluence(characteristics.pow?.current || 10) +
      calculateSecondaryInfluence(characteristics.con?.current || 10);

    // Stealth Skills Modifier
    // DEX = Primary, SIZ, POW = Negative
    context.skillCategoryBonuses.stealth = 
      calculatePrimaryInfluence(characteristics.dex?.current || 10) +
      calculateNegativeInfluence(characteristics.siz?.current || 10) +
      calculateNegativeInfluence(characteristics.pow?.current || 10);

    // Attack Modifier (for weapon skills)
    // Equal to Manipulation Skills Modifier (INT, DEX = Primary, STR = Secondary)
    context.skillCategoryBonuses.weapon = context.skillCategoryBonuses.manipulation;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const weapons = [];
    const armor = [];
    const skills = [];
    const spells = [];
    const spiritSpells = [];
    const divineSpells = [];
    const sorcerySpells = [];
    const runes = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      // Ensure items have an image - will be handled by itemImage helper in template
      if (!i.img || i.img === "icons/svg/mystery-man.svg") {
        // Set default based on type (itemImage helper will handle this, but set a fallback)
        const defaultImages = {
          weapon: "icons/svg/sword.svg",
          spell: "icons/svg/book.svg",
          rune: "icons/svg/rune-stone.svg",
          skill: "icons/svg/upgrade.svg",
          species: "icons/svg/mystery-man.svg",
          equipment: "icons/svg/item-bag.svg",
          armor: "icons/svg/armor.svg"
        };
        i.img = defaultImages[i.type] || "icons/svg/item-bag.svg";
      }
      // Append to gear.
      if (i.type === 'equipment') {
        gear.push(i);
      }
      // Append to weapons.
      else if (i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to armor.
      else if (i.type === 'armor') {
        armor.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        spells.push(i);
        const spellStorage = i.system.spellStorageLocation || 'standard';
        
        // Also categorize by spell type
        if (i.system.spellType === 'spirit') {
          spiritSpells.push(i); // Add all spirit spells to list for display
        } else if (i.system.spellType === 'divine') {
          divineSpells.push(i);
        } else if (i.system.spellType === 'sorcery') {
          // Calculate total % for sorcery spells: invested + Magic Rating - Encumbrance (rounded up)
          const magicRating = context.system.magic?.magicRating?.value || 0;
          const encumbrance = Math.ceil(context.system.attributes?.encumbrance?.total || 0);
          const invested = i.system.invested || 0;
          i.totalPercent = Math.max(0, invested + magicRating - encumbrance);
          sorcerySpells.push(i); // Add all sorcery spells to list for display
        }
      }
      // Append to runes.
      else if (i.type === 'rune') {
        runes.push(i);
      }
    }

    // Calculate spirit magic MP totals and sorcery spell Free INT usage
    // Only count spells in standard storage (not spell-matrix or int-spirit)
    const freeIntMax = context.system.magic?.freeInt?.current || 0;
    const standardSpiritSpells = spiritSpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'standard');
    const totalSpiritMP = standardSpiritSpells.reduce((sum, spell) => sum + (spell.system.magicPoints || 0), 0);
    const standardSorcerySpells = sorcerySpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'standard');
    const sorcerySpellCount = standardSorcerySpells.length;
    const freeIntRemaining = Math.max(0, freeIntMax - totalSpiritMP - sorcerySpellCount);
    
    // Calculate Free INT used for each section (only standard storage spells)
    // Spirit section: sum of MP from standard storage spirit spells
    const spiritFreeIntUsed = totalSpiritMP;
    // Sorcery section: count of standard storage sorcery spells (each uses 1 Free INT)
    const sorceryFreeIntUsed = sorcerySpellCount;
    
    // Get current magic points for spell casting checks
    const currentMP = context.system.characteristics?.pow?.magicPoints?.value || 0;
    
    // Add canCast property to each spell based on available MP
    // For spirit magic, minimum is 1 MP (lowest level possible)
    spiritSpells.forEach(spell => {
      const minMP = 1; // Minimum MP for spirit magic is 1
      spell.canCast = currentMP >= minMP;
    });
    
    // For sorcery, minimum is 1 MP (intensity - lowest level possible)
    // Spells in unavailable storage cannot be cast
    sorcerySpells.forEach(spell => {
      const storageLocation = spell.system.spellStorageLocation || 'standard';
      if (storageLocation === 'unavailable') {
        spell.canCast = false;
      } else {
        const minMP = 1; // Minimum MP for sorcery is 1 (intensity)
        spell.canCast = currentMP >= minMP;
      }
    });
    
    // Divine magic doesn't use MP, so all divine spells can be cast
    divineSpells.forEach(spell => {
      spell.canCast = true;
    });
    
    // Separate spells by storage location for template
    const spiritSpellsStandard = spiritSpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'standard');
    const spiritSpellsIntSpirit = spiritSpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'int-spirit');
    const spiritSpellsMatrix = spiritSpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'spell-matrix');
    const sorcerySpellsStandard = sorcerySpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'standard');
    const sorcerySpellsIntSpirit = sorcerySpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'int-spirit');
    const sorcerySpellsMatrix = sorcerySpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'spell-matrix');
    const sorcerySpellsUnavailable = sorcerySpells.filter(s => (s.system.spellStorageLocation || 'standard') === 'unavailable');
    
    // Assign and return
    context.gear = gear;
    context.weapons = weapons;
    context.armor = armor;
    context.skills = skills;
    context.spells = spells;
    context.spiritSpells = spiritSpells;
    context.spiritSpellsStandard = spiritSpellsStandard;
    context.spiritSpellsIntSpirit = spiritSpellsIntSpirit;
    context.spiritSpellsMatrix = spiritSpellsMatrix;
    context.divineSpells = divineSpells;
    context.sorcerySpells = sorcerySpells;
    context.sorcerySpellsStandard = sorcerySpellsStandard;
    context.sorcerySpellsIntSpirit = sorcerySpellsIntSpirit;
    context.sorcerySpellsMatrix = sorcerySpellsMatrix;
    context.sorcerySpellsUnavailable = sorcerySpellsUnavailable;
    context.runes = runes;
    context.totalSpiritMP = totalSpiritMP;
    context.freeIntRemaining = freeIntRemaining;
    context.freeIntMax = freeIntMax;
    context.spiritFreeIntUsed = spiritFreeIntUsed;
    context.sorceryFreeIntUsed = sorceryFreeIntUsed;
  }

  /**
   * Calculate casting ratings for spirit and divine magic
   * @param {Object} context The context to prepare.
   * @return {undefined}
   */
  _calculateCastingRatings(context) {
    try {
      // Get POW value
      const pow = context.system.characteristics?.pow?.current || 0;
      
      // Get total ENC - using the correct path
      const currentEnc = context.system.attributes?.encumbrance?.total || 0;
      const encPenalty = Math.ceil(currentEnc);
      
      // Get Magic Rating
      const magicRating = context.system.magic?.magicRating?.value || 0;
      
      // Spirit Magic Casting Rating = POW × 5 + Magic Rating - ENC penalty
      const spiritCastingRating = Math.max(0, (pow * 5) + magicRating - encPenalty);
      
      // Divine Magic Casting Rating = 100% - ENC penalty (minimum 0%)
      // But there's always a 96-00% failure chance even with 0 ENC
      const divineCastingRating = Math.max(0, 100 - encPenalty);
      
      // Add to context
      context.spiritCastingRating = spiritCastingRating;
      context.divineCastingRating = divineCastingRating;
      context.encPenalty = encPenalty;
      
      console.log('RQ3 | Casting Ratings - POW:', pow, 'ENC Total:', currentEnc, 'ENC Penalty:', encPenalty, 'Spirit:', spiritCastingRating, 'Divine:', divineCastingRating);
    } catch (error) {
      console.error('RQ3 | Error calculating casting ratings:', error);
      context.spiritCastingRating = 0;
      context.divineCastingRating = 0;
      context.encPenalty = 0;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Ensure edit mode is properly initialized
    if (this.editMode === undefined) {
      this.editMode = false;
    }

    console.log('RQ3 | activateListeners - Edit mode initialized:', this.editMode);

    // Ensure the DOM reflects the current edit mode state on every render
    // Use a small delay to ensure DOM is fully ready
    setTimeout(() => {
      console.log('RQ3 | activateListeners - Updating edit mode DOM after delay');
      this._updateEditModeDOM(this.editMode);
    }, 50);

    // Initialize accordion state
    this._initializeAccordions(html);

    // Save window size when resized
    this._setupWindowSizePersistence(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("item-id"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("item-id"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Item control handlers
    html.find('.rq3-item-control').click(this._onItemControl.bind(this));

    // New equipment button handlers
    html.find('.equip-button, .edit-button, .delete-button').click(this._onItemControl.bind(this));

    // Hit location HP adjustment overlay handler - use event delegation
    html.on('click', '.hp-badge[data-hit-location]', (event) => {
      console.log('RQ3 | HP badge clicked via delegation');
      this._onHitLocationHPClick(event);
    });
    
    // Also bind to document in case the sheet is re-rendered
    $(document).off('click', '.hp-badge[data-hit-location]').on('click', '.hp-badge[data-hit-location]', (event) => {
      if ($(event.target).closest('.runequest3').length) {
        console.log('RQ3 | HP badge clicked via document delegation');
        this._onHitLocationHPClick(event);
      }
    });

    // Armor AP adjustment handler - use event delegation
    html.on('click', '.ap-badge[data-hit-location]', (event) => {
      console.log('RQ3 | AP badge clicked via delegation');
      this._onArmorAPClick(event);
    });
    
    // Also bind to document in case the sheet is re-rendered
    $(document).off('click', '.ap-badge[data-hit-location]').on('click', '.ap-badge[data-hit-location]', (event) => {
      if ($(event.target).closest('.runequest3').length) {
        console.log('RQ3 | AP badge clicked via document delegation');
        this._onArmorAPClick(event);
      }
    });

    // Quantity control handlers
    html.find('.qty-up').click(this._onQuantityUp.bind(this));
    html.find('.qty-down').click(this._onQuantityDown.bind(this));

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.rollable').contextmenu(this._onRollCustom.bind(this));
    
    // Skill roll button handlers (left click for normal roll, right click for custom multiplier)
    html.find('.skill-roll-button').off('click').on('click', this._onSkillRoll.bind(this));
    html.find('.skill-roll-button').off('contextmenu').on('contextmenu', this._onSkillRollCustom.bind(this));

    // Characteristic x5 rolls (left-click) and custom multiplier (right-click)
    html.find('.characteristic-roll-x5').click(this._onCharacteristicRollX5.bind(this));
    html.find('.characteristic-roll-x5').on('contextmenu', this._onCharacteristicRollCustom.bind(this));

    // Combat tab: Right-click armor and weapon items to open their sheets
    // Use very broad event delegation to catch all right-clicks on combat tab
    console.log('RQ3 | Setting up combat tab right-click handlers');
    
    // Try binding directly to all equipped items in combat tab
    const combatEquippedItems = html.find('[data-tab="combat"] .equipped-item');
    console.log('RQ3 | Found combat equipped items:', combatEquippedItems.length);
    combatEquippedItems.each((i, element) => {
      console.log('RQ3 | Setting up right-click for combat item:', element.dataset.itemId);
      $(element).on('contextmenu', (event) => {
        console.log('RQ3 | Combat item right-clicked!', event.target);
        this._onCombatItemRightClick(event);
      });
    });
    
    const combatWeaponItems = html.find('[data-tab="combat"] .weapon-item');
    console.log('RQ3 | Found combat weapon items:', combatWeaponItems.length);
    combatWeaponItems.each((i, element) => {
      console.log('RQ3 | Setting up right-click for weapon item:', element.dataset.itemId);
      $(element).on('contextmenu', (event) => {
        console.log('RQ3 | Weapon item right-clicked!', event.target);
        this._onCombatItemRightClick(event);
      });
    });

    // Reset current values
    html.find('.reset-current-values').click(this._onResetCurrentValues.bind(this));

    // Prevent dice rolling when pressing Enter in character name input
    html.find('.charname input[name="name"]').keydown(this._onCharacterNameKeydown.bind(this));

    // Prevent dice rolling when pressing Enter in skill value inputs
    html.find('.rq3-skill-value-edit').keydown(this._onSkillInputKeydown.bind(this));

    // Global edit mode toggle
    html.find('.global-edit-mode-toggle').change(this._onGlobalEditModeToggle.bind(this));

    // Magic stat cog icon handlers
    html.find('.magic-stat-cog').click(this._onMagicStatCogClick.bind(this));
    
    // Magic points +/- button handlers
    html.find('.mp-adjust-btn').click(this._onMPAdjustClick.bind(this));
    
    // Sorcery spell invested points cog icon handlers
    html.find('.sorcery-spell-cog').click(this._onSorcerySpellCogClick.bind(this));
    
    // Spirit spell MP cog icon handlers
    html.find('.spirit-spell-cog').click(this._onSpiritSpellCogClick.bind(this));
    
    // Magic skill roll icon handlers (left click for normal roll, right click for custom multiplier)
    html.find('.magic-stat-roll-icon').click(this._onMagicSkillRoll.bind(this));
    html.find('.magic-stat-roll-icon').contextmenu(this._onMagicSkillRollCustom.bind(this));

    // Weapon skills accordion toggle
    html.find('.weapon-skills-accordion-header').click(this._onWeaponSkillsAccordionToggle.bind(this));

    // Weapon roll button handlers (use event delegation for dynamically added buttons)
    html.off('click', '.weapon-roll-button').on('click', '.weapon-roll-button', this._onWeaponRoll.bind(this));

    // Add any additional event listeners here

    // Species drop zone handlers - use native DOM events for better compatibility
    const speciesDropZones = html.find('.species-drop-zone');
    speciesDropZones.each((i, element) => {
      element.addEventListener('dragenter', this._onSpeciesDragEnter.bind(this), false);
      element.addEventListener('dragover', this._onSpeciesDragOver.bind(this), false);
      element.addEventListener('dragleave', this._onSpeciesDragLeave.bind(this), false);
      element.addEventListener('drop', this._onSpeciesDrop.bind(this), false);
    });

    // Species delete handler
    html.find('.species-delete').click(this._onSpeciesDelete.bind(this));

    // Species empty zone click handler
    html.find('.species-empty').click(this._onSpeciesEmptyClick.bind(this));

    // Custom skill handlers
    html.find('.add-skill-icon').click(this._onAddCustomSkill.bind(this));
    html.find('.delete-custom-skill').click(this._onDeleteCustomSkill.bind(this));

    // Compendium opener handlers
    html.find('.compendium-opener').click(this._onCompendiumOpenerClick.bind(this));

    // Weapon unequip handlers
    html.find('.unequip-button').click(this._onUnequipButton.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Equipment tab drag and drop functionality
    this._setupEquipmentDragAndDrop(html);

    // Set up carried equipment area as drop target for unequipping
    html.find('.carried-items-grid, .worn-items-grid, .worn-items-list, .empty-worn-drop-zone, .empty-carried-drop-zone, .bag-items-list, .empty-bag-drop-zone, .worn-equipment, .carried-equipment, .bag-equipment').each((i, element) => {
      element.addEventListener('dragover', this._onCarriedAreaDragOver.bind(this));
      element.addEventListener('drop', this._onCarriedAreaDrop.bind(this));
      element.addEventListener('dragleave', this._onCarriedAreaDragLeave.bind(this));
    });

    // Set up equipment slots as drop targets
    html.find('.equipment-slot').each((i, element) => {
      element.addEventListener('dragenter', this._onEquipmentSlotDragEnter.bind(this));
      element.addEventListener('dragover', this._onEquipmentSlotDragOver.bind(this));
      element.addEventListener('drop', this._onEquipmentSlotDrop.bind(this));
      element.addEventListener('dragleave', this._onEquipmentSlotDragLeave.bind(this));
    });
    
    // Set up weapon slots (weapon-slot) as drop targets
    const weaponSlots = html.find('.weapon-slot');
    console.log('RQ3 | activateListeners - Found weapon slots:', weaponSlots.length);
    weaponSlots.each((i, element) => {
      console.log('RQ3 | activateListeners - Setting up weapon slot:', element.dataset.weaponLocation, element.className);
    });
    html.find('.weapon-slot').each((i, element) => {
      element.addEventListener('dragenter', this._onWeaponSlotDragEnter.bind(this));
      element.addEventListener('dragover', this._onWeaponSlotDragOver.bind(this));
      element.addEventListener('drop', this._onWeaponSlotDrop.bind(this));
      element.addEventListener('dragleave', this._onWeaponSlotDragLeave.bind(this));
    });
    
    // Add clear hands button listener
    html.find('.clear-hands-btn').click(this._clearEquippedHands.bind(this));

    // Make spell items use equipment drag handlers
    const spellItems = html.find('.spell-item');
    spellItems.each((i, element) => {
      element.setAttribute('draggable', 'true');
      element.addEventListener('dragstart', this._onCarriedItemDragStart.bind(this));
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
      element.addEventListener('contextmenu', this._onItemRightClick.bind(this));
    });

    // Set up magic spell sections as drop targets (for adding new spells)
    html.find('.spirit-items-list, .divine-items-list, .sorcery-items-list').each((i, element) => {
      element.addEventListener('dragover', this._onSpellListDragOver.bind(this));
      element.addEventListener('drop', this._onSpellListDrop.bind(this));
      element.addEventListener('dragleave', this._onSpellListDragLeave.bind(this));
    });

    // Spell control handlers
    html.find('.spell-delete').click(this._onSpellDelete.bind(this));
    html.find('.spell-cast').click(this._onSpellCast.bind(this));

    // Container toggle handlers
    html.find('.container-toggle').click(this._onContainerToggle.bind(this));

    // Magic section visibility toggle handlers
    html.find('.magic-section-visibility-toggle').click(this._onMagicSectionVisibilityToggle.bind(this));

  }

  /**
   * Set up equipment tab drag and drop functionality
   * @param {jQuery} html   The rendered HTML
   * @private
   */
  _setupEquipmentDragAndDrop(html) {
    // Make carried items draggable
    const carriedItems = html.find('.carried-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found carried items:', carriedItems.length);
    carriedItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up carried item:', element.dataset.itemId, element.dataset.itemType);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Element classes:', element.className);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Element draggable before:', element.draggable);
      element.setAttribute('draggable', 'true');
      console.log('RQ3 | _setupEquipmentDragAndDrop - Element draggable after:', element.draggable);
      
      // Test if dragstart handler is attached
      const dragStartHandler = this._onCarriedItemDragStart.bind(this);
      element.addEventListener('dragstart', dragStartHandler);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Added dragstart handler');
      
      // Add a click handler to test if the element is interactive
      element.addEventListener('mousedown', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down on carried item:', element.dataset.itemId);
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down target:', e.target);
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down current target:', e.currentTarget);
      });
      
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
      
      // Also add click handler
      element.addEventListener('click', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - CLICK on carried item:', element.dataset.itemId);
      });
      
      // Add dragstart listener for testing
      element.addEventListener('dragstart', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - TEST DRAGSTART FIRED:', element.dataset.itemId);
      });
      
      // Add right-click to open item sheet
      element.addEventListener('contextmenu', this._onItemRightClick.bind(this));
    });

    // Make worn items draggable
    const wornItems = html.find('.worn-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found worn items:', wornItems.length);
    wornItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up worn item:', element.dataset.itemId, element.dataset.itemType);
      element.setAttribute('draggable', 'true');
      element.addEventListener('dragstart', this._onCarriedItemDragStart.bind(this));
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
      element.addEventListener('contextmenu', this._onItemRightClick.bind(this));
    });

    // Make equipped armor items draggable (for dragging back to carried)
    // Only make items in the equipment tab draggable, not the combat tab (which are just visual representations)
    const equippedItems = html.find('[data-tab="equipment"] .equipped-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found equipped items in equipment tab:', equippedItems.length);
    equippedItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up equipped item:', element.dataset.itemId, element.dataset.itemType);
      element.setAttribute('draggable', 'true');
      element.addEventListener('dragstart', this._onCarriedItemDragStart.bind(this));
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
      element.addEventListener('contextmenu', this._onItemRightClick.bind(this));
    });

    // Make bag items draggable
    const bagItems = html.find('.bag-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found bag items:', bagItems.length);
    bagItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up bag item:', element.dataset.itemId, element.dataset.itemType);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Bag element classes:', element.className);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Bag element draggable before:', element.draggable);
      element.setAttribute('draggable', 'true');
      console.log('RQ3 | _setupEquipmentDragAndDrop - Bag element draggable after:', element.draggable);
      
      // Test if dragstart handler is attached
      const dragStartHandler = this._onCarriedItemDragStart.bind(this);
      element.addEventListener('dragstart', dragStartHandler);
      console.log('RQ3 | _setupEquipmentDragAndDrop - Added dragstart handler to bag item');
      
      // Add a click handler to test if the element is interactive
      element.addEventListener('mousedown', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down on bag item:', element.dataset.itemId);
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down target:', e.target);
        console.log('RQ3 | _setupEquipmentDragAndDrop - Mouse down current target:', e.currentTarget);
      });
      
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
      
      // Also add click handler
      element.addEventListener('click', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - CLICK on bag item:', element.dataset.itemId);
      });
      
      // Add dragstart listener for testing
      element.addEventListener('dragstart', (e) => {
        console.log('RQ3 | _setupEquipmentDragAndDrop - TEST DRAGSTART FIRED on bag item:', element.dataset.itemId);
      });
      
      // Add right-click to open item sheet
      element.addEventListener('contextmenu', this._onItemRightClick.bind(this));
    });

    // Insert drop zones between items for reordering
    this._insertReorderDropZones(html);
    
    // Ensure buttons within draggable items don't interfere
    html.find('.carried-item button, .worn-item button, .equipped-item button, .bag-item button, .spell-item button, .spell-item a').each((i, button) => {
      button.addEventListener('mousedown', (event) => {
        event.stopPropagation();
      });
      button.addEventListener('click', (event) => {
        event.stopPropagation();
      });
    });

    // Set up equipment slots as drop targets
    html.find('.equipment-slot').each((i, element) => {
      element.addEventListener('dragover', this._onEquipmentSlotDragOver.bind(this));
      element.addEventListener('drop', this._onEquipmentSlotDrop.bind(this));
      element.addEventListener('dragleave', this._onEquipmentSlotDragLeave.bind(this));
    });

    // Set up container items as drop targets for placing items inside
    html.find('.equipment-item-row.container-item').each((i, element) => {
      element.addEventListener('dragenter', this._onContainerDragEnter.bind(this));
      element.addEventListener('dragover', this._onContainerDragOver.bind(this));
      element.addEventListener('dragleave', this._onContainerDragLeave.bind(this));
      element.addEventListener('drop', this._onContainerDrop.bind(this));
    });
  }



  /**
   * Clear equipped weapons from both hands for testing
   * @private
   */
  async _clearEquippedHands() {
    console.log('RQ3 | _clearEquippedHands - Clearing both hands');
    
    const updateData = {
      'system.equippedWeapons.leftHand': '',
      'system.equippedWeapons.rightHand': ''
    };
    
    // Also unequip any weapons that were equipped in hands from general equipped status
    const leftHandItemId = this.actor.system.equippedWeapons?.leftHand;
    const rightHandItemId = this.actor.system.equippedWeapons?.rightHand;
    
    if (leftHandItemId) {
      const leftHandItem = this.actor.items.get(leftHandItemId);
      if (leftHandItem && leftHandItem.system.equipped) {
        updateData[`items.${leftHandItemId}.system.equipped`] = false;
      }
    }
    
    if (rightHandItemId) {
      const rightHandItem = this.actor.items.get(rightHandItemId);
      if (rightHandItem && rightHandItem.system.equipped) {
        updateData[`items.${rightHandItemId}.system.equipped`] = false;
      }
    }
    
    await this.actor.update(updateData);
    this.render(false);
    
    ui.notifications.info('Cleared both hands and unequipped weapons.');
  }

  /**
   * Handle start of carried item drag
   * @param {DragEvent} event
   * @private
   */
  _onCarriedItemDragStart(event) {
    console.log('RQ3 | _onCarriedItemDragStart - ***** DRAG START FIRED! *****');
    console.log('RQ3 | _onCarriedItemDragStart - Event target:', event.target);
    console.log('RQ3 | _onCarriedItemDragStart - Current target:', event.currentTarget);
    
    // Check if the drag started from a button or link - if so, prevent drag
    if (event.target.tagName === 'BUTTON' || event.target.closest('button') ||
        event.target.tagName === 'A' || event.target.closest('a')) {
      console.log('RQ3 | _onCarriedItemDragStart - Preventing drag due to button/link');
      event.preventDefault();
      return false;
    }
    
    const itemId = event.currentTarget.dataset.itemId;
    const itemType = event.currentTarget.dataset.itemType;
    
    console.log('RQ3 | _onCarriedItemDragStart - itemId:', itemId, 'itemType:', itemType);
    
    // Get the item to include additional data in drag data
    const item = this.actor.items.get(itemId);
    const dragData = {
      type: 'Item',
      uuid: `Actor.${this.actor.id}.Item.${itemId}`,
      itemId: itemId, // Add itemId for reordering
      itemType: itemType
    };
    
    // Add armor-specific data for compatibility checking
    if (item && item.type === 'armor') {
      dragData.armorLocation = item.system.armorLocation;
      dragData.armorType = item.system.armorType;
    }
    
    // Add equipment type for tools
    if (item && item.type === 'equipment') {
      dragData.equipmentType = item.system.equipmentType;
    }
    
    // Add spell type for spells
    if (item && item.type === 'spell') {
      dragData.spellType = item.system.spellType;
    }
    
    console.log('RQ3 | _onCarriedItemDragStart - dragData:', dragData);
    
    // Store drag data on the sheet instance for reliable access
    this._currentDragData = dragData;
    
    try {
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      console.log('RQ3 | _onCarriedItemDragStart - Successfully set dataTransfer data');
    } catch (error) {
      console.error('RQ3 | _onCarriedItemDragStart - Error setting dataTransfer data:', error);
    }
    
    event.currentTarget.classList.add('dragging');
  }

  /**
   * Handle end of carried item drag
   * @param {DragEvent} event
   * @private
   */
  _onCarriedItemDragEnd(event) {
    console.log('RQ3 | _onCarriedItemDragEnd - Starting, _currentDragData:', this._currentDragData);
    event.currentTarget.classList.remove('dragging');
    // Clear stored drag data
    console.log('RQ3 | _onCarriedItemDragEnd - Clearing _currentDragData');
    this._currentDragData = null;
  }

  /**
   * Handle right-click on an item to open its sheet
   * @param {Event} event
   * @private
   */
  _onItemRightClick(event) {
    event.preventDefault();
    const itemId = event.currentTarget.dataset.itemId;
    
    if (!itemId) {
      console.warn('RQ3 | _onItemRightClick - No item ID found');
      return;
    }
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('RQ3 | _onItemRightClick - Item not found:', itemId);
      return;
    }
    
    console.log('RQ3 | _onItemRightClick - Opening item sheet for:', item.name);
    item.sheet.render(true);
  }

  /**
   * Handle right-click on combat tab items (armor and weapons) to open their sheets
   * @param {Event} event
   * @private
   */
  _onCombatItemRightClick(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    console.log('RQ3 | _onCombatItemRightClick - Event triggered, target:', event.target);
    
    // With event delegation, event.target is the actual clicked element (could be img, div, etc.)
    // Find the closest element with data-item-id (could be the element itself or a parent)
    let target = event.target;
    
    // Use jQuery to find the closest parent with data-item-id
    const $itemElement = $(target).closest('[data-item-id]');
    
    if (!$itemElement.length) {
      console.warn('RQ3 | _onCombatItemRightClick - No item element with data-item-id found. Target:', target);
      return;
    }
    
    const itemId = $itemElement.data('item-id') || $itemElement.attr('data-item-id');
    
    if (!itemId) {
      console.warn('RQ3 | _onCombatItemRightClick - No item ID found on element:', $itemElement[0]);
      return;
    }
    
    console.log('RQ3 | _onCombatItemRightClick - Found item ID:', itemId);
    
    const item = this.actor.items.get(itemId);
    
    if (!item) {
      console.warn('RQ3 | _onCombatItemRightClick - Item not found:', itemId);
      return;
    }
    
    console.log('RQ3 | _onCombatItemRightClick - Opening item sheet for:', item.name);
    item.sheet.render(true);
  }

  /**
   * Handle drag over on an item row for reordering
   * @param {DragEvent} event
   * @private
   */
  _onItemRowDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const draggedItemId = this._currentDragData?.itemId;
    const targetItemId = event.currentTarget.dataset.itemId;
    
    // Don't show indicator if dragging over self
    if (draggedItemId === targetItemId) {
      return;
    }
    
    // Get the bounding rectangle of the target
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + (rect.height / 2);
    
    // Determine if we should show indicator above or below
    const insertBefore = event.clientY < midpoint;
    
    // Check if we already have an indicator in the right position on this element
    const existingIndicator = event.currentTarget.querySelector('.drop-indicator');
    let needsUpdate = true;
    
    if (existingIndicator) {
      // Check if the indicator is already positioned correctly (top vs bottom)
      const isAtTop = existingIndicator.style.top === '0px' || existingIndicator.style.top === '0';
      needsUpdate = (insertBefore && !isAtTop) || (!insertBefore && isAtTop);
    }
    
    // Only update if position needs to change
    if (needsUpdate) {
      // Remove any existing indicators from all items
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
      
      // Add drop indicator as a child of the target element
      // Using absolute positioning, so it won't affect layout
      const indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
      
      // Position at top or bottom of the element
      if (insertBefore) {
        indicator.style.top = '0';
      } else {
        indicator.style.bottom = '0';
        indicator.style.top = 'auto';
      }
      
      event.currentTarget.appendChild(indicator);
    }
  }

  /**
   * Handle drag leave on an item row
   * @param {DragEvent} event
   * @private
   */
  _onItemRowDragLeave(event) {
    // Only remove indicator if truly leaving the item area
    // Check if the relatedTarget (where we're going) is:
    // 1. Not a child of the current target
    // 2. Not another equipment-item-row
    // 3. Not the drop indicator itself
    const relatedTarget = event.relatedTarget;
    
    if (!relatedTarget) {
      // Leaving to nowhere (outside the document), remove indicator
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
      return;
    }
    
    // Don't remove if moving to a child element of the current row
    if (event.currentTarget.contains(relatedTarget)) {
      return;
    }
    
    // Don't remove if moving to the drop indicator itself
    if (relatedTarget.classList && relatedTarget.classList.contains('drop-indicator')) {
      return;
    }
    
    // Don't remove if moving to another item row
    if (relatedTarget.closest('.equipment-item-row')) {
      return;
    }
    
    // Otherwise, we're leaving the item area, remove the indicator
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
  }

  /**
   * Handle drop on an item row for reordering
   * @param {DragEvent} event
   * @private
   */
  async _onItemRowDrop(event) {
    // Remove drop indicator
    document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    
    const draggedItemId = this._currentDragData?.itemId;
    const targetItemId = event.currentTarget.dataset.itemId;
    
    console.log('RQ3 | _onItemRowDrop - draggedItemId:', draggedItemId, 'targetItemId:', targetItemId);
    
    // Don't do anything if dropping on self
    if (!draggedItemId || draggedItemId === targetItemId) {
      // Let the section handler deal with it
      console.log('RQ3 | _onItemRowDrop - Dropping on self or no drag data, returning');
      return;
    }
    
    const draggedItem = this.actor.items.get(draggedItemId);
    const targetItem = this.actor.items.get(targetItemId);
    
    if (!draggedItem || !targetItem) {
      console.error('RQ3 | Could not find dragged or target item');
      return;
    }
    
    console.log('RQ3 | _onItemRowDrop - draggedItem:', draggedItem.name, 'targetItem:', targetItem.name);
    
    // Check if they're in the same section (storage location + equipped status + containerId)
    const draggedStorage = draggedItem.system.storageLocation || 'carried';
    const draggedEquipped = draggedItem.system.equipped || false;
    const draggedContainerId = draggedItem.system.containerId || null;
    const targetStorage = targetItem.system.storageLocation || 'carried';
    const targetEquipped = targetItem.system.equipped || false;
    const targetContainerId = targetItem.system.containerId || null;
    
    console.log('RQ3 | _onItemRowDrop - draggedStorage:', draggedStorage, 'draggedEquipped:', draggedEquipped, 'draggedContainerId:', draggedContainerId);
    console.log('RQ3 | _onItemRowDrop - targetStorage:', targetStorage, 'targetEquipped:', targetEquipped, 'targetContainerId:', targetContainerId);
    
    const sameSection = (draggedStorage === targetStorage) && 
                        (draggedEquipped === targetEquipped) && 
                        (draggedContainerId === targetContainerId);
    
    console.log('RQ3 | _onItemRowDrop - sameSection:', sameSection);
    
    // If not in the same section, check if we need to clear containerId
    // (e.g., dragging from inside container to outside, or between different containers)
    if (!sameSection) {
      console.log('RQ3 | _onItemRowDrop - Not in same section, checking if containerId should be cleared');
      
      // If dragged item is in a container but target is not (or vice versa), clear containerId
      // This allows items to be moved out of containers by dropping on items outside containers
      if (draggedContainerId && !targetContainerId) {
        console.log('RQ3 | _onItemRowDrop - Moving item out of container, clearing containerId');
        event.preventDefault();
        event.stopPropagation();
        await draggedItem.update({ 'system.containerId': null });
        // Recalculate encumbrance
        this.actor._calculateEncumbrance();
        return;
      }
      
      // Otherwise, let the section handler deal with it
      console.log('RQ3 | _onItemRowDrop - Letting section handler deal with it');
      return;
    }
    
    // Only handle reordering if they're in the same section
    event.preventDefault();
    event.stopPropagation();
    
    console.log('RQ3 | _onItemRowDrop - Proceeding with reorder');
    
    // Get the bounding rectangle of the target
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + (rect.height / 2);
    const insertBefore = event.clientY < midpoint;
    
    console.log('RQ3 | _onItemRowDrop - insertBefore:', insertBefore, 'clientY:', event.clientY, 'midpoint:', midpoint);
    
    // Get siblings for sorting - must be in same container (or both not in containers)
    const siblings = this.actor.items.filter(i => {
      // Same storage location and equipped status
      const sameStorage = i.system.storageLocation === draggedItem.system.storageLocation;
      const sameEquipped = i.system.equipped === draggedItem.system.equipped;
      // Same container (both null means both are top-level, or both have same containerId)
      const sameContainer = (i.system.containerId || null) === draggedContainerId;
      return sameStorage && sameEquipped && sameContainer && i.type === draggedItem.type;
    });
    
    console.log('RQ3 | _onItemRowDrop - Found siblings:', siblings.length, siblings.map(s => s.name));
    
    // Create sort updates
    const sortUpdates = [];
    const targetSort = targetItem.sort || 0;
    
    // Calculate new sort value
    let newSort;
    if (insertBefore) {
      // Find previous item's sort value
      const targetIndex = siblings.indexOf(targetItem);
      const previousItem = targetIndex > 0 ? siblings[targetIndex - 1] : null;
      const previousSort = previousItem?.sort || 0;
      newSort = (previousSort + targetSort) / 2;
      console.log('RQ3 | _onItemRowDrop - Inserting before, targetIndex:', targetIndex, 'previousSort:', previousSort, 'targetSort:', targetSort, 'newSort:', newSort);
    } else {
      // Find next item's sort value
      const targetIndex = siblings.indexOf(targetItem);
      const nextItem = targetIndex < siblings.length - 1 ? siblings[targetIndex + 1] : null;
      const nextSort = nextItem?.sort || (targetSort + 100);
      newSort = (targetSort + nextSort) / 2;
      console.log('RQ3 | _onItemRowDrop - Inserting after, targetIndex:', targetIndex, 'targetSort:', targetSort, 'nextSort:', nextSort, 'newSort:', newSort);
    }
    
    // Update the dragged item's sort value
    console.log('RQ3 | _onItemRowDrop - Updating item sort:', draggedItem.name, 'from', draggedItem.sort, 'to', newSort);
    await draggedItem.update({ sort: newSort });
    
    console.log(`RQ3 | Reordered item ${draggedItem.name} with sort value ${newSort}`);
  }

  /**
   * Insert drop zones between items for reordering
   * @param {jQuery} html   The rendered HTML
   * @private
   */
  _insertReorderDropZones(html) {
    // Process each list container
    const containers = [
      { selector: '.worn-items-list', storageLocation: 'worn', equipped: true },
      { selector: '.carried-items-list', storageLocation: 'carried', equipped: false },
      { selector: '.bag-items-list', storageLocation: 'bag', equipped: false },
      { selector: '.spirit-items-list[data-spell-storage="standard"]', storageLocation: 'spirit', equipped: false, spellStorage: 'standard' },
      { selector: '.spirit-items-list[data-spell-storage="int-spirit"]', storageLocation: 'spirit', equipped: false, spellStorage: 'int-spirit' },
      { selector: '.spirit-items-list[data-spell-storage="spell-matrix"]', storageLocation: 'spirit', equipped: false, spellStorage: 'spell-matrix' },
      { selector: '.divine-items-list', storageLocation: 'divine', equipped: false },
      { selector: '.sorcery-items-list[data-spell-storage="standard"]', storageLocation: 'sorcery', equipped: false, spellStorage: 'standard' },
      { selector: '.sorcery-items-list[data-spell-storage="int-spirit"]', storageLocation: 'sorcery', equipped: false, spellStorage: 'int-spirit' },
      { selector: '.sorcery-items-list[data-spell-storage="spell-matrix"]', storageLocation: 'sorcery', equipped: false, spellStorage: 'spell-matrix' },
      { selector: '.sorcery-items-list[data-spell-storage="unavailable"]', storageLocation: 'sorcery', equipped: false, spellStorage: 'unavailable' }
    ];
    
    console.log('RQ3 | _insertReorderDropZones - Starting');
    
    containers.forEach(container => {
      const list = html.find(container.selector)[0];
      if (!list) {
        console.log('RQ3 | _insertReorderDropZones - No list found for', container.selector);
        return;
      }
      
      const items = Array.from(list.querySelectorAll('.equipment-item-row'));
      console.log(`RQ3 | _insertReorderDropZones - Found ${items.length} items in ${container.selector}`);
      
      // Log current sort values
      items.forEach((elem, idx) => {
        const itemId = elem.dataset.itemId;
        const item = this.actor.items.get(itemId);
        const isContainer = item && item.type === 'equipment' && item.system.equipmentType === 'container';
        const containerId = item?.system.containerId || null;
        console.log(`RQ3 | _insertReorderDropZones - Item ${idx}: ${item?.name}, sort: ${item?.sort}, id: ${itemId}, isContainer: ${isContainer}, containerId: ${containerId}`);
      });
      
      //Insert drop zone at the beginning
      const firstDropZone = this._createDropZone(container.storageLocation, container.equipped, container.spellStorage, true, null, items[0]?.dataset.itemId);
      if (items.length > 0) {
        list.insertBefore(firstDropZone, items[0]);
      } else {
        list.appendChild(firstDropZone);
      }
      
      // Insert drop zones between items
      for (let i = 0; i < items.length - 1; i++) {
        const currentItemId = items[i].dataset.itemId;
        const nextItemId = items[i + 1].dataset.itemId;
        
        const dropZone = this._createDropZone(
          container.storageLocation,
          container.equipped,
          container.spellStorage,
          false,
          currentItemId,
          nextItemId
        );
        items[i].parentNode.insertBefore(dropZone, items[i].nextSibling);
      }
      
      // Insert drop zone at the end (for reordering inside container if last item is in container)
      if (items.length > 0) {
        const lastItem = this.actor.items.get(items[items.length - 1].dataset.itemId);
        const lastItemIsInContainer = lastItem && lastItem.system.containerId;
        
        if (lastItemIsInContainer) {
          // Last item is in a container - create drop zone for reordering inside container
          const lastDropZone = this._createDropZone(container.storageLocation, container.equipped, container.spellStorage, false, items[items.length - 1].dataset.itemId, null);
          list.appendChild(lastDropZone);
          
          // Also create a top-level drop zone AFTER the container drop zone for moving items out
          const containerId = lastItem.system.containerId;
          const containerItem = this.actor.items.get(containerId);
          
          if (containerItem && containerItem.type === 'equipment' && containerItem.system.equipmentType === 'container') {
            const topLevelDropZone = document.createElement('div');
            topLevelDropZone.className = 'reorder-drop-zone top-level-zone';
            topLevelDropZone.dataset.storageLocation = container.storageLocation;
            topLevelDropZone.dataset.equipped = container.equipped;
            if (container.spellStorage) topLevelDropZone.dataset.spellStorage = container.spellStorage;
            topLevelDropZone.dataset.isFirst = false;
            topLevelDropZone.dataset.beforeItem = containerId; // Container itself
            // Explicitly set containerId to empty string (not undefined) to indicate top-level
            topLevelDropZone.dataset.containerId = '';
            // Don't set afterItem - this is a top-level zone after the container
            
            // Add margin-top to separate it from the container drop zone above
            topLevelDropZone.style.marginTop = '15px';
            
            topLevelDropZone.addEventListener('dragenter', this._onDropZoneDragEnter.bind(this));
            topLevelDropZone.addEventListener('dragover', this._onDropZoneDragOver.bind(this));
            topLevelDropZone.addEventListener('dragleave', this._onDropZoneDragLeave.bind(this));
            topLevelDropZone.addEventListener('drop', this._onDropZoneDrop.bind(this));
            
            list.appendChild(topLevelDropZone);
            console.log('RQ3 | _insertReorderDropZones - Created top-level drop zone after container:', containerItem.name);
          }
        } else {
          // Last item is not in a container - just create normal drop zone
          const lastDropZone = this._createDropZone(container.storageLocation, container.equipped, container.spellStorage, false, items[items.length - 1].dataset.itemId, null);
          list.appendChild(lastDropZone);
        }
      }
    });
  }

  /**
   * Create a drop zone element
   * @param {string} storageLocation
   * @param {boolean} equipped
   * @param {boolean} isFirst
   * @param {string|null} beforeItemId
   * @param {string|null} afterItemId
   * @returns {HTMLElement}
   * @private
   */
  _createDropZone(storageLocation, equipped, spellStorage, isFirst, beforeItemId, afterItemId) {
    const dropZone = document.createElement('div');
    dropZone.className = 'reorder-drop-zone';
    dropZone.dataset.storageLocation = storageLocation;
    dropZone.dataset.equipped = equipped;
    if (spellStorage) dropZone.dataset.spellStorage = spellStorage;
    dropZone.dataset.isFirst = isFirst;
    if (beforeItemId) dropZone.dataset.beforeItem = beforeItemId;
    if (afterItemId) dropZone.dataset.afterItem = afterItemId;
    
    // Detect if this drop zone is inside a container by checking the items around it
    const beforeItem = beforeItemId ? this.actor.items.get(beforeItemId) : null;
    const afterItem = afterItemId ? this.actor.items.get(afterItemId) : null;
    
    // If both items have the same containerId, this drop zone is in that container
    const beforeContainerId = beforeItem?.system.containerId || null;
    const afterContainerId = afterItem?.system.containerId || null;
    
    // Check if beforeItem is a container itself (for drop zones right after container items)
    const beforeItemIsContainer = beforeItem && beforeItem.type === 'equipment' && beforeItem.system.equipmentType === 'container';
    
    console.log('RQ3 | _createDropZone - beforeItem:', beforeItem?.name, 'beforeContainerId:', beforeContainerId, 'isContainer:', beforeItemIsContainer);
    console.log('RQ3 | _createDropZone - afterItem:', afterItem?.name, 'afterContainerId:', afterContainerId);
    
    // Priority: if afterItem has a containerId, use it (drop zone before first item in container)
    if (afterContainerId) {
      dropZone.dataset.containerId = afterContainerId;
      console.log('RQ3 | _createDropZone - Set containerId from afterItem:', afterContainerId);
    } 
    // If beforeItem is a container and afterItem is inside it (has that container as containerId)
    else if (beforeItemIsContainer && afterContainerId === beforeItemId) {
      dropZone.dataset.containerId = beforeItemId;
      console.log('RQ3 | _createDropZone - Set containerId from container item:', beforeItemId);
    }
    // If both items have the same containerId, use it
    else if (beforeContainerId && beforeContainerId === afterContainerId) {
      dropZone.dataset.containerId = beforeContainerId;
      console.log('RQ3 | _createDropZone - Set containerId from both items:', beforeContainerId);
    }
    // If only beforeItem has containerId and no afterItem, check if it's inside a container or after a container
    else if (beforeContainerId && !afterItemId) {
      // If beforeItem is itself a container, this drop zone is OUTSIDE the container (top-level)
      // If beforeItem is inside a container, this drop zone is the last position IN that container
      if (beforeItemIsContainer) {
        // Drop zone after a container - keep it as top-level (no containerId)
        console.log('RQ3 | _createDropZone - Drop zone after container, keeping as top-level (no containerId)');
      } else {
        // Drop zone after last item in container - set containerId
        dropZone.dataset.containerId = beforeContainerId;
        console.log('RQ3 | _createDropZone - Set containerId from last item in container:', beforeContainerId);
      }
    } else {
      console.log('RQ3 | _createDropZone - No containerId set (top-level drop zone)');
    }
    
    dropZone.addEventListener('dragenter', this._onDropZoneDragEnter.bind(this));
    dropZone.addEventListener('dragover', this._onDropZoneDragOver.bind(this));
    dropZone.addEventListener('dragleave', this._onDropZoneDragLeave.bind(this));
    dropZone.addEventListener('drop', this._onDropZoneDrop.bind(this));
    
    return dropZone;
  }

  /**
   * Handle drag enter on drop zone
   * @param {DragEvent} event
   * @private
   */
  _onDropZoneDragEnter(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent parent handlers from interfering
    
    const dropZone = event.currentTarget;
    const draggedItemId = this._currentDragData?.itemId;
    
    console.log('RQ3 | _onDropZoneDragEnter - Entered drop zone, beforeItem:', dropZone.dataset.beforeItem, 'afterItem:', dropZone.dataset.afterItem, 'zoneContainerId:', dropZone.dataset.containerId);
    
    // Don't highlight if dragging over zones for the same item
    if (draggedItemId === dropZone.dataset.beforeItem || draggedItemId === dropZone.dataset.afterItem) {
      console.log('RQ3 | _onDropZoneDragEnter - Dragging over zone for same item, not highlighting');
      return;
    }
    
    // Check if the dragged item and drop zone are in compatible container contexts
    const draggedItem = this.actor.items.get(draggedItemId);
    const draggedContainerId = draggedItem?.system.containerId || null;
    // Treat empty string, undefined, and 'undefined' string as null
    let zoneContainerId = dropZone.dataset.containerId;
    if (!zoneContainerId || zoneContainerId === 'undefined' || zoneContainerId === '') {
      zoneContainerId = null;
    }
    
    console.log('RQ3 | _onDropZoneDragEnter - draggedContainerId:', draggedContainerId, 'zoneContainerId:', zoneContainerId);
    
    // Highlight if:
    // 1. Same container context (reordering)
    // 2. Moving INTO container (draggedContainerId is null, zoneContainerId is set)
    // 3. Moving OUT of container (draggedContainerId is set, zoneContainerId is null)
    // Don't highlight: Moving between different containers (both set but different)
    if (draggedContainerId !== zoneContainerId) {
      const movingIntoContainer = !draggedContainerId && zoneContainerId;
      const movingOutOfContainer = draggedContainerId && !zoneContainerId;
      
      console.log('RQ3 | _onDropZoneDragEnter - movingIntoContainer:', movingIntoContainer, 'movingOutOfContainer:', movingOutOfContainer);
      
      if (!movingIntoContainer && !movingOutOfContainer) {
        console.log('RQ3 | _onDropZoneDragEnter - Moving between different containers, not highlighting');
        return;
      }
      // Otherwise, allow highlighting (moving into or out of container)
      console.log('RQ3 | _onDropZoneDragEnter - Allowing container context change');
    }
    
    console.log('RQ3 | _onDropZoneDragEnter - Adding active class to drop zone');
    dropZone.classList.add('active');
  }

  /**
   * Handle drag over on drop zone
   * @param {DragEvent} event
   * @private
   */
  _onDropZoneDragOver(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent parent handlers from interfering
    
    // Check if container contexts are compatible before allowing drop
    const dropZone = event.currentTarget;
    const draggedItemId = this._currentDragData?.itemId;
    const draggedItem = this.actor.items.get(draggedItemId);
    const draggedContainerId = draggedItem?.system.containerId || null;
    // Treat empty string, undefined, and 'undefined' string as null
    let zoneContainerId = dropZone.dataset.containerId;
    if (!zoneContainerId || zoneContainerId === 'undefined' || zoneContainerId === '') {
      zoneContainerId = null;
    }
    
    // Allow drop if:
    // 1. Same container context (reordering)
    // 2. Moving INTO container (draggedContainerId is null, zoneContainerId is set)
    // 3. Moving OUT of container (draggedContainerId is set, zoneContainerId is null)
    // Prevent: Moving between different containers (both set but different)
    if (draggedContainerId === zoneContainerId) {
      console.log('RQ3 | _onDropZoneDragOver - Dragging over drop zone (container contexts match)');
    } else {
      const movingIntoContainer = !draggedContainerId && zoneContainerId;
      const movingOutOfContainer = draggedContainerId && !zoneContainerId;
      
      if (movingIntoContainer || movingOutOfContainer) {
        console.log('RQ3 | _onDropZoneDragOver - Container context change allowed:', movingIntoContainer ? 'moving into container' : 'moving out of container');
      } else {
        console.log('RQ3 | _onDropZoneDragOver - Moving between different containers, preventing drop');
        event.dataTransfer.dropEffect = 'none';
      }
    }
  }

  /**
   * Handle drag leave on drop zone
   * @param {DragEvent} event
   * @private
   */
  _onDropZoneDragLeave(event) {
    const dropZone = event.currentTarget;
    if (!dropZone.contains(event.relatedTarget)) {
      console.log('RQ3 | _onDropZoneDragLeave - Left drop zone');
      dropZone.classList.remove('active');
    }
  }

  /**
   * Handle drop on drop zone
   * @param {DragEvent} event
   * @private
   */
  async _onDropZoneDrop(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent parent handlers from interfering
    
    console.log('RQ3 | _onDropZoneDrop - DROP on drop zone!');
    
    const dropZone = event.currentTarget;
    dropZone.classList.remove('active');
    
    const draggedItemId = this._currentDragData?.itemId;
    if (!draggedItemId) {
      console.log('RQ3 | _onDropZoneDrop - No draggedItemId');
      return;
    }
    
    const draggedItem = this.actor.items.get(draggedItemId);
    if (!draggedItem) {
      console.log('RQ3 | _onDropZoneDrop - No draggedItem found');
      return;
    }
    
    // Check container context compatibility
    const draggedContainerId = draggedItem.system.containerId || null;
    // Treat empty string, undefined, and 'undefined' string as null
    let zoneContainerId = dropZone.dataset.containerId;
    if (!zoneContainerId || zoneContainerId === 'undefined' || zoneContainerId === '') {
      zoneContainerId = null;
    }
    
    // Allow drops in these cases:
    // 1. Same container context (reordering within container or outside)
    // 2. Moving INTO container (draggedContainerId is null, zoneContainerId is set)
    // 3. Moving OUT of container (draggedContainerId is set, zoneContainerId is null)
    // Prevent: Moving between different containers (both set but different)
    if (draggedContainerId !== zoneContainerId) {
      // Check if this is a valid container context change
      const movingIntoContainer = !draggedContainerId && zoneContainerId;
      const movingOutOfContainer = draggedContainerId && !zoneContainerId;
      
      if (!movingIntoContainer && !movingOutOfContainer) {
        // Both have containerIds but they're different - moving between containers, not allowed
        console.log('RQ3 | _onDropZoneDrop - Moving between different containers, ignoring drop');
        console.log('RQ3 | _onDropZoneDrop - draggedContainerId:', draggedContainerId, 'zoneContainerId:', zoneContainerId);
        return;
      }
      // Otherwise, allow the drop (moving into or out of container)
      console.log('RQ3 | _onDropZoneDrop - Container context change allowed:', movingIntoContainer ? 'moving into container' : 'moving out of container');
    }
    
    const afterItemId = dropZone.dataset.afterItem;
    const beforeItemId = dropZone.dataset.beforeItem;
    const targetStorageLocation = dropZone.dataset.storageLocation;
    const targetEquipped = dropZone.dataset.equipped === 'true';
    const targetSpellStorage = dropZone.dataset.spellStorage || 'standard';
    const targetContainerId = dropZone.dataset.containerId || null;
    
    console.log('RQ3 | _onDropZoneDrop - draggedItem:', draggedItem.name);
    console.log('RQ3 | _onDropZoneDrop - beforeItemId (item above zone):', beforeItemId);
    console.log('RQ3 | _onDropZoneDrop - afterItemId (item below zone):', afterItemId);
    console.log('RQ3 | _onDropZoneDrop - targetStorageLocation:', targetStorageLocation, 'targetEquipped:', targetEquipped, 'targetSpellStorage:', targetSpellStorage, 'targetContainerId:', targetContainerId);
    
    // Handle spells differently - they use spellType instead of storageLocation
    if (draggedItem.type === 'spell') {
      // Validate spell type matches target section
      const targetSpellType = targetStorageLocation; // For spells, storageLocation is actually spellType
      if (draggedItem.system.spellType !== targetSpellType) {
        console.log('RQ3 | _onDropZoneDrop - Spell type mismatch, ignoring drop');
        return; // Let the section handler deal with cross-type moves
      }
      
      // Only validate Free INT for spells going into standard storage
      if (targetSpellStorage === 'standard') {
        // Validate spirit magic MP limits using Free INT
        if (targetSpellType === 'spirit') {
          const freeIntMax = this.actor.system.magic?.freeInt?.current || 0;
          const currentSpiritSpells = this.actor.items.filter(i => 
            i.type === 'spell' && 
            i.system.spellType === 'spirit' && 
            i.id !== draggedItem.id &&
            (i.system.spellStorageLocation || 'standard') === 'standard'
          );
          const currentTotalMP = currentSpiritSpells.reduce((sum, spell) => sum + (spell.system.magicPoints || 0), 0);
          const currentSorcerySpells = this.actor.items.filter(i => 
            i.type === 'spell' && 
            i.system.spellType === 'sorcery' &&
            (i.system.spellStorageLocation || 'standard') === 'standard'
          );
          const sorcerySpellCount = currentSorcerySpells.length;
          const spellMP = draggedItem.system.magicPoints || 0;
          const newTotalMP = currentTotalMP + spellMP;
          const totalUsed = newTotalMP + sorcerySpellCount;
          
          if (totalUsed > freeIntMax) {
            ui.notifications.warn(`Cannot add spell: Total MP (${newTotalMP}) + Sorcery spells (${sorcerySpellCount}) would exceed Free INT (${freeIntMax}).`);
            return;
          }
        }
        
        // Validate sorcery spell Free INT limits (each uses 1 Free INT)
        if (targetSpellType === 'sorcery') {
          const freeIntMax = this.actor.system.magic?.freeInt?.current || 0;
          const currentSpiritSpells = this.actor.items.filter(i => 
            i.type === 'spell' && 
            i.system.spellType === 'spirit' &&
            (i.system.spellStorageLocation || 'standard') === 'standard'
          );
          const totalSpiritMP = currentSpiritSpells.reduce((sum, spell) => sum + (spell.system.magicPoints || 0), 0);
          const currentSorcerySpells = this.actor.items.filter(i => 
            i.type === 'spell' && 
            i.system.spellType === 'sorcery' && 
            i.id !== draggedItem.id &&
            (i.system.spellStorageLocation || 'standard') === 'standard'
          );
          const sorcerySpellCount = currentSorcerySpells.length;
          const newSorceryCount = sorcerySpellCount + 1;
          const totalUsed = totalSpiritMP + newSorceryCount;
          
          if (totalUsed > freeIntMax) {
            ui.notifications.warn(`Cannot add spell: Spirit MP (${totalSpiritMP}) + Sorcery spells (${newSorceryCount}) would exceed Free INT (${freeIntMax}).`);
            return;
          }
        }
      }
      
      // Check if spell storage location is changing
      const currentSpellStorage = draggedItem.system.spellStorageLocation || 'standard';
      const changingSpellStorage = currentSpellStorage !== targetSpellStorage;
      
      console.log('RQ3 | _onDropZoneDrop - Spell storage check - current:', currentSpellStorage, 'target:', targetSpellStorage, 'changing:', changingSpellStorage);
      
      // Calculate new sort value for spell reordering
      let newSort;
      
      if (!afterItemId && !beforeItemId) {
        newSort = 0;
      } else if (!beforeItemId) {
        const afterItem = this.actor.items.get(afterItemId);
        const afterSort = afterItem?.sort || 0;
        newSort = afterSort - 1000;
      } else if (!afterItemId) {
        const beforeItem = this.actor.items.get(beforeItemId);
        const beforeSort = beforeItem?.sort || 0;
        newSort = beforeSort + 1000;
      } else {
        const beforeItem = this.actor.items.get(beforeItemId);
        const afterItem = this.actor.items.get(afterItemId);
        const beforeSort = beforeItem?.sort || 0;
        const afterSort = afterItem?.sort || 0;
        newSort = (beforeSort + afterSort) / 2;
      }
      
      try {
        const updateData = { sort: newSort };
        
        // Update spellStorageLocation if moving to a different storage section
        if (changingSpellStorage) {
          console.log('RQ3 | _onDropZoneDrop - Updating spellStorageLocation from', currentSpellStorage, 'to', targetSpellStorage);
          updateData['system.spellStorageLocation'] = targetSpellStorage;
        }
        
        console.log('RQ3 | _onDropZoneDrop - Spell update data:', updateData);
        await draggedItem.update(updateData);
        this.render(false);
      } catch (error) {
        console.error('RQ3 | _onDropZoneDrop - Error updating spell:', error);
      }
      return;
    }
    
    // Handle equipment items (existing logic)
    const currentStorageLocation = draggedItem.system.storageLocation || 'carried';
    const currentEquipped = draggedItem.system.equipped || false;
    const currentContainerId = draggedItem.system.containerId || null;
    const currentSpellStorage = draggedItem.type === 'spell' ? (draggedItem.system.spellStorageLocation || 'standard') : null;
    const changingSection = (currentStorageLocation !== targetStorageLocation) || (currentEquipped !== targetEquipped);
    const changingContainer = currentContainerId !== targetContainerId;
    const changingSpellStorage = draggedItem.type === 'spell' && currentSpellStorage !== targetSpellStorage;
    
    console.log('RQ3 | _onDropZoneDrop - currentStorageLocation:', currentStorageLocation, 'currentEquipped:', currentEquipped, 'currentContainerId:', currentContainerId);
    console.log('RQ3 | _onDropZoneDrop - currentSpellStorage:', currentSpellStorage, 'targetSpellStorage:', targetSpellStorage);
    console.log('RQ3 | _onDropZoneDrop - changingSection:', changingSection, 'changingContainer:', changingContainer, 'changingSpellStorage:', changingSpellStorage);
    
    // Calculate new sort value
    // beforeItemId = item that appears before this drop zone (above)
    // afterItemId = item that appears after this drop zone (below)
    let newSort;
    
    if (!afterItemId && !beforeItemId) {
      // Empty list
      console.log('RQ3 | _onDropZoneDrop - Empty list, setting sort to 0');
      newSort = 0;
    } else if (!beforeItemId) {
      // First position - no item above, so place before the afterItem
      const afterItem = this.actor.items.get(afterItemId);
      const afterSort = afterItem?.sort || 0;
      newSort = afterSort - 1000;
      console.log('RQ3 | _onDropZoneDrop - First position, afterItem:', afterItem?.name, 'afterSort:', afterSort, 'newSort:', newSort);
    } else if (!afterItemId) {
      // Last position - no item below, so place after the beforeItem
      const beforeItem = this.actor.items.get(beforeItemId);
      const beforeSort = beforeItem?.sort || 0;
      newSort = beforeSort + 1000;
      console.log('RQ3 | _onDropZoneDrop - Last position, beforeItem:', beforeItem?.name, 'beforeSort:', beforeSort, 'newSort:', newSort);
    } else {
      // Between two items
      const beforeItem = this.actor.items.get(beforeItemId);
      const afterItem = this.actor.items.get(afterItemId);
      const beforeSort = beforeItem?.sort || 0;
      const afterSort = afterItem?.sort || 0;
      newSort = (beforeSort + afterSort) / 2;
      console.log('RQ3 | _onDropZoneDrop - Between items');
      console.log('RQ3 | _onDropZoneDrop - beforeItem:', beforeItem?.name, 'beforeSort:', beforeSort);
      console.log('RQ3 | _onDropZoneDrop - afterItem:', afterItem?.name, 'afterSort:', afterSort);
      console.log('RQ3 | _onDropZoneDrop - newSort:', newSort);
    }
    
    console.log('RQ3 | _onDropZoneDrop - Updating item', draggedItem.name, 'sort from', draggedItem.sort, 'to', newSort);
    
    try {
      // Build update data object
      const updateData = { sort: newSort };
      
      // If moving to a different section, also update storage location and equipped status
      if (changingSection) {
        console.log('RQ3 | _onDropZoneDrop - Also updating storageLocation and equipped status');
        updateData['system.storageLocation'] = targetStorageLocation;
        updateData['system.equipped'] = targetEquipped;
      }
      
      // If container context is changing, update containerId
      if (changingContainer) {
        console.log('RQ3 | _onDropZoneDrop - Updating containerId from', currentContainerId, 'to', targetContainerId);
        updateData['system.containerId'] = targetContainerId;
      }
      
      // For spells, update spellStorageLocation if moving to a different storage section
      // This is separate from changingSection because spell type (storageLocation) can stay the same
      // while storage section (spellStorageLocation) changes
      if (draggedItem.type === 'spell' && changingSpellStorage) {
        console.log('RQ3 | _onDropZoneDrop - Updating spellStorageLocation from', currentSpellStorage, 'to', targetSpellStorage);
        updateData['system.spellStorageLocation'] = targetSpellStorage;
      }
      
      console.log('RQ3 | _onDropZoneDrop - Update data:', updateData);
      await draggedItem.update(updateData);
      console.log('RQ3 | _onDropZoneDrop - Update successful');
      
      // Verify the update
      const updatedItem = this.actor.items.get(draggedItemId);
      console.log('RQ3 | _onDropZoneDrop - After update, item sort is:', updatedItem?.sort);
      console.log('RQ3 | _onDropZoneDrop - After update, item storageLocation:', updatedItem?.system.storageLocation, 'equipped:', updatedItem?.system.equipped, 'containerId:', updatedItem?.system.containerId);
      
      // Re-render to update drop zones
      this.render(false);
    } catch (error) {
      console.error('RQ3 | _onDropZoneDrop - Error updating item:', error);
    }
  }

  /**
   * Handle equipment slot drag enter
   * @param {DragEvent} event
   * @private
   */
  _onEquipmentSlotDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }

  /**
   * Handle equipment slot drag over
   * @param {DragEvent} event
   * @private
   */
  _onEquipmentSlotDragOver(event) {
    event.preventDefault();
    
    let data = null;
    
    // Try to get data from stored instance first, then from dataTransfer
    if (this._currentDragData) {
      data = this._currentDragData;
      console.log('RQ3 | Using stored drag data:', data);
    } else {
      try {
        const transferData = event.dataTransfer.getData('text/plain');
        if (transferData && transferData.trim()) {
          data = JSON.parse(transferData);
          console.log('RQ3 | Using transfer drag data:', data);
        } else {
          console.log('RQ3 | No drag data available');
          event.currentTarget.classList.add('invalid-drop');
          event.currentTarget.classList.remove('valid-drop');
          return;
        }
      } catch (error) {
        console.error('RQ3 | Error parsing drag data:', error);
        event.currentTarget.classList.add('invalid-drop');
        event.currentTarget.classList.remove('valid-drop');
        return;
      }
    }
    
    if (data && data.type === 'Item' && data.itemType === 'armor' && data.armorLocation) {
      // Get the slot location and check compatibility
      const slotLocation = event.currentTarget.dataset.armorLocation;
      const armorLocation = data.armorLocation;
      
      console.log('RQ3 | Checking compatibility - Armor location:', armorLocation, 'Slot location:', slotLocation);
      
      const isCompatible = this._canEquipArmorInSlot(armorLocation, slotLocation);
      
      console.log('RQ3 | Compatibility result:', isCompatible);
      
      if (isCompatible) {
        event.currentTarget.classList.add('valid-drop');
        event.currentTarget.classList.remove('invalid-drop');
        console.log('RQ3 | Added valid-drop class');
      } else {
        event.currentTarget.classList.add('invalid-drop');
        event.currentTarget.classList.remove('valid-drop');
        console.log('RQ3 | Added invalid-drop class');
      }
    } else {
      event.currentTarget.classList.add('invalid-drop');
      event.currentTarget.classList.remove('valid-drop');
      console.log('RQ3 | Not armor or missing data, added invalid-drop');
    }
  }

  /**
   * Handle equipment slot drag leave
   * @param {DragEvent} event
   * @private
   */
  _onEquipmentSlotDragLeave(event) {
    event.currentTarget.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
  }

  /**
   * Handle dropping items on equipment slots
   * @param {DragEvent} event
   * @private
   */
  async _onEquipmentSlotDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over', 'valid-drop', 'invalid-drop');
    
    try {
      const data = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (data.type !== 'Item' || !data.uuid) return;
      
      const item = await fromUuid(data.uuid);
      if (!item || item.type !== 'armor') {
        ui.notifications.warn('Only armor items can be equipped in armor slots.');
        return;
      }
      
      const location = event.currentTarget.dataset.armorLocation;
      const armorLocation = item.system.armorLocation;
      
      // Check if the armor can be equipped in this slot
      if (!this._canEquipArmorInSlot(armorLocation, location)) {
        ui.notifications.warn(`This armor cannot be equipped in the ${location} slot.`);
        return;
      }
      
      // Check if something is already equipped in this slot
      const currentEquipped = this.actor.system.equippedArmor?.[location];
      if (currentEquipped && currentEquipped !== item.id) {
        const confirmed = await Dialog.confirm({
          title: "Replace Equipped Armor",
          content: `<p>There is already armor equipped in the ${location} slot. Do you want to replace it?</p>`,
          defaultYes: true
        });
        
        if (!confirmed) return;
      }
      
      // Update the equipped armor
      const updateData = {};
      updateData[`system.equippedArmor.${location}`] = item.id;
      
      await this.actor.update(updateData);
      await this._updateArmorProtection();
      this._updateArmorEncumbrance();
      
      ui.notifications.info(`Equipped ${item.name} to ${location}.`);
      
    } catch (error) {
      console.error('Error handling equipment drop:', error);
      ui.notifications.error('Failed to equip armor.');
    }
  }

  /**
   * Handle unequipping armor from equipment tab
   * @param {Event} event
   * @private
   */
  async _onUnequipArmorFromEquipment(event) {
    event.preventDefault();
    const location = event.currentTarget.dataset.location;
    
    if (!location) return;
    
    const currentEquipped = this.actor.system.equippedArmor?.[location];
    if (!currentEquipped) return;
    
    const item = this.actor.items.get(currentEquipped);
    const itemName = item?.name || 'Unknown armor';
    
    // Update the equipped armor
    const updateData = {};
    updateData[`system.equippedArmor.${location}`] = '';
    
    await this.actor.update(updateData);
    await this._updateArmorProtection();
    this._updateArmorEncumbrance();
    
    ui.notifications.info(`Unequipped ${itemName} from ${location}.`);
  }

  /**
   * Update hit location armor protection based on equipped armor
   * Uses current armor points (max - damage) plus temp AP
   * @private
   */
  async _updateArmorProtection() {
    const updateData = {
      'system.hitLocations.head.armor': 0,
      'system.hitLocations.leftArm.armor': 0,
      'system.hitLocations.rightArm.armor': 0,
      'system.hitLocations.chest.armor': 0,
      'system.hitLocations.abdomen.armor': 0,
      'system.hitLocations.leftLeg.armor': 0,
      'system.hitLocations.rightLeg.armor': 0
    };
    
    const equippedArmor = this.actor.system.equippedArmor || {};
    
    // Apply armor points from each equipped piece
    for (const [location, itemId] of Object.entries(equippedArmor)) {
      if (!itemId) continue;
      
      const item = this.actor.items.get(itemId);
      if (!item || item.type !== 'armor') continue;
      
      // Use the new dynamic hit location calculation
      const hitLocations = CONFIG.RQ3.populateArmorHitLocations(
        item.system.armorType, 
        item.system.armorLocation, 
        location
      );
      
      // Apply the calculated armor points, accounting for armor damage
      for (const [hitLocation, maxArmorPoints] of Object.entries(hitLocations)) {
        if (maxArmorPoints > 0) {
          // Get armor damage for this location
          const armorDamage = item.system.armorDamage?.[hitLocation] || 0;
          // Calculate current AP (max - damage, minimum 0)
          const currentAP = Math.max(0, maxArmorPoints - armorDamage);
          
          const currentPath = `system.hitLocations.${hitLocation}.armor`;
          updateData[currentPath] = Math.max(
            updateData[currentPath],
            currentAP
          );
        }
      }
    }
    
    // Add temporary armor points to each location
    const hitLocationKeys = ['head', 'leftArm', 'rightArm', 'chest', 'abdomen', 'leftLeg', 'rightLeg'];
    for (const hitLocation of hitLocationKeys) {
      const tempArmor = this.actor.system.hitLocations?.[hitLocation]?.tempArmor || 0;
      if (tempArmor > 0) {
        const currentPath = `system.hitLocations.${hitLocation}.armor`;
        updateData[currentPath] = (updateData[currentPath] || 0) + tempArmor;
      }
    }
    
    await this.actor.update(updateData);
  }

  /**
   * Handle item control actions.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemControl(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling to draggable parent
    
    const button = event.currentTarget;
    const action = button.dataset.action;
    const itemId = button.dataset.itemId;
    const item = this.actor.items.get(itemId);

    console.log('RQ3 | _onItemControl called with action:', action, 'itemId:', itemId, 'item:', item);

    if (!item) {
      console.warn('RQ3 | Item not found with ID:', itemId);
      return;
    }

    switch (action) {
      case 'edit':
        console.log('RQ3 | Opening item sheet for:', item.name);
        item.sheet.render(true);
        break;
      case 'delete':
        const confirmed = await Dialog.confirm({
          title: game.i18n.localize("RQ3.Buttons.delete"),
          content: `<p>Are you sure you want to delete ${item.name}?</p>`,
          defaultYes: false
        });
        if (confirmed) {
          await item.delete();
          ui.notifications.info(`Deleted ${item.name}`);
        }
        break;
      case 'equip':
        if (item.type === 'armor') {
          ui.notifications.warn('Armor must be equipped by dragging to specific armor slots.');
          return;
        }
        await item.update({ 
          'system.equipped': true,
          'system.storageLocation': 'worn'
        });
        // Recalculate encumbrance after equipping
        this.actor._calculateEncumbrance();
        ui.notifications.info(`Equipped ${item.name}`);
        break;
      case 'unequip':
        if (item.type === 'armor') {
          ui.notifications.warn('Armor must be unequipped from the armor slots.');
          return;
        }
        await item.update({ 
          'system.equipped': false,
          'system.storageLocation': 'carried'
        });
        // Recalculate encumbrance after unequipping
        this.actor._calculateEncumbrance();
        ui.notifications.info(`Unequipped ${item.name}`);
        break;
      default:
        console.warn('RQ3 | Unknown item control action:', action);
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    console.log("RQ3 | _onRoll triggered. this.editMode is:", this.editMode);
    // Prevent rolls if in edit mode
    if (this.editMode) {
      console.log("RQ3 | Roll prevented: Edit mode is active.");
      return;
    }

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType === 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle characteristic x5 rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onCharacteristicRollX5(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const characteristic = element.dataset.characteristic;

    console.log("RQ3 | _onCharacteristicRollX5 triggered. this.editMode is:", this.editMode);
    // Prevent rolls if in edit mode
    if (this.editMode) {
      console.log("RQ3 | Characteristic X5 roll prevented: Edit mode is active.");
      return;
    }
    
    if (characteristic) {
      await this.actor.rollCharacteristicX5(characteristic);
    }
  }

  /**
   * Handle characteristic custom multiplier rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onCharacteristicRollCustom(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Get the button element (might be clicked on the icon inside)
    let element = event.currentTarget;
    if (!element.classList.contains('characteristic-roll-x5')) {
      element = element.closest('.characteristic-roll-x5');
    }
    
    if (!element) {
      console.error("RQ3 | Could not find characteristic-roll-x5 button");
      return;
    }
    
    const characteristic = element.dataset.characteristic;

    console.log("RQ3 | _onCharacteristicRollCustom triggered. this.editMode is:", this.editMode);
    // Prevent rolls if in edit mode
    if (this.editMode) {
      console.log("RQ3 | Characteristic Custom roll prevented: Edit mode is active.");
      return;
    }
    
    if (characteristic) {
      await this.actor.rollCharacteristicCustom(characteristic, element);
    }
  }

  /**
   * Handle characteristic rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onCharacteristicRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const characteristic = element.dataset.characteristic;
    
    console.log("RQ3 | _onCharacteristicRoll triggered. this.editMode is:", this.editMode);
    // Prevent rolls if in edit mode
    if (this.editMode) {
      console.log("RQ3 | Characteristic roll prevented: Edit mode is active.");
      return;
    }
    
    if (characteristic) {
      await this.actor.rollCharacteristic(characteristic);
    }
  }

  /**
   * Handle resetting current values to original values.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onResetCurrentValues(event) {
    event.preventDefault();
    
    const confirmed = await Dialog.confirm({
      title: "Reset Current Values",
      content: "<p>Are you sure you want to reset all current characteristic values to their original values?</p>",
      defaultYes: false
    });
    
    if (confirmed) {
      await this.actor.resetCurrentValues();
    }
  }

  /**
   * Handle preventing dice rolling when pressing Enter in character name input
   * @param {Event} event   The originating keydown event
   * @private
   */
  _onCharacterNameKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  }

  /**
   * Handle preventing dice rolling when pressing Enter in skill value inputs
   * @param {Event} event   The originating keydown event
   * @private
   */
  _onSkillInputKeydown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // NEW: Helper function to update DOM based on edit mode state
  _updateEditModeDOM(isEditMode, isManualToggle = false) {
    // Ensure edit mode is initialized
    if (this.editMode === undefined) {
      this.editMode = false;
    }
    
    const characterSheet = this.element?.[0];
    const toggle = characterSheet?.querySelector('.global-edit-mode-toggle');

    if (!characterSheet || !toggle) {
      console.warn("RQ3 | Could not find character sheet or toggle for DOM update. Retrying in 100ms...");
      // Retry after a short delay to allow DOM to be ready
      setTimeout(() => this._updateEditModeDOM(isEditMode, isManualToggle), 100);
      return;
    }

    if (isManualToggle) {
      console.log("RQ3 | Manual toggle detected, cancelling any pending restoration.");
      this.restorationPending = false; // Cancel any pending restoration
    }

    console.log(`RQ3 | Updating DOM. Current this.editMode: ${this.editMode}, Target DOM state: ${isEditMode}, Manual: ${isManualToggle}`);
    this.editMode = isEditMode; // Update the authoritative state
    toggle.checked = isEditMode;
    if (isEditMode) {
      characterSheet.classList.add('edit-mode');
      characterSheet.classList.add('edit-mode-no-pointer-events'); // Add new class for disabling pointer events
    } else {
      characterSheet.classList.remove('edit-mode');
      characterSheet.classList.remove('edit-mode-no-pointer-events'); // Remove class
    }
    console.log(`RQ3 | DOM updated. New this.editMode: ${this.editMode}, toggle.checked: ${toggle.checked}, classList: ${characterSheet.classList.toString()}`);
  }

  /**
   * Handle global edit mode toggle.
   * @param {Event} event   The originating change event
   * @private
   */
  async _onGlobalEditModeToggle(event) {
    event.preventDefault();
    const newEditModeState = !this.editMode;
    console.log(`RQ3 | Manual toggle initiated. Current this.editMode: ${this.editMode}, Target new state: ${newEditModeState}`);
    
    // Update the edit mode state first
    this.editMode = newEditModeState;
    
    // Re-render the sheet so template conditionals are re-evaluated
    await this.render(true);
    
    // Update DOM classes after render (render will call activateListeners which calls _updateEditModeDOM,
    // but we also need to ensure the toggle checkbox state is correct)
    this._updateEditModeDOM(newEditModeState, true);
  }

  /**
   * Handle dragenter events for species drop zone.
   * @param {Event} event   The originating dragenter event
   * @private
   */
  _onSpeciesDragEnter(event) {
    event.preventDefault();
    
    // Safety check for dataTransfer
    if (!event.dataTransfer) {
      return;
    }
    
    // Check if there are any dragged items/data
    if (!event.dataTransfer.types || event.dataTransfer.types.length === 0) {
      return;
    }
    
    event.dataTransfer.dropEffect = "copy";
    const dropZone = event.currentTarget;
    
    // Only allow drop if no species is currently set
    const currentSpecies = this.actor?.system?.personal?.species;
    if (!currentSpecies) {
      dropZone.classList.add('drag-over');
    }
  }

  /**
   * Handle dragover events for species drop zone.
   * @param {Event} event   The originating dragover event
   * @private
   */
  _onSpeciesDragOver(event) {
    event.preventDefault();
    
    // Safety check for dataTransfer
    if (!event.dataTransfer) {
      return;
    }
    
    // Keep the dropEffect set
    event.dataTransfer.dropEffect = "copy";
  }

  /**
   * Handle dragleave events for species drop zone.
   * @param {Event} event   The originating dragleave event
   * @private
   */
  _onSpeciesDragLeave(event) {
    event.preventDefault();
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drag-over');
  }

  /**
   * Handle drop events for species drop zone.
   * @param {Event} event   The originating drop event
   * @private
   */
  async _onSpeciesDrop(event) {
    event.preventDefault();
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drag-over');

    // Safety check for dataTransfer
    if (!event.dataTransfer) {
      ui.notifications.error("Drag and drop is not supported in this context.");
      return;
    }

    // Check if we have the expected data type
    if (!event.dataTransfer.types.includes('text/plain')) {
      ui.notifications.warn("Invalid item dragged.");
      return;
    }

    // Safety check for actor and system data
    if (!this.actor || !this.actor.system) {
      ui.notifications.error("Character data is not available.");
      return;
    }

    // Ensure personal object exists
    if (!this.actor.system.personal) {
      await this.actor.update({
        'system.personal': {
          age: 21,
          height: '',
          weight: '',
          gender: '',
          species: '',
          reputation: 0
        }
      });
    }

    // Don't allow drop if species is already set
    const currentSpecies = this.actor.system.personal?.species;
    if (currentSpecies) {
      ui.notifications.warn("A species is already set. Delete the current species first to change it.");
      return;
    }

    try {
      const dragData = event.dataTransfer.getData('text/plain');
      if (!dragData) {
        throw new Error("No drag data available");
      }

      const data = JSON.parse(dragData);
      
      // Check if it's a species item
      if (data.type === 'Item') {
        const item = await fromUuid(data.uuid);
        
        if (!item) {
          throw new Error("Could not find item from UUID");
        }
        
        if (item.type === 'species') {
          // Apply modifiers dialog
          const applyModifiers = await Dialog.confirm({
            title: "Apply Species Modifiers",
            content: `<p>Do you want to apply <strong>${item.name}</strong> racial modifiers to characteristics and movement rates?</p><p><em>Note: This should typically only be done during character creation.</em></p>`,
            defaultYes: true
          });
          
          // Update the species field with the species name
          await this.actor.update({
            'system.personal.species': item.name
          });
          
          if (applyModifiers) {
            await this._applySpeciesModifiers(item);
          }
          
          ui.notifications.info(`Applied species: ${item.name}`);
        } else {
          ui.notifications.warn("Only species items can be dropped here.");
        }
      } else {
        console.log("Data type:", data.type, "Expected: Item");
        ui.notifications.warn("Invalid item type dropped.");
      }
    } catch (error) {
      console.error("Error handling species drop:", error);
      ui.notifications.error(`Failed to apply species: ${error.message}`);
    }
  }

  /**
   * Apply species modifiers to the character.
   * @param {Item} speciesItem   The species item to apply
   * @private
   */
  async _applySpeciesModifiers(speciesItem) {
    if (!speciesItem || !speciesItem.system) {
      console.warn("Species item or system data is missing");
      return;
    }

    const updates = {};
    const species = speciesItem.system;
    
    // Safety check for actor data
    if (!this.actor || !this.actor.system || !this.actor.system.characteristics) {
      console.error("Actor characteristics data is not available");
      ui.notifications.error("Cannot apply species modifiers: character data is incomplete.");
      return;
    }
    
    // Apply characteristic modifiers
    if (species.characteristicMods && typeof species.characteristicMods === 'object') {
      for (const [charKey, modifier] of Object.entries(species.characteristicMods)) {
        if (modifier !== 0 && this.actor.system.characteristics[charKey]) {
          const currentValue = this.actor.system.characteristics[charKey]?.value || 10;
          const currentCurrent = this.actor.system.characteristics[charKey]?.current || 10;
          
          // Apply modifier to both value and current
          updates[`system.characteristics.${charKey}.value`] = Math.max(1, currentValue + modifier);
          updates[`system.characteristics.${charKey}.current`] = Math.max(1, currentCurrent + modifier);
          
          console.log(`Applying ${charKey} modifier: ${modifier} (${currentValue} -> ${currentValue + modifier})`);
        }
      }
    }

    // Apply movement rates
    if (species.movement && typeof species.movement === 'object') {
      if (species.movement.walk && typeof species.movement.walk === 'number') {
        updates['system.attributes.movement.walk'] = species.movement.walk;
        console.log(`Setting walk speed: ${species.movement.walk}`);
      }
      if (species.movement.run && typeof species.movement.run === 'number') {
        updates['system.attributes.movement.run'] = species.movement.run;
        console.log(`Setting run speed: ${species.movement.run}`);
      }
    }

    // Apply the updates if any
    if (Object.keys(updates).length > 0) {
      console.log("Applying updates:", updates);
      await this.actor.update(updates);
      ui.notifications.info(`Applied ${speciesItem.name} racial modifiers.`);
    } else {
      console.log("No modifiers to apply for", speciesItem.name);
    }
  }

  /**
   * Handle species delete event.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSpeciesDelete(event) {
    event.preventDefault();
    
    // Safety check for actor
    if (!this.actor || !this.actor.system) {
      console.error("Actor or actor system data is undefined");
      ui.notifications.error("Character data is not available.");
      return;
    }
    
    // Get the current species to determine what modifiers to remove
    const currentSpeciesName = this.actor.system.personal?.species;
    if (!currentSpeciesName) {
      ui.notifications.warn("No species to delete.");
      return;
    }
    
    // Single confirmation dialog that explains what will happen
    const confirmed = await Dialog.confirm({
      title: "Delete Species",
      content: `<p>Are you sure you want to delete the species <strong>${currentSpeciesName}</strong>?</p><p><em>This will remove the species and reverse any applied racial modifiers to characteristics and movement rates.</em></p>`,
      defaultYes: false
    });
    
    if (confirmed) {
      try {
        // Remove modifiers (always done when deleting species)
        await this._removeSpeciesModifiers(currentSpeciesName);
        
        // Remove any species items from the actor's inventory
        const speciesItems = this.actor.items.filter(item => 
          item.type === "species" && item.name === currentSpeciesName
        );
        
        if (speciesItems.length > 0) {
          const itemIds = speciesItems.map(item => item.id);
          await this.actor.deleteEmbeddedDocuments("Item", itemIds);
          console.log(`Removed ${speciesItems.length} species item(s) from inventory`);
        }
        
        // Remove the species name
        await this.actor.update({
          'system.personal.species': null
        });
        
        ui.notifications.info(`Species ${currentSpeciesName} deleted.`);
      } catch (error) {
        console.error("Error deleting species:", error);
        ui.notifications.error(`Failed to delete species: ${error.message}`);
      }
    }
  }

  /**
   * Remove species modifiers from the character.
   * @param {string} speciesName   The name of the species to remove modifiers for
   * @private
   */
  async _removeSpeciesModifiers(speciesName) {
    try {
      // Find the species in the compendium to get its modifiers
      const speciesCompendium = game.packs.get("runequest3.species");
      if (!speciesCompendium) {
        ui.notifications.warn("Species compendium not found. Cannot remove modifiers automatically.");
        return;
      }

      const speciesItems = await speciesCompendium.getDocuments();
      const speciesItem = speciesItems.find(item => item.name === speciesName);
      
      if (!speciesItem) {
        ui.notifications.warn(`Species ${speciesName} not found in compendium. Cannot remove modifiers automatically.`);
        return;
      }

      const updates = {};
      const species = speciesItem.system;
      
      // Safety check for actor data
      if (!this.actor || !this.actor.system || !this.actor.system.characteristics) {
        console.error("Actor characteristics data is not available");
        ui.notifications.error("Cannot remove species modifiers: character data is incomplete.");
        return;
      }
      
      // Remove characteristic modifiers (subtract what was added)
      if (species.characteristicMods && typeof species.characteristicMods === 'object') {
        for (const [charKey, modifier] of Object.entries(species.characteristicMods)) {
          if (modifier !== 0 && this.actor.system.characteristics[charKey]) {
            const currentValue = this.actor.system.characteristics[charKey]?.value || 10;
            const currentCurrent = this.actor.system.characteristics[charKey]?.current || 10;
            
            // Remove modifier from both value and current (subtract the modifier)
            updates[`system.characteristics.${charKey}.value`] = Math.max(1, currentValue - modifier);
            updates[`system.characteristics.${charKey}.current`] = Math.max(1, currentCurrent - modifier);
            
            console.log(`Removing ${charKey} modifier: ${modifier} (${currentValue} -> ${currentValue - modifier})`);
          }
        }
      }

      // Reset movement to human defaults (8 walk, 24 run)
      // Note: This assumes human is the "base" - you might want to make this configurable
      updates['system.attributes.movement.walk'] = 8;
      updates['system.attributes.movement.run'] = 24;
      console.log("Resetting movement to human defaults: walk 8, run 24");

      // Apply the updates if any
      if (Object.keys(updates).length > 0) {
        console.log("Removing species modifiers with updates:", updates);
        await this.actor.update(updates);
        ui.notifications.info(`Removed ${speciesName} racial modifiers.`);
      } else {
        console.log("No modifiers to remove for", speciesName);
      }
      
    } catch (error) {
      console.error("Error removing species modifiers:", error);
      ui.notifications.error(`Failed to remove species modifiers: ${error.message}`);
    }
  }

  /**
   * Handle species empty zone click event.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSpeciesEmptyClick(event) {
    event.preventDefault();
    
    // Use the generic compendium opener
    await this._openCompendium('species');
  }

  /**
   * Handle compendium opener click to show selection menu.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onCompendiumOpenerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Create overlay with compendium selection menu
    const overlay = document.createElement('div');
    overlay.className = 'compendium-selection-overlay';
    
    overlay.innerHTML = `
      <div class="compendium-selection-menu">
        <h3>Browse Compendiums</h3>
        <div class="compendium-options">
          <div class="compendium-option" data-compendium="armour">
            <i class="fas fa-shield-alt"></i>
            <div class="compendium-option-text">
              <div class="compendium-option-title">Armour</div>
              <div class="compendium-option-subtitle">Browse armor pieces</div>
            </div>
          </div>
          <div class="compendium-option" data-compendium="weapons">
            <i class="fas fa-sword"></i>
            <div class="compendium-option-text">
              <div class="compendium-option-title">Weapons</div>
              <div class="compendium-option-subtitle">Browse weapons</div>
            </div>
          </div>
          <div class="compendium-option" data-compendium="equipment">
            <i class="fas fa-shopping-bag"></i>
            <div class="compendium-option-text">
              <div class="compendium-option-title">Equipment</div>
              <div class="compendium-option-subtitle">Browse general equipment</div>
            </div>
          </div>
        </div>
        <div class="compendium-close">
          <button type="button">Cancel</button>
        </div>
      </div>
    `;
    
    // Add to document body
    document.body.appendChild(overlay);
    
    // Handle compendium option clicks
    overlay.querySelectorAll('.compendium-option').forEach(option => {
      option.addEventListener('click', async (e) => {
        const compendiumName = e.currentTarget.dataset.compendium;
        await this._openCompendium(compendiumName);
        overlay.remove();
      });
    });
    
    // Handle close button and overlay background click
    const closeButton = overlay.querySelector('.compendium-close button');
    closeButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Open a specific compendium - unified method for all compendium opening.
   * @param {String} compendiumName   The name of the compendium to open (e.g., 'species', 'armour', 'weapons', 'equipment')
   * @private
   */
  async _openCompendium(compendiumName) {
    // First try to find the system compendium by ID
    let compendium = game.packs.get(`runequest3.${compendiumName}`);
    
    if (!compendium) {
      // Fallback: look for compendium by display label
      const labelMap = {
        'species': 'Species',
        'armour': 'Armour',
        'weapons': 'Weapons',
        'equipment': 'Equipment'
      };
      const label = labelMap[compendiumName] || compendiumName;
      compendium = game.packs.find(p => p.metadata.label === label);
    }
    
    if (!compendium) {
      // Alternative labels (e.g., "RQ3 Species")
      const altLabelMap = {
        'species': 'RQ3 Species'
      };
      if (altLabelMap[compendiumName]) {
        compendium = game.packs.find(p => p.metadata.label === altLabelMap[compendiumName]);
      }
    }
    
    if (!compendium) {
      // Final fallback: look for any compendium with matching name
      compendium = game.packs.find(p => 
        p.metadata.type === "Item" && 
        p.metadata.label.toLowerCase().includes(compendiumName.toLowerCase())
      );
    }
    
    if (compendium) {
      // Store the compendium ID for item creation dialogs
      if (game.rq3) {
        game.rq3.lastOpenedCompendium = compendium.collection;
        console.log("RQ3 | Stored compendium ID:", compendium.collection);
      }
      
      // Open the compendium
      compendium.render(true);
      
      // Customized message based on compendium type
      const messages = {
        'species': 'Opening species compendium. Drag a species onto the species field.',
        'armour': `Opening ${compendium.metadata.label} compendium. Drag items onto your character sheet.`,
        'weapons': `Opening ${compendium.metadata.label} compendium. Drag items onto your character sheet.`,
        'equipment': `Opening ${compendium.metadata.label} compendium. Drag items onto your character sheet.`
      };
      
      ui.notifications.info(messages[compendiumName] || `Opening ${compendium.metadata.label} compendium. Drag items onto your character sheet.`);
      console.log("RQ3 | Opened compendium:", compendium.metadata.label);
    } else {
      ui.notifications.warn(`No ${compendiumName} compendium found. Please check your system compendiums.`);
      console.log("RQ3 | Available compendiums:", game.packs.map(p => ({ id: p.collection, label: p.metadata.label, type: p.metadata.type })));
    }
  }

  /**
   * Handle adding a custom skill.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onAddCustomSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    
    if (!category) {
      ui.notifications.error("No skill category specified.");
      return;
    }

    // Dialog to get skill name and base value
    const content = `
      <form>
        <div class="form-group">
          <label>Skill Name:</label>
          <input type="text" name="skillName" placeholder="Enter skill name" required />
        </div>
        <div class="form-group">
          <label>Base Value (%):</label>
          <input type="number" name="baseValue" value="0" min="0" max="100" required />
        </div>
      </form>
    `;

    const result = await Dialog.wait({
      title: `Add Custom ${category.charAt(0).toUpperCase() + category.slice(1)} Skill`,
      content: content,
      buttons: {
        add: {
          icon: '<i class="fas fa-plus"></i>',
          label: "Add Skill",
          callback: (html) => {
            const form = html[0].querySelector("form");
            const formData = new FormData(form);
            return {
              name: formData.get("skillName").trim(),
              baseValue: parseInt(formData.get("baseValue"))
            };
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: "add"
    });

    if (!result || !result.name) {
      return;
    }

    // Validate skill name
    if (result.name.length < 1) {
      ui.notifications.error("Skill name cannot be empty.");
      return;
    }

    // Generate a unique key for the custom skill
    const skillKey = result.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const uniqueKey = `custom_${skillKey}_${Date.now()}`;

    // Initialize custom skills structure if it doesn't exist
    const currentCustomSkills = this.actor.system.customSkills || {};
    if (!currentCustomSkills[category]) {
      currentCustomSkills[category] = {};
    }

    // Check if skill name already exists in this category
    const existingSkill = Object.values(currentCustomSkills[category]).find(skill => 
      skill.name.toLowerCase() === result.name.toLowerCase()
    );
    
    if (existingSkill) {
      ui.notifications.warn(`A skill named "${result.name}" already exists in the ${category} category.`);
      return;
    }

    // Add the new custom skill
    const updatePath = `system.customSkills.${category}.${uniqueKey}`;
    
    // Save current edit mode state
    const wasInEditMode = this.editMode;
    this.restorationPending = false; // Reset flag
    
    await this.actor.update({
      [updatePath]: {
        name: result.name,
        baseValue: result.baseValue,
        investedValue: 0
      }
    });

    // If it was in edit mode, schedule a restoration
    if (wasInEditMode) {
      console.log("RQ3 | Add Skill: Scheduling edit mode restoration.");
      this.restorationPending = true;
      setTimeout(() => {
        if (this.restorationPending) {
          console.log("RQ3 | Add Skill: Restoration timeout executing. this.editMode is currently " + this.editMode);
          this._updateEditModeDOM(true, false); // Restore to ON, not a manual toggle
        } else {
          console.log("RQ3 | Add Skill: Restoration cancelled by a manual toggle.");
        }
        this.restorationPending = false;
      }, 75); // Slightly longer timeout to allow manual toggle to register first
    }

    ui.notifications.info(`Added custom skill "${result.name}" to ${category} category.`);
  }

  /**
   * Handle deleting a custom skill.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onDeleteCustomSkill(event) {
    event.preventDefault();
    const category = event.currentTarget.dataset.category;
    const skillKey = event.currentTarget.dataset.skillKey;
    
    if (!category || !skillKey) {
      ui.notifications.error("Missing skill information for deletion.");
      return;
    }

    // Get the skill name for confirmation
    const customSkills = this.actor.system.customSkills || {};
    const skill = customSkills[category]?.[skillKey];
    
    if (!skill) {
      ui.notifications.error("Custom skill not found.");
      return;
    }

    const confirmed = await Dialog.confirm({
      title: "Delete Custom Skill",
      content: `<p>Are you sure you want to delete the custom skill <strong>"${skill.name}"</strong>?</p>`,
      defaultYes: false
    });

    if (confirmed) {
      // Save current edit mode state
      const wasInEditMode = this.editMode;
      this.restorationPending = false; // Reset flag
      
      // Remove the custom skill
      const updatePath = `system.customSkills.${category}.-=${skillKey}`;
      await this.actor.update({
        [updatePath]: null
      });

      // If it was in edit mode, schedule a restoration
      if (wasInEditMode) {
        console.log("RQ3 | Delete Skill: Scheduling edit mode restoration.");
        this.restorationPending = true;
        setTimeout(() => {
          if (this.restorationPending) {
            console.log("RQ3 | Delete Skill: Restoration timeout executing. this.editMode is currently " + this.editMode);
            this._updateEditModeDOM(true, false); // Restore to ON, not a manual toggle
          } else {
            console.log("RQ3 | Delete Skill: Restoration cancelled by a manual toggle.");
          }
          this.restorationPending = false;
        }, 75); // Slightly longer timeout to allow manual toggle to register first
      }

      ui.notifications.info(`Deleted custom skill "${skill.name}".`);
    }
  }

  /**
   * Check if armor can be equipped in a specific slot
   * @param {string} armorLocation  The armor's intended location
   * @param {string} slotLocation   The equipment slot
   * @returns {boolean}
   * @private
   */
  _canEquipArmorInSlot(armorLocation, slotLocation) {
    const compatibleSlots = {
      // New simplified system
      'head': ['head'],
      'chest': ['chest'],
      'arms': ['leftArm', 'rightArm'],
      'abdomen': ['abdomen'],
      'legs': ['leftLeg', 'rightLeg'],
      
      // Legacy support for existing armor items
      'head-only': ['head'],
      'torso-arms': ['chest', 'abdomen', 'leftArm', 'rightArm'],
      'torso-only': ['chest', 'abdomen'],
      'chest-only': ['chest'],
      'abdomen-only': ['abdomen'],
      'arms-only': ['leftArm', 'rightArm'],
      'left-arm-only': ['leftArm'],
      'right-arm-only': ['rightArm'],
      'legs-only': ['leftLeg', 'rightLeg'],
      'left-leg-only': ['leftLeg'],
      'right-leg-only': ['rightLeg'],
      'full-suit': ['head', 'leftArm', 'rightArm', 'chest', 'abdomen', 'leftLeg', 'rightLeg'],
      'custom': ['head', 'leftArm', 'rightArm', 'chest', 'abdomen', 'leftLeg', 'rightLeg']
    };
    
    return compatibleSlots[armorLocation]?.includes(slotLocation) || false;
  }
  
  /**
   * Update character encumbrance based on all equipment
   * @private
   */
  _updateArmorEncumbrance() {
    // This will now trigger the comprehensive encumbrance calculation
    // The actor's _calculateEncumbrance method handles all the logic
    this.actor._calculateEncumbrance();
  }

  /**
   * Handle drag over carried equipment area
   * @param {DragEvent} event
   * @private
   */
  _onCarriedAreaDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
  }

  /**
   * Handle drag leave carried equipment area
   * @param {DragEvent} event
   * @private
   */
  _onCarriedAreaDragLeave(event) {
    // Only remove highlight if leaving the actual container, not child elements
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove('drag-over');
    }
  }

  /**
   * Handle drag enter on container item
   * @param {DragEvent} event
   * @private
   */
  _onContainerDragEnter(event) {
    // Only show feedback if dragging an item (not a container into itself)
    const dragData = this._currentDragData;
    if (!dragData || dragData.type !== 'Item') return;
    
    const containerId = event.currentTarget.dataset.itemId;
    const draggedItemId = dragData.itemId;
    
    // Don't show feedback if dragging container into itself
    if (containerId === draggedItemId) return;
    
    // Check if dragged item is a container - prevent dropping containers into containers
    const draggedItem = this.actor.items.get(draggedItemId);
    if (draggedItem && draggedItem.type === 'equipment' && draggedItem.system.equipmentType === 'container') {
      return; // Don't allow containers to be dropped into containers
    }
    
    event.currentTarget.classList.add('drag-over');
  }

  /**
   * Handle drag over on container item
   * @param {DragEvent} event
   * @private
   */
  _onContainerDragOver(event) {
    const dragData = this._currentDragData;
    if (!dragData || dragData.type !== 'Item') return;
    
    const containerId = event.currentTarget.dataset.itemId;
    const draggedItemId = dragData.itemId;
    
    // Don't allow dropping on self
    if (containerId === draggedItemId) return;
    
    // Check if dragged item is a container
    const draggedItem = this.actor.items.get(draggedItemId);
    if (draggedItem && draggedItem.type === 'equipment' && draggedItem.system.equipmentType === 'container') {
      return; // Don't allow containers to be dropped into containers
    }
    
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('drag-over');
  }

  /**
   * Handle drag leave on container item
   * @param {DragEvent} event
   * @private
   */
  _onContainerDragLeave(event) {
    // Only remove highlight if leaving the actual container, not child elements
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove('drag-over');
    }
  }

  /**
   * Handle drop on container item
   * @param {DragEvent} event
   * @private
   */
  async _onContainerDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('drag-over');
    
    try {
      const dragData = this._currentDragData || JSON.parse(event.dataTransfer.getData('text/plain'));
      if (!dragData || dragData.type !== 'Item') return;
      
      const containerId = event.currentTarget.dataset.itemId;
      const draggedItemId = dragData.itemId;
      
      // Don't allow dropping on self
      if (containerId === draggedItemId) {
        console.log('RQ3 | _onContainerDrop - Cannot drop container into itself');
        return;
      }
      
      const draggedItem = this.actor.items.get(draggedItemId);
      const containerItem = this.actor.items.get(containerId);
      
      if (!draggedItem || !containerItem) {
        console.error('RQ3 | _onContainerDrop - Item or container not found');
        return;
      }
      
      // Verify container is actually a container
      if (containerItem.type !== 'equipment' || containerItem.system.equipmentType !== 'container') {
        console.error('RQ3 | _onContainerDrop - Target is not a container');
        return;
      }
      
      // Prevent dropping containers into containers
      if (draggedItem.type === 'equipment' && draggedItem.system.equipmentType === 'container') {
        ui.notifications.warn('Cannot place containers inside other containers');
        return;
      }
      
      // Prevent circular references - check if container is inside the dragged item
      let currentContainerId = draggedItem.system.containerId;
      while (currentContainerId) {
        if (currentContainerId === draggedItemId) {
          ui.notifications.warn('Cannot create circular container references');
          return;
        }
        const currentContainer = this.actor.items.get(currentContainerId);
        if (!currentContainer) break;
        currentContainerId = currentContainer.system.containerId;
      }
      
      // Update the item's containerId
      await draggedItem.update({
        'system.containerId': containerId
      });
      
      // Ensure container is expanded so the item is visible
      const containerStates = this.actor.system.containerStates || {};
      if (containerStates[containerId] === false) {
        // Container is collapsed, expand it
        const newContainerStates = { ...containerStates };
        newContainerStates[containerId] = true;
        await this.actor.update({
          'system.containerStates': newContainerStates
        });
      }
      
      ui.notifications.info(`Placed ${draggedItem.name} in ${containerItem.name}`);
      
      // Recalculate encumbrance after changes
      this.actor._calculateEncumbrance();
      
    } catch (error) {
      console.error('RQ3 | Error in container drop:', error);
      ui.notifications.error('Failed to place item in container');
    }
  }

  /**
   * Handle container toggle button click
   * @param {Event} event
   * @private
   */
  async _onContainerToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const containerId = button.dataset.containerId;
    
    if (!containerId) {
      console.warn('RQ3 | _onContainerToggle - No container ID found');
      return;
    }
    
    const containerStates = this.actor.system.containerStates || {};
    const currentState = containerStates[containerId];
    
    // Toggle the state: if undefined or true, set to false (collapsed)
    // If false, set to true (expanded)
    const newState = currentState === false ? true : false;
    const newContainerStates = { ...containerStates };
    newContainerStates[containerId] = newState;
    
    await this.actor.update({
      'system.containerStates': newContainerStates
    });
    
    console.log(`RQ3 | _onContainerToggle - Container ${containerId} ${newState ? 'expanded' : 'collapsed'}`);
  }

  /**
   * Handle magic section visibility toggle button click
   * @param {Event} event
   * @private
   */
  async _onMagicSectionVisibilityToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const magicType = button.dataset.magicType; // 'spirit', 'divine', or 'sorcery'
    
    if (!magicType) {
      console.warn('RQ3 | _onMagicSectionVisibilityToggle - No magic type found');
      return;
    }
    
    const magicVisibility = this.actor.system.magicVisibility || {};
    const currentState = magicVisibility[magicType];
    
    // Check if trying to hide (current state is undefined or true)
    const tryingToHide = currentState !== false;
    
    if (tryingToHide) {
      // Check if there are any spells in this section
      const spells = this.actor.items.filter(item => {
        if (item.type !== 'spell') return false;
        return item.system.spellType === magicType;
      });
      
      if (spells.length > 0) {
        ui.notifications.warn(`Cannot hide ${magicType} section: it contains ${spells.length} spell(s). Remove all spells first.`);
        return;
      }
    }
    
    // Toggle the state: if undefined or true, set to false (hidden)
    // If false, set to true (visible)
    const newState = currentState === false ? true : false;
    const newMagicVisibility = { ...magicVisibility };
    newMagicVisibility[magicType] = newState;
    
    // Update without triggering a render
    await this.actor.update({
      'system.magicVisibility': newMagicVisibility
    }, { render: false });
    
    console.log(`RQ3 | _onMagicSectionVisibilityToggle - ${magicType} section ${newState ? 'visible' : 'hidden'}, saved state:`, newMagicVisibility);
    
    // Update the icon immediately
    const icon = button.querySelector('i');
    if (icon) {
      icon.className = newState ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
  }

  /**
   * Override the default _onDrop to handle cross-actor item transfers
   * This ensures items are moved (not copied) when dragged between actors
   * @param {DragEvent} event
   * @param {Object} data
   * @private
   */
  async _onDrop(event, data) {
    // Parse data from event if not provided
    if (!data && event.dataTransfer) {
      try {
        const transferData = event.dataTransfer.getData('text/plain');
        if (transferData) {
          data = JSON.parse(transferData);
        }
      } catch (error) {
        console.error('RQ3 | Error parsing drag data in _onDrop:', error);
      }
    }
    
    // Check if this is an item drop from another actor
    if (data && data.type === 'Item' && data.uuid) {
      try {
        const item = await fromUuid(data.uuid);
        
        // If the item belongs to a different actor, move it instead of copying
        if (item && item.parent && item.parent.id !== this.actor.id) {
          console.log(`RQ3 | Moving item ${item.name} from ${item.parent.name} to ${this.actor.name}`);
          
          // Create the item on the target actor
          const itemData = item.toObject();
          await this.actor.createEmbeddedDocuments('Item', [itemData]);
          
          // Delete the item from the source actor
          await item.delete();
          
          ui.notifications.info(`Moved ${item.name} to ${this.actor.name}`);
          return false; // Prevent default behavior
        }
      } catch (error) {
        console.error('RQ3 | Error handling cross-actor item drop:', error);
        ui.notifications.error('Failed to move item between actors.');
      }
    }
    
    // For all other cases, use the default behavior
    return super._onDrop(event, data);
  }

  /**
   * Handle drop on carried equipment area (for unequipping and storage location changes)
   * @param {DragEvent} event
   * @private
   */
  async _onCarriedAreaDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    try {
      const dragData = JSON.parse(event.dataTransfer.getData('text/plain'));
      if (dragData.type !== 'Item') return;
      
      const item = await fromUuid(dragData.uuid);
      if (!item || item.parent !== this.actor) return;
      
      // Determine the target storage location from the drop zone
      let targetStorageLocation = 'carried'; // default
      let shouldEquip = false;
      
      // Check if dropped in bag area
      if (event.currentTarget.classList.contains('empty-bag-drop-zone') || 
          event.currentTarget.classList.contains('bag-items-list') ||
          event.currentTarget.classList.contains('bag-equipment') ||
          event.currentTarget.dataset.storageLocation === 'bag') {
        targetStorageLocation = 'bag';
      } 
      // Check if dropped in worn area
      else if (event.currentTarget.classList.contains('empty-worn-drop-zone') || 
               event.currentTarget.classList.contains('worn-items-list') ||
               event.currentTarget.classList.contains('worn-equipment') ||
               event.currentTarget.dataset.storageLocation === 'worn') {
        targetStorageLocation = 'carried'; // Worn items are stored in carried but equipped
        shouldEquip = true;
      }
      // Check if dropped in carried area
      else if (event.currentTarget.classList.contains('empty-carried-drop-zone') || 
               event.currentTarget.classList.contains('carried-items-list') ||
               event.currentTarget.classList.contains('carried-equipment') ||
               event.currentTarget.dataset.storageLocation === 'carried') {
        targetStorageLocation = 'carried';
      }
      
      if (item.type === 'armor') {
        // Find which armor slot this item is equipped in and unequip it
        const equippedArmor = this.actor.system.equippedArmor;
        let slotToUnequip = null;

        Object.entries(equippedArmor).forEach(([slot, itemId]) => {
          if (itemId === item.id) {
            slotToUnequip = slot;
          }
        });

        if (slotToUnequip) {
          await this._unequipArmorFromSlot(slotToUnequip);
          ui.notifications.info(`Unequipped ${item.name} from ${slotToUnequip}`);
        }

        // Update storage location for unequipped armor and clear containerId if it was in a container
        await item.update({ 
          'system.storageLocation': targetStorageLocation,
          'system.containerId': null // Remove from container when moved to general area
        });
        
        if (shouldEquip) {
          ui.notifications.warn(`${item.name} moved to worn area, but armor must be equipped in specific slots on the equipment tab.`);
        } else {
          ui.notifications.info(`Moved ${item.name} to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
        }
      } else if (item.type === 'weapon' || (item.type === 'armor' && item.system.armorType === 'shield') || (item.type === 'equipment' && item.system.equipmentType === 'tool')) {
        // Handle weapons, shields, and tools (which can be equipped in hand slots)
        const equippedWeapons = this.actor.system.equippedWeapons;
        let handSlotToUnequip = null;

        Object.entries(equippedWeapons).forEach(([slot, itemId]) => {
          if (itemId === item.id) {
            handSlotToUnequip = slot;
          }
        });

        if (handSlotToUnequip) {
          // Unequip from hand slot
          const updateData = {};
          updateData[`system.equippedWeapons.${handSlotToUnequip}`] = '';
          await this.actor.update(updateData);
          ui.notifications.info(`Unequipped ${item.name} from ${handSlotToUnequip}`);
        }

        // Update storage location and equip status, and clear containerId if it was in a container
        const updateData = { 
          'system.storageLocation': targetStorageLocation,
          'system.equipped': shouldEquip, // Always set equipped status based on target area
          'system.containerId': null // Remove from container when moved to general area
        };
        await item.update(updateData);
        
        if (shouldEquip) {
          if (item.type === 'weapon') {
            ui.notifications.info(`${item.name} moved to worn area. Equip in hand slots for use in combat.`);
          } else {
            ui.notifications.info(`Equipped ${item.name} (worn)`);
          }
        } else {
          ui.notifications.info(`Moved ${item.name} to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
        }
      } else {
        // For other items, update equipped status and storage location
        const wasEquipped = item.system.equipped;
        const currentStorageLocation = item.system.storageLocation || 'carried';

        // Always update storage location and equipped status together, and clear containerId if it was in a container
        await item.update({
          'system.equipped': shouldEquip,
          'system.storageLocation': targetStorageLocation,
          'system.containerId': null // Remove from container when moved to general area
        });
        
        // Provide appropriate user feedback
        if (shouldEquip) {
          ui.notifications.info(`Equipped ${item.name} (worn)`);
        } else if (wasEquipped) {
          ui.notifications.info(`Unequipped ${item.name} and moved to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
        } else if (currentStorageLocation !== targetStorageLocation) {
          ui.notifications.info(`Moved ${item.name} to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
        }
      }
      
      // Recalculate encumbrance after any changes
      this.actor._calculateEncumbrance();
      
    } catch (error) {
      console.error('RQ3 | Error in carried area drop:', error);
    }
  }

  /**
   * Unequip armor from a specific slot
   * @param {string} location - The armor slot location
   * @private
   */
  async _unequipArmorFromSlot(location) {
    const currentEquipped = this.actor.system.equippedArmor?.[location];
    if (!currentEquipped) return;
    
    const item = this.actor.items.get(currentEquipped);
    const itemName = item?.name || 'Unknown armor';
    
    // Update the equipped armor
    const updateData = {};
    updateData[`system.equippedArmor.${location}`] = '';
    
    await this.actor.update(updateData);
    await this._updateArmorProtection();
    this._updateArmorEncumbrance();
    
    console.log(`RQ3 | Unequipped ${itemName} from ${location}`);
  }

  /**
   * Handle quantity up button clicks
   * @param {Event} event   The originating click event
   * @private
   */
  async _onQuantityUp(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    const currentQuantity = item.system.quantity || 0;
    const newQuantity = currentQuantity + 1;
    
    await item.update({ 'system.quantity': newQuantity });
    
    // Update the displayed values immediately
    this._updateItemDisplayValues(button, item, newQuantity);
    
    // Recalculate encumbrance
    this.actor._calculateEncumbrance();
  }

  /**
   * Handle quantity down button clicks
   * @param {Event} event   The originating click event
   * @private
   */
  async _onQuantityDown(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const itemId = button.dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    const currentQuantity = item.system.quantity || 1;
    const newQuantity = Math.max(1, currentQuantity - 1); // Don't go below 1
    
    await item.update({ 'system.quantity': newQuantity });
    
    // Update the displayed values immediately
    this._updateItemDisplayValues(button, item, newQuantity);
    
    // Recalculate encumbrance
    this.actor._calculateEncumbrance();
  }

  /**
   * Update item display values after quantity change
   * @param {HTMLElement} button The button that was clicked
   * @param {Object} item The item being updated
   * @param {number} newQuantity The new quantity value
   * @private
   */
  _updateItemDisplayValues(button, item, newQuantity) {
    const itemRow = button.closest('.equipment-item-row');
    if (!itemRow) return;
    
    // Update quantity display
    const quantityDisplay = itemRow.querySelector('.item-quantity-display');
    if (quantityDisplay && !quantityDisplay.classList.contains('armor-ap')) {
      quantityDisplay.textContent = newQuantity;
    }
    
    // Update encumbrance display
    const encumbranceDisplay = itemRow.querySelector('.item-encumbrance');
    if (encumbranceDisplay) {
      const baseWeight = parseFloat(encumbranceDisplay.dataset.baseWeight) || 0;
      const multiplier = parseFloat(encumbranceDisplay.dataset.multiplier) || 1;
      const newEncumbrance = (baseWeight * newQuantity * multiplier);
      encumbranceDisplay.textContent = `E: ${(Math.round(newEncumbrance * 100) / 100).toFixed(2)}`;
    }
    
    // Update value display
    const valueDisplay = itemRow.querySelector('.item-value');
    if (valueDisplay) {
      const basePrice = parseFloat(valueDisplay.dataset.basePrice) || 0;
      const newValue = (basePrice * newQuantity);
      valueDisplay.textContent = `V: ${(Math.round(newValue * 100) / 100).toFixed(2)}L`;
    }
  }

  /**
   * Handle weapon slot drag enter
   * @param {DragEvent} event
   * @private
   */
  _onWeaponSlotDragEnter(event) {
    event.preventDefault();
    console.log('RQ3 | _onWeaponSlotDragEnter - Starting, _currentDragData:', this._currentDragData);
    console.log('RQ3 | _onWeaponSlotDragEnter - event.dataTransfer:', event.dataTransfer);
    console.log('RQ3 | _onWeaponSlotDragEnter - event.dataTransfer.types:', event.dataTransfer?.types);
    event.currentTarget.style.borderColor = '#007bff';
    event.currentTarget.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
  }

  /**
   * Handle weapon slot drag over
   * @param {DragEvent} event
   * @private
   */
  _onWeaponSlotDragOver(event) {
    event.preventDefault();
    
    console.log('RQ3 | _onWeaponSlotDragOver - Starting');
    console.log('RQ3 | _onWeaponSlotDragOver - this._currentDragData:', this._currentDragData);
    console.log('RQ3 | _onWeaponSlotDragOver - event.dataTransfer:', event.dataTransfer);
    console.log('RQ3 | _onWeaponSlotDragOver - event.dataTransfer.types:', event.dataTransfer?.types);
    
    let data = null;
    
    // Try to get data from stored instance first, then from dataTransfer
    if (this._currentDragData) {
      data = this._currentDragData;
      console.log('RQ3 | _onWeaponSlotDragOver - Using stored drag data:', data);
    } else {
      console.log('RQ3 | _onWeaponSlotDragOver - No stored drag data, trying dataTransfer');
      try {
        const transferData = event.dataTransfer.getData('text/plain');
        console.log('RQ3 | _onWeaponSlotDragOver - Raw transfer data:', transferData);
        console.log('RQ3 | _onWeaponSlotDragOver - Transfer data length:', transferData?.length);
        console.log('RQ3 | _onWeaponSlotDragOver - Transfer data type:', typeof transferData);
        
        if (transferData && transferData.trim()) {
          data = JSON.parse(transferData);
          console.log('RQ3 | _onWeaponSlotDragOver - Using transfer drag data:', data);
        } else {
          console.log('RQ3 | _onWeaponSlotDragOver - No drag data available - allowing drop anyway');
          // Show as valid drop
          event.currentTarget.style.borderColor = '#28a745';
          event.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
          return;
        }
      } catch (error) {
        console.error('RQ3 | _onWeaponSlotDragOver - Error parsing drag data:', error);
        // Show as valid drop
        event.currentTarget.style.borderColor = '#28a745';
        event.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
        return;
      }
    }
    
    // Check if this is a valid item for weapon slots (weapons, shields, tools)
    const isValidForWeaponSlot = data && data.type === 'Item' && (
      data.itemType === 'weapon' ||
      (data.itemType === 'armor' && data.armorType === 'shield') ||
      (data.itemType === 'equipment' && data.equipmentType === 'tool')
    );
    
    if (isValidForWeaponSlot) {
      event.currentTarget.style.borderColor = '#28a745';
      event.currentTarget.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
      console.log('RQ3 | Added valid-drop styling for weapon slot');
    } else {
      event.currentTarget.style.borderColor = '#dc3545';
      event.currentTarget.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
      console.log('RQ3 | Not weapon/shield/tool or missing data, added invalid-drop styling');
    }
  }

  /**
   * Handle weapon slot drag leave
   * @param {DragEvent} event
   * @private
   */
  _onWeaponSlotDragLeave(event) {
    // Reset to default styling
    event.currentTarget.style.borderColor = '#ccc';
    event.currentTarget.style.backgroundColor = 'transparent';
  }

  /**
   * Handle dropping items on weapon slots
   * @param {DragEvent} event
   * @private
   */
  async _onWeaponSlotDrop(event) {
    event.preventDefault();
    // Reset styling
    event.currentTarget.style.borderColor = '#ccc';
    event.currentTarget.style.backgroundColor = 'transparent';
    
    console.log('RQ3 | _onWeaponSlotDrop - Starting');
    console.log('RQ3 | _onWeaponSlotDrop - this._currentDragData:', this._currentDragData);
    console.log('RQ3 | _onWeaponSlotDrop - event.dataTransfer:', event.dataTransfer);
    console.log('RQ3 | _onWeaponSlotDrop - event.dataTransfer.types:', event.dataTransfer?.types);
    
    try {
      let data = null;
      
      // Try multiple ways to get the drag data
      if (this._currentDragData) {
        data = this._currentDragData;
        console.log('RQ3 | _onWeaponSlotDrop - Using stored drag data:', data);
      } else {
        console.log('RQ3 | _onWeaponSlotDrop - No stored drag data, trying dataTransfer');
        const transferData = event.dataTransfer.getData('text/plain');
        console.log('RQ3 | _onWeaponSlotDrop - Raw transfer data:', transferData);
        console.log('RQ3 | _onWeaponSlotDrop - Transfer data length:', transferData?.length);
        console.log('RQ3 | _onWeaponSlotDrop - Transfer data type:', typeof transferData);
        
        if (transferData && transferData.trim()) {
          data = JSON.parse(transferData);
          console.log('RQ3 | _onWeaponSlotDrop - Using transfer drag data:', data);
        } else {
          console.log('RQ3 | _onWeaponSlotDrop - No drag data available for weapon drop');
          ui.notifications.warn('No item data available for drop.');
          return;
        }
      }
      
      console.log('RQ3 | _onWeaponSlotDrop - Final data object:', data);
      
      if (!data || data.type !== 'Item' || !data.uuid) {
        console.log('RQ3 | _onWeaponSlotDrop - Invalid drag data:', data);
        ui.notifications.warn('Invalid item data for drop.');
        return;
      }
      
      console.log('RQ3 | _onWeaponSlotDrop - Attempting to get item from uuid:', data.uuid);
      const item = await fromUuid(data.uuid);
      console.log('RQ3 | _onWeaponSlotDrop - Retrieved item:', item);
      
      // Check if item is valid for weapon slots (weapons, shields, tools)
      const isValidForWeaponSlot = item && (
        item.type === 'weapon' ||
        (item.type === 'armor' && item.system.armorType === 'shield') ||
        (item.type === 'equipment' && item.system.equipmentType === 'tool')
      );
      
      if (!isValidForWeaponSlot) {
        console.log('RQ3 | _onWeaponSlotDrop - Item not valid for hand slot:', item?.type, item?.system?.armorType, item?.system?.equipmentType);
        ui.notifications.warn('Only weapons, shields, and tools can be equipped in hand slots.');
        return;
      }
      
      const location = event.currentTarget.dataset.weaponLocation;
      console.log('RQ3 | _onWeaponSlotDrop - Target location:', location);
      
      // Check if something is already equipped in this slot
      const currentEquipped = this.actor.system.equippedWeapons?.[location];
      if (currentEquipped && currentEquipped !== item.id) {
        const confirmed = await Dialog.confirm({
          title: "Replace Equipped Item",
          content: `<p>There is already an item equipped in the ${location} slot. Do you want to replace it?</p>`,
          defaultYes: true
        });
        
        if (!confirmed) return;
      }
      
      // Check if this item is equipped in another hand slot and clear it
      const updateData = {};
      const equippedWeapons = this.actor.system.equippedWeapons || {};
      
      for (const [slot, equippedItemId] of Object.entries(equippedWeapons)) {
        if (equippedItemId === item.id && slot !== location) {
          // Clear the old slot
          updateData[`system.equippedWeapons.${slot}`] = '';
          console.log(`RQ3 | _onWeaponSlotDrop - Clearing ${item.name} from ${slot}`);
        }
      }
      
      // Equip to the new slot
      updateData[`system.equippedWeapons.${location}`] = item.id;
      
      // Also clear the general 'equipped' flag on the item itself to prevent it showing in worn section
      // This ensures the item only shows in the hand slot, not in worn
      await item.update({ 'system.equipped': false });
      
      console.log('RQ3 | _onWeaponSlotDrop - Updating actor with:', updateData);
      await this.actor.update(updateData);
      
      // Force a sheet refresh to ensure visual update
      this.render(false);
      
      ui.notifications.info(`Equipped ${item.name} to ${location}.`);
      
    } catch (error) {
      console.error('RQ3 | _onWeaponSlotDrop - Error handling weapon drop:', error);
      ui.notifications.error('Failed to equip weapon.');
    }
  }

  /**
   * Handle unequipping weapons from hand slots
   * @param {Event} event
   * @private
   */
  async _onUnequipWeaponFromHand(event) {
    event.preventDefault();
    const location = event.currentTarget.dataset.location;
    
    if (!location) return;
    
    const currentEquipped = this.actor.system.equippedWeapons?.[location];
    if (!currentEquipped) return;
    
    const item = this.actor.items.get(currentEquipped);
    const itemName = item?.name || 'Unknown item';
    
    // Update the equipped weapons
    const updateData = {};
    updateData[`system.equippedWeapons.${location}`] = '';
    
    await this.actor.update(updateData);
    
    ui.notifications.info(`Unequipped ${itemName} from ${location}.`);
  }

  /**
   * Handle unified unequip button clicks for both armor and weapons
   * @param {Event} event   The originating click event
   * @private
   */
  async _onUnequipButton(event) {
    event.preventDefault();
    const button = event.currentTarget;
    
    // Check if this is an armor slot or weapon slot based on parent container
    const armorSlot = button.closest('.armor-slot');
    const weaponSlot = button.closest('.weapon-slot');
    
    if (armorSlot) {
      await this._onUnequipArmorFromEquipment(event);
    } else if (weaponSlot) {
      await this._onUnequipWeaponFromHand(event);
    } else {
      console.warn('RQ3 | Unequip button clicked but could not determine slot type');
    }
  }

  /**
   * Handle drag over spell list (for adding new spells from compendium)
   * @param {DragEvent} event
   * @private
   */
  _onSpellListDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Visual feedback
    event.currentTarget.classList.add('drag-over');
    
    // Check if we have drag data and if it's a spell
    let data = this._currentDragData;
    if (!data && event.dataTransfer) {
      try {
        const transferData = event.dataTransfer.getData('text/plain');
        if (transferData) {
          data = JSON.parse(transferData);
        }
      } catch (error) {
        // Ignore parsing errors during dragover
      }
    }
    
    // Validate that it's a spell of the correct type
    const targetSpellType = event.currentTarget.dataset.spellType;
    if (data && data.itemType === 'spell') {
      if (data.spellType === targetSpellType) {
        event.dataTransfer.dropEffect = 'move';
      } else {
        event.dataTransfer.dropEffect = 'none';
        event.currentTarget.classList.add('invalid-drop');
      }
    }
  }

  /**
   * Handle drag leave spell list
   * @param {DragEvent} event
   * @private
   */
  _onSpellListDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove('drag-over', 'invalid-drop');
    }
  }

  /**
   * Handle drop on spell list
   * @param {DragEvent} event
   * @private
   */
  async _onSpellListDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    
    console.log('RQ3 | _onSpellListDrop - Spell dropped');
    
    // Remove visual feedback
    event.currentTarget.classList.remove('drag-over', 'invalid-drop');
    
    try {
      let data = this._currentDragData;
      
      // Try to get data from dataTransfer if not stored
      if (!data && event.dataTransfer) {
        const transferData = event.dataTransfer.getData('text/plain');
        if (transferData) {
          data = JSON.parse(transferData);
        }
      }
      
      if (!data || !data.uuid) {
        console.error('RQ3 | _onSpellListDrop - No drag data available');
        ui.notifications.warn('No spell data available for drop.');
        return;
      }
      
      console.log('RQ3 | _onSpellListDrop - Drop data:', data);
      
      const targetSpellType = event.currentTarget.dataset.spellType;
      console.log('RQ3 | _onSpellListDrop - Target spell type:', targetSpellType);
      
      // Get the item
      const item = await fromUuid(data.uuid);
      if (!item) {
        console.error('RQ3 | _onSpellListDrop - Could not find item:', data.uuid);
        ui.notifications.error('Could not find spell.');
        return;
      }
      
      console.log('RQ3 | _onSpellListDrop - Item:', item.name, 'Type:', item.type, 'Spell Type:', item.system.spellType);
      
      // Validate it's a spell
      if (item.type !== 'spell') {
        ui.notifications.warn('Only spells can be dropped here.');
        return;
      }
      
      // Check if spell type matches the target section
      if (item.system.spellType !== targetSpellType) {
        ui.notifications.warn(`This is a ${item.system.spellType} spell. Please drop it in the ${item.system.spellType} magic section.`);
        return;
      }
      
      // Get target spell storage location
      const targetSpellStorage = event.currentTarget.dataset.spellStorage || 'standard';
      
      // If the item is from a compendium or another actor, add it to this actor
      if (!item.parent || item.parent.id !== this.actor.id) {
        console.log('RQ3 | _onSpellListDrop - Adding spell to actor');
        const itemData = item.toObject();
        // Set the spell storage location when adding
        itemData.system.spellStorageLocation = targetSpellStorage;
        await this.actor.createEmbeddedDocuments('Item', [itemData]);
        
        // If it was from another actor, delete it from there
        if (item.parent && item.parent.documentName === 'Actor') {
          await item.delete();
          ui.notifications.info(`Moved ${item.name} to ${this.actor.name}`);
        } else {
          ui.notifications.info(`Added ${item.name} to spellbook`);
        }
      } else {
        // Item is already on this actor, update its spell type and/or storage location if needed
        console.log('RQ3 | _onSpellListDrop - Spell already on actor, updating storage location');
        const updateData = {};
        if (item.system.spellType !== targetSpellType) {
          updateData['system.spellType'] = targetSpellType;
        }
        const currentStorage = item.system.spellStorageLocation || 'standard';
        if (currentStorage !== targetSpellStorage) {
          updateData['system.spellStorageLocation'] = targetSpellStorage;
        }
        
        if (Object.keys(updateData).length > 0) {
          await item.update(updateData);
          if (updateData['system.spellType']) {
            ui.notifications.info(`Changed ${item.name} to ${targetSpellType} magic`);
          }
          if (updateData['system.spellStorageLocation']) {
            const storageName = targetSpellStorage === 'standard' ? 'standard' : targetSpellStorage === 'int-spirit' ? 'INT Spirit' : 'Spell Matrix';
            ui.notifications.info(`Moved ${item.name} to ${storageName} section`);
          }
        }
      }
      
      // Clear drag data
      this._currentDragData = null;
      
      // Re-render the sheet
      this.render(false);
      
    } catch (error) {
      console.error('RQ3 | _onSpellListDrop - Error handling spell drop:', error);
      ui.notifications.error('Failed to add spell.');
    }
  }

  /**
   * Handle spell delete button click
   * @param {Event} event
   * @private
   */
  async _onSpellDelete(event) {
    event.preventDefault();
    const spellItem = $(event.currentTarget).closest('.spell-item');
    const itemId = spellItem.data('item-id');
    const item = this.actor.items.get(itemId);
    if (item) {
      const confirmed = await Dialog.confirm({
        title: `Delete ${item.name}?`,
        content: `<p>Are you sure you want to delete <strong>${item.name}</strong>?</p>`,
        yes: () => true,
        no: () => false
      });
      
      if (confirmed) {
        await item.delete();
        ui.notifications.info(`Deleted ${item.name}`);
      }
    }
  }

  /**
   * Handle spell cast button click - rolls casting check
   * @param {Event} event
   * @private
   */
  async _onSpellCast(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Don't process clicks on disabled spell cast buttons
    if ($(event.currentTarget).hasClass('disabled')) {
      return;
    }
    
    const spellItem = $(event.currentTarget).closest('.spell-item');
    const itemId = spellItem.data('item-id');
    const item = this.actor.items.get(itemId);
    
    if (!item) return;
    
    // Get casting rating based on spell type
    let castingRating, title, formula, magicRating = 0;
    let selectedMP = null;
    const spellType = item.system.spellType;
    
    if (spellType === 'spirit') {
      // For spirit spells with MP > 1, show MP selection popup
      const spellMP = item.system.magicPoints || item.system.cost || 1;
      if (spellMP > 1) {
        const diceButton = event.currentTarget;
        selectedMP = await this.actor.showSpiritSpellMPTooltip(item.name, spellMP, diceButton);
        if (selectedMP === null) {
          // User cancelled
          return;
        }
      } else {
        selectedMP = spellMP;
      }
      
      const pow = this.actor.system.characteristics?.pow?.current || 0;
      const encPenalty = Math.ceil(this.actor.system.attributes?.encumbrance?.total || 0);
      magicRating = this.actor.system.magic?.magicRating?.value || 0;
      castingRating = Math.max(0, (pow * 5) + magicRating - encPenalty);
      title = `${item.name} - Spirit Magic Casting`;
      formula = `POW × 5 + Magic Rating - ENC = ${pow} × 5 + ${magicRating} - ${encPenalty} = ${castingRating}%`;
    } else if (spellType === 'divine') {
      const encPenalty = Math.ceil(this.actor.system.attributes?.encumbrance?.total || 0);
      castingRating = Math.max(0, 100 - encPenalty);
      title = `${item.name} - Divine Magic Casting`;
      formula = `100% - ENC = 100 - ${encPenalty} = ${castingRating}%`;
    } else if (spellType === 'sorcery') {
      // For sorcery spells, show MP allocation popup
      const diceButton = event.currentTarget;
      const mpAllocation = await this.actor.showSorcerySpellMPAllocationTooltip(item.name, diceButton, item);
      if (mpAllocation === null) {
        // User cancelled
        return;
      }
      
      // Sorcery - calculate casting % based on lowest value from spell or skills with MP allocated
      const invested = item.system.invested || 0;
      magicRating = this.actor.system.magic?.magicRating?.value || 0;
      const encPenalty = Math.ceil(this.actor.system.attributes?.encumbrance?.total || 0);
      const spellTotalPercent = Math.max(0, invested + magicRating - encPenalty);
      
      // Get skill % values (base + invested + Magic Rating)
      const intensityBase = this.actor.system.magic?.intensity?.base || 0;
      const intensityInvested = this.actor.system.magic?.intensity?.invested || 0;
      const intensityPercent = intensityBase + intensityInvested + magicRating;
      
      const rangeBase = this.actor.system.magic?.range?.base || 0;
      const rangeInvested = this.actor.system.magic?.range?.invested || 0;
      const rangePercent = rangeBase + rangeInvested + magicRating;
      
      const durationBase = this.actor.system.magic?.duration?.base || 0;
      const durationInvested = this.actor.system.magic?.duration?.invested || 0;
      const durationPercent = durationBase + durationInvested + magicRating;
      
      const multispellBase = this.actor.system.magic?.multispell?.base || 0;
      const multispellInvested = this.actor.system.magic?.multispell?.invested || 0;
      const multispellPercent = multispellBase + multispellInvested + magicRating;
      
      // Calculate casting % based on lowest value from spell or skills with MP > 0
      const values = [spellTotalPercent]; // Start with spell's invested %
      
      // Add skill %s for any that have MP > 0
      if (mpAllocation.intensity > 0) values.push(intensityPercent);
      if (mpAllocation.range > 0) values.push(rangePercent);
      if (mpAllocation.duration > 0) values.push(durationPercent);
      if (mpAllocation.multispell > 0) values.push(multispellPercent);
      
      // Use the lowest value
      castingRating = values.length > 0 ? Math.min(...values) : 0;
      title = `${item.name} - Sorcery Casting`;
      
      // Store MP allocation for use in chat message
      selectedMP = mpAllocation;
    } else {
      // Unknown spell type
      return;
    }
    
    // Roll d100
    const roll = new Roll('1d100');
    await roll.evaluate({async: true});
    
    // Determine success/failure
    let result;
    if (spellType === 'divine' && roll.total >= 96) {
      result = 'FUMBLE';
    } else if (roll.total <= castingRating) {
      // Check for critical (1/20th of skill)
      const criticalThreshold = Math.max(1, Math.floor(castingRating / 20));
      if (roll.total <= criticalThreshold) {
        result = 'CRITICAL SUCCESS';
      } else {
        result = 'SUCCESS';
      }
    } else {
      // Check for fumble (96-00 for most skills)
      if (roll.total >= 96) {
        result = 'FUMBLE';
      } else {
        result = 'FAILURE';
      }
    }
    
    // Determine result class for result-text styling
    let resultClass = '';
    if (result === 'CRITICAL SUCCESS') resultClass = 'critical';
    else if (result === 'SUCCESS') resultClass = 'success';
    else if (result === 'FAILURE') resultClass = 'failure';
    else if (result === 'FUMBLE') resultClass = 'fumble';
    
    // Spend magic points based on result (only for spirit and sorcery spells)
    if (spellType === 'spirit' || spellType === 'sorcery') {
      let mpToSpend = 0;
      let resultType = '';
      
      // For sorcery spells, use calculateRollResult to get proper result type (includes special)
      if (spellType === 'sorcery') {
        const rollResult = RQ3Actor.calculateRollResult(roll.total, castingRating);
        resultType = rollResult.resultType; // 'critical', 'special', 'success', 'failure', 'fumble'
      } else {
        // For spirit spells, convert string result to resultType
        if (result === 'CRITICAL SUCCESS') resultType = 'critical';
        else if (result === 'SUCCESS') resultType = 'success';
        else if (result === 'FAILURE') resultType = 'failure';
        else if (result === 'FUMBLE') resultType = 'fumble';
      }
      
      // Determine MP to spend based on result
      if (spellType === 'spirit') {
        // For spirit spells, selectedMP is a number
        const allocatedMP = selectedMP || item.system.magicPoints || item.system.cost || 1;
        
        if (resultType === 'critical') {
          mpToSpend = 1;
        } else if (resultType === 'success') {
          mpToSpend = allocatedMP;
        } else if (resultType === 'failure') {
          mpToSpend = 1;
        } else if (resultType === 'fumble') {
          mpToSpend = allocatedMP;
        }
      } else if (spellType === 'sorcery') {
        // For sorcery spells, selectedMP is an object with intensity, range, duration, multispell
        const allocatedMP = selectedMP ? 
          (selectedMP.intensity + selectedMP.range + selectedMP.duration + selectedMP.multispell) : 1;
        
        if (resultType === 'critical') {
          mpToSpend = 1;
        } else if (resultType === 'success' || resultType === 'special') {
          mpToSpend = allocatedMP;
        } else if (resultType === 'failure') {
          mpToSpend = 1;
        } else if (resultType === 'fumble') {
          mpToSpend = allocatedMP;
        }
      }
      
      // Deduct magic points
      if (mpToSpend > 0) {
        const currentMP = this.actor.system.characteristics?.pow?.magicPoints?.value || 0;
        const newMP = Math.max(0, currentMP - mpToSpend);
        
        await this.actor.update({
          'system.characteristics.pow.magicPoints.value': newMP
        });
        
        console.log(`RQ3 | _onSpellCast - Spent ${mpToSpend} MP (result: ${resultType}), remaining: ${newMP}`);
      }
    }
    
    // Build spell stats and create chat message based on spell type
    let chatData;
    
    if (spellType === 'sorcery') {
      // Sorcery spells use the same format as sorcery skills
      const invested = item.system.invested || 0;
      const encPenalty = Math.ceil(this.actor.system.attributes?.encumbrance?.total || 0);
      
      // Helper functions for MP descriptions
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
        const meters = 10 * Math.pow(2, mp);
        if (meters >= 1000) {
          return `${(meters / 1000).toFixed(2)}km`;
        }
        return `${meters}m`;
      };

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

      // Build MP allocation display
      let mpAllocationText = '';
      if (selectedMP) {
        const rangeDesc = selectedMP.range > 0 ? ` - ${getRangeDescription(selectedMP.range)}` : '';
        const durationDesc = selectedMP.duration > 0 ? ` - ${getDurationDescription(selectedMP.duration)}` : '';
        mpAllocationText = `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--rq3-border);">
            <strong>MP Allocation:</strong><br/>
            Intensity: ${selectedMP.intensity}<br/>
            Range: ${selectedMP.range}${rangeDesc}<br/>
            Duration: ${selectedMP.duration}${durationDesc}<br/>
            Multispell: ${selectedMP.multispell}<br/>
            <strong>Total MP: ${selectedMP.intensity + selectedMP.range + selectedMP.duration + selectedMP.multispell}</strong>
          </div>
        `;
      }
      
      // Add descriptive tooltip
      const tooltipDescription = `
        <div style="text-align: left; padding: 4px;">
          <strong>Sorcery Spell Roll: ${item.name}</strong><br/>
          Invested: ${invested}%<br/>
          Magic Rating: +${magicRating}%<br/>
          Encumbrance: -${encPenalty}%<br/>
          <strong>Total: ${castingRating}%</strong>
          ${mpAllocationText}
        </div>
      `;
      RQ3Actor._addRollTooltip(roll, tooltipDescription);
      
      // Calculate RuneQuest roll result
      const result = RQ3Actor.calculateRollResult(roll.total, castingRating);
      
      // Roll hit location if spell was successful and is offensive
      let hitLocation = null;
      let hitLocationContent = '';
      
      if ((result.isSuccess || result.isSpecial || result.isCritical) && item.system.offensive) {
        hitLocation = await this._rollHitLocation('ranged');
        
        hitLocationContent = `
          <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Hit Location: ${hitLocation.location}</div>
            <div style="font-size: 0.9em; color: rgba(255,255,255,0.8);">1d20 = ${hitLocation.rollValue}</div>
            <div style="font-size: 0.85em; font-style: italic; color: rgba(255,255,255,0.7);">${hitLocation.description}</div>
          </div>
        `;
      }
      
      chatData = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${item.name} Roll`,
        content: `
          <div class="rq3-roll-result ${result.resultClass}">
            <div class="dice-roll">
              <div class="dice-result">
                <div class="dice-formula">${roll.formula}</div>
                <div class="dice-total">${roll.total}</div>
              </div>
            </div>
            <div class="roll-details">
              <div>Target: ${castingRating}%</div>
              <div class="result-text ${result.resultClass}">${result.resultText}</div>
              ${hitLocationContent}
              ${selectedMP ? (() => {
                const getRangeDesc = (mp) => {
                  const rangeTable = {
                    0: "10m", 1: "20m", 2: "40m", 3: "80m", 4: "160m", 5: "320m", 6: "640m",
                    7: "1.28km", 8: "2.56km", 9: "5.12km", 10: "10.24km", 11: "20.48km", 12: "40.96km",
                    13: "81.92km", 14: "163.84km", 15: "327.68km", 16: "655.36km", 17: "1310.72km",
                    18: "2621.44km", 19: "5242.88km", 20: "10485.76km"
                  };
                  if (rangeTable[mp]) return rangeTable[mp];
                  const meters = 10 * Math.pow(2, mp);
                  return meters >= 1000 ? `${(meters / 1000).toFixed(2)}km` : `${meters}m`;
                };
                const getDurationDesc = (mp) => {
                  const durationTable = {
                    0: "10 minutes", 1: "20 minutes", 2: "40 minutes", 3: "80 minutes (1 hour+)",
                    4: "160 minutes (2 hours+)", 5: "320 minutes (4 hours+)", 6: "640 minutes (10 hours+)",
                    7: "1280 minutes (21 hours+)", 8: "2560 minutes (1 day+)", 9: "5120 minutes (3 days+)",
                    10: "10240 minutes (1 week+)", 11: "20480 minutes (2 weeks+)", 12: "40960 minutes (4 weeks+)",
                    13: "81920 minutes (8 weeks+)", 14: "163840 minutes (16 weeks+)", 15: "327680 minutes (32 weeks+)",
                    16: "655360 minutes (1 year+)", 17: "1310720 minutes (2 years+)", 18: "2621440 minutes (5 years+)",
                    19: "5242880 minutes (10 years+)", 20: "10485760 minutes (20 years+)"
                  };
                  return durationTable[mp] || `${10 * Math.pow(2, mp)} minutes`;
                };
                const rangeDesc = selectedMP.range > 0 ? ` - ${getRangeDesc(selectedMP.range)}` : '';
                const durationDesc = selectedMP.duration > 0 ? ` - ${getDurationDesc(selectedMP.duration)}` : '';
                return `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--rq3-border); font-size: 12px;">
                  <strong>MP Allocation:</strong><br/>
                  Intensity: ${selectedMP.intensity}<br/>
                  Range: ${selectedMP.range}${rangeDesc}<br/>
                  Duration: ${selectedMP.duration}${durationDesc}<br/>
                  Multispell: ${selectedMP.multispell}
                </div>
              `;
              })() : ''}
            </div>
          </div>
        `,
        rolls: hitLocation ? [roll, hitLocation.roll] : [roll],
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        sound: CONFIG.sounds.dice
      };
    } else {
      // Spirit and Divine magic use the spell-cast format
      
      // Roll hit location if spell was successful and is offensive
      let hitLocation = null;
      let hitLocationHTML = '';
      
      if ((result === 'CRITICAL SUCCESS' || result === 'SUCCESS') && item.system.offensive) {
        hitLocation = await this._rollHitLocation('ranged');
        
        hitLocationHTML = `
          <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Hit Location: ${hitLocation.location}</div>
            <div style="font-size: 0.9em; color: rgba(255,255,255,0.8);">1d20 = ${hitLocation.rollValue}</div>
            <div style="font-size: 0.85em; font-style: italic; color: rgba(255,255,255,0.7);">${hitLocation.description}</div>
          </div>
        `;
      }
      
      let spellStats = '';
      if (spellType === 'spirit') {
        const displayMP = selectedMP !== null ? selectedMP : (item.system.magicPoints || item.system.cost);
        spellStats = `<p><strong>Magic Points:</strong> ${displayMP}</p>
          <p><strong>Range:</strong> ${item.system.range}</p>
          <p><strong>Duration:</strong> ${item.system.duration}</p>
          <p><strong>State:</strong> ${item.system.state}</p>`;
      } else if (spellType === 'divine') {
        spellStats = `<p><strong>Uses:</strong> ${item.system.uses}</p>
          <p><strong>Range:</strong> ${item.system.range}</p>
          <p><strong>Duration:</strong> ${item.system.duration}</p>
          <p><strong>State:</strong> ${item.system.state}</p>
          ${item.system.stackable ? '<p><strong>Stackable</strong></p>' : ''}
          ${item.system.reusable ? '<p><strong>Reusable</strong></p>' : ''}`;
      }
      
      chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<div class="rq3-spell-cast">
          <h3>${item.name}</h3>
          <div class="roll-result">
            <strong>${roll.total}</strong> vs ${castingRating}
          </div>
          <div class="result-text ${resultClass}">
            ${result}
          </div>
          ${hitLocationHTML}
          ${spellStats ? `<div class="spell-stats">${spellStats}</div>` : ''}
          ${item.system.description ? `<div class="spell-description">${item.system.description}</div>` : ''}
          ${spellType === 'divine' ? '<p class="divine-note"><em>Note: Divine magic always has a 96-00% chance of failure</em></p>' : ''}
        </div>`,
        rolls: hitLocation ? [roll, hitLocation.roll] : [roll],
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        sound: CONFIG.sounds.dice
      };
    }
    
    ChatMessage.create(chatData);
  }


  /**
   * Handle hit location HP click to show damage adjustment tooltip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onHitLocationHPClick(event) {
    try {
      console.log('RQ3 | _onHitLocationHPClick called');
      event.preventDefault();
      event.stopPropagation();
      
      // Ensure edit mode is initialized and check if we're in edit mode
      if (this.editMode === undefined) {
        this.editMode = this.element?.classList?.contains('edit-mode') || false;
      }
      
      if (this.editMode) {
        console.log('RQ3 | Edit mode active, preventing HP click');
        return;
      }
      
      const target = event.currentTarget;
      const hitLocation = target.dataset.hitLocation;
      
      if (!hitLocation) {
        console.warn('RQ3 | No hit location found in dataset');
        return;
      }
      
      console.log('RQ3 | Showing tooltip for location:', hitLocation);
      
      // Remove any existing tooltips first
      $('.rq3-damage-tooltip').remove();
      
      // Show the tooltip
      await this.actor.showHitLocationDamageTooltip(hitLocation, target);
      
      // Add click-away handler
      const clickAwayHandler = (e) => {
        const tooltip = document.querySelector('.rq3-damage-tooltip');
        if (tooltip && !tooltip.contains(e.target) && !target.contains(e.target)) {
          tooltip.remove();
          document.removeEventListener('click', clickAwayHandler);
        }
      };
      
      // Use setTimeout to avoid immediate click-away handling
      setTimeout(() => {
        document.addEventListener('click', clickAwayHandler);
      }, 10);
      
    } catch (error) {
      console.error('RQ3 | Error in _onHitLocationHPClick:', error);
    }
  }

  /**
   * Handle armor AP click to show armor damage adjustment tooltip
   * @param {Event} event   The originating click event
   * @private
   */
  async _onArmorAPClick(event) {
    try {
      console.log('RQ3 | _onArmorAPClick called');
      event.preventDefault();
      event.stopPropagation();
      
      // Ensure edit mode is initialized and check if we're in edit mode
      if (this.editMode === undefined) {
        this.editMode = this.element?.classList?.contains('edit-mode') || false;
      }
      
      if (this.editMode) {
        console.log('RQ3 | Edit mode active, preventing AP click');
        return;
      }
      
      const target = event.currentTarget;
      const hitLocation = target.dataset.hitLocation;
      const armorId = target.dataset.armorId;
      
      if (!hitLocation) {
        console.warn('RQ3 | No hit location found in dataset');
        return;
      }
      
      if (!armorId) {
        console.warn('RQ3 | No armor equipped at this location');
        return;
      }
      
      console.log('RQ3 | Showing armor tooltip for location:', hitLocation, 'armor:', armorId);
      
      // Remove any existing tooltips first
      $('.rq3-damage-tooltip').remove();
      $('.rq3-armor-tooltip').remove();
      
      // Show the tooltip
      await this.actor.showArmorDamageTooltip(hitLocation, armorId, target);
      
      // Add click-away handler
      const clickAwayHandler = (e) => {
        const tooltip = document.querySelector('.rq3-armor-tooltip');
        if (tooltip && !tooltip.contains(e.target) && !target.contains(e.target)) {
          tooltip.remove();
          document.removeEventListener('click', clickAwayHandler);
        }
      };
      
      // Use setTimeout to avoid immediate click-away handling
      setTimeout(() => {
        document.addEventListener('click', clickAwayHandler);
      }, 10);
      
    } catch (error) {
      console.error('RQ3 | Error in _onArmorAPClick:', error);
    }
  }

  /**
   * Handle magic stat cog icon click
   * @param {Event} event   The originating click event
   * @private
   */
  async _onMagicStatCogClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const cogIcon = event.currentTarget;
    const statType = cogIcon.dataset.magicStat;
    
    // Use the cog icon itself as the target element for positioning
    await this._showMagicStatTooltip(statType, cogIcon);
  }

  /**
   * Handle magic points +/- button click
   * @param {Event} event   The originating click event
   * @private
   */
  async _onMPAdjustClick(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const action = button.dataset.action; // 'increase' or 'decrease'
    const statType = button.dataset.stat; // 'magicPoints'
    
    if (statType !== 'magicPoints') {
      return; // Only handle magic points for now
    }
    
    const currentMP = this.actor.system.characteristics.pow.magicPoints.value || 0;
    const maxMP = this.actor.system.characteristics.pow.magicPoints.max || 0;
    
    let newMP = currentMP;
    if (action === 'increase') {
      newMP = Math.min(maxMP, currentMP + 1);
    } else if (action === 'decrease') {
      newMP = Math.max(0, currentMP - 1);
    }
    
    if (newMP !== currentMP) {
      await this.actor.update({
        'system.characteristics.pow.magicPoints.value': newMP
      });
      
      // Update the display
      const statItem = $(button).closest('.magic-stat-item');
      if (statItem.length) {
        statItem.find('.magic-stat-value').text(`${newMP}/${maxMP}`);
      }
    }
  }

  /**
   * Handle sorcery spell invested points cog icon click
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSorcerySpellCogClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const cogIcon = $(event.currentTarget);
    const spellId = cogIcon.data('spell-id');
    const spell = this.actor.items.get(spellId);
    
    if (!spell || spell.system.spellType !== 'sorcery') {
      return;
    }
    
    await this._showSorcerySpellInvestedTooltip(spell, cogIcon);
  }

  /**
   * Handle spirit spell MP cog icon click
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSpiritSpellCogClick(event) {
    event.preventDefault();
    event.stopPropagation();
    const cogIcon = $(event.currentTarget);
    const spellId = cogIcon.data('spell-id');
    const spell = this.actor.items.get(spellId);
    
    if (!spell || spell.system.spellType !== 'spirit') {
      return;
    }
    
    await this._showSpiritSpellMPTooltip(spell, cogIcon);
  }

  /**
   * Handle magic skill roll (ceremony, summon, enchant)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onMagicSkillRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const skillName = event.currentTarget.dataset.magicSkill;
    
    // Get the skill value (base + invested + magic rating)
    const magicRating = this.actor.system.magic.magicRating.value || 0;
    let skillValue = 0;
    let skillDisplayName = '';
    let baseValue = 0;
    let investedValue = 0;
    
    switch(skillName) {
      case 'ceremony':
        baseValue = this.actor.system.magic.ceremony.base || 0;
        investedValue = this.actor.system.magic.ceremony.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Ceremony';
        break;
      case 'summon':
        baseValue = this.actor.system.magic.summon.base || 0;
        investedValue = this.actor.system.magic.summon.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Summon';
        break;
      case 'enchant':
        baseValue = this.actor.system.magic.enchant.base || 0;
        investedValue = this.actor.system.magic.enchant.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Enchant';
        break;
      case 'intensity':
        baseValue = this.actor.system.magic.intensity.base || 0;
        investedValue = this.actor.system.magic.intensity.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Intensity';
        break;
      case 'range':
        baseValue = this.actor.system.magic.range.base || 0;
        investedValue = this.actor.system.magic.range.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Range';
        break;
      case 'duration':
        baseValue = this.actor.system.magic.duration.base || 0;
        investedValue = this.actor.system.magic.duration.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Duration';
        break;
      case 'multispell':
        baseValue = this.actor.system.magic.multispell.base || 0;
        investedValue = this.actor.system.magic.multispell.invested || 0;
        skillValue = baseValue + investedValue + magicRating;
        skillDisplayName = 'Multispell';
        break;
      default:
        console.warn('Unknown magic skill:', skillName);
        return;
    }
    
    // Roll 1d100
    const roll = new Roll('1d100');
    await roll.evaluate({async: true});
    
    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Magic Skill Roll: ${skillDisplayName}</strong><br/>
        Base: ${baseValue}%<br/>
        Invested: ${investedValue}%<br/>
        Magic Rating: +${magicRating}%<br/>
        <strong>Total: ${skillValue}%</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);
    
    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, skillValue);
    
    // Create chat message with sound enabled
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${skillDisplayName} Roll`,
      content: `
        <div class="rq3-roll-result ${result.resultClass}">
          <div class="dice-roll">
            <div class="dice-result">
              <div class="dice-formula">${roll.formula}</div>
              <div class="dice-total">${roll.total}</div>
            </div>
          </div>
          <div class="roll-details">
            <div>Target: ${skillValue}%</div>
            <div class="result-text ${result.resultClass}">${result.resultText}</div>
          </div>
        </div>
      `,
      rolls: [roll],
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    };
    
    await ChatMessage.create(messageData);
  }

  /**
   * Handle weapon skills accordion toggle
   * @param {Event} event   The originating click event
   * @private
   */
  _onWeaponSkillsAccordionToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const header = $(event.currentTarget);
    const section = header.closest('.weapon-skills-section');
    const content = section.find('.weapon-skills-content');
    
    // Toggle expanded class
    section.toggleClass('expanded');
    
    // Toggle content visibility
    if (section.hasClass('expanded')) {
      content.slideDown(300);
    } else {
      content.slideUp(300);
    }
  }

  /**
   * Handle weapon roll button click
   * @param {Event} event   The originating click event
   * @private
   */
  async _onWeaponRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Get the button element (might be clicked on the icon inside)
    let button = event.currentTarget;
    if (!button.classList.contains('weapon-roll-button')) {
      button = button.closest('.weapon-roll-button');
    }
    
    if (!button) {
      console.warn('RQ3 | Could not find weapon roll button');
      return;
    }
    
    const weaponId = button.dataset.weaponId;
    const weaponName = button.dataset.weaponName;
    const weaponType = button.dataset.weaponType;
    const attackType = button.dataset.attackType; // melee1Handed, melee2Handed, rangedAttack
    
    // Get the weapon item
    const weaponItem = this.actor.items.get(weaponId);
    if (!weaponItem) {
      console.warn('RQ3 | Could not find weapon item:', weaponId);
      return;
    }
    
    // Get the attack skill value for this weapon type
    const weaponSkill = this.actor.getAttackSkillValue(weaponType);
    
    // Roll 1d100
    const roll = new Roll("1d100");
    await roll.evaluate();
    
    // Build attack type display name
    let attackTypeDisplay = '';
    if (attackType === 'melee1Handed') attackTypeDisplay = '1 Handed';
    else if (attackType === 'melee2Handed') attackTypeDisplay = '2 Handed';
    else if (attackType === 'rangedAttack') attackTypeDisplay = 'Ranged';
    
    // Get attack skill breakdown for tooltip
    const attackSkillKey = RQ3Actor.getAttackSkillForWeaponType(weaponType);
    let attackSkillBase = 0;
    let attackSkillInvested = 0;
    let attackModifier = 0;
    
    if (attackSkillKey) {
      const attackSkillData = this.actor.system.skills?.weapon?.[attackSkillKey];
      attackSkillInvested = attackSkillData?.value || 0;
      attackModifier = this.actor.system.attributes?.skillCategory?.weapon || 0;
      // Base is 0 for weapon skills
    }
    
    // Add descriptive tooltip
    const tooltipDescription = `
      <div style="text-align: left; padding: 4px;">
        <strong>Attack Roll: ${weaponName} (${attackTypeDisplay})</strong><br/>
        Attack Skill: ${attackSkillKey ? attackSkillKey.charAt(0).toUpperCase() + attackSkillKey.slice(1) : 'N/A'}<br/>
        Base: 0%<br/>
        Invested: ${attackSkillInvested}%<br/>
        Attack Modifier: ${attackModifier >= 0 ? '+' : ''}${attackModifier}%<br/>
        <strong>Total: ${weaponSkill}%</strong>
      </div>
    `;
    RQ3Actor._addRollTooltip(roll, tooltipDescription);
    
    // Calculate RuneQuest roll result
    const result = RQ3Actor.calculateRollResult(roll.total, weaponSkill);
    
    // Roll hit location if attack was successful
    let hitLocation = null;
    let hitLocationContent = '';
    
    if (result.isSuccess || result.isSpecial || result.isCritical) {
      const locationType = (attackType === 'rangedAttack') ? 'ranged' : 'melee';
      hitLocation = await this._rollHitLocation(locationType);
      
      hitLocationContent = `
        <div style="margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: 4px;">
          <div style="font-weight: bold; margin-bottom: 4px;">Hit Location: ${hitLocation.location}</div>
          <div style="font-size: 0.9em; color: rgba(255,255,255,0.8);">1d20 = ${hitLocation.rollValue}</div>
          <div style="font-size: 0.85em; font-style: italic; color: rgba(255,255,255,0.7);">${hitLocation.description}</div>
        </div>
      `;
    }
    
    // Prepare damage roll if attack was successful
    let damageRoll = null;
    let damageContent = '';
    
    if (result.isSuccess || result.isSpecial || result.isCritical) {
      // Get damage from the appropriate attack section
      const attackData = weaponItem.system[attackType];
      if (attackData && attackData.damage) {
        let damageFormula = attackData.damage.trim();
        
        // Get damage modifier based on attack type
        if (attackType === 'melee1Handed') {
          // 1 handed = damage + 1 hand DM
          const oneHandDM = this.actor.system.derivedStats.damageModifier || '+0';
          if (oneHandDM !== '+0' && oneHandDM !== '0') {
            damageFormula = `${damageFormula} ${oneHandDM}`;
          }
        } else if (attackType === 'melee2Handed') {
          // 2 handed = damage + 2 hand DM
          const twoHandDM = this.actor.system.derivedStats.twoHandDamageModifier || '+0';
          if (twoHandDM !== '+0' && twoHandDM !== '0') {
            damageFormula = `${damageFormula} ${twoHandDM}`;
          }
        } else if (attackType === 'rangedAttack') {
          // Ranged damage calculation
          const dbEnabled = attackData.deadlyBlow || false;
          if (dbEnabled) {
            // Ranged = damage + half(1 hand DM)
            const oneHandDM = this.actor.system.derivedStats.damageModifier || '+0';
            if (oneHandDM !== '+0' && oneHandDM !== '0') {
              const halvedDM = this._halveDamageModifier(oneHandDM);
              if (halvedDM) {
                damageFormula = `${damageFormula} ${halvedDM}`;
              }
            }
          }
          // If DB is not enabled, just use damage (no modifier)
        }
        
        // Roll the damage
        try {
          damageRoll = new Roll(damageFormula);
          await damageRoll.evaluate();
          
          // Build damage tooltip description
          const baseDamage = attackData.damage.trim();
          let damageTooltipDescription = `
            <div style="text-align: left; padding: 4px;">
              <strong>Damage Roll: ${weaponName} (${attackTypeDisplay})</strong><br/>
              Base Damage: ${baseDamage}<br/>
          `;
          
          if (attackType === 'melee1Handed') {
            const oneHandDM = this.actor.system.derivedStats.damageModifier || '+0';
            if (oneHandDM !== '+0' && oneHandDM !== '0') {
              damageTooltipDescription += `1 Hand DM: ${oneHandDM}<br/>`;
            }
          } else if (attackType === 'melee2Handed') {
            const twoHandDM = this.actor.system.derivedStats.twoHandDamageModifier || '+0';
            if (twoHandDM !== '+0' && twoHandDM !== '0') {
              damageTooltipDescription += `2 Hand DM: ${twoHandDM}<br/>`;
            }
          } else if (attackType === 'rangedAttack') {
            const dbEnabled = attackData.deadlyBlow || false;
            if (dbEnabled) {
              const oneHandDM = this.actor.system.derivedStats.damageModifier || '+0';
              if (oneHandDM !== '+0' && oneHandDM !== '0') {
                const halvedDM = this._halveDamageModifier(oneHandDM);
                if (halvedDM) {
                  damageTooltipDescription += `DB (Half 1 Hand DM): ${halvedDM}<br/>`;
                }
              }
            }
          }
          
          damageTooltipDescription += `<strong>Formula: ${damageRoll.formula}</strong></div>`;
          RQ3Actor._addRollTooltip(damageRoll, damageTooltipDescription);
          
          damageContent = `
            <div class="dice-roll" style="margin-top: 8px;">
              <div class="dice-result">
                <div class="dice-formula">Damage: ${damageRoll.formula}</div>
                <div class="dice-total">${damageRoll.total}</div>
              </div>
            </div>
          `;
        } catch (error) {
          console.error('RQ3 | Error rolling damage:', error);
        }
      }
    }
    
    // Create chat message
    const rolls = [roll];
    if (hitLocation) {
      rolls.push(hitLocation.roll);
    }
    if (damageRoll) {
      rolls.push(damageRoll);
    }
    
    const messageData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<strong>${weaponName} Attack (${attackTypeDisplay})</strong>`,
      content: `
        <div class="rq3-roll-result ${result.resultClass}">
          <div class="dice-roll">
            <div class="dice-result">
              <div class="dice-formula">${roll.formula}</div>
              <div class="dice-total">${roll.total}</div>
            </div>
          </div>
          <div class="roll-details">
            <div>Target: ${weaponSkill}%</div>
            <div class="result-text ${result.resultClass}">${result.resultText}</div>
          </div>
          ${hitLocationContent}
          ${damageContent}
        </div>
      `,
      rolls: rolls,
      type: CONST.CHAT_MESSAGE_TYPES.ROLL,
      sound: CONFIG.sounds.dice
    };
    
    ChatMessage.create(messageData);
  }

  /**
   * Roll for hit location and return the result
   * @param {string} attackType - 'melee' or 'ranged' (includes spells)
   * @returns {Object} Object with roll value and location details
   * @private
   */
  async _rollHitLocation(attackType) {
    const roll = new Roll('1d20');
    await roll.evaluate();
    const rollValue = roll.total;
    
    let location, description;
    
    if (attackType === 'melee') {
      // Melee hit location table
      if (rollValue >= 1 && rollValue <= 4) {
        location = 'Right Leg';
        description = 'Right leg from hip to foot';
      } else if (rollValue >= 5 && rollValue <= 8) {
        location = 'Left Leg';
        description = 'Left leg from hip to foot';
      } else if (rollValue >= 9 && rollValue <= 11) {
        location = 'Abdomen';
        description = 'Hip to just under floating ribs';
      } else if (rollValue === 12) {
        location = 'Chest';
        description = 'Floating ribs to neck and shoulders';
      } else if (rollValue >= 13 && rollValue <= 15) {
        location = 'Right Arm';
        description = 'Entire right arm';
      } else if (rollValue >= 16 && rollValue <= 18) {
        location = 'Left Arm';
        description = 'Entire left arm';
      } else { // 19-20
        location = 'Head';
        description = 'Neck and head';
      }
    } else { // ranged or spell
      // Ranged/Missile/Spell hit location table
      if (rollValue >= 1 && rollValue <= 3) {
        location = 'Right Leg';
        description = 'Right leg from hip to foot';
      } else if (rollValue >= 4 && rollValue <= 6) {
        location = 'Left Leg';
        description = 'Left leg from hip to foot';
      } else if (rollValue >= 7 && rollValue <= 10) {
        location = 'Abdomen';
        description = 'Hip to just under floating ribs';
      } else if (rollValue >= 11 && rollValue <= 15) {
        location = 'Chest';
        description = 'Floating ribs to neck and shoulders';
      } else if (rollValue >= 16 && rollValue <= 17) {
        location = 'Right Arm';
        description = 'Entire right arm';
      } else if (rollValue >= 18 && rollValue <= 19) {
        location = 'Left Arm';
        description = 'Entire left arm';
      } else { // 20
        location = 'Head';
        description = 'Neck and head';
      }
    }
    
    return {
      roll: roll,
      rollValue: rollValue,
      location: location,
      description: description
    };
  }

  /**
   * Halve a damage modifier for ranged DB attacks
   * Examples: +1d4 -> +1d2, +2d6 -> +2d3, -1d4 -> -1d2
   * @param {string} dm - The damage modifier string (e.g., "+1d4", "+2d6")
   * @returns {string|null} The halved damage modifier or null if invalid
   * @private
   */
  _halveDamageModifier(dm) {
    if (!dm || dm === '+0' || dm === '0') return null;
    
    // Match patterns like +1d4, -1d2, +2d6, etc.
    const match = dm.match(/^([+-]?)(\d+)d(\d+)$/);
    if (!match) return null;
    
    const sign = match[1] || '+';
    const numDice = parseInt(match[2]);
    const dieSize = parseInt(match[3]);
    
    // Halve the die size
    const halvedDieSize = Math.max(1, Math.floor(dieSize / 2));
    
    return `${sign}${numDice}d${halvedDieSize}`;
  }

  /**
   * Handle magic skill custom multiplier roll (right-click)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onMagicSkillRollCustom(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const skillName = event.currentTarget.dataset.magicSkill;
    
    // Get the skill value (base + invested + magic rating)
    const magicRating = this.actor.system.magic.magicRating.value || 0;
    let skillValue = 0;
    let skillDisplayName = '';
    
    switch(skillName) {
      case 'ceremony':
        skillValue = (this.actor.system.magic.ceremony.base || 0) + (this.actor.system.magic.ceremony.invested || 0) + magicRating;
        skillDisplayName = 'Ceremony';
        break;
      case 'summon':
        skillValue = (this.actor.system.magic.summon.base || 0) + (this.actor.system.magic.summon.invested || 0) + magicRating;
        skillDisplayName = 'Summon';
        break;
      case 'enchant':
        skillValue = (this.actor.system.magic.enchant.base || 0) + (this.actor.system.magic.enchant.invested || 0) + magicRating;
        skillDisplayName = 'Enchant';
        break;
      default:
        console.warn('Unknown magic skill:', skillName);
        return;
    }
    
    // Show custom multiplier tooltip (magic skills use 1-10 whole numbers)
    const multiplier = await this.actor.showMagicSkillMultiplierTooltip(skillDisplayName, skillValue, event.currentTarget);
    
    if (multiplier) {
      const targetValue = Math.floor(skillValue * multiplier);
      
      // Get base and invested values for tooltip
      let baseValue = 0;
      let investedValue = 0;
      switch(skillName) {
        case 'ceremony':
          baseValue = this.actor.system.magic.ceremony.base || 0;
          investedValue = this.actor.system.magic.ceremony.invested || 0;
          break;
        case 'summon':
          baseValue = this.actor.system.magic.summon.base || 0;
          investedValue = this.actor.system.magic.summon.invested || 0;
          break;
        case 'enchant':
          baseValue = this.actor.system.magic.enchant.base || 0;
          investedValue = this.actor.system.magic.enchant.invested || 0;
          break;
      }
      
      // Roll 1d100
      const roll = new Roll('1d100');
      await roll.evaluate();
      
      // Add descriptive tooltip
      const tooltipDescription = `
        <div style="text-align: left; padding: 4px;">
          <strong>Magic Skill Roll: ${skillDisplayName} (x${multiplier})</strong><br/>
          Base: ${baseValue}%<br/>
          Invested: ${investedValue}%<br/>
          Magic Rating: +${magicRating}%<br/>
          Base Total: ${skillValue}%<br/>
          Multiplier: x${multiplier}<br/>
          <strong>Target: ${targetValue}%</strong>
        </div>
      `;
      RQ3Actor._addRollTooltip(roll, tooltipDescription);
      
      // Calculate RuneQuest roll result
      const result = RQ3Actor.calculateRollResult(roll.total, targetValue);
      
      // Create chat message
      const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${skillDisplayName} Roll (x${multiplier})`,
        content: `
          <div class="rq3-roll-result ${result.resultClass}">
            <div class="dice-roll">
              <div class="dice-result">
                <div class="dice-formula">${roll.formula}</div>
                <div class="dice-total">${roll.total}</div>
              </div>
            </div>
            <div class="roll-details">
              <div>Base: ${skillValue}% x${multiplier} = ${targetValue}%</div>
              <div class="result-text ${result.resultClass}">${result.resultText}</div>
            </div>
          </div>
        `,
        roll: roll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
      };
      
      ChatMessage.create(messageData);
    }
  }

  /**
   * Handle skill roll button click (left-click for normal roll)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSkillRoll(event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Prevent rolls if in edit mode
    if (this.editMode) {
      return;
    }
    
    // Get the button element (might be clicked on the icon inside)
    let element = event.currentTarget;
    if (!element.classList.contains('skill-roll-button')) {
      element = element.closest('.skill-roll-button');
    }
    
    if (!element) {
      return;
    }
    
    // Prevent multiple rapid clicks
    if (element.dataset.rolling === 'true') {
      return;
    }
    
    element.dataset.rolling = 'true';
    
    const skillName = element.dataset.skill;
    
    if (skillName) {
      try {
        await this.actor.rollSkill(skillName);
      } finally {
        // Reset the flag after a short delay
        setTimeout(() => {
          element.dataset.rolling = 'false';
        }, 500);
      }
    } else {
      element.dataset.rolling = 'false';
    }
  }

  /**
   * Handle skill roll button right-click (custom multiplier)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onSkillRollCustom(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent rolls if in edit mode
    if (this.editMode) {
      return;
    }
    
    const element = event.currentTarget;
    const skillName = element.dataset.skill;
    
    if (!skillName) {
      return;
    }
    
    // Get the skill value from the displayed total next to the button
    // The button is next to a span with class "rq3-skill-total"
    const skillTotalSpan = $(element).siblings('.rq3-skill-total');
    let skillValue = 0;
    
    if (skillTotalSpan.length) {
      // Parse the percentage value from the text (e.g., "45%" -> 45)
      const totalText = skillTotalSpan.text().trim();
      const match = totalText.match(/(\d+)%/);
      if (match) {
        skillValue = parseInt(match[1]);
      }
    }
    
    // If we couldn't parse it, try to get it from the actor's skill data
    if (skillValue === 0) {
      skillValue = await this._getSkillValue(skillName);
    }
    
    // Show custom multiplier tooltip
    const multiplier = await this.actor.showSkillMultiplierTooltip(skillName, skillValue, element);
    
    if (multiplier) {
      const targetValue = Math.floor(skillValue * multiplier);
      
      // Roll 1d100
      const roll = new Roll('1d100');
      await roll.evaluate();
      
      // Add descriptive tooltip (simplified since we don't have full breakdown here)
      const tooltipDescription = `
        <div style="text-align: left; padding: 4px;">
          <strong>Skill Roll: ${skillName} (x${multiplier})</strong><br/>
          Base Total: ${skillValue}%<br/>
          Multiplier: x${multiplier}<br/>
          <strong>Target: ${targetValue}%</strong>
        </div>
      `;
      RQ3Actor._addRollTooltip(roll, tooltipDescription);
      
      // Calculate RuneQuest roll result
      const result = RQ3Actor.calculateRollResult(roll.total, targetValue);
      
      // Create chat message
      const messageData = {
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${skillName} Roll (x${multiplier})`,
        content: `
          <div class="rq3-roll-result ${result.resultClass}">
            <div class="dice-roll">
              <div class="dice-result">
                <div class="dice-formula">${roll.formula}</div>
                <div class="dice-total">${roll.total}</div>
              </div>
            </div>
            <div class="roll-details">
              <div>Base: ${skillValue}% x${multiplier} = ${targetValue}%</div>
              <div class="result-text ${result.resultClass}">${result.resultText}</div>
            </div>
          </div>
        `,
        roll: roll,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
      };
      
      ChatMessage.create(messageData);
    }
  }

  /**
   * Get skill value for a given skill name
   * @param {string} skillName - The name of the skill
   * @returns {Promise<number>} The skill value
   * @private
   */
  async _getSkillValue(skillName) {
    // This is a simplified version - in practice you'd want to use the same logic as rollSkill
    // For now, we'll try to find the skill and calculate its value
    try {
      // Try to find the skill in CONFIG
      let skillData = null;
      let categoryKey = null;
      
      for (const [catKey, category] of Object.entries(CONFIG.RQ3.skills || {})) {
        for (const [skillKey, skill] of Object.entries(category.skills || {})) {
          if (skill.name === skillName) {
            skillData = skill;
            categoryKey = catKey;
            break;
          }
        }
        if (skillData) break;
      }
      
      if (!skillData) {
        // Check custom skills
        const customSkills = this.actor.system.customSkills || {};
        for (const [catKey, skills] of Object.entries(customSkills)) {
          for (const [skillKey, skill] of Object.entries(skills)) {
            if (skill.name === skillName) {
              const base = skill.baseValue || 0;
              const invested = skill.investedValue || 0;
              const categoryBonus = this.actor.system.attributes.skillCategory[catKey] || 0;
              return Math.max(0, base + invested + categoryBonus);
            }
          }
        }
        return 0;
      }
      
      // Calculate skill value similar to rollSkill method
      const skillKey = Object.keys(CONFIG.RQ3.skills[categoryKey].skills).find(
        key => CONFIG.RQ3.skills[categoryKey].skills[key].name === skillName
      );
      
      if (!skillKey) return 0;
      
      // Get base and invested values
      const characterSkills = this.actor.system.skills || {};
      const characterSkill = characterSkills[categoryKey]?.[skillKey];
      const investedValue = characterSkill?.value || 0;
      
      // Get base value (simplified - would need full calculation)
      let baseValue = 0;
      if (skillData.isCharacteristicMultiple && skillData.multiplier) {
        const charValue = this.actor.system.characteristics[skillData.characteristic1]?.current || 10;
        baseValue = charValue * skillData.multiplier;
      } else {
        baseValue = skillData.baseChance || 0;
      }
      
      // Calculate category bonus using the same logic as rollSkill
      const characteristics = this.actor.system.characteristics;
      
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
      
      let categoryBonus = 0;
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
      return Math.max(0, baseValue + investedValue + categoryBonus);
    } catch (error) {
      console.error('RQ3 | Error getting skill value:', error);
      return 0;
    }
  }

  /**
   * Handle generic rollable element custom multiplier (right-click on skills)
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRollCustom(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Prevent rolls if in edit mode
    if (this.editMode) {
      return;
    }
    
    const element = event.currentTarget;
    const dataset = element.dataset;
    
    // Only handle skill rolls
    if (dataset.skill) {
      const skillName = dataset.skill;
      const skillValue = parseInt(dataset.skillValue) || 0;
      
      // Show custom multiplier tooltip
      const multiplier = await this.actor.showSkillMultiplierTooltip(skillName, skillValue, element);
      
      if (multiplier) {
        const targetValue = Math.floor(skillValue * multiplier);
        
        // Roll 1d100
        const roll = new Roll('1d100');
        await roll.evaluate();
        
        // Add descriptive tooltip (simplified since we don't have full breakdown here)
        const tooltipDescription = `
          <div style="text-align: left; padding: 4px;">
            <strong>Skill Roll: ${skillName} (x${multiplier})</strong><br/>
            Base Total: ${skillValue}%<br/>
            Multiplier: x${multiplier}<br/>
            <strong>Target: ${targetValue}%</strong>
          </div>
        `;
        RQ3Actor._addRollTooltip(roll, tooltipDescription);
        
        // Calculate RuneQuest roll result
        const result = RQ3Actor.calculateRollResult(roll.total, targetValue);
        
        // Create chat message
        const messageData = {
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: `${skillName} Roll (x${multiplier})`,
          content: `
            <div class="rq3-roll-result ${result.resultClass}">
              <div class="dice-roll">
                <div class="dice-result">
                  <div class="dice-formula">${roll.formula}</div>
                  <div class="dice-total">${roll.total}</div>
                </div>
              </div>
              <div class="roll-details">
                <div>Base: ${skillValue}% x${multiplier} = ${targetValue}%</div>
                <div class="result-text ${result.resultClass}">${result.resultText}</div>
              </div>
            </div>
          `,
          rolls: [roll],
          type: CONST.CHAT_MESSAGE_TYPES.ROLL,
          sound: CONFIG.sounds.dice
        };
        
        ChatMessage.create(messageData);
      }
    }
  }

  /**
   * Show magic stat adjustment tooltip
   * @param {string} statType - The type of magic stat (magicRating, magicPoints, freeInt, ceremony, summon, enchant)
   * @param {HTMLElement} targetElement - The element to position relative to
   * @private
   */
  async _showMagicStatTooltip(statType, targetElement) {
    try {
      console.log('RQ3 | Showing magic stat tooltip for:', statType);
      
      // Remove any existing tooltips first
      $('.rq3-magic-stat-tooltip').remove();
      
      // Show the tooltip (always allow editing, so pass true for editMode)
      await this.actor.showMagicStatTooltip(statType, targetElement, true);
      
      // Add click-away handler
      const clickAwayHandler = (e) => {
        const tooltip = document.querySelector('.rq3-magic-stat-tooltip');
        if (tooltip && !tooltip.contains(e.target) && !targetElement.contains(e.target)) {
          tooltip.remove();
          document.removeEventListener('click', clickAwayHandler);
        }
      };
      
      // Use setTimeout to avoid immediate click-away handling
      setTimeout(() => {
        document.addEventListener('click', clickAwayHandler);
      }, 10);
      
    } catch (error) {
      console.error('RQ3 | Error in _showMagicStatTooltip:', error);
    }
  }

  /**
   * Initialize accordion functionality for magic sections
   * @param {jQuery} html - The HTML element
   * @private
   */
  _initializeAccordions(html) {
    // Restore saved state
    this._restoreAccordionState(html);
    
    // Add click handlers for accordion headers
    html.find('.accordion-header').click((event) => {
      event.preventDefault();
      const header = $(event.currentTarget);
      const magicType = header.data('accordion-target');
      const accordion = header.closest('.magic-accordion');
      
      // Toggle collapsed state
      const isCollapsed = accordion.hasClass('collapsed');
      accordion.toggleClass('collapsed', !isCollapsed);
      
      // Save state
      this._saveAccordionState(magicType, !isCollapsed);
    });
  }

  /**
   * Restore accordion state from actor flags
   * @param {jQuery} html - The HTML element
   * @private
   */
  _restoreAccordionState(html) {
    const collapsedSections = this.actor.getFlag('runequest3', 'collapsedMagicSections') || {};
    
    // Main magic sections
    ['spirit', 'divine', 'sorcery'].forEach(magicType => {
      const accordion = html.find(`.magic-accordion[data-magic-type="${magicType}"]`);
      if (collapsedSections[magicType]) {
        accordion.addClass('collapsed');
      } else {
        accordion.removeClass('collapsed');
      }
    });
    
    // INT Spirit, Spell Matrix, and Unavailable sections (default to collapsed)
    ['spirit-int-spirit', 'spirit-spell-matrix', 'sorcery-int-spirit', 'sorcery-spell-matrix', 'sorcery-unavailable'].forEach(magicType => {
      const accordion = html.find(`.magic-accordion[data-magic-type="${magicType}"]`);
      // Default to collapsed if not explicitly set
      if (collapsedSections[magicType] !== false) {
        accordion.addClass('collapsed');
      } else {
        accordion.removeClass('collapsed');
      }
    });
  }

  /**
   * Save accordion state to actor flags
   * @param {string} magicType - The magic type (spirit, divine, sorcery)
   * @param {boolean} isCollapsed - Whether the section is collapsed
   * @private
   */
  async _saveAccordionState(magicType, isCollapsed) {
    const collapsedSections = this.actor.getFlag('runequest3', 'collapsedMagicSections') || {};
    collapsedSections[magicType] = isCollapsed;
    
    await this.actor.setFlag('runequest3', 'collapsedMagicSections', collapsedSections);
  }

  /**
   * Show tooltip for editing sorcery spell invested points
   * @param {Item} spell - The sorcery spell item
   * @param {jQuery} targetElement - The target element
   * @private
   */
  async _showSorcerySpellInvestedTooltip(spell, targetElement) {
    try {
      const invested = spell.system.invested || 0;
      const magicRating = this.actor.system.magic?.magicRating?.value || 0;
      const encumbrance = Math.ceil(this.actor.system.attributes?.encumbrance?.total || 0);
      const totalPercent = Math.max(0, invested + magicRating - encumbrance);
      
      // Remove any existing tooltips first
      $('.rq3-sorcery-spell-tooltip').remove();
      
      const tooltipHtml = `
        <div class="rq3-sorcery-spell-tooltip" style="position: absolute; z-index: 1000; background: rgba(0, 0, 0, 0.95); border: 2px solid var(--rq3-primary); border-radius: 8px; padding: 16px; min-width: 250px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
          <div style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--rq3-light); font-size: 16px;">${spell.name}</h4>
            <div style="color: var(--rq3-text); font-size: 12px;">Edit Invested Points</div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: var(--rq3-text);">Invested:</span>
              <input type="number" class="sorcery-invested-input" value="${invested}" min="0" max="200" style="width: 80px; text-align: center; background: var(--rq3-dark); border: 1px solid var(--rq3-border); color: var(--rq3-light); border-radius: 4px; padding: 4px;">
              <span style="color: var(--rq3-text);">%</span>
            </div>
            
            <div style="border-top: 1px solid var(--rq3-border); padding-top: 8px; margin-top: 8px;">
              <div style="font-size: 11px; color: var(--rq3-text); margin-bottom: 4px;">Breakdown:</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Invested: <span class="breakdown-invested">${invested}</span>%</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Magic Rating: +${magicRating}%</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Encumbrance: -${encumbrance}%</div>
              <div style="font-size: 12px; font-weight: bold; color: var(--rq3-success); margin-top: 4px; border-top: 1px solid var(--rq3-border); padding-top: 4px;">
                Total: <span class="breakdown-total">${totalPercent}</span>%
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="sorcery-invested-save" style="background: var(--rq3-primary); color: var(--rq3-light); border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px;">Save</button>
            <button class="sorcery-invested-cancel" style="background: var(--rq3-dark); color: var(--rq3-text); border: 1px solid var(--rq3-border); border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px;">Cancel</button>
          </div>
        </div>
      `;
      
      const tooltipElement = $(tooltipHtml);
      $('body').append(tooltipElement);
      
      // Position tooltip near the target element
      const targetOffset = targetElement.offset();
      const tooltipWidth = tooltipElement.outerWidth();
      const tooltipHeight = tooltipElement.outerHeight();
      const windowWidth = $(window).width();
      const windowHeight = $(window).height();
      
      let left = targetOffset.left + targetElement.outerWidth() + 10;
      let top = targetOffset.top;
      
      // Adjust if tooltip would go off screen
      if (left + tooltipWidth > windowWidth) {
        left = targetOffset.left - tooltipWidth - 10;
      }
      if (top + tooltipHeight > windowHeight) {
        top = windowHeight - tooltipHeight - 10;
      }
      
      tooltipElement.css({ left: `${left}px`, top: `${top}px` });
      
      // Handle input changes
      const input = tooltipElement.find('.sorcery-invested-input');
      input.on('input', function() {
        const newInvested = parseInt($(this).val()) || 0;
        const newTotal = Math.max(0, newInvested + magicRating - encumbrance);
        tooltipElement.find('.breakdown-invested').text(newInvested);
        tooltipElement.find('.breakdown-total').text(newTotal);
      });
      
      // Handle save button
      tooltipElement.find('.sorcery-invested-save').click(async (e) => {
        e.preventDefault();
        const newInvested = parseInt(input.val()) || 0;
        
        await spell.update({ 'system.invested': newInvested });
        tooltipElement.remove();
        this.render(false);
      });
      
      // Handle cancel button
      tooltipElement.find('.sorcery-invested-cancel').click((e) => {
        e.preventDefault();
        tooltipElement.remove();
      });
      
      // Click away to close
      const clickAwayHandler = (e) => {
        if (!tooltipElement[0].contains(e.target) && !targetElement[0].contains(e.target)) {
          tooltipElement.remove();
          $(document).off('click', clickAwayHandler);
        }
      };
      
      setTimeout(() => {
        $(document).on('click', clickAwayHandler);
      }, 100);
      
    } catch (error) {
      console.error('RQ3 | Error showing sorcery spell invested tooltip:', error);
    }
  }

  /**
   * Show tooltip for editing spirit spell MP
   * @param {Item} spell - The spirit spell item
   * @param {jQuery} targetElement - The target element
   * @private
   */
  async _showSpiritSpellMPTooltip(spell, targetElement) {
    try {
      const currentMP = spell.system.magicPoints || 1;
      const freeIntMax = this.actor.system.magic?.freeInt?.current || 0;
      const otherSpiritSpells = this.actor.items.filter(i => 
        i.type === 'spell' && 
        i.system.spellType === 'spirit' && 
        i.id !== spell.id &&
        (i.system.spellStorageLocation || 'standard') === 'standard'
      );
      const otherTotalMP = otherSpiritSpells.reduce((sum, s) => sum + (s.system.magicPoints || 0), 0);
      const sorcerySpellCount = this.actor.items.filter(i => 
        i.type === 'spell' && 
        i.system.spellType === 'sorcery' &&
        (i.system.spellStorageLocation || 'standard') === 'standard'
      ).length;
      const maxMP = freeIntMax - otherTotalMP - sorcerySpellCount;
      
      // Remove any existing tooltips first
      $('.rq3-spirit-spell-tooltip').remove();
      
      const tooltipHtml = `
        <div class="rq3-spirit-spell-tooltip" style="position: absolute; z-index: 1000; background: rgba(0, 0, 0, 0.95); border: 2px solid var(--rq3-primary); border-radius: 8px; padding: 16px; min-width: 250px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);">
          <div style="margin-bottom: 12px;">
            <h4 style="margin: 0 0 8px 0; color: var(--rq3-light); font-size: 16px;">${spell.name}</h4>
            <div style="color: var(--rq3-text); font-size: 12px;">Edit Magic Points</div>
          </div>
          
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="color: var(--rq3-text);">Magic Points:</span>
              <input type="number" class="spirit-mp-input" value="${currentMP}" min="1" max="${maxMP}" style="width: 80px; text-align: center; background: var(--rq3-dark); border: 1px solid var(--rq3-border); color: var(--rq3-light); border-radius: 4px; padding: 4px;">
              <span style="color: var(--rq3-text);">MP</span>
            </div>
            
            <div style="border-top: 1px solid var(--rq3-border); padding-top: 8px; margin-top: 8px;">
              <div style="font-size: 11px; color: var(--rq3-text); margin-bottom: 4px;">Limits:</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Free INT: ${freeIntMax}</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Other Spirit Spells: ${otherTotalMP} MP</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Sorcery Spells: ${sorcerySpellCount} (1 Free INT each)</div>
              <div style="font-size: 11px; color: var(--rq3-text);">Available: ${maxMP} MP</div>
              <div style="font-size: 12px; font-weight: bold; color: ${maxMP >= currentMP ? 'var(--rq3-success)' : 'var(--rq3-danger)'}; margin-top: 4px; border-top: 1px solid var(--rq3-border); padding-top: 4px;">
                Total Used: <span class="breakdown-total">${otherTotalMP + currentMP + sorcerySpellCount}</span>/${freeIntMax}
              </div>
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button class="spirit-mp-save" style="background: var(--rq3-primary); color: var(--rq3-light); border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px;">Save</button>
            <button class="spirit-mp-cancel" style="background: var(--rq3-dark); color: var(--rq3-text); border: 1px solid var(--rq3-border); border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 12px;">Cancel</button>
          </div>
        </div>
      `;
      
      const tooltipElement = $(tooltipHtml);
      $('body').append(tooltipElement);
      
      // Position tooltip near the target element
      const targetOffset = targetElement.offset();
      const tooltipWidth = tooltipElement.outerWidth();
      const tooltipHeight = tooltipElement.outerHeight();
      const windowWidth = $(window).width();
      const windowHeight = $(window).height();
      
      let left = targetOffset.left + targetElement.outerWidth() + 10;
      let top = targetOffset.top;
      
      // Adjust if tooltip would go off screen
      if (left + tooltipWidth > windowWidth) {
        left = targetOffset.left - tooltipWidth - 10;
      }
      if (top + tooltipHeight > windowHeight) {
        top = windowHeight - tooltipHeight - 10;
      }
      
      tooltipElement.css({ left: `${left}px`, top: `${top}px` });
      
      // Handle input changes
      const input = tooltipElement.find('.spirit-mp-input');
      input.on('input', function() {
        const newMP = parseInt($(this).val()) || 1;
        const newTotal = otherTotalMP + newMP + sorcerySpellCount;
        tooltipElement.find('.breakdown-total').text(newTotal);
        
        // Update color based on limit
        const totalElement = tooltipElement.find('.breakdown-total').parent();
        if (newTotal > freeIntMax) {
          totalElement.css('color', 'var(--rq3-danger)');
        } else {
          totalElement.css('color', 'var(--rq3-success)');
        }
      });
      
      // Handle save button
      tooltipElement.find('.spirit-mp-save').click(async (e) => {
        e.preventDefault();
        const newMP = parseInt(input.val()) || 1;
        const newTotal = otherTotalMP + newMP + sorcerySpellCount;
        
        if (newTotal > freeIntMax) {
          ui.notifications.warn(`Cannot set MP: Total (${otherTotalMP + newMP} MP + ${sorcerySpellCount} sorcery spells) would exceed Free INT (${freeIntMax}).`);
          return;
        }
        
        await spell.update({ 'system.magicPoints': newMP });
        tooltipElement.remove();
        this.render(false);
      });
      
      // Handle cancel button
      tooltipElement.find('.spirit-mp-cancel').click((e) => {
        e.preventDefault();
        tooltipElement.remove();
      });
      
      // Click away to close
      const clickAwayHandler = (e) => {
        if (!tooltipElement[0].contains(e.target) && !targetElement[0].contains(e.target)) {
          tooltipElement.remove();
          $(document).off('click', clickAwayHandler);
        }
      };
      
      setTimeout(() => {
        $(document).on('click', clickAwayHandler);
      }, 100);
      
    } catch (error) {
      console.error('RQ3 | Error showing spirit spell MP tooltip:', error);
    }
  }

  /**
   * Set up window size persistence
   * Saves the window size to actor flags when the user resizes the sheet
   */
  _setupWindowSizePersistence(html) {
    if (!this.actor) return;

    // Debounce function to avoid saving too frequently
    let resizeTimeout;
    const saveSize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(async () => {
        // Get the window element - Foundry wraps sheets in .window-app
        const windowElement = this.element.closest('.window-app');
        if (windowElement.length) {
          const width = windowElement[0].offsetWidth;
          const height = windowElement[0].offsetHeight;
          
          // Only save if dimensions are valid
          if (width > 0 && height > 0) {
            await this.actor.setFlag("runequest3", "sheetSize", { width, height });
          }
        }
      }, 500); // Wait 500ms after resize stops before saving
    };

    // Listen for window resize events using ResizeObserver
    const windowElement = this.element.closest('.window-app');
    if (windowElement.length) {
      // Use ResizeObserver for more accurate detection
      const resizeObserver = new ResizeObserver(saveSize);
      resizeObserver.observe(windowElement[0]);
      
      // Store observer for cleanup if needed
      this._resizeObserver = resizeObserver;
    }
  }
}

/**
 * Character sheet for player characters
 */
export class RQ3CharacterSheet extends RQ3ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["runequest3", "sheet", "actor", "character"],
      width: 900,
      height: 900,
    });
  }

  /** @override */
  get template() {
    return `systems/runequest3/templates/actor/character-sheet.hbs`;
  }
}

/**
 * NPC sheet for non-player characters
 */
export class RQ3NPCSheet extends RQ3ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["runequest3", "sheet", "actor", "npc"],
      width: 600,
      height: 600,
    });
  }

  /** @override */
  get template() {
    return `systems/runequest3/templates/actor/npc-sheet.hbs`;
  }
}

/**
 * Creature sheet for monsters and creatures
 */
export class RQ3CreatureSheet extends RQ3ActorSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["runequest3", "sheet", "actor", "creature"],
      width: 650,
      height: 650,
    });
  }

  /** @override */
  get template() {
    return `systems/runequest3/templates/actor/creature-sheet.hbs`;
  }
} 
