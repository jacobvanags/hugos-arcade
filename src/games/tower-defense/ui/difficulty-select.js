/**
 * Difficulty selection screen — shown after selecting a map.
 * Presents Easy / Medium / Hard with modifier summaries.
 * Shows completion badges and challenge mode buttons for beaten difficulties.
 */
import { config } from '../config.js';
import { drawText, roundedRect, fillBackground } from '../../../shared/canvas-utils.js';
import { DIFFICULTY_DEFS, CHALLENGE_DEFS } from '../data/tower-defs.js';

const CARD_W = 220;
const CARD_H_BASE = 160;
const CHALLENGE_ROW_H = 28;
const GAP = 24;
const DIFFICULTIES = ['easy', 'medium', 'hard'];

/** Get challenges that belong to a given difficulty tier. */
function getChallengesForDifficulty(diff) {
  return Object.entries(CHALLENGE_DEFS)
    .filter(([, def]) => def.difficulty === diff)
    .map(([key, def]) => ({ key, ...def }));
}

/** Compute card height — taller if challenges are available. */
function getCardHeight(diff, progress) {
  if (!progress || !progress[`${diff}Completed`]) return CARD_H_BASE;
  const challenges = getChallengesForDifficulty(diff);
  if (challenges.length === 0) return CARD_H_BASE;
  // Extra space: header + challenge rows
  return CARD_H_BASE + 20 + challenges.length * CHALLENGE_ROW_H;
}

function getCardPositions(progress) {
  const heights = DIFFICULTIES.map(d => getCardHeight(d, progress));
  const maxH = Math.max(...heights);
  const totalW = CARD_W * 3 + GAP * 2;
  const startX = (config.width - totalW) / 2;
  const startY = (config.height - maxH) / 2 - 30;
  return DIFFICULTIES.map((_, i) => ({
    x: startX + i * (CARD_W + GAP),
    y: startY,
    h: heights[i],
  }));
}

/**
 * Render the difficulty selection screen.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} mapDef - The selected map definition
 * @param {number} hoveredIndex - Which card is hovered (-1 for none)
 * @param {object} progress - Map progress data (from base mapId key)
 * @param {object} challengeProgress - Challenge completion data (from {mapId}_challenges key)
 * @param {string|null} hoveredChallenge - Key of hovered challenge button, or null
 */
