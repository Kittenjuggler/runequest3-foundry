/**
 * Extend the basic ItemSheet with some very simple modifications
 */
export class RQ3ItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["runequest3", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    return `systems/runequest3/templates/item/item-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = this.item.toObject(false);

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    // Add configuration data
    context.config = CONFIG.RQ3;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Auto-populate armor data when type or location changes
    if (this.item.type === "armor") {
      html.find('select[name="system.armorType"]').change(this._onArmorTypeChange.bind(this));
      html.find('select[name="system.armorLocation"]').change(this._onArmorLocationChange.bind(this));
      
      // Auto-populate on initial load
      this._populateArmorData();
    }

    // Roll handlers, click handlers, etc. would go here.
  }

  /* -------------------------------------------- */

  /**
   * Handle changes to armor type
   * @param {Event} event   The originating change event
   * @private
   */
  _onArmorTypeChange(event) {
    event.preventDefault();
    this._populateArmorData();
  }

  /**
   * Handle changes to armor location
   * @param {Event} event   The originating change event
   * @private
   */
  _onArmorLocationChange(event) {
    event.preventDefault();
    this._populateArmorData();
  }

  /**
   * Auto-populate armor data based on type and location
   * @private
   */
  async _populateArmorData() {
    if (this.item.type !== "armor") return;

    const armorType = this.item.system.armorType;
    const armorLocation = this.item.system.armorLocation;

    // Skip auto-population for shields or if required data is missing
    if (armorType === "shield" || !armorType || !armorLocation) return;

    // Calculate hit locations
    const hitLocations = CONFIG.RQ3.populateArmorHitLocations(armorType, armorLocation);

    // Calculate encumbrance (using medium size as default for items)
    const sizeCategory = "medium"; // Default for standalone items
    const encumbrance = CONFIG.RQ3.calculateArmorEncumbrance(armorType, armorLocation, sizeCategory);

    // Calculate cost
    const cost = CONFIG.RQ3.calculateArmorCost(armorType, armorLocation, sizeCategory);

    // Update the item
    await this.item.update({
      "system.hitLocations": hitLocations,
      "system.encumbrance": encumbrance,
      "system.price.value": cost
    });
  }
} 