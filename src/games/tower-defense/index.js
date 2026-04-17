/**
 * Tower Defense — Main entry point.
 * Exports manifest, achievements, and Game class.
 */
import { config, pixelToCell, cellToPixel } from './config.js';
import { achievements } from './achievements.js';
import { TOWER_TYPES } from './data/tower-defs.js';
import { HERO_TYPES } from './data/hero-defs.js';
import { markPathOnGrid } from './systems/path-system.js';
import { createEnemySystem } from './systems/enemy-system.js';
import { createTowerSystem } from './systems/tower-system.js';
import { createHeroSystem } from './systems/hero-system.js';
import { createProjectileSystem } from './systems/projectile-system.js';
import { createWaveSystem } from './systems/wave-system.js';
import { canAfford, getTowerCost } from './systems/economy-system.js';
import { initMapRenderer, renderMap } from './rendering/map-renderer.js';
import { renderEnemies } from './rendering/enemy-renderer.js';
import { renderTowers } from './rendering/tower-renderer.js';
import { renderHeroes } from './rendering/hero-renderer.js';
import { renderProjectiles } from './rendering/projectile-renderer.js';
import { renderEffects, updateEffects } from './rendering/effects-renderer.js';
import { renderHUD, handleHUDClick } from './ui/hud.js';
import { renderTowerPanel, handleTowerPanelClick, updateSidebarScroll } from './ui/tower-panel.js';
import { renderGameOver, handleGameOverClick } from './ui/game-over-screen.js';
import { renderMapSelect, handleMapSelectClick, getHoveredMapIndex, handleMapSelectScroll, resetMapSelectScroll } from './ui/map-select.js';
import { renderDifficultySelect, handleDifficultyClick, getHoveredDifficultyIndex, getHoveredChallengeKey } from './ui/difficulty-select.js';
import { DIFFICULTY_DEFS, CHALLENGE_DEFS, TOWER_CLASSES } from './data/tower-defs.js';
import { renderTooltip, getHoveredTowerButton, getHoveredEnemy, buildTowerButtonTooltip, buildPlacedTowerTooltip, buildEnemyTooltip } from './ui/tooltip.js';
import { createInputManager } from '../../shared/input-manager.js';
import { createParticleSystem, emitExplosion, emitSparkle } from '../../shared/particle-system.js';
import { clearCanvas } from '../../shared/canvas-utils.js';
import { playShoot, playEnemyDeath, playImpact, playWaveStart, playPlaceTower, playGameOver, playVictory, playUpgrade, playSellTower, playSelectTower, playBossWarning, playHeroAbility, playWaveComplete } from './sounds/td-sounds.js';
import { updateFloatingTexts, renderFloatingTexts, clearFloatingTexts, floatCash, floatSpend, floatWaveBonus, floatStat } from './rendering/floating-text.js';
import { WAVES } from './data/wave-defs.js';
import { startMapMusic, stopMusic } from './sounds/td-music.js';

export const manifest = {
  id: 'tower-defense',
  title: 'Robot Defense',
  description: 'Deploy robot towers to defend against waves of alien invaders!',
  genre: ['strategy', 'tower-defense'],
  version: '0.1.0',
  thumbnail: null,
  controls: {
    keyboard: {
      '1-8': 'Select tower type',
      'Click': 'Place tower / Select tower',
      'T': 'Cycle targeting mode',
      'S': 'Sell selected tower',
      'P': 'Pause / Unpause',
      'Escape': 'Deselect / Exit',
      'Space': 'Send wave early',
    },
  },
};

export { achievements };

