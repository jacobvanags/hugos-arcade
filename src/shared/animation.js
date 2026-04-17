/**
 * Tweening, easing curves, and sprite animation frame management.
 * @module animation
 */

import { lerp } from './math-utils.js';

/**
 * Creates a tween that interpolates a value over time.
 * @param {object} config
 * @param {number} config.from - Start value
 * @param {number} config.to - End value
 * @param {number} config.duration - Duration in seconds
 * @param {Function} [config.easing] - Easing function (t => t)
 * @param {Function} [config.onUpdate] - Called each frame with current value
 * @param {Function} [config.onComplete] - Called when tween finishes
 * @param {number} [config.delay=0] - Delay before starting in seconds
 * @returns {object} Tween instance with update() method
 */
export function createTween(config) {
  let elapsed = -1 * (config.delay || 0);
  let done = false;
  const from = config.from;
  const to = config.to;
  const duration = config.duration;
  const easing = config.easing || ((t) => t);

  return {
    /**
     * Updates the tween. Call each frame.
     * @param {number} dt - Delta time in seconds
     * @returns {number} Current interpolated value
     */
    update(dt) {
      if (done) return to;
      elapsed += dt;
      if (elapsed < 0) return from;
      const t = Math.min(elapsed / duration, 1);
      const easedT = easing(t);
      const value = lerp(from, to, easedT);
      if (config.onUpdate) config.onUpdate(value);
      if (t >= 1) {
        done = true;
        if (config.onComplete) config.onComplete();
      }
      return value;
    },

    /** @returns {boolean} Whether the tween has completed */
    get isDone() {
      return done;
    },

    /** Resets the tween to its initial state */
    reset() {
      elapsed = -1 * (config.delay || 0);
      done = false;
    },
  };
}

/**
 * Manages a sequence of tweens that run one after another.
 * @param {Array<object>} tweenConfigs - Array of tween configurations
 * @returns {object} Sequence instance
 */
export function createTweenSequence(tweenConfigs) {
  const tweens = tweenConfigs.map(createTween);
  let currentIndex = 0;

  return {
    update(dt) {
      if (currentIndex >= tweens.length) return;
      tweens[currentIndex].update(dt);
      if (tweens[currentIndex].isDone) {
        currentIndex++;
      }
    },
    get isDone() {
      return currentIndex >= tweens.length;
    },
    reset() {
      currentIndex = 0;
      tweens.forEach((t) => t.reset());
    },
  };
}

/**
 * Manages a group of tweens that run in parallel.
 * @param {Array<object>} tweenConfigs - Array of tween configurations
 * @returns {object} Group instance
 */
export function createTweenGroup(tweenConfigs) {
  const tweens = tweenConfigs.map(createTween);

  return {
    update(dt) {
      tweens.forEach((t) => t.update(dt));
    },
    get isDone() {
      return tweens.every((t) => t.isDone);
    },
    reset() {
      tweens.forEach((t) => t.reset());
    },
  };
}

/**
 * Sprite animation frame manager for frame-based animations.
 * @param {object} config
 * @param {number} config.frameCount - Total number of frames
 * @param {number} [config.fps=12] - Frames per second
 * @param {boolean} [config.loop=true] - Whether to loop
 * @param {Function} [config.onComplete] - Called when animation finishes (non-looping)
 * @returns {object} Animation instance
 */
export function createSpriteAnimation(config) {
  const { frameCount, fps = 12, loop = true, onComplete } = config;
  let elapsed = 0;
  let currentFrame = 0;
  let playing = true;
  let done = false;
  const frameDuration = 1 / fps;

  return {
    /**
     * Updates the animation. Call each frame.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
      if (!playing || done) return;
      elapsed += dt;
      if (elapsed >= frameDuration) {
        elapsed -= frameDuration;
        currentFrame++;
        if (currentFrame >= frameCount) {
          if (loop) {
            currentFrame = 0;
          } else {
            currentFrame = frameCount - 1;
            done = true;
            playing = false;
            if (onComplete) onComplete();
          }
        }
      }
    },

    /** @returns {number} Current frame index */
    get frame() {
      return currentFrame;
    },

    /** @returns {boolean} Whether animation is playing */
    get isPlaying() {
      return playing;
    },

    /** @returns {boolean} Whether animation has completed */
    get isDone() {
      return done;
    },

    /** Sets the current frame */
    setFrame(f) {
      currentFrame = Math.max(0, Math.min(f, frameCount - 1));
    },

    play() {
      playing = true;
    },

    stop() {
      playing = false;
    },

    reset() {
      elapsed = 0;
      currentFrame = 0;
      playing = true;
      done = false;
    },
  };
}

/**
 * Simple oscillator for bobbing, pulsing, breathing effects.
 * @param {number} time - Current time in seconds
 * @param {number} [speed=1] - Oscillation speed
 * @param {number} [min=0] - Minimum value
 * @param {number} [max=1] - Maximum value
 * @returns {number} Current value
 */
export function oscillate(time, speed = 1, min = 0, max = 1) {
  const t = (Math.sin(time * speed * Math.PI * 2) + 1) / 2;
  return min + t * (max - min);
}

/**
 * Creates a flash effect that fades over time.
 * @param {number} duration - Flash duration in seconds
 * @returns {object} Flash instance
 */
export function createFlash(duration) {
  let remaining = duration;

  return {
    update(dt) {
      remaining = Math.max(0, remaining - dt);
    },
    get intensity() {
      return remaining / duration;
    },
    get isDone() {
      return remaining <= 0;
    },
    trigger() {
      remaining = duration;
    },
  };
}
