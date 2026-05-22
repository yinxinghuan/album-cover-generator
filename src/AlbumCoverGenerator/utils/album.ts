import type { Album, CoverStyle, VinylDesign } from '../types';
import { vinylFor } from './vinyl';

// Used both by makeAlbum() and by the UI's pre-rolled "forecast id"
// flow (loading phase needs an album identity before the AI returns).
export function newAlbumId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function pickStyle(): CoverStyle {
  return Math.random() < 0.5 ? 'shoegaze' : 'xerox';
}

export function makeAlbum(opts: {
  words: [string, string, string];
  title: string;
  bandName: string;
  style: CoverStyle;
  imageUrl: string;
  catalog?: string;
  vinyl?: VinylDesign;
}): Album {
  const id = newAlbumId();
  return {
    id,
    words: opts.words,
    title: opts.title,
    bandName: opts.bandName,
    style: opts.style,
    imageUrl: opts.imageUrl,
    catalog: opts.catalog,
    vinyl: opts.vinyl ?? vinylFor(id),
    createdAt: Date.now(),
  };
}

export function prependAlbum(prev: Album[] | undefined, a: Album, max = 12): Album[] {
  const list = prev ? [...prev] : [];
  list.unshift(a);
  return list.slice(0, max);
}
