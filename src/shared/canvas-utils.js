/**
 * Common canvas drawing helpers for consistent rendering across all games.
 * @module canvas-utils
 */

/**
 * Clears the entire canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
export function clearCanvas(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
}

/**
 * Fills the entire canvas with a color.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} color
 */
export function fillBackground(ctx, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draws a rounded rectangle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius - Corner radius
 * @param {string} [fill] - Fill color
 * @param {string} [stroke] - Stroke color
 * @param {number} [lineWidth=1] - Stroke width
 */
export function roundedRect(ctx, x, y, width, height, radius, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draws a circle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Center X
 * @param {number} y - Center Y
 * @param {number} radius
 * @param {string} [fill] - Fill color
 * @param {string} [stroke] - Stroke color
 * @param {number} [lineWidth=1]
 */
export function circle(ctx, x, y, radius, fill, stroke, lineWidth = 1) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

/**
 * Draws a line between two points.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {string} color
 * @param {number} [lineWidth=1]
 */
export function line(ctx, x1, y1, x2, y2, color, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/**
 * Draws text with common options.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 * @param {string} [options.color='#ffffff']
 * @param {string} [options.font='16px monospace']
 * @param {CanvasTextAlign} [options.align='left']
 * @param {CanvasTextBaseline} [options.baseline='top']
 * @param {string} [options.stroke] - Stroke color for outlined text
 * @param {number} [options.strokeWidth=2]
 * @param {number} [options.maxWidth] - Max width for text wrapping
 */
export function drawText(ctx, text, x, y, options = {}) {
  const {
    color = '#ffffff',
    font = '16px monospace',
    align = 'left',
    baseline = 'top',
    stroke,
    strokeWidth = 2,
    maxWidth,
  } = options;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.lineJoin = 'round';
    if (maxWidth) ctx.strokeText(text, x, y, maxWidth);
    else ctx.strokeText(text, x, y);
  }
  ctx.fillStyle = color;
  if (maxWidth) ctx.fillText(text, x, y, maxWidth);
  else ctx.fillText(text, x, y);
}

/**
 * Draws a progress bar.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} progress - Value between 0 and 1
 * @param {string} fillColor
 * @param {string} [bgColor='#333333']
 * @param {number} [radius=4]
 */
export function progressBar(ctx, x, y, width, height, progress, fillColor, bgColor = '#333333', radius = 4) {
  roundedRect(ctx, x, y, width, height, radius, bgColor);
  if (progress > 0) {
    const fillWidth = Math.max(radius * 2, width * Math.min(1, progress));
    roundedRect(ctx, x, y, fillWidth, height, radius, fillColor);
  }
}

/**
 * Draws a glow effect around a point.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} radius
 * @param {string} color
 * @param {number} [intensity=0.5]
 */
export function glow(ctx, x, y, radius, color, intensity = 0.5) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color);
  gradient.addColorStop(0.5, color.replace(')', `, ${intensity * 0.5})`).replace('rgb', 'rgba'));
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * Draws a star shape.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} spikes - Number of spikes
 * @param {number} outerRadius
 * @param {number} innerRadius
 * @param {string} [fill]
 * @param {string} [stroke]
 */
export function star(ctx, cx, cy, spikes, outerRadius, innerRadius, fill, stroke) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

/**
 * Creates a radial gradient background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {string} innerColor
 * @param {string} outerColor
 */
export function radialBackground(ctx, width, height, innerColor, outerColor) {
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(1, outerColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Saves context state, runs a function, then restores. Prevents state leaks.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Function} fn
 */
export function withContext(ctx, fn) {
  ctx.save();
  fn(ctx);
  ctx.restore();
}

// --- Tower visual detail helpers ---

/** Thin mechanical surface detail line. */
export function panelLine(ctx, x1, y1, x2, y2, alpha = 0.15) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Tiny rivet/bolt dot. */
export function rivet(ctx, x, y, alpha = 0.3) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

/** Radial highlight/shadow overlay (top-left light source). Assumes ctx is translated to center. */
export function bodyShading(ctx, radius) {
  const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
  grad.addColorStop(0, 'rgba(255,255,255,0.18)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Pulsing aura for max-tier towers. Animated via Date.now(). */
export function aura(ctx, radius, color, intensity = 0.15) {
  const pulse = 0.7 + 0.3 * Math.sin(Date.now() * 0.003);
  const r = radius * (0.9 + pulse * 0.2);
  ctx.globalAlpha = intensity * pulse;
  const grad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
