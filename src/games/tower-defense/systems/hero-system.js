/**
 * Hero placement, targeting, firing, abilities, and sell.
 * Heroes reuse the same projectile system as towers.
 */
import { HERO_TYPES } from '../data/hero-defs.js';
import { config, cellToPixel } from '../config.js';
import { findTarget } from './targeting.js';
import { vecAngle, vecDistSq } from '../../../shared/math-utils.js';

let nextId = 1;

export function createHeroSystem() {
  return {
    canPlace(gs, col, row) {
      if (col < 0 || col >= config.gridCols || row < 0 || row >= config.gridRows) return false;
      return gs.grid[row][col] === config.EMPTY;
    },

    placeHero(gs, heroType, col, row) {
      const def = HERO_TYPES[heroType];
      if (!def) return null;
      if (!this.canPlace(gs, col, row)) return null;
      if (gs.cash < def.cost) return null;
      if (gs.heroesPlaced[heroType]) return null;

      gs.cash -= def.cost;
      gs.grid[row][col] = config.HERO;

      const pos = cellToPixel(col, row);
      const hero = {
        id: nextId++,
        type: heroType,
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
        targetId: null,
        targetingMode: def.targetingDefault || 'first',
        // Type-specific
        splashRadius: def.baseSplashRadius || 0,
        chainCount: def.baseChainCount || 0,
        chainRange: def.baseChainRange || 0,
        detectCloaked: false,
        armorPierce: 0,
        // Cost tracking
        totalSpent: def.cost,
        // Ability
        abilityCooldown: 0,
        abilityActive: false,
        abilityTimer: 0,
        // Visual
        color: def.color,
        size: def.size,
        isHero: true,
      };

      gs.heroes.push(hero);
      gs.heroesPlaced[heroType] = true;
      return hero;
    },

    update(dt, gs) {
      // Apply Patch rally buff if active
      this.applyHeroBuffs(gs);

      for (const hero of gs.heroes) {
        const def = HERO_TYPES[hero.type];

        // Update ability
        if (hero.abilityCooldown > 0) {
          hero.abilityCooldown -= dt;
          if (hero.abilityCooldown < 0) hero.abilityCooldown = 0;
        }
        if (hero.abilityActive) {
          hero.abilityTimer -= dt;
          if (hero.abilityTimer <= 0) {
            hero.abilityActive = false;
            hero.abilityTimer = 0;
            // Restore stats after barrage
            if (def.ability.effect === 'barrage') {
              hero.fireRate = def.baseFireRate;
            }
          }
        }

        // Cooldown
        hero.fireCooldown -= dt;

        // Find target
        const target = findTarget(hero, gs.enemies, hero.targetingMode);
        if (target) {
          hero.angle = vecAngle(hero, target);
          hero.targetId = target.id;

          if (hero.fireCooldown <= 0) {
            hero.fireCooldown = hero.fireRate;
            this.fire(hero, target, gs);
          }
        } else {
          hero.targetId = null;
        }
      }
    },

    fire(hero, target, gs) {
      if (hero.projectileType === 'lightning') {
        this.fireLightning(hero, target, gs);
        return;
      }

      gs.projectiles.push({
        x: hero.x,
        y: hero.y,
        targetId: target.id,
        targetX: target.x,
        targetY: target.y,
        speed: hero.projectileSpeed,
        damage: hero.damage,
        angle: hero.angle,
        type: hero.projectileType,
        splashRadius: hero.splashRadius,
        slowFactor: 0,
        slowDuration: 0,
        pierce: 0,
        pierceCount: 0,
        hitEnemies: [],
        armorPierce: hero.armorPierce || 0,
        size: 3,
        color: hero.color,
        alive: true,
        homing: hero.projectileType === 'missile',
        turnRate: 4,
      });
    },

    fireLightning(hero, target, gs) {
      const enemies = [target];
      let current = target;

      for (let c = 0; c < hero.chainCount - 1; c++) {
        let closest = null;
        let closestDist = hero.chainRange * hero.chainRange;
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

      gs.lightningChains = gs.lightningChains || [];
      gs.lightningChains.push({
        points: [{ x: hero.x, y: hero.y }, ...enemies.map(e => ({ x: e.x, y: e.y }))],
        timer: 0.15,
        color: hero.color,
      });

      for (const e of enemies) {
        gs.enemySystem.damageEnemy(e, hero.damage, gs, hero.armorPierce || 0);
      }
    },

    /**
     * Activate a hero's special ability.
     */
    activateAbility(hero, gs) {
      if (hero.abilityCooldown > 0 || hero.abilityActive) return false;

      const def = HERO_TYPES[hero.type];
      const ability = def.ability;
      hero.abilityCooldown = ability.cooldown;

      switch (ability.effect) {
        case 'barrage':
          // Rapid fire for duration
          hero.abilityActive = true;
          hero.abilityTimer = ability.duration;
          hero.fireRate = 0.1; // Very fast
          break;

        case 'supernova': {
          // Find strongest enemy in range and create a huge explosion
          const target = findTarget(hero, gs.enemies, 'strongest');
          if (target) {
            const damage = hero.damage * ability.damageMultiplier;
            // Damage all enemies in splash radius
            const rSq = ability.splashRadius * ability.splashRadius;
            for (const e of gs.enemies) {
              if (e.hp <= 0) continue;
              const dx = e.x - target.x;
              const dy = e.y - target.y;
              if (dx * dx + dy * dy <= rSq) {
                gs.enemySystem.damageEnemy(e, damage, gs, hero.armorPierce || 0);
              }
            }
            // Visual explosion effect
            gs.effects.push({
              type: 'explosion',
              x: target.x,
              y: target.y,
              radius: ability.splashRadius,
              maxRadius: ability.splashRadius,
              timer: 0.6,
              maxTimer: 0.6,
              color: '#ff8844',
            });
          }
          break;
        }

        case 'emp': {
          // Stun all enemies in range and destroy shields
          const rangeSq = hero.range * hero.range;
          let hitCount = 0;
          for (const e of gs.enemies) {
            if (e.hp <= 0) continue;
            const dx = e.x - hero.x;
            const dy = e.y - hero.y;
            if (dx * dx + dy * dy <= rangeSq) {
              e.stunDuration = ability.stunDuration;
              e.shieldHp = 0;
              hitCount++;
            }
          }
          // Visual effect
          gs.effects.push({
            type: 'explosion',
            x: hero.x,
            y: hero.y,
            radius: hero.range,
            maxRadius: hero.range,
            timer: 0.5,
            maxTimer: 0.5,
            color: '#ffdd44',
          });
          break;
        }

        case 'rally':
          // Buff all towers — applied each frame while active in applyHeroBuffs
          hero.abilityActive = true;
          hero.abilityTimer = ability.duration;
          // Visual effect
          gs.effects.push({
            type: 'explosion',
            x: hero.x,
            y: hero.y,
            radius: 200,
            maxRadius: 200,
            timer: 0.4,
            maxTimer: 0.4,
            color: '#44ff88',
          });
          break;
      }

      return true;
    },

    /**
     * Apply hero buffs (Patch rally) to towers.
     * Called at start of update.
     */
    applyHeroBuffs(gs) {
      // Check if any Patch hero has rally active
      const rallyHero = gs.heroes.find(h => h.type === 'patch' && h.abilityActive);
      if (!rallyHero) return;

      const ability = HERO_TYPES.patch.ability;
      for (const tower of gs.towers) {
        tower.effectiveDamage = (tower.effectiveDamage || tower.damage) * (1 + ability.damageBuff);
        tower.effectiveFireRate = (tower.effectiveFireRate || tower.fireRate) * (1 - ability.speedBuff);
        tower.buffed = true;
      }
    },

    sellHero(hero, gs) {
      const refund = Math.floor(hero.totalSpent * config.sellRefund);
      gs.cash += refund;
      gs.grid[hero.row][hero.col] = config.EMPTY;
      gs.heroes = gs.heroes.filter(h => h.id !== hero.id);
      gs.heroesPlaced[hero.type] = false;
      if (gs.selectedHero && gs.selectedHero.id === hero.id) {
        gs.selectedHero = null;
      }
    },

    cycleTargeting(hero) {
      const modes = ['first', 'last', 'strongest', 'closest'];
      const idx = modes.indexOf(hero.targetingMode);
      hero.targetingMode = modes[(idx + 1) % modes.length];
    },
  };
}
