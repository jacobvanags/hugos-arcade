import { config } from '../config.js';

/**
 * Renders the level background and tiles.
 */
export function renderLevel(ctx, level, worldTheme, cam, totalTime) {
  const ts = config.tileSize;
  const { tiles } = level;

  // ─── Parallax background ───
  renderBackground(ctx, worldTheme, cam, totalTime);

  // ─── Calculate visible tile range ───
  const startCol = Math.max(0, Math.floor(cam.x / ts) - 1);
  const endCol = Math.min(level.cols, Math.ceil((cam.x + config.width) / ts) + 1);
  const startRow = Math.max(0, Math.floor(cam.y / ts) - 1);
  const endRow = Math.min(level.rows, Math.ceil((cam.y + config.height) / ts) + 1);

  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const tile = tiles[r][c];
      if (tile === 0) continue;

      const x = c * ts;
      const y = r * ts;

      switch (tile) {
        case 1: // Solid block
          renderSolidTile(ctx, x, y, ts, worldTheme, tiles, r, c);
          break;
        case 2: // Platform
          renderPlatform(ctx, x, y, ts, worldTheme);
          break;
        case 3: // Spikes
          renderSpikes(ctx, x, y, ts);
          break;
        case 4: // Spring
          renderSpring(ctx, x, y, ts, totalTime);
          break;
      }
    }
  }
}

/**
 * Renders pickups (cheese, hearts).
 */
