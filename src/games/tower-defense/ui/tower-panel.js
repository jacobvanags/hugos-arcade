/**
 * Right sidebar tower selection panel — 16 towers grouped by class.
 */
import { config } from '../config.js';
import { drawText, roundedRect } from '../../../shared/canvas-utils.js';
import { TOWER_TYPES, TOWER_CLASSES } from '../data/tower-defs.js';
import { renderUpgradePanel, handleUpgradeClick } from './upgrade-panel.js';
import { renderHeroSection, renderSelectedHeroInfo, handleHeroSectionClick, handleHeroInfoClick } from './hero-panel.js';

// Hide 1-9 hotkey badges and "[S]"/"[T]" suffixes on touch devices, since
// the iPad has no keyboard. Kids on touch should see clean, uncluttered buttons.
const TOUCH = typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

// Compact tower icon drawing for sidebar buttons
function drawTowerIcon(ctx, x, y, towerKey, color, affordable) {
  ctx.fillStyle = affordable ? color : 'rgba(136,146,176,0.3)';
  switch (towerKey) {
    case 'blaster':
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 1.5, y - 9, 3, 6);
      break;
    case 'railgun':
      ctx.fillRect(x - 5, y - 5, 10, 10);
      ctx.fillRect(x - 1, y - 11, 2, 8);
      break;
    case 'plasma':
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = affordable ? '#cc6600' : 'rgba(100,80,60,0.3)';
      ctx.fillRect(x - 3, y - 8, 6, 5);
      break;
    case 'cryo':
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const px = x + Math.cos(a) * 7;
        const py = y + Math.sin(a) * 7;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      break;
    case 'tesla':
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = affordable ? color : 'rgba(136,146,176,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'support':
      ctx.beginPath();
      ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'missile':
      ctx.fillRect(x - 6, y - 6, 12, 12);
      ctx.fillStyle = affordable ? '#882222' : 'rgba(80,40,40,0.3)';
      ctx.fillRect(x - 4, y - 9, 3, 5);
      ctx.fillRect(x + 1, y - 9, 3, 5);
      break;
    case 'laser':
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = affordable ? 'rgba(255,68,255,0.4)' : 'rgba(100,50,100,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.stroke();
      break;
    case 'quarry':
      ctx.fillRect(x - 5, y - 2, 10, 4);
      ctx.fillRect(x - 1, y - 6, 2, 12);
      ctx.fillStyle = affordable ? '#ffcc44' : 'rgba(136,146,176,0.3)';
      ctx.fillRect(x - 3, y + 3, 6, 2);
      break;
    case 'flak':
      for (let d = 0; d < 5; d++) {
        const a = (d / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'venom':
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.bezierCurveTo(x + 6, y - 1, x + 6, y + 4, x, y + 7);
      ctx.bezierCurveTo(x - 6, y + 4, x - 6, y - 1, x, y - 7);
      ctx.fill();
      break;
    case 'pulse':
      ctx.strokeStyle = affordable ? color : 'rgba(136,146,176,0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = affordable ? color : 'rgba(136,146,176,0.3)';
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'gauss':
      ctx.fillRect(x - 2, y - 8, 4, 16);
      ctx.fillStyle = affordable ? '#6699ff' : 'rgba(80,100,140,0.3)';
      ctx.fillRect(x - 4, y - 3, 8, 2);
      ctx.fillRect(x - 4, y + 1, 8, 2);
      break;
    case 'mortar':
      ctx.fillRect(x - 5, y - 2, 10, 6);
      ctx.fillStyle = affordable ? '#aa8866' : 'rgba(100,80,60,0.3)';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.5);
      ctx.fillRect(-1.5, -9, 3, 8);
      ctx.restore();
      break;
    case 'disruptor':
      ctx.beginPath();
      ctx.arc(x, y - 2, 6, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x - 1, y - 2, 2, 8);
      ctx.fillRect(x - 4, y + 4, 8, 2);
      break;
    case 'particle':
      ctx.strokeStyle = affordable ? color : 'rgba(136,146,176,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 6, y - 6); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 6, y + 3); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 6, y + 3); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = affordable ? color : 'rgba(136,146,176,0.3)';
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
      break;
    default:
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  }
}

