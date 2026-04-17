/**
 * Renders projectiles — bullets, plasma, missiles, beams, lightning chains.
 */
import { withContext } from '../../../shared/canvas-utils.js';

export function renderProjectiles(ctx, gs) {
  for (const p of gs.projectiles) {
    switch (p.type) {
      case 'bullet': drawBullet(ctx, p); break;
      case 'plasma': drawPlasma(ctx, p); break;
      case 'missile': drawMissile(ctx, p); break;
      default: drawBullet(ctx, p);
    }
  }

  // Lightning chains (instant, visual-only)
  for (const chain of gs.lightningChains) {
    drawLightning(ctx, chain);
  }

  // Beams (continuous)
  for (const beam of gs.beams) {
    drawBeam(ctx, beam);
  }
}

function drawBullet(ctx, p) {
  withContext(ctx, () => {
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.color || '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlasma(ctx, p) {
  withContext(ctx, () => {
    ctx.translate(p.x, p.y);
    // Glow
    ctx.fillStyle = 'rgba(255,136,0,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.fillStyle = p.color || '#ff8800';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMissile(ctx, p) {
  withContext(ctx, () => {
    ctx.translate(p.x, p.y);
    // Rotate toward movement direction
    if (p.angle != null) {
      ctx.rotate(p.angle - Math.PI / 2);
    }
    // Body
    ctx.fillStyle = p.color || '#cc4444';
    ctx.fillRect(-2, -5, 4, 10);
    // Nose
    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.lineTo(0, -8);
    ctx.lineTo(2, -5);
    ctx.closePath();
    ctx.fill();
    // Trail
    ctx.fillStyle = 'rgba(255,200,100,0.4)';
    ctx.beginPath();
    ctx.moveTo(-2, 5);
    ctx.lineTo(0, 10);
    ctx.lineTo(2, 5);
    ctx.closePath();
    ctx.fill();
  });
}

function drawLightning(ctx, chain) {
  const alpha = chain.timer / 0.15; // Fade based on remaining time
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2;

  for (let i = 0; i < chain.points.length - 1; i++) {
    const a = chain.points[i];
    const b = chain.points[i + 1];

    // Jagged lightning between points
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const segments = 4;
    for (let j = 1; j < segments; j++) {
      const t = j / segments;
      const jitter = 8;
      ctx.lineTo(
        a.x + dx * t + (Math.random() - 0.5) * jitter,
        a.y + dy * t + (Math.random() - 0.5) * jitter
      );
    }
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  // Glow at each strike point
  ctx.fillStyle = 'rgba(255,215,0,0.3)';
  for (const pt of chain.points) {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

function drawBeam(ctx, beam) {
  const alpha = beam.timer / 0.1; // Fade based on remaining time
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha * 0.8;

  // Outer glow
  ctx.strokeStyle = 'rgba(255,68,255,0.3)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  // Core beam
  ctx.strokeStyle = beam.color || '#ff44ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(beam.x2, beam.y2);
  ctx.stroke();

  ctx.globalAlpha = 1;
}
