import { config } from '../config.js';
import { clamp } from '../../../shared/math-utils.js';

/**
 * Creates and manages the player (mouse) state and physics.
 */
export function createPlayer(spawnX, spawnY, unlockedWeapons) {
  return {
    x: spawnX,
    y: spawnY,
    vx: 0,
    vy: 0,
    width: config.player.width,
    height: config.player.height,
    facing: 1,            // 1 = right, -1 = left
    grounded: false,
    onWall: 0,            // -1 = left wall, 1 = right wall, 0 = none
    canDoubleJump: true,
    hp: config.player.maxHP,
    maxHP: config.player.maxHP,
    alive: true,
    invincibleTimer: 0,
    fireCooldown: 0,
    animTime: 0,
    damageTaken: false,
    score: 0,
    catsDefeated: 0,

    // Weapon inventory
    weapons: unlockedWeapons || ['pistol'],
    currentWeaponIdx: 0,
  };
}

/**
 * Returns the current weapon definition.
 */
export function getCurrentWeapon(player) {
  const weaponId = player.weapons[player.currentWeaponIdx];
  return config.weapons[weaponId] || config.weapons.pistol;
}

/**
 * Updates player movement, physics, and tile collision.
 */
export function updatePlayer(player, input, tiles, dt) {
  if (!player.alive) return;

  const { speed, jumpForce, doubleJumpForce, gravity, maxFallSpeed, wallJumpForceX, wallJumpForceY, wallSlideSpeed } = config.player;
  const ts = config.tileSize;

  // ─── Input ───
  player.vx = 0;
  if (input.isDown('ArrowLeft') || input.isDown('KeyA')) {
    player.vx = -speed;
    player.facing = -1;
  }
  if (input.isDown('ArrowRight') || input.isDown('KeyD')) {
    player.vx = speed;
    player.facing = 1;
  }

  // ─── Wall detection ───
  player.onWall = 0;
  if (!player.grounded) {
    const hw = player.width / 2;
    const hh = player.height / 2;
    const midRow = Math.floor(player.y / ts);
    // Check left wall
    const leftCol = Math.floor((player.x - hw - 1) / ts);
    if (isSolid(tiles, leftCol, midRow) && (input.isDown('ArrowLeft') || input.isDown('KeyA'))) {
      player.onWall = -1;
    }
    // Check right wall
    const rightCol = Math.floor((player.x + hw + 1) / ts);
    if (isSolid(tiles, rightCol, midRow) && (input.isDown('ArrowRight') || input.isDown('KeyD'))) {
      player.onWall = 1;
    }
  }

  // ─── Jump / Double Jump / Wall Jump ───
  const jumpPressed = input.isPressed('ArrowUp') || input.isPressed('KeyW') || input.isPressed('Space');
  if (jumpPressed) {
    if (player.grounded) {
      // Normal jump
      player.vy = -jumpForce;
      player.grounded = false;
      player.canDoubleJump = true;
    } else if (player.onWall !== 0) {
      // Wall jump — push away from wall
      player.vx = -player.onWall * wallJumpForceX;
      player.vy = -wallJumpForceY;
      player.facing = -player.onWall;
      player.onWall = 0;
      player.canDoubleJump = true;
    } else if (player.canDoubleJump) {
      // Double jump
      player.vy = -doubleJumpForce;
      player.canDoubleJump = false;
    }
  }

  // ─── Gravity ───
  player.vy += gravity * dt;
  // Wall slide: slow down fall when pressing into a wall
  if (player.onWall !== 0 && player.vy > 0) {
    player.vy = Math.min(player.vy, wallSlideSpeed);
  } else {
    player.vy = Math.min(player.vy, maxFallSpeed);
  }

  // ─── Move X & collide ───
  player.x += player.vx * dt;
  resolveCollisionX(player, tiles, ts);

  // ─── Move Y & collide ───
  const prevY = player.y;
  player.y += player.vy * dt;
  player.grounded = false;
  resolveCollisionY(player, tiles, ts, prevY);

  // Reset double jump when grounded
  if (player.grounded) {
    player.canDoubleJump = true;
  }

  // ─── Spike check — any overlap with spike tiles damages ───
  {
    const hw = player.width / 2;
    const hh = player.height / 2;
    const sLeft = Math.floor((player.x - hw + 2) / ts);
    const sRight = Math.floor((player.x + hw - 2) / ts);
    const sTop = Math.floor((player.y - hh + 2) / ts);
    const sBot = Math.floor((player.y + hh - 2) / ts);
    player._touchedSpike = false;
    for (let r = sTop; r <= sBot; r++) {
      for (let c = sLeft; c <= sRight; c++) {
        if (isSpike(tiles, c, r)) {
          player._touchedSpike = true;
        }
      }
    }
  }

  // ─── Weapon switching (Q/E or 1-4) ───
  if (player.weapons.length > 1) {
    if (input.isPressed('KeyQ')) {
      player.currentWeaponIdx = (player.currentWeaponIdx - 1 + player.weapons.length) % player.weapons.length;
    }
    if (input.isPressed('KeyE')) {
      player.currentWeaponIdx = (player.currentWeaponIdx + 1) % player.weapons.length;
    }
    for (let i = 0; i < Math.min(player.weapons.length, 4); i++) {
      if (input.isPressed(`Digit${i + 1}`)) {
        player.currentWeaponIdx = i;
      }
    }
  }

  // ─── Timers ───
  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= dt;
  }
  if (player.fireCooldown > 0) {
    player.fireCooldown -= dt;
  }

  // Animation
  if (player.vx !== 0) {
    player.animTime += dt;
  } else {
    player.animTime = 0;
  }

  // Fall off bottom = death
  if (player.y > tiles.length * ts + 100) {
    player.hp = 0;
    player.alive = false;
  }
}

