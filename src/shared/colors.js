/**
 * Shared color palette and theme constants for Hugo's Arcade.
 * All games and UI components should use these colors for consistency.
 * @module colors
 */

/** Core arcade theme palette */
export const palette = {
  // Backgrounds
  bgDark: '#0a0a0f',
  bgMedium: '#12121a',
  bgLight: '#1a1a2e',
  bgCard: '#16213e',
  bgHover: '#1f2b47',

  // Primary accents
  primary: '#e94560',
  primaryDark: '#c23152',
  primaryLight: '#ff6b81',

  // Secondary accents
  secondary: '#0f3460',
  secondaryLight: '#1a4a7a',

  // Neon accents
  neonBlue: '#00d4ff',
  neonGreen: '#00ff88',
  neonPurple: '#b44dff',
  neonYellow: '#ffd700',
  neonOrange: '#ff8c00',
  neonPink: '#ff1493',

  // Text
  textPrimary: '#e8e8e8',
  textSecondary: '#8892b0',
  textMuted: '#4a5568',
  textBright: '#ffffff',

  // Status
  success: '#00ff88',
  warning: '#ffd700',
  error: '#ff4444',
  info: '#00d4ff',

  // Game-specific common colors
  health: '#ff4444',
  mana: '#4488ff',
  gold: '#ffd700',
  xp: '#00ff88',
};

/** Genre tag colors */
export const genreColors = {
  arcade: '#e94560',
  strategy: '#0f3460',
  puzzle: '#b44dff',
  action: '#ff8c00',
  shooter: '#00d4ff',
  platformer: '#00ff88',
  rpg: '#ffd700',
  casual: '#ff1493',
};

/**
 * Creates an RGBA color string from a hex color and alpha value.
 * @param {string} hex - Hex color string (e.g., '#ff0000')
 * @param {number} alpha - Alpha value between 0 and 1
 * @returns {string} RGBA color string
 */
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Linearly interpolates between two hex colors.
 * @param {string} color1 - Start hex color
 * @param {string} color2 - End hex color
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {string} Interpolated hex color
 */
export function lerpColor(color1, color2, t) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);
  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Lightens a hex color by a given amount.
 * @param {string} hex - Hex color string
 * @param {number} amount - Amount to lighten (0 to 1)
 * @returns {string} Lightened hex color
 */
export function lighten(hex, amount) {
  return lerpColor(hex, '#ffffff', amount);
}

/**
 * Darkens a hex color by a given amount.
 * @param {string} hex - Hex color string
 * @param {number} amount - Amount to darken (0 to 1)
 * @returns {string} Darkened hex color
 */
export function darken(hex, amount) {
  return lerpColor(hex, '#000000', amount);
}

/**
 * Creates a CSS gradient string for canvas or CSS.
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {Array<[number, string]>} stops - Array of [offset, color] pairs
 * @returns {CanvasGradient} Canvas gradient object
 */
export function createGradient(ctx, x1, y1, x2, y2, stops) {
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color);
  }
  return gradient;
}
