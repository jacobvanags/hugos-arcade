/**
 * Map selection screen — 8 map cards in a scrollable 2x4 grid.
 */
import { config } from '../config.js';
import { drawText, roundedRect, fillBackground } from '../../../shared/canvas-utils.js';
import { mapSpaceStation } from '../data/map-space-station.js';
import { mapAlienPlanet } from '../data/map-alien-planet.js';
import { mapAsteroidField } from '../data/map-asteroid-field.js';
import { mapCyberpunkCity } from '../data/map-cyberpunk-city.js';
import { mapCrystalCaves } from '../data/map-crystal-caves.js';
import { mapFrozenTundra } from '../data/map-frozen-tundra.js';
import { mapVolcanicCore } from '../data/map-volcanic-core.js';
import { mapQuantumRift } from '../data/map-quantum-rift.js';

export const ALL_MAPS = [
  mapSpaceStation, mapCrystalCaves,
  mapAlienPlanet, mapFrozenTundra,
  mapAsteroidField, mapVolcanicCore,
  mapCyberpunkCity, mapQuantumRift,
];

const CARD_W = 360;
const CARD_H = 140;
const GAP_X = 30;
const GAP_Y = 12;

// Scroll state for map select
let scrollOffset = 0;
const SCROLL_SPEED = 30;

export function handleMapSelectScroll(deltaY) {
  scrollOffset += deltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED;
  // Clamp scroll
  const totalH = Math.ceil(ALL_MAPS.length / 2) * (CARD_H + GAP_Y) + 160;
  const maxScroll = Math.max(0, totalH - config.height + 60);
  scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset));
}

export function resetMapSelectScroll() {
  scrollOffset = 0;
}

function getCardPositions() {
  const startX = (config.width - CARD_W * 2 - GAP_X) / 2;
  const startY = 120 - scrollOffset;
  return ALL_MAPS.map((_, i) => ({
    x: startX + (i % 2) * (CARD_W + GAP_X),
    y: startY + Math.floor(i / 2) * (CARD_H + GAP_Y),
  }));
}

