/**
 * Math utilities for game development.
 * Includes vector math, collision detection, random helpers, and easing functions.
 * @module math-utils
 */

// ─── Vector Operations ───────────────────────────────────────────

/**
 * Creates a 2D vector.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
export function vec2(x = 0, y = 0) {
  return { x, y };
}

/**
 * Adds two vectors.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {{ x: number, y: number }}
 */
export function vecAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtracts vector b from a.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {{ x: number, y: number }}
 */
export function vecSub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiplies a vector by a scalar.
 * @param {{ x: number, y: number }} v
 * @param {number} s
 * @returns {{ x: number, y: number }}
 */
export function vecScale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

/**
 * Returns the magnitude (length) of a vector.
 * @param {{ x: number, y: number }} v
 * @returns {number}
 */
export function vecLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Returns a normalized (unit length) vector.
 * @param {{ x: number, y: number }} v
 * @returns {{ x: number, y: number }}
 */
export function vecNormalize(v) {
  const len = vecLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

/**
 * Returns the dot product of two vectors.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function vecDot(a, b) {
  return a.x * b.x + a.y * b.y;
}

/**
 * Returns the distance between two points.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function vecDist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Returns the squared distance between two points (faster than vecDist).
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function vecDistSq(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * Returns the angle in radians from vector a to b.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @returns {number}
 */
export function vecAngle(a, b) {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

/**
 * Rotates a vector by an angle in radians.
 * @param {{ x: number, y: number }} v
 * @param {number} angle
 * @returns {{ x: number, y: number }}
 */
export function vecRotate(v, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.y * sin, y: v.x * sin + v.y * cos };
}

/**
 * Linearly interpolates between two vectors.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {{ x: number, y: number }}
 */
export function vecLerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ─── Collision Detection ─────────────────────────────────────────

/**
 * AABB (Axis-Aligned Bounding Box) collision detection.
 * @param {{ x: number, y: number, width: number, height: number }} a
 * @param {{ x: number, y: number, width: number, height: number }} b
 * @returns {boolean}
 */
export function collideAABB(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Circle-circle collision detection.
 * @param {{ x: number, y: number, radius: number }} a
 * @param {{ x: number, y: number, radius: number }} b
 * @returns {boolean}
 */
export function collideCircles(a, b) {
  const dist = vecDistSq(a, b);
  const radii = a.radius + b.radius;
  return dist <= radii * radii;
}

/**
 * Point-in-rectangle collision detection.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @returns {boolean}
 */
export function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * Point-in-circle collision detection.
 * @param {{ x: number, y: number }} point
 * @param {{ x: number, y: number, radius: number }} circle
 * @returns {boolean}
 */
export function pointInCircle(point, circle) {
  return vecDistSq(point, circle) <= circle.radius * circle.radius;
}

/**
 * Circle-rectangle collision detection.
 * @param {{ x: number, y: number, radius: number }} circle
 * @param {{ x: number, y: number, width: number, height: number }} rect
 * @returns {boolean}
 */
export function collideCircleRect(circle, rect) {
  const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

// ─── Number Utilities ────────────────────────────────────────────

/**
 * Clamps a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linearly interpolates between two numbers.
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Maps a value from one range to another.
 * @param {number} value
 * @param {number} inMin
 * @param {number} inMax
 * @param {number} outMin
 * @param {number} outMax
 * @returns {number}
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/**
 * Converts degrees to radians.
 * @param {number} deg
 * @returns {number}
 */
export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 * @param {number} rad
 * @returns {number}
 */
export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

// ─── Random Helpers ──────────────────────────────────────────────

/**
 * Returns a random float between min and max.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Returns a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns true with the given probability (0 to 1).
 * @param {number} chance - Probability between 0 and 1
 * @returns {boolean}
 */
export function randomChance(chance) {
  return Math.random() < chance;
}

/**
 * Shuffles an array in place (Fisher-Yates).
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Easing Functions ────────────────────────────────────────────

/** @param {number} t - Progress (0 to 1) */
export const easeInQuad = (t) => t * t;
export const easeOutQuad = (t) => t * (2 - t);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
export const easeInCubic = (t) => t * t * t;
export const easeOutCubic = (t) => (--t) * t * t + 1;
export const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
export const easeInElastic = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
export const easeOutElastic = (t) =>
  t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
export const easeOutBounce = (t) => {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
  if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
  return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
};
export const easeInBack = (t) => 2.70158 * t * t * t - 1.70158 * t * t;
export const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