export function renderDifficultySelect(ctx, mapDef, hoveredIndex, progress = {}, challengeProgress = {}, hoveredChallenge = null) {
  fillBackground(ctx, config.width, config.height, '#0a0a12');

  const cx = config.width / 2;

  // Title
  drawText(ctx, 'SELECT DIFFICULTY', cx, 60, {
    color: '#e8e8e8',
    font: 'bold 28px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Map name subtitle
  drawText(ctx, mapDef.name, cx, 92, {
    color: '#6a7490',
    font: '14px monospace',
    align: 'center',
    baseline: 'middle',
  });

  const positions = getCardPositions(progress);

  for (let i = 0; i < DIFFICULTIES.length; i++) {
    const diff = DIFFICULTIES[i];
    const def = DIFFICULTY_DEFS[diff];
    const pos = positions[i];
    const hovered = hoveredIndex === i;
    const isCompleted = !!progress[`${diff}Completed`];

    // Card background
    const bgColor = hovered ? `rgba(${hexToRgb(def.color)},0.08)` : isCompleted ? `rgba(${hexToRgb(def.color)},0.03)` : 'rgba(255,255,255,0.03)';
    const borderColor = hovered ? `rgba(${hexToRgb(def.color)},0.4)` : isCompleted ? `rgba(${hexToRgb(def.color)},0.15)` : 'rgba(255,255,255,0.08)';
    roundedRect(ctx, pos.x, pos.y, CARD_W, pos.h, 8, bgColor, borderColor, hovered ? 2 : 1);

    // Completion badge (top-right corner)
    if (isCompleted) {
      drawText(ctx, '✓', pos.x + CARD_W - 18, pos.y + 16, {
        color: def.color,
        font: 'bold 14px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }

    // Difficulty name
    drawText(ctx, def.name.toUpperCase(), pos.x + CARD_W / 2, pos.y + 28, {
      color: def.color,
      font: 'bold 20px monospace',
      align: 'center',
      baseline: 'middle',
    });

    // Colored accent line
    ctx.fillStyle = def.color;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(pos.x + 30, pos.y + 46, CARD_W - 60, 2);
    ctx.globalAlpha = 1;

    // Description
    drawText(ctx, def.description, pos.x + CARD_W / 2, pos.y + 68, {
      color: '#8892b0',
      font: '10px monospace',
      align: 'center',
      baseline: 'middle',
    });

    // Modifier details
    const startCash = Math.floor((mapDef.startingCash || 800) * def.cashMult);
    const startLives = Math.floor((mapDef.startingLives || 50) * def.livesMult);

    drawText(ctx, `Cash: $${startCash}`, pos.x + CARD_W / 2, pos.y + 90, {
      color: '#ffd700',
      font: '10px monospace',
      align: 'center',
      baseline: 'middle',
    });

    drawText(ctx, `Lives: ${startLives}`, pos.x + CARD_W / 2, pos.y + 106, {
      color: startLives < 50 ? '#ff8844' : '#44ff44',
      font: '10px monospace',
      align: 'center',
      baseline: 'middle',
    });

    if (def.enemyHpMult > 1) {
      drawText(ctx, `Enemy HP: +${Math.round((def.enemyHpMult - 1) * 100)}%`, pos.x + CARD_W / 2, pos.y + 122, {
        color: '#ff4444',
        font: '10px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }

    // Play button
    const btnY = pos.y + CARD_H_BASE - 32;
    const btnW = CARD_W - 40;
    const btnX = pos.x + 20;
    roundedRect(ctx, btnX, btnY, btnW, 24, 4,
      hovered ? `rgba(${hexToRgb(def.color)},0.15)` : 'rgba(255,255,255,0.04)',
      hovered ? `rgba(${hexToRgb(def.color)},0.4)` : 'rgba(255,255,255,0.1)',
      1
    );
    drawText(ctx, isCompleted ? '▶ PLAY AGAIN' : '▶ PLAY', btnX + btnW / 2, btnY + 12, {
      color: hovered ? def.color : '#8892b0',
      font: 'bold 11px monospace',
      align: 'center',
      baseline: 'middle',
    });

    // --- Challenge buttons (only if this difficulty is completed) ---
    if (isCompleted) {
      const challenges = getChallengesForDifficulty(diff);
      const completedChallenges = (challengeProgress[diff] || []);

      if (challenges.length > 0) {
        const chalLabelY = pos.y + CARD_H_BASE - 2;
        drawText(ctx, 'CHALLENGES', pos.x + CARD_W / 2, chalLabelY, {
          color: `rgba(${hexToRgb(def.color)},0.6)`,
          font: 'bold 8px monospace',
          align: 'center',
          baseline: 'middle',
        });

        for (let j = 0; j < challenges.length; j++) {
          const chal = challenges[j];
          const chalY = chalLabelY + 10 + j * CHALLENGE_ROW_H;
          const chalX = pos.x + 10;
          const chalW = CARD_W - 20;
          const chalH = CHALLENGE_ROW_H - 4;
          const chalCompleted = completedChallenges.includes(chal.key);
          const chalHovered = hoveredChallenge === chal.key;

          // Challenge row background
          roundedRect(ctx, chalX, chalY, chalW, chalH, 4,
            chalHovered ? `rgba(${hexToRgb(def.color)},0.12)` : chalCompleted ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
            chalHovered ? `rgba(${hexToRgb(def.color)},0.3)` : chalCompleted ? `rgba(${hexToRgb(def.color)},0.15)` : 'rgba(255,255,255,0.06)',
            1
          );

          // Completion check or play icon
          const iconText = chalCompleted ? '✓' : '▶';
          drawText(ctx, iconText, chalX + 14, chalY + chalH / 2, {
            color: chalCompleted ? def.color : '#6a7490',
            font: 'bold 10px monospace',
            align: 'center',
            baseline: 'middle',
          });

          // Challenge icon + name
          drawText(ctx, `${chal.icon} ${chal.name}`, chalX + 28, chalY + chalH / 2, {
            color: chalHovered ? '#e8e8e8' : chalCompleted ? '#aab0c0' : '#8892b0',
            font: `${chalCompleted ? '' : 'bold '}9px monospace`,
            baseline: 'middle',
          });
        }
      }
    }
  }

  // Back button
  const maxCardBottom = Math.max(...positions.map((p, i) => p.y + positions[i].h));
  const backY = maxCardBottom + 30;
  drawText(ctx, '← Back to Map Select', cx, backY, {
    color: '#6a7490',
    font: '12px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Footer
  drawText(ctx, 'Choose your challenge level', cx, config.height - 30, {
    color: '#333',
    font: '10px monospace',
    align: 'center',
    baseline: 'middle',
  });
}

/** Get which difficulty card is hovered. Returns 0-2 or -1. */
export function getHoveredDifficultyIndex(x, y, progress) {
  const positions = getCardPositions(progress);
  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + pos.h) {
      return i;
    }
  }
  return -1;
}

/** Get which challenge button is hovered. Returns challenge key or null. */
export function getHoveredChallengeKey(x, y, progress) {
  const positions = getCardPositions(progress);
  for (let i = 0; i < DIFFICULTIES.length; i++) {
    const diff = DIFFICULTIES[i];
    if (!progress || !progress[`${diff}Completed`]) continue;

    const pos = positions[i];
    const challenges = getChallengesForDifficulty(diff);
    const chalLabelY = pos.y + CARD_H_BASE - 2;

    for (let j = 0; j < challenges.length; j++) {
      const chalY = chalLabelY + 10 + j * CHALLENGE_ROW_H;
      const chalX = pos.x + 10;
      const chalW = CARD_W - 20;
      const chalH = CHALLENGE_ROW_H - 4;

      if (x >= chalX && x <= chalX + chalW && y >= chalY && y <= chalY + chalH) {
        return challenges[j].key;
      }
    }
  }
  return null;
}

/** Handle clicks. Returns { difficulty }, { difficulty, challenge }, 'back', or null. */
export function handleDifficultyClick(x, y, progress) {
  const positions = getCardPositions(progress);
  const cx = config.width / 2;

  for (let i = 0; i < positions.length; i++) {
    const diff = DIFFICULTIES[i];
    const pos = positions[i];

    // Check challenge buttons first (they're inside the card area)
    if (progress && progress[`${diff}Completed`]) {
      const challenges = getChallengesForDifficulty(diff);
      const chalLabelY = pos.y + CARD_H_BASE - 2;

      for (let j = 0; j < challenges.length; j++) {
        const chalY = chalLabelY + 10 + j * CHALLENGE_ROW_H;
        const chalX = pos.x + 10;
        const chalW = CARD_W - 20;
        const chalH = CHALLENGE_ROW_H - 4;

        if (x >= chalX && x <= chalX + chalW && y >= chalY && y <= chalY + chalH) {
          return { difficulty: diff, challenge: challenges[j].key };
        }
      }
    }

    // Play button area (top portion of card)
    if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H_BASE) {
      return { difficulty: diff };
    }
  }

  // Back button
  const maxCardBottom = Math.max(...positions.map((p, i) => p.y + positions[i].h));
  const backY = maxCardBottom + 30;
  if (x >= cx - 120 && x <= cx + 120 && y >= backY - 12 && y <= backY + 12) {
    return 'back';
  }

  return null;
}

/** Helper: hex color to r,g,b for rgba(). */
function hexToRgb(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}
