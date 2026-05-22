// Like-count helper.
//
// v1 implementation:
//   - The user's own likes are persisted in their save (`AlbumSave.liked`).
//   - The displayed "like count" on the wall is a procedural baseline
//     derived from the album.id (so every record has a plausible number
//     that's stable across sessions) PLUS one if the current user
//     personally liked it. This is purely cosmetic for v1 — real
//     cross-user aggregation is a v2 platform integration.

function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Deterministic baseline "popularity" — 0 to ~120, biased low. */
export function baselineLikeCount(albumId: string): number {
  const h = djb2(`pop:${albumId}`);
  // Lognormal-ish: small numbers common, occasional big numbers.
  const exp = (h % 100) / 100; // 0..1
  return Math.floor(Math.pow(exp, 2.2) * 130);
}

/** Final displayed count: baseline + 1 if I liked it. */
export function displayLikeCount(albumId: string, mineHasLiked: boolean): number {
  return baselineLikeCount(albumId) + (mineHasLiked ? 1 : 0);
}
