import { config } from '../config.js';

/**
 * Creates bullet(s) fired by the player using their current weapon.
 * Returns an array of bullets (shotgun fires multiple).
 */
export function createBullets(x, y, facing, weapon) {
  const bullets = [];

  if (weapon.pellets && weapon.pellets > 1) {
    // Shotgun-style: multiple pellets in a spread
    for (let i = 0; i < weapon.pellets; i++) {
      const angleOffset = (i - (weapon.pellets - 1) / 2) * weapon.spread;
      const vx = Math.cos(angleOffset) * weapon.speed * facing;
      const vy = Math.sin(angleOffset) * weapon.speed;
      bullets.push({
        x, y, vx, vy,
        width: weapon.width,
        height: weapon.height,
        damage: weapon.damage,
        fromEnemy: false,
        life: 1.5,
        weaponId: weapon.id,
        color: weapon.color,
        trailColor: weapon.trailColor,
        explosive: weapon.explosive || false,
        splashRadius: weapon.splashRadius || 0,
      });
    }
  } else {
    bullets.push({
      x, y,
      vx: weapon.speed * facing,
      vy: 0,
      width: weapon.width,
      height: weapon.height,
      damage: weapon.damage,
      fromEnemy: false,
      life: 2,
      weaponId: weapon.id,
      color: weapon.color,
      trailColor: weapon.trailColor,
      explosive: weapon.explosive || false,
      splashRadius: weapon.splashRadius || 0,
    });
  }

  return bullets;
}

/**
 * Updates all projectiles (player bullets and enemy projectiles).
 */
export function updateProjectiles(projectiles, tiles, dt) {
  const ts = config.tileSize;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    // Remove if expired
    if (p.life <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    // Remove if hitting a solid tile
    const col = Math.floor(p.x / ts);
    const row = Math.floor(p.y / ts);
    if (row >= 0 && row < tiles.length && col >= 0 && col < tiles[0].length) {
      if (tiles[row][col] === 1) {
        projectiles.splice(i, 1);
        continue;
      }
    }

    // Remove if off screen bounds
    if (p.x < -200 || p.x > tiles[0].length * ts + 200 ||
        p.y < -200 || p.y > tiles.length * ts + 200) {
      projectiles.splice(i, 1);
    }
  }
}

/**
 * Checks bullet-enemy collisions. Returns array of { bulletIdx, enemyIdx } hits.
 * Only counts hits on enemies within the camera viewport (+ margin) so
 * firing off-screen doesn't kill enemies the player can't even see.
 */
export function checkBulletEnemyHits(projectiles, enemies, camera) {
  const hits = [];
  const margin = 64; // small grace margin beyond screen edge
  const viewLeft = camera ? camera.x - margin : -Infinity;
  const viewRight = camera ? camera.x + config.width + margin : Infinity;
  const viewTop = camera ? camera.y - margin : -Infinity;
  const viewBottom = camera ? camera.y + config.height + margin : Infinity;

  for (let bi = projectiles.length - 1; bi >= 0; bi--) {
    const b = projectiles[bi];
    if (b.fromEnemy) continue;
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei];
      if (!e.alive) continue;
      // Skip enemies that are off-screen
      if (e.x < viewLeft || e.x > viewRight || e.y < viewTop || e.y > viewBottom) continue;
      if (aabbOverlap(b, e)) {
        hits.push({ bulletIdx: bi, enemyIdx: ei });
        break;
      }
    }
  }
  return hits;
}

/**
 * Checks splash damage from an explosive bullet hitting at (x,y).
 * Returns array of enemy indices in splash radius.
 */
export function checkSplashDamage(x, y, radius, enemies, excludeIdx) {
  const splashed = [];
  for (let i = 0; i < enemies.length; i++) {
    if (i === excludeIdx || !enemies[i].alive) continue;
    const dx = enemies[i].x - x;
    const dy = enemies[i].y - y;
    if (dx * dx + dy * dy < radius * radius) {
      splashed.push(i);
    }
  }
  return splashed;
}

/**
 * Checks enemy bullet-player collisions.
 */
export function checkEnemyBulletPlayerHits(projectiles, player) {
  const hits = [];
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p.fromEnemy) continue;
    if (aabbOverlap(p, player)) {
      hits.push(i);
    }
  }
  return hits;
}

function aabbOverlap(a, b) {
  const ahw = a.width / 2;
  const ahh = a.height / 2;
  const bhw = b.width / 2;
  const bhh = b.height / 2;
  return (
    a.x - ahw < b.x + bhw &&
    a.x + ahw > b.x - bhw &&
    a.y - ahh < b.y + bhh &&
    a.y + ahh > b.y - bhh
  );
}
