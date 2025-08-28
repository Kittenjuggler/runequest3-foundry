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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
    });
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
            
            // Only apply category bonus if the skill has some value (base or invested)
            let totalValue;
            if (baseValue === 0 && investedValue === 0) {
              // No category bonus for untrained skills with no base value
              totalValue = 0;
            } else {
              totalValue = Math.max(0, baseValue + investedValue + categoryBonus);
            }
            
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
      stealth: 0
    };

    const characteristics = context.system.characteristics;
    
    // Helper functions for influence calculations
    const calculatePrimaryInfluence = (charValue) => {
      return charValue - 10; // +1 per point above 10, -1 per point below 10
    };
    
    const calculateSecondaryInfluence = (charValue) => {
      const effectiveValue = Math.min(charValue, 30); // Ignore points above 30
      const modifier = Math.floor((effectiveValue - 10) / 2); // +1 per 2 points above 10
      return Math.max(-10, Math.min(10, modifier)); // Cap at +/-10%
    };
    
    const calculateNegativeInfluence = (charValue) => {
      return 10 - charValue; // -1 per point above 10, +1 per point below 10
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
    const runes = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
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
      }
      // Append to runes.
      else if (i.type === 'rune') {
        runes.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.weapons = weapons;
    context.armor = armor;
    context.skills = skills;
    context.spells = spells;
    context.runes = runes;
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

    // Quantity control handlers
    html.find('.qty-up').click(this._onQuantityUp.bind(this));
    html.find('.qty-down').click(this._onQuantityDown.bind(this));

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Characteristic x5 rolls
    html.find('.characteristic-roll-x5').click(this._onCharacteristicRollX5.bind(this));

    // Characteristic custom multiplier rolls
    html.find('.characteristic-roll-custom').click(this._onCharacteristicRollCustom.bind(this));

    // Reset current values
    html.find('.reset-current-values').click(this._onResetCurrentValues.bind(this));

    // Prevent dice rolling when pressing Enter in character name input
    html.find('.charname input[name="name"]').keydown(this._onCharacterNameKeydown.bind(this));

    // Prevent dice rolling when pressing Enter in skill value inputs
    html.find('.rq3-skill-value-edit').keydown(this._onSkillInputKeydown.bind(this));

    // Global edit mode toggle
    html.find('.global-edit-mode-toggle').change(this._onGlobalEditModeToggle.bind(this));

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
    html.find('.carried-items-grid, .worn-items-grid, .empty-carried-drop-zone, .bag-items-list, .empty-bag-drop-zone').each((i, element) => {
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
    });

    // Make worn items draggable
    const wornItems = html.find('.worn-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found worn items:', wornItems.length);
    wornItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up worn item:', element.dataset.itemId, element.dataset.itemType);
      element.setAttribute('draggable', 'true');
      element.addEventListener('dragstart', this._onCarriedItemDragStart.bind(this));
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
    });

    // Make equipped armor items draggable (for dragging back to carried)
    const equippedItems = html.find('.equipped-item');
    console.log('RQ3 | _setupEquipmentDragAndDrop - Found equipped items:', equippedItems.length);
    equippedItems.each((i, element) => {
      console.log('RQ3 | _setupEquipmentDragAndDrop - Setting up equipped item:', element.dataset.itemId, element.dataset.itemType);
      element.setAttribute('draggable', 'true');
      element.addEventListener('dragstart', this._onCarriedItemDragStart.bind(this));
      element.addEventListener('dragend', this._onCarriedItemDragEnd.bind(this));
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
    });

    // Ensure buttons within draggable items don't interfere
    html.find('.carried-item button, .worn-item button, .equipped-item button, .bag-item button').each((i, button) => {
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
    
    // Check if the drag started from a button - if so, prevent drag
    if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
      console.log('RQ3 | _onCarriedItemDragStart - Preventing drag due to button');
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
      
      // Apply the calculated armor points
      for (const [hitLocation, armorPoints] of Object.entries(hitLocations)) {
        if (armorPoints > 0) {
          const currentPath = `system.hitLocations.${hitLocation}.armor`;
          updateData[currentPath] = Math.max(
            updateData[currentPath],
            armorPoints
          );
        }
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
    const element = event.currentTarget;
    const characteristic = element.dataset.characteristic;

    console.log("RQ3 | _onCharacteristicRollCustom triggered. this.editMode is:", this.editMode);
    // Prevent rolls if in edit mode
    if (this.editMode) {
      console.log("RQ3 | Characteristic Custom roll prevented: Edit mode is active.");
      return;
    }
    
    if (characteristic) {
      await this.actor.rollCharacteristicCustom(characteristic);
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
  _onGlobalEditModeToggle(event) {
    event.preventDefault();
    const newEditModeState = !this.editMode;
    console.log(`RQ3 | Manual toggle initiated. Current this.editMode: ${this.editMode}, Target new state: ${newEditModeState}`);
    this._updateEditModeDOM(newEditModeState, true); // Pass true for isManualToggle
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
    
    // First try to find the system species compendium
    let compendium = game.packs.get("runequest3.species");
    
    if (!compendium) {
      // Fallback: look for "RQ3 Species" compendium
      compendium = game.packs.find(p => p.metadata.label === "RQ3 Species");
    }
    
    if (!compendium) {
      // Final fallback: look for any compendium with species
      compendium = game.packs.find(p => 
        p.metadata.type === "Item" && 
        p.metadata.label.toLowerCase().includes("species")
      );
    }
    
    if (compendium) {
      // Open the compendium
      compendium.render(true);
      ui.notifications.info("Opening species compendium. Drag a species onto this field.");
      console.log("Opened compendium:", compendium.metadata.label);
    } else {
      ui.notifications.warn("No species compendium found. Please create species items in the Items directory.");
      console.log("Available compendiums:", game.packs.map(p => ({ id: p.collection, label: p.metadata.label, type: p.metadata.type })));
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
      
      if (event.currentTarget.classList.contains('empty-bag-drop-zone') || 
          event.currentTarget.classList.contains('bag-items-list') ||
          event.currentTarget.dataset.storageLocation === 'bag') {
        targetStorageLocation = 'bag';
      } else if (event.currentTarget.classList.contains('empty-carried-drop-zone') || 
                 event.currentTarget.classList.contains('carried-items-list') ||
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

        // Update storage location for unequipped armor
        await item.update({ 'system.storageLocation': targetStorageLocation });
        ui.notifications.info(`Moved ${item.name} to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
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

        // Update storage location
        await item.update({ 'system.storageLocation': targetStorageLocation });
        ui.notifications.info(`Moved ${item.name} to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
      } else {
        // For other items, update equipped status and storage location
        const wasEquipped = item.system.equipped;
        const currentStorageLocation = item.system.storageLocation || 'carried';

        // If the item was equipped, unequip it
        if (wasEquipped) {
          await item.update({
            'system.equipped': false,
            'system.storageLocation': targetStorageLocation
          });
          ui.notifications.info(`Unequipped ${item.name} and moved to ${targetStorageLocation === 'bag' ? 'bag' : 'carried equipment'}`);
        } else if (currentStorageLocation !== targetStorageLocation) {
          // Just change storage location
          await item.update({ 'system.storageLocation': targetStorageLocation });
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
      
      // Update the equipped weapons
      const updateData = {};
      updateData[`system.equippedWeapons.${location}`] = item.id;
      
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
