import { config } from '../config.js';
import { enemyTypes } from '../data/enemy-defs.js';

/**
 * Creates an enemy instance from a spawn definition.
 */
export function createEnemy(entityDef) {
  const def = enemyTypes[entityDef.type];
  if (!def) return null;

  return {
    ...def,
    x: entityDef.x,
    y: entityDef.y,
    vx: def.speed * (Math.random() > 0.5 ? 1 : -1),
    vy: 0,
    currentHP: def.hp,
    alive: true,
    facing: 1,
    animTime: 0,
    jumpTimer: def.jumpInterval || 0,
    shootTimer: (def.shootInterval || 999) * (0.5 + Math.random()),
    flashTimer: 0,
    patrolLeft: entityDef.x - 120,
    patrolRight: entityDef.x + 120,
  };
}

/**
 * Updates all enemies: movement, AI, tile collision.
 * Returns array of new enemy projectiles.
 */
export function updateEnemies(enemies, tiles, playerX, playerY, dt) {
  const ts = config.tileSize;
  const newProjectiles = [];

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (!e.alive) continue;

    e.animTime += dt;

    // Gravity
    e.vy += config.player.gravity * dt;
    e.vy = Math.min(e.vy, config.player.maxFallSpeed);

    // Patrol movement
    movePatrol(e, dt);

    // Jumping (jumper type)
    if (e.type === 'jumper') {
      e.jumpTimer -= dt;
      if (e.jumpTimer <= 0 && isGrounded(e, tiles, ts)) {
        e.vy = -(e.jumpForce || 350);
        e.jumpTimer = e.jumpInterval || 2.0;
      }
    }

    // Shooting (any enemy with shootInterval)
    if (e.shootInterval) {
      e.shootTimer -= dt;
      if (e.shootTimer <= 0) {
        e.shootTimer = e.shootInterval;
        const dx = playerX - e.x;
        const dy = playerY - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const range = e.type === 'boss' ? 500 : 350;
        if (dist < range && dist > 0) {
          const bSpeed = e.bulletSpeed || 200;
          newProjectiles.push({
            x: e.x + e.facing * (e.width / 2),
            y: e.y,
            vx: (dx / dist) * bSpeed,
            vy: (dy / dist) * bSpeed,
            width: e.type === 'boss' ? 10 : 8,
            height: e.type === 'boss' ? 10 : 8,
            damage: 1,
            fromEnemy: true,
            life: 3,
            projectileType: e.projectileType || 'hairball',
          });
        }
      }
    }

    // Move X
    e.x += e.vx * dt;
    resolveEnemyX(e, tiles, ts);

    // Move Y
    e.y += e.vy * dt;
    resolveEnemyY(e, tiles, ts);

    // Fall off map
    if (e.y > tiles.length * ts + 100) {
      e.alive = false;
    }

    e.facing = e.vx >= 0 ? 1 : -1;
    if (e.flashTimer > 0) e.flashTimer -= dt;
  }

  return newProjectiles;
}

/**
 * Damages an enemy and returns true if it died.
 */
export function damageEnemy(enemy, amount) {
  if (!enemy.alive) return false;
  enemy.currentHP -= amount;
  enemy.flashTimer = 0.15;
  if (enemy.currentHP <= 0) {
    enemy.alive = false;
    return true;
  }
  return false;
}

// ─── Helpers ─────────────────────────────────────────────────────

function movePatrol(e, dt) {
  if (e.x <= e.patrolLeft) {
    e.vx = Math.abs(e.vx);
  } else if (e.x >= e.patrolRight) {
    e.vx = -Math.abs(e.vx);
  }
}

function isGrounded(e, tiles, ts) {
  const hw = e.width / 2;
  const hh = e.height / 2;
  const row = Math.floor((e.y + hh + 1) / ts);
  const left = Math.floor((e.x - hw + 2) / ts);
  const right = Math.floor((e.x + hw - 2) / ts);
  for (let c = left; c <= right; c++) {
    if (isSolid(tiles, c, row) || isPlatform(tiles, c, row)) return true;
  }
  return false;
}

function isSolid(tiles, col, row) {
  if (row < 0 || row >= tiles.length) return false;
  if (col < 0 || col >= tiles[0].length) return true;
  return tiles[row][col] === 1;
}

function isPlatform(tiles, col, row) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
  return tiles[row][col] === 2;
}

function resolveEnemyX(e, tiles, ts) {
  const hw = e.width / 2;
  const hh = e.height / 2;
  const top = Math.floor((e.y - hh) / ts);
  const bot = Math.floor((e.y + hh - 1) / ts);

  if (e.vx < 0) {
    const col = Math.floor((e.x - hw) / ts);
    for (let r = top; r <= bot; r++) {
      if (isSolid(tiles, col, r)) {
        e.x = (col + 1) * ts + hw;
        e.vx = Math.abs(e.vx);
        break;
      }
    }
  } else if (e.vx > 0) {
    const col = Math.floor((e.x + hw) / ts);
    for (let r = top; r <= bot; r++) {
      if (isSolid(tiles, col, r)) {
        e.x = col * ts - hw;
        e.vx = -Math.abs(e.vx);
        break;
      }
    }
  }

  if (isGrounded(e, tiles, ts)) {
    const nextCol = Math.floor((e.x + (e.vx > 0 ? hw + 4 : -hw - 4)) / ts);
    const belowRow = Math.floor((e.y + hh + 4) / ts);
    if (!isSolid(tiles, nextCol, belowRow) && !isPlatform(tiles, nextCol, belowRow)) {
      e.vx = -e.vx;
    }
  }
}

function resolveEnemyY(e, tiles, ts) {
  const hw = e.width / 2;
  const hh = e.height / 2;
  const left = Math.floor((e.x - hw + 2) / ts);
  const right = Math.floor((e.x + hw - 2) / ts);

  if (e.vy > 0) {
    const row = Math.floor((e.y + hh) / ts);
    for (let c = left; c <= right; c++) {
      if (isSolid(tiles, c, row) || isPlatform(tiles, c, row)) {
        e.y = row * ts - hh;
        e.vy = 0;
        break;
      }
    }
  } else if (e.vy < 0) {
    const row = Math.floor((e.y - hh) / ts);
    for (let c = left; c <= right; c++) {
      if (isSolid(tiles, c, row)) {
        e.y = (row + 1) * ts + hh;
        e.vy = 0;
        break;
      }
    }
  }
}
