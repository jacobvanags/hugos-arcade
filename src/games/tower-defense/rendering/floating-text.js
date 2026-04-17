/**
 * Floating text system — damage numbers, cash popups, stat indicators.
 * Texts float upward and fade out over their duration.
 */

const MAX_TEXTS = 40;
let texts = [];

/**
 * Spawn a floating text at a position.
 * @param {string} text - The text to display
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {object} [opts]
 * @param {string} [opts.color='#ffffff'] - Text color
 * @param {string} [opts.font='bold 11px monospace'] - Font
 * @param {number} [opts.duration=1.0] - Lifetime in seconds
 * @param {number} [opts.vy=-40] - Vertical velocity (negative = upward)
 * @param {number} [opts.vx=0] - Horizontal velocity
 */
export function spawnFloatingText(text, x, y, opts = {}) {
  if (texts.length >= MAX_TEXTS) texts.shift();
  texts.push({
    text,
    x,
    y,
    color: opts.color || '#ffffff',
    font: opts.font || 'bold 11px monospace',
    duration: opts.duration || 1.0,
    age: 0,
    vy: opts.vy ?? -40,
    vx: opts.vx ?? 0,
  });
}

/** Convenience: cash earned popup (green, floats up) */
export function floatCash(x, y, amount) {
  spawnFloatingText(`+$${amount}`, x, y - 10, {
    color: '#44ff88',
    font: 'bold 10px monospace',
    duration: 0.8,
    vy: -35,
  });
}

/** Convenience: cash spent popup (red, floats up) */
export function floatSpend(x, y, amount) {
  spawnFloatingText(`-$${amount}`, x, y - 10, {
    color: '#ff6644',
    font: 'bold 10px monospace',
    duration: 0.8,
    vy: -30,
  });
}

/** Convenience: wave bonus popup (gold, larger, center-ish) */
export function floatWaveBonus(x, y, amount) {
  spawnFloatingText(`+$${amount} Wave Bonus`, x, y, {
    color: '#ffd700',
    font: 'bold 14px monospace',
    duration: 1.5,
    vy: -25,
  });
}

/** Convenience: upgrade stat popup */
export function floatStat(x, y, text, color) {
  spawnFloatingText(text, x, y - 14, {
    color: color || '#00d4ff',
    font: 'bold 9px monospace',
    duration: 1.0,
    vy: -30,
    vx: (Math.random() - 0.5) * 20,
  });
}

/**
 * Update all floating texts.
 * @param {number} dt - Delta time in seconds
 */
export function updateFloatingTexts(dt) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.age += dt;
    t.x += t.vx * dt;
    t.y += t.vy * dt;
    if (t.age >= t.duration) {
      texts.splice(i, 1);
    }
  }
}

/**
 * Render all floating texts.
 * @param {CanvasRenderingContext2D} ctx
 */
export function renderFloatingTexts(ctx) {
  for (const t of texts) {
    const progress = t.age / t.duration;
    // Fade out in last 40% of life
    const alpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
    // Scale up slightly at start
    const scale = progress < 0.1 ? 0.8 + progress * 2 : 1;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(t.x, t.y);
    ctx.scale(scale, scale);
    ctx.font = t.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Shadow for readability
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(t.text, 1, 1);

    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

/** Clear all floating texts (on game reset). */
export function clearFloatingTexts() {
  texts = [];
}
