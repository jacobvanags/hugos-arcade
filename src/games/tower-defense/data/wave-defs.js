/**
 * Wave definitions — 80 waves with progressive difficulty.
 * Groups specify enemy type, count, spawn interval, path, and delay.
 * HP scaling is handled by getScaledHp() in enemy-defs.js.
 */
export const WAVES = [
  // ═══════════════════════════════════════════
  // CHAPTER 1: TUTORIAL (Waves 1-5)
  // ═══════════════════════════════════════════
  { groups: [{ type: 'grunt', count: 6, interval: 1.0, path: 0, delay: 0 }], prepTime: 15, bonus: 50 },
  { groups: [{ type: 'grunt', count: 10, interval: 0.8, path: 0, delay: 0 }], prepTime: 12, bonus: 55 },
  { groups: [
    { type: 'grunt', count: 8, interval: 0.8, path: 0, delay: 0 },
    { type: 'scout', count: 4, interval: 0.5, path: 0, delay: 3 },
  ], prepTime: 12, bonus: 60 },
  { groups: [{ type: 'scout', count: 12, interval: 0.4, path: 0, delay: 0 }], prepTime: 12, bonus: 60 },
  { groups: [
    { type: 'grunt', count: 12, interval: 0.7, path: 0, delay: 0 },
    { type: 'tank', count: 2, interval: 2.0, path: 0, delay: 5 },
  ], prepTime: 15, bonus: 80 },

  // ═══════════════════════════════════════════
  // CHAPTER 2: NEW THREATS (Waves 6-10)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'grunt', count: 15, interval: 0.6, path: 0, delay: 0 },
    { type: 'sprinter', count: 5, interval: 0.3, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 70 },
  { groups: [{ type: 'swarm', count: 3, interval: 1.5, path: 0, delay: 0 }], prepTime: 12, bonus: 65 },
  { groups: [
    { type: 'grunt', count: 10, interval: 0.7, path: 0, delay: 0 },
    { type: 'shielded', count: 4, interval: 1.5, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 80 },
  { groups: [
    { type: 'scout', count: 15, interval: 0.3, path: 0, delay: 0 },
    { type: 'healer', count: 2, interval: 3.0, path: 0, delay: 2 },
  ], prepTime: 12, bonus: 85 },
  // Wave 10: Mini-Boss
  { groups: [
    { type: 'grunt', count: 15, interval: 0.6, path: 0, delay: 0 },
    { type: 'tank', count: 4, interval: 2.0, path: 0, delay: 3 },
    { type: 'boss', count: 1, interval: 0, path: 0, delay: 10 },
  ], prepTime: 20, bonus: 200 },

  // ═══════════════════════════════════════════
  // CHAPTER 3: ESCALATION (Waves 11-20)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'cloaked', count: 6, interval: 1.0, path: 0, delay: 0 },
    { type: 'grunt', count: 12, interval: 0.6, path: 0, delay: 3 },
  ], prepTime: 12, bonus: 80 },
  { groups: [
    { type: 'swarm', count: 5, interval: 1.2, path: 0, delay: 0 },
    { type: 'splitter', count: 4, interval: 2.0, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 85 },
  { groups: [
    { type: 'shielded', count: 8, interval: 1.0, path: 0, delay: 0 },
    { type: 'healer', count: 3, interval: 2.0, path: 0, delay: 3 },
  ], prepTime: 12, bonus: 90 },
  { groups: [
    { type: 'sprinter', count: 15, interval: 0.25, path: 0, delay: 0 },
    { type: 'cloaked', count: 5, interval: 1.5, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 90 },
  // Wave 15: Boss
  { groups: [
    { type: 'tank', count: 6, interval: 1.5, path: 0, delay: 0 },
    { type: 'shielded', count: 6, interval: 1.0, path: 0, delay: 5 },
    { type: 'boss', count: 1, interval: 0, path: 0, delay: 12 },
  ], prepTime: 20, bonus: 250 },
  { groups: [
    { type: 'grunt', count: 25, interval: 0.4, path: 0, delay: 0 },
    { type: 'horde', count: 4, interval: 1.0, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 95 },
  { groups: [
    { type: 'healer', count: 4, interval: 1.5, path: 0, delay: 0 },
    { type: 'tank', count: 6, interval: 1.5, path: 0, delay: 2 },
    { type: 'warper', count: 4, interval: 2.0, path: 0, delay: 6 },
  ], prepTime: 12, bonus: 100 },
  { groups: [
    { type: 'cloaked', count: 10, interval: 0.8, path: 0, delay: 0 },
    { type: 'sprinter', count: 15, interval: 0.3, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 100 },
  { groups: [
    { type: 'swarm', count: 8, interval: 0.8, path: 0, delay: 0 },
    { type: 'splitter', count: 6, interval: 1.5, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 105 },
  // Wave 20: Broodmother
  { groups: [
    { type: 'tank', count: 8, interval: 1.2, path: 0, delay: 0 },
    { type: 'shielded', count: 8, interval: 1.0, path: 0, delay: 5 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 12 },
  ], prepTime: 20, bonus: 300 },

  // ═══════════════════════════════════════════
  // CHAPTER 4: GAUNTLET (Waves 21-30)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'grunt', count: 30, interval: 0.3, path: 0, delay: 0 },
    { type: 'brute', count: 3, interval: 3.0, path: 0, delay: 3 },
  ], prepTime: 12, bonus: 110 },
  { groups: [
    { type: 'shielded', count: 12, interval: 0.7, path: 0, delay: 0 },
    { type: 'healer', count: 5, interval: 1.5, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 115 },
  { groups: [
    { type: 'cloaked', count: 12, interval: 0.6, path: 0, delay: 0 },
    { type: 'horde', count: 6, interval: 0.8, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 120 },
  { groups: [
    { type: 'brute', count: 4, interval: 2.5, path: 0, delay: 0 },
    { type: 'sprinter', count: 20, interval: 0.2, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 120 },
  // Wave 25: Phantom Boss
  { groups: [
    { type: 'grunt', count: 20, interval: 0.4, path: 0, delay: 0 },
    { type: 'cloaked', count: 10, interval: 0.6, path: 0, delay: 4 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 12 },
  ], prepTime: 20, bonus: 350 },
  { groups: [
    { type: 'horde', count: 8, interval: 0.6, path: 0, delay: 0 },
    { type: 'healer', count: 6, interval: 1.0, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 130 },
  { groups: [
    { type: 'warper', count: 8, interval: 1.0, path: 0, delay: 0 },
    { type: 'tank', count: 8, interval: 1.2, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 135 },
  { groups: [
    { type: 'shielded', count: 15, interval: 0.6, path: 0, delay: 0 },
    { type: 'sprinter', count: 25, interval: 0.2, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 140 },
  { groups: [
    { type: 'tank', count: 12, interval: 0.8, path: 0, delay: 0 },
    { type: 'splitter', count: 8, interval: 1.0, path: 0, delay: 4 },
    { type: 'cloaked', count: 8, interval: 0.8, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 145 },
  // Wave 30: Titan Boss
  { groups: [
    { type: 'brute', count: 6, interval: 2.0, path: 0, delay: 0 },
    { type: 'shielded', count: 12, interval: 0.6, path: 0, delay: 5 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 15 },
  ], prepTime: 20, bonus: 400 },

  // ═══════════════════════════════════════════
  // CHAPTER 5: STORM (Waves 31-40)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'horde', count: 10, interval: 0.4, path: 0, delay: 0 },
    { type: 'brute', count: 6, interval: 1.5, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 160 },
  { groups: [
    { type: 'cloaked', count: 18, interval: 0.4, path: 0, delay: 0 },
    { type: 'warper', count: 6, interval: 1.5, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 170 },
  { groups: [
    { type: 'shielded', count: 18, interval: 0.5, path: 0, delay: 0 },
    { type: 'splitter', count: 10, interval: 0.8, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 180 },
  { groups: [
    { type: 'sprinter', count: 40, interval: 0.12, path: 0, delay: 0 },
    { type: 'cloaked', count: 15, interval: 0.5, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 190 },
  // Wave 35: Boss Rush + Broodmother
  { groups: [
    { type: 'tank', count: 15, interval: 0.8, path: 0, delay: 0 },
    { type: 'healer', count: 8, interval: 0.8, path: 0, delay: 5 },
    { type: 'boss', count: 2, interval: 4.0, path: 0, delay: 12 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 18 },
  ], prepTime: 20, bonus: 500 },
  { groups: [
    { type: 'grunt', count: 40, interval: 0.2, path: 0, delay: 0 },
    { type: 'healer', count: 10, interval: 0.6, path: 0, delay: 5 },
    { type: 'horde', count: 8, interval: 0.5, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 200 },
  { groups: [
    { type: 'warper', count: 10, interval: 0.8, path: 0, delay: 0 },
    { type: 'shielded', count: 15, interval: 0.5, path: 0, delay: 5 },
    { type: 'brute', count: 8, interval: 1.2, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 220 },
  { groups: [
    { type: 'swarm', count: 20, interval: 0.3, path: 0, delay: 0 },
    { type: 'splitter', count: 12, interval: 0.6, path: 0, delay: 5 },
    { type: 'boss', count: 2, interval: 3.0, path: 0, delay: 12 },
  ], prepTime: 12, bonus: 250 },
  { groups: [
    { type: 'brute', count: 10, interval: 1.0, path: 0, delay: 0 },
    { type: 'shielded', count: 20, interval: 0.5, path: 0, delay: 5 },
    { type: 'cloaked', count: 15, interval: 0.4, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 300 },
  // Wave 40: Midpoint — Titan + Phantom
  { groups: [
    { type: 'grunt', count: 30, interval: 0.2, path: 0, delay: 0 },
    { type: 'brute', count: 8, interval: 1.0, path: 0, delay: 3 },
    { type: 'shielded', count: 15, interval: 0.5, path: 0, delay: 6 },
    { type: 'healer', count: 8, interval: 0.8, path: 0, delay: 8 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 14 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 18 },
  ], prepTime: 25, bonus: 600 },

  // ═══════════════════════════════════════════
  // CHAPTER 6: ONSLAUGHT (Waves 41-50)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'grunt', count: 40, interval: 0.2, path: 0, delay: 0 },
    { type: 'sprinter', count: 30, interval: 0.15, path: 0, delay: 4 },
  ], prepTime: 12, bonus: 180 },
  { groups: [
    { type: 'brute', count: 10, interval: 0.8, path: 0, delay: 0 },
    { type: 'healer', count: 8, interval: 1.0, path: 0, delay: 3 },
    { type: 'shielded', count: 10, interval: 0.8, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 200 },
  { groups: [
    { type: 'cloaked', count: 20, interval: 0.3, path: 0, delay: 0 },
    { type: 'warper', count: 10, interval: 0.6, path: 0, delay: 4 },
    { type: 'healer', count: 5, interval: 1.5, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 210 },
  { groups: [
    { type: 'shielded', count: 20, interval: 0.5, path: 0, delay: 0 },
    { type: 'splitter', count: 12, interval: 0.6, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 220 },
  // Wave 45: Boss + Broodmother Duo
  { groups: [
    { type: 'horde', count: 12, interval: 0.3, path: 0, delay: 0 },
    { type: 'healer', count: 8, interval: 0.8, path: 0, delay: 5 },
    { type: 'boss', count: 2, interval: 4.0, path: 0, delay: 10 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 16 },
  ], prepTime: 20, bonus: 450 },
  { groups: [
    { type: 'horde', count: 15, interval: 0.2, path: 0, delay: 0 },
    { type: 'grunt', count: 35, interval: 0.2, path: 0, delay: 4 },
  ], prepTime: 10, bonus: 230 },
  { groups: [
    { type: 'brute', count: 12, interval: 0.7, path: 0, delay: 0 },
    { type: 'cloaked', count: 15, interval: 0.4, path: 0, delay: 5 },
    { type: 'warper', count: 8, interval: 1.0, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 240 },
  { groups: [
    { type: 'sprinter', count: 50, interval: 0.1, path: 0, delay: 0 },
    { type: 'cloaked', count: 20, interval: 0.3, path: 0, delay: 4 },
  ], prepTime: 10, bonus: 250 },
  { groups: [
    { type: 'brute', count: 10, interval: 0.8, path: 0, delay: 0 },
    { type: 'shielded', count: 20, interval: 0.5, path: 0, delay: 4 },
    { type: 'splitter', count: 15, interval: 0.4, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 260 },
  // Wave 50: Titan + Phantom Duo
  { groups: [
    { type: 'grunt', count: 35, interval: 0.2, path: 0, delay: 0 },
    { type: 'brute', count: 10, interval: 0.8, path: 0, delay: 3 },
    { type: 'healer', count: 10, interval: 0.6, path: 0, delay: 6 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 12 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 16 },
  ], prepTime: 22, bonus: 550 },

  // ═══════════════════════════════════════════
  // CHAPTER 7: INVASION (Waves 51-60)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'cloaked', count: 25, interval: 0.25, path: 0, delay: 0 },
    { type: 'warper', count: 12, interval: 0.5, path: 0, delay: 4 },
  ], prepTime: 10, bonus: 270 },
  { groups: [
    { type: 'brute', count: 15, interval: 0.6, path: 0, delay: 0 },
    { type: 'shielded', count: 20, interval: 0.4, path: 0, delay: 5 },
  ], prepTime: 12, bonus: 280 },
  { groups: [
    { type: 'horde', count: 20, interval: 0.15, path: 0, delay: 0 },
    { type: 'sprinter', count: 30, interval: 0.1, path: 0, delay: 3 },
    { type: 'cloaked', count: 15, interval: 0.4, path: 0, delay: 8 },
  ], prepTime: 10, bonus: 290 },
  { groups: [
    { type: 'shielded', count: 25, interval: 0.4, path: 0, delay: 0 },
    { type: 'healer', count: 12, interval: 0.5, path: 0, delay: 4 },
    { type: 'splitter', count: 10, interval: 0.6, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 300 },
  // Wave 55: Boss Rush + Broodmother
  { groups: [
    { type: 'cloaked', count: 20, interval: 0.3, path: 0, delay: 0 },
    { type: 'healer', count: 8, interval: 0.8, path: 0, delay: 4 },
    { type: 'boss', count: 3, interval: 3.0, path: 0, delay: 10 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 18 },
  ], prepTime: 20, bonus: 550 },
  { groups: [
    { type: 'grunt', count: 50, interval: 0.15, path: 0, delay: 0 },
    { type: 'horde', count: 15, interval: 0.2, path: 0, delay: 5 },
  ], prepTime: 10, bonus: 310 },
  { groups: [
    { type: 'brute', count: 15, interval: 0.5, path: 0, delay: 0 },
    { type: 'shielded', count: 22, interval: 0.4, path: 0, delay: 5 },
    { type: 'warper', count: 10, interval: 0.6, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 320 },
  { groups: [
    { type: 'healer', count: 15, interval: 0.4, path: 0, delay: 0 },
    { type: 'brute', count: 12, interval: 0.6, path: 0, delay: 4 },
  ], prepTime: 10, bonus: 330 },
  { groups: [
    { type: 'splitter', count: 20, interval: 0.3, path: 0, delay: 0 },
    { type: 'shielded', count: 25, interval: 0.35, path: 0, delay: 5 },
    { type: 'healer', count: 10, interval: 0.6, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 340 },
  // Wave 60: All Bosses
  { groups: [
    { type: 'brute', count: 12, interval: 0.6, path: 0, delay: 0 },
    { type: 'shielded', count: 20, interval: 0.4, path: 0, delay: 4 },
    { type: 'healer', count: 12, interval: 0.5, path: 0, delay: 7 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 12 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 15 },
    { type: 'boss', count: 3, interval: 3.0, path: 0, delay: 18 },
  ], prepTime: 22, bonus: 650 },

  // ═══════════════════════════════════════════
  // CHAPTER 8: APOCALYPSE (Waves 61-70)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'sprinter', count: 60, interval: 0.08, path: 0, delay: 0 },
    { type: 'cloaked', count: 25, interval: 0.25, path: 0, delay: 4 },
    { type: 'warper', count: 10, interval: 0.6, path: 0, delay: 8 },
  ], prepTime: 10, bonus: 350 },
  { groups: [
    { type: 'brute', count: 15, interval: 0.5, path: 0, delay: 0 },
    { type: 'shielded', count: 25, interval: 0.35, path: 0, delay: 4 },
    { type: 'splitter', count: 15, interval: 0.4, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 360 },
  { groups: [
    { type: 'cloaked', count: 30, interval: 0.2, path: 0, delay: 0 },
    { type: 'healer', count: 15, interval: 0.4, path: 0, delay: 5 },
  ], prepTime: 10, bonus: 370 },
  { groups: [
    { type: 'horde', count: 20, interval: 0.1, path: 0, delay: 0 },
    { type: 'brute', count: 12, interval: 0.6, path: 0, delay: 4 },
    { type: 'shielded', count: 20, interval: 0.4, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 380 },
  // Wave 65: Boss Army
  { groups: [
    { type: 'shielded', count: 25, interval: 0.3, path: 0, delay: 0 },
    { type: 'healer', count: 12, interval: 0.5, path: 0, delay: 4 },
    { type: 'boss', count: 3, interval: 3.0, path: 0, delay: 10 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 18 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 22 },
  ], prepTime: 22, bonus: 700 },
  { groups: [
    { type: 'horde', count: 20, interval: 0.1, path: 0, delay: 0 },
    { type: 'sprinter', count: 40, interval: 0.08, path: 0, delay: 4 },
  ], prepTime: 10, bonus: 390 },
  { groups: [
    { type: 'brute', count: 18, interval: 0.4, path: 0, delay: 0 },
    { type: 'healer', count: 15, interval: 0.4, path: 0, delay: 4 },
    { type: 'warper', count: 12, interval: 0.5, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 400 },
  { groups: [
    { type: 'cloaked', count: 30, interval: 0.2, path: 0, delay: 0 },
    { type: 'splitter', count: 20, interval: 0.3, path: 0, delay: 4 },
    { type: 'healer', count: 12, interval: 0.5, path: 0, delay: 8 },
  ], prepTime: 10, bonus: 410 },
  { groups: [
    { type: 'horde', count: 25, interval: 0.08, path: 0, delay: 0 },
    { type: 'brute', count: 15, interval: 0.5, path: 0, delay: 5 },
    { type: 'shielded', count: 22, interval: 0.35, path: 0, delay: 8 },
  ], prepTime: 12, bonus: 420 },
  // Wave 70: Mega Boss Rush
  { groups: [
    { type: 'brute', count: 15, interval: 0.4, path: 0, delay: 0 },
    { type: 'shielded', count: 25, interval: 0.35, path: 0, delay: 4 },
    { type: 'healer', count: 15, interval: 0.4, path: 0, delay: 7 },
    { type: 'boss', count: 3, interval: 3.0, path: 0, delay: 10 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 16 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 20 },
  ], prepTime: 25, bonus: 800 },

  // ═══════════════════════════════════════════
  // CHAPTER 9: ENDGAME (Waves 71-79)
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'sprinter', count: 70, interval: 0.06, path: 0, delay: 0 },
    { type: 'warper', count: 15, interval: 0.4, path: 0, delay: 4 },
    { type: 'healer', count: 10, interval: 0.6, path: 0, delay: 8 },
  ], prepTime: 10, bonus: 430 },
  { groups: [
    { type: 'brute', count: 20, interval: 0.4, path: 0, delay: 0 },
    { type: 'shielded', count: 28, interval: 0.3, path: 0, delay: 4 },
    { type: 'splitter', count: 15, interval: 0.4, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 440 },
  { groups: [
    { type: 'horde', count: 25, interval: 0.08, path: 0, delay: 0 },
    { type: 'cloaked', count: 30, interval: 0.2, path: 0, delay: 4 },
    { type: 'brute', count: 12, interval: 0.5, path: 0, delay: 7 },
  ], prepTime: 10, bonus: 450 },
  { groups: [
    { type: 'shielded', count: 30, interval: 0.3, path: 0, delay: 0 },
    { type: 'healer', count: 18, interval: 0.35, path: 0, delay: 4 },
    { type: 'warper', count: 15, interval: 0.4, path: 0, delay: 7 },
  ], prepTime: 12, bonus: 460 },
  // Wave 75: Boss Barrage — all boss types
  { groups: [
    { type: 'brute', count: 15, interval: 0.4, path: 0, delay: 0 },
    { type: 'shielded', count: 25, interval: 0.3, path: 0, delay: 4 },
    { type: 'boss', count: 4, interval: 2.5, path: 0, delay: 10 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 18 },
    { type: 'phantom', count: 1, interval: 0, path: 0, delay: 22 },
    { type: 'broodmother', count: 1, interval: 0, path: 0, delay: 25 },
  ], prepTime: 25, bonus: 900 },
  { groups: [
    { type: 'grunt', count: 70, interval: 0.1, path: 0, delay: 0 },
    { type: 'horde', count: 20, interval: 0.1, path: 0, delay: 5 },
    { type: 'healer', count: 12, interval: 0.5, path: 0, delay: 8 },
  ], prepTime: 10, bonus: 470 },
  { groups: [
    { type: 'brute', count: 20, interval: 0.35, path: 0, delay: 0 },
    { type: 'warper', count: 15, interval: 0.4, path: 0, delay: 4 },
    { type: 'shielded', count: 28, interval: 0.3, path: 0, delay: 7 },
    { type: 'splitter', count: 15, interval: 0.4, path: 0, delay: 10 },
  ], prepTime: 12, bonus: 480 },
  { groups: [
    { type: 'horde', count: 30, interval: 0.06, path: 0, delay: 0 },
    { type: 'sprinter', count: 50, interval: 0.06, path: 0, delay: 3 },
    { type: 'cloaked', count: 25, interval: 0.2, path: 0, delay: 7 },
  ], prepTime: 10, bonus: 490 },
  { groups: [
    { type: 'brute', count: 20, interval: 0.3, path: 0, delay: 0 },
    { type: 'shielded', count: 30, interval: 0.25, path: 0, delay: 4 },
    { type: 'healer', count: 18, interval: 0.35, path: 0, delay: 7 },
    { type: 'warper', count: 12, interval: 0.5, path: 0, delay: 9 },
  ], prepTime: 12, bonus: 500 },

  // ═══════════════════════════════════════════
  // WAVE 80: THE FINAL STAND — VEIA
  // ═══════════════════════════════════════════
  { groups: [
    { type: 'grunt', count: 50, interval: 0.1, path: 0, delay: 0 },
    { type: 'brute', count: 20, interval: 0.3, path: 0, delay: 3 },
    { type: 'shielded', count: 30, interval: 0.25, path: 0, delay: 6 },
    { type: 'healer', count: 20, interval: 0.3, path: 0, delay: 9 },
    { type: 'splitter', count: 15, interval: 0.3, path: 0, delay: 11 },
    { type: 'boss', count: 4, interval: 2.5, path: 0, delay: 14 },
    { type: 'titan', count: 1, interval: 0, path: 0, delay: 20 },
    { type: 'veia', count: 1, interval: 0, path: 0, delay: 25 },
  ], prepTime: 30, bonus: 2000 },
];
