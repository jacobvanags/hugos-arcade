/**
 * Tooltip rendering — multi-line hover information.
 * Supports tower button hover, placed tower hover, enemy hover.
 */
import { config } from '../config.js';
import { TOWER_TYPES } from '../data/tower-defs.js';
import { roundedRect } from '../../../shared/canvas-utils.js';

/**
 * Build tooltip lines for a tower button (sidebar hover).
 */
export function buildTowerButtonTooltip(towerKey) {
  const def = TOWER_TYPES[towerKey];
  if (!def) return null;

  const lines = [
    { text: def.name, color: def.color, font: 'bold 11px monospace' },
    { text: def.description, color: '#8892b0', font: '10px monospace' },
    { text: '', color: '', font: '4px monospace' }, // spacer
  ];

  const stats = [];
  if (def.baseDamage > 0) stats.push(`DMG ${def.baseDamage}`);
  if (def.baseRange > 0) stats.push(`RNG ${def.baseRange}`);
  if (def.baseFireRate > 0) stats.push(`${(1 / def.baseFireRate).toFixed(1)}/s`);
  if (stats.length > 0) {
    lines.push({ text: stats.join(' | '), color: '#6a7490', font: '9px monospace' });
  }

  // Special attributes
  if (def.baseSplashRadius > 0) {
    lines.push({ text: `Splash: ${def.baseSplashRadius}px`, color: '#ff8844', font: '9px monospace' });
  }
  if (def.baseSlowFactor > 0) {
    lines.push({ text: `Slow: ${Math.round((1 - def.baseSlowFactor) * 100)}%`, color: '#88ddff', font: '9px monospace' });
  }
  if (def.baseChainCount > 0) {
    lines.push({ text: `Chain: ${def.baseChainCount} targets`, color: '#ffdd44', font: '9px monospace' });
  }
  if (def.baseBuffRadius > 0) {
    lines.push({ text: `Buff radius: ${def.baseBuffRadius}px`, color: '#44ff88', font: '9px monospace' });
  }

  lines.push({ text: `Cost: $${def.baseCost}`, color: '#ffd700', font: 'bold 10px monospace' });

  return lines;
}

/**
 * Build tooltip lines for a placed tower.
 */
export function buildPlacedTowerTooltip(tower) {
  const def = TOWER_TYPES[tower.type];
  if (!def) return null;

  const lines = [
    { text: def.name, color: tower.color, font: 'bold 11px monospace' },
  ];

  // Current stats
  const dmg = tower.effectiveDamage || tower.damage;
  const rng = tower.type === 'support' ? tower.buffRadius : (tower.effectiveRange || tower.range);
  const rate = tower.effectiveFireRate || tower.fireRate;
  const stats = [];
  if (dmg > 0) stats.push(`DMG ${dmg}`);
  if (rng > 0) stats.push(`RNG ${rng}`);
  if (rate > 0) stats.push(`${(1 / rate).toFixed(1)}/s`);
  if (stats.length > 0) {
    lines.push({ text: stats.join(' | '), color: '#6a7490', font: '9px monospace' });
  }

  // Buffed indicator
  if (tower.buffed) {
    lines.push({ text: 'BUFFED', color: '#00ff88', font: 'bold 9px monospace' });
  }

  // Upgrade levels
  const upgLevels = tower.upgrades.map((u, i) => `${def.upgradePaths[i].name.substring(0, 3)}:${u}`).join(' ');
  lines.push({ text: upgLevels, color: '#555', font: '8px monospace' });

  // Targeting
  lines.push({ text: `Target: ${tower.targetingMode}`, color: '#555', font: '8px monospace' });

  // Sell value
  const sellValue = Math.floor(tower.totalSpent * config.sellRefund);
  lines.push({ text: `Sell: $${sellValue}`, color: '#ff6644', font: '9px monospace' });

  return lines;
}

/**
 * Build tooltip lines for an enemy.
 */
export function buildEnemyTooltip(enemy) {
  const lines = [
    { text: enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1), color: enemy.color, font: 'bold 11px monospace' },
  ];

  // HP bar text
  const hpPct = Math.round((enemy.hp / enemy.maxHp) * 100);
  lines.push({ text: `HP: ${Math.ceil(enemy.hp)}/${enemy.maxHp} (${hpPct}%)`, color: '#44ff44', font: '9px monospace' });

  // Shield
  if (enemy.maxShieldHp > 0) {
    lines.push({ text: `Shield: ${Math.ceil(enemy.shieldHp)}/${enemy.maxShieldHp}`, color: '#4488ff', font: '9px monospace' });
  }

  // Armor
  if (enemy.armor > 0) {
    lines.push({ text: `Armor: ${enemy.armor}`, color: '#aaaaaa', font: '9px monospace' });
  }

  // Status effects
  if (enemy.slowDuration > 0) {
    lines.push({ text: `Slowed ${Math.round((1 - enemy.slowFactor) * 100)}%`, color: '#88ddff', font: '9px monospace' });
  }
  if (enemy.cloaked && !enemy.revealed) {
    lines.push({ text: 'Cloaked', color: '#aa44ff', font: '9px monospace' });
  }

  return lines;
}

/**
 * Check if mouse is hovering a sidebar tower button.
 * Returns tower type key or null.
 */
export function getHoveredTowerButton(mx, my) {
  const sb = config.sidebar;
  if (mx < sb.x) return null;

  const cols = 2;
  const btnW = 104;
  const btnH = 44;
  const gapX = 8;
  const gapY = 6;
  const startX = sb.x + 10;
  const startY = 40;
  const towerKeys = ['blaster', 'railgun', 'plasma', 'cryo', 'tesla', 'support', 'missile', 'laser'];

  for (let i = 0; i < towerKeys.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = startX + col * (btnW + gapX);
    const by = startY + row * (btnH + gapY);
    if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
      return towerKeys[i];
    }
  }
  return null;
}

/**
 * Find the enemy closest to the mouse cursor (within 20px).
 */
export function getHoveredEnemy(mx, my, enemies) {
  let closest = null;
  let closestDist = 20 * 20; // 20px max hover distance
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const dx = e.x - mx;
    const dy = e.y - my;
    const d = dx * dx + dy * dy;
    if (d < closestDist) {
      closestDist = d;
      closest = e;
    }
  }
  return closest;
}

/**
 * Render a multi-line tooltip at a position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} gs - Game state with tooltip info
 */
export function renderTooltip(ctx, gs) {
  if (!gs.tooltip) return;

  const { x, y, lines } = gs.tooltip;
  if (!lines || lines.length === 0) return;

  const padding = 8;
  const lineHeight = 14;
  const defaultFont = '10px monospace';

  // Measure max width
  let maxW = 0;
  for (const line of lines) {
    ctx.font = line.font || defaultFont;
    const w = ctx.measureText(line.text || '').width;
    if (w > maxW) maxW = w;
  }

  const boxW = maxW + padding * 2;
  const boxH = lines.length * lineHeight + padding * 2;

  // Position — prefer above cursor, stay in bounds
  let tx = Math.min(x, config.width - boxW - 4);
  let ty = y - boxH - 12;
  if (ty < 4) ty = y + 20;
  if (tx < 4) tx = 4;

  // Background
  roundedRect(ctx, tx, ty, boxW, boxH, 5, 'rgba(8,8,16,0.92)', 'rgba(255,255,255,0.1)', 1);

  // Lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.text) continue;
    ctx.font = line.font || defaultFont;
    ctx.fillStyle = line.color || '#e8e8e8';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(line.text, tx + padding, ty + padding + i * lineHeight);
  }
}
