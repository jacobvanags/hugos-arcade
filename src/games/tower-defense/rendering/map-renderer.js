/**
 * Map background, paths, grid, and decorations.
 * Caches the static map to an offscreen canvas for performance.
 */
import { config, cellToPixel } from '../config.js';
import { circle, roundedRect, fillBackground, line } from '../../../shared/canvas-utils.js';
import { TOWER_TYPES } from '../data/tower-defs.js';
import { HERO_TYPES } from '../data/hero-defs.js';

let bgCanvas = null;

export function initMapRenderer(mapDef) {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = config.width;
  bgCanvas.height = config.height;
  const ctx = bgCanvas.getContext('2d');

  const theme = mapDef.theme;

  // Background
  fillBackground(ctx, config.width, config.height, theme.background);

  // Grid lines in game area
  ctx.strokeStyle = config.colors.gridLine;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= config.gameArea.w; x += config.cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, config.gridOffsetY);
    ctx.lineTo(x, config.height);
    ctx.stroke();
  }
  for (let y = config.gridOffsetY; y <= config.height; y += config.cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(config.gameArea.w, y);
    ctx.stroke();
  }

  // Draw paths
  for (const path of mapDef.paths) {
    const wp = path.waypoints;
    // Path fill (thick line)
    ctx.strokeStyle = theme.pathColor;
    ctx.lineWidth = mapDef.pathWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(wp[0].x, wp[0].y + config.gridOffsetY);
    for (let i = 1; i < wp.length; i++) {
      ctx.lineTo(wp[i].x, wp[i].y + config.gridOffsetY);
    }
    ctx.stroke();

    // Path border
    ctx.strokeStyle = theme.pathBorder;
    ctx.lineWidth = mapDef.pathWidth + 4;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.beginPath();
    ctx.moveTo(wp[0].x, wp[0].y + config.gridOffsetY);
    for (let i = 1; i < wp.length; i++) {
      ctx.lineTo(wp[i].x, wp[i].y + config.gridOffsetY);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    // Entry and exit markers
    const entry = wp[0];
    const exit = wp[wp.length - 1];
    ctx.fillStyle = '#00ff8844';
    ctx.beginPath();
    ctx.arc(entry.x, entry.y + config.gridOffsetY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff444444';
    ctx.beginPath();
    ctx.arc(exit.x, exit.y + config.gridOffsetY, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Decorations
  if (theme.decorations) {
    for (const d of theme.decorations) {
      if (d.type === 'panel') {
        ctx.fillStyle = d.color;
        ctx.fillRect(d.x, d.y + config.gridOffsetY, d.w, d.h);
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x, d.y + config.gridOffsetY, d.w, d.h);
      } else if (d.type === 'light') {
        ctx.fillStyle = d.color;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(d.x, d.y + config.gridOffsetY, d.radius || 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Sidebar background
  ctx.fillStyle = config.colors.sidebarBg;
  ctx.fillRect(config.sidebar.x, config.sidebar.y, config.sidebar.w, config.sidebar.h);
  ctx.strokeStyle = config.colors.sidebarBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(config.sidebar.x, 0);
  ctx.lineTo(config.sidebar.x, config.height);
  ctx.stroke();
}

export function renderMap(ctx, gs) {
  // Draw cached background
  if (bgCanvas) {
    ctx.drawImage(bgCanvas, 0, 0);
  }

  // Hover highlight for tower or hero placement
  const placingType = gs.selectedTowerType || gs.selectedHeroType;
  if (gs.hoveredCell && placingType) {
    const { col, row } = gs.hoveredCell;
    const canPlace = gs.grid[row] && gs.grid[row][col] === config.EMPTY;
    const x = col * config.cellSize;
    const y = row * config.cellSize + config.gridOffsetY;
    ctx.fillStyle = canPlace ? config.colors.cellHoverValid : config.colors.cellHoverInvalid;
    ctx.fillRect(x, y, config.cellSize, config.cellSize);

    // Range preview
    if (canPlace) {
      const center = cellToPixel(col, row);
      const def = gs.selectedTowerType
        ? TOWER_TYPES[gs.selectedTowerType]
        : HERO_TYPES[gs.selectedHeroType];
      if (def) {
        const previewRange = def.baseBuffRadius || def.baseRange;
        ctx.strokeStyle = config.colors.rangeCircle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center.x, center.y, previewRange, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Selected tower range circle
  if (gs.selectedTower) {
    const t = gs.selectedTower;
    const displayRange = t.type === 'support'
      ? t.buffRadius
      : (t.effectiveRange || t.range);
    ctx.strokeStyle = config.colors.rangeCircleActive;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(t.x, t.y, displayRange, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Selected hero range circle
  if (gs.selectedHero) {
    const h = gs.selectedHero;
    ctx.strokeStyle = config.colors.rangeCircleActive;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, h.range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
