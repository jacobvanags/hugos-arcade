/**
 * Upgrade panel — shown when a placed tower is selected.
 * Displays 3 upgrade paths with tier progress, next upgrade info, and buy buttons.
 * Enforces [5,2,0] constraint visually (locked paths shown as blocked).
 */
import { config } from '../config.js';
import { drawText, roundedRect } from '../../../shared/canvas-utils.js';
import { TOWER_TYPES, getUpgradeCost } from '../data/tower-defs.js';

// Layout constants
const PANEL_X_PAD = 10;
const PATH_HEIGHT = 70;
const PATH_GAP = 4;
const PIP_RADIUS = 3;
const PIP_GAP = 12;
// Buy buttons were 56×20 for mouse — too small for a finger on iPad.
// 68×28 keeps the text readable and easily tappable.
const BUY_BTN_W = 68;
const BUY_BTN_H = 28;

// Effect display names (short labels for upgrade effects)
const EFFECT_LABELS = {
  damage: 'DMG',
  range: 'RNG',
  fireRate: 'SPD',
  splashRadius: 'AOE',
  slowFactor: 'SLOW',
  slowDuration: 'SLWD',
  chainCount: 'CHN',
  chainRange: 'CHNR',
  pierce: 'PRC',
  armorPierce: 'AP',
  buffDamage: 'BDMG',
  buffSpeed: 'BSPD',
  buffRange: 'BRNG',
  buffRadius: 'BRAD',
  detectCloaked: 'CAMO',
  income: 'INC',
  bonusCashPct: 'CASH',
};

/**
 * Get the primary effect type for an upgrade path at a given tier.
 * Prefers showing NEW effects introduced at this tier over repeated ones.
 * Falls back to the path's base effect if nothing new is found.
 */
function getPathEffectForTier(path, tierIndex) {
  const tier = path.tiers[tierIndex];
  if (!tier) return Object.keys(path.tiers[0].effects)[0] || 'damage';

  const currentKeys = Object.keys(tier.effects);

  // Find effects that are NEW at this tier (not present in tier 0)
  if (tierIndex > 0) {
    const baseKeys = Object.keys(path.tiers[0].effects);
    const newKeys = currentKeys.filter(k => !baseKeys.includes(k));
    if (newKeys.length > 0) return newKeys[0];
  }

  return currentKeys[0] || 'damage';
}

/** Convert hex color to r,g,b string for rgba(). */
function hexToRgb(hex) {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    const m = hex.match(/[\d.]+/g);
    return m ? `${m[0]},${m[1]},${m[2]}` : '255,255,255';
  }
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;
  return `${r},${g},${b}`;
}

/**
 * Draw a small themed icon for an upgrade path with tier-based visual progression.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {string} effectKey - Primary effect type
 * @param {string} color - Icon color
 * @param {number} tier - Current upgrade tier (0-4), affects icon scale and glow
 */
