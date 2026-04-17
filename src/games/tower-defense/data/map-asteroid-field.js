/**
 * Map 3: Asteroid Field — two paths forming an X-cross through the field.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapAsteroidField = {
  id: 'asteroid-field',
  name: 'Asteroid Field',
  description: 'Two crossing paths through asteroid debris. Hard difficulty.',
  difficulty: 3,

  paths: [
    {
      id: 'main',
      // Entry top-left, diagonal staircase down to bottom-right
      waypoints: [
        { x: 0, y: 60 },
        { x: 100, y: 60 },
        { x: 100, y: 180 },
        { x: 250, y: 180 },
        { x: 250, y: 300 },
        { x: 380, y: 300 },
        { x: 380, y: 180 },
        { x: 500, y: 180 },
        { x: 500, y: 360 },
        { x: 620, y: 360 },
        { x: 620, y: 500 },
        { x: 760, y: 500 },
      ],
    },
    {
      id: 'secondary',
      // Entry bottom-left, diagonal staircase up to top-right — crosses main path
      waypoints: [
        { x: 0, y: 580 },
        { x: 140, y: 580 },
        { x: 140, y: 440 },
        { x: 300, y: 440 },
        { x: 300, y: 300 },
        { x: 420, y: 300 },
        { x: 420, y: 440 },
        { x: 540, y: 440 },
        { x: 540, y: 260 },
        { x: 660, y: 260 },
        { x: 660, y: 120 },
        { x: 760, y: 120 },
      ],
    },
  ],

  pathWidth: 28,

  theme: {
    background: '#060610',
    pathColor: '#151525',
    pathBorder: '#252540',
    accentColor: '#8888ff',
    decorations: [
      // Asteroids (panels as rocks)
      { type: 'panel', x: 30, y: 280, w: 35, h: 30, color: '#1a1a25' },
      { type: 'panel', x: 180, y: 80, w: 45, h: 35, color: '#1a1a25' },
      { type: 'panel', x: 450, y: 80, w: 30, h: 40, color: '#1a1a25' },
      { type: 'panel', x: 170, y: 500, w: 40, h: 30, color: '#1a1a25' },
      { type: 'panel', x: 700, y: 300, w: 50, h: 35, color: '#1a1a25' },
      { type: 'panel', x: 480, y: 540, w: 35, h: 25, color: '#1a1a25' },
      // Stars
      { type: 'light', x: 350, y: 80, color: '#ffffff', radius: 1 },
      { type: 'light', x: 580, y: 140, color: '#ffffff', radius: 1 },
      { type: 'light', x: 200, y: 350, color: '#aaaaff', radius: 1 },
      { type: 'light', x: 450, y: 520, color: '#ffffff', radius: 1 },
      { type: 'light', x: 720, y: 420, color: '#ffffff', radius: 1 },
      { type: 'light', x: 60, y: 160, color: '#aaaaff', radius: 2 },
      // Nebula glow
      { type: 'light', x: 380, y: 350, color: '#4444aa', radius: 8 },
    ],
  },

  startingCash: 600,
  startingLives: 80,
  cashMultiplier: 1.2,
};