export function renderPickups(ctx, pickups, totalTime) {
  for (const p of pickups) {
    if (p.collected) continue;

    ctx.save();
    ctx.translate(p.x, p.y);

    // Bob up and down
    const bob = Math.sin(totalTime * 3 + p.x * 0.1) * 3;
    ctx.translate(0, bob);

    if (p.type === 'cheese') {
      // Small cheese wedge
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(-6, 4);
      ctx.lineTo(0, -6);
      ctx.lineTo(8, 4);
      ctx.closePath();
      ctx.fill();
      // Holes
      ctx.fillStyle = '#DAA520';
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(3, 2, 1, 0, Math.PI * 2);
      ctx.fill();
      // Glow
      ctx.globalAlpha = 0.15 + Math.sin(totalTime * 4) * 0.1;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (p.type === 'heart') {
      // Heart shape
      ctx.fillStyle = '#FF4466';
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-6, -2, -6, -6, 0, -3);
      ctx.bezierCurveTo(6, -6, 6, -2, 0, 4);
      ctx.fill();
      // Glow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#FF4466';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (p.type === 'reward') {
      // Special secret reward — big glowing star
      const pulse = 0.6 + Math.sin(totalTime * 3) * 0.3;
      // Glow aura
      ctx.globalAlpha = pulse * 0.4;
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
      grad.addColorStop(0, '#FFD700');
      grad.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      // Star shape
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      drawStarShape(ctx, 0, 0, 5, 10, 5);
      ctx.fill();
      ctx.stroke();
      // Inner sparkle
      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(0, -1, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}

function drawStarShape(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = -Math.PI / 2;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

// ─── Secret Object Rendering ───────────────────────────────────

/**
 * Renders secret objects (pushable, door, key) for the current level.
 */
export function renderSecretObjects(ctx, secret, totalTime) {
  if (!secret) return;
  const { def } = secret;

  // ─── Pushable / Key trigger object ───
  if (secret.triggerActive) {
    ctx.save();
    if (def.trigger.type === 'push') {
      ctx.translate(secret.triggerX, secret.triggerY);
      renderPushable(ctx, def.trigger.objectVisual, totalTime);
    } else if (def.trigger.type === 'key') {
      ctx.translate(def.trigger.x, def.trigger.y);
      renderKeycard(ctx, totalTime);
    }
    ctx.restore();
  }

  // ─── Secret door ───
  ctx.save();
  ctx.translate(secret.doorX, secret.doorY);
  if (secret.doorOpen) {
    renderDoor(ctx, def.door.visual, true, totalTime);
  } else if (def.trigger.type === 'key') {
    // Key doors are visible but locked
    renderDoor(ctx, def.door.visual, false, totalTime);
  }
  // Push doors are hidden until pushed
  ctx.restore();
}

function renderPushable(ctx, visual, t) {
  if (visual === 'pot') {
    // Large cooking pot
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(0, 0, 13, Math.PI, 0);
    ctx.lineTo(13, 8);
    ctx.lineTo(-13, 8);
    ctx.closePath();
    ctx.fill();
    // Rim
    ctx.fillStyle = '#666';
    ctx.fillRect(-14, -2, 28, 3);
    // Handles
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-14, 2, 4, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(14, 2, 4, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    // Suspicious shimmer
    ctx.fillStyle = `rgba(255,215,0,${0.1 + Math.sin(t * 2) * 0.05})`;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
  } else if (visual === 'tomato') {
    // Giant tomato
    ctx.fillStyle = '#CC3030';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,100,100,0.4)';
    ctx.beginPath();
    ctx.arc(-4, -5, 5, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.fillStyle = '#2A8020';
    ctx.fillRect(-2, -16, 4, 5);
    // Leaves
    ctx.fillStyle = '#3AA030';
    ctx.beginPath();
    ctx.ellipse(-5, -14, 5, 2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5, -14, 5, 2, 0.5, 0, Math.PI * 2);
    ctx.fill();
    // Shimmer
    ctx.fillStyle = `rgba(255,215,0,${0.08 + Math.sin(t * 2) * 0.04})`;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderKeycard(ctx, t) {
  const pulse = 0.6 + Math.sin(t * 3) * 0.3;
  // Glow
  ctx.fillStyle = `rgba(0,200,255,${pulse * 0.2})`;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  // Card body
  ctx.fillStyle = '#1166AA';
  ctx.fillRect(-8, -5, 16, 10);
  ctx.strokeStyle = '#00CCFF';
  ctx.lineWidth = 1;
  ctx.strokeRect(-8, -5, 16, 10);
  // Chip
  ctx.fillStyle = '#FFD700';
  ctx.fillRect(-3, -2, 6, 4);
  // Magnetic strip
  ctx.fillStyle = '#333';
  ctx.fillRect(-7, 2, 14, 2);
}

function renderDoor(ctx, visual, open, t) {
  if (visual === 'mousehole') {
    // Dark arch-shaped mousehole in wall
    ctx.fillStyle = open ? '#0a0a0a' : '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -4, 14, Math.PI, 0);
    ctx.lineTo(14, 14);
    ctx.lineTo(-14, 14);
    ctx.closePath();
    ctx.fill();
    if (open) {
      // Beckoning glow from inside
      const glow = 0.15 + Math.sin(t * 2) * 0.08;
      ctx.fillStyle = `rgba(255,180,80,${glow})`;
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (visual === 'gardenDoor') {
    // Wooden trapdoor in the ground
    ctx.fillStyle = open ? '#1a0a00' : '#4A3520';
    ctx.fillRect(-14, -4, 28, 20);
    ctx.strokeStyle = open ? '#664422' : '#6A5530';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -4, 28, 20);
    // Handle
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(0, 6, 3, 0, Math.PI * 2);
    ctx.fill();
    if (open) {
      // Depth illusion
      ctx.fillStyle = `rgba(100,255,150,${0.1 + Math.sin(t * 2) * 0.05})`;
      ctx.fillRect(-10, 0, 20, 12);
    }
  } else if (visual === 'securityDoor') {
    // Metal security door
    ctx.fillStyle = open ? '#0a0a15' : '#4A4A5A';
    ctx.fillRect(-14, -16, 28, 32);
    ctx.strokeStyle = open ? '#2244AA' : '#666';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-14, -16, 28, 32);
    // Keycard slot
    ctx.fillStyle = open ? '#00FF00' : '#FF0000';
    ctx.fillRect(8, -2, 4, 6);
    if (open) {
      ctx.fillStyle = `rgba(0,100,255,${0.12 + Math.sin(t * 2) * 0.06})`;
      ctx.fillRect(-10, -12, 20, 28);
    }
  }
}

/**
 * Renders the golden cheese goal.
 */
export function renderGoal(ctx, goal, totalTime, isSecret) {
  ctx.save();
  ctx.translate(goal.x + 16, goal.y + 16);

  // Color scheme: gold for regular, silver for secret levels
  const mainColor = isSecret ? '#C0C0C0' : '#FFD700';
  const darkColor = isSecret ? '#808080' : '#DAA520';
  const glowRGB = isSecret ? '192,192,192' : '255,215,0';

  // Glow aura
  const glowPulse = 0.3 + Math.sin(totalTime * 2) * 0.15;
  ctx.globalAlpha = glowPulse;
  const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
  grad.addColorStop(0, mainColor);
  grad.addColorStop(1, `rgba(${glowRGB},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Rotate slowly
  const rot = totalTime * 0.5;
  ctx.rotate(Math.sin(rot) * 0.15);

  // Cheese wedge (larger)
  ctx.fillStyle = mainColor;
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(0, -10);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  // Outline
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 8);
  ctx.lineTo(0, -10);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.stroke();

  // Cheese holes
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.arc(-2, 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4, 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1, -3, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle particles
  for (let i = 0; i < 4; i++) {
    const angle = totalTime * 2 + i * Math.PI / 2;
    const dist = 14 + Math.sin(totalTime * 3 + i) * 4;
    const sx = Math.cos(angle) * dist;
    const sy = Math.sin(angle) * dist;
    const sparkleSize = 1.5 + Math.sin(totalTime * 5 + i * 2) * 0.5;
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.6 + Math.sin(totalTime * 4 + i) * 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

// ─── Tile Rendering Helpers ──────────────────────────────────────

function renderBackground(ctx, theme, cam, t) {
  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, config.height);
  grad.addColorStop(0, theme.bg1);
  grad.addColorStop(1, theme.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, config.width, config.height);

  // Determine world from theme
  const worldIdx = config.worlds.indexOf(theme);

  if (worldIdx === 0) renderKitchenBG(ctx, cam, t);
  else if (worldIdx === 1) renderPantryBG(ctx, cam, t);
  else if (worldIdx === 2) renderGardenBG(ctx, cam, t);
  else if (worldIdx === 3) renderSewersBG(ctx, cam, t);
  else if (worldIdx === 4) renderRooftopsBG(ctx, cam, t);
  else if (worldIdx === 5) renderWarehouseBG(ctx, cam, t);
  else renderDefaultBG(ctx, cam, t);
}

function renderDefaultBG(ctx, cam, t) {
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  for (let i = 0; i < 40; i++) {
    const px = ((i * 73 + 17) % 800) - (cam.x * 0.1) % 800;
    const py = ((i * 47 + 31) % 600);
    ctx.fillRect(px < 0 ? px + 800 : px, py, 1.5, 1.5);
  }
}

function renderKitchenBG(ctx, cam, t) {
  // Tile pattern on far wall
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  const tileOff = (cam.x * 0.05) % 48;
  for (let x = -48 - tileOff; x < config.width + 48; x += 48) {
    for (let y = 0; y < config.height - 100; y += 48) {
      ctx.strokeRect(x, y, 48, 48);
    }
  }

  // Hanging pots and pans (parallax layer 1)
  const panOff = (cam.x * 0.15) % 900;
  for (let i = 0; i < 6; i++) {
    const px = ((i * 150 + 30) % 900) - panOff;
    const wrap = px < -60 ? px + 900 : px;
    ctx.fillStyle = 'rgba(120,120,140,0.12)';
    // Hook
    ctx.fillRect(wrap + 18, 0, 3, 20 + (i % 3) * 8);
    // Pan body
    const panY = 20 + (i % 3) * 8;
    if (i % 2 === 0) {
      // Round pot
      ctx.beginPath();
      ctx.arc(wrap + 20, panY + 14, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(wrap + 34, panY + 10, 12, 4); // handle
    } else {
      // Flat pan
      ctx.fillRect(wrap + 4, panY, 32, 6);
      ctx.fillRect(wrap + 36, panY - 2, 14, 4); // handle
      ctx.fillRect(wrap + 4, panY + 6, 32, 2);
    }
  }

  // Shelves with jars (parallax layer 2)
  const shelfOff = (cam.x * 0.25) % 1000;
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 250 + 80) % 1000) - shelfOff;
    const wrap = sx < -80 ? sx + 1000 : sx;
    const sy = 160 + (i % 2) * 120;
    // Shelf board
    ctx.fillStyle = 'rgba(100,70,30,0.08)';
    ctx.fillRect(wrap, sy, 80, 4);
    // Jars
    ctx.fillStyle = 'rgba(200,180,100,0.06)';
    ctx.fillRect(wrap + 8, sy - 20, 12, 20);
    ctx.fillRect(wrap + 30, sy - 16, 10, 16);
    ctx.fillRect(wrap + 52, sy - 24, 14, 24);
    // Jar lids
    ctx.fillStyle = 'rgba(160,120,60,0.08)';
    ctx.fillRect(wrap + 7, sy - 23, 14, 4);
    ctx.fillRect(wrap + 29, sy - 19, 12, 4);
    ctx.fillRect(wrap + 51, sy - 27, 16, 4);
  }

  // Steam wisps
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 5; i++) {
    const sx = ((i * 180 + 50) % 800) - (cam.x * 0.1) % 800;
    const wrap = sx < -20 ? sx + 800 : sx;
    const sy = 350 + Math.sin(t * 0.8 + i * 1.5) * 30;
    const sz = 15 + Math.sin(t * 0.5 + i) * 5;
    ctx.beginPath();
    ctx.arc(wrap, sy, sz, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wrap + 10, sy - 15, sz * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderGardenBG(ctx, cam, t) {
  // Clouds (slow parallax)
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 200 + 50) % 1000) - (cam.x * 0.05) % 1000 + Math.sin(t * 0.1 + i) * 10;
    const wrap = cx < -80 ? cx + 1000 : cx;
    const cy = 30 + (i * 37) % 80;
    ctx.beginPath();
    ctx.arc(wrap, cy, 25, 0, Math.PI * 2);
    ctx.arc(wrap + 20, cy - 5, 20, 0, Math.PI * 2);
    ctx.arc(wrap + 40, cy, 22, 0, Math.PI * 2);
    ctx.arc(wrap + 18, cy + 8, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant hills
  const hillOff = (cam.x * 0.1) % 800;
  ctx.fillStyle = 'rgba(30,80,30,0.08)';
  ctx.beginPath();
  ctx.moveTo(-50, config.height);
  for (let x = -50; x < config.width + 100; x += 10) {
    const h = 380 + Math.sin((x + hillOff) * 0.008) * 40 + Math.sin((x + hillOff) * 0.02) * 20;
    ctx.lineTo(x, h);
  }
  ctx.lineTo(config.width + 100, config.height);
  ctx.closePath();
  ctx.fill();

  // Background bushes (parallax layer 2)
  const bushOff = (cam.x * 0.2) % 900;
  ctx.fillStyle = 'rgba(40,100,30,0.08)';
  for (let i = 0; i < 7; i++) {
    const bx = ((i * 130 + 20) % 900) - bushOff;
    const wrap = bx < -40 ? bx + 900 : bx;
    const by = 400 + (i % 3) * 40;
    const bsz = 18 + (i * 7) % 15;
    ctx.beginPath();
    ctx.arc(wrap, by, bsz, 0, Math.PI * 2);
    ctx.arc(wrap + bsz, by + 3, bsz * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Flowers
  const flowerOff = (cam.x * 0.3) % 700;
  for (let i = 0; i < 10; i++) {
    const fx = ((i * 70 + 15) % 700) - flowerOff;
    const wrap = fx < -10 ? fx + 700 : fx;
    const fy = 430 + (i % 4) * 30;
    // Stem
    ctx.fillStyle = 'rgba(40,120,40,0.1)';
    ctx.fillRect(wrap, fy, 2, 14);
    // Petals
    const colors = ['rgba(255,100,100,0.1)', 'rgba(255,200,50,0.1)', 'rgba(180,100,255,0.1)', 'rgba(255,150,200,0.1)'];
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.arc(wrap + 1, fy - 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Butterflies
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 280 + 100) % 800) - (cam.x * 0.15) % 800;
    const wrap = bx < -10 ? bx + 800 : bx;
    const by = 200 + Math.sin(t * 1.5 + i * 2) * 40;
    const wingFlap = Math.sin(t * 8 + i * 3) * 0.5;
    ctx.fillStyle = i === 0 ? 'rgba(255,200,50,0.12)' : i === 1 ? 'rgba(150,200,255,0.12)' : 'rgba(255,150,200,0.12)';
    ctx.save();
    ctx.translate(wrap, by);
    // Left wing
    ctx.save();
    ctx.scale(1, wingFlap);
    ctx.beginPath();
    ctx.ellipse(-4, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Right wing
    ctx.save();
    ctx.scale(1, wingFlap);
    ctx.beginPath();
    ctx.ellipse(4, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}

function renderWarehouseBG(ctx, cam, t) {
  // Industrial grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 1;
  const gridOff = (cam.x * 0.05) % 64;
  for (let x = -gridOff; x < config.width + 64; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, config.height);
    ctx.stroke();
  }
  for (let y = 0; y < config.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(config.width, y);
    ctx.stroke();
  }

  // Stacked crates in background (parallax layer 1)
  const crateOff = (cam.x * 0.15) % 900;
  ctx.fillStyle = 'rgba(80,70,50,0.08)';
  for (let i = 0; i < 6; i++) {
    const cx = ((i * 150 + 40) % 900) - crateOff;
    const wrap = cx < -60 ? cx + 900 : cx;
    const cy = 360 + (i % 3) * -30;
    const cw = 30 + (i * 11) % 20;
    const ch = 25 + (i * 7) % 20;
    ctx.fillRect(wrap, cy, cw, ch);
    // X marking
    ctx.strokeStyle = 'rgba(120,100,60,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wrap + 3, cy + 3);
    ctx.lineTo(wrap + cw - 3, cy + ch - 3);
    ctx.moveTo(wrap + cw - 3, cy + 3);
    ctx.lineTo(wrap + 3, cy + ch - 3);
    ctx.stroke();
  }

  // Pipes along ceiling (parallax layer 1)
  const pipeOff = (cam.x * 0.12) % 600;
  for (let i = 0; i < 3; i++) {
    const py = 20 + i * 25;
    ctx.fillStyle = 'rgba(100,100,120,0.06)';
    ctx.fillRect(0, py, config.width, 6);
    // Joints
    ctx.fillStyle = 'rgba(130,130,150,0.08)';
    for (let j = 0; j < 8; j++) {
      const jx = ((j * 120 + i * 40) % 800) - pipeOff;
      const wrap = jx < -10 ? jx + 800 : jx;
      ctx.fillRect(wrap, py - 2, 12, 10);
    }
  }

  // Shelving units (parallax layer 2)
  const shelfOff = (cam.x * 0.22) % 1000;
  ctx.fillStyle = 'rgba(90,90,110,0.06)';
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 250 + 60) % 1000) - shelfOff;
    const wrap = sx < -70 ? sx + 1000 : sx;
    // Vertical supports
    ctx.fillRect(wrap, 100, 4, 350);
    ctx.fillRect(wrap + 56, 100, 4, 350);
    // Shelves
    for (let s = 0; s < 4; s++) {
      ctx.fillRect(wrap, 140 + s * 80, 60, 3);
    }
  }

  // Hanging industrial lights
  const lightOff = (cam.x * 0.1) % 800;
  for (let i = 0; i < 5; i++) {
    const lx = ((i * 160 + 80) % 800) - lightOff;
    const wrap = lx < -20 ? lx + 800 : lx;
    // Wire
    ctx.strokeStyle = 'rgba(100,100,100,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wrap, 0);
    ctx.lineTo(wrap, 70);
    ctx.stroke();
    // Lamp shade
    ctx.fillStyle = 'rgba(80,80,100,0.1)';
    ctx.beginPath();
    ctx.moveTo(wrap - 10, 70);
    ctx.lineTo(wrap + 10, 70);
    ctx.lineTo(wrap + 6, 78);
    ctx.lineTo(wrap - 6, 78);
    ctx.closePath();
    ctx.fill();
    // Light glow
    const glow = 0.03 + Math.sin(t * 2 + i * 1.3) * 0.01;
    ctx.fillStyle = `rgba(255,220,150,${glow})`;
    ctx.beginPath();
    ctx.arc(wrap, 85, 25, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPantryBG(ctx, cam, t) {
  // Wooden plank pattern on far wall
  ctx.strokeStyle = 'rgba(180,140,80,0.03)';
  ctx.lineWidth = 0.5;
  const plankOff = (cam.x * 0.05) % 60;
  for (let y = 0; y < config.height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(config.width, y);
    ctx.stroke();
  }
  for (let x = -plankOff; x < config.width + 60; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, config.height);
    ctx.stroke();
  }

  // Shelves with jars and cans (parallax layer 1)
  const shelfOff = (cam.x * 0.15) % 800;
  for (let i = 0; i < 5; i++) {
    const sx = ((i * 160 + 40) % 800) - shelfOff;
    const wrap = sx < -60 ? sx + 800 : sx;
    const sy = 120 + (i % 3) * 130;
    // Shelf board
    ctx.fillStyle = 'rgba(120,85,40,0.08)';
    ctx.fillRect(wrap, sy, 70, 4);
    // Jars
    const jarColors = ['rgba(200,180,100,0.06)', 'rgba(180,60,60,0.05)', 'rgba(100,160,80,0.05)'];
    for (let j = 0; j < 3; j++) {
      ctx.fillStyle = jarColors[j];
      const jw = 10 + (j * 3) % 6;
      const jh = 16 + (j * 5) % 8;
      ctx.fillRect(wrap + 8 + j * 20, sy - jh, jw, jh);
      ctx.fillStyle = 'rgba(160,120,60,0.07)';
      ctx.fillRect(wrap + 7 + j * 20, sy - jh - 3, jw + 2, 3);
    }
  }

  // Cobwebs in corners
  ctx.strokeStyle = 'rgba(255,255,255,0.02)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 300 + 50) % 800) - (cam.x * 0.08) % 800;
    const wrap = cx < -40 ? cx + 800 : cx;
    ctx.beginPath();
    ctx.moveTo(wrap, 0);
    ctx.quadraticCurveTo(wrap + 20, 15, wrap + 40, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wrap + 10, 0);
    ctx.lineTo(wrap + 20, 25);
    ctx.stroke();
  }

  // Dust particles floating
  ctx.fillStyle = 'rgba(255,230,180,0.04)';
  for (let i = 0; i < 6; i++) {
    const dx = ((i * 130 + 20) % 800) - (cam.x * 0.06) % 800;
    const wrap = dx < -5 ? dx + 800 : dx;
    const dy = 200 + Math.sin(t * 0.4 + i * 1.3) * 80;
    ctx.beginPath();
    ctx.arc(wrap, dy, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderSewersBG(ctx, cam, t) {
  // Brick pattern on walls
  ctx.strokeStyle = 'rgba(100,140,130,0.03)';
  ctx.lineWidth = 0.5;
  const brickOff = (cam.x * 0.05) % 40;
  for (let y = 0; y < config.height - 100; y += 20) {
    const offset = (Math.floor(y / 20) % 2) * 20;
    for (let x = -40 - brickOff + offset; x < config.width + 40; x += 40) {
      ctx.strokeRect(x, y, 40, 20);
    }
  }

  // Dripping pipes along ceiling
  const pipeOff = (cam.x * 0.12) % 600;
  for (let i = 0; i < 4; i++) {
    const py = 10 + i * 20;
    ctx.fillStyle = 'rgba(60,100,90,0.06)';
    ctx.fillRect(0, py, config.width, 5);
    ctx.fillStyle = 'rgba(80,130,110,0.08)';
    for (let j = 0; j < 6; j++) {
      const jx = ((j * 140 + i * 30) % 800) - pipeOff;
      const wrap = jx < -10 ? jx + 800 : jx;
      ctx.fillRect(wrap, py - 2, 14, 9);
    }
  }

  // Water drips
  ctx.fillStyle = 'rgba(100,200,180,0.08)';
  for (let i = 0; i < 5; i++) {
    const dx = ((i * 170 + 60) % 800) - (cam.x * 0.1) % 800;
    const wrap = dx < -5 ? dx + 800 : dx;
    const drip = (t * 1.2 + i * 0.9) % 3;
    if (drip < 2) {
      const dy = 80 + drip * 150;
      ctx.beginPath();
      ctx.ellipse(wrap, dy, 1.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Murky water at bottom
  ctx.fillStyle = 'rgba(40,80,70,0.06)';
  ctx.fillRect(0, config.height - 80, config.width, 80);
  // Water ripples
  ctx.strokeStyle = 'rgba(80,150,130,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const rx = ((i * 200 + 100) % 800) - (cam.x * 0.08) % 800;
    const wrap = rx < -30 ? rx + 800 : rx;
    const ry = config.height - 40 + Math.sin(t * 1.5 + i) * 5;
    ctx.beginPath();
    ctx.ellipse(wrap, ry, 20 + Math.sin(t + i) * 5, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Green mist
  ctx.fillStyle = 'rgba(60,140,100,0.02)';
  for (let i = 0; i < 4; i++) {
    const mx = ((i * 220 + 30) % 800) - (cam.x * 0.05) % 800;
    const wrap = mx < -30 ? mx + 800 : mx;
    const my = 350 + Math.sin(t * 0.3 + i * 1.2) * 30;
    ctx.beginPath();
    ctx.arc(wrap, my, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderRooftopsBG(ctx, cam, t) {
  // Night sky with stars
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 50; i++) {
    const sx = (i * 73 + 17) % 800;
    const sy = (i * 47 + 11) % 400;
    const sz = 0.4 + (i * 13 % 3) * 0.3;
    const twinkle = 0.3 + Math.sin(t * 2.5 + i * 0.9) * 0.3;
    ctx.globalAlpha = twinkle * 0.15;
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon
  ctx.fillStyle = 'rgba(220,220,240,0.08)';
  ctx.beginPath();
  ctx.arc(650, 60, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(14,14,30,0.9)';
  ctx.beginPath();
  ctx.arc(660, 55, 28, 0, Math.PI * 2);
  ctx.fill();

  // Distant city skyline
  const skyOff = (cam.x * 0.08) % 1000;
  ctx.fillStyle = 'rgba(30,30,60,0.15)';
  const buildings = [40, 70, 55, 90, 45, 80, 60, 100, 50, 75, 65, 85];
  for (let i = 0; i < buildings.length; i++) {
    const bx = ((i * 80 + 20) % 1000) - skyOff;
    const wrap = bx < -40 ? bx + 1000 : bx;
    const bh = buildings[i];
    ctx.fillRect(wrap, config.height - 100 - bh, 35, bh + 100);
    // Windows
    ctx.fillStyle = 'rgba(255,220,100,0.03)';
    for (let wy = config.height - 90 - bh; wy < config.height - 100; wy += 15) {
      for (let wx = 5; wx < 30; wx += 10) {
        if ((wy * 7 + wx * 3 + i) % 5 !== 0) {
          ctx.fillRect(wrap + wx, wy, 4, 6);
        }
      }
    }
    ctx.fillStyle = 'rgba(30,30,60,0.15)';
  }

  // Chimney silhouettes (parallax layer 2)
  const chimOff = (cam.x * 0.2) % 700;
  ctx.fillStyle = 'rgba(20,20,40,0.1)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 180 + 50) % 700) - chimOff;
    const wrap = cx < -20 ? cx + 700 : cx;
    const cy = config.height - 160 + (i % 2) * 30;
    ctx.fillRect(wrap, cy, 12, 40);
    ctx.fillRect(wrap - 3, cy, 18, 4);
    // Smoke wisps
    ctx.fillStyle = 'rgba(100,100,140,0.03)';
    const smokeY = cy - 10 + Math.sin(t * 0.6 + i) * 8;
    ctx.beginPath();
    ctx.arc(wrap + 6, smokeY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(wrap + 10, smokeY - 10, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(20,20,40,0.1)';
  }
}

function renderSolidTile(ctx, x, y, ts, theme, tiles, row, col) {
  // Main color
  ctx.fillStyle = theme.groundColor;
  ctx.fillRect(x, y, ts, ts);

  // Top surface if exposed to air
  const aboveIsAir = row === 0 || tiles[row - 1][col] === 0 || tiles[row - 1][col] === 2;
  if (aboveIsAir) {
    ctx.fillStyle = theme.platformColor;
    ctx.fillRect(x, y, ts, 6);
    // Grass/surface detail
    ctx.fillStyle = theme.accentColor;
    ctx.fillRect(x, y, ts, 2);
  }

  // Subtle border
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, ts - 1, ts - 1);
}

function renderPlatform(ctx, x, y, ts, theme) {
  // Platform top surface
  ctx.fillStyle = theme.platformColor;
  ctx.fillRect(x, y, ts, 8);

  // Accent line
  ctx.fillStyle = theme.accentColor;
  ctx.fillRect(x, y, ts, 2);

  // Support brackets
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 2, y + 8, 3, 4);
  ctx.fillRect(x + ts - 5, y + 8, 3, 4);
}

function renderSpikes(ctx, x, y, ts) {
  ctx.fillStyle = '#CC3333';
  const spikeCount = 4;
  const sw = ts / spikeCount;
  for (let i = 0; i < spikeCount; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * sw, y + ts);
    ctx.lineTo(x + i * sw + sw / 2, y + 8);
    ctx.lineTo(x + (i + 1) * sw, y + ts);
    ctx.closePath();
    ctx.fill();
  }
  // Metallic tip
  ctx.fillStyle = '#FF5555';
  for (let i = 0; i < spikeCount; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * sw + sw / 2 - 1, y + 12);
    ctx.lineTo(x + i * sw + sw / 2, y + 8);
    ctx.lineTo(x + i * sw + sw / 2 + 1, y + 12);
    ctx.closePath();
    ctx.fill();
  }
}

function renderSpring(ctx, x, y, ts, t) {
  const bounce = Math.abs(Math.sin(t * 4)) * 3;

  // Base
  ctx.fillStyle = '#666';
  ctx.fillRect(x + 4, y + ts - 6, ts - 8, 6);

  // Coil
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + ts - 6);
  ctx.lineTo(x + ts - 8, y + ts - 10 - bounce);
  ctx.lineTo(x + 8, y + ts - 14 - bounce);
  ctx.lineTo(x + ts - 8, y + ts - 18 - bounce);
  ctx.stroke();

  // Top pad
  ctx.fillStyle = '#FF6600';
  ctx.fillRect(x + 4, y + ts - 20 - bounce, ts - 8, 4);
}
