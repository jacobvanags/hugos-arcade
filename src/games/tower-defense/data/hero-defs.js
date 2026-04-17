/**
 * Hero definitions — 4 unique deployable astronaut heroes.
 * Each hero can only be placed once. Has an auto-attack and a special ability.
 */
export const HERO_TYPES = {
  astro: {
    name: 'Astro',
    description: 'Balanced pulse rifle trooper.',
    cost: 400,
    baseRange: 130,
    baseDamage: 18,
    baseFireRate: 0.6,
    baseProjectileSpeed: 350,
    projectileType: 'bullet',
    color: '#00d4ff',
    size: 12,
    targetingDefault: 'first',
    ability: {
      name: 'Plasma Barrage',
      description: 'Rapid-fires 8 shots in 2 seconds.',
      cooldown: 25,
      duration: 2,
      effect: 'barrage',
    },
  },

  nova: {
    name: 'Nova',
    description: 'Explosive area-damage specialist.',
    cost: 500,
    baseRange: 110,
    baseDamage: 35,
    baseFireRate: 1.4,
    baseProjectileSpeed: 200,
    projectileType: 'plasma',
    baseSplashRadius: 50,
    color: '#ff8844',
    size: 12,
    targetingDefault: 'strongest',
    ability: {
      name: 'Supernova',
      description: 'Massive explosion dealing 3x damage in a huge area.',
      cooldown: 30,
      duration: 0,
      effect: 'supernova',
      splashRadius: 120,
      damageMultiplier: 3,
    },
  },

  volt: {
    name: 'Volt',
    description: 'Tech specialist with chain lightning.',
    cost: 450,
    baseRange: 120,
    baseDamage: 12,
    baseFireRate: 0.8,
    baseProjectileSpeed: 0,
    projectileType: 'lightning',
    baseChainCount: 3,
    baseChainRange: 80,
    color: '#ffdd44',
    size: 12,
    targetingDefault: 'first',
    ability: {
      name: 'EMP Surge',
      description: 'Stuns all enemies in range for 3s and destroys shields.',
      cooldown: 35,
      duration: 0,
      effect: 'emp',
      stunDuration: 3,
    },
  },

  patch: {
    name: 'Patch',
    description: 'Support hero that buffs all towers.',
    cost: 350,
    baseRange: 100,
    baseDamage: 8,
    baseFireRate: 1.0,
    baseProjectileSpeed: 250,
    projectileType: 'bullet',
    color: '#44ff88',
    size: 12,
    targetingDefault: 'closest',
    ability: {
      name: 'Rally Beacon',
      description: 'All towers gain +50% damage and +30% fire rate for 6s.',
      cooldown: 40,
      duration: 6,
      effect: 'rally',
      damageBuff: 0.5,
      speedBuff: 0.3,
    },
  },
};

/** Ordered list of hero keys for UI rendering */
export const HERO_ORDER = ['astro', 'nova', 'volt', 'patch'];
