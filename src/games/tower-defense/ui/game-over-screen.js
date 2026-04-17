/**
 * Game over and victory overlay screens with stats and challenge unlocks.
 */
import { config } from '../config.js';
import { drawText, roundedRect } from '../../../shared/canvas-utils.js';
import { CHALLENGE_DEFS } from '../data/tower-defs.js';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Get the challenges unlocked by completing the current difficulty. */
function getChallengesForDifficulty(difficulty) {
  return Object.entries(CHALLENGE_DEFS)
    .filter(([, def]) => def.difficulty === difficulty)
    .map(([key, def]) => ({ key, ...def }));
}

export function renderGameOver(ctx, gs) {
  // Dim overlay
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, config.width, config.height);

  const cx = config.width / 2;
  const cy = config.height / 2;
  const isVictory = gs.gameResult === 'victory';

  if (isVictory) {
    drawText(ctx, 'VICTORY!', cx, cy - 140, {
      color: '#ffd700',
      font: 'bold 48px monospace',
      align: 'center',
      baseline: 'middle',
      stroke: '#000',
      strokeWidth: 3,
    });

    // Show difficulty + challenge badge
    let subtitle = `All ${gs.wave + 1} Waves Completed!`;
    if (gs.challenge) {
      const chalDef = CHALLENGE_DEFS[gs.challenge];
      if (chalDef) subtitle = `${chalDef.icon} ${chalDef.name} Challenge Complete!`;
    }
    drawText(ctx, subtitle, cx, cy - 100, {
      color: '#e8e8e8',
      font: '14px monospace',
      align: 'center',
      baseline: 'middle',
    });

    if (gs.difficulty && gs.difficulty !== 'medium') {
      drawText(ctx, `Difficulty: ${gs.difficulty.toUpperCase()}`, cx, cy - 82, {
        color: gs.difficulty === 'easy' ? '#44ff44' : '#ff4444',
        font: '10px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }
  } else {
    drawText(ctx, 'GAME OVER', cx, cy - 140, {
      color: '#ff4444',
      font: 'bold 48px monospace',
      align: 'center',
      baseline: 'middle',
      stroke: '#000',
      strokeWidth: 3,
    });

    drawText(ctx, `Survived ${gs.wave + 1} wave${gs.wave > 0 ? 's' : ''}`, cx, cy - 100, {
      color: '#e8e8e8',
      font: '14px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }

  // --- Stats Panel ---
  const panelW = 340;
  const panelH = 100;
  const panelX = cx - panelW / 2;
  const panelY = cy - 70;

  roundedRect(ctx, panelX, panelY, panelW, panelH, 8,
    'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 1);

  const col1X = panelX + 24;
  const col2X = panelX + panelW / 2 + 12;
  const labelColor = '#6a7490';
  const valueColor = '#e8e8e8';
  const statFont = '10px monospace';
  const valFont = 'bold 10px monospace';
  let row = panelY + 16;
  const rowH = 20;

  // Left column
  drawText(ctx, 'Enemies Killed', col1X, row, { color: labelColor, font: statFont });
  drawText(ctx, `${gs.enemiesKilled}`, col1X + 140, row, { color: valueColor, font: valFont, align: 'right' });

  drawText(ctx, 'Bosses Killed', col1X, row + rowH, { color: labelColor, font: statFont });
  drawText(ctx, `${gs.bossesKilled}`, col1X + 140, row + rowH, { color: valueColor, font: valFont, align: 'right' });

  drawText(ctx, 'Towers Built', col1X, row + rowH * 2, { color: labelColor, font: statFont });
  drawText(ctx, `${gs.towersBuilt}`, col1X + 140, row + rowH * 2, { color: valueColor, font: valFont, align: 'right' });

  drawText(ctx, 'Time', col1X, row + rowH * 3, { color: labelColor, font: statFont });
  drawText(ctx, formatTime(gs.gameTime || 0), col1X + 140, row + rowH * 3, { color: valueColor, font: valFont, align: 'right' });

  // Right column
  drawText(ctx, 'Total Cash', col2X, row, { color: labelColor, font: statFont });
  drawText(ctx, `$${gs.totalCashEarned}`, col2X + 140, row, { color: '#ffd700', font: valFont, align: 'right' });

  drawText(ctx, 'Cash Left', col2X, row + rowH, { color: labelColor, font: statFont });
  drawText(ctx, `$${gs.cash}`, col2X + 140, row + rowH, { color: '#ffd700', font: valFont, align: 'right' });

  drawText(ctx, 'Lives Left', col2X, row + rowH * 2, { color: labelColor, font: statFont });
  drawText(ctx, `${gs.lives}`, col2X + 140, row + rowH * 2, {
    color: gs.lives > 50 ? '#44ff44' : gs.lives > 0 ? '#ffaa00' : '#ff4444',
    font: valFont, align: 'right',
  });

  drawText(ctx, 'Map', col2X, row + rowH * 3, { color: labelColor, font: statFont });
  drawText(ctx, gs.mapDef ? gs.mapDef.name : 'Unknown', col2X + 140, row + rowH * 3, { color: '#8892b0', font: valFont, align: 'right' });

  // --- Challenge Cards (on victory) ---
  let challengeY = panelY + panelH + 14;

  if (isVictory && !gs.challenge) {
    const difficulty = gs.difficulty || 'medium';
    const challenges = getChallengesForDifficulty(difficulty);

    if (challenges.length > 0) {
      drawText(ctx, 'CHALLENGES UNLOCKED', cx, challengeY, {
        color: '#ffd700',
        font: 'bold 11px monospace',
        align: 'center',
        baseline: 'middle',
      });
      challengeY += 16;

      const chalW = 140;
      const chalH = 60;
      const chalGap = 10;
      const totalChalW = chalW * challenges.length + chalGap * (challenges.length - 1);
      const chalStartX = cx - totalChalW / 2;

      for (let i = 0; i < challenges.length; i++) {
        const chal = challenges[i];
        const cX = chalStartX + i * (chalW + chalGap);

        // Card background
        roundedRect(ctx, cX, challengeY, chalW, chalH, 6,
          'rgba(255,215,0,0.04)', 'rgba(255,215,0,0.15)', 1);

        // Icon + name
        drawText(ctx, `${chal.icon} ${chal.name}`, cX + chalW / 2, challengeY + 14, {
          color: '#e8e8e8',
          font: 'bold 9px monospace',
          align: 'center',
          baseline: 'middle',
        });

        // Description
        const desc = chal.description.length > 22 ? chal.description.substring(0, 20) + '..' : chal.description;
        drawText(ctx, desc, cX + chalW / 2, challengeY + 30, {
          color: '#6a7490',
          font: '8px monospace',
          align: 'center',
          baseline: 'middle',
        });

        // Start button
        const btnY = challengeY + chalH - 16;
        roundedRect(ctx, cX + 10, btnY, chalW - 20, 14, 3,
          'rgba(0,212,255,0.1)', 'rgba(0,212,255,0.3)', 1);
        drawText(ctx, 'START', cX + chalW / 2, btnY + 7, {
          color: '#00d4ff',
          font: 'bold 8px monospace',
          align: 'center',
          baseline: 'middle',
        });
      }

      challengeY += chalH + 10;
    }
  }

  // --- Navigation Buttons ---
  // Larger & bolder than the mouse-era defaults so a kid on iPad immediately
  // sees them as the tap targets, not decorative labels.
  const btnW = 170;
  const btnH = 52;
  const btnGap = 16;
  const totalBtnW = btnW * 3 + btnGap * 2;
  const startX = cx - totalBtnW / 2;
  const btnY = challengeY + 8;

  // Play Again — primary action, brightest.
  roundedRect(ctx, startX, btnY, btnW, btnH, 8,
    'rgba(0,212,255,0.28)', 'rgba(0,212,255,0.75)', 2);
  drawText(ctx, '▶  Play Again', startX + btnW / 2, btnY + btnH / 2, {
    color: '#ffffff',
    font: 'bold 16px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Map Select
  roundedRect(ctx, startX + btnW + btnGap, btnY, btnW, btnH, 8,
    'rgba(255,215,0,0.18)', 'rgba(255,215,0,0.55)', 2);
  drawText(ctx, '◈  Map Select', startX + btnW + btnGap + btnW / 2, btnY + btnH / 2, {
    color: '#ffd700',
    font: 'bold 16px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Exit — destructive-ish, more muted.
  roundedRect(ctx, startX + (btnW + btnGap) * 2, btnY, btnW, btnH, 8,
    'rgba(255,68,68,0.15)', 'rgba(255,68,68,0.45)', 2);
  drawText(ctx, '✕  Exit to Menu', startX + (btnW + btnGap) * 2 + btnW / 2, btnY + btnH / 2, {
    color: '#ff7777',
    font: 'bold 16px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Store button Y for click detection
  gs._gameOverBtnY = btnY;
  gs._gameOverChallengeY = isVictory && !gs.challenge ? panelY + panelH + 30 : null;
}

/**
 * Handle clicks on game over screen. Returns action string, { challenge } object, or null.
 */
export function handleGameOverClick(x, y, gs) {
  const cx = config.width / 2;
  const btnW = 170;
  const btnH = 52;
  const btnGap = 16;
  const btnY = gs._gameOverBtnY || (config.height / 2 + 80);

  const totalBtnW = btnW * 3 + btnGap * 2;
  const startX = cx - totalBtnW / 2;

  // Play Again
  if (x >= startX && x <= startX + btnW && y >= btnY && y <= btnY + btnH) {
    return 'restart';
  }

  // Map Select
  if (x >= startX + btnW + btnGap && x <= startX + btnW * 2 + btnGap && y >= btnY && y <= btnY + btnH) {
    return 'mapSelect';
  }

  // Exit
  if (x >= startX + (btnW + btnGap) * 2 && x <= startX + (btnW + btnGap) * 2 + btnW && y >= btnY && y <= btnY + btnH) {
    return 'exit';
  }

  // Challenge cards (if visible)
  if (gs._gameOverChallengeY && gs.gameResult === 'victory' && !gs.challenge) {
    const difficulty = gs.difficulty || 'medium';
    const challenges = getChallengesForDifficulty(difficulty);
    if (challenges.length > 0) {
      const chalW = 140;
      const chalH = 60;
      const chalGap = 10;
      const totalChalW = chalW * challenges.length + chalGap * (challenges.length - 1);
      const chalStartX = cx - totalChalW / 2;
      const challengeY = gs._gameOverChallengeY;

      for (let i = 0; i < challenges.length; i++) {
        const cX = chalStartX + i * (chalW + chalGap);
        if (x >= cX && x <= cX + chalW && y >= challengeY && y <= challengeY + chalH) {
          return { challenge: challenges[i].key };
        }
      }
    }
  }

  return null;
}
