// Helpers to make the LP-back-sleeve typography feel real:
// deterministic-from-input track timings, catalog numbers, and a per-album
// 12-digit barcode-like string.

function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** "M:SS" — between 2:18 and 6:45. Deterministic from a word. */
export function trackTime(word: string): string {
  const h = hash(word || 'untitled');
  const totalSec = 138 + (h % 267); // 138–404s → 2:18 to ~6:44
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "ALT-024" — 3-digit catalog number, monotonically growing with discography. */
export function catalogNumber(pressed: number): string {
  const n = Math.max(1, pressed + 1);
  return `ALT-${String(n).padStart(3, '0')}`;
}

/** A 12-digit pseudo-UPC. Deterministic per album. */
export function barcode(seed: string): string {
  let h = hash(seed);
  const digits: string[] = [];
  for (let i = 0; i < 12; i++) {
    digits.push(String(h % 10));
    h = Math.floor(h / 10) || hash(String(h));
  }
  return digits.join('');
}

/** Heuristic genre tag based on the cover style. */
export function genreFor(style: 'shoegaze' | 'xerox'): string {
  return style === 'shoegaze' ? 'shoegaze · dream-pop' : 'post-punk · lo-fi';
}