/**
 * Damages the player if not invincible.
 */
export function damagePlayer(player, amount) {
  if (player.invincibleTimer > 0 || !player.alive) return false;
  player.hp -= amount;
  player.damageTaken = true;
  player.invincibleTimer = config.player.invincibleTime;
  if (player.hp <= 0) {
    player.hp = 0;
    player.alive = false;
  }
  return true;
}

/**
 * Check if player can fire, and reset cooldown.
 */
export function tryShoot(player, input) {
  if (!player.alive) return false;
  if (player.fireCooldown > 0) return false;

  const weapon = getCurrentWeapon(player);
  const fireInput = weapon.auto
    ? (input.isDown('KeyZ') || input.isDown('KeyX') || input.getMouse().down)
    : (input.isPressed('KeyZ') || input.isPressed('KeyX') || input.getMouse().clicked);

  if (fireInput) {
    player.fireCooldown = weapon.fireRate;
    return true;
  }
  return false;
}

// ─── Tile Collision Helpers ──────────────────────────────────────

function isSolid(tiles, col, row) {
  if (row < 0 || row >= tiles.length) return false;
  if (col < 0 || col >= tiles[0].length) return true; // walls
  return tiles[row][col] === 1; // solid block
}

function isPlatform(tiles, col, row) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
  return tiles[row][col] === 2;
}

function isSpike(tiles, col, row) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
  return tiles[row][col] === 3;
}

function isSpring(tiles, col, row) {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
  return tiles[row][col] === 4;
}

function resolveCollisionX(player, tiles, ts) {
  const hw = player.width / 2;
  const hh = player.height / 2;

  const top = Math.floor((player.y - hh) / ts);
  const bot = Math.floor((player.y + hh - 1) / ts);

  if (player.vx < 0) {
    const col = Math.floor((player.x - hw) / ts);
    for (let r = top; r <= bot; r++) {
      if (isSolid(tiles, col, r)) {
        player.x = (col + 1) * ts + hw;
        player.vx = 0;
        break;
      }
    }
  } else if (player.vx > 0) {
    const col = Math.floor((player.x + hw) / ts);
    for (let r = top; r <= bot; r++) {
      if (isSolid(tiles, col, r)) {
        player.x = col * ts - hw;
        player.vx = 0;
        break;
      }
    }
  }

  // Clamp to level bounds
  player.x = Math.max(hw, player.x);
  if (tiles[0]) {
    player.x = Math.min(tiles[0].length * ts - hw, player.x);
  }
}

function resolveCollisionY(player, tiles, ts, prevY) {
  const hw = player.width / 2;
  const hh = player.height / 2;

  const left = Math.floor((player.x - hw + 2) / ts);
  const right = Math.floor((player.x + hw - 2) / ts);

  if (player.vy > 0) {
    // Falling — check ground & platforms
    const row = Math.floor((player.y + hh) / ts);
    for (let c = left; c <= right; c++) {
      if (isSolid(tiles, c, row)) {
        player.y = row * ts - hh;
        player.vy = 0;
        player.grounded = true;
        break;
      }
      // One-way platforms — use actual previous Y, not hardcoded frame time
      if (isPlatform(tiles, c, row) && player.vy > 0) {
        const prevBottom = (prevY !== undefined ? prevY : player.y) + hh;
        if (prevBottom <= row * ts + 4) {
          player.y = row * ts - hh;
          player.vy = 0;
          player.grounded = true;
          break;
        }
      }
      // Springs
      if (isSpring(tiles, c, row)) {
        player.y = row * ts - hh;
        player.vy = -config.player.jumpForce * 1.5;
        player.grounded = false;
        player.canDoubleJump = true;
        break;
      }
    }
  } else if (player.vy < 0) {
    // Rising — check ceiling
    const row = Math.floor((player.y - hh) / ts);
    for (let c = left; c <= right; c++) {
      if (isSolid(tiles, c, row)) {
        player.y = (row + 1) * ts + hh;
        player.vy = 0;
        break;
      }
    }
  }
}
