// Music: chat generates a MusicSpec (BPM, key, chords, instrument tones);
// this module synthesizes that spec into a loopable track via Web Audio.
//
// Each 8-bar loop = 4 chords × 2 bars. Pad voice plays the chord, bass
// plays the root an octave down, optional drum hits the downbeat. The
// scheduler queues one loop ahead and refills as it runs out.

import type {
  BassTone, DrumTone, MusicSpec, PadTone,
} from '../types';

// ───────────────────── Chat system prompt ─────────────────────

export const MUSIC_GEN_SYSTEM = `You are a music director for an indie album-cover game.

Given the album's three theme words, band name, title, and cover style ("shoegaze" = dream-pop / "xerox" = lo-fi post-punk), output a SINGLE JSON object specifying a short loopable musical sketch.

Required fields:
- bpm:    integer 60-130
- key:    e.g. "C", "F#m", "Dm" (suffix "m" for minor)
- chords: 4 chord names, each in the same notation; one chord per 2 bars
- mood:   2-4 word free description
- pad:    "warm" | "icy" | "crunchy"
- bass:   "sub" | "plucked" | "fuzz"
- drum:   "soft" | "kick" | "none"

Pick instruments that match the cover style — shoegaze → warm + sub + soft; xerox → crunchy + fuzz + kick. Pick chords that evoke the words.

Output ONLY the JSON object. No markdown fences, no commentary, no trailing text.`;

// ───────────────────── Chord parsing ─────────────────────

const NOTE_TO_PITCH_CLASS: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
};

interface ParsedChord {
  rootMidi: number;    // MIDI note number of root in middle octave
  isMinor:  boolean;
  hasSeventh: boolean;
}

function parseChord(name: string): ParsedChord {
  const m = /^([A-G][#b]?)(m|maj|min)?(7|maj7|m7)?/i.exec(name.trim());
  if (!m) return { rootMidi: 60, isMinor: false, hasSeventh: false };
  const pc = NOTE_TO_PITCH_CLASS[m[1].toUpperCase().replace('B', 'b').replace(/^([A-G])/, c => c.toUpperCase())] ?? 0;
  // Anchor middle C = 60. Place root around C4-B4 by adding 60.
  const rootMidi = 60 + pc;
  const isMinor = /^m/i.test(m[2] ?? '') || /^m/i.test(m[3] ?? '');
  const hasSeventh = !!m[3];
  return { rootMidi, isMinor, hasSeventh };
}

function chordNotes(chord: string): number[] {
  const { rootMidi, isMinor, hasSeventh } = parseChord(chord);
  const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];
  if (hasSeventh) intervals.push(isMinor ? 10 : 11);
  return intervals.map(i => rootMidi + i);
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ───────────────────── Synthesis voices ─────────────────────

function padVoice(
  ac: AudioContext, master: AudioNode,
  freq: number, t0: number, dur: number, gain: number, tone: PadTone,
) {
  // Stack of detuned sine voices, swelling attack, long release.
  const partials = tone === 'warm'
    ? [0, -7, 12]                  // bass-heavy triad-ish stack
    : tone === 'icy'
    ? [0, 7, 12, 19]               // bright cathedral
    : [-12, 0, 0.13, 7];           // crunchy: slight beating + detune

  const env = ac.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 0.8);
  env.gain.setValueAtTime(gain, t0 + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
  env.connect(master);

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = tone === 'icy' ? 4800 : tone === 'crunchy' ? 1400 : 2400;
  lp.Q.value = 0.5;
  lp.connect(env);

  partials.forEach((semis, i) => {
    const o = ac.createOscillator();
    o.type = tone === 'crunchy' ? 'sawtooth' : 'sine';
    o.frequency.value = freq * Math.pow(2, semis / 12);
    const g = ac.createGain();
    g.gain.value = 1 / (i + 1.4);
    o.connect(g).connect(lp);
    o.start(t0);
    o.stop(t0 + dur + 0.6);
  });
}

function bassVoice(
  ac: AudioContext, master: AudioNode,
  rootMidi: number, t0: number, dur: number, tone: BassTone,
) {
  const freq = midiToHz(rootMidi - 24); // 2 octaves down for bass
  const o = ac.createOscillator();
  o.type = tone === 'fuzz' ? 'sawtooth' : tone === 'plucked' ? 'triangle' : 'sine';
  o.frequency.value = freq;

  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = tone === 'fuzz' ? 900 : tone === 'plucked' ? 1500 : 350;
  lp.Q.value = tone === 'fuzz' ? 6 : 2;

  const env = ac.createGain();
  if (tone === 'plucked') {
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(0.45, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  } else {
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(tone === 'fuzz' ? 0.22 : 0.30, t0 + 0.04);
    env.gain.setValueAtTime(tone === 'fuzz' ? 0.22 : 0.30, t0 + dur - 0.1);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
  }

  o.connect(lp).connect(env).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.1);
}

function drumHit(
  ac: AudioContext, master: AudioNode,
  t0: number, tone: DrumTone, type: 'kick' | 'hat',
) {
  if (tone === 'none') return;
  if (type === 'kick') {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t0);
    o.frequency.exponentialRampToValueAtTime(42, t0 + 0.18);
    const g = ac.createGain();
    const peak = tone === 'kick' ? 0.6 : 0.32;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + 0.22);
  } else {
    // hat — short noise burst
    const bufSize = Math.floor(ac.sampleRate * 0.06);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufSize * 18);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;
    const g = ac.createGain();
    g.gain.value = tone === 'kick' ? 0.16 : 0.10;
    src.connect(hp).connect(g).connect(master);
    src.start(t0);
  }
}

