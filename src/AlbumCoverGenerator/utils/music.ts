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

export const MUSIC_GEN_SYSTEM = `You are a music director for an album-cover game spanning many genres (indie, electronic, metal, hip-hop, classical, ambient, dub, country, k-pop, jazz, etc.).

Given the album's three theme words, band name, title, and cover style slug (e.g. "shoegaze", "death-metal", "vaporwave", "minimal-techno", "reggae-dub", "ambient-newage", "boom-bap-hiphop", "classical", "k-pop", "synthwave", "psych-folk", "industrial", "no-wave"), output a SINGLE JSON object specifying a short loopable musical sketch.

Required fields:
- bpm:    integer 50-180 — slow for ambient/doom/dub (50-80), mid for indie/hiphop/jazz (75-100), faster for techno/punk/k-pop (110-140), very fast for hardcore/dnb (150-180)
- key:    e.g. "C", "F#m", "Dm" (suffix "m" for minor)
- chords: 4 chord names, each in the same notation; one chord per 2 bars
- mood:   2-4 word free description
- pad:    "warm" | "icy" | "crunchy" | "bell" | "breath"
- bass:   "sub" | "plucked" | "fuzz" | "upright" | "acid"
- drum:   "soft" | "kick" | "none" | "punk" | "dub"

Tone hints — pick the pair that fits the genre:
- shoegaze / dream-pop  → warm + sub + soft
- post-punk / xerox     → crunchy + fuzz + kick
- death-metal / doom    → crunchy + fuzz + punk
- ambient / new-age     → breath + sub + none
- vaporwave / synthwave → icy + sub + soft
- lo-fi / boom-bap      → bell + upright + kick
- jazz / classical      → bell + upright + none
- minimal-techno / acid → icy + acid + punk
- reggae-dub            → warm + sub + dub
- k-pop / indie-pop     → bell + plucked + kick
- psych-folk / country  → warm + plucked + soft
- industrial / no-wave  → crunchy + acid + punk

Pick chords that evoke the three words (e.g. dark/minor for "bone shadow grave", bright/major-7 for "honey sun lake"). For doom/death metal use power-chord roots; for jazz use 7th chords; for techno keep harmony static (1 chord repeated or pedal).

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
  if (tone === 'bell') return padBell(ac, master, freq, t0, dur, gain);
  if (tone === 'breath') return padBreath(ac, master, freq, t0, dur, gain);

  // warm / icy / crunchy — stack of detuned sine/saw voices.
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

// Bell pad: struck attack + exponential decay, classic bell partials
// (root + 2 octaves + octave-fifth). Reads as celeste / glockenspiel,
// great for lo-fi, classical, k-pop, dream-pop.
function padBell(
  ac: AudioContext, master: AudioNode,
  freq: number, t0: number, dur: number, gain: number,
) {
  const partials = [{ s: 0, w: 1.0 }, { s: 12, w: 0.55 }, { s: 19, w: 0.35 }];
  const tail = Math.min(dur + 0.5, 3.2);
  const env = ac.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain * 1.5, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + tail);
  env.connect(master);
  for (const p of partials) {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * Math.pow(2, p.s / 12);
    const g = ac.createGain();
    g.gain.value = p.w;
    o.connect(g).connect(env);
    o.start(t0);
    o.stop(t0 + tail + 0.1);
  }
}

// Breath pad: very slow attack and release, sine + band-passed noise.
// Reads as ambient / new-age / dub-airy texture.
function padBreath(
  ac: AudioContext, master: AudioNode,
  freq: number, t0: number, dur: number, gain: number,
) {
  const env = ac.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + 1.4);
  env.gain.setValueAtTime(gain, t0 + dur * 0.55);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 1.4);
  env.connect(master);

  const sine = ac.createOscillator();
  sine.type = 'sine';
  sine.frequency.value = freq;
  const sineGain = ac.createGain();
  sineGain.gain.value = 0.55;
  sine.connect(sineGain).connect(env);
  sine.start(t0);
  sine.stop(t0 + dur + 1.6);

  // Pitched noise band around 4× the fundamental for an airy whoosh.
  const bufSize = Math.floor(ac.sampleRate * (dur + 1.6));
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = Math.min(freq * 4, 6000);
  bp.Q.value = 4;
  const noiseGain = ac.createGain();
  noiseGain.gain.value = 0.22;
  noise.connect(bp).connect(noiseGain).connect(env);
  noise.start(t0);
  noise.stop(t0 + dur + 1.6);
}

function bassVoice(
  ac: AudioContext, master: AudioNode,
  rootMidi: number, t0: number, dur: number, tone: BassTone,
) {
  if (tone === 'upright') return bassUpright(ac, master, rootMidi, t0, dur);
  if (tone === 'acid') return bassAcid(ac, master, rootMidi, t0, dur);

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

// Upright bass: triangle through a body-resonance band-pass. Plucky
// attack, fast decay to soft sustain. Fits jazz, lo-fi, country.
function bassUpright(
  ac: AudioContext, master: AudioNode,
  rootMidi: number, t0: number, dur: number,
) {
  const freq = midiToHz(rootMidi - 24);
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 240;
  bp.Q.value = 1.4;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(0.55, t0 + 0.012);
  env.gain.exponentialRampToValueAtTime(0.10, t0 + 0.38);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(bp).connect(env).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.1);
}

// Acid bass: square wave through resonant low-pass with an envelope on
// cutoff frequency. 303-flavored squelch for techno / industrial.
function bassAcid(
  ac: AudioContext, master: AudioNode,
  rootMidi: number, t0: number, dur: number,
) {
  // One octave down only — keeps the bite of the 303 register.
  const freq = midiToHz(rootMidi - 12);
  const o = ac.createOscillator();
  o.type = 'square';
  o.frequency.value = freq;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.Q.value = 12;
  lp.frequency.setValueAtTime(2600, t0);
  lp.frequency.exponentialRampToValueAtTime(260, t0 + Math.min(dur * 0.5, 0.45));
  const env = ac.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(0.22, t0 + 0.01);
  env.gain.setValueAtTime(0.22, t0 + dur * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
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
    // dub kick = deeper + longer tail; punk kick = harder/tighter
    const startFreq = tone === 'dub' ? 110 : tone === 'punk' ? 155 : 140;
    const endFreq   = tone === 'dub' ? 35  : tone === 'punk' ? 50  : 42;
    const decay     = tone === 'dub' ? 0.36 : tone === 'punk' ? 0.13 : 0.18;
    const peak      = tone === 'kick' ? 0.60
                   :  tone === 'punk' ? 0.70
                   :  tone === 'dub'  ? 0.55
                   :                    0.32;   // soft
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(startFreq, t0);
    o.frequency.exponentialRampToValueAtTime(endFreq, t0 + decay);
    const g = ac.createGain();
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + decay + 0.05);
  } else {
    // hat — noise burst whose character varies by drum tone.
    // dub hat decays slower (cymbal-ish), punk hat is bright + tight.
    const dur       = tone === 'dub' ? 0.18 : tone === 'punk' ? 0.045 : 0.06;
    const decayRate = tone === 'dub' ? 6    : tone === 'punk' ? 24    : 18;
    const hpHz      = tone === 'dub' ? 3000 : 6000;
    const peak      = tone === 'punk' ? 0.18
                   :  tone === 'dub'  ? 0.14
                   :  tone === 'kick' ? 0.16
                   :                    0.10;   // soft
    const bufSize = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufSize * decayRate);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = hpHz;
    const g = ac.createGain();
    g.gain.value = peak;
    src.connect(hp).connect(g).connect(master);
    src.start(t0);
  }
}

// Per-tone groove: which beats in an 8-step chord (b = quarter notes,
// 0..7 across 2 bars of 4/4) get a kick or hat hit.
function drumPattern(tone: DrumTone): Array<{ b: number; type: 'kick' | 'hat' }> {
  switch (tone) {
    case 'none':
      return [];
    case 'punk':
      // Driving 4-on-the-floor + offbeat hats.
      return [
        { b: 0, type: 'kick' }, { b: 1, type: 'hat' },
        { b: 2, type: 'kick' }, { b: 3, type: 'hat' },
        { b: 4, type: 'kick' }, { b: 5, type: 'hat' },
        { b: 6, type: 'kick' }, { b: 7, type: 'hat' },
      ];
    case 'dub':
      // Sparse — one kick per bar plus a half-bar accent. Leaves space
      // for the reverb tail (faked here by the longer hat decay).
      return [
        { b: 0, type: 'kick' }, { b: 2, type: 'hat' },
        { b: 4, type: 'kick' }, { b: 6, type: 'hat' },
      ];
    case 'soft':
    case 'kick':
    default:
      // Original half-time feel: kick on beat 1 of each bar, hat on 3.
      return [
        { b: 0, type: 'kick' }, { b: 2, type: 'hat' },
        { b: 4, type: 'kick' }, { b: 6, type: 'hat' },
      ];
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
      // Drum pattern — varies per drum tone (see drumPattern).
      const pattern = drumPattern(spec.drum);
      for (const hit of pattern) {
        drumHit(ac, master, t0 + hit.b * beatDur, spec.drum, hit.type);
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
      pad:    (['warm','icy','crunchy','bell','breath'] as const).includes(obj.pad)  ? obj.pad  : 'warm',
      bass:   (['sub','plucked','fuzz','upright','acid'] as const).includes(obj.bass) ? obj.bass : 'sub',
      drum:   (['soft','kick','none','punk','dub']       as const).includes(obj.drum) ? obj.drum : 'soft',
    };
  } catch {
    return FALLBACK_SPEC;
  }
}
