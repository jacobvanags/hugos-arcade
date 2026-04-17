import { config } from './config.js';
import { achievements as achievementDefs } from './achievements.js';
import { levels } from './data/levels.js';
import { mapNodes, findNodeInDirection } from './data/map-data.js';
import { createInputManager } from '../../shared/input-manager.js';
import { createParticleSystem, emitExplosion, emitSparkle } from '../../shared/particle-system.js';
import { createPlayer, updatePlayer, damagePlayer, tryShoot, getCurrentWeapon } from './systems/player-system.js';
import { createEnemy, updateEnemies, damageEnemy } from './systems/enemy-system.js';
import { createBullets, updateProjectiles, checkBulletEnemyHits, checkEnemyBulletPlayerHits, checkSplashDamage } from './systems/projectile-system.js';
import { createCamera, updateCamera, shakeCamera, getCameraOffset } from './systems/camera-system.js';
import { createSecretState, updateSecret, loadBonusRoom } from './systems/secret-system.js';
import { renderPlayer } from './rendering/player-renderer.js';
import { renderEnemy } from './rendering/enemy-renderer.js';
import { renderLevel, renderPickups, renderGoal, renderSecretObjects } from './rendering/level-renderer.js';
import { renderHUD, renderLevelComplete, renderGameOver, renderPause } from './rendering/hud-renderer.js';
import { renderProjectiles, renderFloatingTexts, updateFloatingTexts, addFloatingText } from './rendering/effects-renderer.js';
import { renderWorldMap, isNodeAccessible, isNodeVisible } from './rendering/map-renderer.js';
import { renderTunnel, renderSecretFoundOverlay } from './rendering/tunnel-renderer.js';

export const manifest = {
  id: 'cheese-run',
  title: 'Cheese Run',
  description: 'A brave mouse with a gun battles through an army of cats to find the golden cheese!',
  genre: ['platformer', 'action'],
  version: '1.0.0',
  thumbnail: null,
  comingSoon: false,
  controls: {
    keyboard: {
      'Arrow Keys / WASD': 'Move & Jump (double jump + wall jump!)',
      'Z / X / Click': 'Shoot',
      'Q / E / 1-4': 'Switch Weapon',
      'P': 'Pause',
      'Escape': 'Exit',
    },
  },
};

export { achievementDefs as achievements };

