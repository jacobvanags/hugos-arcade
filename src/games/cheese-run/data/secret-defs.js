/**
 * Per-world secret definitions.
 *
 * Each world has one secret hidden in a specific level.
 * Trigger types:
 *   'push'  — player pushes an object aside to reveal a door
 *   'key'   — player grabs a hard-to-reach key that opens a locked door
 *   'break' — player shoots a cracked wall to break it open
 */

export const worldSecrets = [
  // ─── World 0: The Kitchen ───────────────────────────────────
  // Hidden in Level 2 "Counter Tops"
  // A large pot blocks a mousehole in the wall. Push it aside.
  {
    world: 0,
    levelIdx: 1, // which level contains this secret (Counter Tops)
    trigger: {
      type: 'push',
      label: 'Suspicious Pot',
      objectVisual: 'pot',        // what it looks like
      x: 1920, y: 288,           // starting position (tile col 60, row 9 area — near end of level)
      width: 28, height: 28,
      pushDir: 1,                 // push right
      pushDist: 48,               // pixels to push before door opens
    },
    door: {
      x: 1952, y: 288,           // door appears behind where the pot was
      width: 28, height: 32,
      visual: 'mousehole',
    },
    tunnel: {
      theme: 'kitchen',
      duration: 3.5,
    },
    bonusRoomId: 'kitchenBonus',
    reward: {
      name: 'Golden Spatula',
      unlocksLevelIdx: 18,        // index into the levels array
    },
  },

  // ─── World 3: The Sewers ────────────────────────────────────
  // Hidden in Level 11 "Pipe Maze"
  // A giant pipe cap sits on top of a drain. Push it off.
  {
    world: 3,
    levelIdx: 10, // Pipe Maze
    trigger: {
      type: 'push',
      label: 'Giant Tomato',
      objectVisual: 'tomato',
      x: 1280, y: 256,
      width: 30, height: 30,
      pushDir: 1,
      pushDist: 48,
    },
    door: {
      x: 1280, y: 260,
      width: 28, height: 32,
      visual: 'gardenDoor',
    },
    tunnel: {
      theme: 'garden',
      duration: 3.5,
    },
    bonusRoomId: 'gardenBonus',
    reward: {
      name: 'Crystal Seed',
      unlocksLevelIdx: 19,
    },
  },

  // ─── World 5: The Warehouse ─────────────────────────────────
  // Hidden in Level 17 "Security Wing"
  // A keycard is on a hard-to-reach high platform. Grab it to open a security door below.
  {
    world: 5,
    levelIdx: 16, // Security Wing
    trigger: {
      type: 'key',
      label: 'Keycard',
      objectVisual: 'keycard',
      x: 2100, y: 128,           // high up, hard to reach
      width: 16, height: 12,
    },
    door: {
      x: 2200, y: 384,           // security door on ground level
      width: 28, height: 32,
      visual: 'securityDoor',
    },
    tunnel: {
      theme: 'warehouse',
      duration: 3.5,
    },
    bonusRoomId: 'warehouseBonus',
    reward: {
      name: 'Master Blueprint',
      unlocksLevelIdx: 20,
    },
  },
];

/**
 * Bonus room layouts — small temporary areas packed with cheese.
 * The special reward item is marked with '*'.
 */
export const bonusRooms = {
  kitchenBonus: {
    name: 'Cheese Cellar',
    world: 0,
    rows: [
      '.........................',
      '.....c.....c.....c......',
      '....===...===...===.....',
      '.........................',
      '..c....................c.',
      '..===....c...c....===...',
      '..........===...........',
      '.....c...........c......',
      '..S..===...*.....===....',
      '........=====...........',
      '#########################',
    ],
  },
  gardenBonus: {
    name: 'Underground Spring',
    world: 1,
    rows: [
      '.........................',
      '...c..........c..........',
      '..===........===.........',
      '.........................',
      '.........c...*..c........',
      '........=======.........',
      '.........................',
      '..c..c......c..c..c.....',
      '..S..===..===..===......',
      '.........................',
      '#########################',
    ],
  },
  warehouseBonus: {
    name: 'Hidden Office',
    world: 2,
    rows: [
      '.........................',
      '..c..c..c..c..c..c......',
      '..=====================.',
      '.........................',
      '...........*.............',
      '..........===............',
      '.........................',
      '..c..c..c..c..c..c......',
      '..S..===..===..===......',
      '.........................',
      '#########################',
    ],
  },
};
