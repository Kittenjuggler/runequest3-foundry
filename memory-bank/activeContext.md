# Active Context - RuneQuest 3 Foundry VTT System

## Current Development Focus
- ✅ **Equipment drag-and-drop with container support fully implemented**
- ✅ **Container accordion functionality working**
- ✅ **Character name edit mode toggle implemented**
- ✅ **Magic point deduction system for spell casting implemented**
- ✅ **Magic section visibility toggles added**
- ✅ **Hit location rolls integrated with attacks and offensive spells**
- ✅ **Compendium migration system with version tracking implemented**
- ✅ **Compendium export tool created (console-based)**
- ✅ **World compendium organization macro created**

## Recent Changes

### Equipment System (Latest)
- ✅ **Container drag-and-drop**: Items can be dragged into containers, visually indented
- ✅ **Item reordering**: Items can be reordered within containers and main sections
- ✅ **Container toggle**: Containers can be expanded/collapsed with arrow button
- ✅ **Drop zone indicators**: Green lines show where items will drop during drag
- ✅ **Container state persistence**: Expanded/collapsed state saved to actor data
- ✅ **Move items out**: Items can be dragged from containers back to main inventory

### Character Sheet UI
- ✅ **Character name edit mode**: Name only editable when edit toggle is on
- ✅ **Character name alignment**: Text left-aligned for better readability
- ✅ **Magic section visibility**: Spirit/Divine/Sorcery sections can be hidden in edit mode
- ✅ **Visibility persistence**: Section visibility state saved to actor data
- ✅ **Conditional visibility controls**: Only show hide/show buttons if section is empty

### Magic System Enhancements
- ✅ **Magic point deduction**: MP automatically deducted based on spell casting results
  - Critical: 1 MP
  - Success/Special: Allocated MP
  - Failure: 1 MP
  - Fumble: Allocated MP
- ✅ **Reset to max MP**: Button in MP tooltip to restore MP to maximum
- ✅ **Hit location rolls**: d20 roll for hit location on successful attacks/offensive spells
  - Melee attacks use melee hit location table (01-04 Right Leg, 05-08 Left Leg, etc.)
  - Ranged/spells use ranged table (01-03 Right Leg, 04-06 Left Leg, etc.)
- ✅ **Offensive spell flag**: Checkbox in spell config to mark spells as offensive
- ✅ **Dice sound for context menu rolls**: Roll sound now plays for right-click skill rolls

### Compendium System
- ✅ **Version tracking**: Each compendium tracks its version to prevent redundant imports
- ✅ **Automatic migration**: Compendiums auto-update when system version changes
- ✅ **Species, Spirit Magic, Divine Magic, Sorcery, Weapons, Armour**: All tracked separately
- ✅ **Compendium export tool**: Console command `game.rq3.exportCompendium(packId)` to export as JSON
- ✅ **Compendium styling**: Dark grey backgrounds, banner images hidden
- ✅ **World compendium macro**: `macros/organize-weapons-compendium.js` creates organized world compendium

### Previous Changes
- ✅ **Compact header completely removed and all header change functionality eliminated**
- ✅ **Luck characteristic added to the system (str, con, siz, int, pow, dex, app, luck)**
- ✅ **Training ticks for skills and POW now manually controlled by user clicks**
- ✅ **Magic tab spell sections now support drag-and-drop functionality**
- ✅ **Spirit Magic casting rating: POW × 5 - ENC penalty**
- ✅ **Divine Magic casting rating: 100% - ENC penalty (96-00% always fumbles)**

## Active Decisions and Considerations

### Foundry VTT v13 Compendium Architecture
**CRITICAL LEARNING**: System compendiums are **locked** and cannot have folders created/deleted programmatically.

**Key Constraints:**
- System compendiums are read-only for folder management
- Folders in compendiums are world-level entities, not pack-level
- Attempting to create folders in system compendiums will fail silently or error
- `Folder.createDocuments()` with `pack` option doesn't work for system compendiums

**Solution Implemented:**
- ✅ **System compendiums**: Simple flat list, no folder management
- ✅ **World compendiums**: Use macro to create organized, editable versions
- ✅ **Macro-based organization**: `macros/organize-weapons-compendium.js` creates world compendium with folders
- ✅ **Version tracking**: Prevents redundant imports on every page load

### Console Commands and Tools

