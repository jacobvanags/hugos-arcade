/**
 * Renders heroes — astronaut sprites with per-type weapons.
 */
import { config } from '../config.js';
import { withContext } from '../../../shared/canvas-utils.js';

export function renderHeroes(ctx, gs) {
  for (const hero of gs.heroes) {
    withContext(ctx, () => {
      ctx.translate(hero.x, hero.y);

      // Ability active glow
      if (hero.abilityActive) {
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.008);
        ctx.globalAlpha = 0.15 + pulse * 0.15;
        ctx.fillStyle = hero.color;
        ctx.beginPath();
        ctx.arc(0, 0, config.cellSize * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Base platform (distinct from towers — star shape)
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? config.cellSize * 0.95 : config.cellSize * 0.65;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();

      // Rotate toward target
      if (hero.angle != null) {
        ctx.rotate(hero.angle);
      }

      // Draw hero based on type
      switch (hero.type) {
        case 'astro': drawAstro(ctx, hero); break;
        case 'nova': drawNova(ctx, hero); break;
        case 'volt': drawVolt(ctx, hero); break;
        case 'patch': drawPatch(ctx, hero); break;
        default: drawDefault(ctx, hero);
      }
    });

    // Hero label
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(hero.type.toUpperCase(), hero.x, hero.y + hero.size * 0.7 + 2);
  }
}

// --- Astronaut base body ---
function drawHelmet(ctx, s, color) {
  // Helmet dome
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
  ctx.fill();
  // Visor
  ctx.fillStyle = 'rgba(180,220,255,0.7)';
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, s * 0.35, -Math.PI * 0.7, Math.PI * 0.7);
  ctx.fill();
  // Visor shine
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.arc(-s * 0.1, -s * 0.2, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawBody(ctx, s, color) {
  // Suit body
  ctx.fillStyle = color;
  ctx.fillRect(-s * 0.4, s * 0.2, s * 0.8, s * 0.5);
  // Backpack
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(-s * 0.35, s * 0.25, s * 0.7, s * 0.15);
}

// --- Per-hero drawing ---

function drawAstro(ctx, hero) {
  const s = hero.size;
  drawBody(ctx, s, hero.color);
  drawHelmet(ctx, s, hero.color);
  // Pulse rifle (barrel pointing up = toward target after rotation)
  ctx.fillStyle = '#88ccff';
  ctx.fillRect(-1.5, -s * 0.9, 3, s * 0.5);
  // Muzzle tip
  ctx.fillStyle = '#00d4ff';
  ctx.beginPath();
  ctx.arc(0, -s * 0.9, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawNova(ctx, hero) {
  const s = hero.size;
  drawBody(ctx, s, hero.color);
  drawHelmet(ctx, s, hero.color);
  // Grenade launcher — wide barrel
  ctx.fillStyle = '#cc6633';
  ctx.fillRect(-3, -s * 0.85, 6, s * 0.4);
  // Barrel opening
  ctx.fillStyle = '#442211';
  ctx.beginPath();
  ctx.arc(0, -s * 0.85, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawVolt(ctx, hero) {
  const s = hero.size;
  drawBody(ctx, s, hero.color);
  drawHelmet(ctx, s, hero.color);
  // Arc emitter antenna
  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(0, -s * 1.0);
  ctx.stroke();
  // Spark tip
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, -s * 1.0, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Mini sparks
  const t = Date.now() * 0.01;
  ctx.strokeStyle = 'rgba(255,221,68,0.6)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const a = t + i * 2.1;
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.0);
    ctx.lineTo(Math.cos(a) * 4, -s * 1.0 + Math.sin(a) * 4);
    ctx.stroke();
  }
}

function drawPatch(ctx, hero) {
  const s = hero.size;
  drawBody(ctx, s, hero.color);
  drawHelmet(ctx, s, hero.color);
  // Support dish
  ctx.fillStyle = '#44ff88';
  ctx.beginPath();
  ctx.arc(0, -s * 0.75, 4, Math.PI, Math.PI * 2);
  ctx.fill();
  // Dish stem
  ctx.strokeStyle = '#44ff88';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.55);
  ctx.lineTo(0, -s * 0.75);
  ctx.stroke();
  // Cross emblem on body
  ctx.fillStyle = '#fff';
  ctx.fillRect(-1, s * 0.3, 2, s * 0.25);
  ctx.fillRect(-s * 0.15, s * 0.37, s * 0.3, 2);
}

function drawDefault(ctx, hero) {
  const s = hero.size;
  ctx.fillStyle = hero.color || '#888';
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
}
