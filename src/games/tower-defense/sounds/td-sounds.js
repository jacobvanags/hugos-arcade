/**
 * Tower Defense sound effects — procedural audio using Web Audio API.
 * Each tower type has a unique multi-layered firing sound.
 * Includes rate limiting to prevent audio overload.
 */
import { getAudioContext } from '../../../shared/audio-engine.js';

// Rate limiting — max one sound per type per interval
const _lastPlayed = {};
const SHOOT_COOLDOWN = 80; // ms between same tower type sounds

function canPlay(key, cooldown = SHOOT_COOLDOWN) {
  const now = Date.now();
  if (_lastPlayed[key] && now - _lastPlayed[key] < cooldown) return false;
  _lastPlayed[key] = now;
  return true;
}

/** Helper: create oscillator → gain → destination, auto-stop */
function quickOsc(ctx, dest, type, freq, vol, duration, freqEnd = null, startTime = 0) {
  const t = ctx.currentTime + startTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), t + duration);
  }
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/** Helper: noise burst with envelope */
function noiseBurst(ctx, dest, vol, duration, startTime = 0) {
  const t = ctx.currentTime + startTime;
  const bufLen = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.5);
  }
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buf;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(gain);
  gain.connect(dest);
  src.start(t);
}

/** Helper: filtered noise for "whoosh" or "thud" sounds */
function filteredNoise(ctx, dest, vol, duration, filterFreq, filterType = 'lowpass', startTime = 0) {
  const t = ctx.currentTime + startTime;
  const bufLen = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1);
  }
  const src = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  src.buffer = buf;
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(t);
}

// ═══════════════════════════════════════════════
// TOWER FIRING SOUNDS — unique per tower type
// ═══════════════════════════════════════════════

