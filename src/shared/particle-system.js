/**
 * Reusable particle effects engine for explosions, trails, ambient effects.
 * @module particle-system
 */

import { randomRange, randomInt } from './math-utils.js';
import { hexToRgba } from './colors.js';

/**
 * A single particle with position, velocity, lifetime, and visual properties.
 */
class Particle {
  constructor(config) {
    this.x = config.x;
    this.y = config.y;
    this.vx = config.vx || 0;
    this.vy = config.vy || 0;
    this.ax = config.ax || 0;
    this.ay = config.ay || 0;
    this.life = config.life || 1;
    this.maxLife = this.life;
    this.size = config.size || 4;
    this.endSize = config.endSize ?? 0;
    this.color = config.color || '#ffffff';
    this.endColor = config.endColor || null;
    this.alpha = config.alpha ?? 1;
    this.endAlpha = config.endAlpha ?? 0;
    this.rotation = config.rotation || 0;
    this.rotationSpeed = config.rotationSpeed || 0;
    this.shape = config.shape || 'circle'; // 'circle', 'square', 'triangle', 'star'
    this.gravity = config.gravity || 0;
    this.friction = config.friction ?? 1;
    this.dead = false;
  }

  update(dt) {
    this.vx += this.ax * dt;
    this.vy += (this.ay + this.gravity) * dt;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotationSpeed * dt;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
  }

  get progress() {
    return 1 - this.life / this.maxLife;
  }

  get currentSize() {
    return this.size + (this.endSize - this.size) * this.progress;
  }

  get currentAlpha() {
    return this.alpha + (this.endAlpha - this.alpha) * this.progress;
  }
}

/**
 * Creates a new particle system.
 * @param {object} [options]
 * @param {number} [options.maxParticles=500] - Maximum number of concurrent particles
 * @returns {object} Particle system API
 */
export function createParticleSystem(options = {}) {
  const maxParticles = options.maxParticles || 500;
  let particles = [];

  return {
    /**
     * Emits particles from a point with given configuration.
     * @param {number} x - Emit X position
     * @param {number} y - Emit Y position
     * @param {object} config - Particle configuration
     * @param {number} [config.count=10] - Number of particles to emit
     * @param {number} [config.speed=100] - Base speed
     * @param {number} [config.speedVariance=50] - Speed randomness
     * @param {number} [config.angle=0] - Emit direction in radians
     * @param {number} [config.spread=Math.PI*2] - Spread angle in radians
     * @param {number} [config.life=1] - Lifetime in seconds
     * @param {number} [config.lifeVariance=0.3] - Lifetime randomness
     * @param {number} [config.size=4] - Start size
     * @param {number} [config.sizeVariance=2] - Size randomness
     * @param {number} [config.endSize=0] - End size
     * @param {string} [config.color='#ffffff'] - Start color
     * @param {string} [config.endColor] - End color
     * @param {number} [config.gravity=0] - Gravity (pixels/s^2)
     * @param {number} [config.friction=1] - Velocity multiplier per frame
     * @param {string} [config.shape='circle'] - Particle shape
     */
    emit(x, y, config = {}) {
      const count = config.count || 10;
      const speed = config.speed ?? 100;
      const speedVar = config.speedVariance ?? 50;
      const angle = config.angle ?? 0;
      const spread = config.spread ?? Math.PI * 2;
      const life = config.life ?? 1;
      const lifeVar = config.lifeVariance ?? 0.3;
      const size = config.size ?? 4;
      const sizeVar = config.sizeVariance ?? 2;

      for (let i = 0; i < count; i++) {
        if (particles.length >= maxParticles) break;
        const dir = angle + randomRange(-spread / 2, spread / 2);
        const spd = speed + randomRange(-speedVar, speedVar);
        particles.push(
          new Particle({
            x,
            y,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd,
            life: life + randomRange(-lifeVar, lifeVar),
            size: size + randomRange(-sizeVar, sizeVar),
            endSize: config.endSize ?? 0,
            color: config.color || '#ffffff',
            endColor: config.endColor || null,
            alpha: config.alpha ?? 1,
            endAlpha: config.endAlpha ?? 0,
            gravity: config.gravity || 0,
            friction: config.friction ?? 1,
            shape: config.shape || 'circle',
            rotation: randomRange(0, Math.PI * 2),
            rotationSpeed: config.rotationSpeed ?? randomRange(-3, 3),
          })
        );
      }
    },

    /**
     * Updates all active particles.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
      for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update(dt);
        if (particles[i].dead) {
          particles.splice(i, 1);
        }
      }
    },

    /**
     * Renders all active particles to a canvas context.
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
      for (const p of particles) {
        const s = p.currentSize;
        if (s <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.currentAlpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        switch (p.shape) {
          case 'square':
            ctx.fillRect(-s / 2, -s / 2, s, s);
            break;
          case 'triangle':
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s, s);
            ctx.lineTo(s, s);
            ctx.closePath();
            ctx.fill();
            break;
          default: // circle
            ctx.beginPath();
            ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
      }
    },

    /**
     * Returns the number of active particles.
     * @returns {number}
     */
    get count() {
      return particles.length;
    },

    /**
     * Removes all particles.
     */
    clear() {
      particles = [];
    },
  };
}

// ─── Preset Emitters ─────────────────────────────────────────────

/**
 * Emits an explosion effect.
 * @param {object} system - Particle system instance
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 */
export function emitExplosion(system, x, y, options = {}) {
  system.emit(x, y, {
    count: options.count || 30,
    speed: options.speed || 200,
    speedVariance: 100,
    life: options.life || 0.8,
    size: options.size || 6,
    endSize: 0,
    color: options.color || '#ff8800',
    gravity: options.gravity || 100,
    friction: 0.98,
  });
  // Inner brighter burst
  system.emit(x, y, {
    count: Math.floor((options.count || 30) / 3),
    speed: (options.speed || 200) * 0.5,
    life: 0.4,
    size: (options.size || 6) * 1.5,
    endSize: 0,
    color: '#ffffff',
  });
}

/**
 * Emits a trail effect (call each frame for continuous trails).
 * @param {object} system - Particle system instance
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 */
export function emitTrail(system, x, y, options = {}) {
  system.emit(x, y, {
    count: options.count || 2,
    speed: options.speed || 20,
    speedVariance: 10,
    life: options.life || 0.5,
    size: options.size || 3,
    endSize: 0,
    color: options.color || '#00d4ff',
    endAlpha: 0,
    spread: Math.PI * 2,
  });
}

/**
 * Emits sparkle/twinkle particles.
 * @param {object} system - Particle system instance
 * @param {number} x
 * @param {number} y
 * @param {object} [options]
 */
export function emitSparkle(system, x, y, options = {}) {
  system.emit(x, y, {
    count: options.count || 5,
    speed: options.speed || 50,
    speedVariance: 30,
    life: options.life || 0.6,
    size: 2,
    sizeVariance: 2,
    endSize: 0,
    color: options.color || '#ffd700',
    gravity: -20,
    shape: 'square',
  });
}