// Draw a miniature path preview
function drawPathPreview(ctx, mapDef, x, y, w, h) {
  const paths = mapDef.paths;
  // Compute bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const path of paths) {
    for (const wp of path.waypoints) {
      if (wp.x < minX) minX = wp.x;
      if (wp.x > maxX) maxX = wp.x;
      if (wp.y < minY) minY = wp.y;
      if (wp.y > maxY) maxY = wp.y;
    }
  }
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const margin = 10;

  for (const path of paths) {
    const wp = path.waypoints;
    ctx.strokeStyle = mapDef.theme.accentColor || '#00d4ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    for (let i = 0; i < wp.length; i++) {
      const px = x + margin + ((wp[i].x - minX) / rangeX) * (w - margin * 2);
      const py = y + margin + ((wp[i].y - minY) / rangeY) * (h - margin * 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Entry dot
    const e = wp[0];
    const ex = x + margin + ((e.x - minX) / rangeX) * (w - margin * 2);
    const ey = y + margin + ((e.y - minY) / rangeY) * (h - margin * 2);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();

    // Exit dot
    const l = wp[wp.length - 1];
    const lx = x + margin + ((l.x - minX) / rangeX) * (w - margin * 2);
    const ly = y + margin + ((l.y - minY) / rangeY) * (h - margin * 2);
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

const DIFFICULTY_LABELS = ['', 'Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_COLORS = ['', '#44ff88', '#ffd700', '#ff8844', '#ff4444'];

export function renderMapSelect(ctx, hoveredIndex, progress = {}) {
  fillBackground(ctx, config.width, config.height, '#080818');

  // Title
  drawText(ctx, 'SELECT MAP', config.width / 2, 30, {
    color: '#fff',
    font: 'bold 28px monospace',
    align: 'center',
    baseline: 'middle',
  });

  drawText(ctx, 'Choose your battlefield', config.width / 2, 58, {
    color: '#8892b0',
    font: '12px monospace',
    align: 'center',
    baseline: 'middle',
  });

  // Scroll hint
  const totalH = Math.ceil(ALL_MAPS.length / 2) * (CARD_H + GAP_Y) + 160;
  if (totalH > config.height) {
    drawText(ctx, 'Scroll to see more maps', config.width / 2, 78, {
      color: '#4a5568',
      font: '10px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }

  ctx.save();
  // Clip to content area below header
  ctx.beginPath();
  ctx.rect(0, 88, config.width, config.height - 120);
  ctx.clip();

  const positions = getCardPositions();

  for (let i = 0; i < ALL_MAPS.length; i++) {
    const map = ALL_MAPS[i];
    const pos = positions[i];
    const hovered = hoveredIndex === i;
    const mapProg = progress[map.id] || {};

    // Skip if off-screen
    if (pos.y + CARD_H < 88 || pos.y > config.height) continue;

    // Card background
    const hasProgress = mapProg.bestWave > 0;
    roundedRect(ctx, pos.x, pos.y, CARD_W, CARD_H, 8,
      hovered ? 'rgba(0,212,255,0.08)' : map.theme.background,
      hovered ? 'rgba(0,212,255,0.4)' : hasProgress ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
      hovered ? 2 : 1
    );

    // Path preview on the left side of card
    const previewW = 140;
    drawPathPreview(ctx, map, pos.x, pos.y, previewW, CARD_H);

    // Text area on the right side
    const textX = pos.x + previewW + 8;
    const textW = CARD_W - previewW - 16;

    // Active save indicator
    const saveData = progress['_save_' + map.id];
    const hasActiveSave = saveData && !saveData.cleared && saveData.currentWave !== undefined;
    if (hasActiveSave) {
      drawText(ctx, '▶ RESUME', textX, pos.y + 10, {
        color: '#00d4ff',
        font: 'bold 9px monospace',
      });
      drawText(ctx, `Wave ${saveData.currentWave + 1}`, textX + 65, pos.y + 10, {
        color: '#8892b0',
        font: '9px monospace',
      });
    }

    // Completion badge + difficulty dots (bottom-right of card, above stats)
    if (mapProg.completed) {
      const badgeX = pos.x + CARD_W - 10;
      const badgeY = pos.y + CARD_H - 30;
      drawText(ctx, mapProg.flawless ? '★ FLAWLESS' : '✓ COMPLETE', badgeX, badgeY, {
        color: mapProg.flawless ? '#ffd700' : '#44ff88',
        font: 'bold 9px monospace',
        align: 'right',
      });

      const diffDots = [
        { key: 'easyCompleted', label: 'E', color: '#44ff44' },
        { key: 'mediumCompleted', label: 'M', color: '#ffaa00' },
        { key: 'hardCompleted', label: 'H', color: '#ff4444' },
      ];
      const dotStartX = pos.x + CARD_W - 10;
      const dotY = badgeY - 12;
      let dotOffset = 0;
      for (let d = diffDots.length - 1; d >= 0; d--) {
        const dd = diffDots[d];
        const completed = !!mapProg[dd.key];
        drawText(ctx, dd.label, dotStartX - dotOffset, dotY, {
          color: completed ? dd.color : 'rgba(255,255,255,0.15)',
          font: `${completed ? 'bold ' : ''}8px monospace`,
          align: 'right',
        });
        dotOffset += 12;
      }
    } else if (mapProg.bestWave > 0) {
      const badgeX = pos.x + CARD_W - 10;
      const badgeY = pos.y + CARD_H - 30;
      drawText(ctx, `Wave ${mapProg.bestWave}/80`, badgeX, badgeY, {
        color: '#8892b0',
        font: '9px monospace',
        align: 'right',
      });
    }

    // Map name
    const nameY = pos.y + (hasActiveSave ? 30 : 16);
    drawText(ctx, map.name, textX, nameY, {
      color: '#fff',
      font: 'bold 13px monospace',
    });

    // Difficulty
    const diff = map.difficulty || 1;
    drawText(ctx, DIFFICULTY_LABELS[diff], textX + textW, nameY, {
      color: DIFFICULTY_COLORS[diff],
      font: 'bold 10px monospace',
      align: 'right',
    });

    // Description
    drawText(ctx, map.description, textX, nameY + 16, {
      color: '#6a7490',
      font: '9px monospace',
      maxWidth: textW,
    });

    // Path count
    const pathCount = map.paths.length;
    if (pathCount > 1) {
      drawText(ctx, `${pathCount} paths`, textX, nameY + 32, {
        color: map.theme.accentColor || '#888',
        font: '9px monospace',
      });
    }

    // Bottom row — starting info + progress stats
    let bottomText = `$${map.startingCash}  |  ${map.startingLives} lives`;
    const mult = map.cashMultiplier && map.cashMultiplier > 1 ? `  |  +${Math.round((map.cashMultiplier - 1) * 100)}%` : '';
    bottomText += mult;
    if (mapProg.timesPlayed > 0) {
      bottomText += `  |  ${mapProg.timesPlayed} plays`;
    }
    drawText(ctx, bottomText, textX, pos.y + CARD_H - 14, {
      color: '#4a5568',
      font: '8px monospace',
    });

    // Best time (if completed)
    if (mapProg.completed && mapProg.bestTime && mapProg.bestTime < Infinity) {
      const m = Math.floor(mapProg.bestTime / 60);
      const s = Math.floor(mapProg.bestTime % 60);
      drawText(ctx, `Best: ${m}:${s.toString().padStart(2, '0')}`, pos.x + CARD_W - 10, pos.y + CARD_H - 14, {
        color: '#00d4ff',
        font: '8px monospace',
        align: 'right',
      });
    }
  }

  ctx.restore();

  // Footer hint
  drawText(ctx, 'Click a map to begin', config.width / 2, config.height - 20, {
    color: '#4a5568',
    font: '11px monospace',
    align: 'center',
    baseline: 'middle',
  });
}

/**
 * Handle click on map select screen. Returns map definition or null.
 */
export function handleMapSelectClick(x, y) {
  const positions = getCardPositions();
  for (let i = 0; i < ALL_MAPS.length; i++) {
    const pos = positions[i];
    if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H) {
      return ALL_MAPS[i];
    }
  }
  return null;
}

/**
 * Get hovered map index or -1.
 */
export function getHoveredMapIndex(x, y) {
  const positions = getCardPositions();
  for (let i = 0; i < ALL_MAPS.length; i++) {
    const pos = positions[i];
    if (x >= pos.x && x <= pos.x + CARD_W && y >= pos.y && y <= pos.y + CARD_H) {
      return i;
    }
  }
  return -1;
}
