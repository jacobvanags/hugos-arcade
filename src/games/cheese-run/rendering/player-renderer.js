import { config } from '../config.js';
import { getCurrentWeapon } from '../systems/player-system.js';

/**
 * Draws the mouse player character.
 */
export function renderPlayer(ctx, player) {
  if (!player.alive) return;

  // Blink when invincible
  if (player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0) return;

  const { x, y, facing, width, height, animTime, grounded, vx, onWall } = player;
  const hw = width / 2;
  const hh = height / 2;
  const weapon = getCurrentWeapon(player);

  ctx.save();
  ctx.translate(x, y);
  if (facing === -1) ctx.scale(-1, 1);

  // Bob animation when running
  const bob = (vx !== 0 && grounded) ? Math.sin(animTime * 12) * 2 : 0;
  ctx.translate(0, bob);

  // Wall slide visual tilt
  if (onWall !== 0 && !grounded) {
    ctx.rotate(onWall * facing * 0.15);
  }

  // ─── Body (rounded mouse shape) ───
  ctx.fillStyle = '#B0B0B8';
  ctx.beginPath();
  ctx.ellipse(0, 2, hw, hh - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#D8D8E0';
  ctx.beginPath();
  ctx.ellipse(0, 4, hw * 0.6, hh * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ─── Ears ───
  ctx.fillStyle = '#E8A0B0';
  ctx.beginPath();
  ctx.ellipse(-6, -hh + 2, 5, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, -hh + 2, 5, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Inner ears
  ctx.fillStyle = '#FFB0C0';
  ctx.beginPath();
  ctx.ellipse(-6, -hh + 2, 3, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(6, -hh + 2, 3, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ─── Eyes ───
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(5, -3, 1, 0, Math.PI * 2);
  ctx.fill();

  // ─── Nose ───
  ctx.fillStyle = '#FF8090';
  ctx.beginPath();
  ctx.arc(hw - 1, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // ─── Whiskers ───
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(hw, -1);
  ctx.lineTo(hw + 8, -4);
  ctx.moveTo(hw, 1);
  ctx.lineTo(hw + 8, 2);
  ctx.moveTo(hw, 3);
  ctx.lineTo(hw + 7, 6);
  ctx.stroke();

  // ─── Tail ───
  ctx.strokeStyle = '#C0A0B0';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw + 2, 4);
  const tailWag = Math.sin(animTime * 5) * 4;
  ctx.quadraticCurveTo(-hw - 8, tailWag, -hw - 12, -4 + tailWag);
  ctx.stroke();

  // ─── Gun (varies by weapon) ───
  const gunY = 2;
  drawGun(ctx, hw, gunY, weapon);

  // ─── Double jump indicator (small sparkle under feet when available) ───
  if (!grounded && player.canDoubleJump) {
    ctx.globalAlpha = 0.4 + Math.sin(animTime * 8) * 0.2;
    ctx.fillStyle = '#AADDFF';
    ctx.beginPath();
    ctx.arc(0, hh + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawGun(ctx, hw, gunY, weapon) {
  switch (weapon.id) {
    case 'shotgun':
      // Wider, shorter barrel
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(hw - 3, gunY - 3, 12, 6);
      ctx.fillStyle = '#666';
      ctx.fillRect(hw + 7, gunY - 4, 4, 8);
      break;
    case 'machinegun':
      // Long thin barrel
      ctx.fillStyle = '#444';
      ctx.fillRect(hw - 2, gunY - 1.5, 14, 3);
      ctx.fillStyle = '#00BBDD';
      ctx.fillRect(hw + 10, gunY - 1, 3, 2);
      // Ammo drum
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(hw + 2, gunY + 3, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'launcher':
      // Big tube
      ctx.fillStyle = '#663333';
      ctx.fillRect(hw - 4, gunY - 4, 14, 8);
      ctx.fillStyle = '#FF6644';
      ctx.fillRect(hw + 8, gunY - 3, 4, 6);
      // Scope
      ctx.fillStyle = '#888';
      ctx.fillRect(hw + 2, gunY - 6, 4, 2);
      break;
    default: // pistol
      ctx.fillStyle = '#555';
      ctx.fillRect(hw - 2, gunY - 2, 10, 4);
      ctx.fillStyle = '#888';
      ctx.fillRect(hw + 6, gunY - 1, 3, 2);
      break;
  }
}
