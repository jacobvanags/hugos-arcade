/**
 * World map layout — node positions, paths, visual regions.
 * 21 nodes: 6 worlds × 3 levels each + 3 secrets.
 *
 * Flow (C-shaped spiral):
 *   Kitchen → Pantry → Garden
 *                          ↓
 *   Warehouse ← Rooftops ← Sewers
 */

export const mapNodes = [
  // ─── World 0: The Kitchen (top-left) ───
  { id: 0,  levelIdx: 0,  world: 0, x: 80,  y: 135, name: 'First Steps',       type: 'level',  adj: [1] },
  { id: 1,  levelIdx: 1,  world: 0, x: 155, y: 118, name: 'Counter Tops',      type: 'level',  adj: [0, 2] },
  { id: 2,  levelIdx: 2,  world: 0, x: 230, y: 140, name: 'Kitchen King',      type: 'boss',   adj: [1, 3, 4] },
  { id: 3,  levelIdx: 18, world: 0, x: 160, y: 182, name: 'The Pantry Secret', type: 'secret', adj: [2], secretWorld: 0 },

  // ─── World 1: The Pantry (top-center) ───
  { id: 4,  levelIdx: 3,  world: 1, x: 315, y: 125, name: 'Spice Rack',        type: 'level',  adj: [2, 5] },
  { id: 5,  levelIdx: 4,  world: 1, x: 390, y: 108, name: 'Knife Block Run',   type: 'level',  adj: [4, 6] },
  { id: 6,  levelIdx: 5,  world: 1, x: 460, y: 130, name: 'Shelf Scramble',    type: 'boss',   adj: [5, 7] },

  // ─── World 2: The Garden (top-right) ───
  { id: 7,  levelIdx: 6,  world: 2, x: 550, y: 135, name: 'Garden Path',       type: 'level',  adj: [6, 8] },
  { id: 8,  levelIdx: 7,  world: 2, x: 625, y: 118, name: 'Hedge Maze',        type: 'level',  adj: [7, 9] },
  { id: 9,  levelIdx: 8,  world: 2, x: 700, y: 140, name: 'Garden Beast',      type: 'boss',   adj: [8, 10] },

  // ─── World 3: The Sewers (bottom-right) ───
  { id: 10, levelIdx: 9,  world: 3, x: 690, y: 310, name: 'Storm Drain',       type: 'level',  adj: [9, 11] },
  { id: 11, levelIdx: 10, world: 3, x: 615, y: 328, name: 'Pipe Maze',         type: 'level',  adj: [10, 12] },
  { id: 12, levelIdx: 11, world: 3, x: 540, y: 308, name: 'Sewer Lord',        type: 'boss',   adj: [11, 13, 14] },
  { id: 13, levelIdx: 19, world: 3, x: 610, y: 368, name: 'The Hidden Drain',  type: 'secret', adj: [12], secretWorld: 3 },

  // ─── World 4: The Rooftops (bottom-center) ───
  { id: 14, levelIdx: 12, world: 4, x: 450, y: 350, name: 'Gutter Run',        type: 'level',  adj: [12, 15] },
  { id: 15, levelIdx: 13, world: 4, x: 375, y: 368, name: 'Chimney Tops',      type: 'level',  adj: [14, 16] },
  { id: 16, levelIdx: 14, world: 4, x: 305, y: 348, name: 'Night Stalker',     type: 'boss',   adj: [15, 17] },

  // ─── World 5: The Warehouse (bottom-left) ───
  { id: 17, levelIdx: 15, world: 5, x: 220, y: 390, name: 'Crate Canyon',      type: 'level',  adj: [16, 18] },
  { id: 18, levelIdx: 16, world: 5, x: 145, y: 408, name: 'Security Wing',     type: 'level',  adj: [17, 19] },
  { id: 19, levelIdx: 17, world: 5, x: 75,  y: 388, name: 'The Final Chase',   type: 'boss',   adj: [18, 20] },
  { id: 20, levelIdx: 20, world: 5, x: 140, y: 450, name: 'The Hidden Vault',  type: 'secret', adj: [19], secretWorld: 5 },
];

