/**
 * Map 6: Frozen Tundra — single long winding S-curve path across icy terrain.
 * Grid: 38 cols x 33 rows, 20px cells, game area starts at y=40.
 */
export const mapFrozenTundra = {
  id: 'frozen-tundra',
  name: 'Frozen Tundra',
  description: 'Long winding path across frozen wasteland. Medium difficulty.',
  difficulty: 2,

  paths: [
    {
      id: 'main',
      // Entry from top-left, smooth S-curve winding across, exits bottom-right
      waypoints: [
        { x: 0, y: 80 },
        { x: 40, y: 78 },
        { x: 90, y: 72 },
        { x: 140, y: 68 },
        { x: 195, y: 72 },
        { x: 250, y: 85 },
        { x: 310, y: 108 },
        { x: 365, y: 140 },
        { x: 410, y: 178 },
        { x: 445, y: 220 },
        { x: 470, y: 265 },
        { x: 488, y: 310 },
        { x: 498, y: 350 },
        { x: 500, y: 385 },
        { x: 492, y: 415 },
        { x: 472, y: 438 },
        { x: 440, y: 450 },
        { x: 400, y: 452 },
        { x: 350, y: 448 },
        { x: 295, y: 440 },
        { x: 240, y: 438 },
        { x: 190, y: 445 },
        { x: 148, y: 462 },
        { x: 118, y: 490 },
        { x: 100, y: 525 },
        { x: 98, y: 560 },
        { x: 110, y: 590 },
        { x: 138, y: 610 },
        { x: 178, y: 622 },
        { x: 230, y: 628 },
        { x: 290, y: 625 },
        { x: 355, y: 615 },
        { x: 420, y: 598 },
        { x: 480, y: 575 },
        { x: 535, y: 548 },
        { x: 582, y: 518 },
        { x: 618, y: 488 },
        { x: 648, y: 462 },
        { x: 678, y: 445 },
        { x: 710, y: 440 },
        { x: 740, y: 442 },
        { x: 760, y: 448 },
      ],
    },
  ],

  pathWidth: 28,

  theme: {
    background: '#080e1a',
    pathColor: '#1a2530',
    pathBorder: '#2a4050',
    accentColor: '#88ccff',
    decorations: [
      // Ice crystal formations
      { type: 'light', x: 150, y: 160, color: '#88ddff', radius: 5 },
      { type: 'light', x: 550, y: 140, color: '#66bbff', radius: 4 },
      { type: 'light', x: 680, y: 280, color: '#88ddff', radius: 5 },
      { type: 'light', x: 320, y: 340, color: '#aaeeff', radius: 3 },
      { type: 'light', x: 60, y: 380, color: '#66bbff', radius: 4 },
      { type: 'light', x: 500, y: 480, color: '#88ddff', radius: 3 },
      // Snow drifts / ice formations (panels)
      { type: 'panel', x: 580, y: 60, w: 55, h: 35, color: '#152535' },
      { type: 'panel', x: 30, y: 200, w: 45, h: 30, color: '#152535' },
      { type: 'panel', x: 620, y: 360, w: 50, h: 35, color: '#152535' },
      { type: 'panel', x: 200, y: 530, w: 40, h: 25, color: '#152535' },
      { type: 'panel', x: 700, y: 560, w: 45, h: 30, color: '#152535' },
      { type: 'panel', x: 380, y: 50, w: 50, h: 30, color: '#152535' },
      // Frost sparkles
      { type: 'light', x: 250, y: 200, color: '#ffffff', radius: 1 },
      { type: 'light', x: 440, y: 320, color: '#ffffff', radius: 1 },
      { type: 'light', x: 180, y: 480, color: '#ffffff', radius: 1 },
      { type: 'light', x: 650, y: 530, color: '#ffffff', radius: 1 },
      { type: 'light', x: 720, y: 150, color: '#ffffff', radius: 1 },
    ],
  },

  startingCash: 625,
  startingLives: 90,
  cashMultiplier: 1.1,
};
