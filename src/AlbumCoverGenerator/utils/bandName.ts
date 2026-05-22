// Offline fallback band-name + title generator. Used when chat API is
// unavailable (standalone GitHub Pages preview, network failure, etc.).
// Same generator can produce album titles too, just with different
// vocabulary mixes — but we keep it tight and let the chat API do the
// heavy lifting.

const ADJ = [
  'Faded', 'Soft', 'Slow', 'Lonely', 'Sunlit', 'Burnt', 'Quiet', 'Pale',
  'Glassy', 'Plastic', 'Empty', 'Cheap', 'Wet', 'Distant', 'Tender',
  'Static', 'Velvet', 'Salt', 'Cold', 'Heavy', 'Lazy', 'Worn',
];

const NOUN = [
  'Garden', 'Phone', 'Tape', 'Light', 'Window', 'Train', 'Letter', 'Room',
  'Coat', 'Hour', 'Mouth', 'Map', 'Bed', 'Bus', 'Pool', 'Boy', 'Girl',
  'Friend', 'Halo', 'Shape', 'Hum', 'Field',
];

const PLURALS = [
  'Bones', 'Stations', 'Postcards', 'Cigarettes', 'Mirrors',
  'Pigeons', 'Lakes', 'Ribbons', 'Phantoms', 'Hours',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomBandName(words?: readonly string[]): string {
  const r = Math.random();
  if (r < 0.25) return `The ${pick(PLURALS)}`;
  if (r < 0.45) return `${pick(ADJ)} ${pick(NOUN)}`;
  if (r < 0.65) return `${pick(NOUN)} & ${pick(NOUN)}`;
  if (r < 0.8) return pick(PLURALS);
  // Optionally bend in a user word.
  if (words && words[0]) {
    const seed = words[Math.floor(Math.random() * words.length)] || '';
    const cap = seed.charAt(0).toUpperCase() + seed.slice(1).toLowerCase();
    if (Math.random() < 0.5) return `${cap} ${pick(NOUN)}`;
    return `${pick(ADJ)} ${cap}`;
  }
  return `${pick(ADJ)} ${pick(NOUN)}`;
}

export function defaultTitle(words: readonly string[]): string {
  const w = words.filter(Boolean);
  if (w.length === 0) return 'Untitled';
  if (w.length === 1) return cap(w[0]);
  return w.map(cap).join(' · ');
}

function cap(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
