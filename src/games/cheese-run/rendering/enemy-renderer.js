import { config } from '../config.js';

/**
 * Draws a cat enemy.
 */
export function renderEnemy(ctx, enemy) {
  if (!enemy.alive) return;

  const { x, y, width, height, facing, bodyColor, eyeColor, type, animTime, flashTimer, stripeColor } = enemy;
  const hw = width / 2;
  const hh = height / 2;

  ctx.save();
  ctx.translate(x, y);
  if (facing === -1) ctx.scale(-1, 1);

  // Flash white when hit
  const isFlashing = flashTimer > 0;

  // ─── Body ───
  ctx.fillStyle = isFlashing ? '#FFF' : bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 2, hw, hh - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stripes for boss
  if (type === 'boss' && stripeColor && !isFlashing) {
    ctx.strokeStyle = stripeColor;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6 - 2, -hh + 6);
      ctx.lineTo(i * 6 + 2, hh - 6);
      ctx.stroke();
    }
  }

  // ─── Ears (pointy triangles) ───
  ctx.fillStyle = isFlashing ? '#FFF' : bodyColor;
  ctx.beginPath();
  ctx.moveTo(-hw + 2, -hh + 4);
  ctx.lineTo(-hw + 6, -hh - 6);
  ctx.lineTo(-hw + 10, -hh + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hw - 10, -hh + 4);
  ctx.lineTo(hw - 6, -hh - 6);
  ctx.lineTo(hw - 2, -hh + 4);
  ctx.closePath();
  ctx.fill();

  // Inner ears
  if (!isFlashing) {
    ctx.fillStyle = '#FFB0C0';
    ctx.beginPath();
    ctx.moveTo(-hw + 4, -hh + 4);
    ctx.lineTo(-hw + 6, -hh - 3);
    ctx.lineTo(-hw + 8, -hh + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hw - 8, -hh + 4);
    ctx.lineTo(hw - 6, -hh - 3);
    ctx.lineTo(hw - 2, -hh + 4);
    ctx.closePath();
    ctx.fill();
  }

  // ─── Eyes ───
  // Angry slanted eyes
  ctx.fillStyle = isFlashing ? '#DDD' : eyeColor;
  ctx.beginPath();
  ctx.ellipse(hw * 0.3, -3, 3, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupil (slit)
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(hw * 0.3, -3, 1, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Angry eyebrow
  if (!isFlashing) {
    ctx.strokeStyle = bodyColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(hw * 0.3 - 4, -7);
    ctx.lineTo(hw * 0.3 + 3, -5);
    ctx.stroke();
  }

  // ─── Nose & mouth ───
  ctx.fillStyle = isFlashing ? '#DDD' : '#FF6070';
  ctx.beginPath();
  ctx.arc(hw - 2, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth (angry)
  ctx.strokeStyle = isFlashing ? '#CCC' : '#333';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hw - 4, 3);
  ctx.lineTo(hw, 1);
  ctx.lineTo(hw - 4, 5);
  ctx.stroke();

  // ─── Whiskers ───
  if (!isFlashing) {
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(hw, -2);
    ctx.lineTo(hw + 10, -5);
    ctx.moveTo(hw, 0);
    ctx.lineTo(hw + 10, 0);
    ctx.moveTo(hw, 2);
    ctx.lineTo(hw + 10, 4);
    ctx.stroke();
  }

  // ─── Tail ───
  ctx.strokeStyle = isFlashing ? '#FFF' : bodyColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-hw + 2, 2);
  const tailCurl = Math.sin(animTime * 3) * 6;
  ctx.quadraticCurveTo(-hw - 10, tailCurl - 4, -hw - 8, -10 + tailCurl);
  ctx.stroke();

  // ─── Paws (walking animation) ───
  if (!isFlashing) {
    ctx.fillStyle = bodyColor;
    const pawOffset = Math.sin(animTime * 8) * 3;
    // Front paws
    ctx.beginPath();
    ctx.ellipse(hw * 0.4, hh - 2 + pawOffset, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-hw * 0.4, hh - 2 - pawOffset, 3, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Health bar for multi-HP enemies ───
  if (enemy.hp > 1 && enemy.currentHP < enemy.hp) {
    const barW = width;
    const barH = 3;
    ctx.fillStyle = '#333';
    ctx.fillRect(-barW / 2, -hh - 10, barW, barH);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(-barW / 2, -hh - 10, barW * (enemy.currentHP / enemy.hp), barH);
  }

  ctx.restore();
}
