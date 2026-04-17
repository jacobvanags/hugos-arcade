/**
 * Path following system — moves enemies along waypoint paths.
 */
import { vecDist, vecSub, vecNormalize, vecAngle } from '../../../shared/math-utils.js';

/**
 * Calculate total pixel length of a waypoint path.
 */
export function getPathLength(waypoints) {
  let len = 0;
  for (let i = 1; i < waypoints.length; i++) {
    len += vecDist(waypoints[i - 1], waypoints[i]);
  }
  return len;
}

/**
 * Get position and angle at a given distance along a path.
 * @returns {{ x: number, y: number, angle: number, done: boolean }}
 */
export function getPositionOnPath(waypoints, distance) {
  if (waypoints.length < 2) return { x: waypoints[0].x, y: waypoints[0].y, angle: 0, done: true };

  let remaining = distance;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const segLen = vecDist(prev, curr);

    if (remaining <= segLen) {
      const t = remaining / segLen;
      return {
        x: prev.x + (curr.x - prev.x) * t,
        y: prev.y + (curr.y - prev.y) * t,
        angle: Math.atan2(curr.y - prev.y, curr.x - prev.x),
        done: false,
      };
    }
    remaining -= segLen;
  }

  // Past the end
  const last = waypoints[waypoints.length - 1];
  const prev = waypoints[waypoints.length - 2];
  return {
    x: last.x,
    y: last.y,
    angle: Math.atan2(last.y - prev.y, last.x - prev.x),
    done: true,
  };
}

/**
 * Advance an enemy along its waypoint path.
 * Mutates enemy position and pathDistance.
 * @returns {boolean} true if enemy reached the end.
 */
export function advanceEnemy(enemy, dt) {
  const dist = enemy.currentSpeed * dt;
  enemy.pathDistance += dist;
  const totalLen = enemy.pathLength;
  enemy.pathProgress = Math.min(enemy.pathDistance / totalLen, 1);

  const pos = getPositionOnPath(enemy.waypoints, enemy.pathDistance);
  enemy.x = pos.x;
  enemy.y = pos.y;
  enemy.angle = pos.angle;
  return pos.done;
}

/**
 * Marks grid cells along a path as PATH type.
 * @param {number[][]} grid
 * @param {Array<{x:number, y:number}>} waypoints
 * @param {number} pathWidth - Width in pixels
 * @param {number} cellSize
 * @param {number} gridOffsetY
 * @param {number} PATH_TYPE - Cell type constant for path
 */
export function markPathOnGrid(grid, waypoints, pathWidth, cellSize, gridOffsetY, PATH_TYPE) {
  const halfW = pathWidth / 2;
  // Walk along each segment at small intervals and mark cells
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1];
    const b = waypoints[i];
    const segLen = vecDist(a, b);
    const steps = Math.ceil(segLen / (cellSize / 2));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = a.x + (b.x - a.x) * t;
      const py = a.y + (b.y - a.y) * t;
      // Mark a cross of cells around this point
      for (let dx = -halfW; dx <= halfW; dx += cellSize / 2) {
        for (let dy = -halfW; dy <= halfW; dy += cellSize / 2) {
          const col = Math.floor((px + dx) / cellSize);
          const row = Math.floor((py + dy - gridOffsetY) / cellSize);
          if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
            grid[row][col] = PATH_TYPE;
          }
        }
      }
    }
  }
}
