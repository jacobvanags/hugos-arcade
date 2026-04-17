/**
 * Map 5: Crystal Caves — zigzag path through crystal formations.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapCrystalCaves = {
  id: 'crystal-caves',
  name: 'Crystal Caves',
  description: 'Zigzag path through glowing crystal caverns.',
  difficulty: 1,

  paths: [
    {
      id: 'main',
      // Sharp zigzag pattern like light refracting through crystals
      waypoints: [
        { x: 0, y: 80 },
        { x: 100, y: 80 },
        { x: 200, y: 200 },
        { x: 320, y: 80 },
        { x: 440, y: 200 },
        { x: 440, y: 320 },
        { x: 300, y: 320 },
        { x: 180, y: 420 },
        { x: 300, y: 520 },
        { x: 460, y: 420 },
        { x: 580, y: 520 },
        { x: 580, y: 360 },
        { x: 700, y: 260 },
        { x: 700, y: 440 },
        { x: 760, y: 540 },
      ],
    },
  ],

  pathWidth: 28,

  theme: {
    background: '#0a0520',
    pathColor: '#1a1040',
    pathBorder: '#2a1860',
    accentColor: '#aa55ff',
    decorations: [
      // Crystal formations (lights with glow)
      { type: 'light', x: 80, y: 180, color: '#cc66ff', radius: 5 },
      { type: 'light', x: 260, y: 140, color: '#6644ff', radius: 4 },
      { type: 'light', x: 380, y: 260, color: '#cc66ff', radius: 5 },
      { type: 'light', x: 550, y: 280, color: '#4488ff', radius: 4 },
      { type: 'light', x: 640, y: 340, color: '#aa55ff', radius: 6 },
      { type: 'light', x: 120, y: 500, color: '#6644ff', radius: 3 },
      { type: 'light', x: 500, y: 460, color: '#cc66ff', radius: 4 },
      // Cave rock formations (panels)
      { type: 'panel', x: 30, y: 300, w: 50, h: 40, color: '#120830' },
      { type: 'panel', x: 500, y: 100, w: 45, h: 35, color: '#120830' },
      { type: 'panel', x: 650, y: 530, w: 55, h: 40, color: '#120830' },
      { type: 'panel', x: 350, y: 580, w: 40, h: 30, color: '#120830' },
      { type: 'panel', x: 150, y: 280, w: 45, h: 35, color: '#120830' },
      // Small crystal sparkles
      { type: 'light', x: 370, y: 160, color: '#ffffff', radius: 1 },
      { type: 'light', x: 520, y: 560, color: '#ffffff', radius: 1 },
      { type: 'light', x: 100, y: 400, color: '#ffffff', radius: 1 },
      { type: 'light', x: 660, y: 160, color: '#ffffff', radius: 1 },
    ],
  },

  startingCash: 675,
  startingLives: 100,
  cashMultiplier: 1.0,
};
