/**
 * Conversion Script
 * 
 * This script converts .mjs data files to JSON format with folder assignments.
 * Run this in Foundry console: game.rq3.convertAllDataToJSON()
 * 
 * The JSON will be output to console and can be copied to files.
 */

import { 
  convertWeaponsData, 
  convertArmourData, 
  convertSpeciesData, 
  convertMagicData 
} from "../module/data-converter.mjs";

/**
 * Convert all data to JSON and output for file saving
 */
export async function convertAllDataToJSON() {
  if (!game.user.isGM) {
    ui.notifications.error("Only GMs can run this conversion!");
    return;
  }
  
  ui.notifications.info("Converting all data to JSON format...");
  
  try {
    const weapons = convertWeaponsData();
    const armour = convertArmourData();
    const species = convertSpeciesData();
    const magic = convertMagicData();
    
    // Create downloadable files
    const files = {
      weapons: JSON.stringify(weapons, null, 2),
      armour: JSON.stringify(armour, null, 2),
      species: JSON.stringify(species, null, 2),
      magic: JSON.stringify(magic, null, 2)
    };
    
    // Store files for console output as fallback
    console.log("RQ3 | ========================================");
    console.log("RQ3 | JSON Conversion Complete!");
    console.log("RQ3 | ========================================");
    
    // Download each file with delay to prevent browser blocking multiple downloads
    const fileEntries = Object.entries(files);
    let downloadCount = 0;
    
    for (let i = 0; i < fileEntries.length; i++) {
      const [name, content] = fileEntries[i];
      const data = JSON.parse(content);
      const itemCount = Object.keys(data).length;
      
      setTimeout(() => {
        try {
          const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${name}.json`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          
          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 200);
          
          downloadCount++;
          console.log(`RQ3 | ✓ ${name}.json (${itemCount} items) - Download initiated`);
          
          // If all downloads complete, show notification
          if (downloadCount === fileEntries.length) {
            setTimeout(() => {
              ui.notifications.info(`All ${downloadCount} JSON files should have downloaded! Check your Downloads folder.`);
            }, 1000);
          }
        } catch (error) {
          console.error(`RQ3 | Failed to download ${name}.json:`, error);
          // Fallback: output to console
          console.log(`RQ3 | ${name}.json content:`, content);
        }
      }, i * 600); // 600ms delay between each download
    }
    
    // Also output file sizes to console for verification
    console.log("RQ3 | File sizes:");
    for (const [name, content] of fileEntries) {
      const sizeKB = (content.length / 1024).toFixed(2);
      console.log(`RQ3 |   ${name}.json: ${sizeKB} KB`);
    }
    
    console.log("RQ3 | ========================================");
    console.log("RQ3 | If files didn't download, check browser download settings.");
    console.log("RQ3 | You can also copy the JSON from console.log output above.");
    console.log("RQ3 | ========================================");
    
    return files;
  } catch (error) {
    console.error("RQ3 | Error converting data:", error);
    ui.notifications.error(`Failed to convert: ${error.message}`);
  }
}

