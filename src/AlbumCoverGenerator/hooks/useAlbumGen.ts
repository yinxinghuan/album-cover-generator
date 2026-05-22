import { useCallback, useRef, useState } from 'react';
import { useGenImage } from '@shared/runtime/useGenImage';
import { coverPrompt, BAND_NAME_SYSTEM, TITLE_SYSTEM } from '../utils/prompts';
import { randomBandName, defaultTitle } from '../utils/bandName';
import { makeAlbum } from '../utils/album';
import type { Album, CoverStyle } from '../types';

interface GenInput {
  words: [string, string, string];
  style: CoverStyle;
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
    async ({ words, style, catalog }: GenInput): Promise<Album> => {
      if (inFlight.current) {
        throw new Error('album-gen: already in flight');
      }
      inFlight.current = true;
      setLoading(true);
      setError(null);
      setStage('naming');

      // Run band + title in parallel with offline fallbacks so a chat
      // outage doesn't block the visual.
      const wordsLine = words.map(w => w.trim()).filter(Boolean).join(', ');
      const namingPrompt = `Three theme words: ${wordsLine}`;

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

      setStage('pressing');

      try {
        const imageUrl = await genImg({
          prompt: coverPrompt(style, words, title, bandName),
        });
        const album = makeAlbum({ words, title, bandName, style, imageUrl, catalog });
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
