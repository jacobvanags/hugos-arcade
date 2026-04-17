/**
 * Top HUD bar — lives, cash, wave counter, speed controls, reset.
 */
import { config } from '../config.js';
import { drawText, roundedRect } from '../../../shared/canvas-utils.js';

const RESET_X = 580;
const RESET_W = 48;

export function renderHUD(ctx, gs) {
  const hud = config.hudBar;

  // Background
  ctx.fillStyle = config.colors.hudBg;
  ctx.fillRect(hud.x, hud.y, hud.w, hud.h);

  // Bottom border
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hud.x, hud.h);
  ctx.lineTo(hud.w, hud.h);
  ctx.stroke();

  const y = hud.h / 2;

  // Lives
  drawText(ctx, `♥ ${gs.lives}`, 16, y, {
    color: gs.lives > 50 ? '#44ff44' : gs.lives > 20 ? '#ffaa00' : '#ff4444',
    font: 'bold 14px monospace',
    baseline: 'middle',
  });

  // Cash
  drawText(ctx, `$ ${gs.cash}`, 110, y, {
    color: '#ffd700',
    font: 'bold 14px monospace',
    baseline: 'middle',
  });

  // Send Early button (during prep) — left of wave counter
  if (gs.wavePhase === 'prep') {
    const btnX = 220;
    const btnW = 84;
    roundedRect(ctx, btnX, 8, btnW, 24, 4, 'rgba(233,69,96,0.15)', 'rgba(233,69,96,0.3)', 1);
    drawText(ctx, 'Send [SPC]', btnX + btnW / 2, y, {
      color: '#e94560',
      font: 'bold 10px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Wave counter — centered (with subtle pulse during prep)
  const waveText = gs.wavePhase === 'prep'
    ? `Wave ${gs.wave + 1}/${config.totalWaves} — ${Math.ceil(gs.prepTimer || 0)}s`
    : `Wave ${gs.wave + 1}/${config.totalWaves}`;
  const wavePulse = gs.wavePhase === 'prep'
    ? 0.7 + 0.3 * Math.sin(Date.now() * 0.004) : 1;
  ctx.save();
  ctx.globalAlpha = wavePulse;
  drawText(ctx, waveText, hud.w / 2, y, {
    color: gs.wavePhase === 'prep' ? '#00d4ff' : '#e8e8e8',
    font: '13px monospace',
    align: 'center',
    baseline: 'middle',
  });
  ctx.restore();

  // Reset button — right side, before speed controls
  roundedRect(ctx, RESET_X, 8, RESET_W, 24, 4, 'rgba(255,170,0,0.1)', 'rgba(255,170,0,0.25)', 1);
  drawText(ctx, '\u21BB R', RESET_X + RESET_W / 2, y, {
    color: '#ffaa00',
    font: 'bold 10px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Speed controls — far right
  const speeds = [1, 2, 3];
  const speedX = hud.w - 120;
  for (let i = 0; i < speeds.length; i++) {
    const bx = speedX + i * 34;
    const active = gs.speedMultiplier === speeds[i];
    roundedRect(ctx, bx, 8, 28, 24, 4,
      active ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
      active ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)',
      1
    );
    drawText(ctx, `${speeds[i]}x`, bx + 14, y, {
      color: active ? '#00d4ff' : '#8892b0',
      font: 'bold 11px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }
}

/**
 * Handle clicks on HUD elements. Returns true if click was consumed.
 */
export function handleHUDClick(x, y, gs) {
  if (y > config.hudBar.h) return false;

  // Speed buttons
  const speedX = config.hudBar.w - 120;
  const speeds = [1, 2, 3];
  for (let i = 0; i < speeds.length; i++) {
    const bx = speedX + i * 34;
    if (x >= bx && x <= bx + 28 && y >= 8 && y <= 32) {
      gs.speedMultiplier = speeds[i];
      return true;
    }
  }

  // Reset button
  if (x >= RESET_X && x <= RESET_X + RESET_W && y >= 8 && y <= 32) {
    return 'reset';
  }

  // Send Early button
  if (gs.wavePhase === 'prep') {
    if (x >= 220 && x <= 304 && y >= 8 && y <= 32) {
      return 'sendEarly';
    }
  }

  return false;
}
