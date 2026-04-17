/**
 * Web Audio API wrapper for procedural sound generation.
 * No audio files needed — all sounds are generated with oscillators and noise.
 * @module audio-engine
 */

let audioContext = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;

/**
 * Initializes or returns the shared audio context and gain nodes.
 * @returns {{ ctx: AudioContext, master: GainNode, sfx: GainNode, music: GainNode }}
 */
export function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    sfxGain = audioContext.createGain();
    sfxGain.connect(masterGain);
    musicGain = audioContext.createGain();
    musicGain.connect(masterGain);
  }
  return { ctx: audioContext, master: masterGain, sfx: sfxGain, music: musicGain };
}

/**
 * Resumes audio context if suspended (required after user interaction).
 */
export async function resumeAudio() {
  const { ctx } = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}

/**
 * Sets master volume (0 to 1).
 * @param {number} vol
 */
export function setMasterVolume(vol) {
  const { master } = getAudioContext();
  master.gain.setValueAtTime(vol, audioContext.currentTime);
}

/**
 * Sets SFX volume (0 to 1).
 * @param {number} vol
 */
export function setSFXVolume(vol) {
  const { sfx } = getAudioContext();
  sfx.gain.setValueAtTime(vol, audioContext.currentTime);
}

/**
 * Sets music volume (0 to 1).
 * @param {number} vol
 */
export function setMusicVolume(vol) {
  const { music } = getAudioContext();
  music.gain.setValueAtTime(vol, audioContext.currentTime);
}

/** @returns {number} Current master volume */
export function getMasterVolume() {
  const { master } = getAudioContext();
  return master.gain.value;
}

/** @returns {number} Current SFX volume */
export function getSFXVolume() {
  const { sfx } = getAudioContext();
  return sfx.gain.value;
}

/** @returns {number} Current music volume */
export function getMusicVolume() {
  const { music } = getAudioContext();
  return music.gain.value;
}

/**
 * Plays a simple tone as a sound effect.
 * @param {number} frequency - Frequency in Hz (e.g., 440 for A4)
 * @param {number} duration - Duration in seconds
 * @param {string} [type='sine'] - Oscillator type: 'sine', 'square', 'sawtooth', 'triangle'
 * @param {number} [volume=0.3] - Volume 0 to 1
 */
export function playSFX(frequency, duration, type = 'sine', volume = 0.3) {
  const { ctx, sfx } = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

/**
 * Plays a musical note by name.
 * @param {string} note - Note name (e.g., 'C4', 'A#3', 'Gb5')
 * @param {number} duration - Duration in seconds
 * @param {string} [type='sine'] - Oscillator type
 * @param {number} [volume=0.3] - Volume 0 to 1
 */
export function playNote(note, duration, type = 'sine', volume = 0.3) {
  const freq = noteToFrequency(note);
  if (freq) playSFX(freq, duration, type, volume);
}

/**
 * Plays a "pickup/coin" sound effect.
 */
export function playPickup() {
  const { ctx, sfx } = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Plays an "explosion/hit" sound effect using noise.
 * @param {number} [duration=0.3]
 */
export function playExplosion(duration = 0.3) {
  const { ctx, sfx } = getAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  source.connect(gain);
  gain.connect(sfx);
  source.start(ctx.currentTime);
}

/**
 * Plays a "laser/shoot" sound effect.
 */
export function playLaser() {
  const { ctx, sfx } = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Plays a "jump" sound effect.
 */
export function playJump() {
  const { ctx, sfx } = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(sfx);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

/**
 * Plays a success/achievement jingle.
 */
export function playSuccess() {
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playSFX(freq, 0.2, 'sine', 0.2), i * 100);
  });
}

/**
 * Plays a failure/game-over sound.
 */
export function playFailure() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => playSFX(freq, 0.3, 'triangle', 0.2), i * 150);
  });
}

// ─── Helpers ─────────────────────────────────────────────────────

const NOTE_MAP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * Converts a note name to frequency in Hz.
 * @param {string} note - Note name (e.g., 'A4', 'C#3')
 * @returns {number|null} Frequency or null if invalid
 */
export function noteToFrequency(note) {
  const match = note.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return null;
  let semitone = NOTE_MAP[match[1]];
  if (match[2] === '#') semitone++;
  if (match[2] === 'b') semitone--;
  const octave = parseInt(match[3]);
  const midi = semitone + (octave + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