// ───────────────────── Loop scheduler ─────────────────────

export interface MusicHandle {
  stop: () => void;
}

export function playMusic(spec: MusicSpec): MusicHandle {
  const C = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!C) return { stop: () => {} };
  const ac: AudioContext = new C();
  if (ac.state === 'suspended') ac.resume().catch(() => {});

  // A reverb-ish softening: send everything through a long-ish low-pass +
  // master gain. Real convolver would be nicer; this stays cheap.
  const master = ac.createGain();
  master.gain.value = 0.22;
  master.connect(ac.destination);

  const beatDur = 60 / Math.max(40, Math.min(180, spec.bpm));
  const chordDur = 8 * beatDur;       // 2 bars per chord, 4/4
  const loopDur = 4 * chordDur;       // full 8-bar loop

  let stopped = false;
  let nextLoopStart = ac.currentTime + 0.1;

  function scheduleOne(startAt: number) {
    spec.chords.forEach((chord, ci) => {
      const t0 = startAt + ci * chordDur;
      const notes = chordNotes(chord);
      // Pad: chord notes one octave up for shimmer.
      notes.forEach((midi, ni) => {
        padVoice(ac, master, midiToHz(midi + 12),
          t0 + ni * 0.04, chordDur, 0.10, spec.pad);
      });
      // Bass: root every half bar (every 4 beats)
      for (let b = 0; b < 8; b += 4) {
        bassVoice(ac, master, notes[0], t0 + b * beatDur,
          4 * beatDur, spec.bass);
      }
      // Drum pattern
      if (spec.drum !== 'none') {
        for (let b = 0; b < 8; b++) {
          if (b === 0 || b === 4) drumHit(ac, master, t0 + b * beatDur, spec.drum, 'kick');
          if (b === 2 || b === 6) drumHit(ac, master, t0 + b * beatDur, spec.drum, 'hat');
        }
      }
    });
  }

  // Pre-schedule first loop, then re-queue at the boundary.
  scheduleOne(nextLoopStart);
  nextLoopStart += loopDur;

  const tick = setInterval(() => {
    if (stopped) return;
    if (ac.currentTime + 1 >= nextLoopStart) {
      scheduleOne(nextLoopStart);
      nextLoopStart += loopDur;
    }
  }, 250);

  return {
    stop: () => {
      stopped = true;
      clearInterval(tick);
      // Soft fade then close
      try {
        master.gain.linearRampToValueAtTime(0, ac.currentTime + 0.4);
        setTimeout(() => ac.close().catch(() => {}), 500);
      } catch { /* ignore */ }
    },
  };
}

// ───────────────────── Spec validation/fallback ─────────────────────

const FALLBACK_SPEC: MusicSpec = {
  bpm: 84,
  key: 'F#m',
  chords: ['F#m', 'D', 'A', 'E'],
  mood: 'wistful loop',
  pad: 'warm',
  bass: 'sub',
  drum: 'soft',
};

/** Parse a chat response into a MusicSpec. Tolerates code fences and
 *  prose; falls back to a default sketch if invalid. */
export function parseMusicSpec(raw: string): MusicSpec {
  if (!raw) return FALLBACK_SPEC;
  // Extract first JSON object from response
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return FALLBACK_SPEC;
  try {
    const obj = JSON.parse(match[0]);
    const chords = Array.isArray(obj.chords) ? obj.chords.slice(0, 4) : [];
    while (chords.length < 4) chords.push(chords[chords.length - 1] ?? 'Am');
    return {
      bpm:    Math.max(40, Math.min(180, Number(obj.bpm) || 84)),
      key:    String(obj.key || 'Am'),
      chords: chords as MusicSpec['chords'],
      mood:   String(obj.mood || 'loop'),
      pad:    (['warm','icy','crunchy'] as const).includes(obj.pad)  ? obj.pad  : 'warm',
      bass:   (['sub','plucked','fuzz']  as const).includes(obj.bass) ? obj.bass : 'sub',
      drum:   (['soft','kick','none']    as const).includes(obj.drum) ? obj.drum : 'soft',
    };
  } catch {
    return FALLBACK_SPEC;
  }
}
