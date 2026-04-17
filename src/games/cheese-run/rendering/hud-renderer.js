import { config } from '../config.js';
import { drawText } from '../../../shared/canvas-utils.js';
import { getCurrentWeapon } from '../systems/player-system.js';

// Touch devices see different menu prompts that match the on-screen buttons
// (Jump instead of Enter, ✕ instead of Esc, ⏸ instead of P).
const TOUCH = typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

/**
 * Renders the heads-up display (health, score, level info, weapon).
 */
export function renderHUD(ctx, player, levelData, totalTime) {
  const w = config.width;

  // Semi-transparent top bar
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, w, 32);

  // Hearts (HP)
  for (let i = 0; i < (player.maxHP || config.player.maxHP); i++) {
    const hx = 12 + i * 22;
    const hy = 16;
    ctx.fillStyle = i < player.hp ? '#FF4466' : '#444';
    drawHeart(ctx, hx, hy, 8);
  }

  // Score
  drawText(ctx, `Score: ${player.score}`, w / 2, 10, {
    color: '#FFD700',
    font: 'bold 14px monospace',
    align: 'center',
  });

  // Level name
  drawText(ctx, `${levelData.name}`, w / 2, 24, {
    color: '#AAA',
    font: '10px monospace',
    align: 'center',
  });

  // Cats defeated
  drawText(ctx, `Cats: ${player.catsDefeated}`, w - 12, 12, {
    color: '#FF8844',
    font: '12px monospace',
    align: 'right',
  });

  // ─── Weapon bar (bottom of screen) ───
  if (player.weapons.length > 0) {
    renderWeaponBar(ctx, player, totalTime);
  }
}

function renderWeaponBar(ctx, player, totalTime) {
  const w = config.width;
  const barY = config.height - 36;
  const slotW = 60;
  const gap = 4;
  const totalW = player.weapons.length * (slotW + gap) - gap;
  const startX = (w - totalW) / 2;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(startX - 6, barY - 4, totalW + 12, 32);

  for (let i = 0; i < player.weapons.length; i++) {
    const weaponId = player.weapons[i];
    const weaponDef = config.weapons[weaponId];
    if (!weaponDef) continue;

    const sx = startX + i * (slotW + gap);
    const isActive = i === player.currentWeaponIdx;

    // Slot background
    ctx.fillStyle = isActive ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(sx, barY, slotW, 24);

    // Active border
    if (isActive) {
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, barY, slotW, 24);
    }

    // Weapon color indicator
    ctx.fillStyle = weaponDef.color;
    ctx.fillRect(sx + 2, barY + 2, 4, 20);

    // Weapon name (short)
    drawText(ctx, weaponDef.name, sx + slotW / 2 + 2, barY + 9, {
      color: isActive ? '#FFF' : '#888',
      font: `${isActive ? 'bold ' : ''}8px monospace`,
      align: 'center',
    });

    // Key hint
    drawText(ctx, `${i + 1}`, sx + slotW - 6, barY + 19, {
      color: '#555',
      font: '7px monospace',
      align: 'center',
    });
  }
}

/**
 * Renders level complete overlay.
 */
export function renderLevelComplete(ctx, score, levelName, totalTime, weaponUnlock) {
  const w = config.width;
  const h = config.height;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, h);

  // Golden cheese icon
  ctx.save();
  ctx.translate(w / 2, h / 2 - 80);
  ctx.rotate(Math.sin(totalTime * 2) * 0.2);
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.moveTo(-16, 12);
  ctx.lineTo(0, -16);
  ctx.lineTo(18, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(-3, 2, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, 5, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawText(ctx, 'LEVEL COMPLETE!', w / 2, h / 2 - 30, {
    color: '#FFD700',
    font: 'bold 28px monospace',
    align: 'center',
    baseline: 'middle',
  });

  drawText(ctx, levelName, w / 2, h / 2, {
    color: '#AAA',
    font: '14px monospace',
    align: 'center',
  });

  drawText(ctx, `Score: ${score}`, w / 2, h / 2 + 30, {
    color: '#FFF',
    font: 'bold 18px monospace',
    align: 'center',
  });

  // Weapon unlock notification
  if (weaponUnlock) {
    const weaponDef = config.weapons[weaponUnlock];
    if (weaponDef) {
      const pulse = 0.7 + Math.sin(totalTime * 4) * 0.3;
      ctx.globalAlpha = pulse;
      drawText(ctx, 'NEW WEAPON UNLOCKED!', w / 2, h / 2 + 60, {
        color: weaponDef.color,
        font: 'bold 16px monospace',
        align: 'center',
      });
      drawText(ctx, weaponDef.name, w / 2, h / 2 + 78, {
        color: '#FFF',
        font: '14px monospace',
        align: 'center',
      });
      ctx.globalAlpha = 1;
    }
  }

  ctx.globalAlpha = 0.5 + Math.sin(totalTime * 3) * 0.3;
  drawText(ctx, TOUCH ? 'Tap JUMP to continue' : 'Press ENTER to continue', w / 2, h / 2 + (weaponUnlock ? 110 : 70), {
    color: '#8892b0',
    font: '14px monospace',
    align: 'center',
  });
  ctx.globalAlpha = 1;
}

/**
 * Renders game over overlay.
 */
export function renderGameOver(ctx, score, totalTime) {
  const w = config.width;
  const h = config.height;

  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, w, h);

  drawText(ctx, 'GAME OVER', w / 2, h / 2 - 30, {
    color: '#FF4444',
    font: 'bold 36px monospace',
    align: 'center',
    baseline: 'middle',
  });

  drawText(ctx, `Score: ${score}`, w / 2, h / 2 + 10, {
    color: '#FFF',
    font: 'bold 18px monospace',
    align: 'center',
  });

  ctx.globalAlpha = 0.5 + Math.sin(totalTime * 3) * 0.3;
  drawText(ctx, TOUCH ? 'Tap JUMP to retry  |  ✕ to quit' : 'Press ENTER to retry  |  ESC to quit', w / 2, h / 2 + 50, {
    color: '#8892b0',
    font: '13px monospace',
    align: 'center',
  });
  ctx.globalAlpha = 1;
}