/** Edges connecting nodes — used for rendering paths */
export const mapPaths = [
  // Kitchen
  [0, 1], [1, 2], [2, 3],
  // Kitchen → Pantry
  [2, 4],
  // Pantry
  [4, 5], [5, 6],
  // Pantry → Garden
  [6, 7],
  // Garden
  [7, 8], [8, 9],
  // Garden → Sewers (down)
  [9, 10],
  // Sewers
  [10, 11], [11, 12], [12, 13],
  // Sewers → Rooftops
  [12, 14],
  // Rooftops
  [14, 15], [15, 16],
  // Rooftops → Warehouse
  [16, 17],
  // Warehouse
  [17, 18], [18, 19], [19, 20],
];

/** Visual regions drawn behind the nodes */
export const mapRegions = [
  {
    world: 0,
    label: 'The Kitchen',
    points: [
      [35, 88], [268, 82], [275, 142], [262, 198],
      [142, 205], [30, 195], [25, 138],
    ],
    fill: 'rgba(139,105,20,0.15)',
    stroke: 'rgba(212,160,23,0.25)',
    labelPos: [155, 88],
    labelColor: '#D4A017',
  },
  {
    world: 1,
    label: 'The Pantry',
    points: [
      [278, 80], [498, 76], [505, 132], [495, 175],
      [380, 180], [270, 175], [265, 128],
    ],
    fill: 'rgba(160,120,30,0.12)',
    stroke: 'rgba(201,138,23,0.22)',
    labelPos: [390, 80],
    labelColor: '#C98A17',
  },
  {
    world: 2,
    label: 'The Garden',
    points: [
      [510, 85], [738, 80], [745, 142], [732, 190],
      [618, 198], [505, 192], [498, 138],
    ],
    fill: 'rgba(59,122,43,0.15)',
    stroke: 'rgba(123,201,106,0.25)',
    labelPos: [625, 85],
    labelColor: '#7BC96A',
  },
  {
    world: 3,
    label: 'The Sewers',
    points: [
      [500, 268], [730, 262], [738, 318], [725, 388],
      [612, 395], [500, 385], [492, 322],
    ],
    fill: 'rgba(40,90,80,0.15)',
    stroke: 'rgba(90,184,154,0.22)',
    labelPos: [620, 268],
    labelColor: '#5AB89A',
  },
  {
    world: 4,
    label: 'The Rooftops',
    points: [
      [265, 308], [490, 302], [498, 355], [488, 410],
      [372, 418], [260, 408], [252, 352],
    ],
    fill: 'rgba(70,70,110,0.15)',
    stroke: 'rgba(136,136,204,0.22)',
    labelPos: [380, 308],
    labelColor: '#8888CC',
  },
  {
    world: 5,
    label: 'The Warehouse',
    points: [
      [32, 348], [258, 342], [265, 398], [255, 472],
      [138, 478], [28, 468], [22, 402],
    ],
    fill: 'rgba(106,106,122,0.15)',
    stroke: 'rgba(154,154,186,0.25)',
    labelPos: [148, 348],
    labelColor: '#9A9ABA',
  },
];

/**
 * Find the best adjacent node in a given direction.
 * Returns node id or null.
 */
export function findNodeInDirection(currentId, direction, isAccessible) {
  const cur = mapNodes[currentId];
  if (!cur) return null;

  let bestId = null;
  let bestScore = Infinity;

  for (const adjId of cur.adj) {
    const adj = mapNodes[adjId];
    if (!adj || !isAccessible(adj)) continue;

    const dx = adj.x - cur.x;
    const dy = adj.y - cur.y;

    let aligned = false;
    switch (direction) {
      case 'right': aligned = dx > 5; break;
      case 'left':  aligned = dx < -5; break;
      case 'down':  aligned = dy > 5; break;
      case 'up':    aligned = dy < -5; break;
    }

    if (!aligned) continue;

    let dist = dx * dx + dy * dy;
    if (direction === 'right' || direction === 'left') {
      dist += Math.abs(dy) * 2;
    } else {
      dist += Math.abs(dx) * 2;
    }

    if (dist < bestScore) {
      bestScore = dist;
      bestId = adjId;
    }
  }

  return bestId;
}
