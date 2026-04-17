import { config } from '../config.js';

/**
 * Renders player bullets and enemy projectiles.
 */
export function renderProjectiles(ctx, projectiles) {
  for (const p of projectiles) {
    ctx.save();
    ctx.translate(p.x, p.y);

    if (p.fromEnemy) {
      renderEnemyProjectile(ctx, p);
    } else {
      renderPlayerBullet(ctx, p);
    }

    ctx.restore();
  }
}

function renderPlayerBullet(ctx, p) {
  const angle = Math.atan2(p.vy, p.vx);
  ctx.rotate(angle);

  const color = p.color || '#FFD700';
  const trailColor = p.trailColor || 'rgba(255,215,0,0.3)';

  if (p.explosive) {
    // Launcher round — larger, glowing
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = trailColor;
    ctx.beginPath();
    ctx.arc(-p.width / 2, 0, p.width / 2 + 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Standard bullet shape
    ctx.fillStyle = color;
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
    // Glow trail
    ctx.fillStyle = trailColor;
    ctx.fillRect(-p.width, -p.height, p.width, p.height * 2);
  }
}

function renderEnemyProjectile(ctx, p) {
  const type = p.projectileType || 'hairball';

  switch (type) {
    case 'yarn':
      // Yarn ball — round with thread lines
      ctx.fillStyle = '#DD6699';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FF88BB';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0.5, 2.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2, 2, 5);
      ctx.stroke();
      break;

    case 'fishbone':
      // Fish bone — elongated with fins
      ctx.rotate(Math.atan2(p.vy, p.vx));
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(-6, -1, 12, 2);
      ctx.fillStyle = '#AAAAAA';
      ctx.beginPath();
      ctx.moveTo(-4, -1);
      ctx.lineTo(-5, -4);
      ctx.lineTo(-2, -1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 1);
      ctx.lineTo(-5, 4);
      ctx.lineTo(-2, 1);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-9, -3);
      ctx.lineTo(-9, 3);
      ctx.closePath();
      ctx.fill();
      break;

    case 'milk':
      // Milk bottle
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-3, -5, 6, 10);
      ctx.fillStyle = '#4488FF';
      ctx.fillRect(-3, -5, 6, 3);
      ctx.fillStyle = '#DDDDDD';
      ctx.fillRect(-2, -6, 4, 2);
      break;

    case 'hairball':
    default:
      // Hairball — brown fuzzy circle
      ctx.fillStyle = '#8B6914';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#A08030';
      ctx.beginPath();
      ctx.arc(-1, -1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#6B4E0A';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 3, Math.sin(a) * 3);
        ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
        ctx.stroke();
      }
      break;
  }
}

/**
 * Renders floating score text.
 */
export function renderFloatingTexts(ctx, texts) {
  for (const t of texts) {
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = t.color || '#FFD700';
    ctx.font = `bold ${t.size || 14}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

/**
 * Updates floating texts (rise and fade).
 */
export function updateFloatingTexts(texts, dt) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    t.y -= 40 * dt;
    t.alpha -= dt * 1.5;
    if (t.alpha <= 0) {
      texts.splice(i, 1);
    }
  }
}

/**
 * Creates a floating text.
 */
export function addFloatingText(texts, x, y, text, color) {
  texts.push({ x, y, text, color: color || '#FFD700', alpha: 1, size: 14 });
}
