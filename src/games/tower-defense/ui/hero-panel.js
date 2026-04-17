/**
 * Hero selection grid + selected hero info panel with ability controls.
 */
import { config } from '../config.js';
import { drawText, roundedRect, progressBar } from '../../../shared/canvas-utils.js';
import { HERO_TYPES, HERO_ORDER } from '../data/hero-defs.js';

// Layout constants
const HERO_Y_FALLBACK = 440;
function getHeroSectionY(gs) { return (gs._towerGridEndY || HERO_Y_FALLBACK) + 8; }
const BTN_W = 104;
const BTN_H = 40;
const GAP_X = 8;
const GAP_Y = 6;

// Hero icon drawing
function drawHeroIcon(ctx, x, y, heroKey, color, affordable, deployed) {
  const alpha = (!affordable || deployed) ? 0.3 : 1;
  ctx.globalAlpha = alpha;
  // Helmet
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 2, 6, 0, Math.PI * 2);
  ctx.fill();
  // Visor
  ctx.fillStyle = 'rgba(180,220,255,0.7)';
  ctx.beginPath();
  ctx.arc(x, y - 3, 3.5, -Math.PI * 0.6, Math.PI * 0.6);
  ctx.fill();
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - 4, y + 3, 8, 6);
  ctx.globalAlpha = 1;
}

/**
 * Render hero selection grid in the sidebar.
 * @returns {number} Y position after the hero section
 */
export function renderHeroSection(ctx, gs) {
  const sb = config.sidebar;
  let y = getHeroSectionY(gs);

  // Separator
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sb.x + 12, y - 6);
  ctx.lineTo(sb.x + sb.w - 12, y - 6);
  ctx.stroke();

  // Title
  drawText(ctx, 'HEROES', sb.x + sb.w / 2, y, {
    color: '#8892b0',
    font: 'bold 10px monospace',
    align: 'center',
  });
  y += 14;

  const startX = sb.x + 10;

  for (let i = 0; i < HERO_ORDER.length; i++) {
    const key = HERO_ORDER[i];
    const def = HERO_TYPES[key];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = startX + col * (BTN_W + GAP_X);
    const by = y + row * (BTN_H + GAP_Y);
    const deployed = !!gs.heroesPlaced[key];
    const canAfford = gs.cash >= def.cost && !deployed;
    const selected = gs.selectedHeroType === key;

    // Button bg
    roundedRect(ctx, bx, by, BTN_W, BTN_H, 5,
      selected ? 'rgba(0,212,255,0.12)' : deployed ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)',
      selected ? 'rgba(0,212,255,0.3)' : deployed ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
      1
    );

    // Icon
    drawHeroIcon(ctx, bx + 16, by + BTN_H / 2, key, def.color, canAfford, deployed);

    // Name
    drawText(ctx, def.name, bx + 30, by + 7, {
      color: deployed ? '#555' : canAfford ? '#e8e8e8' : '#555',
      font: 'bold 9px monospace',
    });

    // Cost or Deployed
    if (deployed) {
      drawText(ctx, 'DEPLOYED', bx + 30, by + 20, {
        color: '#44ff88',
        font: '7px monospace',
      });
    } else {
      drawText(ctx, `$${def.cost}`, bx + 30, by + 20, {
        color: canAfford ? '#ffd700' : '#663300',
        font: '9px monospace',
      });
    }

    // Color bar at bottom
    ctx.fillStyle = canAfford ? def.color : deployed ? 'rgba(68,255,136,0.2)' : 'rgba(136,146,176,0.15)';
    ctx.fillRect(bx + 4, by + BTN_H - 3, BTN_W - 8, 2);
  }

  return y + Math.ceil(HERO_ORDER.length / 2) * (BTN_H + GAP_Y);
}

/**
 * Render info panel for a selected (placed) hero.
 */
