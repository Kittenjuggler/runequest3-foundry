# Technical Context - RuneQuest 3 Foundry VTT System

## Technologies Used

### Core Technologies
- **Foundry VTT v12+**: Virtual tabletop platform with modern JavaScript APIs
- **ES6 Modules**: Modern JavaScript module system for clean code organization
- **Handlebars**: Template engine for dynamic UI rendering
- **CSS3**: Modern styling with custom properties and responsive design

### Development Environment
- **Platform**: Windows 10/11 with PowerShell
- **Code Editor**: Cursor IDE with AI assistance
- **Version Control**: Git for source code management
- **Testing**: Foundry VTT development environment

### Foundry VTT Integration
- **Document Classes**: Custom Actor and Item classes extending Foundry's base
- **Sheet Applications**: Custom UI implementations for character and item management
- **Data Models**: Structured data handling with type safety
- **Hooks System**: Event-driven integration with Foundry's lifecycle

## Console Commands and Tools

### Compendium Management

**Export Compendium as JSON:**
```javascript
game.rq3.exportCompendium("runequest3.weapons")
```
- Exports any compendium pack as formatted JSON
- Opens in new browser tab for easy copying
- Includes all item data and folder structure
- Useful for backing up or external editing

**Available Compendium IDs:**
- `"runequest3.species"` - Character species/races
- `"runequest3.spiritmagic"` - Spirit magic spells
- `"runequest3.divinemagic"` - Divine magic spells
- `"runequest3.sorcery"` - Sorcery spells
- `"runequest3.weapons"` - Weapons
- `"runequest3.armour"` - Armor pieces

### World Compendium Organization

**Organize Weapons Macro:**
Located in `macros/organize-weapons-compendium.js`

**How to Use:**
1. Create a new Script macro in Foundry
2. Copy contents of `macros/organize-weapons-compendium.js`
3. Run as GM
4. Creates "Weapons (Organized)" world compendium
5. Weapons organized into folders by skill (Blade, Blunt, Bow, etc.)
6. Fully editable with no lock restrictions

**Features:**
- Prompts before overwriting existing compendium
- Creates folders for each weapon skill type
- Imports all weapons with proper folder assignments
- World-level compendium (editable, no restrictions)

### Foundry VTT v13 Compendium Constraints

**System Compendiums are Locked:**
- Cannot create/delete folders programmatically
- Cannot edit items directly
- Cannot reorganize content
- Folders are world-level entities, not pack-level

**Workaround:**
- System compendiums remain as flat lists
- Use macro to create organized world compendiums
- World compendiums are fully editable

## Development Setup

### Project Structure
```
runequest3/
├── system.json (System configuration)
├── runequest3.mjs (Main entry point)
├── module/ (Core system modules)
│   ├── documents.mjs (Actor/Item classes)
│   ├── data-models.mjs (Data structures)
│   ├── actor-sheets.mjs (Character sheets)
│   ├── item-sheets.mjs (Item management)
│   └── rq3-*-data.mjs (Game data)
├── templates/ (Handlebars templates)
│   ├── actor/ (Character sheet templates)
│   └── item/ (Item sheet templates)
├── styles/ (CSS styling)
├── lang/ (Localization)
├── packs/ (Compendium data)
├── macros/ (Utility macros)
│   └── organize-weapons-compendium.js
└── memory-bank/ (Project documentation)
    ├── activeContext.md
    ├── progress.md
    └── techContext.md
```

### Module Architecture
- **Main Entry**: `runequest3.mjs` handles system initialization and registration
  - Registers Handlebars helpers (eq, or, not, etc.)
  - Registers system settings (compendium versions, etc.)
  - Runs compendium migrations on ready hook
  - Exposes `game.rq3.exportCompendium()` utility
- **Document Classes**: `documents.mjs` defines Actor and Item base classes
  - `RQ3Actor`: Character/NPC/Creature logic
  - `RQ3Item`: Weapon/Armor/Spell/Equipment logic
  - Static utility methods (e.g., `getAttackSkillForWeaponType()`)
- **Data Models**: `data-models.mjs` provides structured data definitions
  - `CharacterDataModel`: Includes `containerStates`, `magicVisibility`
  - `SpellDataModel`: Includes `offensive` flag, `magicPoints`, `uses`
  - `WeaponDataModel`, `ArmorDataModel`, etc.
- **Sheet Applications**: `actor-sheets.mjs` and `item-sheets.mjs` handle UI
  - Event listeners for drag-and-drop, rolls, toggles
  - Tooltip management for stats
  - Container accordion logic
  - Hit location roll integration
- **Data Modules**: Separate files for skills, weapons, armor, and magic data
  - `rq3-weapons-data.mjs`: Weapon definitions with version tracking
  - `rq3-skills-data.mjs`: Skill definitions
  - Similar pattern for armor, spells, etc.

### Data Management
- **Compendium Packs**: Organized data storage for easy content management
  - System compendiums: Locked, read-only reference data
  - World compendiums: Editable, customizable for campaigns
- **Compendium Migration System**: Version-based automatic updates
  - Each compendium tracks its version in system settings
  - Migrations run on `ready` hook if version mismatch
  - Prevents redundant imports on every page load
- **Data Models**: Type-safe data structures for validation and consistency
  - Uses Foundry's `DataModel` system with field definitions
  - Automatic validation and type coercion
- **Localization**: Multi-language support through JSON language files
- **Configuration**: System settings and house rules management
  - Hidden settings for compendium version tracking
  - User-facing settings for game rules

## Technical Constraints

### Foundry VTT Requirements
- **API Compliance**: Must use official Foundry VTT APIs and patterns
- **Version Compatibility**: Minimum Foundry VTT v12 support
- **Performance**: Responsive UI with efficient data handling
- **Memory Management**: Optimized for large campaign data

### Browser Compatibility
- **Modern JavaScript**: ES6+ features for clean, maintainable code
- **CSS Features**: Custom properties, flexbox, and grid layouts
- **Responsive Design**: Support for various screen sizes and orientations
- **Accessibility**: Keyboard navigation and screen reader support

### Code Quality Standards
- **File Size Limit**: All source files must be kept below 500 lines
- **Small Components**: Functions should be focused and under 50 lines when possible
- **Single Responsibility**: Each component should have one clear purpose
- **Modular Design**: Small, focused function files for maintainability
- **ES6 Patterns**: Modern JavaScript practices throughout
- **Documentation**: Comprehensive code comments and documentation
- **Error Handling**: Graceful error handling and user feedback
- **CSS Organization**: Keep CSS in smaller files linked to specific functions/sections

## Dependencies and Integration

### Foundry VTT Dependencies
- **Core System**: Relies on Foundry VTT core functionality
- **Document System**: Extends Foundry's Actor and Item classes
- **UI Framework**: Integrates with Foundry's sheet application system
- **Data Storage**: Uses Foundry's data persistence and compendium system

### External Dependencies
- **Handlebars**: Template rendering engine
- **CSS Custom Properties**: Modern styling capabilities
- **ES6 Modules**: JavaScript module system

### Development Dependencies
- **Git**: Version control and collaboration
- **Cursor IDE**: AI-assisted development environment
- **Foundry VTT Dev**: Local development and testing environment
