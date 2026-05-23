// Reactions: real cross-user counts via the platform's record/play +
// get/play/stats events. Each (album, kind) is an event; an aggregate
// `react:<albumId>` event tracks unique reactors per album so the wall
// can show a single count per row without fetching 4 per-kind stats.
//
// Off-platform (dev preview, demo URLs) the helpers below produce a
// deterministic procedural baseline so the UI doesn't look dead.

import type { ReactionKind } from '../types';
import { REACTION_KINDS } from '../types';

// ───────────────────── Event names ─────────────────────

export function reactionEvent(albumId: string, kind: ReactionKind): string {
  return `react:${albumId}:${kind}`;
}

export function reactionAggregateEvent(albumId: string): string {
  return `react:${albumId}`;
}

// ───────────────────── Fallback (off-platform) ─────────────────────

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Per-reaction baseline (deterministic per album + kind). Used only
 *  as a fallback when the game is running outside Aigram (no platform
 *  stats available). Heart is the most common; fire/mind/eye skew
 *  rarer for visual variety. */
export function baselineCount(albumId: string, kind: ReactionKind): number {
  const h = djb2(`react:${kind}:${albumId}`);
  const skew = kind === 'heart' ? 1.6 : kind === 'fire' ? 2.4 : kind === 'mind' ? 3.0 : 3.4;
  const exp = (h % 100) / 100;
  return Math.floor(Math.pow(exp, skew) * (kind === 'heart' ? 130 : 70));
}

export function fallbackCount(albumId: string, kind: ReactionKind, mine: boolean): number {
  return baselineCount(albumId, kind) + (mine ? 1 : 0);
}

export function fallbackTotal(albumId: string, mine: Set<ReactionKind>): number {
  return REACTION_KINDS.reduce(
    (sum, k) => sum + fallbackCount(albumId, k, mine.has(k)),
    0,
  );
}

/** Pick the reaction kind with the highest count for an album. Only
 *  meaningful in fallback mode — the platform aggregate event doesn't
 *  break down by kind, so the wall row's icon uses this in fallback
 *  and a fixed `heart` icon in real mode. */
export function dominantReaction(albumId: string, mine: Set<ReactionKind>): ReactionKind {
  let best: ReactionKind = 'heart';
  let bestCount = -1;
  for (const k of REACTION_KINDS) {
    const c = fallbackCount(albumId, k, mine.has(k));
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

// Legacy export — kept for any straggling import site.
export const reactionCount = fallbackCount;
export const totalReactions = fallbackTotal;
