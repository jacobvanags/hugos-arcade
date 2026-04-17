/**
 * Procedural music system for Tower Defense.
 * Generates unique looping tracks per map using Web Audio API oscillators.
 * Each track has long sequences with mismatched layer lengths for
 * polyrhythmic cycling — the full combination takes minutes to repeat.
 */
import { getAudioContext } from '../../../shared/audio-engine.js';

let currentTrack = null;
let currentMapId = null;

// Note frequencies (octave 2-6)
const N = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
  'Bb2': 116.54, 'Eb3': 155.56, 'Ab2': 103.83,
  'Bb3': 233.08, 'Eb4': 311.13, 'Ab3': 207.65, 'Ab4': 415.30,
  'Bb4': 466.16, 'Eb5': 622.25, 'Ab5': 830.61,
  'F#2': 92.50, 'F#3': 185.00, 'F#4': 369.99, 'F#5': 739.99,
  'C#3': 138.59, 'C#4': 277.18, 'C#5': 554.37,
  'G#3': 207.65, 'G#4': 415.30, 'G#5': 830.61,
  'D#3': 155.56, 'D#4': 311.13, 'D#5': 622.25,
  'A#3': 233.08, 'A#4': 466.16, 'A#5': 932.33,
  'Db4': 277.18, 'Db5': 554.37,
  'Gb4': 369.99, 'Gb5': 739.99,
};