export function playShoot(towerType) {
  if (!canPlay('shoot_' + towerType)) return;
  const { ctx, sfx } = getAudioContext();

  switch (towerType) {
    case 'blaster':
      // Quick double-tap pew — two short square pulses
      quickOsc(ctx, sfx, 'square', 900, 0.08, 0.04, 600);
      quickOsc(ctx, sfx, 'square', 800, 0.06, 0.03, 500, null, 0.03);
      break;

    case 'railgun':
      // Heavy electromagnetic crack — low thump + high whip
      quickOsc(ctx, sfx, 'sawtooth', 80, 0.12, 0.15, 40);
      quickOsc(ctx, sfx, 'square', 2000, 0.06, 0.08, 400);
      filteredNoise(ctx, sfx, 0.08, 0.1, 800, 'highpass');
      break;

    case 'plasma':
      // Wobbly energy ball launch — sine sweep with vibrato feel
      quickOsc(ctx, sfx, 'sine', 300, 0.1, 0.12, 150);
      quickOsc(ctx, sfx, 'triangle', 600, 0.06, 0.1, 200);
      filteredNoise(ctx, sfx, 0.05, 0.08, 400, 'lowpass');
      break;

    case 'cryo':
      // Icy crystalline hiss — high sine ping + filtered noise
      quickOsc(ctx, sfx, 'sine', 2200, 0.06, 0.1, 1800);
      quickOsc(ctx, sfx, 'sine', 3300, 0.03, 0.06, 2800);
      filteredNoise(ctx, sfx, 0.04, 0.12, 3000, 'highpass');
      break;

    case 'tesla':
      // Electric zap — sawtooth buzz + crackle noise
      quickOsc(ctx, sfx, 'sawtooth', 800, 0.07, 0.06, 200);
      quickOsc(ctx, sfx, 'square', 1200, 0.04, 0.04, 600);
      noiseBurst(ctx, sfx, 0.06, 0.05);
      break;

    case 'missile':
      // Rocket launch — low rumble rising + whoosh
      quickOsc(ctx, sfx, 'sawtooth', 100, 0.1, 0.2, 200);
      quickOsc(ctx, sfx, 'square', 60, 0.08, 0.15, 30);
      filteredNoise(ctx, sfx, 0.07, 0.15, 600, 'lowpass');
      break;

    case 'laser':
      // Continuous beam hum — descending tone
      quickOsc(ctx, sfx, 'sawtooth', 1200, 0.06, 0.1, 200);
      quickOsc(ctx, sfx, 'sine', 900, 0.04, 0.08, 300);
      break;

    case 'flak':
      // Rapid burst — staccato pops like anti-aircraft
      quickOsc(ctx, sfx, 'square', 500, 0.08, 0.02, 200);
      noiseBurst(ctx, sfx, 0.1, 0.03);
      quickOsc(ctx, sfx, 'square', 450, 0.06, 0.02, 180, null, 0.03);
      noiseBurst(ctx, sfx, 0.07, 0.03, 0.04);
      quickOsc(ctx, sfx, 'square', 400, 0.05, 0.02, 150, null, 0.06);
      break;

    case 'venom':
      // Wet splat — low sine thud + squelchy noise
      quickOsc(ctx, sfx, 'sine', 200, 0.1, 0.08, 80);
      quickOsc(ctx, sfx, 'triangle', 400, 0.05, 0.06, 150);
      filteredNoise(ctx, sfx, 0.06, 0.1, 500, 'lowpass');
      break;

    case 'mortar':
      // Heavy thump + arc whoosh — deep impact launch
      quickOsc(ctx, sfx, 'square', 60, 0.12, 0.08, 30);
      quickOsc(ctx, sfx, 'sawtooth', 150, 0.08, 0.12, 80);
      filteredNoise(ctx, sfx, 0.09, 0.1, 300, 'lowpass');
      noiseBurst(ctx, sfx, 0.04, 0.15, 0.05);
      break;

    case 'gauss':
      // Magnetic accelerator — rising whine then sharp crack
      quickOsc(ctx, sfx, 'sine', 400, 0.05, 0.06, 2000);
      quickOsc(ctx, sfx, 'sawtooth', 100, 0.1, 0.04, 50, null, 0.05);
      filteredNoise(ctx, sfx, 0.08, 0.04, 2000, 'highpass', 0.05);
      break;

    case 'pulse':
      // Expanding energy ring — sine sweep out + resonance
      quickOsc(ctx, sfx, 'sine', 400, 0.08, 0.15, 100);
      quickOsc(ctx, sfx, 'triangle', 800, 0.04, 0.12, 200);
      quickOsc(ctx, sfx, 'sine', 600, 0.03, 0.1, 150, null, 0.02);
      break;

    case 'support':
      // Gentle buff ping — soft ascending chime
      quickOsc(ctx, sfx, 'sine', 800, 0.03, 0.08, 1200);
      quickOsc(ctx, sfx, 'sine', 1000, 0.02, 0.06, 1400, null, 0.04);
      break;

    case 'particle':
      // Sustained beam intensifying — humming buzz
      quickOsc(ctx, sfx, 'sawtooth', 600, 0.05, 0.08, 800);
      quickOsc(ctx, sfx, 'triangle', 300, 0.04, 0.06, 400);
      break;

    case 'quarry':
      // Mining drill hit — metallic clank
      quickOsc(ctx, sfx, 'square', 300, 0.06, 0.04, 100);
      quickOsc(ctx, sfx, 'triangle', 1500, 0.04, 0.03, 600);
      filteredNoise(ctx, sfx, 0.05, 0.05, 1000, 'bandpass');
      break;

    case 'disruptor':
      // Distortion wave — wobbly detuned oscillators
      quickOsc(ctx, sfx, 'sawtooth', 500, 0.06, 0.1, 250);
      quickOsc(ctx, sfx, 'sawtooth', 507, 0.06, 0.1, 253); // slight detune = beat frequency
      quickOsc(ctx, sfx, 'sine', 200, 0.04, 0.08, 100);
      break;

    default:
      quickOsc(ctx, sfx, 'square', 600, 0.06, 0.05, 300);
      break;
  }
}

// ═══════════════════════════════════════════════
// ENEMY DEATH SOUNDS — varied by enemy type
// ═══════════════════════════════════════════════

