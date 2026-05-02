/**
 * Cheese Run — game configuration and balance values.
 */
export const config = {
  /** Canvas dimensions */
  width: 800,
  height: 600,

  /** Tile size in pixels */
  tileSize: 32,

  /** Player (mouse) settings */
  player: {
    width: 20,
    height: 24,
    speed: 200,
    jumpForce: 420,
    doubleJumpForce: 360,
    wallJumpForceX: 260,
    wallJumpForceY: 380,
    wallSlideSpeed: 60,    // max fall speed when sliding on wall
    gravity: 1100,
    maxFallSpeed: 600,
    fireRate: 0.2,
    invincibleTime: 1.5,
    maxHP: 3,
    enemyBounceForce: 350, // bounce off enemy heads
    spawnSafetyTime: 2.0,  // seconds of invincibility at level start
  },

  /** Max HP per world (increases as you progress) */
  worldHP: {
    0: 3,  // The Kitchen
    1: 3,  // The Pantry
    2: 4,  // The Garden
    3: 4,  // The Sewers
    4: 5,  // The Rooftops
    5: 5,  // The Warehouse
  },

  /** Boss scaling per world — multiplied against base boss stats */
  bossScaling: {
    0: { hpMult: 0.6,  shootMult: 1.4,  speedMult: 0.8,  name: 'Kitchen King' },
    1: { hpMult: 0.8,  shootMult: 1.2,  speedMult: 0.9,  name: 'Shelf Guardian' },
    2: { hpMult: 1.0,  shootMult: 1.0,  speedMult: 1.0,  name: 'Garden Beast' },
    3: { hpMult: 1.3,  shootMult: 0.9,  speedMult: 1.1,  name: 'Sewer Lord' },
    4: { hpMult: 1.6,  shootMult: 0.85, speedMult: 1.2,  name: 'Night Stalker' },
    5: { hpMult: 2.0,  shootMult: 0.7,  speedMult: 1.3,  name: 'Warehouse Warden' },
  },

  /** Difficulty modes — applied on top of bossScaling. */
  difficulties: {
    easy:   { label: 'EASY',   color: '#7BC96A', bossHpMult: 0.5 },
    medium: { label: 'MEDIUM', color: '#FFD700', bossHpMult: 1.0 },
    hard:   { label: 'HARD',   color: '#FF6464', bossHpMult: 1.5 },
  },
  defaultDifficulty: 'easy',

  /** Weapon definitions */
  weapons: {
    pistol: {
      id: 'pistol',
      name: 'Pea Shooter',
      speed: 500,
      width: 8,
      height: 4,
      damage: 1,
      fireRate: 0.2,
      color: '#FFD700',
      trailColor: 'rgba(255,215,0,0.3)',
      auto: false,
    },
    shotgun: {
      id: 'shotgun',
      name: 'Cheese Blaster',
      speed: 400,
      width: 6,
      height: 6,
      damage: 1,
      fireRate: 0.5,
      pellets: 3,
      spread: 0.3,
      color: '#FF8C00',
      trailColor: 'rgba(255,140,0,0.3)',
      auto: false,
    },
    machinegun: {
      id: 'machinegun',
      name: 'Rat-a-Tat',
      speed: 600,
      width: 6,
      height: 3,
      damage: 1,
      fireRate: 0.08,
      color: '#00DDFF',
      trailColor: 'rgba(0,221,255,0.3)',
      auto: true,
    },
    launcher: {
      id: 'launcher',
      name: 'Cheddar Cannon',
      speed: 350,
      width: 12,
      height: 10,
      damage: 3,
      fireRate: 0.8,
      color: '#FF4444',
      trailColor: 'rgba(255,68,68,0.3)',
      explosive: true,
      splashRadius: 48,
      auto: false,
    },
  },

  /** Which weapon unlocks after completing each level (0-indexed) */
  weaponUnlocks: {
    5: 'shotgun',      // complete Kitchen boss (level 6) → unlock Cheese Blaster
    11: 'machinegun',  // complete Garden boss (level 12) → unlock Rat-a-Tat
    17: 'launcher',    // complete Warehouse boss (level 18) → unlock Cheddar Cannon
  },

  /** Pickup values */
  pickups: {
    cheese: 100,
    health: 1,
  },

  /** World themes */
  worlds: [
    { name: 'The Kitchen',   bg1: '#1a1520', bg2: '#2a2030', platformColor: '#8B6914', groundColor: '#6B4E0A', accentColor: '#D4A017' },
    { name: 'The Pantry',    bg1: '#1a1510', bg2: '#2a2520', platformColor: '#8B5E14', groundColor: '#6B3E0A', accentColor: '#C98A17' },
    { name: 'The Garden',    bg1: '#0a1a10', bg2: '#1a2a20', platformColor: '#3B7A2B', groundColor: '#2A5A1A', accentColor: '#7BC96A' },
    { name: 'The Sewers',    bg1: '#0a1518', bg2: '#152228', platformColor: '#3A6A5A', groundColor: '#2A4A3A', accentColor: '#5AB89A' },
    { name: 'The Rooftops',  bg1: '#0e0e1e', bg2: '#1a1a30', platformColor: '#5A5A8A', groundColor: '#3A3A6A', accentColor: '#8888CC' },
    { name: 'The Warehouse', bg1: '#151520', bg2: '#252535', platformColor: '#6A6A7A', groundColor: '#4A4A5A', accentColor: '#9A9ABA' },
  ],
};
