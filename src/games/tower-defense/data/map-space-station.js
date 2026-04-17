/**
 * Map 1: Space Station — blocky corridor path with right-angle turns.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapSpaceStation = {
  id: 'space-station',
  name: 'Space Station',
  description: 'Blocky corridors through the station. Good for beginners.',
  difficulty: 1,

  paths: [
    {
      id: 'main',
      // Right-angle corridor path like hallways in a station
      waypoints: [
        { x: 0, y: 120 },
        { x: 120, y: 120 },
        { x: 120, y: 260 },
        { x: 280, y: 260 },
        { x: 280, y: 120 },
        { x: 440, y: 120 },
        { x: 440, y: 380 },
        { x: 280, y: 380 },
        { x: 280, y: 500 },
        { x: 520, y: 500 },
        { x: 520, y: 300 },
        { x: 660, y: 300 },
        { x: 660, y: 540 },
        { x: 760, y: 540 },
      ],
    },
  ],

  pathWidth: 30,

  theme: {
    background: '#080818',
    pathColor: '#1a2a3a',
    pathBorder: '#2a4a5a',
    accentColor: '#00d4ff',
    decorations: [
      // Wall panels
      { type: 'panel', x: 10, y: 50, w: 50, h: 30, color: '#1a1a2e' },
      { type: 'panel', x: 350, y: 60, w: 60, h: 25, color: '#1a1a2e' },
      { type: 'panel', x: 560, y: 80, w: 45, h: 35, color: '#1a1a2e' },
      { type: 'panel', x: 150, y: 420, w: 40, h: 30, color: '#1a1a2e' },
      { type: 'panel', x: 580, y: 440, w: 50, h: 25, color: '#1a1a2e' },
      // Lights
      { type: 'light', x: 200, y: 180, color: '#00ff88', radius: 3 },
      { type: 'light', x: 360, y: 300, color: '#00d4ff', radius: 3 },
      { type: 'light', x: 600, y: 180, color: '#ff4444', radius: 3 },
      { type: 'light', x: 400, y: 450, color: '#ffd700', radius: 3 },
      { type: 'light', x: 700, y: 430, color: '#00d4ff', radius: 2 },
    ],
  },

  startingCash: 650,
  startingLives: 100,
  cashMultiplier: 1.0,
};
