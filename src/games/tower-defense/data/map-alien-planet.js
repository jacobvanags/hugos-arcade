/**
 * Map 2: Alien Planet — volcanic terrain with a long winding path.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapAlienPlanet = {
  id: 'alien-planet',
  name: 'Alien Planet',
  description: 'Volcanic terrain with a winding path. Medium difficulty.',
  difficulty: 2,

  paths: [
    {
      id: 'main',
      // Entry from left, sweeps up then winds down through the map, exits right
      waypoints: [
        { x: 0, y: 330 },
        { x: 45, y: 325 },
        { x: 85, y: 305 },
        { x: 100, y: 265 },
        { x: 102, y: 215 },
        { x: 110, y: 165 },
        { x: 135, y: 125 },
        { x: 178, y: 100 },
        { x: 225, y: 98 },
        { x: 260, y: 115 },
        { x: 270, y: 155 },
        { x: 265, y: 220 },
        { x: 262, y: 310 },
        { x: 270, y: 395 },
        { x: 300, y: 455 },
        { x: 350, y: 490 },
        { x: 405, y: 495 },
        { x: 440, y: 470 },
        { x: 450, y: 420 },
        { x: 445, y: 355 },
        { x: 442, y: 280 },
        { x: 455, y: 225 },
        { x: 488, y: 195 },
        { x: 530, y: 190 },
        { x: 565, y: 205 },
        { x: 578, y: 242 },
        { x: 572, y: 310 },
        { x: 568, y: 385 },
        { x: 585, y: 432 },
        { x: 625, y: 445 },
        { x: 662, y: 430 },
        { x: 680, y: 390 },
        { x: 678, y: 330 },
        { x: 675, y: 260 },
        { x: 685, y: 200 },
        { x: 715, y: 165 },
        { x: 760, y: 160 },
      ],
    },
  ],

  pathWidth: 30,

  theme: {
    background: '#1a0a0a',
    pathColor: '#2a1a10',
    pathBorder: '#4a2a18',
    accentColor: '#ff4400',
    decorations: [
      // Lava pools
      { type: 'light', x: 180, y: 280, color: '#ff4400', radius: 5 },
      { type: 'light', x: 340, y: 150, color: '#ff6600', radius: 4 },
      { type: 'light', x: 500, y: 350, color: '#ff4400', radius: 6 },
      { type: 'light', x: 620, y: 300, color: '#ff2200', radius: 4 },
      // Rock formations
      { type: 'panel', x: 40, y: 420, w: 40, h: 25, color: '#2a1510' },
      { type: 'panel', x: 320, y: 60, w: 50, h: 30, color: '#2a1510' },
      { type: 'panel', x: 500, y: 550, w: 45, h: 25, color: '#2a1510' },
      { type: 'panel', x: 700, y: 280, w: 35, h: 40, color: '#2a1510' },
      // Alien crystals
      { type: 'light', x: 60, y: 200, color: '#aa44ff', radius: 3 },
      { type: 'light', x: 350, y: 360, color: '#44ffaa', radius: 3 },
      { type: 'light', x: 720, y: 550, color: '#aa44ff', radius: 3 },
    ],
  },

  startingCash: 625,
  startingLives: 100,
  cashMultiplier: 1.1,
};
