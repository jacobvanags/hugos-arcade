/**
 * Projectile movement, hit detection, and effects.
 */
import { vecDist, vecSub, vecNormalize, vecAngle } from '../../../shared/math-utils.js';
import { spawnExplosion, spawnSlowRing } from '../rendering/effects-renderer.js';
import { playImpact } from '../sounds/td-sounds.js';

export function createProjectileSystem() {
  return {
    update(dt, gs) {
      for (let i = gs.projectiles.length - 1; i >= 0; i--) {
        const p = gs.projectiles[i];
        if (!p.alive) {
          gs.projectiles.splice(i, 1);
          continue;
        }

        // Find current target position (may have moved)
        const target = gs.enemies.find(e => e.id === p.targetId && e.hp > 0);

        if (p.homing && target) {
          // Homing missile: turn toward target
          const desiredAngle = vecAngle(p, target);
          let diff = desiredAngle - p.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const maxTurn = p.turnRate * dt;
          p.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
          p.targetX = target.x;
          p.targetY = target.y;
        } else if (target) {
          // Update target position
          p.targetX = target.x;
          p.targetY = target.y;
          // Re-aim straight projectiles
          p.angle = vecAngle(p, { x: p.targetX, y: p.targetY });
        }

        // Move
        p.x += Math.cos(p.angle) * p.speed * dt;
        p.y += Math.sin(p.angle) * p.speed * dt;

        // Check bounds (remove if way off screen)
        if (p.x < -50 || p.x > 1100 || p.y < -50 || p.y > 800) {
          p.alive = false;
          continue;
        }

        // Hit detection
        const hitEnemy = this.checkHit(p, gs.enemies);
        if (hitEnemy) {
          this.onHit(p, hitEnemy, gs);
        }
      }

      // Decay lightning chains
      if (gs.lightningChains) {
        for (let i = gs.lightningChains.length - 1; i >= 0; i--) {
          gs.lightningChains[i].timer -= dt;
          if (gs.lightningChains[i].timer <= 0) {
            gs.lightningChains.splice(i, 1);
          }
        }
      }

      // Decay beams
      if (gs.beams) {
        for (let i = gs.beams.length - 1; i >= 0; i--) {
          gs.beams[i].timer -= dt;
          if (gs.beams[i].timer <= 0) {
            gs.beams.splice(i, 1);
          }
        }
      }

      // Decay pulse rings
      if (gs.pulseRings) {
        for (let i = gs.pulseRings.length - 1; i >= 0; i--) {
          gs.pulseRings[i].timer -= dt;
          if (gs.pulseRings[i].timer <= 0) {
            gs.pulseRings.splice(i, 1);
          }
        }
      }
    },

    checkHit(projectile, enemies) {
      for (const e of enemies) {
        if (e.hp <= 0) continue;
        if (projectile.hitEnemies.includes(e.id)) continue;
        const dist = vecDist(projectile, e);
        if (dist < e.size + projectile.size) {
          return e;
        }
      }
      return null;
    },

    onHit(projectile, enemy, gs) {
      projectile.hitEnemies.push(enemy.id);

      // Impact sound (splash projectiles get bigger impact sounds)
      if (projectile.splashRadius > 0) {
        playImpact(projectile.type);
      }

      // Apply damage with armor pierce
      const ap = projectile.armorPierce || 0;
      const killed = gs.enemySystem.damageEnemy(enemy, projectile.damage, gs, ap);

      // Spawn visual effects
      if (projectile.splashRadius > 0) {
        // Splash explosion effect
        spawnExplosion(gs, projectile.x, projectile.y, projectile.splashRadius, projectile.color);

        // Splash damage to nearby enemies
        for (const e of gs.enemies) {
          if (e === enemy || e.hp <= 0) continue;
          if (vecDist(projectile, e) <= projectile.splashRadius) {
            gs.enemySystem.damageEnemy(e, projectile.damage * 0.5, gs, ap);
          }
        }
      }

      // DOT effect (Venom Spitter)
      if (projectile.dotDps > 0 && projectile.dotDuration > 0) {
        gs.enemySystem.applyDot(enemy, projectile.dotDps, projectile.dotDuration);
        // Apply DOT to splash targets too
        if (projectile.splashRadius > 0) {
          for (const e of gs.enemies) {
            if (e === enemy || e.hp <= 0) continue;
            if (vecDist(projectile, e) <= projectile.splashRadius) {
              gs.enemySystem.applyDot(e, projectile.dotDps * 0.5, projectile.dotDuration);
            }
          }
        }
      }

      // Slow effect
      if (projectile.slowFactor > 0 && projectile.slowDuration > 0) {
        gs.enemySystem.slowEnemy(enemy, projectile.slowFactor, projectile.slowDuration);

        // Visual slow ring
        if (projectile.splashRadius > 0) {
          spawnSlowRing(gs, projectile.x, projectile.y, projectile.splashRadius);
          for (const e of gs.enemies) {
            if (e === enemy || e.hp <= 0) continue;
            if (vecDist(projectile, e) <= projectile.splashRadius) {
              gs.enemySystem.slowEnemy(e, projectile.slowFactor, projectile.slowDuration);
            }
          }
        }
      }

      // Pierce
      if (projectile.pierce > 0 && projectile.pierceCount < projectile.pierce) {
        projectile.pierceCount++;
        // Don't destroy, keep flying
      } else {
        projectile.alive = false;
      }
    },
  };
}
