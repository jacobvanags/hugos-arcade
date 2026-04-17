/**
 * Enemy management — spawning, movement, abilities, damage, death.
 */
import { ENEMY_TYPES, getScaledHp, getScaledShield } from '../data/enemy-defs.js';
import { advanceEnemy, getPathLength } from './path-system.js';
import { vecDist } from '../../../shared/math-utils.js';

let nextId = 1;

export function createEnemySystem() {
  return {
    /**
     * Spawn a single enemy of the given type.
     */
    spawnEnemy(gs, typeName, pathIndex, wave) {
      const def = ENEMY_TYPES[typeName];
      if (!def) return;

      const path = gs.paths[pathIndex] || gs.paths[0];
      const waypoints = path.waypoints;
      const start = waypoints[0];

      // Apply difficulty multipliers
      const hpMult = gs.enemyHpMult || 1.0;
      const spdMult = gs.enemySpeedMult || 1.0;
      // Special bosses get 1/3 HP on easy mode
      const isSpecialBoss = typeName === 'veia' || typeName === 'titan' || typeName === 'phantom' || typeName === 'broodmother';
      const bossEasyMult = (isSpecialBoss && gs.difficulty === 'easy') ? (1 / 3) : 1.0;
      const baseHp = Math.floor(getScaledHp(def.baseHp, wave) * hpMult * bossEasyMult);
      const baseSpeed = def.speed * spdMult;

      const enemy = {
        id: nextId++,
        type: typeName,
        x: start.x,
        y: start.y,
        angle: 0,
        hp: baseHp,
        maxHp: baseHp,
        speed: baseSpeed,
        currentSpeed: baseSpeed,
        armor: def.armor,
        reward: def.reward,
        liveDrain: def.liveDrain,
        color: def.color,
        size: def.size,
        waypoints,
        pathDistance: 0,
        pathProgress: 0,
        pathLength: getPathLength(waypoints),
        // Status effects
        slowFactor: 1.0,
        slowDuration: 0,
        cloaked: typeName === 'cloaked' || !!def.cloaked,
        shieldHp: def.shieldHp ? Math.floor(getScaledShield(def.shieldHp, wave) * bossEasyMult) : 0,
        maxShieldHp: def.shieldHp ? Math.floor(getScaledShield(def.shieldHp, wave) * bossEasyMult) : 0,
        // Healer
        healRadius: def.healRadius || 0,
        healRate: def.healRate || 0,
        // DOT effects
        dots: [],
        // Damage amplification
        damageAmp: 0,
        damageAmpDuration: 0,
        // Visual
        flashTimer: 0,
        // Warper
        _warps: !!def.warps,
        _warpCooldown: def.warpCooldown || 4.0,
        _warpDistance: def.warpDistance || 80,
        _warpTimer: def.warpCooldown || 4.0,
        // Splitter
        _splitOnDeath: !!def.splitOnDeath,
        _splitType: def.splitType || 'scout',
        _splitCount: def.splitCount || 3,
        // Broodmother
        _spawnsMinions: !!def.spawnsMinions,
        _minionType: def.minionType || 'swarm',
        _minionInterval: def.minionInterval || 3.0,
        _minionTimer: def.minionInterval || 3.0,
      };

      gs.enemies.push(enemy);

      // Swarm: spawn extra copies with slight delay
      if (def.spawnCount && def.spawnCount > 1) {
        for (let i = 1; i < def.spawnCount; i++) {
          const clone = { ...enemy, id: nextId++, pathDistance: -i * def.speed * def.spawnDelay };
          gs.enemies.push(clone);
        }
      }
    },

    /**
     * Update all enemies.
     */
    update(dt, gs) {
      for (let i = gs.enemies.length - 1; i >= 0; i--) {
        const e = gs.enemies[i];
        if (e.hp <= 0) continue;

        // Stun effect (from hero EMP)
        if (e.stunDuration > 0) {
          e.stunDuration -= dt;
          if (e.flashTimer <= 0) e.flashTimer = 0.05;
          continue; // Skip movement and abilities while stunned
        }

        // Slow effect
        if (e.slowDuration > 0) {
          e.slowDuration -= dt;
          e.currentSpeed = e.speed * e.slowFactor;
          if (e.slowDuration <= 0) {
            e.currentSpeed = e.speed;
            e.slowFactor = 1.0;
          }
        }

        // Move along path
        const reached = advanceEnemy(e, dt);
        if (reached) {
          gs.lives -= e.liveDrain;
          gs.enemies.splice(i, 1);
          continue;
        }

        // DOT effects
        if (e.dots && e.dots.length > 0) {
          for (let d = e.dots.length - 1; d >= 0; d--) {
            const dot = e.dots[d];
            dot.remaining -= dt;
            // Apply DOT damage (no armor, no kill cash — use damageEnemy with 999 armorPierce)
            const dotDmg = dot.dps * dt;
            if (dotDmg > 0) {
              this.damageEnemy(e, dotDmg, gs, 999);
              if (e.hp <= 0) break; // Enemy died from DOT
            }
            if (dot.remaining <= 0) {
              e.dots.splice(d, 1);
            }
          }
          if (e.hp <= 0) continue;
        }

        // Damage amp decay
        if (e.damageAmpDuration > 0) {
          e.damageAmpDuration -= dt;
          if (e.damageAmpDuration <= 0) {
            e.damageAmp = 0;
            e.damageAmpDuration = 0;
          }
        }

        // Flash timer
        if (e.flashTimer > 0) e.flashTimer -= dt;

        // Healer ability
        if (e.healRadius > 0 && e.healRate > 0) {
          for (const other of gs.enemies) {
            if (other === e || other.hp <= 0) continue;
            if (vecDist(e, other) <= e.healRadius) {
              other.hp = Math.min(other.maxHp, other.hp + e.healRate * dt);
            }
          }
        }

        // Warper teleport
        if (e._warps) {
          e._warpTimer = (e._warpTimer || 0) - dt;
          if (e._warpTimer <= 0) {
            e._warpTimer = e._warpCooldown || 4.0;
            // Jump forward along path
            e.pathDistance += e._warpDistance || 80;
            e.flashTimer = 0.2;
          }
        }

        // Broodmother minion spawning
        if (e._spawnsMinions) {
          e._minionTimer = (e._minionTimer || 0) - dt;
          if (e._minionTimer <= 0) {
            e._minionTimer = e._minionInterval || 3.0;
            // Spawn a minion at broodmother's position
            const mType = ENEMY_TYPES[e._minionType || 'swarm'];
            if (mType) {
              const wave = gs.currentWave || 1;
              const hpMult = gs.enemyHpMult || 1.0;
              const mHp = Math.floor(getScaledHp(mType.baseHp, wave) * hpMult);
              const minion = {
                id: nextId++,
                type: e._minionType || 'swarm',
                x: e.x,
                y: e.y,
                angle: 0,
                hp: mHp,
                maxHp: mHp,
                speed: mType.speed * (gs.enemySpeedMult || 1.0),
                currentSpeed: mType.speed * (gs.enemySpeedMult || 1.0),
                armor: mType.armor,
                reward: mType.reward,
                liveDrain: mType.liveDrain,
                color: mType.color,
                size: mType.size,
                waypoints: e.waypoints,
                pathDistance: e.pathDistance,
                pathProgress: e.pathProgress,
                pathLength: e.pathLength,
                slowFactor: 1.0,
                slowDuration: 0,
                cloaked: false,
                shieldHp: 0,
                maxShieldHp: 0,
                healRadius: 0,
                healRate: 0,
                dots: [],
                damageAmp: 0,
                damageAmpDuration: 0,
                flashTimer: 0,
              };
              gs.enemies.push(minion);
            }
          }
        }
      }
    },

    /**
     * Apply damage to an enemy. Returns true if killed.
     * @param {number} [armorPierce=0] - Ignores this much armor
     */
    damageEnemy(enemy, damage, gs, armorPierce = 0) {
      // Armor reduction (reduced by armor pierce)
      const effectiveArmor = Math.max(0, enemy.armor - armorPierce);
      let effectiveDamage = Math.max(1, damage - effectiveArmor);

      // Damage amplification (from Disruptor)
      if (enemy.damageAmp > 0) {
        effectiveDamage *= (1 + enemy.damageAmp);
      }

      // Total Vulnerability ability (2x damage globally)
      if (gs.totalVulnerabilityActive) {
        effectiveDamage *= 2;
      }

      // Shield absorbs first
      if (enemy.shieldHp > 0) {
        enemy.shieldHp -= effectiveDamage;
        if (enemy.shieldHp < 0) {
          enemy.hp += enemy.shieldHp; // Overflow damage to HP
          enemy.shieldHp = 0;
        }
      } else {
        enemy.hp -= effectiveDamage;
      }

      enemy.flashTimer = 0.1;

      if (enemy.hp <= 0) {
        enemy.hp = 0;
        // Apply map cash multiplier + bonus cash from laser drone salvage
        let cashReward = Math.floor(enemy.reward * (gs.cashMultiplier || 1.0));
        // Challenge mode: half cash earn multiplier
        if (gs.cashEarnMult && gs.cashEarnMult !== 1) {
          cashReward = Math.floor(cashReward * gs.cashEarnMult);
        }
        if (gs.bonusCashPctTotal > 0) {
          cashReward = Math.floor(cashReward * (1 + gs.bonusCashPctTotal));
        }
        // Gold Rush ability (3x cash)
        if (gs.goldRushActive) {
          cashReward *= 3;
        }
        gs.cash += cashReward;
        gs.totalCashEarned += cashReward;
        gs.enemiesKilled++;
        if (enemy.type === 'boss' || enemy.type === 'veia' || enemy.type === 'titan' || enemy.type === 'phantom' || enemy.type === 'broodmother') {
          gs.bossesKilled++;
        }
        // Notify kill callback (particles, floating text, etc.)
        if (gs.onEnemyKill) gs.onEnemyKill(enemy, cashReward);

        // Splitter: spawn children at death position
        if (enemy._splitOnDeath && enemy._splitType && enemy._splitCount > 0) {
          const splitDef = ENEMY_TYPES[enemy._splitType];
          if (splitDef) {
            const wave = gs.currentWave || 1;
            const hpMult = gs.enemyHpMult || 1.0;
            const sHp = Math.floor(getScaledHp(splitDef.baseHp, wave) * hpMult);
            for (let si = 0; si < enemy._splitCount; si++) {
              const child = {
                id: nextId++,
                type: enemy._splitType,
                x: enemy.x + (Math.random() - 0.5) * 10,
                y: enemy.y + (Math.random() - 0.5) * 10,
                angle: 0,
                hp: sHp,
                maxHp: sHp,
                speed: splitDef.speed * (gs.enemySpeedMult || 1.0),
                currentSpeed: splitDef.speed * (gs.enemySpeedMult || 1.0),
                armor: splitDef.armor,
                reward: splitDef.reward,
                liveDrain: splitDef.liveDrain,
                color: splitDef.color,
                size: splitDef.size,
                waypoints: enemy.waypoints,
                pathDistance: enemy.pathDistance,
                pathProgress: enemy.pathProgress,
                pathLength: enemy.pathLength,
                slowFactor: 1.0,
                slowDuration: 0,
                cloaked: false,
                shieldHp: 0,
                maxShieldHp: 0,
                healRadius: 0,
                healRate: 0,
                dots: [],
                damageAmp: 0,
                damageAmpDuration: 0,
                flashTimer: 0,
                _warps: false, _splitOnDeath: false, _spawnsMinions: false,
              };
              gs.enemies.push(child);
            }
          }
        }

        // Remove from array
        const idx = gs.enemies.indexOf(enemy);
        if (idx !== -1) gs.enemies.splice(idx, 1);
        return true;
      }
      return false;
    },

    /**
     * Apply slow effect to an enemy.
     */
    slowEnemy(enemy, factor, duration) {
      // Only apply if this is a stronger slow
      if (factor < enemy.slowFactor || enemy.slowDuration <= 0) {
        enemy.slowFactor = factor;
        enemy.slowDuration = duration;
        enemy.currentSpeed = enemy.speed * factor;
      }
    },

    /**
     * Apply damage amplification to an enemy (Disruptor).
     */
    applyDamageAmp(enemy, amp, duration) {
      // Use strongest amp
      if (amp > enemy.damageAmp || enemy.damageAmpDuration <= 0) {
        enemy.damageAmp = amp;
        enemy.damageAmpDuration = duration;
      }
    },

    /**
     * Apply DOT effect to an enemy (Venom Spitter).
     */
    applyDot(enemy, dps, duration) {
      if (!enemy.dots) enemy.dots = [];
      // Stack DOTs — each application is independent
      enemy.dots.push({ dps, remaining: duration });
    },
  };
}