export class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.api = null;
    this.input = null;
    this.particles = null;

    this.state = 'map'; // 'map' | 'playing' | 'paused' | 'complete' | 'dead' | 'tunnel' | 'bonus'
    this.totalTime = 0;
    this.levelTime = 0;

    // Map state
    this.selectedNode = 0;
    this.mouseMapX = mapNodes[0].x;
    this.mouseMapY = mapNodes[0].y;

    // Progression
    this.unlockedLevels = 1;
    this.secretLevelsUnlocked = []; // array of level indices (9, 10, 11)
    this.unlockedWeapons = ['pistol'];
    this.lastWeaponUnlock = null;
    this.lastWeaponIdx = 0;

    // In-level state
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.floatingTexts = [];
    this.camera = null;
    this.currentLevel = null;
    this.currentLevelIdx = 0;

    // Secret system
    this.secretState = null;        // active secret puzzle in current level
    this.activeTunnel = null;       // { theme, duration, timer, secret }
    this.bonusSecret = null;        // the secret def that triggered the bonus room
    this.secretFoundFlash = 0;      // overlay timer

    // Stats
    this.totalScore = 0;
    this.totalCatsDefeated = 0;
  }

  init(canvas, arcadeAPI) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.api = arcadeAPI;
    this.input = createInputManager(canvas);
    this.particles = createParticleSystem({ maxParticles: 500 });

    canvas.width = config.width;
    canvas.height = config.height;

    const saved = this.api.progress.load('progress');
    if (saved) {
      this.unlockedLevels = saved.unlockedLevels || 1;
      this.totalCatsDefeated = saved.totalCatsDefeated || 0;
      this.totalScore = saved.totalScore || 0;
      this.unlockedWeapons = saved.unlockedWeapons || ['pistol'];
      this.secretLevelsUnlocked = saved.secretLevelsUnlocked || [];
    }
  }

  // ─── Level loading ────────────────────────────────────────────

  loadLevel(levelIdx) {
    const level = levels[levelIdx];
    if (!level) return;

    this.currentLevel = level;
    this.currentLevelIdx = levelIdx;
    this.state = 'playing';
    this.levelTime = 0;
    this.lastWeaponUnlock = null;
    this.secretFoundFlash = 0;

    // Set max HP based on world progression
    const worldHP = config.worldHP[level.world] || config.player.maxHP;

    this.player = createPlayer(level.spawn.x, level.spawn.y, [...this.unlockedWeapons]);
    this.player.hp = worldHP;
    this.player.maxHP = worldHP;

    // Restore last selected weapon
    this.player.currentWeaponIdx = Math.min(this.lastWeaponIdx, this.player.weapons.length - 1);

    // Spawn safety
    this.player.invincibleTimer = config.player.spawnSafetyTime;

    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    this.floatingTexts = [];

    for (const ent of level.entities) {
      if (ent.type === 'cheese' || ent.type === 'heart' || ent.type === 'reward') {
        this.pickups.push({ ...ent, collected: false });
      } else {
        const enemy = createEnemy(ent);
        if (enemy) {
          if (enemy.type === 'boss') {
            const scaling = config.bossScaling[level.world];
            if (scaling) {
              enemy.currentHP = Math.round(enemy.hp * scaling.hpMult);
              enemy.hp = enemy.currentHP;
              enemy.shootInterval = enemy.shootInterval * scaling.shootMult;
              enemy.bulletSpeed = enemy.bulletSpeed * scaling.speedMult;
              enemy.bossName = scaling.name;
            }
          }
          this.enemies.push(enemy);
        }
      }
    }

    this.camera = createCamera();
    this.camera.x = Math.max(0, level.spawn.x - config.width / 2);
    this.camera.y = Math.max(0, level.spawn.y - config.height / 2);

    // Initialize secret state for this level
    this.secretState = createSecretState(levelIdx, this.secretLevelsUnlocked);

    this.particles.clear();
  }

  loadBonusRoomFromSecret(secret) {
    const room = loadBonusRoom(secret);
    if (!room) { this.state = 'map'; return; }

    this.bonusSecret = secret;
    this.currentLevel = { ...room, goal: room.goal };
    this.state = 'bonus';
    this.levelTime = 0;

    const worldHP = config.worldHP[room.world] || config.player.maxHP;
    this.player = createPlayer(room.spawn.x, room.spawn.y, [...this.unlockedWeapons]);
    this.player.hp = worldHP;
    this.player.maxHP = worldHP;
    this.player.currentWeaponIdx = Math.min(this.lastWeaponIdx, this.player.weapons.length - 1);

    this.enemies = [];
    this.pickups = [];
    this.projectiles = [];
    this.floatingTexts = [];

    for (const ent of room.entities) {
      if (ent.type === 'cheese' || ent.type === 'heart' || ent.type === 'reward') {
        this.pickups.push({ ...ent, collected: false });
      }
    }

    this.camera = createCamera();
    this.camera.x = Math.max(0, room.spawn.x - config.width / 2);
    this.camera.y = Math.max(0, room.spawn.y - config.height / 2);

    this.secretState = null;
    this.particles.clear();
  }

  // ─── Update loop ──────────────────────────────────────────────

  update(dt) {
    this.totalTime += dt;

    switch (this.state) {
      case 'map':      this.updateMap(dt); break;
      case 'playing':  this.updatePlaying(dt); break;
      case 'bonus':    this.updateBonus(dt); break;
      case 'paused':   this.updatePaused(dt); break;
      case 'complete': this.updateComplete(dt); break;
      case 'dead':     this.updateDead(dt); break;
      case 'tunnel':   this.updateTunnel(dt); break;
    }

    this.input.update();
  }

  // ─── Map navigation ───────────────────────────────────────────

  updateMap(dt) {
    if (this.input.isPressed('Escape')) {
      this.api.exitToMenu();
      return;
    }

    const isAccessible = (node) => isNodeAccessible(node, this.unlockedLevels, this.secretLevelsUnlocked);

    // Navigate between nodes
    const dirs = [
      ['ArrowLeft', 'KeyA', 'left'],
      ['ArrowRight', 'KeyD', 'right'],
      ['ArrowUp', 'KeyW', 'up'],
      ['ArrowDown', 'KeyS', 'down'],
    ];
    for (const [key1, key2, dir] of dirs) {
      if (this.input.isPressed(key1) || this.input.isPressed(key2)) {
        const next = findNodeInDirection(this.selectedNode, dir, isAccessible);
        if (next !== null) {
          this.selectedNode = next;
          this.api.audio.playSFX(300, 0.05, 'square');
        }
      }
    }

    // Smooth mouse movement toward selected node
    const target = mapNodes[this.selectedNode];
    if (target) {
      this.mouseMapX += (target.x - this.mouseMapX) * Math.min(1, dt * 8);
      this.mouseMapY += (target.y - this.mouseMapY) * Math.min(1, dt * 8);
    }

    // Click-to-select node
    const mouse = this.input.getMouse();
    if (mouse.clicked) {
      for (const node of mapNodes) {
        if (!isNodeVisible(node, this.unlockedLevels, this.secretLevelsUnlocked)) continue;
        const dx = mouse.x - node.x;
        const dy = mouse.y - node.y;
        if (dx * dx + dy * dy < 20 * 20) {
          if (isAccessible(node)) {
            if (this.selectedNode === node.id) {
              // Double-click / already selected → launch
              this.loadLevel(node.levelIdx);
              this.api.audio.playSFX(440, 0.15, 'square');
            } else {
              this.selectedNode = node.id;
              this.api.audio.playSFX(300, 0.05, 'square');
            }
          }
          break;
        }
      }
    }

    // Start level
    if (this.input.isPressed('Enter') || this.input.isPressed('Space')) {
      const node = mapNodes[this.selectedNode];
      if (node && isAccessible(node)) {
        this.loadLevel(node.levelIdx);
        this.api.audio.playSFX(440, 0.15, 'square');
      }
    }
  }

  // ─── Gameplay update ──────────────────────────────────────────

  updatePlaying(dt) {
    this.levelTime += dt;
    const level = this.currentLevel;
    const player = this.player;

    if (this.input.isPressed('KeyP')) { this.state = 'paused'; return; }
    if (this.input.isPressed('Escape')) { this.state = 'map'; return; }

    // ─── Player ───
    updatePlayer(player, this.input, level.tiles, dt);

    // Spike damage
    if (player._touchedSpike) {
      player._touchedSpike = false;
      if (damagePlayer(player, 1)) {
        shakeCamera(this.camera, 6);
        this.api.audio.playSFX(150, 0.2, 'sawtooth');
        if (this.api.settings.particles) {
          emitExplosion(this.particles, player.x, player.y, { count: 8, color: '#FF4444' });
        }
      }
    }

    // ─── Shooting ───
    if (tryShoot(player, this.input)) {
      const weapon = getCurrentWeapon(player);
      const bullets = createBullets(player.x + player.facing * 12, player.y + 2, player.facing, weapon);
      for (const b of bullets) this.projectiles.push(b);
      const freq = weapon.id === 'launcher' ? 200 : weapon.id === 'shotgun' ? 350 : weapon.id === 'machinegun' ? 700 : 600;
      this.api.audio.playSFX(freq, weapon.id === 'machinegun' ? 0.03 : 0.06, 'square');
    }

    // ─── Enemies ───
    const enemyProjectiles = updateEnemies(this.enemies, level.tiles, player.x, player.y, dt);
    for (const ep of enemyProjectiles) this.projectiles.push(ep);

    // ─── Projectiles ───
    updateProjectiles(this.projectiles, level.tiles, dt);

    // ─── Bullet-enemy hits (on-screen only) ───
    const hits = checkBulletEnemyHits(this.projectiles, this.enemies, this.camera);
    const bulletsToRemove = new Set();

    for (const hit of hits) {
      const enemy = this.enemies[hit.enemyIdx];
      const bullet = this.projectiles[hit.bulletIdx];
      if (!bullet || !enemy) continue;

      bulletsToRemove.add(hit.bulletIdx);

      if (this.api.settings.particles) {
        emitExplosion(this.particles, bullet.x, bullet.y, { count: 5, color: bullet.color || '#FFD700', speed: 60 });
      }
      if (bullet.explosive && bullet.splashRadius) {
        const splashed = checkSplashDamage(bullet.x, bullet.y, bullet.splashRadius, this.enemies, hit.enemyIdx);
        for (const si of splashed) {
          if (damageEnemy(this.enemies[si], Math.max(1, bullet.damage - 1))) {
            this.onEnemyKilled(this.enemies[si], player);
          }
        }
        if (this.api.settings.particles) {
          emitExplosion(this.particles, bullet.x, bullet.y, { count: 20, color: '#FF6644', speed: 120, gravity: 100 });
        }
        shakeCamera(this.camera, 4);
      }

      if (damageEnemy(enemy, bullet.damage)) {
        this.onEnemyKilled(enemy, player);
      } else {
        this.api.audio.playSFX(400, 0.05, 'triangle');
      }
    }

    // ─── Enemy bullet-player hits ───
    const playerHits = checkEnemyBulletPlayerHits(this.projectiles, player);
    for (const idx of playerHits) {
      const ep = this.projectiles[idx];
      if (!ep) continue;
      bulletsToRemove.add(idx);
      if (damagePlayer(player, ep.damage)) {
        shakeCamera(this.camera, 5);
        this.api.audio.playSFX(120, 0.2, 'sawtooth');
      }
    }

    // Remove all hit projectiles at once (in reverse order to preserve indices)
    if (bulletsToRemove.size > 0) {
      const sorted = [...bulletsToRemove].sort((a, b) => b - a);
      for (const idx of sorted) {
        this.projectiles.splice(idx, 1);
      }
    }

    // ─── Enemy-player contact ───
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (!aabbOverlapEntities(player, e)) continue;

      const playerBottom = player.y + player.height / 2;
      const enemyTop = e.y - e.height / 2;
      const isFallingOnTop = player.vy > 0 && playerBottom < e.y && playerBottom >= enemyTop - 8;

      if (isFallingOnTop) {
        player.vy = -config.player.enemyBounceForce;
        player.canDoubleJump = true;
        if (damageEnemy(e, 1)) {
          this.onEnemyKilled(e, player);
        } else {
          this.api.audio.playSFX(300, 0.08, 'sine');
          addFloatingText(this.floatingTexts, e.x, e.y - 20, 'BONK!', '#FF8844');
        }
        if (this.api.settings.particles) {
          emitExplosion(this.particles, e.x, e.y - e.height / 2, { count: 6, color: '#FFAA44', speed: 50 });
        }
      } else {
        if (damagePlayer(player, e.damage)) {
          shakeCamera(this.camera, 5);
          this.api.audio.playSFX(120, 0.2, 'sawtooth');
          if (this.api.settings.particles) {
            emitExplosion(this.particles, player.x, player.y, { count: 6, color: '#FF4444' });
          }
          player.vx = (player.x < e.x ? -1 : 1) * 200;
          player.vy = -200;
        }
      }
    }

    // ─── Pickups ───
    for (const p of this.pickups) {
      if (p.collected) continue;
      if (pickupOverlap(player, p)) {
        p.collected = true;
        if (p.type === 'cheese') {
          player.score += config.pickups.cheese;
          addFloatingText(this.floatingTexts, p.x, p.y - 10, `+${config.pickups.cheese}`, '#FFD700');
          this.api.audio.playSFX(880, 0.08, 'sine');
          if (this.api.settings.particles) emitSparkle(this.particles, p.x, p.y, { count: 8, color: '#FFD700' });
        } else if (p.type === 'heart') {
          player.hp = Math.min(player.hp + 1, player.maxHP || config.player.maxHP);
          addFloatingText(this.floatingTexts, p.x, p.y - 10, '+HP', '#FF4466');
          this.api.audio.playSFX(660, 0.1, 'sine');
        }
      }
    }

    // ─── Secret system ───
    if (this.secretState) {
      const event = updateSecret(this.secretState, player, dt);
      if (event === 'enter_tunnel') {
        this.startTunnel(this.secretState);
      }
    }

    // ─── Goal ───
    const goal = level.goal;
    if (pickupOverlap(player, { x: goal.x + 16, y: goal.y + 16 })) {
      this.completeLevel();
    }

    // ─── Death ───
    if (!player.alive) {
      this.state = 'dead';
      this.api.audio.playSFX(100, 0.4, 'sawtooth');
      if (this.api.settings.particles) {
        emitExplosion(this.particles, player.x, player.y, { count: 20, color: '#FF4444', speed: 100 });
      }
    }

    updateCamera(this.camera, player.x, player.y, level.width, level.height, dt);
    this.particles.update(dt);
    updateFloatingTexts(this.floatingTexts, dt);
  }

  // ─── Bonus room update (similar to playing but simpler) ───────

  updateBonus(dt) {
    this.levelTime += dt;
    const level = this.currentLevel;
    const player = this.player;

    if (this.input.isPressed('Escape')) { this.state = 'map'; return; }

    updatePlayer(player, this.input, level.tiles, dt);

    // Pickups — including reward
    for (const p of this.pickups) {
      if (p.collected) continue;
      if (pickupOverlap(player, p)) {
        p.collected = true;
        if (p.type === 'cheese') {
          player.score += config.pickups.cheese;
          addFloatingText(this.floatingTexts, p.x, p.y - 10, `+${config.pickups.cheese}`, '#FFD700');
          this.api.audio.playSFX(880, 0.08, 'sine');
          if (this.api.settings.particles) emitSparkle(this.particles, p.x, p.y, { count: 8, color: '#FFD700' });
        } else if (p.type === 'heart') {
          player.hp = Math.min(player.hp + 1, player.maxHP || config.player.maxHP);
          addFloatingText(this.floatingTexts, p.x, p.y - 10, '+HP', '#FF4466');
          this.api.audio.playSFX(660, 0.1, 'sine');
        } else if (p.type === 'reward') {
          // Collected the secret reward!
          this.collectSecretReward();
        }
      }
    }

    // Fall off = return to map
    if (player.y > level.tiles.length * config.tileSize + 100) {
      this.state = 'map';
    }

    updateCamera(this.camera, player.x, player.y, level.width, level.height, dt);
    this.particles.update(dt);
    updateFloatingTexts(this.floatingTexts, dt);

    // Flash timer
    if (this.secretFoundFlash > 0) {
      this.secretFoundFlash -= dt;
      if (this.secretFoundFlash <= 0) {
        this.state = 'map';
      }
    }
  }

  // ─── Tunnel transition ────────────────────────────────────────

  startTunnel(secretState) {
    this.activeTunnel = {
      theme: secretState.def.tunnel.theme,
      duration: secretState.def.tunnel.duration,
      timer: 0,
      secret: secretState,
    };
    this.state = 'tunnel';
    this.api.audio.playSFX(180, 0.3, 'sawtooth');
  }

  updateTunnel(dt) {
    if (!this.activeTunnel) { this.state = 'map'; return; }
    this.activeTunnel.timer += dt;

    if (this.activeTunnel.timer >= this.activeTunnel.duration) {
      // Tunnel complete — load bonus room
      const secret = this.activeTunnel.secret;
      this.activeTunnel = null;
      this.loadBonusRoomFromSecret(secret);
    }
  }

  // ─── Secret reward collection ─────────────────────────────────

  collectSecretReward() {
    if (!this.bonusSecret) return;
    const reward = this.bonusSecret.def.reward;

    // Unlock the secret level
    if (!this.secretLevelsUnlocked.includes(reward.unlocksLevelIdx)) {
      this.secretLevelsUnlocked.push(reward.unlocksLevelIdx);
    }

    this.secretFoundFlash = 3.0; // show overlay for 3 seconds
    this.saveProgress();
    this.api.audio.playSFX(1200, 0.4, 'sine');
    addFloatingText(this.floatingTexts, this.player.x, this.player.y - 30, reward.name, '#FFD700');
    if (this.api.settings.particles) {
      emitSparkle(this.particles, this.player.x, this.player.y, { count: 40, color: '#FFD700', speed: 150 });
    }
  }

  // ─── Other state updates ──────────────────────────────────────

  onEnemyKilled(enemy, player) {
    player.score += enemy.score;
    player.catsDefeated++;
    this.totalCatsDefeated++;
    addFloatingText(this.floatingTexts, enemy.x, enemy.y - 20, `+${enemy.score}`, '#FFD700');
    this.api.audio.playSFX(200, 0.15, 'square');
    if (this.api.settings.particles) {
      emitExplosion(this.particles, enemy.x, enemy.y, { count: 12, color: enemy.bodyColor, speed: 80, gravity: 200 });
    }
    if (this.totalCatsDefeated >= 100) this.api.achievements.unlock('cheese-run-100-cats');
  }

  updatePaused(dt) {
    if (this.input.isPressed('KeyP') || this.input.isPressed('Escape')) this.state = 'playing';
  }

  updateComplete(dt) {
    if (this.input.isPressed('Enter') || this.input.isPressed('Space')) {
      this.state = 'map';
    }
    if (this.input.isPressed('Escape')) this.state = 'map';
  }

  updateDead(dt) {
    this.particles.update(dt);
    if (this.input.isPressed('Enter') || this.input.isPressed('Space')) this.loadLevel(this.currentLevelIdx);
    if (this.input.isPressed('Escape')) this.state = 'map';
  }

  completeLevel() {
    this.state = 'complete';
    this.totalScore += this.player.score;
    this.lastWeaponIdx = this.player.currentWeaponIdx;

    const completedIdx = this.currentLevelIdx;

    // Only advance regular level progression for levels 0-17 (not secrets 18-20)
    if (completedIdx < 18 && completedIdx + 1 >= this.unlockedLevels) {
      this.unlockedLevels = completedIdx + 2;
    }

    // Weapon unlock
    const weaponReward = config.weaponUnlocks[completedIdx];
    if (weaponReward && !this.unlockedWeapons.includes(weaponReward)) {
      this.unlockedWeapons.push(weaponReward);
      this.lastWeaponUnlock = weaponReward;
      this.api.audio.playSFX(1200, 0.3, 'sine');
    }

    this.saveProgress();
    this.api.audio.playSFX(880, 0.3, 'sine');
    if (this.api.settings.particles && this.player) {
      emitSparkle(this.particles, this.player.x, this.player.y, { count: 30, color: '#FFD700', speed: 120 });
    }

    this.api.scores.submit(this.player.score, {
      level: completedIdx + 1,
      time: Math.floor(this.levelTime),
      catsDefeated: this.player.catsDefeated,
    });

    this.api.achievements.unlock('cheese-run-first-level');
    if (!this.player.damageTaken) this.api.achievements.unlock('cheese-run-no-damage');
    if (this.levelTime < 30) this.api.achievements.unlock('cheese-run-speedrun');
    if (this.unlockedLevels >= 7) this.api.achievements.unlock('cheese-run-world-1');   // Kitchen + Pantry
    if (this.unlockedLevels >= 13) this.api.achievements.unlock('cheese-run-world-2');  // Garden + Sewers
    if (this.unlockedLevels >= 19) {                                                     // Rooftops + Warehouse
      this.api.achievements.unlock('cheese-run-world-3');
      this.api.achievements.unlock('cheese-run-all-levels');
    }
  }

  saveProgress() {
    this.api.progress.save('progress', {
      unlockedLevels: this.unlockedLevels,
      totalCatsDefeated: this.totalCatsDefeated,
      totalScore: this.totalScore,
      unlockedWeapons: this.unlockedWeapons,
      secretLevelsUnlocked: this.secretLevelsUnlocked,
    });
  }

  // ─── Render ───────────────────────────────────────────────────

  render(ctx) {
    ctx.clearRect(0, 0, config.width, config.height);

    switch (this.state) {
      case 'map':
        renderWorldMap(ctx, {
          selectedNode: this.selectedNode,
          unlockedLevels: this.unlockedLevels,
          secretLevelsUnlocked: this.secretLevelsUnlocked,
          mouseMapX: this.mouseMapX,
          mouseMapY: this.mouseMapY,
        }, this.totalTime);
        break;
      case 'tunnel':
        if (this.activeTunnel) {
          renderTunnel(ctx, this.activeTunnel.theme, this.activeTunnel.timer / this.activeTunnel.duration, this.totalTime);
        }
        break;
      case 'playing':
      case 'paused':
      case 'complete':
      case 'dead':
        this.renderGameplay(ctx);
        break;
      case 'bonus':
        this.renderBonusRoom(ctx);
        break;
    }
  }

  renderGameplay(ctx) {
    const level = this.currentLevel;
    const worldTheme = config.worlds[level.world];
    const offset = getCameraOffset(this.camera);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    renderLevel(ctx, level, worldTheme, this.camera, this.totalTime);
    renderPickups(ctx, this.pickups, this.totalTime);
    renderGoal(ctx, level.goal, this.totalTime, level.secret);
    renderSecretObjects(ctx, this.secretState, this.totalTime);
    for (const e of this.enemies) renderEnemy(ctx, e);
    renderProjectiles(ctx, this.projectiles);
    if (this.player) renderPlayer(ctx, this.player);
    this.particles.render(ctx);
    renderFloatingTexts(ctx, this.floatingTexts);
    ctx.restore();

    if (this.player) renderHUD(ctx, this.player, level, this.totalTime);
    if (this.state === 'paused') renderPause(ctx);
    else if (this.state === 'complete') renderLevelComplete(ctx, this.player.score, level.name, this.totalTime, this.lastWeaponUnlock);
    else if (this.state === 'dead') renderGameOver(ctx, this.player.score, this.totalTime);
  }

  renderBonusRoom(ctx) {
    const level = this.currentLevel;
    const worldTheme = config.worlds[level.world];
    const offset = getCameraOffset(this.camera);

    // Darker tint for bonus rooms
    ctx.fillStyle = '#030308';
    ctx.fillRect(0, 0, config.width, config.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    renderLevel(ctx, level, worldTheme, this.camera, this.totalTime);
    renderPickups(ctx, this.pickups, this.totalTime);
    if (this.player) renderPlayer(ctx, this.player);
    this.particles.render(ctx);
    renderFloatingTexts(ctx, this.floatingTexts);
    ctx.restore();

    // Eerie overlay
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, config.width, config.height);

    // Bonus room label
    if (this.levelTime < 2) {
      const alpha = this.levelTime < 1 ? this.levelTime : 2 - this.levelTime;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(level.name || 'Secret Area', config.width / 2, 40);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#AAA';
      ctx.fillText('Find the special item!', config.width / 2, 60);
      ctx.globalAlpha = 1;
    }

    if (this.player) renderHUD(ctx, this.player, level, this.totalTime);

    // Secret found flash overlay
    if (this.secretFoundFlash > 0 && this.bonusSecret) {
      renderSecretFoundOverlay(ctx, this.bonusSecret.def.reward.name, Math.min(1, this.secretFoundFlash));
    }
  }

  pause() { if (this.state === 'playing') this.state = 'paused'; this.input.disable(); }
  resume() { if (this.state === 'paused') this.state = 'playing'; this.input.enable(); }

  destroy() {
    this.input.destroy();
    this.saveProgress();
    this.api.scores.submit(this.totalScore, { totalCats: this.totalCatsDefeated });
  }

  getState() {
    return {
      unlockedLevels: this.unlockedLevels,
      totalScore: this.totalScore,
      totalCatsDefeated: this.totalCatsDefeated,
      selectedNode: this.selectedNode,
      unlockedWeapons: this.unlockedWeapons,
      secretLevelsUnlocked: this.secretLevelsUnlocked,
    };
  }

  setState(state) {
    if (state) {
      this.unlockedLevels = state.unlockedLevels || 1;
      this.totalScore = state.totalScore || 0;
      this.totalCatsDefeated = state.totalCatsDefeated || 0;
      this.selectedNode = state.selectedNode || 0;
      this.unlockedWeapons = state.unlockedWeapons || ['pistol'];
      this.secretLevelsUnlocked = state.secretLevelsUnlocked || [];
    }
  }
}

function aabbOverlapEntities(a, b) {
  const ahw = a.width / 2;
  const ahh = a.height / 2;
  const bhw = b.width / 2;
  const bhh = b.height / 2;
  return a.x - ahw < b.x + bhw && a.x + ahw > b.x - bhw && a.y - ahh < b.y + bhh && a.y + ahh > b.y - bhh;
}

function pickupOverlap(player, pickup) {
  const dx = player.x - pickup.x;
  const dy = player.y - pickup.y;
  return dx * dx + dy * dy < 20 * 20;
}
