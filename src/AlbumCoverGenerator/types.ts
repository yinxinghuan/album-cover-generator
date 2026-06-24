// CoverStyle is now an open-ended string tag (e.g. 'shoegaze',
// 'vaporwave', 'folk-revival', 'minimal-techno') chosen by chat from
// the 3 input words. The full image prompt is also chat-generated
// (no more hardcoded templates) — see CoverSpec.
export type CoverStyle = string;

import type { GuestMessage } from '@shared/social/guestbook';
export type { GuestMessage };

export interface CoverSpec {
  /** Short genre slug — used as CSS class + sort/group key. */
  style: string;
  /** Display label, 2-4 words, shown in the result genre field. */
  subtitle: string;
  /** Full prompt for the image generator. Already contains the band
   *  name + album title in the rendering instructions. */
  imagePrompt: string;
}

export type VinylColor =
  | 'black' | 'orange' | 'bone' | 'oxblood' | 'cobalt'
  | 'emerald' | 'fuchsia' | 'amber' | 'frosted'
  | 'violet' | 'mint';
export type VinylFinish =
  | 'opaque' | 'translucent' | 'marbled' | 'splatter'
  | 'half' | 'swirl' | 'galaxy'
  | 'stripes' | 'glitter' | 'drip' | 'flame';

export type LabelArt = 'text' | 'logo';

export interface VinylDesign {
  color: VinylColor;
  finish: VinylFinish;
  /** Center-label art style. 'text' = ALTERU + catalog + side. 'logo' = AlterU mark glyph. */
  labelArt?: LabelArt;
}

// Tone palettes. Each value is its own synth recipe in utils/music.ts.
// New additions: bell + breath pads, upright + acid basses, punk + dub
// drums — these unlock drastically different genre vibes (death-metal,
// vaporwave, dub-reggae, lo-fi, classical, etc.) on top of the original
// shoegaze/post-punk pair.
export type PadTone  = 'warm' | 'icy' | 'crunchy' | 'bell' | 'breath';
export type BassTone = 'sub'  | 'plucked' | 'fuzz' | 'upright' | 'acid';
export type DrumTone = 'soft' | 'kick' | 'none' | 'punk' | 'dub';

export interface MusicSpec {
  /** Tempo in BPM. */
  bpm: number;
  /** Tonal key (root + minor flag), e.g. "F#m", "C", "Dm". */
  key: string;
  /** 4 chord progression, 2 bars each. */
  chords: [string, string, string, string];
  /** Free-text mood (2-3 words). */
  mood: string;
  pad:  PadTone;
  bass: BassTone;
  drum: DrumTone;
}

export interface Album {
  id: string;
  words: [string, string, string];
  title: string;
  bandName: string;
  style: CoverStyle;
  /** Chat-generated 2-4 word descriptor of the cover style, shown in the
   *  result page genre field (e.g. "dreamy lo-fi haze"). */
  subtitle?: string;
  imageUrl: string;
  createdAt: number;
  /** "ALT-024" — assigned at press time, immutable. */
  catalog?: string;
  /** Color + finish of the pressed vinyl. Rolled deterministically from
   *  album.id at creation; immutable thereafter. */
  vinyl?: VinylDesign;
  /** Musical sketch — chat-generated structure synthesized via Web Audio. */
  music?: MusicSpec;
}

export type ReactionKind = 'heart' | 'fire' | 'mind' | 'eye';

export const REACTION_KINDS: ReactionKind[] = ['heart', 'fire', 'mind', 'eye'];

export interface AlbumSave {
  albums: Album[];
  /** Legacy: album IDs hearted in the old single-like model. Read-only;
   *  new writes go to `reactions`. */
  liked?: string[];
  /** New model: per-album list of reactions the current user gave. */
  reactions?: Record<string, ReactionKind[]>;
  /** Guestbook notes this user left on covers (theirs + others'). Stored
   *  in the sender's own blob; aggregated cross-user best-effort. */
  messages?: GuestMessage[];
}

export interface WallEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  album: Album;
}

export type Phase = 'splash' | 'input' | 'generating' | 'result' | 'wall';
