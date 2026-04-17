import { config } from '../config.js';
import { drawText } from '../../../shared/canvas-utils.js';

const W = config.width;
const H = config.height;

/**
 * Renders the tunnel transition — a lit tunnel with a torch/light effect.
 * @param {string} theme — 'kitchen', 'garden', or 'warehouse'
 * @param {number} progress — 0..1 through the tunnel
 * @param {number} totalTime — for animations
 */
export function renderTunnel(ctx, theme, progress, totalTime) {
  // ─── Background darkness ───
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, W, H);

  // Tunnel narrows slightly in the middle for depth
  const wallClose = 0.15 + Math.sin(progress * Math.PI) * 0.06;
  const wallTop = H * wallClose;
  const wallBot = H * (1 - wallClose);
  const tunnelH = wallBot - wallTop;

  // Mouse position (used for light source)
  const mouseX = 100 + progress * 600;
  const mouseY = wallTop + tunnelH * 0.65;

  // Theme-specific tunnel rendering (walls, floor, ceiling, details)
  switch (theme) {
    case 'kitchen': renderKitchenTunnel(ctx, wallTop, tunnelH, progress, totalTime); break;
    case 'garden':  renderGardenTunnel(ctx, wallTop, tunnelH, progress, totalTime); break;
    case 'warehouse': renderWarehouseTunnel(ctx, wallTop, tunnelH, progress, totalTime); break;
  }

  // ─── Mouse character running ───
  renderTunnelMouse(ctx, progress, mouseY, totalTime);

  // ─── Torch/light cone — illuminates outward from mouse ───
  // Flickering radius
  const flicker = Math.sin(totalTime * 6) * 8 + Math.sin(totalTime * 13) * 4;
  const lightR = 180 + flicker;

  // Warm glow around the mouse
  const glow = ctx.createRadialGradient(mouseX + 15, mouseY - 5, 10, mouseX + 15, mouseY - 5, lightR);
  glow.addColorStop(0, 'rgba(255,200,100,0.25)');
  glow.addColorStop(0.3, 'rgba(255,160,60,0.12)');
  glow.addColorStop(0.7, 'rgba(255,120,30,0.04)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ─── Darkness overlay — everything far from the light is dark ───
  // Instead of a simple vignette, darkness radiates from mouse position
  const darkGrad = ctx.createRadialGradient(mouseX + 15, mouseY - 5, lightR * 0.6, mouseX + 15, mouseY - 5, lightR * 1.8);
  darkGrad.addColorStop(0, 'rgba(0,0,0,0)');
  darkGrad.addColorStop(0.5, 'rgba(0,0,0,0.5)');
  darkGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = darkGrad;
  ctx.fillRect(0, 0, W, H);

  // Extra darkness at far edges of the screen
  const edgeDark = ctx.createLinearGradient(0, 0, W, 0);
  const leftDist = Math.max(0, 1 - mouseX / 250);
  const rightDist = Math.max(0, 1 - (W - mouseX) / 250);
  edgeDark.addColorStop(0, `rgba(0,0,0,${0.6 + leftDist * 0.3})`);
  edgeDark.addColorStop(Math.max(0.01, (mouseX - 150) / W), 'rgba(0,0,0,0)');
  edgeDark.addColorStop(Math.min(0.99, (mouseX + 200) / W), 'rgba(0,0,0,0)');
  edgeDark.addColorStop(1, `rgba(0,0,0,${0.6 + rightDist * 0.3})`);
  ctx.fillStyle = edgeDark;
  ctx.fillRect(0, 0, W, H);

  // ─── Entry/exit fade ───
  if (progress < 0.15) {
    ctx.fillStyle = `rgba(0,0,0,${1 - progress / 0.15})`;
    ctx.fillRect(0, 0, W, H);
  } else if (progress > 0.85) {
    ctx.fillStyle = `rgba(255,255,255,${(progress - 0.85) / 0.15 * 0.8})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ─── Kitchen tunnel: dark mousehole with wooden walls, cobwebs, dripping pipes ────

function renderKitchenTunnel(ctx, wallTop, tunnelH, progress, t) {
  const scrollX = progress * 2000;

  // Ceiling — dark brown wood
  ctx.fillStyle = '#2a1a0e';
  ctx.fillRect(0, 0, W, wallTop);
  // Floor — slightly lighter
  ctx.fillStyle = '#2e1c10';
  ctx.fillRect(0, wallTop + tunnelH, W, H);

  // ─── Ceiling planks ───
  ctx.strokeStyle = 'rgba(120,80,40,0.4)';
  ctx.lineWidth = 1;
  for (let y = wallTop - 35; y < wallTop; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Ceiling edge — bottom lip
  ctx.fillStyle = '#3a2815';
  ctx.fillRect(0, wallTop - 4, W, 4);

  // ─── Floor planks ───
  ctx.fillStyle = '#33230f';
  ctx.fillRect(0, wallTop + tunnelH, W, 10);
  ctx.strokeStyle = 'rgba(100,70,30,0.5)';
  ctx.lineWidth = 1;
  for (let x = -scrollX % 48; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, wallTop + tunnelH);
    ctx.lineTo(x, wallTop + tunnelH + 35);
    ctx.stroke();
  }
  // Floor top edge
  ctx.fillStyle = '#3e2c18';
  ctx.fillRect(0, wallTop + tunnelH, W, 3);
  // Floor grain lines
  ctx.strokeStyle = 'rgba(80,55,25,0.3)';
  for (let y = wallTop + tunnelH + 4; y < wallTop + tunnelH + 30; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // ─── Tunnel interior — gradient from walls to open space ───
  const tunnelBg = ctx.createLinearGradient(0, wallTop, 0, wallTop + tunnelH);
  tunnelBg.addColorStop(0, 'rgba(30,20,8,0.6)');
  tunnelBg.addColorStop(0.15, 'rgba(15,10,5,0.2)');
  tunnelBg.addColorStop(0.85, 'rgba(15,10,5,0.2)');
  tunnelBg.addColorStop(1, 'rgba(30,20,8,0.6)');
  ctx.fillStyle = tunnelBg;
  ctx.fillRect(0, wallTop, W, tunnelH);

  // ─── Cobwebs hanging from ceiling ───
  ctx.strokeStyle = 'rgba(220,220,220,0.25)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 190 + 50) - scrollX * 0.3) % (W + 200) - 100;
    const cy = wallTop + 2;
    // Main threads
    for (let a = 0; a < 6; a++) {
      const angle = (a / 6) * Math.PI * 0.5 + 0.2;
      const len = 18 + (i * 7) % 15;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(angle) * len * 0.5, cy + Math.sin(angle) * len * 0.7,
                           cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
      ctx.stroke();
    }
    // Cross threads
    ctx.strokeStyle = 'rgba(200,200,200,0.12)';
    for (let r = 8; r < 22; r += 6) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0.3, 1.3);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(220,220,220,0.25)';
  }

  // ─── Dripping water ───
  for (let i = 0; i < 6; i++) {
    const dx = ((i * 140 + 30) - scrollX * 0.5) % (W + 100) - 50;
    const dripPhase = (t * 1.5 + i * 0.7) % 1;
    const dy = wallTop + 6 + dripPhase * tunnelH * 0.7;
    ctx.fillStyle = `rgba(120,170,230,${0.5 * (1 - dripPhase)})`;
    ctx.beginPath();
    ctx.ellipse(dx, dy, 1.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Highlight on drop
    ctx.fillStyle = `rgba(200,220,255,${0.3 * (1 - dripPhase)})`;
    ctx.beginPath();
    ctx.ellipse(dx - 0.5, dy - 1, 0.5, 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Wooden support beams ───
  for (let i = 0; i < 3; i++) {
    const bx = ((i * 280 + 100) - scrollX * 0.4) % (W + 200) - 100;
    // Vertical beam
    ctx.fillStyle = 'rgba(60,40,18,0.5)';
    ctx.fillRect(bx - 3, wallTop, 6, tunnelH);
    // Beam edge highlights
    ctx.fillStyle = 'rgba(90,60,25,0.3)';
    ctx.fillRect(bx - 3, wallTop, 1, tunnelH);
    ctx.fillRect(bx + 2, wallTop, 1, tunnelH);
  }
}

// ─── Garden tunnel: underground earth, roots, mushrooms, puddles ───

function renderGardenTunnel(ctx, wallTop, tunnelH, progress, t) {
  const scrollX = progress * 2000;

  // Ceiling — packed earth with embedded stones
  ctx.fillStyle = '#1a2010';
  ctx.fillRect(0, 0, W, wallTop);
  // Floor — dark soil
  ctx.fillStyle = '#1c1e0e';
  ctx.fillRect(0, wallTop + tunnelH, W, H);

  // ─── Ceiling texture — layered earth ───
  ctx.fillStyle = 'rgba(90,70,35,0.35)';
  for (let i = 0; i < 40; i++) {
    const dx = ((i * 29 + 7) - scrollX * 0.2) % W;
    const dy = wallTop - 3 - (i * 5) % 18;
    ctx.fillRect(dx, dy, 4 + i % 5, 2 + i % 3);
  }
  // Embedded pebbles
  ctx.fillStyle = 'rgba(100,90,70,0.3)';
  for (let i = 0; i < 10; i++) {
    const px = ((i * 83 + 20) - scrollX * 0.15) % W;
    const py = wallTop - 5 - (i * 7) % 12;
    ctx.beginPath();
    ctx.ellipse(px, py, 2 + i % 3, 1.5 + i % 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ceiling edge — rough dirt lip
  ctx.fillStyle = '#2a3018';
  ctx.fillRect(0, wallTop - 3, W, 3);

  // ─── Floor — muddy ground with puddles ───
  ctx.fillStyle = '#252a14';
  ctx.fillRect(0, wallTop + tunnelH, W, 6);
  // Floor texture
  ctx.fillStyle = 'rgba(80,70,40,0.3)';
  for (let i = 0; i < 35; i++) {
    const dx = ((i * 31 + 12) - scrollX * 0.2) % W;
    const dy = wallTop + tunnelH + 2 + (i * 4) % 20;
    ctx.fillRect(dx, dy, 3 + i % 4, 1.5);
  }
  // Small puddles
  for (let i = 0; i < 4; i++) {
    const px = ((i * 210 + 80) - scrollX * 0.4) % (W + 150) - 75;
    const py = wallTop + tunnelH + 1;
    const ripple = Math.sin(t * 2 + i) * 0.15;
    ctx.fillStyle = `rgba(60,100,140,${0.25 + ripple})`;
    ctx.beginPath();
    ctx.ellipse(px, py, 12 + i * 3, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Reflection highlight
    ctx.fillStyle = `rgba(120,160,200,${0.12 + ripple})`;
    ctx.beginPath();
    ctx.ellipse(px - 3, py - 0.5, 4, 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Tunnel interior gradient ───
  const tunnelBg = ctx.createLinearGradient(0, wallTop, 0, wallTop + tunnelH);
  tunnelBg.addColorStop(0, 'rgba(20,25,10,0.5)');
  tunnelBg.addColorStop(0.15, 'rgba(10,12,5,0.15)');
  tunnelBg.addColorStop(0.85, 'rgba(10,12,5,0.15)');
  tunnelBg.addColorStop(1, 'rgba(20,25,10,0.5)');
  ctx.fillStyle = tunnelBg;
  ctx.fillRect(0, wallTop, W, tunnelH);

  // ─── Hanging roots from ceiling ───
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 10; i++) {
    const rx = ((i * 95 + 20) - scrollX * 0.4) % (W + 150) - 75;
    const rootLen = 20 + (i * 13) % 35;
    const sway = Math.sin(t * 0.8 + i) * 3;
    // Main root
    ctx.strokeStyle = `rgba(100,65,25,${0.4 + (i % 3) * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(rx, wallTop);
    ctx.bezierCurveTo(rx - 4 + sway, wallTop + rootLen * 0.3,
                       rx + 6 + sway, wallTop + rootLen * 0.6,
                       rx + 2 + sway, wallTop + rootLen);
    ctx.stroke();
    // Thin root tip
    ctx.strokeStyle = 'rgba(80,50,18,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx + 2 + sway, wallTop + rootLen);
    ctx.lineTo(rx + 3 + sway, wallTop + rootLen + 6);
    ctx.stroke();
    ctx.lineWidth = 2.5;
  }

  // ─── Glowing mushrooms on floor ───
  for (let i = 0; i < 6; i++) {
    const mx = ((i * 150 + 60) - scrollX * 0.4) % (W + 100) - 50;
    const my = wallTop + tunnelH - 2;
    const pulse = 0.25 + Math.sin(t * 1.5 + i * 1.2) * 0.1;
    // Glow halo
    ctx.fillStyle = `rgba(80,255,140,${pulse * 0.4})`;
    ctx.beginPath();
    ctx.arc(mx, my - 6, 14, 0, Math.PI * 2);
    ctx.fill();
    // Stem
    ctx.fillStyle = 'rgba(200,180,140,0.4)';
    ctx.fillRect(mx - 1.5, my - 5, 3, 7);
    // Cap
    ctx.fillStyle = `rgba(80,220,120,${pulse + 0.15})`;
    ctx.beginPath();
    ctx.arc(mx, my - 7, 6, Math.PI, 0);
    ctx.fill();
    // Cap spots
    ctx.fillStyle = `rgba(150,255,180,${pulse + 0.1})`;
    ctx.beginPath();
    ctx.arc(mx - 2, my - 8, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx + 2, my - 9, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Water drips from ceiling ───
  for (let i = 0; i < 6; i++) {
    const dx = ((i * 120 + 40) - scrollX * 0.5) % (W + 80) - 40;
    const dripPhase = (t * 1.2 + i * 0.5) % 1.5;
    if (dripPhase < 1) {
      const dy = wallTop + 6 + dripPhase * tunnelH * 0.8;
      ctx.fillStyle = `rgba(100,180,240,${0.55 * (1 - dripPhase)})`;
      ctx.beginPath();
      ctx.ellipse(dx, dy, 1.5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ─── Warehouse tunnel: metal vent shaft, fans, pipes, sparks ───

function renderWarehouseTunnel(ctx, wallTop, tunnelH, progress, t) {
  const scrollX = progress * 2000;

  // Ceiling — dark metal
  ctx.fillStyle = '#14141c';
  ctx.fillRect(0, 0, W, wallTop);
  // Floor — metal grating
  ctx.fillStyle = '#161620';
  ctx.fillRect(0, wallTop + tunnelH, W, H);

  // ─── Metal ceiling panels ───
  ctx.strokeStyle = 'rgba(140,140,170,0.3)';
  ctx.lineWidth = 1;
  for (let x = -scrollX % 64; x < W; x += 64) {
    ctx.strokeRect(x, wallTop - 18, 64, 18);
    // Panel seam highlight
    ctx.fillStyle = 'rgba(100,100,130,0.15)';
    ctx.fillRect(x, wallTop - 18, 64, 1);
  }
  // Rivets on ceiling
  ctx.fillStyle = 'rgba(170,170,200,0.25)';
  for (let x = -scrollX % 64 + 6; x < W; x += 64) {
    ctx.beginPath(); ctx.arc(x, wallTop - 3, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 52, wallTop - 3, 2, 0, Math.PI * 2); ctx.fill();
  }
  // Ceiling bottom edge
  ctx.fillStyle = '#2a2a36';
  ctx.fillRect(0, wallTop - 3, W, 3);

  // ─── Metal floor grating ───
  ctx.fillStyle = '#1e1e28';
  ctx.fillRect(0, wallTop + tunnelH, W, 5);
  ctx.strokeStyle = 'rgba(130,130,160,0.25)';
  for (let x = -scrollX % 64; x < W; x += 64) {
    ctx.strokeRect(x, wallTop + tunnelH, 64, 18);
  }
  // Grate pattern
  ctx.strokeStyle = 'rgba(100,100,130,0.15)';
  for (let x = -scrollX % 16; x < W; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, wallTop + tunnelH + 5);
    ctx.lineTo(x, wallTop + tunnelH + 20);
    ctx.stroke();
  }
  // Rivets on floor
  ctx.fillStyle = 'rgba(150,150,180,0.2)';
  for (let x = -scrollX % 64 + 6; x < W; x += 64) {
    ctx.beginPath(); ctx.arc(x, wallTop + tunnelH + 3, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 52, wallTop + tunnelH + 3, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // ─── Tunnel interior — subtle gradient ───
  const tunnelBg = ctx.createLinearGradient(0, wallTop, 0, wallTop + tunnelH);
  tunnelBg.addColorStop(0, 'rgba(18,18,26,0.5)');
  tunnelBg.addColorStop(0.15, 'rgba(10,10,15,0.15)');
  tunnelBg.addColorStop(0.85, 'rgba(10,10,15,0.15)');
  tunnelBg.addColorStop(1, 'rgba(18,18,26,0.5)');
  ctx.fillStyle = tunnelBg;
  ctx.fillRect(0, wallTop, W, tunnelH);

  // ─── Pipes running along ceiling ───
  for (let i = 0; i < 2; i++) {
    const py = wallTop + 8 + i * 14;
    ctx.fillStyle = `rgba(80,80,100,${0.3 - i * 0.08})`;
    ctx.fillRect(0, py, W, 4);
    // Pipe highlight
    ctx.fillStyle = `rgba(120,120,150,${0.2 - i * 0.05})`;
    ctx.fillRect(0, py, W, 1);
    // Pipe joints
    ctx.fillStyle = 'rgba(90,90,110,0.35)';
    for (let x = -scrollX % 120 + 40; x < W; x += 120) {
      ctx.fillRect(x - 2, py - 1, 8, 6);
    }
  }

  // ─── Spinning fans behind walls (visible in background) ───
  for (let i = 0; i < 3; i++) {
    const fx = ((i * 280 + 120) - scrollX * 0.3) % (W + 200) - 100;
    const fy = wallTop + tunnelH / 2;
    const fanAngle = t * 8 + i * 2;
    // Fan cage circle
    ctx.strokeStyle = 'rgba(120,120,150,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx, fy, 24, 0, Math.PI * 2);
    ctx.stroke();
    // Blades
    ctx.strokeStyle = 'rgba(140,140,170,0.25)';
    ctx.lineWidth = 4;
    for (let b = 0; b < 4; b++) {
      const a = fanAngle + b * Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(fx + Math.cos(a) * 22, fy + Math.sin(a) * 22);
      ctx.stroke();
    }
    // Hub
    ctx.fillStyle = 'rgba(100,100,130,0.3)';
    ctx.beginPath();
    ctx.arc(fx, fy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ─── Sparks falling from ceiling ───
  for (let i = 0; i < 5; i++) {
    const sparkPhase = (t * 3 + i * 1.7) % 2;
    if (sparkPhase < 0.5) {
      const sx = ((i * 180 + 80) - scrollX * 0.4) % W;
      const sy = wallTop + 5 + sparkPhase * tunnelH * 0.6;
      const alpha = 0.8 * (1 - sparkPhase / 0.5);
      // Main spark
      ctx.fillStyle = `rgba(255,220,80,${alpha})`;
      ctx.fillRect(sx, sy, 2, 2);
      // Trailing particles
      ctx.fillStyle = `rgba(255,160,40,${alpha * 0.6})`;
      ctx.fillRect(sx + 1, sy - 3, 1, 1);
      ctx.fillRect(sx - 1, sy - 2, 1, 1);
      ctx.fillRect(sx + 2, sy - 4, 1, 1);
    }
  }

  // ─── Warning stripes near door frames ───
  for (let i = 0; i < 3; i++) {
    const sx = ((i * 300 + 150) - scrollX * 0.5) % (W + 200) - 100;
    // Yellow/black diagonal stripes
    for (let s = 0; s < 6; s++) {
      ctx.fillStyle = s % 2 === 0 ? 'rgba(200,180,0,0.12)' : 'rgba(30,30,30,0.12)';
      ctx.save();
      ctx.translate(sx + s * 8, wallTop + tunnelH - 3);
      ctx.rotate(0.5);
      ctx.fillRect(0, 0, 5, 3);
      ctx.restore();
    }
  }

  // ─── Subtle shake/rattle ───
  const shake = Math.sin(t * 15) * 0.3;
  ctx.translate(shake, 0);
}

// ─── Mouse running through tunnel with a torch ──────────────────────────────

function renderTunnelMouse(ctx, progress, y, t) {
  const x = 100 + progress * 600;
  const runBob = Math.sin(t * 12) * 3;
  const legCycle = Math.sin(t * 12);

  ctx.save();
  ctx.translate(x, y + runBob);

  // ─── Torch held in front ───
  const torchX = 14;
  const torchY = -4;
  // Torch stick
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(8, 2);
  ctx.lineTo(torchX, torchY);
  ctx.stroke();
  // Torch wrap
  ctx.fillStyle = '#6B4A0A';
  ctx.fillRect(torchX - 2, torchY - 1, 4, 5);

  // Flame
  const flicker = Math.sin(t * 14) * 1.5 + Math.sin(t * 23) * 0.8;
  // Outer flame glow
  ctx.fillStyle = 'rgba(255,160,40,0.4)';
  ctx.beginPath();
  ctx.ellipse(torchX, torchY - 8 + flicker * 0.3, 6, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mid flame
  ctx.fillStyle = 'rgba(255,200,60,0.7)';
  ctx.beginPath();
  ctx.moveTo(torchX - 3 + flicker * 0.3, torchY);
  ctx.quadraticCurveTo(torchX - 1, torchY - 10 + flicker, torchX, torchY - 14 + flicker);
  ctx.quadraticCurveTo(torchX + 1, torchY - 10 + flicker, torchX + 3 - flicker * 0.3, torchY);
  ctx.fill();
  // Inner flame (bright)
  ctx.fillStyle = 'rgba(255,240,180,0.9)';
  ctx.beginPath();
  ctx.moveTo(torchX - 1.5, torchY);
  ctx.quadraticCurveTo(torchX, torchY - 7 + flicker * 0.5, torchX + 1.5, torchY);
  ctx.fill();

  // Body
  ctx.fillStyle = '#B0B0B8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body highlight (lit side)
  ctx.fillStyle = 'rgba(255,220,160,0.15)';
  ctx.beginPath();
  ctx.ellipse(4, -2, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#E8A0B0';
  ctx.beginPath();
  ctx.ellipse(-4, -8, 3, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -8, 3, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye (wide, alert)
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(7, -2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(8, -2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye glint from torch
  ctx.fillStyle = 'rgba(255,220,140,0.6)';
  ctx.beginPath();
  ctx.arc(8.5, -2.5, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Legs (running animation)
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.lineTo(-3 + legCycle * 4, 12);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.lineTo(3 - legCycle * 4, 12);
  ctx.stroke();

  // Tail
  ctx.strokeStyle = '#C0A0A8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.bezierCurveTo(-16, -5 + Math.sin(t * 8) * 3, -20, 2, -18, -4);
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders the "SECRET FOUND!" flash overlay.
 */
export function renderSecretFoundOverlay(ctx, rewardName, flash) {
  ctx.fillStyle = `rgba(255,215,0,${flash * 0.3})`;
  ctx.fillRect(0, 0, W, H);

  if (flash > 0.3) {
    drawText(ctx, 'SECRET FOUND!', W / 2, H / 2 - 20, {
      color: `rgba(255,215,0,${Math.min(1, flash * 2)})`,
      font: 'bold 32px monospace',
      align: 'center',
      baseline: 'middle',
    });
    drawText(ctx, rewardName, W / 2, H / 2 + 15, {
      color: `rgba(255,255,255,${Math.min(1, flash * 2)})`,
      font: '16px monospace',
      align: 'center',
    });
  }
}