export function playEnemyDeath(enemyType) {
  if (!canPlay('death', 30)) return;
  const { ctx, sfx } = getAudioContext();

  switch (enemyType) {
    case 'boss':
    case 'veia':
    case 'titan':
    case 'broodmother':
      // Big boss explosion — deep rumble + crack + debris
      quickOsc(ctx, sfx, 'sawtooth', 60, 0.15, 0.4, 20);
      quickOsc(ctx, sfx, 'square', 40, 0.1, 0.3, 15);
      noiseBurst(ctx, sfx, 0.15, 0.3);
      filteredNoise(ctx, sfx, 0.08, 0.2, 400, 'lowpass', 0.1);
      quickOsc(ctx, sfx, 'sine', 200, 0.06, 0.15, 50, null, 0.15);
      break;

    case 'phantom':
      // Ghostly fade — high-pitched dissolve
      quickOsc(ctx, sfx, 'sine', 1500, 0.08, 0.2, 3000);
      quickOsc(ctx, sfx, 'triangle', 800, 0.05, 0.15, 2000);
      filteredNoise(ctx, sfx, 0.04, 0.15, 2000, 'highpass');
      break;

    case 'tank':
    case 'brute':
      // Heavy metallic crunch
      quickOsc(ctx, sfx, 'sawtooth', 100, 0.1, 0.15, 30);
      noiseBurst(ctx, sfx, 0.12, 0.12);
      filteredNoise(ctx, sfx, 0.06, 0.1, 800, 'bandpass');
      break;

    case 'shielded':
      // Shield shatter + pop — glass-break feel
      quickOsc(ctx, sfx, 'sine', 2000, 0.06, 0.06, 800);
      filteredNoise(ctx, sfx, 0.1, 0.08, 3000, 'highpass');
      quickOsc(ctx, sfx, 'triangle', 400, 0.06, 0.08, 100);
      break;

    case 'splitter':
      // Wet split — squelch + scatter
      quickOsc(ctx, sfx, 'sine', 300, 0.08, 0.08, 100);
      filteredNoise(ctx, sfx, 0.08, 0.1, 600, 'lowpass');
      quickOsc(ctx, sfx, 'triangle', 600, 0.04, 0.04, 200, null, 0.05);
      quickOsc(ctx, sfx, 'triangle', 500, 0.03, 0.04, 180, null, 0.07);
      break;

    case 'warper':
      // Dimensional collapse — reverse sweep
      quickOsc(ctx, sfx, 'sine', 100, 0.08, 0.12, 1200);
      quickOsc(ctx, sfx, 'triangle', 200, 0.05, 0.1, 800);
      break;

    default:
      // Standard small enemy pop
      quickOsc(ctx, sfx, 'sine', 400, 0.08, 0.06, 100);
      noiseBurst(ctx, sfx, 0.06, 0.06);
      break;
  }
}

// ═══════════════════════════════════════════════
// PROJECTILE IMPACT / EXPLOSION SOUNDS
// ═══════════════════════════════════════════════

export function playImpact(projectileType) {
  if (!canPlay('impact', 40)) return;
  const { ctx, sfx } = getAudioContext();

  switch (projectileType) {
    case 'missile':
      // Missile explosion — big boom
      quickOsc(ctx, sfx, 'sawtooth', 80, 0.12, 0.2, 25);
      noiseBurst(ctx, sfx, 0.12, 0.15);
      filteredNoise(ctx, sfx, 0.06, 0.1, 300, 'lowpass', 0.05);
      break;

    case 'mortar':
      // Mortar impact — earth-shaking thud
      quickOsc(ctx, sfx, 'sine', 50, 0.12, 0.15, 20);
      quickOsc(ctx, sfx, 'square', 120, 0.08, 0.1, 40);
      noiseBurst(ctx, sfx, 0.1, 0.12);
      break;

    case 'plasma':
      // Plasma splash — sizzling burst
      quickOsc(ctx, sfx, 'sine', 500, 0.08, 0.1, 150);
      filteredNoise(ctx, sfx, 0.08, 0.08, 1500, 'bandpass');
      break;

    default:
      // Small bullet hit
      noiseBurst(ctx, sfx, 0.05, 0.04);
      quickOsc(ctx, sfx, 'triangle', 800, 0.04, 0.03, 300);
      break;
  }
}

// ═══════════════════════════════════════════════
// UI & EVENT SOUNDS
// ═══════════════════════════════════════════════

export function playWaveStart() {
  if (!canPlay('waveStart', 500)) return;
  const { ctx, sfx } = getAudioContext();
  // Alert klaxon — two-tone rising
  quickOsc(ctx, sfx, 'sine', 440, 0.1, 0.12, 550);
  quickOsc(ctx, sfx, 'sine', 660, 0.1, 0.12, 820, null, 0.12);
  quickOsc(ctx, sfx, 'triangle', 220, 0.04, 0.2, 330);
}

export function playPlaceTower() {
  if (!canPlay('place', 100)) return;
  const { ctx, sfx } = getAudioContext();
  // Mechanical clunk + confirmation chime
  quickOsc(ctx, sfx, 'square', 200, 0.08, 0.04, 100);
  filteredNoise(ctx, sfx, 0.04, 0.03, 500, 'lowpass');
  quickOsc(ctx, sfx, 'sine', 400, 0.06, 0.08, 600, null, 0.04);
  quickOsc(ctx, sfx, 'sine', 500, 0.06, 0.06, 700, null, 0.08);
}

