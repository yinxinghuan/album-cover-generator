// Fetch the 6 most recent users' latest album from the platform.
//
// Wire: get/data/list?session_id=<gameUUID> returns up to 6 most-recent
// users' latest save row. We parse each row's resource_data as an
// AlbumSave, take its newest album, and (in parallel) look up each
// user's name + avatar via the user-info API.

import { useCallback, useEffect, useState } from 'react';
import {
  callAigramAPI,
  isInAigram,
  telegramId,
  type AigramResponse,
} from '@shared/runtime/bridge';
import { getGameUuid } from '@shared/runtime/game-id';
import type { Album, AlbumSave, WallEntry } from '../types';

interface SaveRow {
  user_id: string;
  time?: string;
  resource_data?: string;
}

export interface UseWall {
  entries: WallEntry[];
  loaded: boolean;
  refresh: () => void;
}

export function useWall(): UseWall {
  const [entries, setEntries] = useState<WallEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    const sessionId = getGameUuid();
    if (!isInAigram || !sessionId) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await callAigramAPI<AigramResponse<SaveRow[]>>(
          `/note/aigram/ai/game/get/data/list?session_id=${encodeURIComponent(sessionId)}`,
          'GET',
        );
        const rows = Array.isArray(res?.data) ? res.data : [];

        const parsed: Array<{ row: SaveRow; album: Album }> = [];
        for (const row of rows) {
          if (!row.user_id || !row.resource_data) continue;
          try {
            const save = JSON.parse(row.resource_data) as AlbumSave;
            const album = save.albums?.[0];
            if (album && album.imageUrl) {
              parsed.push({ row, album });
            }
          } catch { /* skip corrupt row */ }
          if (parsed.length >= 6) break;
        }

        // Resolve user profiles in parallel.
        const profiles = await Promise.all(
          parsed.map(({ row }) =>
            callAigramAPI<AigramResponse<{ name?: string; head_url?: string }>>(
              `/note/telegram/user/get/info/by/telegram_id?telegram_id=${encodeURIComponent(row.user_id)}`,
              'GET',
            ).catch(() => null),
          ),
        );

        if (cancelled) return;
        setEntries(
          parsed.map(({ row, album }, i) => ({
            userId: row.user_id,
            userName: profiles[i]?.data?.name,
            userAvatarUrl: profiles[i]?.data?.head_url,
            album,
          })),
        );
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [nonce]);

  return { entries, loaded, refresh };
}

export function isSelf(entry: WallEntry): boolean {
  return !!telegramId && entry.userId === String(telegramId);
}