function drawUpgradeIcon(ctx, cx, cy, effectKey, color, tier = 0) {
  ctx.save();
  ctx.translate(cx, cy);

  // Tier-based scaling: 0.85 at tier 0, up to 1.25 at tier 4
  const scale = 0.85 + tier * 0.1;
  ctx.scale(scale, scale);

  // Glow at higher tiers (tier 2+)
  if (tier >= 2) {
    const glowAlpha = 0.08 + tier * 0.06;
    const glowRadius = 8 + tier * 2;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(color)},${glowAlpha})`;
    ctx.fill();
  }

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  switch (effectKey) {
    case 'fireRate': // Lightning bolt
      ctx.beginPath();
      ctx.moveTo(-2, -6);
      ctx.lineTo(1, -1);
      ctx.lineTo(-1, 0);
      ctx.lineTo(2, 6);
      ctx.stroke();
      break;

    case 'damage': // Upward arrow
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(0, 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.lineTo(0, -6);
      ctx.lineTo(4, -2);
      ctx.stroke();
      break;

    case 'range': // Crosshair
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -6); ctx.lineTo(0, -3);
      ctx.moveTo(0, 3); ctx.lineTo(0, 6);
      ctx.moveTo(-6, 0); ctx.lineTo(-3, 0);
      ctx.moveTo(3, 0); ctx.lineTo(6, 0);
      ctx.stroke();
      break;

    case 'splashRadius': // Starburst
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2);
        ctx.lineTo(Math.cos(a) * 6, Math.sin(a) * 6);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'slowFactor':
    case 'slowDuration': // Snowflake
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * -5, Math.sin(a) * -5);
        ctx.lineTo(Math.cos(a) * 5, Math.sin(a) * 5);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'chainCount':
    case 'chainRange': // Branching lines
      ctx.beginPath();
      ctx.moveTo(-4, 4);
      ctx.lineTo(0, 0);
      ctx.lineTo(4, -4);
      ctx.moveTo(0, 0);
      ctx.lineTo(5, 1);
      ctx.moveTo(0, 0);
      ctx.lineTo(-1, -5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-4, 4, 1.5, 0, Math.PI * 2);
      ctx.arc(4, -4, 1.5, 0, Math.PI * 2);
      ctx.arc(5, 1, 1.5, 0, Math.PI * 2);
      ctx.arc(-1, -5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'pierce':
    case 'armorPierce': // Arrow through line
      ctx.beginPath();
      ctx.moveTo(-5, 4);
      ctx.lineTo(5, -4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, -6);
      ctx.lineTo(5, -4);
      ctx.lineTo(3, -1);
      ctx.stroke();
      // Barrier line
      ctx.beginPath();
      ctx.moveTo(1, -5);
      ctx.lineTo(-2, 5);
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;

    case 'buffDamage':
    case 'buffSpeed':
    case 'buffRange':
    case 'buffRadius': // Shield with plus
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, -3);
      ctx.lineTo(5, 1);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 1);
      ctx.lineTo(-5, -3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -2); ctx.lineTo(0, 3);
      ctx.moveTo(-2.5, 0.5); ctx.lineTo(2.5, 0.5);
      ctx.stroke();
      break;

    case 'detectCloaked': // Eye
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -5, 6, 0);
      ctx.quadraticCurveTo(0, 5, -6, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'income':
    case 'bonusCashPct': // Coin with $
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.stroke();
      drawText(ctx, '$', 0, 0, {
        color,
        font: 'bold 8px monospace',
        align: 'center',
        baseline: 'middle',
      });
      break;

    case 'dotDps':
    case 'dotDuration': // Droplet
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.quadraticCurveTo(6, 2, 0, 6);
      ctx.quadraticCurveTo(-6, 2, 0, -6);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
      break;

    case 'damageAmp':
    case 'damageAmpDuration': // Signal waves
      for (let i = 0; i < 3; i++) {
        const r = 2 + i * 2.5;
        ctx.beginPath();
        ctx.arc(-3, 0, r, -0.7, 0.7);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(-3, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'rampRate':
    case 'maxRamp': // Rising bars
      for (let i = 0; i < 4; i++) {
        const bh = 3 + i * 2.5;
        const bx = -5 + i * 3;
        ctx.fillRect(bx, 5 - bh, 2, bh);
      }
      break;

    default: // Generic diamond
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 5);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.stroke();
      break;
  }

  ctx.restore();
}

/**
 * Format an effect value for display.
 */
function formatEffect(key, val) {
  const label = EFFECT_LABELS[key] || key;
  if (typeof val === 'boolean') return `+${label}`;
  if (key === 'fireRate') return `${label} ${(1 / val).toFixed(1)}/s`;
  if (key === 'slowFactor') return `SLOW ${Math.round((1 - val) * 100)}%`;
  if (key === 'buffDamage' || key === 'buffSpeed' || key === 'buffRange') {
    return `${label} +${Math.round(val * 100)}%`;
  }
  if (key === 'bonusCashPct') return `${label} +${Math.round(val * 100)}%`;
  if (key === 'income') return `${label} $${val}`;
  return `${label} ${val}`;
}

/**
 * Check if a path is locked by the [5,2,0] constraint.
 */
function isPathLocked(tower, pathIndex) {
  const current = tower.upgrades[pathIndex];
  if (current > 0) return false; // Already invested, not locked

  // Count paths with upgrades
  const pathsUsed = tower.upgrades.filter(u => u > 0).length;
  if (pathsUsed < 2) return false; // Can still start a new path

  return true; // Third path blocked
}

/**
 * Check if the next tier on a path is blocked by [5,2,0].
 */
function isNextTierBlocked(tower, pathIndex) {
  const current = tower.upgrades[pathIndex];
  if (current >= 5) return true; // Already maxed

  // If locked (path not started and 2 paths already used)
  if (isPathLocked(tower, pathIndex)) return true;

  const others = [0, 1, 2].filter(i => i !== pathIndex);
  const otherLevels = others.map(i => tower.upgrades[i]);

  // One path can go to 5, another to 2, third stays 0
  if (current >= 2) {
    // This path is at 2+, can it go higher?
    // Only if no other path is above 2
    const highOther = otherLevels.find(l => l > 2);
    if (highOther !== undefined) return true;
  }

  return false;
}

/**
 * Render the upgrade panel for the selected tower.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gs - Game state
 * @param {number} startY - Y position to start rendering
 * @returns {number} The Y position after the panel (for layout chaining)
 */
export function renderUpgradePanel(ctx, gs, startY) {
  if (!gs.selectedTower) return startY;

  const sb = config.sidebar;
  const t = gs.selectedTower;
  const def = TOWER_TYPES[t.type];
  if (!def) return startY;

  const x = sb.x + PANEL_X_PAD;
  const w = sb.w - PANEL_X_PAD * 2;
  let y = startY;

  // Section header
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  y += 12;

  drawText(ctx, 'UPGRADES', sb.x + sb.w / 2, y, {
    color: '#4a5568',
    font: '8px monospace',
    align: 'center',
  });
  y += 14;

  // Draw 3 upgrade paths
  for (let p = 0; p < 3; p++) {
    const path = def.upgradePaths[p];
    const currentTier = t.upgrades[p];
    const locked = isPathLocked(t, p);
    const blocked = isNextTierBlocked(t, p);
    const maxed = currentTier >= 5;
    const nextTier = maxed ? null : path.tiers[currentTier];
    const cost = maxed ? 0 : getUpgradeCost(t.type, p, currentTier);
    const canAfford = !maxed && !blocked && gs.cash >= cost;

    // Path background
    const bgAlpha = locked ? 0.01 : 0.03;
    roundedRect(ctx, x, y, w, PATH_HEIGHT, 4,
      `rgba(255,255,255,${bgAlpha})`,
      locked ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
      1
    );

    // Path name + tier indicator
    const nameColor = locked ? '#333' : '#8892b0';
    drawText(ctx, path.name, x + 6, y + 10, {
      color: nameColor,
      font: 'bold 9px monospace',
    });

    // Tier pips (5 circles)
    const pipStartX = x + w - 5 * PIP_GAP - 2;
    for (let i = 0; i < 5; i++) {
      const px = pipStartX + i * PIP_GAP;
      const py = y + 10;
      ctx.beginPath();
      ctx.arc(px, py, PIP_RADIUS, 0, Math.PI * 2);
      if (i < currentTier) {
        // Filled pip
        ctx.fillStyle = locked ? '#333' : t.color;
        ctx.fill();
      } else {
        // Empty pip
        ctx.strokeStyle = locked ? '#222' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Path icon — shows the current tier's most relevant effect, evolves as you upgrade
    const accentColor = def.pathAccentColors ? def.pathAccentColors[p] : t.color;

    if (maxed) {
      // MAXED — icon shows final tier effect in gold at max scale
      const maxEffect = getPathEffectForTier(path, 4);
      drawUpgradeIcon(ctx, x + 14, y + 40, maxEffect, '#ffd700', 5);
      drawText(ctx, 'MAXED', x + w / 2, y + 34, {
        color: '#ffd700',
        font: 'bold 10px monospace',
        align: 'center',
      });
      drawText(ctx, path.tiers[4].name, x + w / 2, y + 50, {
        color: '#6a7490',
        font: '8px monospace',
        align: 'center',
      });
    } else if (locked) {
      // LOCKED indicator
      drawText(ctx, 'LOCKED', x + w / 2, y + 38, {
        color: '#442222',
        font: 'bold 10px monospace',
        align: 'center',
      });
    } else {
      // Icon shows what the NEXT upgrade will give you
      const iconColor = blocked ? '#333' : accentColor;
      const nextEffect = getPathEffectForTier(path, currentTier);
      drawUpgradeIcon(ctx, x + 14, y + 36, nextEffect, iconColor, currentTier);

      // Next upgrade info (shifted right for icon)
      const textX = x + 28;
      drawText(ctx, nextTier.name, textX, y + 28, {
        color: blocked ? '#444' : '#c8c8d0',
        font: '9px monospace',
      });

      // Effect summary (compact, up to 3 effects)
      const effectKeys = Object.keys(nextTier.effects);
      const effectStr = effectKeys.slice(0, 3).map(k => formatEffect(k, nextTier.effects[k])).join('  ');
      drawText(ctx, effectStr, textX, y + 42, {
        color: blocked ? '#333' : '#6a7490',
        font: '8px monospace',
      });

      // Buy button
      const btnX = x + w - BUY_BTN_W - 4;
      const btnY = y + PATH_HEIGHT - BUY_BTN_H - 6;

      if (blocked) {
        roundedRect(ctx, btnX, btnY, BUY_BTN_W, BUY_BTN_H, 3,
          'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)', 1);
        drawText(ctx, 'BLOCKED', btnX + BUY_BTN_W / 2, btnY + BUY_BTN_H / 2, {
          color: '#333',
          font: '8px monospace',
          align: 'center',
          baseline: 'middle',
        });
      } else {
        const btnFill = canAfford ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)';
        const btnStroke = canAfford ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)';
        roundedRect(ctx, btnX, btnY, BUY_BTN_W, BUY_BTN_H, 3, btnFill, btnStroke, 1);
        drawText(ctx, `$${cost}`, btnX + BUY_BTN_W / 2, btnY + BUY_BTN_H / 2, {
          color: canAfford ? '#ffd700' : '#553300',
          font: 'bold 9px monospace',
          align: 'center',
          baseline: 'middle',
        });
      }
    }

    y += PATH_HEIGHT + PATH_GAP;
  }

  return y;
}

/**
 * Handle clicks on the upgrade panel. Returns action object or null.
 * @param {number} x - Click X coordinate
 * @param {number} y - Click Y coordinate
 * @param {object} gs - Game state
 * @param {number} startY - Y position where upgrade panel starts
 */
export function handleUpgradeClick(x, y, gs, startY) {
  if (!gs.selectedTower) return null;

  const sb = config.sidebar;
  if (x < sb.x) return null;

  const t = gs.selectedTower;
  const def = TOWER_TYPES[t.type];
  if (!def) return null;

  const panelX = sb.x + PANEL_X_PAD;
  const w = sb.w - PANEL_X_PAD * 2;

  // Skip header area (separator + "UPGRADES" label)
  let pathY = startY + 26;

  for (let p = 0; p < 3; p++) {
    const currentTier = t.upgrades[p];
    const maxed = currentTier >= 5;
    const blocked = isNextTierBlocked(t, p);

    if (!maxed && !blocked) {
      // Check if click is on the buy button
      const btnX = panelX + w - BUY_BTN_W - 4;
      const btnY = pathY + PATH_HEIGHT - BUY_BTN_H - 6;

      if (x >= btnX && x <= btnX + BUY_BTN_W &&
          y >= btnY && y <= btnY + BUY_BTN_H) {
        return { action: 'upgrade', pathIndex: p };
      }
    }

    pathY += PATH_HEIGHT + PATH_GAP;
  }

  return null;
}
