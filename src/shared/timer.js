/**
 * Game timer, cooldown tracker, and wave timer utilities.
 * @module timer
 */

/**
 * Creates a countdown timer.
 * @param {number} duration - Duration in seconds
 * @param {Function} [onComplete] - Called when timer reaches zero
 * @returns {object} Timer API
 */
export function createTimer(duration, onComplete) {
  let remaining = duration;
  let running = false;
  let done = false;

  return {
    /** Starts the timer */
    start() {
      running = true;
      done = false;
    },

    /** Pauses the timer */
    pause() {
      running = false;
    },

    /** Resumes the timer */
    resume() {
      if (!done) running = true;
    },

    /** Resets and optionally sets a new duration */
    reset(newDuration) {
      remaining = newDuration ?? duration;
      done = false;
      running = false;
    },

    /**
     * Updates the timer. Call each frame.
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
      if (!running || done) return;
      remaining -= dt;
      if (remaining <= 0) {
        remaining = 0;
        done = true;
        running = false;
        if (onComplete) onComplete();
      }
    },

    /** @returns {number} Time remaining in seconds */
    get timeLeft() {
      return Math.max(0, remaining);
    },

    /** @returns {number} Progress from 0 (start) to 1 (done) */
    get progress() {
      return 1 - remaining / duration;
    },

    /** @returns {boolean} */
    get isRunning() {
      return running;
    },

    /** @returns {boolean} */
    get isDone() {
      return done;
    },

    /** @returns {string} Formatted as "M:SS" */
    get formatted() {
      const secs = Math.ceil(remaining);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    },
  };
}

/**
 * Creates a cooldown tracker. Can be used for ability cooldowns, fire rates, etc.
 * @param {number} cooldownTime - Cooldown duration in seconds
 * @returns {object} Cooldown API
 */
export function createCooldown(cooldownTime) {
  let remaining = 0;

  return {
    /**
     * Attempts to trigger the cooldown. Returns true if ready, false if still cooling.
     * @returns {boolean}
     */
    trigger() {
      if (remaining > 0) return false;
      remaining = cooldownTime;
      return true;
    },

    /**
     * Updates the cooldown. Call each frame.
     * @param {number} dt
     */
    update(dt) {
      remaining = Math.max(0, remaining - dt);
    },

    /** @returns {boolean} Whether the cooldown is ready */
    get isReady() {
      return remaining <= 0;
    },

    /** @returns {number} Progress from 0 (just triggered) to 1 (ready) */
    get progress() {
      return 1 - remaining / cooldownTime;
    },

    /** @returns {number} Time remaining */
    get timeLeft() {
      return remaining;
    },

    /** Force reset to ready */
    reset() {
      remaining = 0;
    },

    /** Change cooldown time */
    setCooldownTime(time) {
      cooldownTime = time;
    },
  };
}

/**
 * Creates a wave timer for tower defense or survival games.
 * Manages countdown between waves, wave number tracking, etc.
 * @param {object} config
 * @param {number} config.prepTime - Time between waves in seconds
 * @param {Function} [config.onWaveStart] - Called when a wave starts
 * @param {Function} [config.onPrepStart] - Called when prep phase starts
 * @returns {object} Wave timer API
 */
export function createWaveTimer(config) {
  const { prepTime, onWaveStart, onPrepStart } = config;
  let wave = 0;
  let phase = 'prep'; // 'prep' or 'wave'
  let prepRemaining = prepTime;
  let waveActive = false;

  return {
    /**
     * Updates the wave timer. Call each frame.
     * @param {number} dt
     */
    update(dt) {
      if (phase === 'prep') {
        prepRemaining -= dt;
        if (prepRemaining <= 0) {
          phase = 'wave';
          wave++;
          waveActive = true;
          if (onWaveStart) onWaveStart(wave);
        }
      }
    },

    /** Call when the current wave is complete */
    endWave() {
      phase = 'prep';
      prepRemaining = prepTime;
      waveActive = false;
      if (onPrepStart) onPrepStart(wave + 1);
    },

    /** Skip prep and start the wave immediately */
    skipPrep() {
      if (phase === 'prep') {
        prepRemaining = 0;
      }
    },

    /** @returns {number} Current wave number */
    get currentWave() {
      return wave;
    },

    /** @returns {string} 'prep' or 'wave' */
    get currentPhase() {
      return phase;
    },

    /** @returns {number} Prep time remaining */
    get prepTimeLeft() {
      return Math.max(0, prepRemaining);
    },

    /** @returns {boolean} */
    get isWaveActive() {
      return waveActive;
    },
  };
}

/**
 * Creates a repeating interval timer.
 * @param {number} interval - Interval in seconds
 * @param {Function} callback - Called on each interval
 * @returns {object} Interval timer API
 */
export function createInterval(interval, callback) {
  let elapsed = 0;
  let running = true;

  return {
    update(dt) {
      if (!running) return;
      elapsed += dt;
      while (elapsed >= interval) {
        elapsed -= interval;
        callback();
      }
    },
    pause() {
      running = false;
    },
    resume() {
      running = true;
    },
    reset() {
      elapsed = 0;
    },
    setInterval(newInterval) {
      interval = newInterval;
    },
  };
}
