/**
 * Renders towers — detailed robot sprites with visual variation and upgrade tiers.
 */
import { config } from '../config.js';
import { TOWER_TYPES } from '../data/tower-defs.js';
import { withContext, panelLine, rivet, bodyShading, aura } from '../../../shared/canvas-utils.js';

/** Analyze upgrade state for visual tier info. */
function getVisualTier(tower) {
  const u = tower.upgrades;
  let mainPath = 0, subPath = -1;
  let mainTier = u[0], subTier = 0;
  for (let i = 1; i < 3; i++) {
    if (u[i] > mainTier) {
      subPath = mainPath; subTier = u[mainPath];
      mainPath = i; mainTier = u[i];
    } else if (u[i] > subTier) {
      subPath = i; subTier = u[i];
    }
  }
  return { mainPath, mainTier, subPath, subTier };
}

/** Get path accent color for a tower. */
function getAccentColor(tower, pathIndex) {
  const def = TOWER_TYPES[tower.type];
  if (def.pathAccentColors && pathIndex >= 0) return def.pathAccentColors[pathIndex];
  return tower.color;
}

export function renderTowers(ctx, gs) {
  for (const tower of gs.towers) {
    const v = tower.visual || {};
    const tier = getVisualTier(tower);
    const s = (v.displaySize || tower.size) / 2;
    const col = v.variedColor || tower.color;

    withContext(ctx, () => {
      ctx.translate(tower.x, tower.y);

      // --- Tier 5 aura (drawn before rotation, behind everything) ---
      if (tier.mainTier >= 5) {
        aura(ctx, s * 2.2, getAccentColor(tower, tier.mainPath), 0.18);
      }

      // --- Tier 3+ outer glow ring ---
      if (tier.mainTier >= 3 && tier.mainTier < 5) {
        ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
        ctx.globalAlpha = 0.12 + 0.04 * Math.sin(Date.now() * 0.002);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, s * 1.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Rotate toward current target
      if (tower.angle != null) ctx.rotate(tower.angle);

      // Draw base platform
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.beginPath();
      ctx.arc(0, 0, config.cellSize * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Draw tower based on type
      switch (tower.type) {
        case 'blaster': drawBlaster(ctx, tower, s, col, tier, v); break;
        case 'railgun': drawRailgun(ctx, tower, s, col, tier, v); break;
        case 'plasma': drawPlasma(ctx, tower, s, col, tier, v); break;
        case 'cryo': drawCryo(ctx, tower, s, col, tier, v); break;
        case 'tesla': drawTesla(ctx, tower, s, col, tier, v); break;
        case 'support': drawSupport(ctx, tower, s, col, tier, v); break;
        case 'missile': drawMissile(ctx, tower, s, col, tier, v); break;
        case 'laser': drawLaser(ctx, tower, s, col, tier, v); break;
        case 'quarry': drawQuarry(ctx, tower, s, col, tier, v); break;
        case 'flak': drawFlak(ctx, tower, s, col, tier, v); break;
        case 'venom': drawVenom(ctx, tower, s, col, tier, v); break;
        case 'pulse': drawPulse(ctx, tower, s, col, tier, v); break;
        case 'gauss': drawGauss(ctx, tower, s, col, tier, v); break;
        case 'mortar': drawMortar(ctx, tower, s, col, tier, v); break;
        case 'disruptor': drawDisruptor(ctx, tower, s, col, tier, v); break;
        case 'particle': drawParticle(ctx, tower, s, col, tier, v); break;
        default: drawDefault(ctx, s, col);
      }

      // Sub-path accent dot (tier 1+)
      if (tier.subTier >= 1 && tier.subPath >= 0) {
        const ac = getAccentColor(tower, tier.subPath);
        ctx.fillStyle = ac;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.arc(s * 0.4, s * 0.4, tier.subTier >= 2 ? 2 : 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // Buff indicator (outside withContext since it uses world coords)
    if (tower.buffed) {
      ctx.strokeStyle = 'rgba(0,255,136,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, config.cellSize * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Support aura
    if (tower.type === 'support' && tower.buffRadius) {
      ctx.strokeStyle = 'rgba(0,255,136,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.buffRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Quarry income aura
    if (tower.type === 'quarry' && tower.income > 0) {
      ctx.strokeStyle = 'rgba(212,160,23,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, tower.range || 80, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Ability-active glow
    if (tower.abilityActive) {
      const pulse = 0.3 + 0.15 * Math.sin(Date.now() * 0.006);
      ctx.strokeStyle = `rgba(255,215,0,${pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, config.cellSize * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Pulse emitter range indicator
    if (tower.type === 'pulse') {
      const range = tower.effectiveRange || tower.range;
      ctx.strokeStyle = 'rgba(170,68,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, range, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Render phantom towers (Bullet Hell ability)
  if (gs.phantomTowers) {
    for (const pt of gs.phantomTowers) {
      const pulse = 0.4 + 0.2 * Math.sin(Date.now() * 0.008);
      ctx.globalAlpha = pulse;
      withContext(ctx, () => {
        ctx.translate(pt.x, pt.y);
        if (pt.angle != null) ctx.rotate(pt.angle);
        ctx.fillStyle = pt.color || '#00d4ff';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-1.5, -9, 3, 6);
      });
      ctx.globalAlpha = 1;
    }
  }
}

// ===================== PER-TYPE DRAWING =====================

function drawBlaster(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.6;

  // Body
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
  ctx.fill();
  bodyShading(ctx, bodyR);

  // Tier 3+ reinforced outline
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Panel lines
  panelLine(ctx, -bodyR * 0.5, -bodyR * 0.2, bodyR * 0.5, -bodyR * 0.2);
  panelLine(ctx, -bodyR * 0.3, bodyR * 0.3, bodyR * 0.3, bodyR * 0.3);

  // Rivets (from seed pattern)
  const rp = v.rivetPattern || 0;
  if (rp === 0) { rivet(ctx, -bodyR * 0.4, -bodyR * 0.5); rivet(ctx, bodyR * 0.4, -bodyR * 0.5); }
  else if (rp === 1) { rivet(ctx, -bodyR * 0.5, 0); rivet(ctx, bodyR * 0.5, 0); rivet(ctx, 0, bodyR * 0.4); }
  else { rivet(ctx, -bodyR * 0.3, -bodyR * 0.4); rivet(ctx, bodyR * 0.3, -bodyR * 0.4); rivet(ctx, 0, bodyR * 0.5); }

  // Barrel(s)
  const bw = mt >= 3 ? 3 : 2;
  if (mt >= 5) {
    // Triple gatling barrel
    ctx.fillStyle = col;
    ctx.fillRect(-4, -s * 1.1, 2.5, s * 0.9);
    ctx.fillRect(-0.8, -s * 1.2, 2.5, s * 1.0);
    ctx.fillRect(2, -s * 1.1, 2.5, s * 0.9);
    // Center line
    panelLine(ctx, 0.5, -s * 1.2, 0.5, -s * 0.3, 0.2);
  } else if (mt >= 3) {
    // Dual barrel
    ctx.fillStyle = col;
    ctx.fillRect(-3.5, -s * 1.0, bw, s * 0.8);
    ctx.fillRect(1.5, -s * 1.0, bw, s * 0.8);
  } else {
    // Single barrel
    ctx.fillStyle = col;
    ctx.fillRect(-bw / 2, -s, bw + (mt >= 1 ? 1 : 0), s);
    panelLine(ctx, 0, -s, 0, -s * 0.2, 0.12);
  }

  // Tier 1+ glow ring
  if (mt >= 1 && mt < 5) {
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.1 + mt * 0.02;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Antenna (from seed)
  if (v.hasAntenna) {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(bodyR * 0.3, bodyR * 0.1);
    ctx.lineTo(bodyR * 0.6, -bodyR * 0.6);
    ctx.stroke();
    rivet(ctx, bodyR * 0.6, -bodyR * 0.6, 0.4);
  }

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(-bodyR * 0.2, -bodyR * 0.3, bodyR * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawRailgun(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bw = s * 0.45;
  const bh = s * 0.45;

  // Chamfered body (octagon-ish)
  const cx = bw * 0.7, cy = bh * 0.7, ch = bw * 0.25;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-cx + ch, -cy);
  ctx.lineTo(cx - ch, -cy);
  ctx.lineTo(cx, -cy + ch);
  ctx.lineTo(cx, cy - ch);
  ctx.lineTo(cx - ch, cy);
  ctx.lineTo(-cx + ch, cy);
  ctx.lineTo(-cx, cy - ch);
  ctx.lineTo(-cx, -cy + ch);
  ctx.closePath();
  ctx.fill();

  // Body shading overlay
  const grad = ctx.createRadialGradient(-bw * 0.2, -bh * 0.2, 0, 0, 0, bw);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Tier 3+ reinforced outline
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Panel line
  panelLine(ctx, -bw * 0.5, 0, bw * 0.5, 0);

  // Rivets
  rivet(ctx, -bw * 0.4, -bh * 0.3);
  rivet(ctx, bw * 0.4, -bh * 0.3);

  // Barrel with coil segments
  const barrelLen = s * (mt >= 1 ? 1.3 : 1.1);
  const barrelW = mt >= 3 ? 2.5 : 2;
  ctx.fillStyle = '#992222';
  ctx.fillRect(-barrelW / 2, -barrelLen, barrelW, barrelLen);
  panelLine(ctx, 0, -barrelLen, 0, 0, 0.1);

  // Rail coil marks
  const coils = mt >= 3 ? 4 : 2;
  for (let i = 0; i < coils; i++) {
    const cy2 = -barrelLen + (barrelLen / (coils + 1)) * (i + 1);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-barrelW, cy2);
    ctx.lineTo(barrelW, cy2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Scope (from seed)
  if (v.hasVent || mt >= 1) {
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(barrelW + 0.5, -barrelLen * 0.7, 2, 3);
  }

  // Muzzle flash
  ctx.fillStyle = mt >= 5 ? getAccentColor(tower, tier.mainPath) : col;
  ctx.globalAlpha = mt >= 5 ? 0.6 : 0.4;
  ctx.fillRect(-3.5, -barrelLen - 1, 7, 2);
  ctx.globalAlpha = 1;

  // Tier 5: energy charge at muzzle
  if (mt >= 5) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
    ctx.fillStyle = getAccentColor(tower, tier.mainPath);
    ctx.globalAlpha = 0.3 * pulse;
    ctx.beginPath();
    ctx.arc(0, -barrelLen, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.arc(-bw * 0.2, -bh * 0.2, bw * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlasma(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.7;

  // Body circle with gradient
  const grad = ctx.createRadialGradient(-bodyR * 0.2, -bodyR * 0.2, 0, 0, 0, bodyR);
  grad.addColorStop(0, col);
  grad.addColorStop(1, '#663300');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
  ctx.fill();

  // Tier 3+ outer ring
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Heat lines
  ctx.strokeStyle = 'rgba(255,200,100,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR * 0.5, -0.8, 0.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, bodyR * 0.4, 1.5, 2.8);
  ctx.stroke();

  // Tier 5: molten cracks
  if (mt >= 5) {
    ctx.strokeStyle = '#ff4400';
    ctx.globalAlpha = 0.35 + 0.1 * Math.sin(Date.now() * 0.004);
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-bodyR * 0.3, -bodyR * 0.1);
    ctx.lineTo(bodyR * 0.1, bodyR * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bodyR * 0.2, -bodyR * 0.3);
    ctx.lineTo(-bodyR * 0.1, bodyR * 0.2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Vent slits
  if (v.hasVent) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-bodyR * 0.8, -bodyR * 0.15, 2, bodyR * 0.3);
    ctx.fillRect(bodyR * 0.6, -bodyR * 0.15, 2, bodyR * 0.3);
  }

  // Barrel (trapezoid shape)
  const bw = mt >= 3 ? 4.5 : 3.5;
  const bwTop = bw * 0.6;
  ctx.fillStyle = '#bb5500';
  ctx.beginPath();
  ctx.moveTo(-bw / 2, -bodyR * 0.2);
  ctx.lineTo(-bwTop / 2, -s * 0.95);
  ctx.lineTo(bwTop / 2, -s * 0.95);
  ctx.lineTo(bw / 2, -bodyR * 0.2);
  ctx.closePath();
  ctx.fill();

  // Muzzle glow
  const glowR = mt >= 3 ? 5 : 3.5;
  const glowAlpha = mt >= 5 ? 0.5 : 0.3;
  ctx.fillStyle = col;
  ctx.globalAlpha = glowAlpha + 0.1 * Math.sin(Date.now() * 0.004);
  ctx.beginPath();
  ctx.arc(0, -s * 0.95, glowR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Rivets
  rivet(ctx, -bodyR * 0.45, bodyR * 0.2);
  rivet(ctx, bodyR * 0.45, bodyR * 0.2);
}

function drawCryo(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const hexR = s * 0.6;

  // Hexagonal body with frost gradient
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, hexR);
  grad.addColorStop(0, '#eeffff');
  grad.addColorStop(0.4, col);
  grad.addColorStop(1, '#004466');
  ctx.fillStyle = grad;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
    const hx = Math.cos(angle) * hexR;
    const hy = Math.sin(angle) * hexR;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fill();

  // Frost rim
  ctx.strokeStyle = 'rgba(200,240,255,0.25)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Tier 3+ outer frost ring
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, hexR + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Panel line vertex-to-vertex
  const a1 = (0 / 6) * Math.PI * 2 - Math.PI / 6;
  const a2 = (3 / 6) * Math.PI * 2 - Math.PI / 6;
  panelLine(ctx, Math.cos(a1) * hexR * 0.8, Math.sin(a1) * hexR * 0.8,
    Math.cos(a2) * hexR * 0.8, Math.sin(a2) * hexR * 0.8, 0.12);

  // Crystal accent inside
  ctx.fillStyle = 'rgba(200,240,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(0, -hexR * 0.3);
  ctx.lineTo(hexR * 0.15, 0);
  ctx.lineTo(0, hexR * 0.3);
  ctx.lineTo(-hexR * 0.15, 0);
  ctx.closePath();
  ctx.fill();

  // Nozzle(s)
  const nozzles = mt >= 5 ? 3 : mt >= 3 ? 2 : 1;
  const nozzleSpacing = nozzles > 1 ? 3 : 0;
  for (let n = 0; n < nozzles; n++) {
    const nx = (n - (nozzles - 1) / 2) * nozzleSpacing;
    ctx.fillStyle = '#0099cc';
    ctx.fillRect(nx - 1.5, -s * 0.9, 3, s * 0.5);
  }

  // Condensation particles near nozzle
  if (mt >= 1) {
    const numDots = mt >= 3 ? 4 : 2;
    for (let d = 0; d < numDots; d++) {
      const dx = (v.accentX || 0) + (d - numDots / 2) * 3;
      const dy = -s * 0.95 - d * 1.5;
      ctx.fillStyle = 'rgba(200,240,255,0.2)';
      ctx.beginPath();
      ctx.arc(dx, dy, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Tier 5: ice crystal on top
  if (mt >= 5) {
    ctx.strokeStyle = 'rgba(200,240,255,0.4)';
    ctx.lineWidth = 0.6;
    // Simple snowflake: 3 crossed lines
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * hexR * 0.3, -s * 0.7 + Math.sin(a) * hexR * 0.3);
      ctx.lineTo(Math.cos(a + Math.PI) * hexR * 0.3, -s * 0.7 + Math.sin(a + Math.PI) * hexR * 0.3);
      ctx.stroke();
    }
  }
}

function drawTesla(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const coreR = s * 0.5;

  // Core circle with metallic gradient
  const grad = ctx.createRadialGradient(-coreR * 0.2, -coreR * 0.2, 0, 0, 0, coreR);
  grad.addColorStop(0, '#fff8dd');
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, '#665500');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Coil ring(s) — segmented dashed
  const rings = mt >= 3 ? 3 : mt >= 1 ? 2 : 1;
  for (let r = 0; r < rings; r++) {
    const ringR = s * (0.7 + r * 0.18);
    ctx.strokeStyle = r === 0 ? '#ccaa00' : 'rgba(255,215,0,0.3)';
    ctx.lineWidth = r === 0 ? 1.5 : 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Conductive strips to outer ring
  ctx.strokeStyle = 'rgba(255,215,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(coreR, 0); ctx.lineTo(s * 0.7, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-coreR, 0); ctx.lineTo(-s * 0.7, 0); ctx.stroke();

  // Capacitor rectangles
  ctx.fillStyle = 'rgba(255,215,0,0.2)';
  ctx.fillRect(coreR + 1, -1.5, 2, 3);
  ctx.fillRect(-coreR - 3, -1.5, 2, 3);

  // Spark node — lightning bolt shape
  const sparkY = -coreR * 0.8;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-1.5, sparkY - 3);
  ctx.lineTo(0.5, sparkY - 0.5);
  ctx.lineTo(-0.5, sparkY - 0.5);
  ctx.lineTo(1.5, sparkY + 3);
  ctx.lineTo(-0.5, sparkY + 0.5);
  ctx.lineTo(0.5, sparkY + 0.5);
  ctx.closePath();
  ctx.fill();

  // Tier 3+: mini arcs between rings
  if (mt >= 3) {
    const t = Date.now() * 0.01;
    ctx.strokeStyle = '#ffd700';
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
      const a = t + i * 2.1;
      const r1 = s * 0.7, r2 = s * 0.88;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a + 0.15) * ((r1 + r2) / 2), Math.sin(a + 0.15) * ((r1 + r2) / 2) + 1);
      ctx.lineTo(Math.cos(a + 0.05) * r2, Math.sin(a + 0.05) * r2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Tier 5: energy field
  if (mt >= 5) {
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.004);
    ctx.strokeStyle = '#ffd700';
    ctx.globalAlpha = 0.15 * pulse;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Rivets
  rivet(ctx, coreR * 0.3, coreR * 0.3);
  rivet(ctx, -coreR * 0.3, coreR * 0.3);
}

function drawSupport(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const ds = s * 0.6;

  // Diamond body with tech gradient
  const grad = ctx.createLinearGradient(0, -ds, 0, ds);
  grad.addColorStop(0, '#88ffbb');
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, '#004422');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -ds);
  ctx.lineTo(ds, 0);
  ctx.lineTo(0, ds);
  ctx.lineTo(-ds, 0);
  ctx.closePath();
  ctx.fill();

  // Tier 3+ border
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Scanner line
  panelLine(ctx, -ds * 0.7, 0, ds * 0.7, 0, 0.12);

  // Solar panel details on side vertices
  ctx.fillStyle = 'rgba(0,255,136,0.15)';
  ctx.fillRect(ds * 0.5, -2, 3, 4);
  ctx.fillRect(-ds * 0.5 - 3, -2, 3, 4);

  // Center light with glow
  const lightAlpha = mt >= 1 ? 0.6 + 0.2 * Math.sin(Date.now() * 0.003) : 0.8;
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = lightAlpha;
  ctx.beginPath();
  ctx.arc(0, 0, mt >= 3 ? 3.5 : 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Glow around center light
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Signal wave arcs
  const waves = mt >= 3 ? 3 : 2;
  for (let w = 0; w < waves; w++) {
    const wr = 4 + w * 3;
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.12 - w * 0.03;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -ds * 0.3, wr, -0.8, 0.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Tier 5: satellite dish on top
  if (mt >= 5) {
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, -ds - 2, 3.5, Math.PI, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -ds - 2);
    ctx.lineTo(0, -ds + 1);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Rivets
  rivet(ctx, 0, -ds * 0.5);
  if (v.hasAntenna) rivet(ctx, ds * 0.3, -ds * 0.3);
}

function drawMissile(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bw = s * 0.55;
  const bh = s * 0.55;

  // Box body with armored plate inset
  ctx.fillStyle = col;
  ctx.fillRect(-bw, -bh, bw * 2, bh * 2);

  // Armor plate inset
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-bw + 1.5, -bh + 1.5, bw * 2 - 3, bh * 2 - 3);

  // Body shading
  const grad = ctx.createLinearGradient(-bw, -bh, bw, bh);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(-bw, -bh, bw * 2, bh * 2);

  // Tier 3+ blast shield (extended bottom plate)
  if (mt >= 3) {
    ctx.fillStyle = getAccentColor(tower, tier.mainPath);
    ctx.globalAlpha = 0.25;
    ctx.fillRect(-bw - 1, bh - 1, bw * 2 + 2, 3);
    ctx.globalAlpha = 1;
  }

  // Warning stripe
  ctx.strokeStyle = 'rgba(255,200,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-bw + 2, bh - 2);
  ctx.lineTo(bw - 2, -bh + 2);
  ctx.stroke();

  // Corner rivets
  rivet(ctx, -bw + 2, -bh + 2);
  rivet(ctx, bw - 2, -bh + 2);
  rivet(ctx, -bw + 2, bh - 2);
  rivet(ctx, bw - 2, bh - 2);

  // Missile tubes
  const tubes = mt >= 5 ? 3 : mt >= 3 ? 2 : 1;
  const tubeW = bw * 0.35;
  const tubeSpacing = tubes > 1 ? bw * 0.55 : 0;

  for (let t = 0; t < tubes; t++) {
    const tx = (t - (tubes - 1) / 2) * tubeSpacing;
    // Left tube
    ctx.fillStyle = '#661111';
    ctx.fillRect(tx - tubeW - 1, -s * 0.85, tubeW, s * 0.55);
    // Right tube
    ctx.fillRect(tx + 1, -s * 0.85, tubeW, s * 0.55);

    // Dark interior (depth)
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(tx - tubeW, -s * 0.85, tubeW - 1, 2);
    ctx.fillRect(tx + 1.5, -s * 0.85, tubeW - 1, 2);

    // Tier 1+: missile tips visible inside
    if (mt >= 1) {
      ctx.fillStyle = '#cc6666';
      ctx.beginPath();
      ctx.moveTo(tx - tubeW / 2 - 0.5, -s * 0.85);
      ctx.lineTo(tx - tubeW / 2 + 0.5, -s * 0.95);
      ctx.lineTo(tx - tubeW / 2 + 1.5, -s * 0.85);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx + tubeW / 2 - 0.5, -s * 0.85);
      ctx.lineTo(tx + tubeW / 2 + 0.5, -s * 0.95);
      ctx.lineTo(tx + tubeW / 2 + 1.5, -s * 0.85);
      ctx.fill();
    }
  }

  // Exhaust vent at bottom
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-2, bh - 1.5, 4, 2);

  // Tier 5: glow strips on armor
  if (mt >= 5) {
    const ac = getAccentColor(tower, tier.mainPath);
    ctx.fillStyle = ac;
    ctx.globalAlpha = 0.2 + 0.08 * Math.sin(Date.now() * 0.003);
    ctx.fillRect(-bw, -bh, 1.5, bh * 2);
    ctx.fillRect(bw - 1.5, -bh, 1.5, bh * 2);
    ctx.globalAlpha = 1;
  }
}

function drawLaser(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.5;

  // Chrome gradient body
  const grad = ctx.createRadialGradient(-bodyR * 0.2, -bodyR * 0.2, 0, 0, 0, bodyR);
  grad.addColorStop(0, '#ffccff');
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, '#550055');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
  ctx.fill();

  // Tier 3+ outline
  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Stabilizer fins
  ctx.fillStyle = 'rgba(255,68,255,0.2)';
  ctx.beginPath();
  ctx.moveTo(-bodyR * 0.6, bodyR * 0.2);
  ctx.lineTo(-bodyR * 1.1, bodyR * 0.6);
  ctx.lineTo(-bodyR * 0.6, bodyR * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bodyR * 0.6, bodyR * 0.2);
  ctx.lineTo(bodyR * 1.1, bodyR * 0.6);
  ctx.lineTo(bodyR * 0.6, bodyR * 0.6);
  ctx.closePath();
  ctx.fill();

  // Lens emitter(s) — trapezoid shape
  const lenses = mt >= 5 ? 3 : mt >= 3 ? 2 : 1;
  const lensSpacing = lenses > 1 ? 3 : 0;
  for (let l = 0; l < lenses; l++) {
    const lx = (l - (lenses - 1) / 2) * lensSpacing;
    ctx.fillStyle = '#ff88ff';
    ctx.beginPath();
    ctx.moveTo(lx - 2, -bodyR * 0.4);
    ctx.lineTo(lx - 1, -s * 0.85);
    ctx.lineTo(lx + 1, -s * 0.85);
    ctx.lineTo(lx + 2, -bodyR * 0.4);
    ctx.closePath();
    ctx.fill();
  }

  // Tier 1+ focusing ring
  if (mt >= 1) {
    ctx.strokeStyle = '#ff88ff';
    ctx.globalAlpha = 0.2;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, -s * 0.85, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Glow ring (dashed)
  ctx.strokeStyle = 'rgba(255,68,255,0.25)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(0, 0, bodyR + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crystal core dot
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Tier 3+ orbiting dot
  if (mt >= 3) {
    const orbitA = Date.now() * 0.003;
    const orbitR = bodyR + 3;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(Math.cos(orbitA) * orbitR, Math.sin(orbitA) * orbitR, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawDefault(ctx, s, col) {
  ctx.fillStyle = col || '#888';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
  bodyShading(ctx, s * 0.6);
}

// ==================== NEW TOWER DRAWING ====================

function drawQuarry(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bw = s * 0.55;

  // Rocky base
  const grad = ctx.createRadialGradient(-bw * 0.2, -bw * 0.2, 0, 0, 0, bw);
  grad.addColorStop(0, '#e8c84a');
  grad.addColorStop(0.6, col);
  grad.addColorStop(1, '#6b5010');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-bw, bw * 0.3);
  ctx.lineTo(-bw * 0.6, -bw);
  ctx.lineTo(bw * 0.3, -bw * 0.8);
  ctx.lineTo(bw, -bw * 0.2);
  ctx.lineTo(bw * 0.7, bw);
  ctx.lineTo(-bw * 0.4, bw * 0.8);
  ctx.closePath();
  ctx.fill();

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Pickaxe
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-bw * 0.3, bw * 0.2);
  ctx.lineTo(bw * 0.2, -bw * 0.4);
  ctx.stroke();
  ctx.fillStyle = '#888';
  ctx.fillRect(bw * 0.05, -bw * 0.55, bw * 0.4, 2.5);

  // Gem sparkles
  const gems = mt >= 3 ? 3 : mt >= 1 ? 2 : 1;
  for (let g = 0; g < gems; g++) {
    const gx = (v.accentX || 0) * bw * 0.3 + g * bw * 0.25 - bw * 0.2;
    const gy = bw * 0.1 + g * bw * 0.15;
    ctx.fillStyle = g === 0 ? '#ffd700' : g === 1 ? '#44ff88' : '#88ddff';
    ctx.globalAlpha = 0.6 + 0.2 * Math.sin(Date.now() * 0.003 + g);
    ctx.beginPath();
    ctx.arc(gx, gy, mt >= 3 ? 2 : 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Income indicator ($)
  ctx.fillStyle = '#ffd700';
  ctx.globalAlpha = 0.5;
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('$', 0, bw * 0.5);
  ctx.globalAlpha = 1;
}

function drawFlak(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.5;

  // Flat octagonal base
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 8;
    const px = Math.cos(a) * bodyR;
    const py = Math.sin(a) * bodyR;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  bodyShading(ctx, bodyR);

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Multiple small barrels (gatling-style)
  const barrels = mt >= 5 ? 4 : mt >= 3 ? 3 : 2;
  const spread = mt >= 3 ? 2.5 : 2;
  for (let b = 0; b < barrels; b++) {
    const bx = (b - (barrels - 1) / 2) * spread;
    ctx.fillStyle = '#667744';
    ctx.fillRect(bx - 0.8, -s * 0.9, 1.6, s * 0.6);
  }

  // Ammo belt detail
  panelLine(ctx, -bodyR * 0.5, 0, bodyR * 0.5, 0);
  rivet(ctx, -bodyR * 0.3, bodyR * 0.2);
  rivet(ctx, bodyR * 0.3, bodyR * 0.2);
}

function drawVenom(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.55;

  // Organic bulbous body
  const grad = ctx.createRadialGradient(-bodyR * 0.15, -bodyR * 0.15, 0, 0, 0, bodyR);
  grad.addColorStop(0, '#88ff88');
  grad.addColorStop(0.4, col);
  grad.addColorStop(1, '#114411');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR, 0, Math.PI * 2);
  ctx.fill();

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Venom sac bulges
  ctx.fillStyle = 'rgba(68,204,68,0.25)';
  ctx.beginPath();
  ctx.arc(-bodyR * 0.4, bodyR * 0.1, bodyR * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(bodyR * 0.3, bodyR * 0.2, bodyR * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Spitter nozzle
  const nozzles = mt >= 5 ? 2 : 1;
  for (let n = 0; n < nozzles; n++) {
    const nx = (n - (nozzles - 1) / 2) * 3;
    ctx.fillStyle = '#228822';
    ctx.beginPath();
    ctx.moveTo(nx - 2, -bodyR * 0.3);
    ctx.lineTo(nx, -s * 0.9);
    ctx.lineTo(nx + 2, -bodyR * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  // Drip effect
  if (mt >= 1) {
    const drip = (Date.now() * 0.002) % 1;
    ctx.fillStyle = '#44cc44';
    ctx.globalAlpha = 0.4 * (1 - drip);
    ctx.beginPath();
    ctx.arc(0, -s * 0.9 - drip * 3, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPulse(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const coreR = s * 0.4;

  // Core sphere
  const grad = ctx.createRadialGradient(-coreR * 0.2, -coreR * 0.2, 0, 0, 0, coreR);
  grad.addColorStop(0, '#ddaaff');
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, '#440066');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();

  // Pulse rings (animated)
  const rings = mt >= 3 ? 3 : 2;
  for (let r = 0; r < rings; r++) {
    const ringR = s * (0.55 + r * 0.2);
    const pulse = Math.sin(Date.now() * 0.004 + r * 1.5);
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.15 + 0.08 * pulse;
    ctx.lineWidth = mt >= 3 ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Energy nodes at cardinal points
  const nodes = mt >= 5 ? 4 : mt >= 3 ? 3 : 2;
  for (let n = 0; n < nodes; n++) {
    const a = (n / nodes) * Math.PI * 2 + Date.now() * 0.001;
    const nr = s * 0.55;
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * nr, Math.sin(a) * nr, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, coreR + 1, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGauss(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bw = s * 0.4;
  const bh = s * 0.4;

  // Sleek angular body
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(-bw, bh * 0.5);
  ctx.lineTo(-bw * 0.8, -bh);
  ctx.lineTo(bw * 0.8, -bh);
  ctx.lineTo(bw, bh * 0.5);
  ctx.lineTo(0, bh);
  ctx.closePath();
  ctx.fill();

  const grad = ctx.createLinearGradient(-bw, -bh, bw, bh);
  grad.addColorStop(0, 'rgba(255,255,255,0.12)');
  grad.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = grad;
  ctx.fill();

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Long rail barrel
  const barrelLen = s * (mt >= 3 ? 1.4 : 1.2);
  const barrelW = mt >= 5 ? 3 : 2;
  ctx.fillStyle = '#3366aa';
  ctx.fillRect(-barrelW / 2, -barrelLen, barrelW, barrelLen);

  // Magnetic coils on barrel
  const coils = mt >= 3 ? 5 : 3;
  for (let c = 0; c < coils; c++) {
    const cy = -barrelLen + (barrelLen / (coils + 1)) * (c + 1);
    ctx.strokeStyle = '#6699ff';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-barrelW - 1, cy);
    ctx.lineTo(barrelW + 1, cy);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Muzzle charge
  if (mt >= 1) {
    ctx.fillStyle = '#88bbff';
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(Date.now() * 0.005);
    ctx.beginPath();
    ctx.arc(0, -barrelLen, mt >= 3 ? 3 : 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  rivet(ctx, -bw * 0.4, 0);
  rivet(ctx, bw * 0.4, 0);
}

function drawMortar(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bw = s * 0.6;
  const bh = s * 0.45;

  // Armored box base
  ctx.fillStyle = col;
  ctx.fillRect(-bw, -bh, bw * 2, bh * 2);

  const grad = ctx.createLinearGradient(-bw, -bh, bw, bh);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = grad;
  ctx.fillRect(-bw, -bh, bw * 2, bh * 2);

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.strokeRect(-bw, -bh, bw * 2, bh * 2);
  }

  // Angled barrel (mortar tube)
  ctx.save();
  ctx.rotate(-0.4);
  const tubeW = mt >= 5 ? 4.5 : 3.5;
  const tubeLen = s * (mt >= 3 ? 1.1 : 0.9);
  ctx.fillStyle = '#664422';
  ctx.fillRect(-tubeW / 2, -tubeLen, tubeW, tubeLen);

  // Muzzle opening
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(0, -tubeLen, tubeW / 2 + 0.5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shell in chamber (from seed)
  if (v.hasVent && mt >= 1) {
    ctx.fillStyle = '#cc8844';
    ctx.beginPath();
    ctx.arc(bw * 0.3, -bh * 0.4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ammo stacked on side
  if (mt >= 1) {
    for (let a = 0; a < (mt >= 3 ? 3 : 2); a++) {
      ctx.fillStyle = '#aa7744';
      ctx.beginPath();
      ctx.arc(-bw + 3 + a * 3, bh - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  rivet(ctx, -bw + 2, -bh + 2);
  rivet(ctx, bw - 2, -bh + 2);
}

function drawDisruptor(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.5;

  // Dish/antenna shape
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(0, 0, bodyR, Math.PI * 0.7, Math.PI * 2.3);
  ctx.lineTo(0, bodyR * 0.6);
  ctx.closePath();
  ctx.fill();

  const grad = ctx.createRadialGradient(0, -bodyR * 0.3, 0, 0, 0, bodyR);
  grad.addColorStop(0, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad;
  ctx.fill();

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, bodyR + 1, Math.PI * 0.7, Math.PI * 2.3);
    ctx.stroke();
  }

  // Antenna mast
  ctx.fillStyle = '#33aaaa';
  ctx.fillRect(-1, -s * 0.8, 2, s * 0.6);

  // Signal emitter tip
  ctx.fillStyle = '#88ffee';
  ctx.globalAlpha = 0.6 + 0.2 * Math.sin(Date.now() * 0.004);
  ctx.beginPath();
  ctx.arc(0, -s * 0.8, mt >= 3 ? 3 : 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Signal arcs
  if (mt >= 1) {
    const waves = mt >= 5 ? 3 : 2;
    for (let w = 0; w < waves; w++) {
      ctx.strokeStyle = col;
      ctx.globalAlpha = 0.15 - w * 0.04;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(0, -s * 0.8, 4 + w * 3, -1.2, 1.2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Base support
  ctx.fillStyle = '#226666';
  ctx.fillRect(-bodyR * 0.5, bodyR * 0.3, bodyR, 2);
}

function drawParticle(ctx, tower, s, col, tier, v) {
  const mt = tier.mainTier;
  const bodyR = s * 0.45;

  // Compact crystal body
  const grad = ctx.createRadialGradient(-bodyR * 0.2, -bodyR * 0.2, 0, 0, 0, bodyR);
  grad.addColorStop(0, '#ffaacc');
  grad.addColorStop(0.5, col);
  grad.addColorStop(1, '#552233');
  ctx.fillStyle = grad;

  // Pointed crystal shape
  ctx.beginPath();
  ctx.moveTo(0, -bodyR);
  ctx.lineTo(bodyR * 0.8, -bodyR * 0.2);
  ctx.lineTo(bodyR * 0.6, bodyR * 0.6);
  ctx.lineTo(-bodyR * 0.6, bodyR * 0.6);
  ctx.lineTo(-bodyR * 0.8, -bodyR * 0.2);
  ctx.closePath();
  ctx.fill();

  if (mt >= 3) {
    ctx.strokeStyle = getAccentColor(tower, tier.mainPath);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Emitter lens
  ctx.fillStyle = '#ff88aa';
  ctx.beginPath();
  ctx.arc(0, -bodyR * 0.3, mt >= 3 ? 3 : 2, 0, Math.PI * 2);
  ctx.fill();

  // Ramp indicator — glowing intensity lines
  if (mt >= 1) {
    const rampPct = tower._rampBonus / (tower.maxRamp || 1);
    const lines = Math.floor(rampPct * 4) + 1;
    for (let l = 0; l < lines; l++) {
      const ly = bodyR * 0.1 + l * 2.5;
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.2 + rampPct * 0.4;
      ctx.fillRect(-bodyR * 0.4, ly, bodyR * 0.8, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Focus beam tip glow
  const glowIntensity = tower._rampBonus ? tower._rampBonus / (tower.maxRamp || 30) : 0;
  ctx.fillStyle = '#ff4466';
  ctx.globalAlpha = 0.2 + glowIntensity * 0.5;
  ctx.beginPath();
  ctx.arc(0, -bodyR - 2, 2 + glowIntensity * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  panelLine(ctx, -bodyR * 0.5, 0, bodyR * 0.5, 0, 0.1);
}
