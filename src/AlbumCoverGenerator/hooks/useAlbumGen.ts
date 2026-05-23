import { useCallback, useRef, useState } from 'react';
import { useGenImage } from '@shared/runtime/useGenImage';
import {
  BAND_NAME_SYSTEM,
  TITLE_SYSTEM,
  COVER_STYLE_SYSTEM,
  parseCoverSpec,
} from '../utils/prompts';
import { randomBandName, defaultTitle } from '../utils/bandName';
import { makeAlbum } from '../utils/album';
import { MUSIC_GEN_SYSTEM, parseMusicSpec } from '../utils/music';
import type { Album, MusicSpec } from '../types';

interface GenInput {
  words: [string, string, string];
  catalog: string;
}

export interface UseAlbumGen {
  generate: (input: GenInput) => Promise<Album>;
  loading: boolean;
  /** Free-text stage label: 'naming', 'pressing', or '' */
  stage: '' | 'naming' | 'pressing';
  error: Error | null;
}

// One-shot chat call — bypasses useChat because the album game's naming
// calls are stateless and useChat's accumulated history would bleed names
// between records.
const CHAT_URL = 'https://chat.aiwaves.tech/aigram/api/game-chat';

async function chatOnce(system: string, user: string): Promise<string> {
  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`chat failed: HTTP ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? '';
}

export function useAlbumGen(): UseAlbumGen {
  const { generate: genImg } = useGenImage();

  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'' | 'naming' | 'pressing'>('');
  const [error, setError] = useState<Error | null>(null);
  const inFlight = useRef(false);

  const generate = useCallback(
    async ({ words, catalog }: GenInput): Promise<Album> => {
      if (inFlight.current) {
        throw new Error('album-gen: already in flight');
      }
      inFlight.current = true;
      setLoading(true);
      setError(null);
      setStage('naming');

      const wordsLine = words.map(w => w.trim()).filter(Boolean).join(', ');
      const namingPrompt = `Three theme words: ${wordsLine}`;

      // Parallel chat: band name + title. Cover spec needs both for the
      // text-rendering instructions, so it runs after they return.
      const [bandName, title] = await Promise.all([
        (async () => {
          try {
            return cleanLine(await chatOnce(BAND_NAME_SYSTEM, namingPrompt))
              || randomBandName(words);
          } catch {
            return randomBandName(words);
          }
        })(),
        (async () => {
          try {
            return cleanLine(await chatOnce(TITLE_SYSTEM, namingPrompt))
              || defaultTitle(words);
          } catch {
            return defaultTitle(words);
          }
        })(),
      ]);

      // Cover spec — picks the genre slug, subtitle, and image prompt.
      const coverSpec = await (async () => {
        try {
          const coverInput = `Three theme words: ${wordsLine}
Band name: ${bandName}
Album title: ${title}`;
          return parseCoverSpec(
            await chatOnce(COVER_STYLE_SYSTEM, coverInput),
            words, title, bandName,
          );
        } catch {
          return parseCoverSpec('', words, title, bandName);
        }
      })();

      setStage('pressing');

      // Image gen (slow, ~30s) and music spec (fast chat) run in parallel.
      // Music gen now sees the cover genre slug so the synth instruments
      // match the visual style (e.g. cover = death-metal → fuzz bass +
      // punk drum, cover = ambient-newage → breath pad + no drum).
      try {
        const musicPromise = (async (): Promise<MusicSpec> => {
          try {
            const musicPrompt = `Three theme words: ${wordsLine}
Cover style: ${coverSpec.style}`;
            return parseMusicSpec(await chatOnce(MUSIC_GEN_SYSTEM, musicPrompt));
          } catch {
            return parseMusicSpec('');
          }
        })();
        const imagePromise = genImg({ prompt: coverSpec.imagePrompt });
        const [music, imageUrl] = await Promise.all([musicPromise, imagePromise]);
        // Pre-download + decode the cover so it's warm in the browser
        // cache by the time the result page mounts. Without this, the
        // result frame appears with a black sleeve and the image only
        // pops in once the <img> element triggers its own download.
        await preloadImage(imageUrl);
        const album = makeAlbum({
          words,
          title,
          bandName,
          style: coverSpec.style,
          imageUrl,
          catalog,
        });
        album.music = music;
        // Stash subtitle on the album so result page can display it.
        (album as Album & { subtitle?: string }).subtitle = coverSpec.subtitle;
        return album;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        throw err;
      } finally {
        inFlight.current = false;
        setLoading(false);
        setStage('');
      }
    },
    [genImg],
  );

  return { generate, loading, stage, error };
}

function cleanLine(s: string): string {
  return s
    .replace(/^["“”'`\s]+|["“”'`.\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });
}