// Layout constants
const COLS = 2;
const BTN_W = 104;
const BTN_H = 26;
const GAP_X = 8;
const GAP_Y = 2;
const CLASS_GAP = 8; // Extra gap between class sections
const HEADER_H = 14; // Class header height

const SCROLL_SPEED = 30;
const CONTENT_TOP = 38; // Y where scrollable content starts

/** Build the tower layout with class sections. Returns { sections, totalH } */
function buildLayout(sb, gs) {
  const scrollY = gs.sidebarScrollY || 0;
  const startX = sb.x + 10;
  let y = CONTENT_TOP - scrollY;
  const sections = [];
  let globalIdx = 0;

  for (const cls of TOWER_CLASSES) {
    const allowed = !gs.allowedTowerClasses || gs.allowedTowerClasses.includes(cls.id);
    const towers = cls.towers;

    // Class header
    const headerY = y;
    y += HEADER_H;

    const buttons = [];
    for (let i = 0; i < towers.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      buttons.push({
        key: towers[i],
        x: startX + col * (BTN_W + GAP_X),
        y: y + row * (BTN_H + GAP_Y),
        globalIdx: globalIdx++,
      });
    }

    const rows = Math.ceil(towers.length / COLS);
    y += rows * (BTN_H + GAP_Y);

    sections.push({ cls, headerY, buttons, allowed });
    y += CLASS_GAP;
  }

  // totalH is the unscrolled content height
  const totalH = (y + scrollY) - CONTENT_TOP;
  return { sections, totalH };
}