export class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.api = null;
    this.input = null;
    this.particles = null;
    this.paused = false;

    // Game state — shared mutable object all systems read/write
    this.gs = null;

    // Systems (closures)
    this.enemySystem = null;
    this.towerSystem = null;
    this.heroSystem = null;
    this.projectileSystem = null;
    this.waveSystem = null;
  }

  init(canvas, arcadeAPI) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.api = arcadeAPI;
    this.input = createInputManager(canvas);
    this.particles = createParticleSystem({ maxParticles: 500 });

    canvas.width = config.width;
    canvas.height = config.height;
    canvas.style.cursor = 'crosshair';

    // Start at map selection screen
    this.gs = { state: 'mapSelect', hoveredMapIndex: -1 };
    resetMapSelectScroll();
  }

  startGame(mapDef, savedState = null, difficulty = 'medium', challenge = null) {
    // Start map music
    if (mapDef?.id) startMapMusic(mapDef.id);

    // Initialize systems
    this.enemySystem = createEnemySystem();
    this.towerSystem = createTowerSystem();
    this.heroSystem = createHeroSystem();
    this.projectileSystem = createProjectileSystem();
    this.waveSystem = createWaveSystem();

    // Build grid
    const grid = [];
    for (let r = 0; r < config.gridRows; r++) {
      grid[r] = new Array(config.gridCols).fill(config.EMPTY);
    }

    // Mark paths on grid
    for (const path of mapDef.paths) {
      markPathOnGrid(grid, path.waypoints, mapDef.pathWidth, config.cellSize, config.gridOffsetY, config.PATH);
    }

    // Adjust waypoint Y coordinates (add gridOffsetY)
    let paths = mapDef.paths.map(p => ({
      ...p,
      waypoints: p.waypoints.map(wp => ({
        x: wp.x,
        y: wp.y + config.gridOffsetY,
      })),
    }));

    // Resolve difficulty and challenge modifiers
    const diffDef = DIFFICULTY_DEFS[difficulty] || DIFFICULTY_DEFS.medium;
    const chalDef = challenge ? CHALLENGE_DEFS[challenge] : null;

    const baseCash = mapDef.startingCash || config.startingCash;
    const baseLives = mapDef.startingLives || config.startingLives;
    let startCash = Math.floor(baseCash * diffDef.cashMult);
    let startLives = Math.floor(baseLives * diffDef.livesMult);
    let enemyHpMult = diffDef.enemyHpMult || 1.0;
    let enemySpeedMult = 1.0;
    let cashEarnMult = 1.0;
    let allowedTowerClasses = null;
    let reversePath = false;
    let noSell = false;
    let bossRush = false;
    let ironMan = false;

    if (chalDef) {
      if (chalDef.allowedClasses) allowedTowerClasses = chalDef.allowedClasses;
      if (chalDef.cashMult) startCash = Math.floor(startCash * chalDef.cashMult);
      if (chalDef.earnMult) cashEarnMult = chalDef.earnMult;
      if (chalDef.enemySpeedMult) enemySpeedMult = chalDef.enemySpeedMult;
      if (chalDef.reversePath) reversePath = true;
      if (chalDef.noSell) noSell = true;
      if (chalDef.bossRush) bossRush = true;
      if (chalDef.ironMan) { ironMan = true; startLives = 1; }
    }

    // Reverse path waypoints if needed
    if (reversePath) {
      paths = paths.map(p => ({
        ...p,
        waypoints: [...p.waypoints].reverse(),
      }));
    }

    // Initialize game state
    this.gs = {
      // Core state
      state: 'playing', // playing | paused | gameOver | victory
      lives: savedState ? savedState.lives : startLives,
      initialLives: startLives,
      cash: savedState ? savedState.cash : startCash,
      currentWave: savedState ? savedState.currentWave : 0,
      wave: savedState ? savedState.currentWave : 0,
      wavePhase: 'prep',
      prepTimeLeft: 0,
      speedMultiplier: 1,
      gameResult: null,

      // Entities
      enemies: [],
      towers: [],
      projectiles: [],
      lightningChains: [],
      beams: [],
      pulseRings: [],
      effects: [],

      // Map data
      grid,
      paths,
      mapDef,

      // Heroes
      heroes: [],
      heroesPlaced: {},
      selectedHero: null,
      selectedHeroType: null,

      // UI state
      selectedTowerType: 'blaster',
      selectedTower: null,
      hoveredCell: null,
      tooltip: null,

      // Stats
      enemiesKilled: savedState ? savedState.enemiesKilled : 0,
      bossesKilled: savedState ? savedState.bossesKilled : 0,
      towersBuilt: savedState ? savedState.towersBuilt : 0,
      totalCashEarned: savedState ? savedState.totalCashEarned : 0,
      noLivesLost: savedState ? savedState.noLivesLost : true,
      cashMultiplier: mapDef.cashMultiplier || 1.0,
      bonusCashPctTotal: 0, // Sum of all laser drone bonus cash %

      // Tower ability global flags
      phantomTowers: [],
      goldRushActive: false,
      goldRushTimer: 0,
      supportOverchargeActive: false,
      supportOverchargeTimer: 0,
      totalVulnerabilityActive: false,
      totalVulnerabilityTimer: 0,
      plagueCloudActive: false,
      plagueCloudTimer: 0,
      plagueCloudDps: 0,
      motherLodeNextWave: false,

      gameTime: savedState ? savedState.gameTime : 0,
      gamePaused: false,
      bossWarningTimer: 0,

      // Difficulty & challenge mode
      difficulty,
      challenge,
      allowedTowerClasses,
      reversePath,
      noSell,
      bossRush,
      ironMan,
      enemyHpMult,
      enemySpeedMult,
      cashEarnMult,

      // System references (for cross-system calls)
      enemySystem: this.enemySystem,
    };

    // Init renderer (caches static map)
    initMapRenderer(mapDef);

    // Restore towers from saved state
    if (savedState && savedState.towers) {
      for (const st of savedState.towers) {
        const def = TOWER_TYPES[st.type];
        if (!def) continue;
        const pos = cellToPixel(st.col, st.row);
        grid[st.row][st.col] = config.TOWER;
        const tower = {
          id: Date.now() + Math.random(),
          type: st.type,
          col: st.col,
          row: st.row,
          x: pos.x,
          y: pos.y,
          angle: 0,
          range: def.baseRange,
          damage: def.baseDamage,
          fireRate: def.baseFireRate,
          fireCooldown: 0,
          projectileSpeed: def.baseProjectileSpeed || 300,
          projectileType: def.projectileType,
          upgrades: st.upgrades || [0, 0, 0],
          totalSpent: st.totalSpent || def.baseCost,
          targetId: null,
          targetingMode: st.targetingMode || def.targetingDefault || 'first',
          splashRadius: def.baseSplashRadius || 0,
          slowFactor: def.baseSlowFactor || 0,
          slowDuration: def.baseSlowDuration || 0,
          chainCount: def.baseChainCount || 0,
          chainRange: def.baseChainRange || 0,
          buffRadius: def.baseBuffRadius || 0,
          buffDamage: def.baseBuffDamage || 0,
          buffRange: def.baseBuffRange || 0,
          buffSpeed: def.baseBuffSpeed || 0,
          detectCloaked: def.baseDetectCloaked || false,
          ownDetectCloaked: def.baseDetectCloaked || false,
          pierce: def.basePierce || 0,
          armorPierce: def.baseArmorPierce || 0,
          income: def.baseIncome || 0,
          bonusCashPct: 0,
          dotDps: def.baseDotDps || 0,
          dotDuration: def.baseDotDuration || 0,
          damageAmp: def.baseDamageAmp || 0,
          damageAmpDuration: def.baseDamageAmpDuration || 0,
          rampRate: def.baseRampRate || 0,
          maxRamp: def.baseMaxRamp || 0,
          _rampTarget: null,
          _rampBonus: 0,
          // Ability
          abilityUnlocked: false,
          abilityCooldown: st.abilityCooldown || 0,
          abilityActive: false,
          abilityTimer: 0,
          color: def.color,
          size: def.size,
          kills: st.kills || 0,
        };
        this.towerSystem.recalcStats(tower);
        this.gs.towers.push(tower);
      }
    }

    // Restore heroes from saved state
    if (savedState && savedState.heroes) {
      for (const sh of savedState.heroes) {
        const def = HERO_TYPES[sh.type];
        if (!def) continue;
        const pos = cellToPixel(sh.col, sh.row);
        grid[sh.row][sh.col] = config.HERO;
        const hero = {
          id: Date.now() + Math.random(),
          type: sh.type,
          col: sh.col,
          row: sh.row,
          x: pos.x,
          y: pos.y,
          angle: 0,
          range: def.baseRange,
          damage: def.baseDamage,
          fireRate: def.baseFireRate,
          fireCooldown: 0,
          projectileSpeed: def.baseProjectileSpeed || 300,
          projectileType: def.projectileType,
          targetId: null,
          targetingMode: def.targetingDefault || 'first',
          splashRadius: def.baseSplashRadius || 0,
          chainCount: def.baseChainCount || 0,
          chainRange: def.baseChainRange || 0,
          detectCloaked: false,
          armorPierce: 0,
          totalSpent: def.cost,
          abilityCooldown: 0,
          abilityActive: false,
          abilityTimer: 0,
          color: def.color,
          size: def.size,
          isHero: true,
        };
        this.gs.heroes.push(hero);
        this.gs.heroesPlaced[sh.type] = true;
      }
    }

    // Start wave prep (at the saved wave or wave 0)
    this.waveSystem.startPrep(this.gs);

    // Clear particle and floating text pools
    this.particles.clear();
    clearFloatingTexts();

    // Clear the active save now that we've loaded it
    if (savedState && this.api.progress) {
      this.api.progress.save('_save_' + mapDef.id, { cleared: true });
    }

    // Kill callback — particles, floating text, sound
    this.gs.onEnemyKill = (enemy, cashReward) => {
      playEnemyDeath(enemy.type);
      emitExplosion(this.particles, enemy.x, enemy.y, {
        color: enemy.color,
        count: enemy.type === 'boss' ? 40 : 12,
        speed: enemy.type === 'boss' ? 250 : 150,
        size: enemy.type === 'boss' ? 8 : 5,
      });
      if (enemy.type === 'boss') {
        emitSparkle(this.particles, enemy.x, enemy.y, { color: '#ffd700', count: 15 });
      }
      floatCash(enemy.x, enemy.y, cashReward);
    };
  }

  update(dt) {
    if (this.paused) return;
    const gs = this.gs;
    if (!gs) return;

    // Map selection screen
    if (gs.state === 'mapSelect') {
      this.handleMapSelectInput();
      this.input.update();
      return;
    }

    // Difficulty selection screen
    if (gs.state === 'difficultySelect') {
      this.handleDifficultySelectInput();
      this.input.update();
      return;
    }

    if (gs.state === 'gameOver' || gs.state === 'victory') {
      // Still handle input for game over screen
      this.handleGameOverInput();
      this.input.update();
      return;
    }

    const effectiveDt = dt * gs.speedMultiplier;

    // --- Handle Input ---
    this.handleInput();

    // In-game pause — input still processed so P can unpause
    if (gs.gamePaused) {
      this.input.update();
      return;
    }

    // --- Update Systems ---
    // Waves (spawning)
    this.waveSystem.update(dt, gs);

    // Enemies (movement, abilities)
    this.enemySystem.update(effectiveDt, gs);

    // Towers (targeting, firing)
    this.towerSystem.update(effectiveDt, gs);

    // Heroes (targeting, firing, abilities)
    this.heroSystem.update(effectiveDt, gs);

    // Projectiles (movement, hit detection)
    this.projectileSystem.update(effectiveDt, gs);

    // Effects
    updateEffects(effectiveDt, gs);

    // Particles
    this.particles.update(effectiveDt);

    // Floating text
    updateFloatingTexts(effectiveDt);

    // Game timer
    gs.gameTime += effectiveDt;

    // Boss warning timer
    if (gs.bossWarningTimer > 0) gs.bossWarningTimer -= effectiveDt;

    // --- Check Wave Complete ---
    if (gs.wavePhase === 'active' && this.waveSystem.isWaveComplete(gs)) {
      // Calculate wave bonus before advancing
      const waveDef = WAVES[gs.currentWave];
      const waveBonus = waveDef ? Math.floor(waveDef.bonus * (gs.cashMultiplier || 1.0)) : 0;

      const result = this.waveSystem.completeWave(gs);
      playWaveComplete();
      if (waveBonus > 0) {
        floatWaveBonus(config.gameArea.w / 2, 80, waveBonus);
        emitSparkle(this.particles, config.gameArea.w / 2, 60, { color: '#ffd700', count: 12 });
      }

      if (result === 'victory') {
        gs.state = 'victory';
        gs.gameResult = 'victory';
        playVictory();
        // Victory explosion at center
        emitExplosion(this.particles, config.gameArea.w / 2, config.height / 2, {
          color: '#ffd700', count: 60, speed: 300, size: 8,
        });
        emitSparkle(this.particles, config.gameArea.w / 2, config.height / 2, {
          color: '#00d4ff', count: 30,
        });
        this.checkAchievements();
        this.saveProgress();
        this.clearGameSave(gs.mapDef?.id);
      } else {
        // Auto-save progress between waves
        this.saveActiveGame();
        // Check if next wave is a boss wave → warning
        const nextWaveDef = WAVES[gs.currentWave];
        if (nextWaveDef && nextWaveDef.groups.some(g => g.type === 'boss')) {
          playBossWarning();
          gs.bossWarningTimer = 2.0;
        }
      }
    }

    // Sync wave display number
    gs.wave = gs.currentWave;

    // Prep timer for HUD
    gs.prepTimer = gs.prepTimeLeft;

    // --- Check Game Over ---
    if (gs.lives <= 0) {
      gs.lives = 0;
      gs.state = 'gameOver';
      gs.gameResult = 'defeat';
      playGameOver();
      this.checkAchievements();
      this.saveProgress();
      this.clearGameSave(gs.mapDef?.id);
    }

    // Track no lives lost (compare against difficulty-adjusted starting lives)
    if (gs.lives < gs.initialLives) {
      gs.noLivesLost = false;
    }

    // Achievement checks during play
    const ach = this.api.achievements;
    if (gs.enemiesKilled > 0) ach.unlock('td-first-blood');
    if (gs.enemiesKilled >= 100) ach.unlock('td-100-kills');
    if (gs.enemiesKilled >= 500) ach.unlock('td-500-kills');
    if (gs.enemiesKilled >= 1000) ach.unlock('td-1000-kills');
    if (gs.bossesKilled > 0) ach.unlock('td-boss-kill');
    if (gs.bossesKilled >= 5) ach.unlock('td-boss-5');
    if (gs.cash >= 5000) ach.unlock('td-rich');
    if (gs.totalCashEarned >= 20000) ach.unlock('td-mega-rich');
    if (gs.towers.length >= 10) ach.unlock('td-10-towers');
    if (gs.towers.length >= 20) ach.unlock('td-20-towers');
    if (gs.speedMultiplier === 3 && gs.wavePhase === 'active') ach.unlock('td-speed-demon');
    // Check for fully maxed tower (all 3 paths at max level)
    if (gs.towers.some(t => t.upgrades && t.upgrades[0] + t.upgrades[1] + t.upgrades[2] >= 7)) ach.unlock('td-max-upgrade');
    // Hard/Expert wave 30
    if (gs.currentWave >= 30 && (gs.difficulty === 'hard' || gs.difficulty === 'expert')) ach.unlock('td-survivor');

    this.input.update();
  }

  handleInput() {
    const gs = this.gs;
    const mouse = this.input.getMouse();
    // Scale mouse coords to canvas internal resolution
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = mouse.x * scaleX;
    const my = mouse.y * scaleY;

    // Sidebar scroll
    if (mouse.wheelDeltaY) {
      updateSidebarScroll(gs, mouse.wheelDeltaY, mx);
    }

    // Update hovered cell
    if (mx < config.gameArea.w && my > config.gridOffsetY) {
      const cell = pixelToCell(mx, my);
      gs.hoveredCell = cell;
    } else {
      gs.hoveredCell = null;
    }

    // Escape — deselect or exit
    if (this.input.isPressed('Escape')) {
      if (gs.selectedTower) {
        gs.selectedTower = null;
      } else if (gs.selectedHero) {
        gs.selectedHero = null;
      } else if (gs.selectedHeroType) {
        gs.selectedHeroType = null;
      } else {
        // Save active game state for resume + save stats
        this.saveActiveGame();
        this.saveProgress();
        stopMusic();
        this.api.exitToMenu();
        return;
      }
    }

    // Number keys — select tower type (1-9, 0 for 10th)
    const towerKeys = [
      'blaster', 'railgun', 'plasma', 'cryo', 'tesla', 'support', 'missile', 'laser',
      'quarry', 'flak', 'venom', 'pulse', 'gauss', 'mortar', 'disruptor', 'particle',
    ];
    for (let i = 0; i < Math.min(towerKeys.length, 10); i++) {
      const key = i < 9 ? `Digit${i + 1}` : 'Digit0';
      if (this.input.isPressed(key)) {
        gs.selectedTowerType = towerKeys[i];
        gs.selectedTower = null;
        gs.selectedHero = null;
        gs.selectedHeroType = null;
      }
    }

    // T — cycle targeting
    if (this.input.isPressed('KeyT') || this.input.isPressed('t')) {
      if (gs.selectedTower) {
        this.towerSystem.cycleTargeting(gs.selectedTower);
      } else if (gs.selectedHero) {
        this.heroSystem.cycleTargeting(gs.selectedHero);
      }
    }

    // S — sell (blocked in no-sell challenge)
    if (!gs.noSell && (this.input.isPressed('KeyS') || this.input.isPressed('s'))) {
      if (gs.selectedTower) {
        const tower = gs.selectedTower;
        const refund = Math.floor(tower.totalSpent * config.sellRefund);
        playSellTower();
        emitSparkle(this.particles, tower.x, tower.y, { color: '#ffd700', count: 6 });
        floatCash(tower.x, tower.y, refund);
        this.towerSystem.sellTower(tower, gs);
        gs.selectedTower = null;
      } else if (gs.selectedHero) {
        playSellTower();
        emitSparkle(this.particles, gs.selectedHero.x, gs.selectedHero.y, { color: '#ffd700', count: 6 });
        this.heroSystem.sellHero(gs.selectedHero, gs);
        gs.selectedHero = null;
      }
    }

    // Q — activate hero or tower ability
    if (this.input.isPressed('KeyQ') || this.input.isPressed('q')) {
      if (gs.selectedHero) {
        playHeroAbility();
        emitSparkle(this.particles, gs.selectedHero.x, gs.selectedHero.y, { color: '#ff00ff', count: 12 });
        this.heroSystem.activateAbility(gs.selectedHero, gs);
      } else if (gs.selectedTower && gs.selectedTower.abilityUnlocked) {
        const activated = this.towerSystem.activateAbility(gs.selectedTower, gs);
        if (activated) {
          playHeroAbility();
          emitSparkle(this.particles, gs.selectedTower.x, gs.selectedTower.y, { color: gs.selectedTower.color, count: 12 });
        }
      }
    }

    // Space — send early
    if (this.input.isPressed('Space')) {
      if (gs.wavePhase === 'prep') {
        const bonus = this.waveSystem.sendEarly(gs);
        playWaveStart();
        if (bonus > 0) floatWaveBonus(config.gameArea.w / 2, 80, bonus);
      }
    }

    // R — reset game
    if (this.input.isPressed('KeyR') || this.input.isPressed('r')) {
      this.startGame(this.gs.mapDef);
      return;
    }

    // P — pause toggle
    if (this.input.isPressed('KeyP') || this.input.isPressed('p')) {
      gs.gamePaused = !gs.gamePaused;
    }

    // --- Tooltip hover detection ---
    gs.tooltip = null;

    // 1. Sidebar tower button hover
    const hoveredBtn = getHoveredTowerButton(mx, my);
    if (hoveredBtn) {
      const lines = buildTowerButtonTooltip(hoveredBtn);
      if (lines) gs.tooltip = { x: mx, y: my, lines };
    }

    // 2. Placed tower hover (game area)
    if (!gs.tooltip && gs.hoveredCell) {
      const { col, row } = gs.hoveredCell;
      const ht = gs.towers.find(t => t.col === col && t.row === row);
      if (ht) {
        const lines = buildPlacedTowerTooltip(ht);
        if (lines) gs.tooltip = { x: mx, y: my, lines };
      }
    }

    // 3. Enemy hover (game area)
    if (!gs.tooltip && mx < config.gameArea.w && my > config.gridOffsetY) {
      const he = getHoveredEnemy(mx, my, gs.enemies);
      if (he) {
        const lines = buildEnemyTooltip(he);
        if (lines) gs.tooltip = { x: mx, y: my, lines };
      }
    }

    // Mouse click
    if (mouse.clicked) {
      this.handleClick(mx, my);
    }
  }

  handleClick(x, y) {
    const gs = this.gs;

    // HUD click
    const hudResult = handleHUDClick(x, y, gs);
    if (hudResult === 'sendEarly') {
      const bonus = this.waveSystem.sendEarly(gs);
      playWaveStart();
      if (bonus > 0) floatWaveBonus(config.gameArea.w / 2, 80, bonus);
      return;
    }
    if (hudResult === 'reset') {
      this.startGame(this.gs.mapDef);
      return;
    }
    if (hudResult) return;

    // Tower panel click (includes hero section)
    const panelResult = handleTowerPanelClick(x, y, gs);
    if (panelResult) {
      if (panelResult.action === 'selectTower') {
        gs.selectedTowerType = panelResult.towerType;
        gs.selectedTower = null;
        gs.selectedHero = null;
        gs.selectedHeroType = null;
      } else if (panelResult.action === 'selectHero') {
        gs.selectedHeroType = panelResult.heroType;
        gs.selectedTowerType = null;
        gs.selectedTower = null;
        gs.selectedHero = null;
      } else if (panelResult.action === 'cycleTargeting' && gs.selectedTower) {
        this.towerSystem.cycleTargeting(gs.selectedTower);
      } else if (panelResult.action === 'sellTower' && gs.selectedTower) {
        // Two-tap confirmation — first tap arms the window, second commits.
        // Prevents a kid on iPad from accidentally tapping Sell and losing
        // a tower they spent effort upgrading. Confirm is scoped to the
        // specific tower, so switching towers mid-confirm won't auto-sell.
        const now = performance.now();
        const armed = gs._sellConfirmUntil &&
                      now < gs._sellConfirmUntil &&
                      gs._sellConfirmTower === gs.selectedTower;
        if (!armed) {
          gs._sellConfirmUntil = now + 2000;
          gs._sellConfirmTower = gs.selectedTower;
        } else {
          const tower = gs.selectedTower;
          const refund = Math.floor(tower.totalSpent * config.sellRefund);
          playSellTower();
          emitSparkle(this.particles, tower.x, tower.y, { color: '#ffd700', count: 6 });
          floatCash(tower.x, tower.y, refund);
          this.towerSystem.sellTower(tower, gs);
          gs.selectedTower = null;
          gs._sellConfirmUntil = 0;
          gs._sellConfirmTower = null;
        }
      } else if (panelResult.action === 'upgrade' && gs.selectedTower) {
        const tower = gs.selectedTower;
        const cashBefore = gs.cash;
        const success = this.towerSystem.upgrade(tower, panelResult.pathIndex, gs);
        if (success) {
          playUpgrade();
          emitSparkle(this.particles, tower.x, tower.y, { color: tower.color, count: 10 });
          floatSpend(tower.x, tower.y, cashBefore - gs.cash);
        }
      } else if (panelResult.action === 'activateTowerAbility' && gs.selectedTower) {
        const activated = this.towerSystem.activateAbility(gs.selectedTower, gs);
        if (activated) {
          playHeroAbility();
          emitSparkle(this.particles, gs.selectedTower.x, gs.selectedTower.y, { color: gs.selectedTower.color, count: 12 });
        }
      } else if (panelResult.action === 'activateAbility' && gs.selectedHero) {
        playHeroAbility();
        emitSparkle(this.particles, gs.selectedHero.x, gs.selectedHero.y, { color: '#ff00ff', count: 12 });
        this.heroSystem.activateAbility(gs.selectedHero, gs);
      } else if (panelResult.action === 'heroTargeting' && gs.selectedHero) {
        this.heroSystem.cycleTargeting(gs.selectedHero);
      } else if (panelResult.action === 'sellHero' && gs.selectedHero) {
        playSellTower();
        emitSparkle(this.particles, gs.selectedHero.x, gs.selectedHero.y, { color: '#ffd700', count: 6 });
        this.heroSystem.sellHero(gs.selectedHero, gs);
        gs.selectedHero = null;
      }
      return;
    }

    // Game area click
    if (x < config.gameArea.w && y > config.gridOffsetY) {
      const cell = pixelToCell(x, y);
      const { col, row } = cell;

      // Check if clicking on an existing tower
      const clickedTower = gs.towers.find(t => t.col === col && t.row === row);
      if (clickedTower) {
        gs.selectedTower = clickedTower;
        gs.selectedTowerType = null;
        gs.selectedHero = null;
        gs.selectedHeroType = null;
        playSelectTower();
        return;
      }

      // Check if clicking on an existing hero
      const clickedHero = gs.heroes.find(h => h.col === col && h.row === row);
      if (clickedHero) {
        gs.selectedHero = clickedHero;
        gs.selectedTower = null;
        gs.selectedTowerType = null;
        gs.selectedHeroType = null;
        return;
      }

      // Try to place a tower
      if (gs.selectedTowerType) {
        const def = TOWER_TYPES[gs.selectedTowerType];
        if (def && gs.cash >= def.baseCost && this.towerSystem.canPlace(gs, col, row)) {
          const tower = this.towerSystem.placeTower(gs, gs.selectedTowerType, col, row);
          if (tower) {
            playPlaceTower();
            emitSparkle(this.particles, tower.x, tower.y, { color: tower.color, count: 8 });
            floatSpend(tower.x, tower.y, def.baseCost);
          }
        }
        return;
      }

      // Try to place a hero
      if (gs.selectedHeroType) {
        const def = HERO_TYPES[gs.selectedHeroType];
        if (def && gs.cash >= def.cost && !gs.heroesPlaced[gs.selectedHeroType] && this.heroSystem.canPlace(gs, col, row)) {
          const hero = this.heroSystem.placeHero(gs, gs.selectedHeroType, col, row);
          if (hero) {
            playPlaceTower();
            emitSparkle(this.particles, hero.x, hero.y, { color: '#ff00ff', count: 10 });
            floatSpend(hero.x, hero.y, def.cost);
            gs.selectedHeroType = null;
          }
        }
        return;
      }

      // Click on empty space — deselect
      gs.selectedTower = null;
      gs.selectedHero = null;
    }
  }

  handleMapSelectInput() {
    const mouse = this.input.getMouse();
    const rect = this.canvas.getBoundingClientRect();
    const mx = mouse.x * (this.canvas.width / rect.width);
    const my = mouse.y * (this.canvas.height / rect.height);

    // Scroll handling
    if (mouse.wheelDeltaY) {
      handleMapSelectScroll(mouse.wheelDeltaY);
    }

    // Update hover
    this.gs.hoveredMapIndex = getHoveredMapIndex(mx, my);

    // Escape — exit to arcade menu
    if (this.input.isPressed('Escape')) {
      this.api.exitToMenu();
      return;
    }

    // Click — select map
    if (mouse.clicked) {
      const selectedMap = handleMapSelectClick(mx, my);
      if (selectedMap) {
        // Go to difficulty select instead of starting game directly
        this.gs = {
          state: 'difficultySelect',
          pendingMap: selectedMap,
          hoveredDifficultyIndex: -1,
        };
      }
    }
  }

  handleDifficultySelectInput() {
    const mouse = this.input.getMouse();
    const rect = this.canvas.getBoundingClientRect();
    const mx = mouse.x * (this.canvas.width / rect.width);
    const my = mouse.y * (this.canvas.height / rect.height);

    // Load progress for hover/click functions
    const mapId = this.gs.pendingMap?.id;
    const mapProgress = mapId && this.api.progress ? (this.api.progress.load(mapId) || {}) : {};

    // Update hover
    this.gs.hoveredDifficultyIndex = getHoveredDifficultyIndex(mx, my, mapProgress);
    this.gs.hoveredChallenge = getHoveredChallengeKey(mx, my, mapProgress);

    // Escape — back to map select
    if (this.input.isPressed('Escape')) {
      this.gs = { state: 'mapSelect', hoveredMapIndex: -1 };
      resetMapSelectScroll();
      return;
    }

    // Click — select difficulty or challenge
    if (mouse.clicked) {
      const result = handleDifficultyClick(mx, my, mapProgress);
      if (result === 'back') {
        this.gs = { state: 'mapSelect', hoveredMapIndex: -1 };
        resetMapSelectScroll();
      } else if (result && result.challenge) {
        // Start a challenge mode
        const chalDef = CHALLENGE_DEFS[result.challenge];
        const diff = chalDef ? chalDef.difficulty : result.difficulty;
        this.startGame(this.gs.pendingMap, null, diff, result.challenge);
      } else if (result && result.difficulty) {
        const mapDef = this.gs.pendingMap;
        // Check for active save to resume
        const saveData = this.api.progress ? this.api.progress.load('_save_' + mapDef.id) : null;
        if (saveData && !saveData.cleared && saveData.currentWave !== undefined) {
          this.startGame(mapDef, saveData, result.difficulty);
        } else {
          this.startGame(mapDef, null, result.difficulty);
        }
      }
    }
  }

  handleGameOverInput() {
    const gs = this.gs;
    if (!gs || (gs.state !== 'gameOver' && gs.state !== 'victory')) return;

    const mouse = this.input.getMouse();
    if (mouse.clicked) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = mouse.x * (this.canvas.width / rect.width);
      const my = mouse.y * (this.canvas.height / rect.height);
      const result = handleGameOverClick(mx, my, gs);
      if (result === 'restart') {
        this.startGame(this.gs.mapDef, null, this.gs.difficulty || 'medium', this.gs.challenge);
      } else if (result === 'mapSelect') {
        stopMusic();
        this.gs = { state: 'mapSelect', hoveredMapIndex: -1 };
        resetMapSelectScroll();
      } else if (result === 'exit') {
        stopMusic();
        this.api.exitToMenu();
      } else if (result && result.challenge) {
        // Start a challenge mode on the same map at the challenge's difficulty
        const chalDef = CHALLENGE_DEFS[result.challenge];
        const nextDiff = chalDef ? chalDef.difficulty : this.gs.difficulty;
        this.startGame(this.gs.mapDef, null, nextDiff, result.challenge);
      }
    }

    if (this.input.isPressed('Escape')) {
      this.api.exitToMenu();
    }
  }

  render(ctx) {
    const gs = this.gs;
    if (!gs) return;

    clearCanvas(ctx, config.width, config.height);

    // Map selection screen
    if (gs.state === 'mapSelect') {
      const mapProgress = this.api.progress ? this.api.progress.load() : {};
      renderMapSelect(ctx, gs.hoveredMapIndex, mapProgress);
      return;
    }

    // Difficulty selection screen
    if (gs.state === 'difficultySelect') {
      const mapId = gs.pendingMap?.id;
      const mapProgress = mapId && this.api.progress ? (this.api.progress.load(mapId) || {}) : {};
      const chalProgress = mapId && this.api.progress ? (this.api.progress.load(`${mapId}_challenges`) || {}) : {};
      renderDifficultySelect(ctx, gs.pendingMap, gs.hoveredDifficultyIndex, mapProgress, chalProgress, gs.hoveredChallenge || null);
      return;
    }

    // Map (cached background + hover + range)
    renderMap(ctx, gs);

    // Enemies
    renderEnemies(ctx, gs);

    // Towers
    renderTowers(ctx, gs);

    // Heroes
    renderHeroes(ctx, gs);

    // Projectiles, beams, lightning
    renderProjectiles(ctx, gs);

    // Effects
    renderEffects(ctx, gs);

    // Particles
    this.particles.render(ctx);

    // Floating text (above particles, below HUD)
    renderFloatingTexts(ctx);

    // HUD
    renderHUD(ctx, gs);

    // Tower panel (sidebar)
    renderTowerPanel(ctx, gs);

    // Tooltip
    renderTooltip(ctx, gs);

    // Boss wave warning flash
    if (gs.bossWarningTimer > 0) {
      const alpha = Math.min(1, gs.bossWarningTimer) * (0.5 + 0.5 * Math.sin(Date.now() * 0.01));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚠ BOSS INCOMING ⚠', config.gameArea.w / 2 + 2, 72);
      ctx.fillStyle = '#ff4444';
      ctx.fillText('⚠ BOSS INCOMING ⚠', config.gameArea.w / 2, 70);
      ctx.restore();
    }

    // In-game pause overlay
    if (gs.gamePaused) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, config.width, config.height);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', config.width / 2, config.height / 2);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#8892b0';
      ctx.fillText('Press P to resume', config.width / 2, config.height / 2 + 40);
      ctx.restore();
    }

    // Game over overlay
    if (gs.state === 'gameOver' || gs.state === 'victory') {
      renderGameOver(ctx, gs);
    }
  }

  pause() {
    this.paused = true;
    if (this.input) this.input.disable();
  }

  resume() {
    this.paused = false;
    if (this.input) this.input.enable();
  }

  destroy() {
    stopMusic(0.5);
    if (this.input) this.input.destroy();
    if (this.canvas) this.canvas.style.cursor = 'default';
    const gs = this.gs;
    if (gs) {
      this.api.scores.submit(gs.wave, {
        kills: gs.enemiesKilled,
        towersBuilt: gs.towersBuilt,
        lives: gs.lives,
      });
    }
  }

  getState() {
    return this.gs ? { ...this.gs } : null;
  }

  setState(state) {
    if (state) this.gs = state;
  }

  // --- Achievement Checks ---
  checkAchievements() {
    const gs = this.gs;
    if (!this.api || !this.api.achievements) {
      console.error('[ACHIEVEMENTS] api.achievements missing!');
      return;
    }
    const unlock = (id) => {
      const result = this.api.achievements.unlock(id);
      console.log(`[ACHIEVEMENT] unlock(${id}) → ${result}`);
      return result;
    };
    // Use currentWave (the authoritative counter) not gs.wave (display sync, may lag behind)
    const w = gs.currentWave;
    console.log(`[ACHIEVEMENTS] checkAchievements: wave=${w}, state=${gs.state}, kills=${gs.enemiesKilled}, noLivesLost=${gs.noLivesLost}`);
    // Combat
    if (gs.enemiesKilled > 0) unlock('td-first-blood');
    if (gs.enemiesKilled >= 100) unlock('td-100-kills');
    if (gs.enemiesKilled >= 500) unlock('td-500-kills');
    if (gs.enemiesKilled >= 1000) unlock('td-1000-kills');
    if (gs.bossesKilled >= 5) unlock('td-boss-5');

    // Wave milestones
    if (w >= 5) unlock('td-wave-5');
    if (w >= 10) unlock('td-wave-10');
    if (w >= 20) unlock('td-wave-20');
    if (w >= 40) unlock('td-wave-40');
    if (w >= 60) unlock('td-wave-60');
    if (w >= 80) unlock('td-wave-80');

    // Difficulty completions (on victory)
    if (gs.state === 'victory') {
      const diff = gs.difficulty || 'medium';
      if (diff === 'easy') unlock('td-easy-clear');
      if (diff === 'medium') unlock('td-medium-clear');
      if (diff === 'hard') unlock('td-hard-clear');
      if (diff === 'expert') unlock('td-expert-clear');

      // Flawless
      if (gs.noLivesLost) unlock('td-no-leak');

      // Close call — win with exactly 1 life
      if (gs.lives === 1) unlock('td-close-call');

      // Specialist — all towers are the same type
      if (gs.towers.length > 0) {
        const types = new Set(gs.towers.map(t => t.type));
        if (types.size === 1) unlock('td-one-type');
      }

      // Challenge mode completions
      if (gs.challenge) {
        unlock('td-challenge-1');
        // td-challenge-5 checked via progress data below
      }

      // Map completion counting (uses progress from localStorage)
      try {
        const profileId = localStorage.getItem('hugos-arcade-active-profile');
        if (profileId) {
          const data = JSON.parse(localStorage.getItem(`hugos-arcade-profile-${profileId}`) || '{}');
          const progress = data.gameProgress?.['tower-defense'] || {};
          // Count maps with completed flag
          const mapIds = ['space-station', 'alien-planet', 'asteroid-field', 'cyberpunk-city',
                          'crystal-caves', 'frozen-tundra', 'volcanic-core', 'quantum-rift'];
          const completedMaps = mapIds.filter(id => progress[id]?.completed).length;
          if (completedMaps >= 3) unlock('td-map-3');
          if (completedMaps >= 8) unlock('td-map-all');

          // Count completed challenges
          let totalChallenges = 0;
          for (const id of mapIds) {
            const chalData = progress[`${id}_challenges`];
            if (chalData) {
              for (const diff of ['easy', 'medium', 'hard']) {
                if (Array.isArray(chalData[diff])) totalChallenges += chalData[diff].length;
              }
            }
          }
          if (totalChallenges >= 5) unlock('td-challenge-5');
        }
      } catch (e) { /* ignore localStorage errors */ }
    }

    // Playstyle (checked anytime)
    if (gs.speedMultiplier === 3 && gs.wavePhase === 'active') unlock('td-speed-demon');
    if (gs.currentWave >= 30 && (gs.difficulty === 'hard' || gs.difficulty === 'expert')) unlock('td-survivor');
  }

  // --- Serialize current game state for save ---
  serializeGameState() {
    const gs = this.gs;
    return {
      lives: gs.lives,
      cash: gs.cash,
      currentWave: gs.currentWave,
      gameTime: gs.gameTime,
      enemiesKilled: gs.enemiesKilled,
      bossesKilled: gs.bossesKilled,
      towersBuilt: gs.towersBuilt,
      totalCashEarned: gs.totalCashEarned,
      noLivesLost: gs.noLivesLost,
      towers: gs.towers.map(t => ({
        type: t.type,
        col: t.col,
        row: t.row,
        upgrades: [...t.upgrades],
        totalSpent: t.totalSpent,
        targetingMode: t.targetingMode,
        kills: t.kills || 0,
        abilityCooldown: t.abilityCooldown || 0,
      })),
      heroes: gs.heroes.map(h => ({
        type: h.type,
        col: h.col,
        row: h.row,
      })),
    };
  }

  // --- Save active game state (for resume on re-entry) ---
  saveActiveGame() {
    if (!this.api.progress) return;
    const gs = this.gs;
    const mapId = gs.mapDef?.id;
    if (!mapId) return;
    // Only save if the game is still in progress (not game over or victory)
    if (gs.state !== 'playing' && gs.state !== 'paused') return;
    // Only save if we've started playing (wave > 0 or have towers)
    if (gs.currentWave === 0 && gs.towers.length === 0) return;

    this.api.progress.save('_save_' + mapId, this.serializeGameState());
  }

  // --- Clear active game save ---
  clearGameSave(mapId) {
    if (!this.api.progress) return;
    if (!mapId) return;
    this.api.progress.save('_save_' + mapId, { cleared: true });
  }

  // --- Save Game Progress (stats) ---
  saveProgress() {
    if (!this.api.progress) return;
    const gs = this.gs;
    if (gs._progressSaved) return; // Prevent double-save
    const mapId = gs.mapDef?.id;
    if (!mapId) return;

    gs._progressSaved = true;

    // Key by difficulty for separate tracking
    const progressKey = gs.difficulty ? `${mapId}_${gs.difficulty}` : mapId;
    const existing = this.api.progress.load(progressKey) || {};
    const wavesReached = gs.wave + 1;
    const isVictory = gs.gameResult === 'victory';
    const isFlawless = isVictory && gs.lives >= gs.initialLives;

    // Also save challenge completion
    if (isVictory && gs.challenge) {
      const chalKey = `${mapId}_challenges`;
      const chalProgress = this.api.progress.load(chalKey) || {};
      const diff = gs.difficulty || 'medium';
      if (!chalProgress[diff]) chalProgress[diff] = [];
      if (!chalProgress[diff].includes(gs.challenge)) {
        chalProgress[diff].push(gs.challenge);
      }
      this.api.progress.save(chalKey, chalProgress);
    }

    // Also mark the base difficulty as completed (without difficulty suffix for map select badges)
    if (isVictory) {
      const baseExisting = this.api.progress.load(mapId) || {};
      this.api.progress.save(mapId, {
        ...baseExisting,
        completed: true,
        [`${gs.difficulty || 'medium'}Completed`]: true,
      });
    }

    this.api.progress.save(progressKey, {
      bestWave: Math.max(existing.bestWave || 0, wavesReached),
      completed: existing.completed || isVictory,
      bestTime: isVictory
        ? Math.min(existing.bestTime || Infinity, Math.floor(gs.gameTime))
        : (existing.bestTime || null),
      totalKills: (existing.totalKills || 0) + gs.enemiesKilled,
      flawless: existing.flawless || isFlawless,
      timesPlayed: (existing.timesPlayed || 0) + 1,
    });

    // Clear the active save on game end (victory or defeat)
    if (gs.gameResult) {
      this.clearGameSave(mapId);
    }
  }
}
