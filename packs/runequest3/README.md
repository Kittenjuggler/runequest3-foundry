# RuneQuest 3 Compendium Data

This folder contains JSON source data for RuneQuest 3 compendiums. The system automatically creates organized world compendiums with folders from these JSON files.

## Structure

```
packs/runequest3/
├── data/                    # JSON source files
│   ├── weapons.json        # Weapon definitions with folder assignments
│   ├── armour.json         # Armour pieces organized by type
│   ├── species.json        # Character species/races
│   ├── magic.json          # All magic spells (Spirit, Divine, Sorcery)
│   ├── equipment.json      # General equipment and gear
│   └── README.md           # Data format documentation
└── README.md               # This file
```

## World Compendiums

The system creates world compendiums automatically with organized folders:

- **Weapons** - Organized by weapon skill (Blade, Blunt, Bow, Close Combat, etc.)
- **Armour** - Organized by armor type and protection level (Soft Leather, Chainmail, Plate, etc.)
- **Species** - Organized by type (Humanoid, etc.)
- **Magic** - Organized into Spirit Magic, Divine Magic, and Sorcery folders
- **Equipment** - General equipment and supplies

### Enabling Auto-Creation

1. Go to **Configure Settings** → **System Settings**
2. Enable **"Auto-Create Organized World Compendiums"**
3. Reload Foundry VTT or the world

World compendiums will be created automatically on system load if they don't exist.

### Manual Creation

You can manually create or regenerate compendiums using console commands:

```javascript
// Regenerate all compendiums (deletes and recreates)
game.rq3.regenerateAllCompendiums()

// Create missing compendiums only (skips existing)
game.rq3.autoCreateWorldCompendiums()
```

## JSON Data Format

Each JSON file contains items in this format:

```json
{
  "item_key": {
    "version": "1.0.7",
    "folder": "Folder Name",
    "data": {
      "name": "Item Name",
      "type": "weapon",
      "system": { ... }
    }
  }
}
```

### Fields

- **version**: System version when item was created/updated
- **folder**: (Optional) Folder to organize item into
- **data**: Full Foundry item data structure

### Automatic Folder Assignment

If `folder` is not specified, folders are automatically assigned based on item properties:

- **Weapons**: By `weaponType` (axe → Blade, mace → Blunt, bow → Bow, etc.)
- **Armour**: By `armorType` (soft-leather → Soft Leather, plate → Plate, etc.)
- **Magic**: By `spellType` (spirit → Spirit Magic, divine → Divine Magic, etc.)
- **Species**: By `type` field

## Exporting Data

To export current compendium data to JSON files:

```javascript
// Export all compendiums to JSON (downloads files)
game.rq3.populateJSONFromCompendiums()
```

This exports from world compendiums if available, otherwise from system compendiums. Copy the downloaded JSON files to `packs/runequest3/data/` and commit them to update the source data.

## Benefits of JSON Source Data

1. **Version Control** - Track changes to compendium items in Git
2. **Easy Editing** - Edit items directly in JSON files
3. **Automatic Organization** - Folders created automatically based on item properties
4. **World Compendiums** - Fully editable compendiums with folder organization
5. **No Database Files** - Clean repository without binary .ldb files

## Usage Workflow

1. **Edit JSON files** - Make changes to items in `data/*.json`
2. **Commit changes** - Track item changes in version control
3. **Regenerate compendiums** - Run `game.rq3.regenerateAllCompendiums()` in Foundry
4. **Or**: Let auto-create handle it on next system load

## Notes

- World compendiums are prioritized over system compendiums
- Database files (*.ldb, *.log, etc.) are git-ignored and not tracked
- Compendiums are unlocked by default for editing
- Changes made in Foundry won't persist unless exported back to JSON