// Map-specific music definitions
// Each layer uses a DIFFERENT number of notes so cycles overlap at different points.
// The full pattern doesn't repeat until LCM(bass, lead, arp) beats — typically 3-8 minutes.
const MAP_TRACKS = {

  // ═══════════════════════════════════════════════
  // SPACE STATION — Cm march, pulsing sci-fi corridor
  // BPM 108 → beat = 0.556s
  // Lead: 64 notes = 35.6s, Bass: 36 notes = 20s, Arp: 18 notes
  // LCM(64,36,18) = 576 beats = 320s ≈ 5.3 min
  // ═══════════════════════════════════════════════
  'space-station': {
    bpm: 108,
    bass: { wave: 'square', notes: [
      // Phrase 1 — steady Cm pulse
      N.C3, N.G2, N.C3, N.G2, N.C3, N.G2, N['Bb2'], N.G2,
      // Phrase 2 — shifts to Fm
      N.F2, N.C3, N.F2, N.C3, N['Ab2'], N['Bb2'], N.G2, N.C3,
      // Phrase 3 — tension build
      N['Eb3'], N['Bb2'], N['Eb3'], N.G2, N['Ab2'], N['Ab2'], N['Bb2'], N['Bb2'],
      // Phrase 4 — descending resolution
      N.C3, N['Bb2'], N['Ab2'], N.G2, N.F2, N.G2, N['Ab2'], N['Bb2'],
      // Extra 4 for odd length
      N.C3, N.C3, N.G2, N.C3,
    ], vol: 0.11 },
    lead: { wave: 'triangle', vol: 0.07, notes: [
      // A — punchy call-and-response
      N.G4, N.G4, N.C5, N.G4, N['Bb4'], N.F4, N.G4, N.C4,
      N.G4, N.C5, N['Eb5'], N.C5, N['Bb4'], N['Bb4'], N.G4, N.F4,
      // B — ascending tension
      N.C4, N['Eb4'], N.G4, N['Bb4'], N.C5, N['Eb5'], N.C5, N['Bb4'],
      N.G4, N.F4, N['Eb4'], N.F4, N.G4, N['Bb4'], N.G4, N.F4,
      // C — rhythmic stutter section
      N['Eb5'], N['Eb5'], N.C5, N['Eb5'], N.F5, N['Eb5'], N.C5, N['Bb4'],
      N.G4, N.G4, N['Bb4'], N.G4, N.F4, N['Eb4'], N.C4, N['Eb4'],
      // D — resolution, melodic descent
      N.G4, N['Bb4'], N.C5, N.G4, N.F4, N['Eb4'], N.C4, N['Bb3'],
      N.C4, N['Eb4'], N.F4, N.G4, N['Bb4'], N.G4, N.C5, N.G4,
    ] },
    pad: { wave: 'sine', chords: [
      [N.C4, N['Eb4'], N.G4],     // Cm
      [N.F3, N['Ab3'], N.C4],     // Fm
      [N['Ab3'], N.C4, N['Eb4']], // Ab
      [N['Bb3'], N.D4, N.F4],     // Bb
    ], vol: 0.04, beatsPerChord: 16 },
    arp: { wave: 'square', notes: [
      N.C5, N.G4, N.C5, N['Eb5'], N.G5, N['Eb5'],
      N['Bb4'], N.F4, N['Bb4'], N.C5, N['Eb5'], N.C5,
      N.G4, N.C5, N['Eb5'], N.G5, N.C5, N.G4,
    ], vol: 0.025, speed: 2 },
  },

  // ═══════════════════════════════════════════════
  // CRYSTAL CAVES — Am pentatonic, slow & mysterious
  // BPM 78 → beat = 0.769s
  // Lead: 64 notes = 49.2s, Bass: 28 notes = 21.5s, Arp: 22 notes
  // LCM(64,28,22) = 4928 beats ≈ 63 min (effectively never repeats!)
  // ═══════════════════════════════════════════════
  'crystal-caves': {
    bpm: 78,
    bass: { wave: 'triangle', notes: [
      // Phrase 1 — Am drone
      N.A2, N.A2, N.A2, N.E3, N.A2, N.A2, N.G2, N.D3,
      // Phrase 2 — to Em
      N.E2, N.E2, N.B2, N.E3, N.G2, N.G2, N.D3, N.G2,
      // Phrase 3 — descending
      N.A2, N.G2, N.F2, N.E2, N.D2, N.E2, N.G2, N.A2,
      // Extra 4
      N.A2, N.E2, N.A2, N.G2,
    ], vol: 0.09 },
    lead: { wave: 'sine', vol: 0.07, notes: [
      // A — wide leaps, spacious
      N.E5, N.A4, N.E5, N.A5, N.D5, N.A4, N.G4, N.A4,
      N.C5, N.G5, N.E5, N.D5, N.A4, N.A4, N.E4, N.A4,
      // B — descending melody, melancholy
      N.A5, N.G5, N.E5, N.D5, N.C5, N.A4, N.G4, N.E4,
      N.D4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.E4,
      // C — call from the deep
      N.A4, N.E4, N.A4, N.C5, N.D5, N.E5, N.G5, N.E5,
      N.D5, N.C5, N.D5, N.E5, N.A4, N.G4, N.A4, N.C5,
      // D — resolution, floating
      N.E5, N.E5, N.D5, N.C5, N.A4, N.C5, N.D5, N.A4,
      N.G4, N.A4, N.E5, N.A4, N.G4, N.E4, N.A4, N.A4,
    ] },
    pad: { wave: 'sine', chords: [
      [N.A3, N.E4, N.A4],         // Am open 5th
      [N.E3, N.B3, N.E4],         // Em open 5th
      [N.G3, N.D4, N.G4],         // G5
      [N.D3, N.A3, N.D4],         // Dm open 5th
    ], vol: 0.055, beatsPerChord: 14 },
    arp: { wave: 'sine', notes: [
      N.A5, N.E5, N.D5, N.A4, N.G4, N.A4,
      N.E5, N.A5, N.G5, N.E5, N.D5, N.E5,
      N.A4, N.D5, N.E5, N.G5, N.A5, N.G5,
      N.E5, N.D5, N.A4, N.E5,
    ], vol: 0.035, speed: 2 },
  },

  // ═══════════════════════════════════════════════
  // ALIEN PLANET — Whole-tone scale, tribal & alien
  // BPM 95 → beat = 0.632s
  // Lead: 64 notes = 40.4s, Bass: 30 notes = 19.0s, Arp: 14 notes
  // LCM(64,30,14) = 6720 beats — enormous cycle
  // ═══════════════════════════════════════════════
  'alien-planet': {
    bpm: 95,
    bass: { wave: 'sawtooth', notes: [
      // Phrase 1 — D whole-tone groove
      N.D3, N.D2, N.D3, N.E3, N.D3, N.D2, N['F#3'], N.E3,
      // Phrase 2 — drops lower
      N.D2, N.E2, N['F#2'], N.D2, N.D3, N['G#3'], N.D3, N.E3,
      // Phrase 3 — syncopated hits
      N['F#2'], N['F#2'], N.D2, N.E2, N['G#3'], N.D3, N.E3, N.D2,
      // Extra 6 for odd length
      N.D3, N.D2, N['F#3'], N['G#3'], N.E3, N.D3,
    ], vol: 0.1 },
    lead: { wave: 'square', vol: 0.06, notes: [
      // A — whole-tone climb
      N.D4, N.E4, N['F#4'], N['G#4'], N.D5, N.D5, N['G#4'], N.E4,
      N['F#4'], N.A4, N['F#4'], N.D4, N.E4, N['G#4'], N.E4, N.D4,
      // B — rhythmic tribal pattern
      N.D4, N.D4, N['F#4'], N.D4, N['G#4'], N['G#4'], N.E4, N['F#4'],
      N.D5, N.E5, N.D5, N['G#4'], N['F#4'], N.D4, N.E4, N['F#4'],
      // C — ascending exploration
      N.E4, N['G#4'], N.D5, N.E5, N['F#5'], N.E5, N.D5, N['G#4'],
      N['F#4'], N.E4, N.D4, N.E4, N['F#4'], N['G#4'], N.E4, N.D4,
      // D — alien call
      N['G#4'], N.D5, N['G#4'], N.E4, N.D4, N['F#4'], N.D5, N.E5,
      N['F#5'], N.D5, N.E5, N['G#4'], N['F#4'], N.E4, N.D4, N.D4,
    ] },
    pad: { wave: 'triangle', chords: [
      [N.D3, N['F#3'], N['G#3']],   // D augmented
      [N.E3, N['G#3'], N.D4],       // whole-tone cluster
      [N['F#3'], N.D4, N.E4],       // shifted cluster
    ], vol: 0.035, beatsPerChord: 20 },
    arp: { wave: 'square', notes: [
      N.D5, N['G#4'], N.E5, N.D5,
      N['F#5'], N.E5, N['G#4'], N.D5,
      N.E5, N['F#5'], N.D5, N.E5,
      N['G#4'], N.D5,
    ], vol: 0.02, speed: 3 },
  },

  // ═══════════════════════════════════════════════
  // FROZEN TUNDRA — Em, very slow & glacial
  // BPM 72 → beat = 0.833s
  // Lead: 64 notes = 53.3s, Bass: 34 notes = 28.3s, Arp: 20 notes
  // LCM(64,34,20) = 10880 beats — massively long cycle
  // ═══════════════════════════════════════════════
  'frozen-tundra': {
    bpm: 72,
    bass: { wave: 'sine', notes: [
      // Phrase 1 — Em drone, sparse
      N.E2, N.E2, N.E2, N.E2, N.B2, N.B2, N.C3, N.C3,
      // Phrase 2 — Am shift
      N.A2, N.A2, N.E2, N.E2, N.B2, N.B2, N.B2, N.E2,
      // Phrase 3 — deep descent
      N.C3, N.B2, N.A2, N.G2, N.E2, N.E2, N.G2, N.A2,
      // Phrase 4 — returns, slightly shorter
      N.B2, N.E2, N.E2, N.B2, N.C3, N.B2, N.A2, N.E2,
      // Extra 2
      N.E2, N.B2,
    ], vol: 0.1 },
    lead: { wave: 'sine', vol: 0.065, notes: [
      // A — half-step tension, icy
      N.B4, N.B4, N.C5, N.B4, N.E4, N.E4, N.E4, N.G4,
      N.B4, N.C5, N.D5, N.C5, N.B4, N.G4, N.E4, N.E4,
      // B — lonely descent
      N.E5, N.D5, N.C5, N.B4, N.A4, N.G4, N.E4, N.G4,
      N.A4, N.B4, N.A4, N.G4, N.E4, N.E4, N.G4, N.E4,
      // C — wide intervals, open space
      N.E4, N.B4, N.E4, N.B3, N.E4, N.G4, N.B4, N.E5,
      N.D5, N.B4, N.G4, N.B4, N.C5, N.B4, N.A4, N.G4,
      // D — closing phrase, settles
      N.B4, N.A4, N.G4, N.E4, N.G4, N.A4, N.B4, N.C5,
      N.B4, N.B4, N.A4, N.G4, N.E4, N.G4, N.E4, N.E4,
    ] },
    pad: { wave: 'sine', chords: [
      [N.E3, N.B3, N.E4],         // Em open 5th — cold
      [N.C3, N.G3, N.C4],         // C open 5th
      [N.A3, N.E4, N.A4],         // Am open 5th
      [N.B3, N.E4, N.B4],         // Bsus
    ], vol: 0.05, beatsPerChord: 17 },
    arp: { wave: 'triangle', notes: [
      N.B5, N.E5, N.B5, N.C6,
      N.B5, N.G5, N.E5, N.B4,
      N.E5, N.G5, N.B5, N.E5,
      N.G5, N.E5, N.B4, N.E5,
      N.B5, N.C6, N.B5, N.G5,
    ], vol: 0.02, speed: 1.5 },
  },

  // ═══════════════════════════════════════════════
  // ASTEROID FIELD — Am, fast & aggressive
  // BPM 138 → beat = 0.435s
  // Lead: 96 notes = 41.7s (longer array for fast BPM)
  // Bass: 28 notes = 12.2s, Arp: 22 notes
  // LCM(96,28,22) = 14784 — enormous
  // ═══════════════════════════════════════════════
  'asteroid-field': {
    bpm: 138,
    bass: { wave: 'square', notes: [
      // Phrase 1 — Am pumping
      N.A2, N.A2, N.A3, N.A2, N.G2, N.G2, N.G3, N.F2,
      // Phrase 2 — tension shift
      N.E2, N.E2, N.E3, N.E2, N.F2, N.G2, N.A2, N.G2,
      // Phrase 3 — chromatic descent
      N.A2, N['Ab2'], N.G2, N['F#2'], N.F2, N.E2, N.F2, N.G2,
      // Extra 4
      N.A2, N.E2, N.A2, N.G2,
    ], vol: 0.12 },
    lead: { wave: 'sawtooth', vol: 0.05, notes: [
      // A — hammering repeated notes
      N.A4, N.A4, N.C5, N.A4, N.A4, N.G4, N.E4, N.G4,
      N.A4, N.A4, N.D5, N.C5, N.E5, N.C5, N.A4, N.A4,
      // B — rapid scalar runs
      N.E4, N.F4, N.G4, N.A4, N.C5, N.D5, N.E5, N.D5,
      N.C5, N.A4, N.G4, N.F4, N.E4, N.G4, N.A4, N.C5,
      // C — syncopated hits
      N.E5, N.E5, N.C5, N.E5, N.D5, N.D5, N.A4, N.D5,
      N.C5, N.C5, N.A4, N.G4, N.A4, N.C5, N.E5, N.C5,
      // D — descending power
      N.A5, N.G5, N.E5, N.D5, N.C5, N.A4, N.G4, N.E4,
      N.D4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4, N.E4,
      // E — call-back to A, varied
      N.A4, N.C5, N.A4, N.G4, N.E4, N.G4, N.A4, N.C5,
      N.D5, N.E5, N.D5, N.A4, N.G4, N.A4, N.C5, N.A4,
      // F — final push, peak intensity
      N.E5, N.D5, N.E5, N.G5, N.E5, N.D5, N.C5, N.A4,
      N.G4, N.A4, N.C5, N.D5, N.E5, N.C5, N.A4, N.A4,
    ] },
    pad: { wave: 'triangle', chords: [
      [N.A3, N.C4, N.E4],         // Am
      [N.F3, N.A3, N.C4],         // F
      [N.E3, N.G3, N.B3],         // Em
    ], vol: 0.025, beatsPerChord: 16 },
    arp: { wave: 'square', notes: [
      N.A5, N.A4, N.E5, N.A5, N.A4, N.C5,
      N.E5, N.A5, N.G5, N.E5, N.A4, N.E5,
      N.C5, N.A4, N.E5, N.G5, N.A5, N.E5,
      N.A4, N.C5, N.E5, N.A5,
    ], vol: 0.02, speed: 4 },
  },

  // ═══════════════════════════════════════════════
  // VOLCANIC CORE — Cm, heavy doom, chromatic
  // BPM 96 → beat = 0.625s
  // Lead: 64 notes = 40s, Bass: 32 notes = 20s, Arp: 18 notes
  // LCM(64,32,18) = 576 beats = 360s = 6 min
  // ═══════════════════════════════════════════════
  'volcanic-core': {
    bpm: 96,
    bass: { wave: 'sawtooth', notes: [
      // Phrase 1 — chromatic descending doom
      N.C3, N.B2, N['Bb2'], N.A2, N['Ab2'], N.G2, N['Ab2'], N['Bb2'],
      // Phrase 2 — rising from depths
      N.C3, N.C3, N['Eb3'], N.F3, N['Eb3'], N.C3, N['Bb2'], N.C3,
      // Phrase 3 — pounding low octaves
      N.C2, N.C3, N.C2, N.C3, N['Bb2'], N['Ab2'], N.G2, N['Ab2'],
      // Phrase 4 — resolution
      N['Bb2'], N.C3, N['Eb3'], N.C3, N['Bb2'], N['Ab2'], N.G2, N.C3,
    ], vol: 0.13 },
    lead: { wave: 'square', vol: 0.06, notes: [
      // A — power 4ths stomping
      N.C4, N.F4, N.C4, N.G3, N['Bb3'], N['Eb4'], N['Bb3'], N.F3,
      N.G3, N.C4, N['Eb4'], N.G4, N.F4, N['Eb4'], N.C4, N.C4,
      // B — menacing ascent
      N['Eb4'], N.F4, N.G4, N['Ab4'], N['Bb4'], N.C5, N['Bb4'], N['Ab4'],
      N.G4, N.F4, N['Eb4'], N.F4, N.G4, N['Ab4'], N.G4, N.F4,
      // C — hammering riff
      N.C4, N.C4, N['Eb4'], N.C4, N.F4, N.F4, N['Eb4'], N.C4,
      N.G4, N.G4, N.F4, N['Eb4'], N.C4, N['Eb4'], N.F4, N.G4,
      // D — final descent into fire
      N.C5, N['Bb4'], N['Ab4'], N.G4, N.F4, N['Eb4'], N.C4, N['Bb3'],
      N['Ab3'], N['Bb3'], N.C4, N['Eb4'], N.C4, N['Bb3'], N.G3, N.C4,
    ] },
    pad: { wave: 'triangle', chords: [
      [N.C3, N['Eb3'], N.G3],     // Cm
      [N['Ab2'], N['Eb3'], N['Ab3']], // Ab
      [N['Bb2'], N.F3, N['Bb3']],    // Bb
      [N.G2, N.D3, N.G3],            // Gm
    ], vol: 0.04, beatsPerChord: 16 },
    arp: { wave: 'sawtooth', notes: [
      N.C5, N.G4, N['Eb5'], N.C5,
      N['Bb4'], N.G4, N.C5, N['Eb5'],
      N.G5, N['Eb5'], N.C5, N.G4,
      N['Eb5'], N.C5, N['Bb4'], N.G4,
      N.C5, N['Eb5'],
    ], vol: 0.02, speed: 2 },
  },

  // ═══════════════════════════════════════════════
  // CYBERPUNK CITY — Em synthwave, fast & electronic
  // BPM 132 → beat = 0.455s
  // Lead: 80 notes = 36.4s, Bass: 36 notes = 16.4s, Arp: 22 notes
  // LCM(80,36,22) = 7920 beats — enormous
  // ═══════════════════════════════════════════════
  'cyberpunk-city': {
    bpm: 132,
    bass: { wave: 'sawtooth', notes: [
      // Phrase 1 — offbeat octave stabs
      N.E2, N.E3, N.E2, N.E3, N.A2, N.A3, N.B2, N.B3,
      // Phrase 2 — moving bassline
      N.E2, N['F#2'], N.G2, N.A2, N.B2, N.A2, N.G2, N['F#2'],
      // Phrase 3 — synth bass riff
      N.E2, N.E3, N.B2, N.E3, N.A2, N.E3, N.G2, N.E3,
      // Phrase 4 — builds to turnaround
      N.A2, N.B2, N.E3, N.B2, N.G2, N.A2, N.B2, N.E3,
      // Extra 4
      N.E2, N.B2, N.E2, N.G2,
    ], vol: 0.11 },
    lead: { wave: 'square', vol: 0.055, notes: [
      // A — synth riff, punchy intervals
      N.B4, N.E5, N.B4, N.G4, N['F#4'], N.B4, N['F#5'], N.E5,
      N.D5, N.B4, N.A4, N.B4, N.E5, N['F#5'], N.E5, N.B4,
      // B — neon arpeggios
      N.E4, N.G4, N.B4, N.E5, N.G5, N.E5, N.B4, N.G4,
      N['F#4'], N.A4, N.B4, N['F#5'], N.E5, N.B4, N.A4, N['F#4'],
      // C — syncopated hook
      N.B4, N.B4, N.E5, N.B4, N['F#5'], N['F#5'], N.E5, N.D5,
      N.B4, N.A4, N.B4, N.D5, N.E5, N.D5, N.B4, N.A4,
      // D — breakdown, sparser
      N.E4, N.E4, N.G4, N.E4, N.B4, N.B4, N.A4, N.G4,
      N['F#4'], N['F#4'], N.A4, N.B4, N.G4, N['F#4'], N.E4, N.G4,
      // E — climactic return
      N.B4, N.E5, N['F#5'], N.G5, N['F#5'], N.E5, N.B4, N.E5,
      N['F#5'], N.E5, N.D5, N.B4, N.A4, N.B4, N.D5, N.E5,
    ] },
    pad: { wave: 'sawtooth', chords: [
      [N.E3, N.G3, N.B3],         // Em — buzzy
      [N.A3, N.C4, N.E4],         // Am
      [N.G3, N.B3, N.D4],         // G
      [N.D3, N['F#3'], N.A3],     // D
    ], vol: 0.018, beatsPerChord: 18 },
    arp: { wave: 'square', notes: [
      N.E5, N.B5, N.E6, N.B5, N.G5, N.B5,
      N.E6, N.G5, N.B5, N.E5, N.G5, N.E6,
      N.B5, N.E5, N['F#5'], N.B5, N.E6, N.B5,
      N.G5, N.E5, N.B5, N.E6,
    ], vol: 0.025, speed: 4 },
  },

  // ═══════════════════════════════════════════════
  // QUANTUM RIFT — Tritone-based, unsettling & glitchy
  // BPM 110 → beat = 0.545s
  // Lead: 64 notes = 34.9s, Bass: 30 notes = 16.4s, Arp: 20 notes
  // LCM(64,30,20) = 960 beats = 523s ≈ 8.7 min
  // ═══════════════════════════════════════════════
  'quantum-rift': {
    bpm: 110,
    bass: { wave: 'sawtooth', notes: [
      // Phrase 1 — tritone oscillation
      N['F#2'], N.C3, N['F#2'], N.C3, N.E2, N['Bb2'], N.E2, N['Bb2'],
      // Phrase 2 — descending tritones
      N.D2, N['Ab2'], N.C2, N['F#2'], N.E2, N['Bb2'], N.D2, N['Ab2'],
      // Phrase 3 — crawling chromatic
      N['F#2'], N.G2, N['Ab2'], N.A2, N['Bb2'], N.B2, N.C3, N['C#3'],
      // Extra 6 — unstable
      N.D3, N['Ab2'], N.E2, N['Bb2'], N['F#2'], N.C3,
    ], vol: 0.11 },
    lead: { wave: 'triangle', vol: 0.055, notes: [
      // A — tritone leaps, jarring
      N['C#5'], N.G4, N['C#5'], N.G5, N['F#4'], N.C5, N['F#4'], N.C4,
      N.E4, N['Bb4'], N.E5, N['Bb4'], N['F#4'], N.G4, N['F#4'], N.E4,
      // B — chromatic crawl
      N.E4, N.F4, N['F#4'], N.G4, N['Ab4'], N.A4, N['Bb4'], N.B4,
      N.C5, N['C#5'], N.C5, N.B4, N['Bb4'], N.A4, N['Ab4'], N.G4,
      // C — angular, unpredictable
      N['F#4'], N.C5, N.E4, N['Bb4'], N.G4, N['C#5'], N['F#4'], N.D5,
      N.C5, N['F#4'], N['Bb4'], N.E4, N.G4, N.C5, N['F#5'], N.C5,
      // D — dissonant resolution
      N.G4, N['C#5'], N.G4, N['F#4'], N.C5, N['F#4'], N.E4, N['Bb4'],
      N.E4, N['F#4'], N.G4, N.C5, N['F#4'], N.C5, N.G4, N['F#4'],
    ] },
    pad: { wave: 'sine', chords: [
      [N['F#3'], N.C4, N.E4],     // diminished feel
      [N.E3, N['Bb3'], N['D#4']], // tritone cluster
      [N['Ab3'], N.D4, N.G4],     // another tritone
      [N.C3, N['F#3'], N.B3],     // yet another
    ], vol: 0.04, beatsPerChord: 15 },
    arp: { wave: 'triangle', notes: [
      N['F#5'], N.C6, N.G5, N['C#5'], N.G5, N.C6,
      N['Bb5'], N.E5, N['Bb5'], N['F#5'], N.C6, N['F#5'],
      N.E5, N['Bb5'], N['F#5'], N.C6, N.G5, N['C#5'],
      N.G5, N.C6,
    ], vol: 0.025, speed: 3 },
  },
};

