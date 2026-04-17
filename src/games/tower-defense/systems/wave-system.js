/**
 * Wave sequencing, spawning, and early-send mechanic.
 */
import { WAVES } from '../data/wave-defs.js';

export function createWaveSystem() {
  let spawnGroups = [];   // Active spawn groups for current wave
  let allSpawned = false;

  return {
    /**
     * Start prep phase for the next wave.
     */
    startPrep(gs) {
      const waveIndex = gs.currentWave; // 0-based for array index
      if (waveIndex >= WAVES.length) return;
      const waveDef = WAVES[waveIndex];
      gs.wavePhase = 'prep';
      gs.prepTimeLeft = waveDef.prepTime;
    },

    /**
     * Start the actual wave — populate spawn queue.
     */
    startWave(gs) {
      const waveIndex = gs.currentWave;
      if (waveIndex >= WAVES.length) return;

      const waveDef = WAVES[waveIndex];
      gs.wavePhase = 'active';
      allSpawned = false;

      let groups = waveDef.groups;

      // Boss Rush challenge: inject a boss every 3rd wave
      if (gs.bossRush && (waveIndex + 1) % 3 === 0) {
        const hasBoss = groups.some(g => g.type === 'boss');
        if (!hasBoss) {
          groups = [
            ...groups,
            { type: 'boss', count: 1, interval: 0, path: 0, delay: 1.5 },
          ];
        }
      }

      spawnGroups = groups.map(g => ({
        type: g.type,
        remaining: g.count,
        interval: g.interval,
        path: g.path,
        delay: g.delay,
        timer: g.delay, // Delay before first spawn
        started: g.delay <= 0,
      }));
    },

    /**
     * Update — handle prep countdown or active spawning.
     */
    update(dt, gs) {
      if (gs.wavePhase === 'prep') {
        gs.prepTimeLeft -= dt * gs.speedMultiplier;
        if (gs.prepTimeLeft <= 0) {
          gs.prepTimeLeft = 0;
          this.startWave(gs);
        }
        return;
      }

      if (gs.wavePhase !== 'active') return;

      // Spawn enemies from groups
      let anyRemaining = false;
      for (const group of spawnGroups) {
        if (group.remaining <= 0) continue;
        anyRemaining = true;

        group.timer -= dt * gs.speedMultiplier;

        if (!group.started) {
          if (group.timer <= 0) {
            group.started = true;
            group.timer = 0;
          }
          continue;
        }

        if (group.timer <= 0) {
          gs.enemySystem.spawnEnemy(gs, group.type, group.path, gs.currentWave);
          group.remaining--;
          group.timer += group.interval;
        }
      }

      if (!anyRemaining) {
        allSpawned = true;
      }
    },

    /**
     * Check if the current wave is fully complete.
     */
    isWaveComplete(gs) {
      return allSpawned && gs.enemies.length === 0;
    },

    /**
     * Handle wave completion — award bonus, advance to next wave.
     */
    completeWave(gs) {
      const waveDef = WAVES[gs.currentWave];
      if (waveDef) {
        const bonus = Math.floor(waveDef.bonus * (gs.cashMultiplier || 1.0));
        gs.cash += bonus;
        gs.totalCashEarned += bonus;

        // Income from towers
        const incomeMultiplier = gs.motherLodeNextWave ? 2 : 1;
        for (const tower of gs.towers) {
          if (tower.income > 0) {
            const inc = tower.income * incomeMultiplier;
            gs.cash += inc;
            gs.totalCashEarned += inc;
          }
        }
        if (gs.motherLodeNextWave) gs.motherLodeNextWave = false;
      }

      gs.currentWave++;

      // Check victory
      if (gs.currentWave >= WAVES.length) {
        return 'victory';
      }

      this.startPrep(gs);
      return 'continue';
    },

    /**
     * Send next wave early for bonus cash.
     */
    sendEarly(gs) {
      if (gs.wavePhase !== 'prep') return 0;
      const bonus = Math.floor(gs.prepTimeLeft * 5);
      gs.cash += bonus;
      gs.totalCashEarned += bonus;
      this.startWave(gs);
      return bonus;
    },

    /** Total waves available */
    get totalWaves() {
      return WAVES.length;
    },
  };
}
