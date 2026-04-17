/**
 * Renders visual effects — explosions, auras, shield breaks.
 */

export function renderEffects(ctx, gs) {
  // Splash indicators (from projectile hits)
  for (const fx of gs.effects) {
    switch (fx.type) {
      case 'explosion': drawExplosion(ctx, fx); break;
      case 'slow_ring': drawSlowRing(ctx, fx); break;
      case 'heal_pulse': drawHealPulse(ctx, fx); break;
      default: drawExplosion(ctx, fx);
    }
  }

  // Pulse rings (Pulse Emitter)
  if (gs.pulseRings) {
    for (const ring of gs.pulseRings) {
      const progress = 1 - ring.timer / ring.maxTimer;
      const alpha = (1 - progress) * 0.4;
      const r = ring.radius * (0.2 + progress * 0.8);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2 - progress;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // DOT indicators on poisoned enemies
  for (const e of gs.enemies) {
    if (e.hp <= 0) continue;
    if (e.dots && e.dots.length > 0) {
      ctx.fillStyle = '#44cc44';
      ctx.globalAlpha = 0.5 + 0.2 * Math.sin(Date.now() * 0.01);
      ctx.beginPath();
      ctx.arc(e.x, e.y - e.size - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // Damage amp indicator
    if (e.damageAmp > 0 && e.damageAmpDuration > 0) {
      ctx.strokeStyle = '#44dddd';
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.size + 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }
}

export function updateEffects(dt, gs) {
  for (let i = gs.effects.length - 1; i >= 0; i--) {
    const fx = gs.effects[i];
    fx.age += dt;
    fx.progress = fx.age / fx.duration;
    if (fx.progress >= 1) {
      gs.effects.splice(i, 1);
    }
  }
}

export function spawnExplosion(gs, x, y, radius, color = '#ff8800') {
  gs.effects.push({
    type: 'explosion',
    x, y, radius, color,
    age: 0,
    duration: 0.3,
    progress: 0,
  });
}

export function spawnSlowRing(gs, x, y, radius) {
  gs.effects.push({
    type: 'slow_ring',
    x, y, radius,
    age: 0,
    duration: 0.4,
    progress: 0,
  });
}

export function spawnHealPulse(gs, x, y, radius) {
  gs.effects.push({
    type: 'heal_pulse',
    x, y, radius,
    age: 0,
    duration: 0.5,
    progress: 0,
  });
}

// --- Drawing ---

function drawExplosion(ctx, fx) {
  const alpha = 1 - fx.progress;
  const r = fx.radius * (0.3 + fx.progress * 0.7);

  ctx.globalAlpha = alpha * 0.5;
  ctx.fillStyle = fx.color;
  ctx.beginPath();
  ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
  ctx.fill();

  // Bright core
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(fx.x, fx.y, r * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

function drawSlowRing(ctx, fx) {
  const alpha = 1 - fx.progress;
  const r = fx.radius * fx.progress;

  ctx.globalAlpha = alpha * 0.4;
  ctx.strokeStyle = '#00ccff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawHealPulse(ctx, fx) {
  const alpha = 1 - fx.progress;
  const r = fx.radius * (0.5 + fx.progress * 0.5);

  ctx.globalAlpha = alpha * 0.2;
  ctx.fillStyle = '#44ff88';
  ctx.beginPath();
  ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}
