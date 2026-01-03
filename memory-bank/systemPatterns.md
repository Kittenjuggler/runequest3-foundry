# System Patterns - RuneQuest 3 Foundry VTT System

## Architecture Overview

### Document Structure
- **Actors**: Characters, NPCs, Creatures
- **Items**: Weapons, Armor, Spells, Equipment, Skills, Runes
- **Data Models**: Type-safe data structures with validation
- **Sheet Applications**: UI layer for actors and items

### Key Design Patterns

**Separation of Concerns:**
- Data models define structure and validation
- Document classes handle business logic
- Sheet applications manage UI and events
- Templates handle presentation

**Event-Driven Architecture:**
- Foundry hooks for lifecycle events
- Event delegation for dynamic content
- Custom events for inter-component communication

## Drag-and-Drop System

### Equipment Containers

**Data Structure:**
```javascript
// Item data
item.system.containerId  // ID of parent container or null
item.system.storageLocation  // "carried", "worn", "stored"
item.sort  // Sort order for positioning

// Actor data
actor.system.containerStates  // { [containerId]: boolean } for expanded/collapsed
```

**Drop Zones:**
- Dynamically created divs between item rows
- `data-container-id`: Container ID or empty string for top-level
- `data-target-sort`: Sort value for positioning
- `.drag-over` class for visual feedback

**Event Flow:**
1. `dragstart`: Store item data in `event.dataTransfer`
2. `dragenter`/`dragover`: Add visual feedback, prevent default
3. `dragleave`: Remove visual feedback
4. `drop`: Update item data, re-sort siblings, re-render

**Key Methods:**
- `_insertReorderDropZones()`: Creates drop zone divs
- `_onItemRowDragStart()`: Initiates drag
- `_onDropZoneDrop()`: Handles drop and data updates

### Magic Spell Sections

**Type Validation:**
```javascript
// Only allow spells in matching section
if (item.type === 'spell' && item.system.spellType === sectionType) {
  // Allow drop
} else {
  // Reject drop
}
```

**Section Types:**
- `spirit`: Spirit Magic
- `divine`: Divine Magic
- `sorcery`: Sorcery

## Magic System

### Casting Rating Calculation

**Spirit Magic:**
```javascript
const rating = (actor.system.characteristics.pow.value * 5) - encPenalty;
```

**Divine Magic:**
```javascript
const rating = 100 - encPenalty;
// Note: 96-00 always fumbles regardless of rating
```

**Sorcery:**
```javascript
// Uses INT-based calculation (existing implementation)
```

### Magic Point Deduction

**Rules:**
- **Critical**: 1 MP spent
- **Success/Special**: Allocated MP spent
- **Failure**: 1 MP spent
- **Fumble**: Allocated MP spent

**Implementation:**
```javascript
const result = RQ3Actor.calculateRollResult(roll, castingRating);
let mpCost = 1; // Default for critical/failure

if (result === 'success' || result === 'special' || result === 'fumble') {
  mpCost = allocatedMP;
}

await actor.update({
  'system.magicPoints.value': Math.max(0, currentMP - mpCost)
});
```

### Hit Location Rolls

**When to Roll:**
- Successful weapon attack (melee or ranged)
- Successful offensive spell cast

**Tables:**

**Melee (d20):**
- 01-04: Right Leg
- 05-08: Left Leg
- 09-11: Abdomen
- 12: Chest
- 13-15: Right Arm
- 16-18: Left Arm
- 19-20: Head

**Ranged/Spell (d20):**
- 01-03: Right Leg
- 04-06: Left Leg
- 07-10: Abdomen
- 11-15: Chest
- 16-17: Right Arm
- 18-19: Left Arm
- 20: Head

**Implementation:**
```javascript
async _rollHitLocation(attackType) {
  const roll = await new Roll("1d20").evaluate();
  const result = roll.total;
  const table = attackType === "melee" ? meleeTable : rangedTable;
  
  // Find location based on result
  for (const [range, location] of table) {
    if (result >= range[0] && result <= range[1]) {
      return { roll, location, description };
    }
  }
}
```

## UI State Management

### Edit Mode Toggle

**Pattern:**
```javascript
// In template
{{#if editMode}}
  <input class="charname-edit" value="{{actor.name}}" />
{{else}}
  <span class="charname-display">{{actor.name}}</span>
{{/if}}
```

**CSS:**
```css
.charname-edit { display: none; }
.charname-display { display: inline; }

.edit-mode .charname-edit { display: inline; }
.edit-mode .charname-display { display: none; }
```

### State Persistence Without Re-render

**Problem:** Full re-render resets edit mode and other UI state

**Solution:**
```javascript
// Update data without triggering re-render
await actor.update({
  'system.magicVisibility.spirit': !currentState
}, { render: false });

// Manually update DOM
const icon = button.find('i');
icon.removeClass('fa-eye fa-eye-slash');
icon.addClass(newState ? 'fa-eye' : 'fa-eye-slash');
```

### Container Accordion

**State Storage:**
```javascript
actor.system.containerStates = {
  [containerId]: true,  // expanded
  [containerId2]: false // collapsed
}
```

**Toggle Logic:**
```javascript
async _onContainerToggle(event) {
  const containerId = event.currentTarget.dataset.containerId;
  const currentState = this.actor.system.containerStates?.[containerId] ?? true;
  
  await this.actor.update({
    [`system.containerStates.${containerId}`]: !currentState
  });
}
```

