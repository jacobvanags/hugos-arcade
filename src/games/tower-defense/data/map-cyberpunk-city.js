/**
 * Map 4: Cyberpunk City — two paths through a neon city grid.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapCyberpunkCity = {
  id: 'cyberpunk-city',
  name: 'Cyberpunk City',
  description: 'Two paths through the neon grid. Expert difficulty.',
  difficulty: 4,

  paths: [
    {
      id: 'main',
      // City grid path — right angles like streets, entry left exit bottom
      waypoints: [
        { x: 0, y: 140 },
        { x: 180, y: 140 },
        { x: 180, y: 60 },
        { x: 400, y: 60 },
        { x: 400, y: 220 },
        { x: 260, y: 220 },
        { x: 260, y: 380 },
        { x: 400, y: 380 },
        { x: 400, y: 540 },
        { x: 260, y: 540 },
        { x: 260, y: 640 },
        { x: 260, y: 660 },
      ],
    },
    {
      id: 'secondary',
      // Second street path — entry top, crosses through city blocks, exit right
      waypoints: [
        { x: 560, y: 0 },
        { x: 560, y: 140 },
        { x: 680, y: 140 },
        { x: 680, y: 300 },
        { x: 480, y: 300 },
        { x: 480, y: 460 },
        { x: 620, y: 460 },
        { x: 620, y: 580 },
        { x: 480, y: 580 },
        { x: 480, y: 660 },
      ],
    },
  ],

  pathWidth: 26,

  theme: {
    background: '#0a0a14',
    pathColor: '#121225',
    pathBorder: '#1a1a40',
    accentColor: '#ff00ff',
    decorations: [
      // Neon signs (lights)
      { type: 'light', x: 90, y: 60, color: '#ff00ff', radius: 4 },
      { type: 'light', x: 330, y: 140, color: '#00ffff', radius: 3 },
      { type: 'light', x: 560, y: 220, color: '#ff00ff', radius: 4 },
      { type: 'light', x: 680, y: 400, color: '#00ff88', radius: 3 },
      { type: 'light', x: 180, y: 460, color: '#ff4488', radius: 3 },
      { type: 'light', x: 550, y: 520, color: '#00ffff', radius: 4 },
      // Buildings (panels)
      { type: 'panel', x: 50, y: 250, w: 60, h: 50, color: '#12122a' },
      { type: 'panel', x: 440, y: 100, w: 50, h: 35, color: '#12122a' },
      { type: 'panel', x: 580, y: 340, w: 55, h: 45, color: '#12122a' },
      { type: 'panel', x: 100, y: 560, w: 45, h: 55, color: '#12122a' },
      { type: 'panel', x: 700, y: 530, w: 40, h: 40, color: '#12122a' },
      // Street lights
      { type: 'light', x: 330, y: 310, color: '#ffaa00', radius: 2 },
      { type: 'light', x: 620, y: 240, color: '#ffaa00', radius: 2 },
      { type: 'light', x: 180, y: 480, color: '#ffaa00', radius: 2 },
    ],
  },

  startingCash: 575,
  startingLives: 75,
  cashMultiplier: 1.35,
};
