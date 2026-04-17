/**
 * Game-specific configuration and balance values.
 * Modify these to tune gameplay without touching game logic.
 */
export const config = {
  /** Canvas dimensions */
  width: 800,
  height: 600,

  /** Ball settings */
  ball: {
    radius: 12,
    speed: 200,
    color: '#00d4ff',
    trailColor: '#00d4ff',
  },

  /** Visual settings */
  background: '#0a0a1a',
  gridColor: 'rgba(255,255,255,0.03)',
  gridSize: 40,

  /** Demo text */
  title: 'Game Template',
  subtitle: 'Press ESC to return to arcade',
};
