/**
 * Code-generated sprite/art utilities.
 * Draw characters, objects, and UI elements with canvas shapes and gradients.
 * No external images needed.
 * @module sprite-factory
 */

import { palette } from './colors.js';

/**
 * Draws a geometric avatar with a unique pattern based on a seed string.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size - Avatar size
 * @param {number} avatarIndex - Avatar style index (0-7)
 */
export function drawAvatar(ctx, x, y, size, avatarIndex) {
  const half = size / 2;
  ctx.save();
  ctx.translate(x, y);

  const colors = [
    [palette.primary, palette.neonBlue],
    [palette.neonGreen, palette.neonPurple],
    [palette.neonYellow, palette.neonOrange],
    [palette.neonPink, palette.neonBlue],
    [palette.primary, palette.neonGreen],
    [palette.neonPurple, palette.neonYellow],
    [palette.neonOrange, palette.primary],
    [palette.neonBlue, palette.neonPink],
  ];
  const [c1, c2] = colors[avatarIndex % colors.length];

  // Background circle
  ctx.beginPath();
  ctx.arc(0, 0, half, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(-half, -half, half, half);
  grad.addColorStop(0, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Inner pattern based on index
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;

  switch (avatarIndex % 8) {
    case 0: // Diamond
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.5);
      ctx.lineTo(half * 0.5, 0);
      ctx.lineTo(0, half * 0.5);
      ctx.lineTo(-half * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 1: // Cross
      ctx.fillRect(-half * 0.15, -half * 0.5, half * 0.3, half);
      ctx.fillRect(-half * 0.5, -half * 0.15, half, half * 0.3);
      break;
    case 2: // Circles
      for (let r = half * 0.6; r > half * 0.1; r -= half * 0.2) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    case 3: // Triangle
      ctx.beginPath();
      ctx.moveTo(0, -half * 0.5);
      ctx.lineTo(-half * 0.45, half * 0.35);
      ctx.lineTo(half * 0.45, half * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 4: // Star
      drawStarPath(ctx, 0, 0, 5, half * 0.5, half * 0.25);
      ctx.fill();
      ctx.stroke();
      break;
    case 5: // Hexagon
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = Math.cos(angle) * half * 0.5;
        const py = Math.sin(angle) * half * 0.5;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 6: // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(half * 0.1, -half * 0.5);
      ctx.lineTo(-half * 0.2, -half * 0.05);
      ctx.lineTo(half * 0.1, -half * 0.05);
      ctx.lineTo(-half * 0.1, half * 0.5);
      ctx.lineTo(half * 0.2, half * 0.05);
      ctx.lineTo(-half * 0.1, half * 0.05);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 7: // Moon
      ctx.beginPath();
      ctx.arc(0, 0, half * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(half * 0.15, -half * 0.1, half * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = c2;
      ctx.fill();
      break;
  }

  ctx.restore();
}

function drawStarPath(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Draws a simple spaceship sprite.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} size
 * @param {string} color
 * @param {number} [rotation=0] - Rotation in radians
 */
export function drawShip(ctx, x, y, size, color, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(-size * 0.6, size * 0.6);
  ctx.lineTo(0, size * 0.3);
  ctx.lineTo(size * 0.6, size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a simple enemy sprite.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {string} color
 * @param {string} [type='basic'] - 'basic', 'tank', 'fast'
 */
export function drawEnemy(ctx, x, y, size, color, type = 'basic') {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;

  switch (type) {
    case 'tank':
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6);
      break;
    case 'fast':
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.4, size * 0.5);
      ctx.lineTo(size * 0.4, size * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    default: // basic
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();
      // Eyes
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.arc(size * 0.15, -size * 0.1, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws a tower/turret sprite.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {string} color
 * @param {number} [rotation=0] - Turret rotation
 */
export function drawTower(ctx, x, y, size, color, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  // Base
  ctx.fillStyle = color;
  ctx.fillRect(-size / 2, -size / 2, size, size);
  // Turret barrel
  ctx.rotate(rotation);
  ctx.fillStyle = palette.textSecondary;
  ctx.fillRect(-size * 0.08, -size * 0.7, size * 0.16, size * 0.5);
  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
  ctx.fillStyle = palette.textPrimary;
  ctx.fill();
  ctx.restore();
}

/**
 * Draws a coin/collectible.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {number} [frame=0] - Animation frame for rotation effect
 */
export function drawCoin(ctx, x, y, radius, frame = 0) {
  const scaleX = Math.cos(frame * 0.1);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scaleX, 1);
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = palette.gold;
  ctx.fill();
  ctx.strokeStyle = palette.neonOrange;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (Math.abs(scaleX) > 0.3) {
    ctx.fillStyle = palette.neonOrange;
    ctx.font = `bold ${radius}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);
  }
  ctx.restore();
}

/**
 * Draws a heart/life icon.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {boolean} [filled=true]
 */
export function drawHeart(ctx, x, y, size, filled = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size * 0.5, -size * 0.1, -size * 0.5, -size * 0.5, 0, -size * 0.25);
  ctx.bezierCurveTo(size * 0.5, -size * 0.5, size * 0.5, -size * 0.1, 0, size * 0.3);
  if (filled) {
    ctx.fillStyle = palette.health;
    ctx.fill();
  } else {
    ctx.strokeStyle = palette.health;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Generates an avatar as a data URL for use in UI.
 * @param {number} avatarIndex
 * @param {number} [size=64]
 * @returns {string} Data URL
 */
export function generateAvatarDataURL(avatarIndex, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  drawAvatar(ctx, size / 2, size / 2, size, avatarIndex);
  return canvas.toDataURL();
}
