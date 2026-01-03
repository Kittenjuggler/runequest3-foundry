# RuneQuest 3 Macros

This directory contains utility macros for the RuneQuest 3 system.

## Export JSON Files

**File:** `export-json-files.js`

A macro that creates a dialog with download links for exporting compendium data to JSON format.

### How to Use

1. In Foundry VTT, go to **Macros** tab
2. Click **Create Macro**
3. Set the following:
   - **Name:** Export JSON Files
   - **Type:** Script
   - **Command:** Copy the entire contents of `macros/export-json-files.js` into the command field
4. Click **Save Macro**
5. Run the macro to open a dialog with download options

### Features

- **Individual Downloads:** Buttons to download each compendium separately:
  - Weapons.json
  - Armour.json
  - Species.json
  - Magic.json (combined from Spirit Magic, Divine Magic, and Sorcery)

- **Download All:** One button to download all files at once

- **Automatic Folder Assignment:** Files are exported with proper folder assignments based on item properties

### Use Cases

- **After Editing in Foundry:** Edit items in Foundry compendiums, then export to update JSON source files
- **Backup:** Export compendium data as JSON for backup
- **Version Control:** Export to JSON for Git version control
- **Sharing:** Export data to share with others

### After Downloading

Copy the downloaded JSON files to `packs/runequest3/data/` to update the source files.

## Organize Weapons Compendium

**File:** `organize-weapons-compendium.js`

Creates an organized world compendium with weapons grouped into folders by skill type.