**Compendium Export:**
```javascript
// Export any compendium as JSON
game.rq3.exportCompendium("runequest3.weapons")
```
- Opens new browser tab with formatted JSON
- Includes all item data and folder structure
- Useful for backing up or editing compendium data externally

**Compendium Organization:**
- Use the macro in `macros/organize-weapons-compendium.js`
- Creates "Weapons (Organized)" world compendium
- Automatically organizes weapons into folders by skill (Blade, Blunt, Bow, etc.)
- Fully editable, no lock restrictions

### Equipment Container System
- ✅ **Drag-and-drop**: Items can be moved into/out of containers
- ✅ **Visual indentation**: Items inside containers are indented for clarity
- ✅ **Drop zones**: Green indicator lines show valid drop positions
- ✅ **Reordering**: Items can be reordered within containers and main sections
- ✅ **State persistence**: Container expanded/collapsed state saved to `actor.system.containerStates`
- ✅ **Data model**: Items have `system.containerId` to track container membership

### Magic System Implementation
- ✅ **MP deduction**: Automatic based on casting result (critical: 1, success: allocated, failure: 1, fumble: allocated)
- ✅ **Hit location integration**: d20 roll on successful attacks/offensive spells
- ✅ **Two hit location tables**: Melee (01-04, 05-08, 09-11, 12, 13-15, 16-18, 19-20) vs Ranged/Spell (01-03, 04-06, 07-10, 11-15, 16-17, 18-19, 20)
- ✅ **Offensive spell flag**: `item.system.offensive` boolean controls hit location roll
- ✅ **Section visibility**: `actor.system.magicVisibility` tracks which sections are hidden
- ✅ **Conditional hiding**: Only allow hiding sections if they contain no spells

### UI/UX Patterns
- ✅ **Edit mode gating**: Character name, magic visibility controls only available in edit mode
- ✅ **State persistence without re-render**: Use `{ render: false }` and manual DOM updates
- ✅ **Tooltip system**: Hover tooltips for stats (MP, encumbrance, etc.) with action buttons
- ✅ **Dice sound integration**: `sound: CONFIG.sounds.dice` and `rolls: [roll]` in chat messages

## Next Steps
1. **Immediate**: Continue with any additional feature requests or bug fixes
2. **Short-term**: Test all recent implementations thoroughly
3. **Medium-term**: Add spell effects and automation
4. **Long-term**: Enhance magic system with ritual casting and spell manipulation

## Technical Notes

### Compendium Management
- **System compendiums are locked** in Foundry v13 - cannot programmatically manage folders
- **Version tracking**: Each compendium has a setting (e.g., `weaponsCompendiumVersion`) to prevent re-import
- **Migration pattern**: Check version, skip if current, update items, set new version
- **Export tool**: `game.rq3.exportCompendium(packId)` - opens JSON in new tab
- **World compendium macro**: Creates organized, editable copy with folders by skill

### Container System
- **Data structure**: `item.system.containerId` stores parent container ID
- **State persistence**: `actor.system.containerStates` tracks expanded/collapsed
- **Drop zones**: Dynamically created divs with `data-container-id` and `data-target-sort`
- **Visual feedback**: `.drag-over` class for valid drops, `.invalid-drop` for invalid
- **Reordering logic**: Compares `containerId`, `storageLocation`, and `sort` values

### Magic System
- **MP deduction**: Handled in `_onSpellCast()` based on `RQ3Actor.calculateRollResult()`
- **Hit location**: `_rollHitLocation(attackType)` returns roll, location, description
- **Offensive detection**: `item.system.offensive` boolean flag
- **Section visibility**: `actor.system.magicVisibility.spirit/divine/sorcery` booleans
- **Render optimization**: Use `{ render: false }` and manual DOM updates to prevent edit mode reset

### Event Handling Patterns
- **Delayed handlers**: Use `setTimeout()` for click-outside handlers to prevent immediate triggering
- **Event delegation**: Attach listeners to parent elements for dynamic content
- **State management**: Update actor data with `actor.update()`, use `{ render: false }` when needed
- **Manual DOM updates**: Use jQuery to update specific elements without full re-render

### Chat Message Integration
- **Dice sound**: Include `sound: CONFIG.sounds.dice` in message data
- **Multiple rolls**: Use `rolls: [roll1, roll2]` array for multiple dice (e.g., attack + hit location)
- **Roll results**: Use `RQ3Actor.calculateRollResult(roll, targetNumber)` for consistent result determination
