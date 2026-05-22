import type { VinylColor, VinylDesign, VinylFinish } from '../types';

// Weighted color distribution. Black is the modal pick but rebalanced
// so every pressing carries real gacha-pull surprise potential.
const COLORS: Array<[VinylColor, number]> = [
  ['black',    22],
  ['orange',   11],
  ['bone',      9],
  ['oxblood',   9],
  ['cobalt',    8],
  ['emerald',   7],
  ['fuchsia',   7],
  ['amber',     7],
  ['violet',    6],
  ['mint',      6],
  ['frosted',   8],
];

// Finishes — opaque is still the modal pick; everything else is a "limited
// edition" with its own weight.
const FINISHES: Array<[VinylFinish, number]> = [
  ['opaque',      38],
  ['translucent', 14],
  ['marbled',      9],
  ['splatter',     8],
  ['half',         6],
  ['swirl',        5],
  ['galaxy',       5],
  ['stripes',      5],
  ['glitter',      4],
  ['drip',         3],
  ['flame',        3],
];

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

function weightedPick<T>(buckets: Array<[T, number]>, ticket: number): T {
  const total = buckets.reduce((a, [, w]) => a + w, 0);
  let r = ticket % total;
  for (const [val, w] of buckets) {
    if (r < w) return val;
    r -= w;
  }
  return buckets[0][0];
}

// Label art rolls: 'text' is the standard ALTERU printed label.
// 'logo' is the rarer one-glyph mark, like a limited-edition pressing.
const LABEL_ARTS: Array<[import('../types').LabelArt, number]> = [
  ['text', 75],
  ['logo', 25],
];

/** Roll a deterministic vinyl design from an album seed (typically album.id). */
export function vinylFor(seed: string): VinylDesign {
  // Use distinct hashes so traits are uncorrelated.
  return {
    color:    weightedPick(COLORS,      djb2(`color:${seed}`)),
    finish:   weightedPick(FINISHES,    djb2(`finish:${seed}`)),
    labelArt: weightedPick(LABEL_ARTS,  djb2(`label:${seed}`)),
  };
}

/** Human-readable name — used in the cover panel / wall meta. */
export function vinylDesignLabel(v: VinylDesign): string {
  const colorName: Record<VinylColor, string> = {
    black: 'Classic Black',
    orange: 'AlterU Orange',
    bone: 'Bone',
    oxblood: 'Oxblood',
    cobalt: 'Cobalt Blue',
    emerald: 'Emerald',
    fuchsia: 'Fuchsia',
    amber: 'Amber',
    violet: 'Violet',
    mint: 'Mint',
    frosted: 'Frosted Clear',
  };
  const finishMod: Record<VinylFinish, string> = {
    opaque: '',
    translucent: ' · translucent',
    marbled: ' · marbled',
    splatter: ' · splatter',
    half: ' · half-split',
    swirl: ' · swirl',
    galaxy: ' · galaxy',
    stripes: ' · stripes',
    glitter: ' · glitter',
    drip: ' · drip',
    flame: ' · flame',
  };
  return colorName[v.color] + finishMod[v.finish];
}
