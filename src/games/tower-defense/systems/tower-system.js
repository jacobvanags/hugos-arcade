/**
 * Tower placement, targeting, firing, and upgrades.
 */
import { TOWER_TYPES, getUpgradeCost } from '../data/tower-defs.js';
import { config, cellToPixel } from '../config.js';
import { findTarget } from './targeting.js';
import { vecAngle } from '../../../shared/math-utils.js';
import { playShoot } from '../sounds/td-sounds.js';

let nextId = 1;

/** Deterministic pseudo-random from integer seed + channel. Returns [0, 1). */
function seededRandom(seed, channel) {
  const n = ((seed * 2654435761 + channel * 340573321) >>> 0);
  return ((n ^ (n >> 16)) & 0xFFFF) / 0x10000;
}

/** Parse hex color to {r,g,b}. */
function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

/** Convert RGB to hex string. */
function rgbToHex(r, g, b) {
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

/** Shift a hex color's hue (degrees) and brightness (factor). */
function shiftColor(hex, hueDeg, brightnessFactor) {
  let { r, g, b } = hexToRgb(hex);
  // Simplified hue rotation via channel mixing
  const angle = hueDeg * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const nr = r * (0.667 + cos * 0.333) + g * (0.333 - cos * 0.333 - sin * 0.577) + b * (0.333 - cos * 0.333 + sin * 0.577);
  const ng = r * (0.333 - cos * 0.333 + sin * 0.577) + g * (0.667 + cos * 0.333) + b * (0.333 - cos * 0.333 - sin * 0.577);
  const nb = r * (0.333 - cos * 0.333 - sin * 0.577) + g * (0.333 - cos * 0.333 + sin * 0.577) + b * (0.667 + cos * 0.333);
  const bf = 1 + brightnessFactor;
  return rgbToHex(
    Math.max(0, Math.min(255, nr * bf)),
    Math.max(0, Math.min(255, ng * bf)),
    Math.max(0, Math.min(255, nb * bf))
  );
}

/** Initialize visual variation for a tower (deterministic from id). */
function initTowerVisuals(tower) {
  const s = tower.id;
  const hueShift = (seededRandom(s, 0) - 0.5) * 24;
  const brightnessShift = (seededRandom(s, 1) - 0.5) * 0.16;
  tower.visual = {
    variedColor: shiftColor(tower.color, hueShift, brightnessShift),
    hueShift,
    brightnessShift,
    hasAntenna: seededRandom(s, 2) > 0.5,
    hasVent: seededRandom(s, 3) > 0.5,
    rivetPattern: Math.floor(seededRandom(s, 4) * 3),
    panelAngle: seededRandom(s, 5) * Math.PI,
    accentX: (seededRandom(s, 7) - 0.5) * 2,
    accentY: (seededRandom(s, 8) - 0.5) * 2,
    displaySize: tower.size,
  };
}

/** Recalculate visual properties after upgrade. */
function recalcVisuals(tower) {
  if (!tower.visual) { initTowerVisuals(tower); return; }
  // Update display size based on upgrade tier
  const maxTier = Math.max(...tower.upgrades);
  tower.visual.displaySize = tower.size + (maxTier >= 3 ? 2 : 0) + (maxTier >= 5 ? 2 : 0);
}

export function createTowerSystem() {
  return {
    /**
     * Check if a tower can be placed at a grid cell.
     */
    canPlace(gs, col, row) {
      if (col < 0 || col >= config.gridCols || row < 0 || row >= config.gridRows) return false;
      return gs.grid[row][col] === config.EMPTY;
    },

    /**
     * Place a tower on the grid.
     */
    placeTower(gs, towerType, col, row) {
      const def = TOWER_TYPES[towerType];
      if (!def) return null;
      if (!this.canPlace(gs, col, row)) return null;
      if (gs.cash < def.baseCost) return null;

      gs.cash -= def.baseCost;
      gs.grid[row][col] = config.TOWER;

      const pos = cellToPixel(col, row);
      const tower = {
        id: nextId++,
        type: towerType,
        col,
        row,
        x: pos.x,
        y: pos.y,
        angle: 0,
        range: def.baseRange,
        damage: def.baseDamage,
        fireRate: def.baseFireRate,
        fireCooldown: 0,
        projectileSpeed: def.baseProjectileSpeed || 300,
        projectileType: def.projectileType,
        // Upgrades
        upgrades: [0, 0, 0],
        totalSpent: def.baseCost,
        // Targeting
        targetId: null,
        targetingMode: def.targetingDefault || 'first',
        // Type-specific stats (defaults)
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
        // DOT (Venom Spitter)
        dotDps: def.baseDotDps || 0,
        dotDuration: def.baseDotDuration || 0,
        // Damage amplification (Disruptor)
        damageAmp: def.baseDamageAmp || 0,
        damageAmpDuration: def.baseDamageAmpDuration || 0,
        // Ramp-up beam (Particle Beam)
        rampRate: def.baseRampRate || 0,
        maxRamp: def.baseMaxRamp || 0,
        _rampTarget: null,
        _rampBonus: 0,
        // Ability
        abilityUnlocked: false,
        abilityCooldown: 0,
        abilityActive: false,
        abilityTimer: 0,
        // Visual
        color: def.color,
        size: def.size,
      };

      initTowerVisuals(tower);
      gs.towers.push(tower);
      gs.towersBuilt++;
      return tower;
    },

    /**
     * Update all towers — find targets and fire.
     */
    update(dt, gs) {
      // Apply support buffs first
      this.applyBuffs(gs);

      // Tick ability cooldowns and active timers
      for (const tower of gs.towers) {
        if (tower.abilityCooldown > 0) {
          tower.abilityCooldown -= dt;
          if (tower.abilityCooldown < 0) tower.abilityCooldown = 0;
        }
        if (tower.abilityActive) {
          tower.abilityTimer -= dt;
          if (tower.abilityTimer <= 0) {
            this.deactivateAbility(tower, gs);
          }
        }
      }

      // Update per-frame active abilities (gravity well, storm nexus, etc.)
      this.updateActiveAbilities(dt, gs);

      for (const tower of gs.towers) {
        if (!tower.fireRate || tower.fireRate <= 0) continue; // Support drones don't fire
        if (tower.projectileType === null) continue;

        // Cooldown
        tower.fireCooldown -= dt;

        // Find target
        const target = findTarget(tower, gs.enemies, tower.targetingMode);
        if (target) {
          tower.angle = vecAngle(tower, target);
          tower.targetId = target.id;

          // Fire when ready
          if (tower.fireCooldown <= 0) {
            tower.fireCooldown = tower.effectiveFireRate || tower.fireRate;
            this.fire(tower, target, gs);
          }
        } else {
          tower.targetId = null;
        }
      }
    },

    /**
     * Create a projectile from tower to target.
     */
    fire(tower, target, gs) {
      if (tower.projectileType === 'lightning') {
        this.fireLightning(tower, target, gs);
        return;
      }
      if (tower.projectileType === 'pulse') {
        this.firePulse(tower, gs);
        return;
      }
      if (tower.projectileType === 'beam') {
        this.fireBeam(tower, target, gs);
        return;
      }

      playShoot(tower.type);
      gs.projectiles.push({
        x: tower.x,
        y: tower.y,
        targetId: target.id,
        targetX: target.x,
        targetY: target.y,
        speed: tower.projectileSpeed,
        damage: tower.effectiveDamage || tower.damage,
        angle: tower.angle,
        type: tower.projectileType,
        splashRadius: tower.splashRadius,
        slowFactor: tower.slowFactor,
        slowDuration: tower.slowDuration,
        pierce: tower.pierce || 0,
        pierceCount: 0,
        hitEnemies: [],
        armorPierce: tower.armorPierce || 0,
        dotDps: tower.dotDps || 0,
        dotDuration: tower.dotDuration || 0,
        size: 3,
        color: tower.color,
        alive: true,
        homing: tower.projectileType === 'missile',
        turnRate: 4,
      });
    },

    fireLightning(tower, target, gs) {
      playShoot(tower.type);
      // Instant chain damage
      const enemies = [target];
      const damage = tower.effectiveDamage || tower.damage;
      let current = target;

      // Chain to nearby enemies
      for (let c = 0; c < tower.chainCount - 1; c++) {
        let closest = null;
        let closestDist = tower.chainRange * tower.chainRange;
        for (const e of gs.enemies) {
          if (e.hp <= 0 || enemies.includes(e)) continue;
          const dx = e.x - current.x;
          const dy = e.y - current.y;
          const d = dx * dx + dy * dy;
          if (d < closestDist) {
            closestDist = d;
            closest = e;
          }
        }
        if (!closest) break;
        enemies.push(closest);
        current = closest;
      }

      // Store chain for rendering
      gs.lightningChains = gs.lightningChains || [];
      gs.lightningChains.push({
        points: [{ x: tower.x, y: tower.y }, ...enemies.map(e => ({ x: e.x, y: e.y }))],
        timer: 0.15,
        color: tower.color,
      });

      // Apply damage to all chained enemies
      for (const e of enemies) {
        gs.enemySystem.damageEnemy(e, damage, gs, tower.armorPierce || 0);
      }
    },

    fireBeam(tower, target, gs) {
      playShoot(tower.type);
      let baseDmg = tower.effectiveDamage || tower.damage;

      // Ramp-up mechanic (Particle Beam)
      if (tower.rampRate > 0) {
        if (tower._rampTarget === target.id) {
          tower._rampBonus = Math.min(tower._rampBonus + tower.rampRate * (tower.effectiveFireRate || tower.fireRate), tower.maxRamp);
        } else {
          tower._rampTarget = target.id;
          tower._rampBonus = 0;
        }
        baseDmg += tower._rampBonus;
      }

      const damage = baseDmg * (tower.effectiveFireRate || tower.fireRate);
      gs.enemySystem.damageEnemy(target, damage, gs, tower.armorPierce || 0);

      // Disruptor: apply damage amp to target
      if (tower.damageAmp > 0) {
        gs.enemySystem.applyDamageAmp(target, tower.damageAmp, tower.damageAmpDuration || 2.0);
      }

      // Store beam for rendering
      gs.beams = gs.beams || [];
      gs.beams = gs.beams.filter(b => b.towerId !== tower.id);
      gs.beams.push({
        towerId: tower.id,
        x1: tower.x,
        y1: tower.y,
        x2: target.x,
        y2: target.y,
        color: tower.color,
        timer: 0.1,
      });
    },

    firePulse(tower, gs) {
      playShoot(tower.type);
      // Hit ALL enemies in range
      const range = tower.effectiveRange || tower.range;
      const rangeSq = range * range;
      const damage = tower.effectiveDamage || tower.damage;
      let hitAny = false;

      for (const e of gs.enemies) {
        if (e.hp <= 0) continue;
        if (e.cloaked && !tower.detectCloaked) continue;
        const dx = e.x - tower.x;
        const dy = e.y - tower.y;
        if (dx * dx + dy * dy <= rangeSq) {
          gs.enemySystem.damageEnemy(e, damage, gs, tower.armorPierce || 0);
          // Apply slow if tower has it
          if (tower.slowFactor > 0 && tower.slowDuration > 0) {
            gs.enemySystem.slowEnemy(e, tower.slowFactor, tower.slowDuration);
          }
          hitAny = true;
        }
      }

      // Visual pulse ring
      if (hitAny) {
        gs.pulseRings = gs.pulseRings || [];
        gs.pulseRings.push({
          x: tower.x,
          y: tower.y,
          radius: range,
          color: tower.color,
          timer: 0.3,
          maxTimer: 0.3,
        });
      }
    },

    /**
     * Apply support drone buffs to nearby towers + compute bonus cash total.
     */
    applyBuffs(gs) {
      // Reset effective stats and buff flag
      for (const tower of gs.towers) {
        tower.effectiveDamage = tower.damage;
        tower.effectiveFireRate = tower.fireRate;
        tower.effectiveRange = tower.range;
        tower.buffed = false;
        tower.detectCloaked = tower.ownDetectCloaked || false;
      }

      // Reset enemy revealed state (re-calculated each frame)
      for (const enemy of gs.enemies) {
        enemy.revealed = false;
      }

      // Compute total bonus cash % from all laser drones
      let bonusCashTotal = 0;
      for (const tower of gs.towers) {
        if (tower.bonusCashPct > 0) bonusCashTotal += tower.bonusCashPct;
      }
      gs.bonusCashPctTotal = bonusCashTotal;

      // Apply buffs from support drones
      for (const support of gs.towers) {
        if (support.type !== 'support') continue;
        if (support.buffRadius <= 0) continue;

        const rSq = support.buffRadius * support.buffRadius;
        for (const tower of gs.towers) {
          if (tower === support) continue;
          const dx = tower.x - support.x;
          const dy = tower.y - support.y;
          if (dx * dx + dy * dy <= rSq) {
            tower.buffed = true;
            if (support.buffDamage > 0) {
              tower.effectiveDamage = tower.damage * (1 + support.buffDamage);
            }
            if (support.buffSpeed > 0) {
              tower.effectiveFireRate = tower.fireRate * (1 - support.buffSpeed);
            }
            if (support.buffRange > 0) {
              tower.effectiveRange = tower.range * (1 + support.buffRange);
            }
            // Pass cloaked detection from support
            if (support.detectCloaked) {
              tower.detectCloaked = true;
            }
          }
        }
      }

      // Mark cloaked enemies as revealed if in range of any tower with detectCloaked
      for (const tower of gs.towers) {
        if (!tower.detectCloaked) continue;
        const range = tower.effectiveRange || tower.range;
        const rSq = range * range;
        for (const enemy of gs.enemies) {
          if (!enemy.cloaked || enemy.revealed) continue;
          const dx = enemy.x - tower.x;
          const dy = enemy.y - tower.y;
          if (dx * dx + dy * dy <= rSq) {
            enemy.revealed = true;
          }
        }
      }
    },

    /**
     * Check if upgrade is allowed by the [5,2,0] constraint.
     */
    canUpgrade(tower, pathIndex) {
      const current = tower.upgrades[pathIndex];
      if (current >= 5) return false;

      const others = [0, 1, 2].filter(i => i !== pathIndex);
      const otherLevels = others.map(i => tower.upgrades[i]);

      // Can't start a 3rd path
      const pathsUsed = tower.upgrades.filter(u => u > 0).length;
      if (current === 0 && pathsUsed >= 2) return false;

      // One path can go to 5, another to 2, third stays 0
      const maxOther = Math.max(...otherLevels);
      if (current >= 2 && maxOther > 2) return false;
      if (maxOther >= 2) {
        // Another path is at 2+, so this path can go to 5
        // But only if the other is at exactly 2 or less
        const highPath = others.find(i => tower.upgrades[i] > 2);
        if (highPath !== undefined && current >= 2) return false;
      }

      return true;
    },

    /**
     * Purchase an upgrade for a tower.
     */
    upgrade(tower, pathIndex, gs) {
      if (!this.canUpgrade(tower, pathIndex)) return false;
      const cost = getUpgradeCost(tower.type, pathIndex, tower.upgrades[pathIndex]);
      if (gs.cash < cost) return false;

      gs.cash -= cost;
      tower.upgrades[pathIndex]++;
      tower.totalSpent += cost;
      this.recalcStats(tower);
      recalcVisuals(tower);
      return true;
    },

    /**
     * Recalculate tower stats from base + all upgrade effects.
     */
    recalcStats(tower) {
      const def = TOWER_TYPES[tower.type];
      // Reset to base
      tower.range = def.baseRange;
      tower.damage = def.baseDamage;
      tower.fireRate = def.baseFireRate;
      tower.splashRadius = def.baseSplashRadius || 0;
      tower.slowFactor = def.baseSlowFactor || 0;
      tower.slowDuration = def.baseSlowDuration || 0;
      tower.chainCount = def.baseChainCount || 0;
      tower.chainRange = def.baseChainRange || 0;
      tower.buffDamage = def.baseBuffDamage || 0;
      tower.buffRange = def.baseBuffRange || 0;
      tower.buffSpeed = def.baseBuffSpeed || 0;
      tower.buffRadius = def.baseBuffRadius || 0;
      tower.detectCloaked = def.baseDetectCloaked || false;
      tower.ownDetectCloaked = def.baseDetectCloaked || false;
      tower.pierce = def.basePierce || 0;
      tower.armorPierce = def.baseArmorPierce || 0;
      tower.income = def.baseIncome || 0;
      tower.bonusCashPct = 0;
      tower.dotDps = def.baseDotDps || 0;
      tower.dotDuration = def.baseDotDuration || 0;
      tower.damageAmp = def.baseDamageAmp || 0;
      tower.damageAmpDuration = def.baseDamageAmpDuration || 0;
      tower.rampRate = def.baseRampRate || 0;
      tower.maxRamp = def.baseMaxRamp || 0;

      // Apply all purchased upgrade tiers
      for (let p = 0; p < 3; p++) {
        const tier = tower.upgrades[p];
        for (let t = 0; t < tier; t++) {
          const effects = def.upgradePaths[p].tiers[t].effects;
          for (const [key, val] of Object.entries(effects)) {
            if (typeof val === 'boolean') {
              tower[key] = val;
            } else {
              tower[key] = val; // Direct set (not additive)
            }
          }
        }
      }
      // Track own detectCloaked from upgrades (vs support buff)
      tower.ownDetectCloaked = tower.detectCloaked;

      // Unlock ability at T4 on any path
      const def2 = TOWER_TYPES[tower.type];
      tower.abilityUnlocked = def2.ability && Math.max(...tower.upgrades) >= 4;
    },

    /**
     * Activate a tower's special ability.
     */
    activateAbility(tower, gs) {
      if (!tower.abilityUnlocked) return false;
      if (tower.abilityCooldown > 0 || tower.abilityActive) return false;

      const def = TOWER_TYPES[tower.type];
      const ability = def.ability;
      if (!ability) return false;

      tower.abilityCooldown = ability.cooldown;

      switch (ability.effect) {
        case 'bulletHell': {
          // Spawn 3 phantom turret clones around tower
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          if (!gs.phantomTowers) gs.phantomTowers = [];
          const offsets = [
            { dx: -30, dy: -20 }, { dx: 30, dy: -20 }, { dx: 0, dy: 30 },
          ];
          for (const off of offsets) {
            gs.phantomTowers.push({
              x: tower.x + off.dx,
              y: tower.y + off.dy,
              parentId: tower.id,
              angle: 0,
              fireCooldown: 0,
              fireRate: tower.effectiveFireRate || tower.fireRate,
              damage: tower.effectiveDamage || tower.damage,
              range: tower.effectiveRange || tower.range,
              projectileSpeed: tower.projectileSpeed,
              color: tower.color,
              timer: ability.duration,
              detectCloaked: tower.detectCloaked,
            });
          }
          break;
        }

        case 'killshot': {
          // Execute strongest enemy below 15% HP, else 500 true damage
          let strongest = null;
          let maxHp = 0;
          for (const e of gs.enemies) {
            if (e.hp <= 0) continue;
            if (e.hp > maxHp) { maxHp = e.hp; strongest = e; }
          }
          if (strongest) {
            if (strongest.hp / strongest.maxHp <= 0.15) {
              gs.enemySystem.damageEnemy(strongest, strongest.hp + 1000, gs, 999);
            } else {
              gs.enemySystem.damageEnemy(strongest, 500, gs, 999);
            }
            gs.effects.push({
              type: 'explosion', x: strongest.x, y: strongest.y,
              radius: 30, maxRadius: 30, timer: 0.4, maxTimer: 0.4, color: '#ff4444',
            });
          }
          break;
        }

        case 'meteorStrike': {
          // 5 targeted splash explosions on enemies
          const targets = [...gs.enemies].filter(e => e.hp > 0)
            .sort((a, b) => b.hp - a.hp).slice(0, 5);
          for (const t of targets) {
            const dmg = (tower.effectiveDamage || tower.damage) * 8;
            const splashR = 60;
            for (const e of gs.enemies) {
              if (e.hp <= 0) continue;
              const dx = e.x - t.x, dy = e.y - t.y;
              if (dx * dx + dy * dy <= splashR * splashR) {
                gs.enemySystem.damageEnemy(e, dmg, gs, tower.armorPierce || 0);
              }
            }
            gs.effects.push({
              type: 'explosion', x: t.x, y: t.y,
              radius: splashR, maxRadius: splashR, timer: 0.5, maxTimer: 0.5, color: '#ff8800',
            });
          }
          break;
        }

        case 'absoluteZero': {
          // Freeze ALL enemies on map for 4s
          for (const e of gs.enemies) {
            if (e.hp <= 0) continue;
            e.stunDuration = 4.0;
          }
          gs.effects.push({
            type: 'explosion', x: config.gameArea.w / 2, y: config.gameArea.y + config.gameArea.h / 2,
            radius: 400, maxRadius: 400, timer: 0.6, maxTimer: 0.6, color: '#88ddff',
          });
          break;
        }

        case 'stormNexus': {
          // Lightning hits ALL enemies in range every 0.5s for 6s
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          tower._stormTick = 0;
          break;
        }

        case 'overchargeField': {
          // Global tower buff — applied via gs flags
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          gs.supportOverchargeActive = true;
          gs.supportOverchargeTimer = ability.duration;
          break;
        }

        case 'nuclearLaunch': {
          // Density-seeking 150px nuke — find cluster of enemies
          let bestX = 0, bestY = 0, bestCount = 0;
          for (const e of gs.enemies) {
            if (e.hp <= 0) continue;
            let count = 0;
            for (const o of gs.enemies) {
              if (o.hp <= 0) continue;
              const dx = o.x - e.x, dy = o.y - e.y;
              if (dx * dx + dy * dy <= 150 * 150) count++;
            }
            if (count > bestCount) { bestCount = count; bestX = e.x; bestY = e.y; }
          }
          if (bestCount > 0) {
            const nukeDmg = (tower.effectiveDamage || tower.damage) * 5;
            for (const e of gs.enemies) {
              if (e.hp <= 0) continue;
              const dx = e.x - bestX, dy = e.y - bestY;
              if (dx * dx + dy * dy <= 150 * 150) {
                gs.enemySystem.damageEnemy(e, nukeDmg, gs, tower.armorPierce || 0);
              }
            }
            gs.effects.push({
              type: 'explosion', x: bestX, y: bestY,
              radius: 150, maxRadius: 150, timer: 0.8, maxTimer: 0.8, color: '#ff6600',
            });
          }
          break;
        }

        case 'goldRush': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          gs.goldRushActive = true;
          gs.goldRushTimer = ability.duration;
          break;
        }

        case 'motherLode': {
          // Instant 5x income grant + next wave double income
          const income = tower.income || 25;
          gs.cash += income * 5;
          gs.totalCashEarned += income * 5;
          gs.motherLodeNextWave = true;
          gs.effects.push({
            type: 'explosion', x: tower.x, y: tower.y,
            radius: 60, maxRadius: 60, timer: 0.5, maxTimer: 0.5, color: '#ffd700',
          });
          break;
        }

        case 'shrapnelStorm': {
          // 30 piercing projectiles in 360° burst
          const baseDmg = tower.effectiveDamage || tower.damage;
          for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            gs.projectiles.push({
              x: tower.x, y: tower.y,
              targetId: null,
              targetX: tower.x + Math.cos(angle) * 300,
              targetY: tower.y + Math.sin(angle) * 300,
              speed: tower.projectileSpeed || 400,
              damage: baseDmg * 2,
              angle,
              type: 'bullet',
              splashRadius: 0,
              slowFactor: 0, slowDuration: 0,
              pierce: 999, pierceCount: 0, hitEnemies: [],
              armorPierce: tower.armorPierce || 0,
              size: 3, color: tower.color, alive: true,
              homing: false, turnRate: 0,
            });
          }
          break;
        }

        case 'plagueCloud': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          gs.plagueCloudActive = true;
          gs.plagueCloudTimer = ability.duration;
          gs.plagueCloudDps = (tower.dotDps || 6) * 3;
          break;
        }

        case 'gravityWell': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          break;
        }

        case 'armorShred': {
          // Line pierce from tower toward strongest enemy, permanently removes armor
          let target = null;
          let maxHp2 = 0;
          for (const e of gs.enemies) {
            if (e.hp <= 0) continue;
            if (e.hp > maxHp2) { maxHp2 = e.hp; target = e; }
          }
          if (target) {
            const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
            const lineDmg = (tower.effectiveDamage || tower.damage) * 3;
            // Hit all enemies in a line (width 20, length 500)
            for (const e of gs.enemies) {
              if (e.hp <= 0) continue;
              const dx = e.x - tower.x, dy = e.y - tower.y;
              const proj = dx * Math.cos(angle) + dy * Math.sin(angle);
              const perp = Math.abs(-dx * Math.sin(angle) + dy * Math.cos(angle));
              if (proj > 0 && proj < 500 && perp < 20) {
                e.armor = 0; // Permanent armor removal
                gs.enemySystem.damageEnemy(e, lineDmg, gs, 999);
              }
            }
            gs.effects.push({
              type: 'explosion', x: tower.x + Math.cos(angle) * 250,
              y: tower.y + Math.sin(angle) * 250,
              radius: 20, maxRadius: 20, timer: 0.3, maxTimer: 0.3, color: '#4488ff',
            });
          }
          break;
        }

        case 'rollingBarrage': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          tower._barrageTick = 0;
          tower._barrageCount = 0;
          break;
        }

        case 'totalVulnerability': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          gs.totalVulnerabilityActive = true;
          gs.totalVulnerabilityTimer = ability.duration;
          break;
        }

        case 'singularityBeam': {
          tower.abilityActive = true;
          tower.abilityTimer = ability.duration;
          tower._singularityDmg = 10;
          tower._singularityTick = 0;
          break;
        }
      }

      return true;
    },

    /**
     * Deactivate a tower ability when its timer expires.
     */
    deactivateAbility(tower, gs) {
      tower.abilityActive = false;
      tower.abilityTimer = 0;

      const def = TOWER_TYPES[tower.type];
      if (!def || !def.ability) return;

      switch (def.ability.effect) {
        case 'bulletHell':
          if (gs.phantomTowers) {
            gs.phantomTowers = gs.phantomTowers.filter(p => p.parentId !== tower.id);
          }
          break;
        case 'overchargeField':
          gs.supportOverchargeActive = false;
          gs.supportOverchargeTimer = 0;
          break;
        case 'goldRush':
          gs.goldRushActive = false;
          gs.goldRushTimer = 0;
          break;
        case 'plagueCloud':
          gs.plagueCloudActive = false;
          gs.plagueCloudTimer = 0;
          gs.plagueCloudDps = 0;
          break;
        case 'totalVulnerability':
          gs.totalVulnerabilityActive = false;
          gs.totalVulnerabilityTimer = 0;
          break;
      }
    },

    /**
     * Per-frame updates for active abilities (gravity well, storm nexus, rolling barrage, etc.)
     */
    updateActiveAbilities(dt, gs) {
      // Phantom tower firing (Bullet Hell)
      if (gs.phantomTowers) {
        for (let i = gs.phantomTowers.length - 1; i >= 0; i--) {
          const pt = gs.phantomTowers[i];
          pt.timer -= dt;
          if (pt.timer <= 0) { gs.phantomTowers.splice(i, 1); continue; }
          pt.fireCooldown -= dt;
          if (pt.fireCooldown <= 0) {
            pt.fireCooldown = pt.fireRate;
            const target = findTarget(pt, gs.enemies, 'first');
            if (target) {
              pt.angle = vecAngle(pt, target);
              gs.projectiles.push({
                x: pt.x, y: pt.y, targetId: target.id,
                targetX: target.x, targetY: target.y,
                speed: pt.projectileSpeed || 350, damage: pt.damage,
                angle: pt.angle, type: 'bullet',
                splashRadius: 0, slowFactor: 0, slowDuration: 0,
                pierce: 0, pierceCount: 0, hitEnemies: [],
                armorPierce: 0, size: 3, color: pt.color, alive: true,
                homing: false, turnRate: 0,
              });
            }
          }
        }
      }

      // Global ability timers
      if (gs.goldRushTimer > 0) {
        gs.goldRushTimer -= dt;
        if (gs.goldRushTimer <= 0) { gs.goldRushActive = false; gs.goldRushTimer = 0; }
      }
      if (gs.supportOverchargeTimer > 0) {
        gs.supportOverchargeTimer -= dt;
        if (gs.supportOverchargeTimer <= 0) { gs.supportOverchargeActive = false; gs.supportOverchargeTimer = 0; }
      }
      if (gs.totalVulnerabilityTimer > 0) {
        gs.totalVulnerabilityTimer -= dt;
        if (gs.totalVulnerabilityTimer <= 0) { gs.totalVulnerabilityActive = false; gs.totalVulnerabilityTimer = 0; }
      }
      if (gs.plagueCloudTimer > 0) {
        gs.plagueCloudTimer -= dt;
        if (gs.plagueCloudTimer <= 0) {
          gs.plagueCloudActive = false; gs.plagueCloudTimer = 0; gs.plagueCloudDps = 0;
        }
      }

      // Plague Cloud — DOT all enemies each frame
      if (gs.plagueCloudActive && gs.plagueCloudDps > 0) {
        const dotDmg = gs.plagueCloudDps * dt;
        for (const e of gs.enemies) {
          if (e.hp <= 0) continue;
          gs.enemySystem.damageEnemy(e, dotDmg, gs, 999);
        }
      }

      // Per-tower active abilities
      for (const tower of gs.towers) {
        if (!tower.abilityActive) continue;
        const def = TOWER_TYPES[tower.type];
        if (!def || !def.ability) continue;

        switch (def.ability.effect) {
          case 'stormNexus': {
            tower._stormTick = (tower._stormTick || 0) + dt;
            if (tower._stormTick >= 0.5) {
              tower._stormTick -= 0.5;
              const range = tower.effectiveRange || tower.range;
              const rSq = range * range;
              const dmg = tower.effectiveDamage || tower.damage;
              const chainPts = [{ x: tower.x, y: tower.y }];
              for (const e of gs.enemies) {
                if (e.hp <= 0) continue;
                const dx = e.x - tower.x, dy = e.y - tower.y;
                if (dx * dx + dy * dy <= rSq) {
                  gs.enemySystem.damageEnemy(e, dmg * 2, gs, tower.armorPierce || 0);
                  chainPts.push({ x: e.x, y: e.y });
                }
              }
              if (chainPts.length > 1) {
                gs.lightningChains = gs.lightningChains || [];
                gs.lightningChains.push({ points: chainPts, timer: 0.2, color: '#ffd700' });
              }
            }
            break;
          }

          case 'gravityWell': {
            // Pull enemies toward tower + crush damage
            const range = (tower.effectiveRange || tower.range) * 2;
            const rSq = range * range;
            const crushDmg = (tower.effectiveDamage || tower.damage) * 2 * dt;
            for (const e of gs.enemies) {
              if (e.hp <= 0) continue;
              const dx = e.x - tower.x, dy = e.y - tower.y;
              const distSq = dx * dx + dy * dy;
              if (distSq <= rSq && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const pull = 80 * dt;
                e.x -= (dx / dist) * pull;
                e.y -= (dy / dist) * pull;
                gs.enemySystem.damageEnemy(e, crushDmg, gs, tower.armorPierce || 0);
              }
            }
            break;
          }

          case 'rollingBarrage': {
            tower._barrageTick = (tower._barrageTick || 0) + dt;
            const interval = 6 / 20; // 20 impacts over 6s
            if (tower._barrageTick >= interval && (tower._barrageCount || 0) < 20) {
              tower._barrageTick -= interval;
              tower._barrageCount = (tower._barrageCount || 0) + 1;
              // Random path position
              if (gs.paths && gs.paths[0]) {
                const wps = gs.paths[0].waypoints;
                const wi = Math.floor(Math.random() * (wps.length - 1));
                const t = Math.random();
                const ix = wps[wi].x + (wps[wi + 1].x - wps[wi].x) * t;
                const iy = wps[wi].y + (wps[wi + 1].y - wps[wi].y) * t;
                const splR = tower.splashRadius || 50;
                const dmg = (tower.effectiveDamage || tower.damage) * 3;
                for (const e of gs.enemies) {
                  if (e.hp <= 0) continue;
                  const ddx = e.x - ix, ddy = e.y - iy;
                  if (ddx * ddx + ddy * ddy <= splR * splR) {
                    gs.enemySystem.damageEnemy(e, dmg, gs, tower.armorPierce || 0);
                  }
                }
                gs.effects.push({
                  type: 'explosion', x: ix, y: iy,
                  radius: splR, maxRadius: splR, timer: 0.4, maxTimer: 0.4, color: '#cc8844',
                });
              }
            }
            break;
          }

          case 'singularityBeam': {
            // Escalating true-damage beam on strongest enemy
            tower._singularityTick = (tower._singularityTick || 0) + dt;
            tower._singularityDmg = (tower._singularityDmg || 10) + 20 * dt; // Ramp 20/s
            if (tower._singularityTick >= 0.2) {
              tower._singularityTick -= 0.2;
              let strongest = null, maxHp = 0;
              for (const e of gs.enemies) {
                if (e.hp <= 0) continue;
                if (e.hp > maxHp) { maxHp = e.hp; strongest = e; }
              }
              if (strongest) {
                gs.enemySystem.damageEnemy(strongest, tower._singularityDmg, gs, 999);
                gs.beams = gs.beams || [];
                gs.beams.push({
                  towerId: tower.id, x1: tower.x, y1: tower.y,
                  x2: strongest.x, y2: strongest.y,
                  color: '#ff6688', timer: 0.2,
                });
              }
            }
            break;
          }
        }
      }

      // Overcharge field — boost all towers while active
      if (gs.supportOverchargeActive) {
        for (const t of gs.towers) {
          t.effectiveDamage = (t.effectiveDamage || t.damage) * 2;
          t.effectiveFireRate = (t.effectiveFireRate || t.fireRate) * 0.67;
          t.detectCloaked = true;
          t.buffed = true;
        }
      }
    },

    /**
     * Sell a tower and refund cash.
     */
    sellTower(tower, gs) {
      const refund = Math.floor(tower.totalSpent * config.sellRefund);
      gs.cash += refund;
      gs.grid[tower.row][tower.col] = config.EMPTY;
      gs.towers = gs.towers.filter(t => t.id !== tower.id);
      if (gs.selectedTower && gs.selectedTower.id === tower.id) {
        gs.selectedTower = null;
      }
    },

    /**
     * Cycle targeting mode.
     */
    cycleTargeting(tower) {
      const modes = ['first', 'last', 'strongest', 'closest'];
      const idx = modes.indexOf(tower.targetingMode);
      tower.targetingMode = modes[(idx + 1) % modes.length];
    },
  };
}
