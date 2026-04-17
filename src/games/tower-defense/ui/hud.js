/**
 * Top HUD bar — lives, cash, wave counter, speed controls, reset.
 */
import { config } from '../config.js';
import { drawText, roundedRect } from '../../../shared/canvas-utils.js';

// Button sizing bumped from the original mouse-era dimensions so thumbs
// (especially a 6-year-old's) can hit them reliably on iPad.
const BTN_Y = 4;
const BTN_H = 32;
const RESET_X = 580;
const RESET_W = 56;
const SPEED_BTN_W = 36;
const SPEED_BTN_GAP = 42;
const SEND_EARLY_X = 220;
const SEND_EARLY_W = 88;

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
    roundedRect(ctx, SEND_EARLY_X, BTN_Y, SEND_EARLY_W, BTN_H, 4,
      'rgba(233,69,96,0.15)', 'rgba(233,69,96,0.3)', 1);
    drawText(ctx, 'Send ▶', SEND_EARLY_X + SEND_EARLY_W / 2, y, {
      color: '#e94560',
      font: 'bold 12px monospace',
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
  roundedRect(ctx, RESET_X, BTN_Y, RESET_W, BTN_H, 4, 'rgba(255,170,0,0.1)', 'rgba(255,170,0,0.25)', 1);
  drawText(ctx, '\u21BB Reset', RESET_X + RESET_W / 2, y, {
    color: '#ffaa00',
    font: 'bold 11px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Speed controls — far right
  const speeds = [1, 2, 3];
  // Lay out from the right so the rightmost button hugs the HUD edge with
  // a 12px margin regardless of button width changes.
  const speedEndX = hud.w - 12;
  const speedStartX = speedEndX - (speeds.length * SPEED_BTN_W + (speeds.length - 1) * (SPEED_BTN_GAP - SPEED_BTN_W));
  for (let i = 0; i < speeds.length; i++) {
    const bx = speedStartX + i * SPEED_BTN_GAP;
    const active = gs.speedMultiplier === speeds[i];
    roundedRect(ctx, bx, BTN_Y, SPEED_BTN_W, BTN_H, 4,
      active ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.04)',
      active ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.08)',
      1
    );
    drawText(ctx, `${speeds[i]}x`, bx + SPEED_BTN_W / 2, y, {
      color: active ? '#00d4ff' : '#8892b0',
      font: 'bold 12px monospace',
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

  // Speed buttons — hit-test must match the render layout exactly
  const speeds = [1, 2, 3];
  const speedEndX = config.hudBar.w - 12;
  const speedStartX = speedEndX - (speeds.length * SPEED_BTN_W + (speeds.length - 1) * (SPEED_BTN_GAP - SPEED_BTN_W));
  for (let i = 0; i < speeds.length; i++) {
    const bx = speedStartX + i * SPEED_BTN_GAP;
    if (x >= bx && x <= bx + SPEED_BTN_W && y >= BTN_Y && y <= BTN_Y + BTN_H) {
      gs.speedMultiplier = speeds[i];
      return true;
    }
  }

  // Reset button
  if (x >= RESET_X && x <= RESET_X + RESET_W && y >= BTN_Y && y <= BTN_Y + BTN_H) {
    return 'reset';
  }

  // Send Early button
  if (gs.wavePhase === 'prep') {
    if (x >= SEND_EARLY_X && x <= SEND_EARLY_X + SEND_EARLY_W && y >= BTN_Y && y <= BTN_Y + BTN_H) {
      return 'sendEarly';
    }
  }

  return false;
}
