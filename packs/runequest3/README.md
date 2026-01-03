# RuneQuest 3 Compendium Packs

This directory follows the Pathfinder 2e-style organization pattern for Foundry VTT compendium packs.

## Structure

All compendium packs are organized under `packs/runequest3/` with each pack stored as a `.db` file:

- `equipment.db` - Equipment items
- `species.db` - Character species/races
- `spirit-magic.db` - Spirit Magic spells
- `divine-magic.db` - Divine Magic spells
- `sorcery.db` - Sorcery spells
- `weapons.db` - Weapons
- `armour.db` - Armor pieces

## Source Data

The source data for these compendiums can be stored in two formats:

### JSON Files (Recommended - Pathfinder 2e Pattern)
Located in `packs/runequest3/data/`:
- `weapons.json` - Weapon definitions
- `armour.json` - Armor definitions
- `species.json` - Character species/races
- `spirit-magic.json` - Spirit Magic spells
- `divine-magic.json` - Divine Magic spells
- `sorcery.json` - Sorcery spells

### .mjs Files (Legacy - Fallback)
Located in `module/`:
- `module/rq3-weapons-data.mjs`
- `module/rq3-armour-data.mjs`
- `module/rq3-species-data.mjs`
- `module/rq3-spirit-magic-data.mjs`
- `module/rq3-divine-magic-data.mjs`
- `module/rq3-sorcery-data.mjs`

The system will automatically use JSON files if available, falling back to `.mjs` files for backward compatibility.

## Migration System

Compendiums are automatically populated via migration functions in `runequest3.mjs`:
- `migrateSpeciesCompendium()`
- `migrateSpiritMagicCompendium()`
- `migrateDivineMagicCompendium()`
- `migrateSorceryCompendium()`
- `migrateWeaponsCompendium()`
- `migrateArmourCompendium()`

These migrations run automatically when the system version changes, ensuring compendiums stay up to date.

## Benefits of This Structure

1. **Organization**: All compendiums are grouped under a single parent directory
2. **Consistency**: Follows the same pattern as major Foundry systems like Pathfinder 2e
3. **Maintainability**: Clear separation between source data and compiled compendiums
4. **Version Control**: Source data in `.mjs` files is easily tracked in Git

## Migration from Old Structure

If you have existing compendiums in the old `packs/weapons/`, `packs/armour/`, etc. directories, the system will automatically create new compendiums in this location. The old directories can be safely removed after verifying the new compendiums work correctly.

