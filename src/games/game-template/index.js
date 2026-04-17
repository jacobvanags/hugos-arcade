/**
 * Game Template — Entry point for the template game.
 * This file exports the manifest and the game class that implements the lifecycle.
 *
 * To create a new game:
 *   1. Copy this entire folder
 *   2. Change the manifest
 *   3. Implement your game logic in the lifecycle methods
 *   4. Define achievements in achievements.js
 *   5. Register in src/games/registry.js
 */

import { config } from './config.js';
import { achievements } from './achievements.js';
import { createInputManager } from '../../shared/input-manager.js';
import { createParticleSystem, emitTrail } from '../../shared/particle-system.js';
import { drawText, fillBackground, circle } from '../../shared/canvas-utils.js';
import { palette } from '../../shared/colors.js';
import { clamp, randomRange } from '../../shared/math-utils.js';
import { oscillate } from '../../shared/animation.js';

/** Game manifest — describes this game to the arcade */
export const manifest = {
  id: 'game-template',
  title: 'Bounce Demo',
  description: 'A template game demonstrating the arcade engine. Watch the ball bounce around!',
  genre: ['arcade'],
  version: '1.0.0',
  thumbnail: null,
  controls: {
    keyboard: {
      'Arrow Keys': 'Move the ball',
      'Space': 'Boost speed',
      'Escape': 'Return to arcade',
    },
  },
};

/** Exports achievements so the arcade can register them */
export { achievements };

