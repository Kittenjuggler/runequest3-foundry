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
├── styles/ (CSS styling)
├── lang/ (Localization)
└── packs/ (Compendium data)
```

### Module Architecture
- **Main Entry**: `runequest3.mjs` handles system initialization and registration
- **Document Classes**: `documents.mjs` defines Actor and Item base classes
- **Data Models**: `data-models.mjs` provides structured data definitions
- **Sheet Applications**: `actor-sheets.mjs` and `item-sheets.mjs` handle UI
- **Data Modules**: Separate files for skills, weapons, armor, and magic data

### Data Management
- **Compendium Packs**: Organized data storage for easy content management
- **Data Models**: Type-safe data structures for validation and consistency
- **Localization**: Multi-language support through JSON language files
- **Configuration**: System settings and house rules management

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
