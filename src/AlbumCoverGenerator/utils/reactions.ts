// Per-reaction count helper. Same baseline+mine model as the original
// likes file — each (album, reaction kind) pair gets its own procedural
// count, and the current user's own reaction adds +1.
//
// v2 platform integration (real cross-user aggregation) is still pending;
// this file is intentionally local-only so the UI can render counts
// without backend dependencies.

import type { ReactionKind } from '../types';
import { REACTION_KINDS } from '../types';

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Per-reaction baseline (deterministic per album + kind). Heart is the
 *  most common; fire/mind/eye decay so the "rare" reactions feel rare. */
export function baselineCount(albumId: string, kind: ReactionKind): number {
  const h = djb2(`react:${kind}:${albumId}`);
  const skew = kind === 'heart' ? 1.6 : kind === 'fire' ? 2.4 : kind === 'mind' ? 3.0 : 3.4;
  const exp = (h % 100) / 100;
  return Math.floor(Math.pow(exp, skew) * (kind === 'heart' ? 130 : 70));
}

export function reactionCount(albumId: string, kind: ReactionKind, mine: boolean): number {
  return baselineCount(albumId, kind) + (mine ? 1 : 0);
}

export function totalReactions(albumId: string, mine: Set<ReactionKind>): number {
  return REACTION_KINDS.reduce(
    (sum, k) => sum + reactionCount(albumId, k, mine.has(k)),
    0,
  );
}

/** Pick the reaction kind with the highest count for an album — used by
 *  the wall row's condensed badge. */
export function dominantReaction(albumId: string, mine: Set<ReactionKind>): ReactionKind {
  let best: ReactionKind = 'heart';
  let bestCount = -1;
  for (const k of REACTION_KINDS) {
    const c = reactionCount(albumId, k, mine.has(k));
    if (c > bestCount) { best = k; bestCount = c; }
  }
  return best;
}

/** Emoji glyph for each reaction kind. */
export const REACTION_EMOJI: Record<ReactionKind, string> = {
  heart: '♥',
  fire: '🔥',
  mind: '🤯',
  eye: '👀',
};
