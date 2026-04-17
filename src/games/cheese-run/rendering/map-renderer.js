import { config } from '../config.js';
import { mapNodes, mapPaths, mapRegions } from '../data/map-data.js';
import { drawText } from '../../../shared/canvas-utils.js';

const W = 800;
const H = 600;

// Show touch-friendly prompt text on touchscreens.
const TOUCH = typeof window !== 'undefined' &&
  ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);

/**
 * Renders the full world map (level select).
 */
export function renderWorldMap(ctx, state, totalTime) {
  const { selectedNode, unlockedLevels, secretLevelsUnlocked, mouseMapX, mouseMapY } = state;

  // ─── Background ───
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a1e');
  grad.addColorStop(0.5, '#121228');
  grad.addColorStop(1, '#0e0e20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 60; i++) {
    const sx = (i * 73 + 17) % W;
    const sy = (i * 47 + 31) % H;
    const sz = 0.5 + (i * 13 % 3) * 0.5;
    const twinkle = 0.5 + Math.sin(totalTime * 2 + i * 0.8) * 0.5;
    ctx.globalAlpha = 0.05 + twinkle * 0.12;
    ctx.beginPath();
    ctx.arc(sx, sy, sz, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ─── Title ───
  drawText(ctx, 'CHEESE RUN', W / 2, 36, {
    color: '#FFD700',
    font: 'bold 32px monospace',
    align: 'center',
  });
  drawText(ctx, 'Select your destination', W / 2, 58, {
    color: '#8892b0',
    font: '11px monospace',
    align: 'center',
  });

  // ─── World regions ───
  for (const region of mapRegions) {
    renderRegion(ctx, region, totalTime);
  }

  // ─── Paths ───
  for (const [a, b] of mapPaths) {
    const nodeA = mapNodes[a];
    const nodeB = mapNodes[b];
    if (!nodeA || !nodeB) continue;

    const aVisible = isNodeVisible(nodeA, unlockedLevels, secretLevelsUnlocked);
    const bVisible = isNodeVisible(nodeB, unlockedLevels, secretLevelsUnlocked);
    if (!aVisible && !bVisible) continue;

    const aUnlocked = isNodeAccessible(nodeA, unlockedLevels, secretLevelsUnlocked);
    const bUnlocked = isNodeAccessible(nodeB, unlockedLevels, secretLevelsUnlocked);
    const bothUnlocked = aUnlocked && bUnlocked;

    // Draw path
    ctx.strokeStyle = bothUnlocked ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.08)';
    ctx.lineWidth = bothUnlocked ? 2 : 1;
    ctx.setLineDash(bothUnlocked ? [] : [4, 4]);
    ctx.beginPath();
    ctx.moveTo(nodeA.x, nodeA.y);
    ctx.lineTo(nodeB.x, nodeB.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ─── Nodes ───
  for (const node of mapNodes) {
    if (!isNodeVisible(node, unlockedLevels, secretLevelsUnlocked)) continue;
    const accessible = isNodeAccessible(node, unlockedLevels, secretLevelsUnlocked);
    const selected = node.id === selectedNode;
    renderNode(ctx, node, accessible, selected, totalTime);
  }

  // ─── Mouse character on selected node ───
  renderMapMouse(ctx, mouseMapX, mouseMapY, totalTime);

  // ─── Selected level info ───
  const selNode = mapNodes[selectedNode];
  if (selNode) {
    const accessible = isNodeAccessible(selNode, unlockedLevels, secretLevelsUnlocked);
    drawText(ctx, selNode.name, W / 2, H - 52, {
      color: accessible ? '#FFF' : '#555',
      font: 'bold 16px monospace',
      align: 'center',
    });

    const worldNames = ['The Kitchen', 'The Pantry', 'The Garden', 'The Sewers', 'The Rooftops', 'The Warehouse'];
    drawText(ctx, worldNames[selNode.world] || '', W / 2, H - 36, {
      color: accessible ? config.worlds[selNode.world].accentColor : '#444',
      font: '11px monospace',
      align: 'center',
    });

    if (accessible) {
      ctx.globalAlpha = 0.5 + Math.sin(totalTime * 3) * 0.3;
      drawText(ctx, TOUCH ? 'Tap JUMP to play' : 'Press ENTER to play', W / 2, H - 16, {
        color: '#FFD700',
        font: '12px monospace',
        align: 'center',
      });
      ctx.globalAlpha = 1;
    } else {
      drawText(ctx, selNode.type === 'secret' ? '? ? ?' : 'LOCKED', W / 2, H - 16, {
        color: '#555',
        font: '12px monospace',
        align: 'center',
      });
    }
  }

  // Controls
  drawText(ctx, 'Arrows: Navigate  |  ENTER: Play  |  ESC: Exit', W / 2, H - 2, {
    color: '#444',
    font: '9px monospace',
    align: 'center',
  });
}

// ─── Region background ──────────────────────────────────────────

function renderRegion(ctx, region, t) {
  ctx.fillStyle = region.fill;
  ctx.strokeStyle = region.stroke;
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  const pts = region.points;
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0], pts[i][1]);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Region label
  drawText(ctx, region.label, region.labelPos[0], region.labelPos[1], {
    color: region.labelColor,
    font: 'bold 12px monospace',
    align: 'center',
  });

  // Themed decorations per world
  if (region.world === 0) renderKitchenDecor(ctx, region, t);
  else if (region.world === 1) renderPantryDecor(ctx, region, t);
  else if (region.world === 2) renderGardenDecor(ctx, region, t);
  else if (region.world === 3) renderSewersDecor(ctx, region, t);
  else if (region.world === 4) renderRooftopsDecor(ctx, region, t);
  else if (region.world === 5) renderWarehouseDecor(ctx, region, t);
}

function renderKitchenDecor(ctx, region, t) {
  ctx.fillStyle = 'rgba(180,140,60,0.08)';
  for (let i = 0; i < 3; i++) {
    const x = 60 + i * 70;
    const y = 165 + (i % 2) * 15;
    ctx.beginPath();
    ctx.arc(x, y, 6, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 2; i++) {
    const x = 90 + i * 80;
    const y = 155 + Math.sin(t * 0.8 + i) * 5;
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderPantryDecor(ctx, region, t) {
  // Jars on shelves
  ctx.fillStyle = 'rgba(200,160,80,0.06)';
  for (let i = 0; i < 4; i++) {
    const x = 300 + i * 50;
    const y = 150 + (i % 2) * 12;
    ctx.fillRect(x, y, 8, 14);
    ctx.fillStyle = 'rgba(160,120,60,0.08)';
    ctx.fillRect(x - 1, y - 3, 10, 3);
    ctx.fillStyle = 'rgba(200,160,80,0.06)';
  }
  // Dust motes
  ctx.fillStyle = 'rgba(255,230,150,0.06)';
  for (let i = 0; i < 3; i++) {
    const x = 320 + Math.sin(t * 0.5 + i * 2) * 40;
    const y = 130 + Math.cos(t * 0.3 + i * 1.5) * 15;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function renderGardenDecor(ctx, region, t) {
  const colors = ['rgba(255,100,120,0.1)', 'rgba(255,200,50,0.1)', 'rgba(180,120,255,0.1)'];
  for (let i = 0; i < 5; i++) {
    const x = 530 + i * 45;
    const y = 165 + (i % 3) * 10;
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(60,140,40,0.08)';
    ctx.fillRect(x - 0.5, y + 3, 1, 6);
  }
  // Butterfly
  const bx = 620 + Math.sin(t * 0.7) * 25;
  const by = 155 + Math.sin(t * 1.1) * 10;
  const wingFlap = Math.sin(t * 6) * 0.6;
  ctx.fillStyle = 'rgba(255,200,100,0.1)';
  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(1, wingFlap);
  ctx.beginPath();
  ctx.ellipse(-3, 0, 4, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(3, 0, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function renderSewersDecor(ctx, region, t) {
  // Dripping water
  ctx.fillStyle = 'rgba(90,180,150,0.08)';
  for (let i = 0; i < 4; i++) {
    const x = 540 + i * 50;
    const drip = (t * 1.5 + i * 0.8) % 2;
    const y = 290 + drip * 30;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pipe shapes
  ctx.strokeStyle = 'rgba(90,130,120,0.06)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 2; i++) {
    const x = 560 + i * 100;
    ctx.beginPath();
    ctx.moveTo(x, 280);
    ctx.lineTo(x, 360);
    ctx.stroke();
  }
}

function renderRooftopsDecor(ctx, region, t) {
  // Tiny stars
  ctx.fillStyle = 'rgba(200,200,255,0.08)';
  for (let i = 0; i < 6; i++) {
    const x = 280 + (i * 37) % 180;
    const y = 320 + (i * 23) % 50;
    const twinkle = 0.3 + Math.sin(t * 3 + i * 1.2) * 0.3;
    ctx.globalAlpha = twinkle * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // Moon sliver
  ctx.fillStyle = 'rgba(220,220,240,0.06)';
  ctx.beginPath();
  ctx.arc(460, 325, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(70,70,110,0.15)';
  ctx.beginPath();
  ctx.arc(463, 323, 7, 0, Math.PI * 2);
  ctx.fill();
}

function renderWarehouseDecor(ctx, region, t) {
  ctx.fillStyle = 'rgba(100,90,70,0.08)';
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * 50;
    const y = 420 + (i % 2) * 15;
    ctx.fillRect(x, y, 10, 8);
    ctx.strokeStyle = 'rgba(140,120,80,0.06)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x, y, 10, 8);
  }
  // Sparks
  for (let i = 0; i < 3; i++) {
    const spark = (t * 2 + i * 1.5) % 3;
    if (spark < 0.3) {
      ctx.fillStyle = 'rgba(255,200,50,0.15)';
      const sx = 80 + i * 60;
      const sy = 400 + Math.random() * 20;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}

// ─── Node rendering ─────────────────────────────────────────────

function renderNode(ctx, node, accessible, selected, t) {
  const { x, y, type } = node;
  const worldColors = ['#D4A017', '#C98A17', '#7BC96A', '#5AB89A', '#8888CC', '#9A9ABA'];
  const color = worldColors[node.world] || '#FFF';

  // Selection ring
  if (selected) {
    const pulse = 14 + Math.sin(t * 3) * 3;
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, pulse, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (type === 'boss') {
    // Boss node — larger, diamond shape
    const sz = 12;
    ctx.fillStyle = accessible ? color : '#333';
    ctx.beginPath();
    ctx.moveTo(x, y - sz);
    ctx.lineTo(x + sz, y);
    ctx.lineTo(x, y + sz);
    ctx.lineTo(x - sz, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accessible ? '#FFF' : '#444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Skull icon for boss
    if (accessible) {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(x - 2, y - 1, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 2, y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'secret') {
    // Secret node — glowing star shape
    const pulse = 0.6 + Math.sin(t * 2) * 0.2;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#FFD700';
    drawStar(ctx, x, y, 5, 10, 5);
    ctx.fill();

    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 1;
    drawStar(ctx, x, y, 5, 10, 5);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ? mark
    drawText(ctx, '?', x, y - 1, {
      color: '#000',
      font: 'bold 8px monospace',
      align: 'center',
      baseline: 'middle',
    });
  } else {
    // Regular level node — circle
    const sz = 9;
    ctx.fillStyle = accessible ? color : '#333';
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = accessible ? '#FFF' : '#444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, sz, 0, Math.PI * 2);
    ctx.stroke();

    // Level number
    const levelNum = node.levelIdx + 1;
    drawText(ctx, `${levelNum}`, x, y - 1, {
      color: accessible ? '#000' : '#555',
      font: 'bold 10px monospace',
      align: 'center',
      baseline: 'middle',
    });
  }

  // Lock icon for inaccessible nodes
  if (!accessible && type !== 'secret') {
    ctx.fillStyle = '#666';
    ctx.fillRect(x - 3, y + 10, 6, 5);
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y + 10, 3, Math.PI, 0);
    ctx.stroke();
  }
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

// ─── Map mouse character ────────────────────────────────────────

function renderMapMouse(ctx, x, y, t) {
  const bob = Math.sin(t * 4) * 2;

  ctx.save();
  ctx.translate(x, y - 20 + bob);

  // Body
  ctx.fillStyle = '#B0B0B8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#E8A0B0';
  ctx.beginPath();
  ctx.ellipse(-5, -6, 3, 4, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(5, -6, 3, 4, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(3, -1, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#FF8888';
  ctx.beginPath();
  ctx.arc(7, 0, 1, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(6, -1); ctx.lineTo(12, -3);
  ctx.moveTo(6, 1); ctx.lineTo(12, 2);
  ctx.stroke();

  ctx.restore();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Visibility / accessibility checks ──────────────────────────

export function isNodeAccessible(node, unlockedLevels, secretLevelsUnlocked) {
  if (node.type === 'secret') {
    return secretLevelsUnlocked && secretLevelsUnlocked.includes(node.levelIdx);
  }
  return node.levelIdx < unlockedLevels;
}

export function isNodeVisible(node, unlockedLevels, secretLevelsUnlocked) {
  if (node.type === 'secret') {
    return secretLevelsUnlocked && secretLevelsUnlocked.includes(node.levelIdx);
  }
  // Regular/boss nodes always visible (but may be locked)
  return true;
}
