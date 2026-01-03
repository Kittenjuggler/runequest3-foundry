# Compendium Source Data

This directory contains JSON source files for all compendium packs, following the Pathfinder 2e pattern.

## File Structure

Each compendium pack has a corresponding JSON file:
- `weapons.json` - Weapon definitions
- `armour.json` - Armor definitions
- `species.json` - Character species/races
- `magic.json` - All magic spells (Spirit Magic, Divine Magic, and Sorcery combined)

## JSON Format

Each JSON file follows this structure:

```json
{
  "itemKey": {
    "version": "1.0.6",
    "folder": "Folder Name",
    "data": {
      "name": "Item Name",
      "type": "itemType",
      "img": "path/to/image.webp",
      "system": {
        // Item-specific system data
      }
    }
  }
}
```

### Folder Support

Items can optionally specify a `folder` property to organize them into folders when creating world compendiums:
- `"folder": "Blade"` - Places the item in a "Blade" folder
- If no folder is specified, the system will attempt to determine the folder from the item's data (e.g., weaponType for weapons)
- Folders are only created in world compendiums (system compendiums cannot have folders)

## Benefits of JSON Files

1. **Version Control Friendly**: JSON files are easier to diff and merge in Git
2. **Editor Support**: Better syntax highlighting and validation in most editors
3. **External Tools**: Can be easily processed by external scripts or tools
4. **Industry Standard**: Matches the approach used by Pathfinder 2e and other major systems
5. **Backward Compatible**: System falls back to `.mjs` files if JSON is not found

## Migration from .mjs Files

The system supports both JSON and `.mjs` files:
- **JSON files** (in `packs/runequest3/data/`) are loaded first
- **Fallback to .mjs** files (in `module/`) if JSON is not found
- This allows gradual migration without breaking existing functionality

## Converting .mjs to JSON

To convert an existing `.mjs` data file to JSON:

1. Export the data from the `.mjs` file (it's already a JavaScript object)
2. Use `JSON.stringify(data, null, 2)` to format it
3. Save as `{packname}.json` in this directory
4. The migration functions will automatically use the JSON file

Example conversion:
```javascript
// In module/rq3-weapons-data.mjs
export const RQ3_WEAPONS_DATA = { ... };

// Convert to packs/runequest3/data/weapons.json
{
  "hatchet": { ... },
  "sapergis": { ... }
}
```

## Testing Folders

To test folder organization from JSON data, use the console command:

```javascript
game.rq3.testFoldersFromJSON()
```

This will:
1. Load weapons data from `weapons.json`
2. Create a world compendium called "Weapons (JSON with Folders)"
3. Organize items into folders based on the `folder` property in the JSON
4. For weapons without a folder property, automatically determine folder from `weaponType`

## Auto-Creation of World Compendiums

The system can automatically create organized world compendiums with folders on system ready.

### Enabling Auto-Creation

1. Go to **Configure Settings** → **Module Settings** (or **System Settings**)
2. Find **"Auto-Create Organized World Compendiums"**
3. Enable the setting
4. Restart the world or reload Foundry

When enabled, the system will automatically create world compendiums for all packs that have JSON data:
- `Weapons`
- `Armour`
- `Species`
- `Magic` - Contains all magic spells organized into three folders: Spirit Magic, Divine Magic, and Sorcery
- `Equipment`

### Manual Creation

You can also manually create organized compendiums using the console:

```javascript
// Quick command: Regenerate all compendiums (deletes and recreates)
game.rq3.regenerateAllCompendiums()

// Create missing organized compendiums (skips existing)
game.rq3.autoCreateWorldCompendiums()

// Create a specific test compendium
game.rq3.testFoldersFromJSON()
```

**Quick Regeneration:**
The `regenerateAllCompendiums()` command is the fastest way to refresh all compendiums:
- Deletes existing organized compendiums
- Recreates them fresh from JSON data
- Shows a confirmation dialog before proceeding
- Perfect for when you've updated JSON files and want to refresh everything

### Folder Organization

Folders are automatically determined based on item properties:
- **Weapons**: By `weaponType` (Blade, Blunt, Bow, etc.)
- **Armour**: By `armorType` (Soft Leather, Stiff Leather, Chainmail, Scale, Plate, etc.)
- **Magic**: By `spellType` - Always uses three simple folders:
  - `Spirit Magic` - All spirit magic spells
  - `Divine Magic` - All divine magic spells
  - `Sorcery` - All sorcery spells
  - No subfolders (deity/skill grouping is ignored for the unified compendium)
- **Species**: By `type` (Humanoid, Beast, etc.)

You can override automatic folder assignment by specifying a `folder` property in the JSON.

## Populating JSON Files with Full Data

To populate the JSON files with all your existing data, run one of these commands in the Foundry console:

### Option 1: Convert from .mjs Data Files (Recommended)
```javascript
game.rq3.convertAllDataToJSON()
```
This converts the `.mjs` data files directly to JSON with proper folder assignments. Downloads all JSON files to your browser's download folder.

### Option 2: Export from Existing Compendiums
```javascript
game.rq3.populateJSONFromCompendiums()
```
This exports data from your existing system compendiums and formats it with folders. Useful if you've made edits to compendiums.

### After Downloading
1. Copy the downloaded JSON files to `packs/runequest3/data/`
2. Replace the sample files with the full data files
3. Run `game.rq3.regenerateAllCompendiums()` to create organized compendiums

## Current Status

- ✅ `weapons.json` - Sample file created (3 items with folder support)
- ✅ `armour.json` - Sample file created (2 items with folder support)
- ✅ `species.json` - Sample file created (1 item with folder support)
- ✅ `magic.json` - Combined magic compendium (6 items: 2 Spirit Magic, 2 Divine Magic, 2 Sorcery)
- ✅ Folder loader module created (`module/compendium-folder-loader.mjs`)
- ✅ Auto-creation system with settings toggle
- ✅ Data converter utilities created
- ✅ Old compendiums disabled (set to private)
- ⏳ **Ready for full data population** - Run `game.rq3.convertAllDataToJSON()` to populate