## Tooltip System

### Stat Tooltips

**Pattern:**
```javascript
showMagicStatTooltip(statType, targetElement, editMode = false) {
  // Create tooltip div
  const tooltip = $('<div class="stat-tooltip"></div>');
  
  // Add content
  tooltip.html(content);
  
  // Position near target
  tooltip.css({
    top: targetElement.offset().top + targetElement.outerHeight(),
    left: targetElement.offset().left
  });
  
  // Append to body
  $('body').append(tooltip);
  
  // Click-outside handler (delayed)
  setTimeout(() => {
    $(document).on('click.stat-tooltip', (e) => {
      if (!$(e.target).closest('.stat-tooltip, .stat-value').length) {
        tooltip.remove();
        $(document).off('click.stat-tooltip');
      }
    });
  }, 100);
}
```

**Key Points:**
- Delayed click-outside handler prevents immediate closing
- Positioned relative to target element
- Cleaned up on close to prevent memory leaks

## Compendium Management

### Version Tracking

**Settings Registration:**
```javascript
game.settings.register("runequest3", "weaponsCompendiumVersion", {
  scope: "world",
  config: false,
  type: String,
  default: "0.0.0"
});
```

**Migration Pattern:**
```javascript
async function migrateWeaponsCompendium() {
  const systemVersion = game.system.version;
  const compendiumVersion = game.settings.get("runequest3", "weaponsCompendiumVersion");
  
  // Skip if up to date
  if (compendiumVersion === systemVersion) {
    return;
  }
  
  // Perform migration...
  
  // Update version
  await game.settings.set("runequest3", "weaponsCompendiumVersion", systemVersion);
}
```

### Export Utility

**Global Function:**
```javascript
game.rq3 = game.rq3 || {};
game.rq3.exportCompendium = async function(packId) {
  const pack = game.packs.get(packId);
  const documents = await pack.getDocuments();
  const data = documents.map(doc => doc.toObject());
  
  // Open in new tab
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};
```

**Usage:**
```javascript
game.rq3.exportCompendium("runequest3.weapons")
```

## Chat Integration

### Dice Rolls with Sound

**Pattern:**
```javascript
await ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ actor: this.actor }),
  flavor: `<strong>${skillName}</strong>`,
  rolls: [roll],  // Array of Roll objects
  sound: CONFIG.sounds.dice,
  content: `<div>Result: ${result}</div>`
});
```

**Multiple Rolls:**
```javascript
const attackRoll = await new Roll("1d100").evaluate();
const hitLocationRoll = await new Roll("1d20").evaluate();

await ChatMessage.create({
  rolls: [attackRoll, hitLocationRoll],
  sound: CONFIG.sounds.dice,
  content: `
    <div>Attack: ${attackResult}</div>
    <div>Hit Location: ${location}</div>
  `
});
```

## Data Model Patterns

### Character Data Extensions

**Adding New Fields:**
```javascript
// In data-models.mjs
class CharacterDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      // ... existing fields
      containerStates: new foundry.data.fields.ObjectField(),
      magicVisibility: new foundry.data.fields.ObjectField({
        initial: {
          spirit: true,
          divine: true,
          sorcery: true
        }
      })
    };
  }
}
```

### Item Data Extensions

**Spell Fields:**
```javascript
class SpellDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      // ... existing fields
      offensive: new foundry.data.fields.BooleanField({
        initial: false
      }),
      magicPoints: new foundry.data.fields.NumberField({
        initial: 1,
        min: 0
      })
    };
  }
}
```

## Handlebars Helpers

### Custom Helpers

**Equality Check:**
```javascript
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});
```

**Logical OR:**
```javascript
Handlebars.registerHelper('or', function(...args) {
  return args.slice(0, -1).some(Boolean);
});
```

**Logical NOT:**
```javascript
Handlebars.registerHelper('not', function(value) {
  return !value;
});
```

**Usage in Templates:**
```handlebars
{{#if (eq item.system.spellType "spirit")}}
  <!-- Spirit magic specific content -->
{{/if}}

{{#if (or editMode isGM)}}
  <!-- Show for edit mode or GM -->
{{/if}}

{{#if (not system.magicVisibility.spirit)}}
  <!-- Hidden section -->
{{/if}}
```

## Performance Optimization

### Lazy Loading

**Pattern:**
```javascript
// Only load data when needed
async getData() {
  const data = await super.getData();
  
  // Lazy load heavy data
  if (this.isExpanded) {
    data.heavyData = await this.loadHeavyData();
  }
  
  return data;
}
```

### Selective Re-rendering

**Pattern:**
```javascript
// Update specific DOM elements instead of full re-render
async _onQuickUpdate(event) {
  const newValue = event.target.value;
  
  // Update data
  await this.actor.update({
    'system.someValue': newValue
  }, { render: false });
  
  // Update specific DOM element
  this.element.find('.some-display').text(newValue);
}
```

## Error Handling

### Graceful Degradation

**Pattern:**
```javascript
try {
  // Attempt operation
  await riskyOperation();
} catch (error) {
  console.error("RQ3 | Operation failed:", error);
  ui.notifications.warn("Operation failed. See console for details.");
  // Provide fallback or default behavior
}
```

### Validation

**Pattern:**
```javascript
function validateInput(value, min, max) {
  if (typeof value !== 'number') {
    console.warn("RQ3 | Invalid input type");
    return min;
  }
  return Math.max(min, Math.min(max, value));
}
```