export function renderTowerPanel(ctx, gs) {
  const sb = config.sidebar;

  // Initialize scroll state
  if (gs.sidebarScrollY == null) gs.sidebarScrollY = 0;

  // Title (fixed, not scrolled)
  drawText(ctx, 'TOWERS', sb.x + sb.w / 2, 16, {
    color: '#8892b0',
    font: 'bold 12px monospace',
    align: 'center',
    baseline: 'middle',
  });

  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sb.x + 12, 32);
  ctx.lineTo(sb.x + sb.w - 12, 32);
  ctx.stroke();

  // Build layout (positions are scroll-adjusted)
  const { sections, totalH } = buildLayout(sb, gs);
  gs._towerGridEndY = CONTENT_TOP + totalH - (gs.sidebarScrollY || 0);
  gs._sidebarContentH = totalH;

  // Clip to sidebar area below title
  ctx.save();
  ctx.beginPath();
  ctx.rect(sb.x, CONTENT_TOP - 4, sb.w, sb.h - CONTENT_TOP + 4);
  ctx.clip();

  for (const section of sections) {
    const { cls, headerY, buttons, allowed } = section;
    const dimmed = !allowed;

    // Skip sections entirely off-screen
    const sectionBottom = buttons.length > 0 ? buttons[buttons.length - 1].y + BTN_H : headerY + HEADER_H;
    if (sectionBottom < CONTENT_TOP - 10 || headerY > sb.h + 10) continue;

    // Class header label + accent line
    const labelAlpha = dimmed ? 0.2 : 1;
    ctx.globalAlpha = labelAlpha;

    // Accent line under header
    ctx.fillStyle = cls.color;
    ctx.fillRect(sb.x + 10, headerY + HEADER_H - 3, sb.w - 20, 1.5);

    drawText(ctx, cls.name, sb.x + 14, headerY + 4, {
      color: cls.color,
      font: 'bold 9px monospace',
    });

    // Tower count badge
    drawText(ctx, `${cls.towers.length}`, sb.x + sb.w - 16, headerY + 4, {
      color: dimmed ? '#333' : '#6a7490',
      font: '8px monospace',
      align: 'right',
    });

    ctx.globalAlpha = 1;

    // Tower buttons
    for (const btn of buttons) {
      // Skip buttons off-screen
      if (btn.y + BTN_H < CONTENT_TOP - 5 || btn.y > sb.h + 5) continue;

      const key = btn.key;
      const def = TOWER_TYPES[key];
      const selected = gs.selectedTowerType === key;
      const canAfford = gs.cash >= def.baseCost && allowed;

      ctx.globalAlpha = dimmed ? 0.25 : 1;

      // Button background
      roundedRect(ctx, btn.x, btn.y, BTN_W, BTN_H, 5,
        selected ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.03)',
        selected ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.06)',
        1
      );

      // Tower icon
      drawTowerIcon(ctx, btn.x + 14, btn.y + BTN_H / 2, key, def.color, canAfford);

      // Name + cost on same line (compact)
      const shortName = def.name.length > 8 ? def.name.substring(0, 7) + '.' : def.name;
      drawText(ctx, shortName, btn.x + 28, btn.y + 7, {
        color: canAfford ? '#e8e8e8' : '#555',
        font: 'bold 8px monospace',
      });

      // Cost
      drawText(ctx, `$${def.baseCost}`, btn.x + 28, btn.y + 17, {
        color: canAfford ? '#ffd700' : '#663300',
        font: '8px monospace',
      });

      // Hotkey badge (first 10 towers) — hide on touch (no keyboard)
      if (btn.globalIdx < 10 && !TOUCH) {
        const hkX = btn.x + BTN_W - 14;
        const hkY = btn.y + 4;
        const hkLabel = btn.globalIdx < 9 ? `${btn.globalIdx + 1}` : '0';
        roundedRect(ctx, hkX, hkY, 12, 12, 2,
          selected ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.06)',
          selected ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.12)',
          1
        );
        drawText(ctx, hkLabel, hkX + 6, hkY + 6, {
          color: selected ? '#00d4ff' : '#8892b0',
          font: 'bold 9px monospace',
          align: 'center',
          baseline: 'middle',
        });
      }

      // Type indicator line at bottom (class color)
      ctx.fillStyle = canAfford ? cls.color : 'rgba(136,146,176,0.15)';
      ctx.fillRect(btn.x + 4, btn.y + BTN_H - 3, BTN_W - 8, 2);

      ctx.globalAlpha = 1;
    }
  }

  // Selected tower info (if a placed tower is selected)
  let bottomY;
  if (gs.selectedTower) {
    renderSelectedTowerInfo(ctx, gs);
    // Estimate bottom from sell button position
    bottomY = (gs._sellBtnY || gs._towerGridEndY || 500) + 30;
  } else if (gs.selectedHero) {
    renderSelectedHeroInfo(ctx, gs);
    bottomY = (gs._heroSellBtnY || gs._towerGridEndY || 500) + 30;
  } else {
    const heroBottom = renderHeroSection(ctx, gs);
    bottomY = heroBottom + 10;
  }

  // Update max scroll based on actual content bottom
  const visibleH = sb.h;
  const overflowPx = bottomY - visibleH;
  if (overflowPx > 0) {
    gs._sidebarMaxScroll = Math.max(gs._sidebarMaxScroll || 0, (gs.sidebarScrollY || 0) + overflowPx + 20);
  }

  ctx.restore();

  // Scroll indicator (fade hints at top/bottom when scrollable)
  const scrollY = gs.sidebarScrollY || 0;
  const maxScroll = gs._sidebarMaxScroll || 0;
  if (scrollY > 0) {
    const grad = ctx.createLinearGradient(sb.x, CONTENT_TOP, sb.x, CONTENT_TOP + 20);
    grad.addColorStop(0, 'rgba(13,13,24,0.9)');
    grad.addColorStop(1, 'rgba(13,13,24,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sb.x, CONTENT_TOP, sb.w, 20);
    drawText(ctx, '▲', sb.x + sb.w / 2, CONTENT_TOP + 6, {
      color: 'rgba(136,146,176,0.4)', font: '8px monospace', align: 'center',
    });
  }
  if (scrollY < maxScroll) {
    const grad = ctx.createLinearGradient(sb.x, sb.h - 20, sb.x, sb.h);
    grad.addColorStop(0, 'rgba(13,13,24,0)');
    grad.addColorStop(1, 'rgba(13,13,24,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(sb.x, sb.h - 20, sb.w, 20);
    drawText(ctx, '▼', sb.x + sb.w / 2, sb.h - 6, {
      color: 'rgba(136,146,176,0.4)', font: '8px monospace', align: 'center',
    });
  }
}

/** Handle sidebar scroll from mouse wheel. Call from game update. */
export function updateSidebarScroll(gs, wheelDeltaY, mouseX) {
  const sb = config.sidebar;
  if (mouseX < sb.x) return; // Only scroll when mouse is over sidebar

  if (wheelDeltaY !== 0) {
    if (gs.sidebarScrollY == null) gs.sidebarScrollY = 0;
    gs.sidebarScrollY += wheelDeltaY > 0 ? SCROLL_SPEED : -SCROLL_SPEED;

    // Use the dynamically computed max scroll from render pass
    const maxScroll = gs._sidebarMaxScroll || 0;
    gs.sidebarScrollY = Math.max(0, Math.min(maxScroll, gs.sidebarScrollY));
  }
}

function renderSelectedTowerInfo(ctx, gs) {
  const sb = config.sidebar;
  const t = gs.selectedTower;
  const towerDef = TOWER_TYPES[t.type];
  let y = (gs._towerGridEndY || 340) + 8;

  // Separator
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sb.x + 12, y);
  ctx.lineTo(sb.x + sb.w - 12, y);
  ctx.stroke();
  y += 12;

  // Selected label
  drawText(ctx, 'SELECTED', sb.x + sb.w / 2, y, {
    color: '#4a5568',
    font: '8px monospace',
    align: 'center',
  });
  y += 14;

  // Tower name
  drawText(ctx, towerDef ? towerDef.name : t.type, sb.x + sb.w / 2, y, {
    color: t.color,
    font: 'bold 11px monospace',
    align: 'center',
  });
  y += 14;

  // Compact stats row
  const statParts = [];
  if (t.type === 'quarry') {
    statParts.push(`INCOME $${t.income || 0}/wave`);
    if (t.bonusCashPct > 0) statParts.push(`+${Math.round(t.bonusCashPct * 100)}% kills`);
  } else {
    if (t.effectiveDamage > 0 || t.damage > 0) {
      const dmg = t.effectiveDamage || t.damage;
      statParts.push(`DMG ${dmg}`);
    }
    if (t.effectiveRange > 0 || t.range > 0) {
      const rng = t.type === 'support' ? t.buffRadius : (t.effectiveRange || t.range);
      statParts.push(`RNG ${rng}`);
    }
    if (t.effectiveFireRate > 0 || t.fireRate > 0) {
      const rate = t.effectiveFireRate || t.fireRate;
      statParts.push(`${(1 / rate).toFixed(1)}/s`);
    }
  }
  if (statParts.length > 0) {
    drawText(ctx, statParts.join(' | '), sb.x + sb.w / 2, y, {
      color: '#6a7490',
      font: '8px monospace',
      align: 'center',
    });
  }

  // Special mechanic stats
  let specialStat = null;
  if (t.dotDps > 0) specialStat = { text: `DOT ${t.dotDps}/s for ${t.dotDuration}s`, color: '#44cc44' };
  else if (t.damageAmp > 0) specialStat = { text: `AMP +${Math.round(t.damageAmp * 100)}% dmg taken`, color: '#44dddd' };
  else if (t.rampRate > 0) specialStat = { text: `RAMP +${t.rampRate}/s (max ${t.maxRamp})`, color: '#ff44ff' };
  else if (t.armorPierce > 0 && t.type !== 'railgun') specialStat = { text: `PIERCE ${t.armorPierce} armor`, color: '#ffaa44' };
  if (specialStat) {
    y += 10;
    drawText(ctx, specialStat.text, sb.x + sb.w / 2, y, {
      color: specialStat.color,
      font: '8px monospace',
      align: 'center',
    });
  }

  // Buffed indicator
  if (t.buffed) {
    y += 12;
    drawText(ctx, '\u2605 BUFFED', sb.x + sb.w / 2, y, {
      color: '#00ff88',
      font: 'bold 8px monospace',
      align: 'center',
    });
  }
  y += 8;

  // --- Upgrade Panel ---
  gs._upgradeStartY = y;
  y = renderUpgradePanel(ctx, gs, y);

  // --- Ability Section (if unlocked) ---
  if (t.abilityUnlocked && towerDef && towerDef.ability) {
    const ability = towerDef.ability;
    y += 4;

    roundedRect(ctx, sb.x + 8, y, sb.w - 16, 52, 5,
      t.abilityActive ? 'rgba(255,200,0,0.08)' : 'rgba(100,120,200,0.06)',
      t.abilityActive ? 'rgba(255,200,0,0.25)' : 'rgba(100,120,200,0.15)',
      1
    );

    drawText(ctx, ability.name, sb.x + sb.w / 2, y + 10, {
      color: t.abilityActive ? '#ffd700' : '#aabbdd',
      font: 'bold 9px monospace',
      align: 'center',
    });

    const desc = ability.description.length > 35 ? ability.description.substring(0, 33) + '..' : ability.description;
    drawText(ctx, desc, sb.x + sb.w / 2, y + 21, {
      color: '#6a7490',
      font: '7px monospace',
      align: 'center',
    });

    const barX = sb.x + 14;
    const barY = y + 28;
    const barW = sb.w - 28;
    const barH = 18;

    if (t.abilityActive) {
      const pct = t.abilityTimer / ability.duration;
      roundedRect(ctx, barX, barY, barW, barH, 3, 'rgba(0,0,0,0.3)', 'rgba(255,200,0,0.3)', 1);
      ctx.fillStyle = 'rgba(255,200,0,0.4)';
      roundedRect(ctx, barX + 1, barY + 1, (barW - 2) * Math.max(0, pct), barH - 2, 2, 'rgba(255,200,0,0.4)');
      drawText(ctx, `ACTIVE ${t.abilityTimer.toFixed(1)}s`, sb.x + sb.w / 2, barY + barH / 2, {
        color: '#ffd700',
        font: 'bold 9px monospace',
        align: 'center',
        baseline: 'middle',
      });
    } else if (t.abilityCooldown > 0) {
      const pct = 1 - t.abilityCooldown / ability.cooldown;
      roundedRect(ctx, barX, barY, barW, barH, 3, 'rgba(0,0,0,0.3)', 'rgba(255,255,255,0.08)', 1);
      ctx.fillStyle = 'rgba(100,120,200,0.3)';
      roundedRect(ctx, barX + 1, barY + 1, (barW - 2) * pct, barH - 2, 2, 'rgba(100,120,200,0.3)');
      drawText(ctx, `CD ${t.abilityCooldown.toFixed(1)}s`, sb.x + sb.w / 2, barY + barH / 2, {
        color: '#6a7490',
        font: '9px monospace',
        align: 'center',
        baseline: 'middle',
      });
    } else {
      roundedRect(ctx, barX, barY, barW, barH, 3,
        'rgba(0,212,255,0.12)', 'rgba(0,212,255,0.35)', 1);
      drawText(ctx, 'ACTIVATE [Q]', sb.x + sb.w / 2, barY + barH / 2, {
        color: '#00d4ff',
        font: 'bold 9px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }

    gs._towerAbilityBtnY = barY;
    gs._towerAbilityBtnH = barH;
    y += 56;
  } else {
    gs._towerAbilityBtnY = null;
  }

  // --- Action Buttons ---
  y += 6;

  // Targeting cycle button
  if (t.targetingMode) {
    gs._targetBtnY = y;
    roundedRect(ctx, sb.x + 10, y, sb.w - 20, 24, 4,
      'rgba(255,255,255,0.03)', 'rgba(255,255,255,0.08)', 1);
    drawText(ctx, TOUCH ? `Target: ${t.targetingMode}` : `Target: ${t.targetingMode} [T]`, sb.x + sb.w / 2, y + 12, {
      color: '#8892b0',
      font: '10px monospace',
      align: 'center',
      baseline: 'middle',
    });
    y += 28;
  }

  // Sell button (hidden in no-sell challenge)
  if (!gs.noSell) {
    gs._sellBtnY = y;
    const sellValue = Math.floor(t.totalSpent * config.sellRefund);
    // Two-tap confirmation so a kid can't accidentally sell a tower —
    // first tap arms the confirm window (2s), second tap within the window
    // commits. Rendered here, gated in index.js panel-click handler.
    const armed = gs._sellConfirmUntil &&
                  performance.now() < gs._sellConfirmUntil &&
                  gs._sellConfirmTower === t;
    if (armed) {
      roundedRect(ctx, sb.x + 10, y, sb.w - 20, 24, 4,
        'rgba(255,68,68,0.35)', 'rgba(255,120,120,0.7)', 2);
      drawText(ctx, `Tap again to SELL ($${sellValue})`, sb.x + sb.w / 2, y + 12, {
        color: '#fff',
        font: 'bold 10px monospace',
        align: 'center',
        baseline: 'middle',
      });
    } else {
      roundedRect(ctx, sb.x + 10, y, sb.w - 20, 24, 4,
        'rgba(255,68,68,0.08)', 'rgba(255,68,68,0.2)', 1);
      drawText(ctx, TOUCH ? `Sell ($${sellValue})` : `Sell ($${sellValue}) [S]`, sb.x + sb.w / 2, y + 12, {
        color: '#ff4444',
        font: '10px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }
  } else {
    gs._sellBtnY = null;
    // Show "NO SELLING" indicator
    drawText(ctx, '🚫 NO SELLING', sb.x + sb.w / 2, y + 12, {
      color: '#664444',
      font: 'bold 9px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }
}

/**
 * Handle clicks on tower panel. Returns action object or null.
 */
export function handleTowerPanelClick(x, y, gs) {
  const sb = config.sidebar;
  if (x < sb.x) return null;

  // Tower button grid (class-grouped)
  const { sections } = buildLayout(sb, gs);

  for (const section of sections) {
    if (!section.allowed) continue; // Can't click locked class towers
    for (const btn of section.buttons) {
      if (x >= btn.x && x <= btn.x + BTN_W && y >= btn.y && y <= btn.y + BTN_H) {
        return { action: 'selectTower', towerType: btn.key };
      }
    }
  }

  // Hero info panel clicks (when a placed hero is selected)
  if (gs.selectedHero) {
    const heroResult = handleHeroInfoClick(x, y, gs);
    if (heroResult) return heroResult;
  }

  // Hero selection grid clicks (when no tower/hero is selected)
  if (!gs.selectedTower && !gs.selectedHero) {
    const heroSectionResult = handleHeroSectionClick(x, y, gs);
    if (heroSectionResult) return heroSectionResult;
  }

  // Selected tower actions
  if (gs.selectedTower) {
    // Upgrade panel clicks
    if (gs._upgradeStartY != null) {
      const upgradeResult = handleUpgradeClick(x, y, gs, gs._upgradeStartY);
      if (upgradeResult) return upgradeResult;
    }

    // Ability button
    if (gs._towerAbilityBtnY != null && x >= sb.x + 14 && x <= sb.x + sb.w - 14) {
      const btnH = gs._towerAbilityBtnH || 18;
      if (y >= gs._towerAbilityBtnY && y <= gs._towerAbilityBtnY + btnH) {
        return { action: 'activateTowerAbility' };
      }
    }

    // Targeting button
    if (gs._targetBtnY != null && x >= sb.x + 10 && x <= sb.x + sb.w - 10) {
      if (y >= gs._targetBtnY && y <= gs._targetBtnY + 24) {
        return { action: 'cycleTargeting' };
      }
    }

    // Sell button
    if (!gs.noSell && gs._sellBtnY != null && x >= sb.x + 10 && x <= sb.x + sb.w - 10) {
      if (y >= gs._sellBtnY && y <= gs._sellBtnY + 24) {
        return { action: 'sellTower' };
      }
    }
  }

  return null;
}

/** Get all tower keys in order (for hotkey mapping). */
export function getAllTowerKeys(gs) {
  const keys = [];
  for (const cls of TOWER_CLASSES) {
    const allowed = !gs.allowedTowerClasses || gs.allowedTowerClasses.includes(cls.id);
    if (allowed) {
      keys.push(...cls.towers);
    }
  }
  return keys;
}