/**
 * Renders the title / level select screen.
 */
export function renderTitleScreen(ctx, unlockedLevels, selectedLevel, worlds, totalTime) {
  const w = config.width;
  const h = config.height;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(1, '#1a1030');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  drawText(ctx, 'CHEESE RUN', w / 2, 60, {
    color: '#FFD700',
    font: 'bold 40px monospace',
    align: 'center',
  });

  drawText(ctx, 'A Mouse on a Mission', w / 2, 90, {
    color: '#B0B0B8',
    font: '14px monospace',
    align: 'center',
  });

  // Mouse preview
  ctx.save();
  ctx.translate(w / 2, 130);
  const bob = Math.sin(totalTime * 3) * 4;
  ctx.translate(0, bob);
  ctx.fillStyle = '#B0B0B8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#E8A0B0';
  ctx.beginPath();
  ctx.ellipse(-8, -12, 5, 7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, -12, 5, 7, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(10, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.fillRect(14, -2, 10, 4);
  ctx.restore();

  // Level select
  let y = 180;
  for (let wi = 0; wi < worlds.length; wi++) {
    const world = worlds[wi];
    drawText(ctx, world.name, w / 2, y, {
      color: world.accentColor,
      font: 'bold 16px monospace',
      align: 'center',
    });
    y += 24;

    for (let li = 0; li < 3; li++) {
      const levelIdx = wi * 3 + li;
      const isUnlocked = levelIdx < unlockedLevels;
      const isSelected = levelIdx === selectedLevel;
      const bx = w / 2 - 90 + li * 80;
      const by = y;

      if (isSelected) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(bx - 25, by - 12, 50, 28);
      } else if (isUnlocked) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(bx - 25, by - 12, 50, 28);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(bx - 25, by - 12, 50, 28);
      }

      drawText(ctx, isUnlocked ? `${levelIdx + 1}` : '?', bx, by, {
        color: isSelected ? '#000' : isUnlocked ? '#FFF' : '#555',
        font: 'bold 16px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }
    y += 48;
  }

  // Controls
  y = h - 80;
  drawText(ctx, 'Arrows/WASD: Move  |  Double Jump  |  Wall Jump', w / 2, y, {
    color: '#666',
    font: '11px monospace',
    align: 'center',
  });
  drawText(ctx, 'Z/X/Click: Shoot  |  Q/E or 1-4: Switch Weapon', w / 2, y + 16, {
    color: '#666',
    font: '11px monospace',
    align: 'center',
  });

  ctx.globalAlpha = 0.5 + Math.sin(totalTime * 3) * 0.3;
  drawText(ctx, TOUCH ? 'Tap JUMP to start' : 'Press ENTER to start', w / 2, h - 30, {
    color: '#FFD700',
    font: '14px monospace',
    align: 'center',
  });
  ctx.globalAlpha = 1;
}

/**
 * Renders pause overlay.
 */
export function renderPause(ctx) {
  const w = config.width;
  const h = config.height;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, h);

  drawText(ctx, 'PAUSED', w / 2, h / 2, {
    color: '#FFF',
    font: 'bold 48px monospace',
    align: 'center',
    baseline: 'middle',
  });

  drawText(ctx, TOUCH ? 'Tap ⏸ to resume  |  ✕ to quit' : 'Press P to resume  |  ESC to quit', w / 2, h / 2 + 40, {
    color: '#888',
    font: '14px monospace',
    align: 'center',
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

function drawHeart(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.3);
  ctx.bezierCurveTo(x, y - size * 0.3, x - size, y - size * 0.3, x - size, y + size * 0.1);
  ctx.bezierCurveTo(x - size, y + size * 0.6, x, y + size, x, y + size);
  ctx.bezierCurveTo(x, y + size, x + size, y + size * 0.6, x + size, y + size * 0.1);
  ctx.bezierCurveTo(x + size, y - size * 0.3, x, y - size * 0.3, x, y + size * 0.3);
  ctx.fill();
}
