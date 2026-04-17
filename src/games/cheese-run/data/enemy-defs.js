/**
 * Cat enemy definitions for Cheese Run.
 * Each type has different behavior, stats, and appearance.
 */
export const enemyTypes = {
  /** Basic patrol cat — walks back and forth on platforms */
  patrol: {
    type: 'patrol',
    name: 'Patrol Cat',
    width: 24,
    height: 24,
    speed: 60,
    hp: 1,
    damage: 1,
    score: 50,
    bodyColor: '#E08040',
    eyeColor: '#FFFF00',
  },

  /** Jumping cat — hops periodically, spits small yarn balls */
  jumper: {
    type: 'jumper',
    name: 'Jumping Cat',
    width: 22,
    height: 22,
    speed: 50,
    hp: 1,
    damage: 1,
    score: 75,
    jumpForce: 350,
    jumpInterval: 2.0,
    shootInterval: 3.0,
    bulletSpeed: 150,
    projectileType: 'yarn',
    bodyColor: '#C06030',
    eyeColor: '#00FF88',
  },

  /** Fast cat — runs quickly, flicks fish bones at you */
  fast: {
    type: 'fast',
    name: 'Speed Cat',
    width: 20,
    height: 20,
    speed: 140,
    hp: 2,
    damage: 1,
    score: 100,
    shootInterval: 2.0,
    bulletSpeed: 250,
    projectileType: 'fishbone',
    bodyColor: '#D04040',
    eyeColor: '#FF4444',
  },

  /** Big cat — slow but tanky, lobs milk bottles */
  heavy: {
    type: 'heavy',
    name: 'Big Cat',
    width: 32,
    height: 32,
    speed: 35,
    hp: 4,
    damage: 2,
    score: 150,
    shootInterval: 2.5,
    bulletSpeed: 160,
    projectileType: 'milk',
    bodyColor: '#606080',
    eyeColor: '#FFAA00',
  },

  /** Boss cat — large, lots of HP, shoots hairballs */
  boss: {
    type: 'boss',
    name: 'Boss Cat',
    width: 40,
    height: 40,
    speed: 30,
    hp: 8,
    damage: 2,
    score: 500,
    shootInterval: 1.5,
    bulletSpeed: 200,
    projectileType: 'hairball',
    bodyColor: '#3A3A5A',
    eyeColor: '#FF0000',
    stripeColor: '#5A5A7A',
  },
};
