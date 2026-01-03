/**
 * Write JSON files directly to the data directory
 * 
 * This function converts .mjs data to JSON and writes files directly
 * to packs/runequest3/data/ using Foundry's file system API
 * 
 * Usage: game.rq3.writeJSONFiles()
 */

import { 
  convertWeaponsData, 
  convertArmourData, 
  convertSpeciesData, 
  convertMagicData 
} from "./data-converter.mjs";

/**
 * Write JSON files directly to the data directory
 */
export async function writeJSONFiles() {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can write files!");
    return;
  }
  
  ui.notifications.info("Converting and writing JSON files...");
  
  try {
    const weapons = convertWeaponsData();
    const armour = convertArmourData();
    const species = convertSpeciesData();
    const magic = convertMagicData();
    
    const files = {
      weapons: JSON.stringify(weapons, null, 2),
      armour: JSON.stringify(armour, null, 2),
      species: JSON.stringify(species, null, 2),
      magic: JSON.stringify(magic, null, 2)
    };
    
    // Use FilePicker to save files
    for (const [name, content] of Object.entries(files)) {
      try {
        const file = new File([content], `${name}.json`, { type: 'application/json' });
        const path = `systems/runequest3/packs/runequest3/data/${name}.json`;
        
        // Try to save using FilePicker
        const saved = await FilePicker.upload(
          "data",
          path,
          file,
          { bucket: null }
        );
        
        console.log(`RQ3 | Saved ${name}.json to ${path}`);
      } catch (error) {
        console.error(`RQ3 | Could not save ${name}.json directly:`, error);
        // Fallback: download
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.json`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
        console.log(`RQ3 | Downloaded ${name}.json as fallback`);
      }
    }
    
    ui.notifications.info("JSON files written! Check packs/runequest3/data/");
    return files;
  } catch (error) {
    console.error("RQ3 | Error writing JSON files:", error);
    ui.notifications.error(`Failed: ${error.message}`);
  }
}