export function playGameOver() {
  const { ctx, sfx } = getAudioContext();
  // Descending doom — three falling tones + rumble
  quickOsc(ctx, sfx, 'sawtooth', 440, 0.12, 0.3, 200);
  quickOsc(ctx, sfx, 'sawtooth', 330, 0.12, 0.3, 150, null, 0.25);
  quickOsc(ctx, sfx, 'sawtooth', 200, 0.15, 0.5, 80, null, 0.5);
  filteredNoise(ctx, sfx, 0.06, 0.4, 200, 'lowpass', 0.6);
}

export function playVictory() {
  const { ctx, sfx } = getAudioContext();
  // Triumphant fanfare — rising chord
  quickOsc(ctx, sfx, 'sine', 440, 0.1, 0.15, 550);
  quickOsc(ctx, sfx, 'sine', 554, 0.1, 0.15, 660, null, 0.1);
  quickOsc(ctx, sfx, 'sine', 660, 0.1, 0.15, 784, null, 0.2);
  quickOsc(ctx, sfx, 'triangle', 880, 0.12, 0.3, 1100, null, 0.3);
  quickOsc(ctx, sfx, 'sine', 440, 0.05, 0.3, 550, null, 0.3);
}

export function playUpgrade() {
  if (!canPlay('upgrade', 200)) return;
  const { ctx, sfx } = getAudioContext();
  // Power-up shimmer — three rising chimes + sparkle
  quickOsc(ctx, sfx, 'sine', 600, 0.07, 0.08, 800);
  quickOsc(ctx, sfx, 'sine', 800, 0.07, 0.08, 1000, null, 0.06);
  quickOsc(ctx, sfx, 'sine', 1000, 0.08, 0.1, 1400, null, 0.12);
  filteredNoise(ctx, sfx, 0.03, 0.06, 3000, 'highpass', 0.12);
}

export function playSellTower() {
  if (!canPlay('sell', 200)) return;
  const { ctx, sfx } = getAudioContext();
  // Cash register + dismantle — coin ping + mechanical release
  quickOsc(ctx, sfx, 'sine', 1200, 0.06, 0.05, 1000);
  quickOsc(ctx, sfx, 'triangle', 600, 0.06, 0.06, 300, null, 0.03);
  quickOsc(ctx, sfx, 'triangle', 400, 0.05, 0.08, 200, null, 0.06);
  filteredNoise(ctx, sfx, 0.04, 0.06, 400, 'lowpass', 0.05);
}

export function playSelectTower() {
  if (!canPlay('select', 60)) return;
  const { ctx, sfx } = getAudioContext();
  quickOsc(ctx, sfx, 'sine', 1000, 0.03, 0.04, 1200);
}

export function playBossWarning() {
  if (!canPlay('bossWarn', 500)) return;
  const { ctx, sfx } = getAudioContext();
  // Ominous alert — deep pulses + alarm
  quickOsc(ctx, sfx, 'sawtooth', 70, 0.12, 0.4, 50);
  quickOsc(ctx, sfx, 'sawtooth', 90, 0.12, 0.4, 60, null, 0.3);
  quickOsc(ctx, sfx, 'sawtooth', 70, 0.14, 0.5, 40, null, 0.6);
  quickOsc(ctx, sfx, 'sine', 350, 0.04, 0.3, 250, null, 0.1);
  quickOsc(ctx, sfx, 'sine', 350, 0.04, 0.3, 250, null, 0.4);
}

export function playHeroAbility() {
  if (!canPlay('heroAbil', 200)) return;
  const { ctx, sfx } = getAudioContext();
  // Power activation — whoosh + energy burst
  filteredNoise(ctx, sfx, 0.06, 0.1, 800, 'bandpass');
  quickOsc(ctx, sfx, 'sine', 400, 0.08, 0.06, 800);
  quickOsc(ctx, sfx, 'sine', 600, 0.08, 0.06, 1000, null, 0.04);
  quickOsc(ctx, sfx, 'triangle', 800, 0.07, 0.06, 1200, null, 0.08);
  quickOsc(ctx, sfx, 'sine', 1200, 0.08, 0.1, 1800, null, 0.12);
}

export function playWaveComplete() {
  if (!canPlay('waveComp', 300)) return;
  const { ctx, sfx } = getAudioContext();
  // Short victory sting
  quickOsc(ctx, sfx, 'sine', 523, 0.06, 0.08, 650);
  quickOsc(ctx, sfx, 'sine', 659, 0.06, 0.08, 784, null, 0.07);
  quickOsc(ctx, sfx, 'sine', 784, 0.08, 0.12, 1047, null, 0.14);
}
