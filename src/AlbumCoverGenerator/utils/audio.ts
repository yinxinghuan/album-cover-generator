// WebAudio for Album Cover Generator.
//
// Aesthetic: a near-silent indie record-shop in the rain.
//   - Ambient: very faint vinyl crackle that breathes in and out, plus a
//     warm low pad that wells up once every 12-24s and fades to silence.
//   - Press: a soft record-needle-drop click.
//   - Reveal: a sustained shoegaze-style pad chord.
//
// Init only on first pointerdown (Aigram preloads games; mount-time audio
// leaks into the previous game). startAmbient() is idempotent.

let ctx: AudioContext | null = null;
let ambientStarted = false;
let ambientStopRequested = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    } catch {
      return null;
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ---------- One-shots ----------

export function playNeedleDrop(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // 80ms-long broad-band click, low-passed and slightly resonant — the
  // pop of a needle landing on the lead-in groove.
  const bufSize = Math.floor(ac.sampleRate * 0.12);
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    const t = i / bufSize;
    d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28);
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1800;
  lp.Q.value = 0.7;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.55, now);
  src.connect(lp).connect(g).connect(ac.destination);
  src.start(now);

  // Tiny low thump under the click.
  const o = ac.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(120, now);
  o.frequency.exponentialRampToValueAtTime(45, now + 0.16);
  const og = ac.createGain();
  og.gain.setValueAtTime(0.2, now);
  og.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  o.connect(og).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.25);
}

export function playRevealChord(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  // A washed-out major-7 pad. Detuned sines + slow attack.
  // Root: A3 (220Hz). Voicing: A C# E G# (1 3 5 7).
  const notes = [220, 277.18, 329.63, 415.30];

  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 2.4);
  master.gain.setValueAtTime(0.16, now + 4.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);
  // Soft low-pass to keep it warm.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  lp.Q.value = 0.7;
  master.connect(lp).connect(ac.destination);

  notes.forEach((freq, i) => {
    [-3, 0, 3].forEach((cents) => {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * Math.pow(2, cents / 1200);
      const g = ac.createGain();
      g.gain.value = (1 - i * 0.18) * 0.33;
      o.connect(g).connect(master);
      o.start(now + i * 0.18);
      o.stop(now + 8.7);
    });
  });
}

export function playClick(): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(880, now);
  o.frequency.exponentialRampToValueAtTime(440, now + 0.08);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  o.connect(g).connect(ac.destination);
  o.start(now);
  o.stop(now + 0.2);
}

// ---------- Ambient: breathing vinyl crackle + occasional warm pad ----------

function makeCrackle(ac: AudioContext): { gain: GainNode; stop: () => void } {
  // Sparse impulse train through a band-pass — characteristic vinyl crackle.
  const bufSize = 4 * ac.sampleRate;
  const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    // Random spikes ~12/sec on top of pink-ish hush.
    const hush = (Math.random() * 2 - 1) * 0.08;
    const spike = Math.random() < 0.0004 ? (Math.random() * 2 - 1) : 0;
    d[i] = hush + spike;
  }
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 2400;
  bp.Q.value = 0.7;
  const gain = ac.createGain();
  gain.gain.value = 0;
  src.connect(bp).connect(gain).connect(ac.destination);
  src.start();
  return {
    gain,
    stop: () => {
      try { src.stop(); } catch { /* already stopped */ }
    },
  };
}

function playWarmSwell(ac: AudioContext): void {
  const now = ac.currentTime;
  // Single low fifth — A2 + E3.
  const freqs = [110, 164.81];
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.04, now + 3.5);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 9);
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  master.connect(lp).connect(ac.destination);
  freqs.forEach((freq, i) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ac.createGain();
    g.gain.value = 1 - i * 0.3;
    o.connect(g).connect(master);
    o.start(now);
    o.stop(now + 9.2);
  });
}

async function ambientLoop(ac: AudioContext): Promise<void> {
  const crackle = makeCrackle(ac);
  let crackleRunning = true;

  // Breathing crackle envelope: rise / hold / fall / silence.
  (async () => {
    while (crackleRunning && !ambientStopRequested) {
      const rise = rand(5, 8);
      const hold = rand(8, 16);
      const fall = rand(6, 10);
      const silence = rand(7, 16);
      const peak = rand(0.05, 0.09);

      const start = ac.currentTime;
      crackle.gain.gain.cancelScheduledValues(start);
      crackle.gain.gain.setValueAtTime(0.0001, start);
      crackle.gain.gain.exponentialRampToValueAtTime(peak, start + rise);
      crackle.gain.gain.setValueAtTime(peak, start + rise + hold);
      crackle.gain.gain.exponentialRampToValueAtTime(0.0001, start + rise + hold + fall);
      await new Promise<void>(r => setTimeout(r, (rise + hold + fall + silence) * 1000));
    }
  })();

  // Warm pad scheduler — sparse, never overlapping with itself.
  while (!ambientStopRequested) {
    const gap = rand(14, 24);
    await new Promise<void>(r => setTimeout(r, gap * 1000));
    if (ambientStopRequested) break;
    playWarmSwell(ac);
  }

  crackleRunning = false;
  crackle.stop();
}

export function startAmbient(): void {
  if (ambientStarted) return;
  const ac = getCtx();
  if (!ac) return;
  ambientStarted = true;
  ambientStopRequested = false;
  ambientLoop(ac);
}

export function stopAmbient(): void {
  ambientStopRequested = true;
  ambientStarted = false;
}
