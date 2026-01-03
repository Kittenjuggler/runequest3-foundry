# Console Commands Reference - RuneQuest 3 Foundry VTT System

## Quick Reference

### Compendium Export

Export any compendium as formatted JSON:

```javascript
game.rq3.exportCompendium("runequest3.weapons")
```

**Available Compendium IDs:**
- `"runequest3.species"` - Character species/races
- `"runequest3.spiritmagic"` - Spirit magic spells
- `"runequest3.divinemagic"` - Divine magic spells
- `"runequest3.sorcery"` - Sorcery spells
- `"runequest3.weapons"` - Weapons
- `"runequest3.armour"` - Armor pieces

**Output:**
- Opens in new browser tab
- Formatted JSON with 2-space indentation
- Includes all item data and folder structure
- Ready to copy/paste for external editing

### Force Compendium Migration

Force a specific compendium to re-import (useful for testing):

```javascript
// Reset version to force migration
await game.settings.set("runequest3", "weaponsCompendiumVersion", "0.0.0");

// Reload to trigger migration
location.reload();
```

**Available Version Settings:**
- `"speciesCompendiumVersion"`
- `"spiritMagicCompendiumVersion"`
- `"divineMagicCompendiumVersion"`
- `"sorceryCompendiumVersion"`
- `"weaponsCompendiumVersion"`
- `"armourCompendiumVersion"`

### Check Current Versions

See what version each compendium is at:

```javascript
console.log("System Version:", game.system.version);
console.log("Species:", game.settings.get("runequest3", "speciesCompendiumVersion"));
console.log("Spirit Magic:", game.settings.get("runequest3", "spiritMagicCompendiumVersion"));
console.log("Divine Magic:", game.settings.get("runequest3", "divineMagicCompendiumVersion"));
console.log("Sorcery:", game.settings.get("runequest3", "sorceryCompendiumVersion"));
console.log("Weapons:", game.settings.get("runequest3", "weaponsCompendiumVersion"));
console.log("Armour:", game.settings.get("runequest3", "armourCompendiumVersion"));
```

## Macro-Based Tools

### Organize Weapons Compendium

**Location:** `macros/organize-weapons-compendium.js`

**How to Use:**
1. Open Foundry VTT as GM
2. Go to Macro Directory
3. Create new "Script" macro
4. Copy contents of `macros/organize-weapons-compendium.js`
5. Save and run the macro

**What It Does:**
- Creates "Weapons (Organized)" world compendium
- Copies all weapons from system compendium
- Organizes into folders by skill:
  - Blade
  - Blunt
  - Close Combat
  - Bow
  - Crossbow
  - Dart
  - Sling
  - Staff Sling
  - Shield
  - Spear
  - Rock
  - Net
- Prompts before overwriting existing compendium
- Fully editable (no lock restrictions)

**Benefits:**
- System compendium stays locked and clean
- World compendium is fully customizable
- Easy to add/remove/edit weapons
- Organized for quick reference

## Debugging Commands

### Check Actor Data

View current actor's data structure:

```javascript
// Get selected token's actor
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
  console.log("Actor Data:", actor.system);
  console.log("Container States:", actor.system.containerStates);
  console.log("Magic Visibility:", actor.system.magicVisibility);
}
```

### Check Item Data

View an item's data structure:

```javascript
// Get first item from selected actor
const actor = canvas.tokens.controlled[0]?.actor;
const item = actor?.items.contents[0];
if (item) {
  console.log("Item Data:", item.system);
  console.log("Container ID:", item.system.containerId);
  console.log("Storage Location:", item.system.storageLocation);
}
```

### List All Compendiums

See all available compendium packs:

```javascript
game.packs.forEach(pack => {
  console.log(`${pack.collection}: ${pack.metadata.label} (${pack.documentName})`);
});
```

### Test Roll Calculation

Test the roll result calculation:

```javascript
const roll = await new Roll("1d100").evaluate();
const targetNumber = 65;
const result = CONFIG.RQ3.Actor.calculateRollResult(roll, targetNumber);
console.log(`Roll: ${roll.total}, Target: ${targetNumber}, Result: ${result}`);
```

## Utility Functions

### Bulk Update Items

Update all items of a specific type:

```javascript
// Example: Mark all swords as offensive
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
  const swords = actor.items.filter(i => 
    i.type === 'weapon' && i.name.toLowerCase().includes('sword')
  );
  
  for (const sword of swords) {
    await sword.update({ 'system.offensive': true });
  }
  
  console.log(`Updated ${swords.length} swords`);
}
```

### Reset All Container States

Expand all containers:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
  const containers = actor.items.filter(i => i.type === 'equipment' && i.system.isContainer);
  const containerStates = {};
  
  containers.forEach(c => {
    containerStates[c.id] = true; // true = expanded
  });
  
  await actor.update({ 'system.containerStates': containerStates });
  console.log(`Reset ${containers.length} container states`);
}
```

### Clear Magic Visibility Settings

Reset all magic sections to visible:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
  await actor.update({
    'system.magicVisibility': {
      spirit: true,
      divine: true,
      sorcery: true
    }
  });
  console.log("Reset magic visibility");
}
```

## Advanced Usage

### Create Custom Compendium

Create a new world compendium programmatically:

```javascript
const newPack = await CompendiumCollection.createCompendium({
  label: "My Custom Items",
  type: "Item",
  package: "world"
});

console.log("Created compendium:", newPack.collection);
```

### Import Item to Compendium

Add an item from an actor to a compendium:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;
const item = actor?.items.getName("Broadsword");
const pack = game.packs.get("world.my-custom-items");

if (item && pack) {
  await pack.importDocument(item);
  console.log(`Imported ${item.name} to ${pack.metadata.label}`);
}
```

### Batch Export All Compendiums

Export all RQ3 compendiums at once:

```javascript
const rq3Packs = [
  "runequest3.species",
  "runequest3.spiritmagic",
  "runequest3.divinemagic",
  "runequest3.sorcery",
  "runequest3.weapons",
  "runequest3.armour"
];

for (const packId of rq3Packs) {
  console.log(`Exporting ${packId}...`);
  game.rq3.exportCompendium(packId);
  // Wait a moment between exports
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

## Troubleshooting

### Compendium Not Updating

If a compendium isn't updating after changes:

```javascript
// 1. Check current version
console.log("Current:", game.settings.get("runequest3", "weaponsCompendiumVersion"));
console.log("System:", game.system.version);

// 2. Force reset
await game.settings.set("runequest3", "weaponsCompendiumVersion", "0.0.0");

// 3. Reload
location.reload();
```

### Container State Issues

If containers aren't expanding/collapsing:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;
console.log("Container States:", actor.system.containerStates);

// Reset if needed
await actor.update({ 'system.containerStates': {} });
```

### Magic Visibility Not Working

If magic sections aren't hiding/showing:

```javascript
const actor = canvas.tokens.controlled[0]?.actor;
console.log("Magic Visibility:", actor.system.magicVisibility);

// Check if data model is defined
console.log("Has magicVisibility field:", 'magicVisibility' in actor.system);
```




