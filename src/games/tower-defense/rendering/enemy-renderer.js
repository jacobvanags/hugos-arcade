/**
 * Renders enemies on the canvas — per-type alien sprites with health bars.
 */
import { config } from '../config.js';
import { withContext } from '../../../shared/canvas-utils.js';

export function renderEnemies(ctx, gs) {
  for (const enemy of gs.enemies) {
    if (enemy.hp <= 0) continue;

    withContext(ctx, () => {
      ctx.translate(enemy.x, enemy.y);

      // Cloaked enemies are semi-transparent unless revealed by a detector tower
      if (enemy.cloaked && !enemy.revealed) {
        ctx.globalAlpha = 0.15;
      }

      // Flash white when hit
      const flashActive = enemy.flashTimer > 0;

      // Slow tint
      const isSlowed = enemy.slowDuration > 0;

      // Draw based on type
      switch (enemy.type) {
        case 'scout': drawScout(ctx, enemy, flashActive); break;
        case 'grunt': drawGrunt(ctx, enemy, flashActive); break;
        case 'tank': drawTank(ctx, enemy, flashActive); break;
        case 'swarm': drawSwarm(ctx, enemy, flashActive); break;
        case 'healer': drawHealer(ctx, enemy, flashActive); break;
        case 'shielded': drawShielded(ctx, enemy, flashActive); break;
        case 'cloaked': drawCloaked(ctx, enemy, flashActive); break;
        case 'sprinter': drawSprinter(ctx, enemy, flashActive); break;
        case 'brute': drawBrute(ctx, enemy, flashActive); break;
        case 'splitter': drawSplitter(ctx, enemy, flashActive); break;
        case 'warper': drawWarper(ctx, enemy, flashActive); break;
        case 'horde': drawHorde(ctx, enemy, flashActive); break;
        case 'boss': drawBoss(ctx, enemy, flashActive); break;
        case 'veia': drawVeia(ctx, enemy, flashActive); break;
        case 'titan': drawTitan(ctx, enemy, flashActive); break;
        case 'phantom': drawPhantom(ctx, enemy, flashActive); break;
        case 'broodmother': drawBroodmother(ctx, enemy, flashActive); break;
        default: drawDefault(ctx, enemy, flashActive);
      }

      // Slow indicator
      if (isSlowed) {
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = '#00ccff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.size + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Health bar (drawn above enemy, not rotated)
    if (enemy.hp < enemy.maxHp) {
      const barW = enemy.size * 2;
      const barH = 3;
      const barX = enemy.x - barW / 2;
      const barY = enemy.y - enemy.size - 8;
      const hpPct = enemy.hp / enemy.maxHp;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

      // HP fill
      ctx.fillStyle = hpPct > 0.5 ? '#44ff44' : hpPct > 0.25 ? '#ffaa00' : '#ff4444';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Shield bar (above health)
      if (enemy.shieldHp > 0 && enemy.maxShieldHp > 0) {
        const shieldPct = enemy.shieldHp / enemy.maxShieldHp;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(barX - 1, barY - 6, barW + 2, barH + 2);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(barX, barY - 5, barW * shieldPct, barH);
      }
    }

    // Boss name label for special bosses
    if (enemy.type === 'veia' || enemy.type === 'titan' || enemy.type === 'phantom' || enemy.type === 'broodmother') {
      const name = enemy.type === 'veia' ? 'VEIA' :
                   enemy.type === 'titan' ? 'TITAN' :
                   enemy.type === 'phantom' ? 'PHANTOM' : 'BROODMOTHER';
      ctx.fillStyle = enemy.color;
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(name, enemy.x, enemy.y - enemy.size - 12);
    }
  }
}

// --- Per-type drawing functions ---

function drawScout(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(-s * 0.7, s * 0.6);
  ctx.lineTo(s * 0.7, s * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, -s * 0.1, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawGrunt(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(-3, -2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -2, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawTank(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.moveTo(-s, -s * 0.7);
  ctx.lineTo(s, -s * 0.7);
  ctx.lineTo(s, s * 0.7);
  ctx.lineTo(-s, s * 0.7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = flash ? '#ddd' : '#553333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s + 3, 0);
  ctx.lineTo(s - 3, 0);
  ctx.stroke();
}

function drawSwarm(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(s, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s, 0);
  ctx.closePath();
  ctx.fill();
}

function drawHealer(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillRect(-s * 0.2, -s * 0.6, s * 0.4, s * 1.2);
  ctx.fillRect(-s * 0.6, -s * 0.2, s * 1.2, s * 0.4);
  if (enemy.healRadius) {
    ctx.strokeStyle = 'rgba(68,255,136,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.healRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawShielded(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
  ctx.fill();
  if (enemy.shieldHp > 0) {
    const shieldPct = enemy.shieldHp / enemy.maxShieldHp;
    ctx.strokeStyle = `rgba(68,136,255,${0.3 + shieldPct * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, s + 2, 0, Math.PI * 2 * shieldPct);
    ctx.stroke();
  }
}

function drawCloaked(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, -s * 0.2, s * 0.7, Math.PI, 0);
  ctx.lineTo(s * 0.7, s * 0.6);
  ctx.quadraticCurveTo(s * 0.35, s * 0.3, 0, s * 0.6);
  ctx.quadraticCurveTo(-s * 0.35, s * 0.3, -s * 0.7, s * 0.6);
  ctx.closePath();
  ctx.fill();
}

// --- NEW REGULAR ENEMIES ---

function drawSprinter(ctx, enemy, flash) {
  // Lightning bolt shape — very fast
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.1);
  ctx.lineTo(s * 0.5, -s * 0.2);
  ctx.lineTo(s * 0.2, -s * 0.2);
  ctx.lineTo(s * 0.4, s * 0.8);
  ctx.lineTo(-s * 0.1, 0);
  ctx.lineTo(-s * 0.3, 0);
  ctx.closePath();
  ctx.fill();
}

function drawBrute(ctx, enemy, flash) {
  // Big armored hexagon
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * s;
    const py = Math.sin(a) * s;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Armor cross-hatch
  ctx.strokeStyle = flash ? '#ddd' : '#664422';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.3);
  ctx.lineTo(s * 0.5, s * 0.3);
  ctx.moveTo(s * 0.5, -s * 0.3);
  ctx.lineTo(-s * 0.5, s * 0.3);
  ctx.stroke();
}

function drawSplitter(ctx, enemy, flash) {
  // Cell shape with division lines
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? '#ddd' : '#cc3388';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -s); ctx.lineTo(0, s);
  ctx.moveTo(-s * 0.7, -s * 0.7); ctx.lineTo(s * 0.7, s * 0.7);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWarper(ctx, enemy, flash) {
  // Phasing ring shape
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? '#ddd' : '#44aaff';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawHorde(ctx, enemy, flash) {
  // Tiny circle
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

// --- BOSS TYPES ---

function drawBoss(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  const spikes = 6;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const innerR = s * 0.7;
    const outerR = s;
    ctx.fillStyle = flash ? '#ddd' : '#cc2222';
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle - 0.2) * innerR, Math.sin(angle - 0.2) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.lineTo(Math.cos(angle + 0.2) * innerR, Math.sin(angle + 0.2) * innerR);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(0, -s * 0.15, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawVeia(ctx, enemy, flash) {
  const s = enemy.size;
  // Heal aura
  if (enemy.healRadius) {
    ctx.strokeStyle = 'rgba(255,0,102,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.healRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Shield ring
  if (enemy.shieldHp > 0 && enemy.maxShieldHp > 0) {
    const pct = enemy.shieldHp / enemy.maxShieldHp;
    ctx.strokeStyle = `rgba(255,100,200,${0.3 + pct * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, s + 4, 0, Math.PI * 2 * pct);
    ctx.stroke();
  }
  // Main body
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.75, 0, Math.PI * 2);
  ctx.fill();
  // Crown spikes (8)
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const innerR = s * 0.75;
    const outerR = s * 1.1;
    ctx.fillStyle = flash ? '#eee' : '#cc0044';
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle - 0.15) * innerR, Math.sin(angle - 0.15) * innerR);
    ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
    ctx.lineTo(Math.cos(angle + 0.15) * innerR, Math.sin(angle + 0.15) * innerR);
    ctx.closePath();
    ctx.fill();
  }
  // Two menacing eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.15, s * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.15, s * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#220000';
  ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.15, s * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.15, s * 0.09, 0, Math.PI * 2); ctx.fill();
  // Mouth
  ctx.strokeStyle = '#220000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.25, s * 0.15);
  ctx.quadraticCurveTo(0, s * 0.35, s * 0.25, s * 0.15);
  ctx.stroke();
}

function drawTitan(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.fillRect(-s, -s * 0.8, s * 2, s * 1.6);
  ctx.fillStyle = flash ? '#eee' : '#774422';
  ctx.fillRect(-s + 2, -s * 0.8, s * 2 - 4, 4);
  ctx.fillRect(-s + 2, s * 0.8 - 4, s * 2 - 4, 4);
  ctx.fillRect(-s + 2, -2, s * 2 - 4, 4);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(-s * 0.4, -s * 0.35, s * 0.8, s * 0.2);
}

function drawPhantom(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.globalAlpha = Math.max(ctx.globalAlpha, 0.5);
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.arc(0, -s * 0.2, s * 0.8, Math.PI, 0);
  ctx.lineTo(s * 0.8, s * 0.4);
  ctx.quadraticCurveTo(s * 0.5, s * 0.1, s * 0.3, s * 0.5);
  ctx.quadraticCurveTo(0, s * 0.2, -s * 0.3, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.5, s * 0.1, -s * 0.8, s * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff88ff';
  ctx.beginPath(); ctx.arc(-s * 0.25, -s * 0.2, s * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.2, s * 0.12, 0, Math.PI * 2); ctx.fill();
}

function drawBroodmother(ctx, enemy, flash) {
  const s = enemy.size;
  ctx.fillStyle = flash ? '#fff' : enemy.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.9, s * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = flash ? '#eee' : '#66cc66';
  const sacs = 5;
  for (let i = 0; i < sacs; i++) {
    const a = (i / sacs) * Math.PI * 2;
    const r = s * 0.7;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.15, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.07, 0, Math.PI * 2); ctx.fill();
}

function drawDefault(ctx, enemy, flash) {
  ctx.fillStyle = flash ? '#fff' : (enemy.color || '#ff8844');
  ctx.beginPath();
  ctx.arc(0, 0, enemy.size, 0, Math.PI * 2);
  ctx.fill();
}
