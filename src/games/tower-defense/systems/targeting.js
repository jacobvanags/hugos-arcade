/**
 * Tower targeting strategies.
 */
import { vecDistSq } from '../../../shared/math-utils.js';

/**
 * Find the best target for a tower based on its targeting mode.
 * @param {object} tower
 * @param {object[]} enemies
 * @param {string} mode - 'first', 'last', 'strongest', 'closest'
 * @returns {object|null}
 */
export function findTarget(tower, enemies, mode) {
  const range = tower.effectiveRange || tower.range;
  const rangeSq = range * range;
  const inRange = [];

  for (const e of enemies) {
    if (e.hp <= 0) continue;
    if (e.cloaked && !tower.detectCloaked) continue;
    const dSq = vecDistSq(tower, e);
    if (dSq <= rangeSq) {
      inRange.push(e);
    }
  }

  if (inRange.length === 0) return null;

  switch (mode) {
    case 'first':
      return inRange.reduce((best, e) => e.pathProgress > best.pathProgress ? e : best);
    case 'last':
      return inRange.reduce((best, e) => e.pathProgress < best.pathProgress ? e : best);
    case 'strongest':
      return inRange.reduce((best, e) => e.hp > best.hp ? e : best);
    case 'closest':
      return inRange.reduce((best, e) =>
        vecDistSq(tower, e) < vecDistSq(tower, best) ? e : best);
    default:
      return inRange[0];
  }
}
