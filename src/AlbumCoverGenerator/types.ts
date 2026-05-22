export type CoverStyle = 'shoegaze' | 'xerox';

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

export type PadTone  = 'warm' | 'icy' | 'crunchy';
export type BassTone = 'sub'  | 'plucked' | 'fuzz';
export type DrumTone = 'soft' | 'kick' | 'none';

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

export interface AlbumSave {
  albums: Album[];
  /** Album IDs the current user has liked (their own + others'). */
  liked?: string[];
}

export interface WallEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  album: Album;
}

export type Phase = 'splash' | 'input' | 'generating' | 'result' | 'wall';
