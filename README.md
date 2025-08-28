# RuneQuest 3rd Edition for Foundry VTT

A comprehensive game system implementation for RuneQuest 3rd Edition in Foundry Virtual Tabletop.

## 🚀 Quick Install

**Foundry VTT Manifest URL:**
```
https://github.com/Kittenjuggler/runequest3-foundry/releases/latest/download/system.json
```

Copy this URL and paste it into Foundry VTT's "Install System" dialog for automatic installation.

## Features

### Character System
- **Seven Core Characteristics**: STR, CON, SIZ, INT, POW, DEX, CHA
- **Automatic Calculations**: Hit points, magic points, movement rates, and characteristic modifiers
- **Hit Location System**: Detailed hit location tracking with individual armor and hit points
- **Skill System**: Comprehensive skill management with categories and experience tracking
- **Rune System**: Support for Elemental, Power, Form, and Condition runes

### Combat System
- **Initiative System**: Configurable initiative formulas
- **Hit Location Combat**: Damage tracking by body location
- **Armor System**: Location-based armor protection
- **Weapon Statistics**: Damage, reach, parry, and special properties

### Magic System
- **Three Magic Types**: Spirit Magic, Divine Magic, and Sorcery
- **Magic Point Management**: Automatic MP tracking and spell cost deduction
- **Spell Components**: Verbal, somatic, material, and focus components
- **Rune Magic**: Integration with character rune affinities

### Equipment System
- **Comprehensive Item Types**: Weapons, armor, equipment, skills, spells, and runes
- **Encumbrance Tracking**: Automatic weight and encumbrance calculations
- **Consumable Items**: Usage tracking for consumable equipment
- **Currency System**: Support for Lunar-based economy

## Actor Types

### Character
- Full character sheet with all RQ3 mechanics
- Personal details (age, height, weight, gender)
- Background information (homeland, occupation, cult)
- Experience tracking and skill improvement
- Passion and reputation systems

### NPC
- Streamlined NPC management
- Importance ratings and organizational affiliations
- All core characteristics and combat capabilities

### Creature
- Monster and creature statistics
- Natural armor and special abilities
- Creature type classification (animal, monster, spirit, undead, chaos)
- Special traits and weaknesses

## Item Types

### Weapons
- Weapon categories and damage types
- Reach, parry, and armor penetration
- Ranged weapon support with ammunition tracking
- Special weapon properties

### Armor
- Location-based protection
- Encumbrance and fatigue effects
- Armor types from leather to plate

### Skills
- Skill categories and base chances
- Characteristic-based skill calculations
- Experience checkmarks and improvement tracking

### Spells
- Three magic systems (Spirit, Divine, Sorcery)
- Casting time, range, and duration
- Component requirements
- Intensity and stackability

### Runes
- Four rune types with affinity values
- Opposition relationships
- Associated spells and abilities

### Equipment
- General equipment and treasure
- Container capacity tracking
- Tool and consumable management

## System Settings

- **House Rules**: Toggle various optional rules
- **Initiative Variants**: Multiple initiative formula options
- **Skill Improvement**: Different advancement rates
- **Magic Point Recovery**: Configurable recovery rates
- **Hit Location Rules**: Various hit location determination methods

## Rolling System

### Skill Rolls
- Percentile-based skill system
- Critical success (1/20th of skill value)
- Fumble results (96-00)
- Automatic success/failure determination

### Characteristic Rolls
- Characteristic × 5 target numbers
- Same critical and fumble mechanics
- Quick characteristic testing

### Combat Integration
- Automated hit location determination
- Damage application with armor reduction
- Healing and recovery tracking

## Installation

### Method 1: Direct Installation in Foundry VTT
1. Copy the entire `systems/runequest3` folder to your Foundry VTT Data folder:
   - **Windows**: `%LOCALAPPDATA%\FoundryVTT\Data\systems\`
   - **macOS**: `~/Library/Application Support/FoundryVTT/Data/systems/`
   - **Linux**: `~/.local/share/FoundryVTT/Data/systems/`

2. Restart Foundry VTT

3. When creating a new world, select "RuneQuest 3rd Edition" as the game system

### Method 2: Using Foundry's System Installer (Recommended)
1. In Foundry VTT, go to the "Game Systems" tab
2. Click "Install System"
3. Use the manifest URL: `https://github.com/Kittenjuggler/runequest3-foundry/releases/latest/download/system.json`
4. Click "Install"

### Method 3: Manual Download from GitHub
1. Go to [https://github.com/Kittenjuggler/runequest3-foundry/releases](https://github.com/Kittenjuggler/runequest3-foundry/releases)
2. Download the latest `runequest3-foundry.zip` file
3. Extract it to your Foundry VTT Data/systems folder
4. Restart Foundry VTT

### Directory Structure
The system should be installed with the following structure:
```
FoundryVTT/Data/systems/runequest3/
├── system.json
├── runequest3.mjs
├── README.md
├── module/
│   ├── data-models.mjs
│   └── documents.mjs
├── styles/
│   └── runequest3.css
├── lang/
│   └── en.json
├── templates/
└── packs/
```

## Usage

### Creating Characters
1. Create a new Actor of type "Character"
2. Set the seven characteristics (STR, CON, SIZ, INT, POW, DEX, CHA)
3. Hit points, magic points, and other derived values calculate automatically
4. Add skills, spells, and equipment as Items

### Rolling Dice
- Click on characteristic values to roll characteristic tests
- Click on skill names to roll skill tests
- Use the chat commands for custom rolls

### Combat
- Add actors to the combat tracker
- Initiative is rolled automatically based on system settings
- Apply damage using the hit location system
- Track armor and weapon condition

### Magic
- Add spells as Items to character sheets
- Click "Cast" to use spells (automatically deducts magic points)
- Track spell components and casting requirements

## Customization

The system includes extensive customization options:
- Configurable house rules
- Multiple initiative systems
- Adjustable skill advancement rates
- Flexible magic point recovery
- Various hit location determination methods

## Development

This system is built using modern Foundry VTT development practices:
- ES6 modules for clean code organization
- Data models for type safety
- Handlebars templates for UI
- CSS custom properties for theming

## License

This system is provided under the terms that comply with Foundry VTT's licensing requirements and RuneQuest's intellectual property guidelines.

## Support

For issues, suggestions, or contributions, please visit the project repository.

## Changelog

### Version 1.0.0
- Initial release
- Complete character system implementation
- Combat and magic systems
- Equipment and skill management
- Comprehensive UI with medieval fantasy styling 