export type CoverStyle = 'shoegaze' | 'xerox';

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
}

export interface AlbumSave {
  albums: Album[];
}

export interface WallEntry {
  userId: string;
  userName?: string;
  userAvatarUrl?: string;
  album: Album;
}

export type Phase = 'splash' | 'input' | 'generating' | 'result' | 'wall';