/** Game class implementing the full lifecycle interface */
export class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.api = null;
    this.input = null;
    this.particles = null;
    this.paused = false;
    this.totalTime = 0;
    this.achievementChecked60s = false;

    // Ball state
    this.ball = {
      x: config.width / 2,
      y: config.height / 2,
      vx: config.ball.speed * (Math.random() > 0.5 ? 1 : -1),
      vy: config.ball.speed * (Math.random() > 0.5 ? 1 : -1),
      radius: config.ball.radius,
    };

    // Score counter (bounces)
    this.bounces = 0;
  }

  /**
   * Called when the game launches from the arcade.
   * @param {HTMLCanvasElement} canvas
   * @param {object} arcadeAPI
   */
  init(canvas, arcadeAPI) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.api = arcadeAPI;
    this.input = createInputManager(canvas);
    this.particles = createParticleSystem({ maxParticles: 300 });

    canvas.width = config.width;
    canvas.height = config.height;
    canvas.style.cursor = 'none';

    // Unlock first-launch achievement
    this.api.achievements.unlock('template-first-launch');

    // Play a startup sound
    this.api.audio.playSFX(440, 0.1, 'sine');
  }

  /**
   * Called every frame. Game logic goes here.
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.paused) return;
    this.totalTime += dt;

    // Check 60s achievement
    if (!this.achievementChecked60s && this.totalTime >= 60) {
      this.achievementChecked60s = true;
      this.api.achievements.unlock('template-play-60s');
    }

    // Player control
    const speed = this.input.isDown('Space') ? config.ball.speed * 2 : config.ball.speed;
    if (this.input.isDown('ArrowLeft')) this.ball.vx = -speed;
    if (this.input.isDown('ArrowRight')) this.ball.vx = speed;
    if (this.input.isDown('ArrowUp')) this.ball.vy = -speed;
    if (this.input.isDown('ArrowDown')) this.ball.vy = speed;

    // Move ball
    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;

    // Bounce off walls
    if (this.ball.x - this.ball.radius < 0) {
      this.ball.x = this.ball.radius;
      this.ball.vx *= -1;
      this.onBounce();
    }
    if (this.ball.x + this.ball.radius > config.width) {
      this.ball.x = config.width - this.ball.radius;
      this.ball.vx *= -1;
      this.onBounce();
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.y = this.ball.radius;
      this.ball.vy *= -1;
      this.onBounce();
    }
    if (this.ball.y + this.ball.radius > config.height) {
      this.ball.y = config.height - this.ball.radius;
      this.ball.vy *= -1;
      this.onBounce();
    }

    // Emit trail particles
    if (this.api.settings.particles) {
      emitTrail(this.particles, this.ball.x, this.ball.y, {
        color: config.ball.trailColor,
        count: 1,
        life: 0.4,
        size: 3,
      });
    }

    this.particles.update(dt);

    // Exit check
    if (this.input.isPressed('Escape')) {
      this.api.exitToMenu();
    }

    this.input.update();
  }

  /**
   * Called every frame after update. Render the game here.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // Background
    fillBackground(ctx, config.width, config.height, config.background);

    // Grid
    ctx.strokeStyle = config.gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < config.width; x += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, config.height);
      ctx.stroke();
    }
    for (let y = 0; y < config.height; y += config.gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(config.width, y);
      ctx.stroke();
    }

    // Particles (behind ball)
    this.particles.render(ctx);

    // Ball with glow
    const glowSize = oscillate(this.totalTime, 2, 0.5, 1);
    const gradient = ctx.createRadialGradient(
      this.ball.x, this.ball.y, 0,
      this.ball.x, this.ball.y, this.ball.radius * 3
    );
    gradient.addColorStop(0, config.ball.color);
    gradient.addColorStop(0.3, config.ball.color + '88');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(
      this.ball.x - this.ball.radius * 3,
      this.ball.y - this.ball.radius * 3,
      this.ball.radius * 6,
      this.ball.radius * 6
    );

    // Ball solid
    circle(ctx, this.ball.x, this.ball.y, this.ball.radius * glowSize, config.ball.color);
    circle(ctx, this.ball.x, this.ball.y, this.ball.radius * 0.6, '#ffffff');

    // HUD
    drawText(ctx, config.title, config.width / 2, 20, {
      color: palette.textPrimary,
      font: 'bold 20px monospace',
      align: 'center',
    });
    drawText(ctx, config.subtitle, config.width / 2, 46, {
      color: palette.textSecondary,
      font: '14px monospace',
      align: 'center',
    });
    drawText(ctx, `Bounces: ${this.bounces}`, 20, config.height - 30, {
      color: palette.neonGreen,
      font: '16px monospace',
    });
    drawText(ctx, `Time: ${Math.floor(this.totalTime)}s`, config.width - 20, config.height - 30, {
      color: palette.textSecondary,
      font: '16px monospace',
      align: 'right',
    });
    drawText(ctx, `Player: ${this.api.player.name}`, 20, 20, {
      color: palette.textMuted,
      font: '12px monospace',
    });

    // Pause overlay
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, config.width, config.height);
      drawText(ctx, 'PAUSED', config.width / 2, config.height / 2, {
        color: palette.textBright,
        font: 'bold 48px monospace',
        align: 'center',
        baseline: 'middle',
      });
    }
  }

  /** Called when the game is paused */
  pause() {
    this.paused = true;
    if (this.input) this.input.disable();
  }

  /** Called when the game resumes */
  resume() {
    this.paused = false;
    if (this.input) this.input.enable();
  }

  /** Called when the player exits to the arcade menu */
  destroy() {
    if (this.input) this.input.destroy();
    if (this.canvas) this.canvas.style.cursor = 'default';
    this.api.scores.submit(this.bounces, { time: Math.floor(this.totalTime) });
  }

  /** Returns current game state for saving */
  getState() {
    return {
      ball: { ...this.ball },
      bounces: this.bounces,
      totalTime: this.totalTime,
    };
  }

  /** Restores game state from a save */
  setState(state) {
    if (state.ball) Object.assign(this.ball, state.ball);
    if (state.bounces != null) this.bounces = state.bounces;
    if (state.totalTime != null) this.totalTime = state.totalTime;
  }

  // ─── Internal ────────────────────────────────────────────────

  onBounce() {
    this.bounces++;
    this.api.audio.playSFX(300 + this.bounces * 10, 0.08, 'sine');
    if (this.api.settings.particles) {
      this.particles.emit(this.ball.x, this.ball.y, {
        count: 8,
        speed: 80,
        life: 0.3,
        size: 4,
        color: config.ball.color,
      });
    }
  }
}