class MusicTrack {
  constructor(ctx, musicGain, trackDef) {
    this.ctx = ctx;
    this.musicGain = musicGain;
    this.def = trackDef;
    this.playing = false;
    this.nodes = [];
    this.timers = [];
    this.trackGain = ctx.createGain();
    this.trackGain.gain.value = 0;
    this.trackGain.connect(musicGain);
  }

  start() {
    if (this.playing) return;
    this.playing = true;

    const bpm = this.def.bpm;
    const beatLen = 60 / bpm;

    // Fade in
    this.trackGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.trackGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 2);

    // Start all layers
    this._startBass(beatLen);
    this._startLead(beatLen);
    this._startPad(beatLen);
    this._startArp(beatLen);
  }

  _createOsc(wave, freq, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain);
    gain.connect(this.trackGain);
    osc.start();
    this.nodes.push({ osc, gain });
    return { osc, gain };
  }

  _startBass(beatLen) {
    const { wave, notes, vol } = this.def.bass;
    const { osc, gain } = this._createOsc(wave, notes[0], vol);
    let idx = 0;
    const step = () => {
      if (!this.playing) return;
      osc.frequency.setTargetAtTime(notes[idx % notes.length], this.ctx.currentTime, 0.05);
      idx++;
      this.timers.push(setTimeout(step, beatLen * 1000));
    };
    step();
  }

  _startLead(beatLen) {
    const def = this.def.lead;
    const notes = def.notes;
    const vol = def.vol;
    const speed = def.speed || 1;
    const interval = (beatLen / speed) * 1000;
    const { osc, gain } = this._createOsc(def.wave, notes[0], vol);
    let idx = 0;
    const step = () => {
      if (!this.playing) return;
      const freq = notes[idx % notes.length];
      osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);
      // Slight volume pulse for rhythm
      gain.gain.setTargetAtTime(vol * 1.2, this.ctx.currentTime, 0.01);
      gain.gain.setTargetAtTime(vol * 0.7, this.ctx.currentTime + beatLen * 0.3, 0.05);
      idx++;
      this.timers.push(setTimeout(step, interval));
    };
    step();
  }

  _startPad(beatLen) {
    const padDef = this.def.pad;

    // New format: chords array with cycling
    if (padDef.chords) {
      const chords = padDef.chords;
      const vol = padDef.vol;
      const beatsPerChord = padDef.beatsPerChord || 16;
      const intervalMs = beatsPerChord * beatLen * 1000;
      const voiceCount = chords[0].length;

      // Create oscillators for each voice in the chord
      const voices = [];
      for (let v = 0; v < voiceCount; v++) {
        voices.push(this._createOsc(padDef.wave, chords[0][v], vol));
      }

      let chordIdx = 0;
      const changeChord = () => {
        if (!this.playing) return;
        chordIdx = (chordIdx + 1) % chords.length;
        const chord = chords[chordIdx];
        for (let v = 0; v < voiceCount && v < chord.length; v++) {
          voices[v].osc.frequency.setTargetAtTime(chord[v], this.ctx.currentTime, 0.3);
        }
        this.timers.push(setTimeout(changeChord, intervalMs));
      };
      this.timers.push(setTimeout(changeChord, intervalMs));
    } else {
      // Legacy format: static chord from notes array
      for (const freq of padDef.notes) {
        this._createOsc(padDef.wave, freq, padDef.vol);
      }
    }
  }

  _startArp(beatLen) {
    if (!this.def.arp) return;
    const { wave, notes, vol, speed } = this.def.arp;
    const { osc, gain } = this._createOsc(wave, notes[0], vol);
    const interval = (beatLen / (speed || 2)) * 1000;
    let idx = 0;
    const step = () => {
      if (!this.playing) return;
      const freq = notes[idx % notes.length];
      osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.005);
      // Sharp attack/decay for arp feel
      gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.005);
      gain.gain.setTargetAtTime(vol * 0.3, this.ctx.currentTime + interval / 2000, 0.02);
      idx++;
      this.timers.push(setTimeout(step, interval));
    };
    step();
  }

  stop(fadeTime = 1.5) {
    this.playing = false;
    // Clear all timers
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];

    // Fade out then disconnect
    const now = this.ctx.currentTime;
    this.trackGain.gain.setValueAtTime(this.trackGain.gain.value, now);
    this.trackGain.gain.linearRampToValueAtTime(0, now + fadeTime);

    setTimeout(() => {
      for (const { osc } of this.nodes) {
        try { osc.stop(); } catch (e) { /* already stopped */ }
      }
      this.nodes = [];
      try { this.trackGain.disconnect(); } catch (e) { /* ok */ }
    }, fadeTime * 1000 + 100);
  }
}

/**
 * Start playing music for a map. Handles crossfade if changing maps.
 */
export function startMapMusic(mapId) {
  if (mapId === currentMapId && currentTrack?.playing) return;

  // Stop current track
  if (currentTrack) {
    currentTrack.stop(1.0);
    currentTrack = null;
  }

  const trackDef = MAP_TRACKS[mapId];
  if (!trackDef) {
    currentMapId = null;
    return;
  }

  try {
    const { ctx, music } = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    currentTrack = new MusicTrack(ctx, music, trackDef);
    currentMapId = mapId;

    // Slight delay for crossfade
    setTimeout(() => {
      if (currentTrack && currentMapId === mapId) {
        currentTrack.start();
      }
    }, 200);
  } catch (e) {
    console.warn('[MUSIC] Failed to start:', e);
  }
}

/**
 * Stop all music with fade out.
 */
export function stopMusic(fadeTime = 1.5) {
  if (currentTrack) {
    currentTrack.stop(fadeTime);
    currentTrack = null;
  }
  currentMapId = null;
}

/**
 * Check if music is currently playing.
 */
export function isMusicPlaying() {
  return currentTrack?.playing || false;
}
