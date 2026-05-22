import type { Album, CoverStyle } from '../types';

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
}): Album {
  return {
    id: newAlbumId(),
    words: opts.words,
    title: opts.title,
    bandName: opts.bandName,
    style: opts.style,
    imageUrl: opts.imageUrl,
    catalog: opts.catalog,
    createdAt: Date.now(),
  };
}

export function prependAlbum(prev: Album[] | undefined, a: Album, max = 12): Album[] {
  const list = prev ? [...prev] : [];
  list.unshift(a);
  return list.slice(0, max);
}
