/**
 * RuneQuest 3rd Edition Weapons Data
 * 
 * This file contains all weapon definitions for the compendium.
 * Each weapon includes a version number indicating when it was introduced.
 */

export const RQ3_WEAPONS_DATA = {
  "broadsword": {
    version: "1.0.3",
    data: {
      name: "Broadsword",
      type: "weapon",
      img: "icons/weapons/swords/sword-broad-silver.webp",
      system: {
        weaponType: "1h-sword",
        damage: "1d8+1",
        minStrength: 13,
        dexterityModifier: 0,
        hands: 1,
        reach: 1,
        parryBonus: 0,
        attackBonus: 0,
        weight: 2,
        cost: 150,
        hitPointBonus: 12,
        skillUsed: "1H Sword",
        description: "<p>A versatile one-handed sword, well-balanced for both attack and defense. Popular among professional warriors.</p>",
        attackRate: "1/2",
        impale: true
      }
    }
  },

  "long_spear": {
    version: "1.0.3",
    data: {
      name: "Long Spear",
      type: "weapon",
      img: "icons/weapons/polearms/spear-simple-long.webp",
      system: {
        weaponType: "spear",
        damage: "1d10+1",
        minStrength: 11,
        dexterityModifier: 0,
        hands: 2,
        reach: 3,
        parryBonus: 0,
        attackBonus: 5,
        weight: 2,
        cost: 15,
        hitPointBonus: 10,
        skillUsed: "Spear",
        description: "<p>A long thrusting weapon excellent for keeping enemies at distance. Can be set against charges.</p>",
        attackRate: "1/2",
        impale: true,
        setAgainstCharge: true
      }
    }
  },

  "composite_bow": {
    version: "1.0.3",
    data: {
      name: "Composite Bow",
      type: "weapon",
      img: "icons/weapons/bows/bow-recurve-yellow.webp",
      system: {
        weaponType: "bow",
        damage: "1d8+1",
        minStrength: 13,
        dexterityModifier: 0,
        hands: 2,
        reach: 0,
        parryBonus: -20,
        attackBonus: 0,
        weight: 1,
        cost: 200,
        hitPointBonus: 8,
        skillUsed: "Bow",
        description: "<p>A powerful curved bow made from horn and sinew. Superior to simple bows in power and accuracy.</p>",
        attackRate: "1/1",
        range: "150m",
        impale: true,
        ammunition: "arrows"
      }
    }
  },

  "war_hammer": {
    version: "1.0.3",
    data: {
      name: "War Hammer",
      type: "weapon",
      img: "icons/weapons/hammers/hammer-war-spiked.webp",
      system: {
        weaponType: "mace",
        damage: "1d8+2",
        minStrength: 13,
        dexterityModifier: 0,
        hands: 1,
        reach: 1,
        parryBonus: 0,
        attackBonus: 0,
        weight: 2,
        cost: 100,
        hitPointBonus: 15,
        skillUsed: "1H Mace",
        description: "<p>A heavy war hammer designed to crush armor and bone. Effective against heavily armored opponents.</p>",
        attackRate: "1/2",
        impale: false,
        armorIgnore: 2
      }
    }
  },

  "dagger": {
    version: "1.0.3",
    data: {
      name: "Dagger",
      type: "weapon",
      img: "icons/weapons/daggers/dagger-straight-steel.webp",
      system: {
        weaponType: "dagger",
        damage: "1d4+2",
        minStrength: 7,
        dexterityModifier: 0,
        hands: 1,
        reach: 0,
        parryBonus: -20,
        attackBonus: 20,
        weight: 0.5,
        cost: 30,
        hitPointBonus: 8,
        skillUsed: "Dagger",
        description: "<p>A short, pointed blade useful as both weapon and tool. Can be concealed easily and thrown.</p>",
        attackRate: "1/1",
        impale: true,
        concealable: true,
        throwable: true,
        thrownRange: "20m"
      }
    }
  },

  "battle_axe": {
    version: "1.0.3",
    data: {
      name: "Battle Axe",
      type: "weapon",
      img: "icons/weapons/axes/axe-battle-worn.webp",
      system: {
        weaponType: "1h-axe",
        damage: "1d8+2",
        minStrength: 13,
        dexterityModifier: 0,
        hands: 1,
        reach: 1,
        parryBonus: -10,
        attackBonus: 0,
        weight: 1.5,
        cost: 100,
        hitPointBonus: 10,
        skillUsed: "1H Axe",
        description: "<p>A single-bladed axe designed for war. Delivers devastating cuts but is awkward to parry with.</p>",
        attackRate: "1/2",
        impale: false
      }
    }
  }
}; 