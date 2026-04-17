/**
 * Tower Defense — Global game constants.
 */
export const config = {
  width: 1000,
  height: 700,

  // Layout regions
  gameArea: { x: 0, y: 40, w: 760, h: 660 },
  hudBar: { x: 0, y: 0, w: 760, h: 40 },
  sidebar: { x: 760, y: 0, w: 240, h: 700 },

  // Grid
  cellSize: 20,
  gridCols: 38,
  gridRows: 33,
  gridOffsetY: 40,

  // Cell types
  EMPTY: 0,
  PATH: 1,
  TOWER: 2,
  BLOCKED: 3,
  ENTRY: 4,
  EXIT: 5,
  HERO: 6,

  // Game defaults
  startingCash: 650,
  startingLives: 100,
  sellRefund: 0.7,
  totalWaves: 80,

  // Visuals
  colors: {
    background: '#0a0a1a',
    gridLine: 'rgba(255,255,255,0.03)',
    pathFill: '#1a2a3a',
    pathBorder: '#2a3a4a',
    hudBg: 'rgba(10,10,15,0.9)',
    sidebarBg: '#0d0d18',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    cellHoverValid: 'rgba(0,255,136,0.2)',
    cellHoverInvalid: 'rgba(255,68,68,0.2)',
    rangeCircle: 'rgba(255,255,255,0.08)',
    rangeCircleActive: 'rgba(0,212,255,0.15)',
  },
};

// Grid cell coordinate helpers
export function cellToPixel(col, row) {
  return {
    x: col * config.cellSize + config.cellSize / 2,
    y: row * config.cellSize + config.gridOffsetY + config.cellSize / 2,
  };
}

export function pixelToCell(px, py) {
  return {
    col: Math.floor(px / config.cellSize),
    row: Math.floor((py - config.gridOffsetY) / config.cellSize),
  };
}
