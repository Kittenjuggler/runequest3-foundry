/**
 * RuneQuest 3rd Edition Armour Data
 * 
 * This file contains all armour definitions for the compendium.
 * Each piece includes a version number indicating when it was introduced.
 * 
 * ENC and Cost are calculated dynamically based on:
 * - Character SIZ (Small: 6-10, Medium: 11-15, Large: 16-20, Troll: 21-25)
 * - Hit locations covered using official RQ3 percentages:
 *   Head: 10%, Arms: 10% each, Chest: 20%, Abdomen: 10%, Legs: 20% each
 * 
 * Example: Medium Plate Cuirass (chest+abdomen only)
 * - Full plate suit for medium: 25.0 ENC, 6750p cost
 * - Cuirass covers chest (20%) + abdomen (10%) = 30% of full suit
 * - Cuirass ENC: 25.0 × 0.30 = 7.5 ENC
 * - Cuirass cost: 270p/ENC × 7.5 ENC = 2025p
 */

export const RQ3_ARMOUR_DATA = {
  "soft_leather_vest": {
    version: "1.0.5",
    data: {
      name: "Soft Leather Vest",
      type: "armor",
      img: "icons/equipment/chest/vest-leather-brown.webp",
      system: {
        armorType: "soft-leather",
        armorLocation: "chest",
        description: "<p>A rough equivalent to a leather jacket or vest. Common among primitives, nomads, and barbarians. Often worn under other armor as additional padding and protection.</p><p><strong>Coverage:</strong> Protects chest (20% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Soft leather",
        coverage: "Chest"
      }
    }
  },

  "stiff_leather_hauberk": {
    version: "1.0.5",
    data: {
      name: "Stiff Leather Hauberk",
      type: "armor",
      img: "icons/equipment/chest/vest-leather-brown.webp",
      system: {
        armorType: "stiff-leather",
        armorLocation: "chest",
        description: "<p>Equal to about 5mm of leather. Used among primitives and nomads for body protection. Has the consistency of 20th-century shoe sole leather.</p><p><strong>Coverage:</strong> Protects chest (20% of full suit). Armor points, encumbrance, and cost automatically calculated.</p>",
        material: "Stiff leather (5mm thick)",
        coverage: "Chest"
      }
    }
  },

  "chainmail_hauberk": {
    version: "1.0.5",
    data: {
      name: "Chainmail Hauberk",
      type: "armor",
      img: "icons/equipment/chest/shirt-chain-mail.webp",
      system: {
        armorType: "chainmail",
        armorLocation: "chest",
        description: "<p>Metal links woven together form the body of chainmail armor. Stronger and more durable than forms which depend upon non-metal backing. The all-metal construction makes it heavier than scale.</p><p><strong>Coverage:</strong> Protects chest (20% of full suit). Values automatically calculated based on wearer's size.</p>",
        material: "Interwoven metal links",
        coverage: "Chest"
      }
    }
  },

  "scale_helm": {
    version: "1.0.5",
    data: {
      name: "Scale Helm",
      type: "armor",
      img: "icons/equipment/head/helm-barbute-bronze.webp",
      system: {
        armorType: "scale",
        armorLocation: "head",
        description: "<p>A helmet made of overlapping metal scales. Well-crafted and durable with excellent protection for the head.</p><p><strong>Coverage:</strong> Head protection only (10% of full suit). Perfect example of location-specific armor piece.</p>",
        material: "Metal scales",
        coverage: "Head only"
      }
    }
  },

  "plate_cuirass": {
    version: "1.0.5",
    data: {
      name: "Plate Cuirass",
      type: "armor",
      img: "icons/equipment/chest/breastplate-scale-leather.webp",
      system: {
        armorType: "plate",
        armorLocation: "chest",
        description: "<p>Solid plates of metal, molded to the body and held together with leather straps covered by metal. The best armor for spreading impact and absorbing damage, but very heavy and hot to fight in.</p><p><strong>Coverage:</strong> Chest protection (20% of full suit). Demonstrates how location selection affects cost and encumbrance.</p>",
        material: "Molded steel plates",
        coverage: "Chest"
      }
    }
  },

  "lamellar_vambraces": {
    version: "1.0.6",
    data: {
      name: "Lamellar Vambraces",
      type: "armor",
      img: "icons/equipment/arm/bracer-armguard-steel.webp",
      system: {
        armorType: "lamellar",
        armorLocation: "arm",
        description: "<p>Metal strips (splints) held onto leather backing with rivets (studs). Often combined with areas of chainmail over joints and moving surfaces.</p><p><strong>Coverage:</strong> Single arm (10% of full suit). Can be equipped on either left or right arm - only protects the arm it's equipped on.</p>",
        material: "Metal strips on leather",
        coverage: "Single arm"
      }
    }
  },

  "stiff_leather_greaves": {
    version: "1.0.6",
    data: {
      name: "Stiff Leather Greaves",
      type: "armor",
      img: "icons/equipment/leg/pants-leather-brown.webp",
      system: {
        armorType: "stiff-leather",
        armorLocation: "leg",
        description: "<p>Stiff leather leg protection extending from knee to ankle. Made from thick, treated leather with the consistency of shoe sole material.</p><p><strong>Coverage:</strong> Single leg (20% of full suit). Can be equipped on either left or right leg - only protects the leg it's equipped on.</p>",
        material: "Stiff leather (5mm thick)",
        coverage: "Single leg"
      }
    }
  },

  "medium_shield": {
    version: "1.0.5",
    data: {
      name: "Medium Shield",
      type: "armor",
      img: "icons/equipment/shield/buckler-wooden-boss-steel.webp",
      system: {
        armorType: "shield",
        armorLocation: "custom",
        armorPoints: 12,
        parryBonus: 20,
        description: "<p>A wooden shield reinforced with metal rim and boss. Standard defense for warriors. Provides active protection that can be positioned as needed.</p><p><strong>Special:</strong> Shields use armor points and parry bonus instead of hit location coverage.</p>",
        material: "Wood with iron boss",
        coverage: "Variable (active defense)",
        size: "Medium"
      }
    }
  },

  "cuirbouilli_corslet": {
    version: "1.0.6",
    data: {
      name: "Cuirbouilli Corslet",
      type: "armor",
      img: "icons/equipment/chest/breastplate-leather-brown.webp",
      system: {
        armorType: "cuirbouilli",
        armorLocation: "chest",
        description: "<p>Leather boiled in oil and wax, molded into shape and left to harden. Cannot be reshaped without breaking. The long and tedious process makes it similarly priced to some metal armor.</p><p><strong>Coverage:</strong> Chest protection (20% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Boiled and molded leather",
        coverage: "Chest"
      }
    }
  },

  "cuirbouilli_abdomen_guard": {
    version: "1.0.6",
    data: {
      name: "Cuirbouilli Abdomen Guard",
      type: "armor",
      img: "icons/equipment/chest/breastplate-leather-brown.webp",
      system: {
        armorType: "cuirbouilli",
        armorLocation: "abdomen",
        description: "<p>Hardened leather protection for the abdomen area. Boiled in oil and wax, molded into shape and left to harden.</p><p><strong>Coverage:</strong> Abdomen protection (10% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Boiled and molded leather",
        coverage: "Abdomen"
      }
    }
  },

  "bezainted_jerkin": {
    version: "1.0.6",
    data: {
      name: "Bezainted Jerkin",
      type: "armor",
      img: "icons/equipment/chest/vest-leather-studded.webp",
      system: {
        armorType: "bezainted",
        armorLocation: "chest",
        description: "<p>Soft leather armor with metal disks (resembling the bezant, a medieval coin) fastened on. The major extra cost is the metal. Generally made more quickly than Cuirbouilli.</p><p><strong>Coverage:</strong> Chest protection (20% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Leather with metal disks",
        coverage: "Chest"
      }
    }
  },

  "bezainted_vambraces": {
    version: "1.0.6",
    data: {
      name: "Bezainted Vambraces",
      type: "armor",
      img: "icons/equipment/arm/bracer-leather-studded.webp",
      system: {
        armorType: "bezainted",
        armorLocation: "arm",
        description: "<p>Arm guards of soft leather with metal disks fastened on. Provides good protection while allowing flexibility.</p><p><strong>Coverage:</strong> Single arm (10% of full suit). Can be equipped on either left or right arm.</p>",
        material: "Leather with metal disks",
        coverage: "Single arm"
      }
    }
  },

  "ringmail_shirt": {
    version: "1.0.6",
    data: {
      name: "Ringmail Shirt",
      type: "armor",
      img: "icons/equipment/chest/shirt-scale-leather.webp",
      system: {
        armorType: "ringmail",
        armorLocation: "chest",
        description: "<p>Soft leather backing with metal rings sewn to it, like those found on chainmail. The rings are closer together than on Bezainted armor, making for more weight and better protection.</p><p><strong>Coverage:</strong> Chest protection (20% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Leather with metal rings",
        coverage: "Chest"
      }
    }
  },

  "ringmail_sleeves": {
    version: "1.0.6",
    data: {
      name: "Ringmail Sleeves",
      type: "armor",
      img: "icons/equipment/arm/bracer-chain-mail.webp",
      system: {
        armorType: "ringmail",
        armorLocation: "arm",
        description: "<p>Arm protection with metal rings sewn to leather backing. Good protection with reasonable flexibility.</p><p><strong>Coverage:</strong> Single arm (10% of full suit). Can be equipped on either left or right arm.</p>",
        material: "Leather with metal rings",
        coverage: "Single arm"
      }
    }
  },

  "brigandine_coat": {
    version: "1.0.6",
    data: {
      name: "Brigandine Coat",
      type: "armor",
      img: "icons/equipment/chest/coat-leather-brown.webp",
      system: {
        armorType: "brigandine",
        armorLocation: "chest",
        description: "<p>Metal scales fastened between two layers of leather by means of metal rivets. Strong and durable, the contrast of metal rivets on colored leather makes it much more decorative than simple metal.</p><p><strong>Coverage:</strong> Chest protection (20% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Metal scales between leather layers",
        coverage: "Chest"
      }
    }
  },

  "chainmail_coif": {
    version: "1.0.6",
    data: {
      name: "Chainmail Coif",
      type: "armor",
      img: "icons/equipment/head/helm-chain-coif.webp",
      system: {
        armorType: "chainmail",
        armorLocation: "head",
        description: "<p>A chainmail hood that protects the head and neck. Made of interwoven metal links.</p><p><strong>Coverage:</strong> Head protection (10% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Interwoven metal links",
        coverage: "Head"
      }
    }
  },

  "plate_helm": {
    version: "1.0.6",
    data: {
      name: "Plate Helm",
      type: "armor",
      img: "icons/equipment/head/helm-barbute-steel.webp",
      system: {
        armorType: "plate",
        armorLocation: "head",
        description: "<p>A solid steel helmet providing excellent protection for the head. The pinnacle of head armor technology.</p><p><strong>Coverage:</strong> Head protection (10% of full suit). Automatically calculated based on armor type and location.</p>",
        material: "Molded steel plates",
        coverage: "Head"
      }
    }
  },

  "plate_gauntlets": {
    version: "1.0.6",
    data: {
      name: "Plate Gauntlets",
      type: "armor",
      img: "icons/equipment/arm/gauntlet-plate-steel.webp",
      system: {
        armorType: "plate",
        armorLocation: "arm",
        description: "<p>Articulated steel gauntlets providing complete hand and forearm protection. The ultimate in arm armor.</p><p><strong>Coverage:</strong> Single arm (10% of full suit). Can be equipped on either left or right arm.</p>",
        material: "Molded steel plates",
        coverage: "Single arm"
      }
    }
  },

  "plate_greaves": {
    version: "1.0.6",
    data: {
      name: "Plate Greaves",
      type: "armor",
      img: "icons/equipment/leg/greaves-plate-steel.webp",
      system: {
        armorType: "plate",
        armorLocation: "leg",
        description: "<p>Steel leg armor extending from knee to ankle. Provides excellent protection with articulated joints.</p><p><strong>Coverage:</strong> Single leg (20% of full suit). Can be equipped on either left or right leg.</p>",
        material: "Molded steel plates",
        coverage: "Single leg"
      }
    }
  },

  "large_shield": {
    version: "1.0.6",
    data: {
      name: "Large Shield",
      type: "armor",
      img: "icons/equipment/shield/heater-steel-boss.webp",
      system: {
        armorType: "shield",
        armorLocation: "custom",
        armorPoints: 16,
        parryBonus: 25,
        description: "<p>A large wooden shield reinforced with metal. Provides excellent coverage and protection.</p><p><strong>Special:</strong> Shields use armor points and parry bonus instead of hit location coverage.</p>",
        material: "Wood with iron reinforcement",
        coverage: "Variable (active defense)",
        size: "Large"
      }
    }
  },

  "small_shield": {
    version: "1.0.6",
    data: {
      name: "Small Shield",
      type: "armor",
      img: "icons/equipment/shield/buckler-wooden-round.webp",
      system: {
        armorType: "shield",
        armorLocation: "custom",
        armorPoints: 8,
        parryBonus: 15,
        description: "<p>A small, round shield easy to maneuver. Good for parrying but limited coverage.</p><p><strong>Special:</strong> Shields use armor points and parry bonus instead of hit location coverage.</p>",
        material: "Wood with metal rim",
        coverage: "Variable (active defense)",
        size: "Small"
      }
    }
  }
}; 