export function renderSelectedHeroInfo(ctx, gs) {
  const sb = config.sidebar;
  const h = gs.selectedHero;
  const def = HERO_TYPES[h.type];
  let y = getHeroSectionY(gs);

  // Separator
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sb.x + 12, y - 6);
  ctx.lineTo(sb.x + sb.w - 12, y - 6);
  ctx.stroke();

  // Selected label
  drawText(ctx, 'HERO SELECTED', sb.x + sb.w / 2, y, {
    color: '#4a5568',
    font: '8px monospace',
    align: 'center',
  });
  y += 14;

  // Name
  drawText(ctx, def.name, sb.x + sb.w / 2, y, {
    color: h.color,
    font: 'bold 12px monospace',
    align: 'center',
  });
  y += 16;

  // Stats row
  const dmg = h.damage;
  const rng = h.range;
  const rate = h.fireRate;
  drawText(ctx, `DMG ${dmg} | RNG ${rng} | ${(1 / rate).toFixed(1)}/s`, sb.x + sb.w / 2, y, {
    color: '#6a7490',
    font: '8px monospace',
    align: 'center',
  });
  y += 16;

  // --- Ability Section ---
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.moveTo(sb.x + 12, y);
  ctx.lineTo(sb.x + sb.w - 12, y);
  ctx.stroke();
  y += 12;

  drawText(ctx, 'ABILITY', sb.x + sb.w / 2, y, {
    color: '#4a5568',
    font: '8px monospace',
    align: 'center',
  });
  y += 12;

  // Ability name
  drawText(ctx, def.ability.name, sb.x + sb.w / 2, y, {
    color: '#e8e8e8',
    font: 'bold 10px monospace',
    align: 'center',
  });
  y += 12;

  // Ability description
  drawText(ctx, def.ability.description, sb.x + sb.w / 2, y, {
    color: '#6a7490',
    font: '8px monospace',
    align: 'center',
    maxWidth: sb.w - 24,
  });
  y += 14;

  // Cooldown bar
  const barX = sb.x + 14;
  const barW = sb.w - 28;
  const barH = 10;
  const maxCd = def.ability.cooldown;
  const currentCd = h.abilityCooldown;
  const progress = maxCd > 0 ? 1 - (currentCd / maxCd) : 1;

  if (h.abilityActive) {
    // Active — show duration remaining
    const durProgress = h.abilityTimer / def.ability.duration;
    progressBar(ctx, barX, y, barW, barH, durProgress, '#ffd700', '#1a1a2e', 3);
    drawText(ctx, `ACTIVE ${h.abilityTimer.toFixed(1)}s`, sb.x + sb.w / 2, y + 5, {
      color: '#ffd700',
      font: 'bold 8px monospace',
      align: 'center',
      baseline: 'middle',
    });
  } else if (currentCd > 0) {
    // On cooldown
    progressBar(ctx, barX, y, barW, barH, progress, '#4a5568', '#1a1a2e', 3);
    drawText(ctx, `${currentCd.toFixed(1)}s`, sb.x + sb.w / 2, y + 5, {
      color: '#8892b0',
      font: '8px monospace',
      align: 'center',
      baseline: 'middle',
    });
  } else {
    // Ready
    progressBar(ctx, barX, y, barW, barH, 1, '#00ff88', '#1a1a2e', 3);
    drawText(ctx, 'READY', sb.x + sb.w / 2, y + 5, {
      color: '#00ff88',
      font: 'bold 8px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }
  y += 16;

  // Activate button
  gs._abilityBtnY = y;
  const canActivate = h.abilityCooldown <= 0 && !h.abilityActive;
  roundedRect(ctx, sb.x + 14, y, sb.w - 28, 26, 5,
    canActivate ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.02)',
    canActivate ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)',
    1
  );
  drawText(ctx,
    h.abilityActive ? 'ACTIVE!' : canActivate ? 'ACTIVATE [Q]' : 'COOLDOWN',
    sb.x + sb.w / 2, y + 13, {
      color: h.abilityActive ? '#ffd700' : canActivate ? '#00ff88' : '#555',
      font: 'bold 10px monospace',
      align: 'center',
      baseline: 'middle',
    });
  y += 32;

  // --- Action Buttons ---
  // Target cycle
  gs._heroTargetBtnY = y;
  roundedRect(ctx, sb.x + 10, y, sb.w - 20, 24, 4,
    'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.08)', 1);
  drawText(ctx, `Target: ${h.targetingMode} [T]`, sb.x + sb.w / 2, y + 12, {
    color: '#8892b0',
    font: '10px monospace',
    align: 'center',
    baseline: 'middle',
  });
  y += 28;

  // Sell button
  gs._heroSellBtnY = y;
  const sellValue = Math.floor(h.totalSpent * config.sellRefund);
  roundedRect(ctx, sb.x + 10, y, sb.w - 20, 24, 4,
    'rgba(255,68,68,0.08)', 'rgba(255,68,68,0.2)', 1);
  drawText(ctx, `Sell ($${sellValue}) [S]`, sb.x + sb.w / 2, y + 12, {
    color: '#ff4444',
    font: '10px monospace',
    align: 'center',
    baseline: 'middle',
  });
}

/**
 * Handle clicks on hero section. Returns action object or null.
 */
export function handleHeroSectionClick(x, y, gs) {
  const sb = config.sidebar;
  if (x < sb.x) return null;

  // Hero button grid
  const startX = sb.x + 10;
  const startY = getHeroSectionY(gs) + 14;

  for (let i = 0; i < HERO_ORDER.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = startX + col * (BTN_W + GAP_X);
    const by = startY + row * (BTN_H + GAP_Y);

    if (x >= bx && x <= bx + BTN_W && y >= by && y <= by + BTN_H) {
      const key = HERO_ORDER[i];
      if (gs.heroesPlaced[key]) return null; // Already deployed
      return { action: 'selectHero', heroType: key };
    }
  }

  return null;
}

/**
 * Handle clicks on selected hero info panel. Returns action object or null.
 */
export function handleHeroInfoClick(x, y, gs) {
  const sb = config.sidebar;
  if (x < sb.x || !gs.selectedHero) return null;

  // Ability button
  if (gs._abilityBtnY != null && x >= sb.x + 14 && x <= sb.x + sb.w - 14) {
    if (y >= gs._abilityBtnY && y <= gs._abilityBtnY + 26) {
      return { action: 'activateAbility' };
    }
  }

  // Target button
  if (gs._heroTargetBtnY != null && x >= sb.x + 10 && x <= sb.x + sb.w - 10) {
    if (y >= gs._heroTargetBtnY && y <= gs._heroTargetBtnY + 24) {
      return { action: 'heroTargeting' };
    }
  }

  // Sell button
  if (gs._heroSellBtnY != null && x >= sb.x + 10 && x <= sb.x + sb.w - 10) {
    if (y >= gs._heroSellBtnY && y <= gs._heroSellBtnY + 24) {
      return { action: 'sellHero' };
    }
  }

  return null;
}
