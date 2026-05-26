import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { isInAigram, useGameEvent } from '@shared/runtime';
import InputForm from './components/InputForm';
import CoverLoading from './components/CoverLoading';
import CoverResult from './components/CoverResult';
import Wall, { type ScopeMode } from './components/Wall';
import VinylGallery from './components/VinylGallery';
import AnimDemo from './components/AnimDemo';
import { useAlbumGen } from './hooks/useAlbumGen';
import { useWall } from './hooks/useWall';
import { prependAlbum, newAlbumId } from './utils/album';
import { catalogNumber } from './utils/catalog';
import { vinylFor } from './utils/vinyl';
import { startAmbient, stopAmbient, playNeedleDrop, playClick, playRevealChord } from './utils/audio';
import { t } from './i18n';
import type { Album, AlbumSave, Phase } from './types';
import './AlbumCoverGenerator.less';

const DEMO_SHOEGAZE = '/album-cover-generator/demo_cover.jpg';
const DEMO_XEROX = '/album-cover-generator/demo_cover_xerox.jpg';

const DEMO_ALBUM: Album = {
  id: 'demo',
  words: ['lonely', 'train', 'blue'],
  title: 'Slow Hours',
  bandName: 'The Fading Stations',
  style: 'shoegaze',
  imageUrl: DEMO_SHOEGAZE,
  catalog: 'ALT-024',
  vinyl: { color: 'oxblood', finish: 'translucent' },
  music: {
    bpm: 78, key: 'F#m', chords: ['F#m', 'D', 'A', 'E'],
    mood: 'wistful haze', pad: 'warm', bass: 'sub', drum: 'soft',
  },
  createdAt: Date.now(),
};

// Force the demo to use the logo label so reviewers see that variant.
DEMO_ALBUM.vinyl = { color: 'oxblood', finish: 'translucent', labelArt: 'logo' };

const DEMO_WALL: Array<{ name: string; album: Album }> = [
  { name: 'jenny',  album: { ...DEMO_ALBUM, id: 'a', catalog: 'ALT-001', title: 'Burnt Map',      bandName: 'Cheap Halo',   style: 'xerox',    imageUrl: DEMO_XEROX,    vinyl: { color: 'oxblood', finish: 'opaque' } } },
  { name: 'algram', album: { ...DEMO_ALBUM, id: 'b', catalog: 'ALT-002', title: 'Closer to Empty',bandName: 'Velvet Boy',   style: 'shoegaze', imageUrl: DEMO_SHOEGAZE, vinyl: { color: 'cobalt',  finish: 'translucent' } } },
  { name: 'jm·f',   album: { ...DEMO_ALBUM, id: 'c', catalog: 'ALT-003', title: 'Tape Hiss',      bandName: 'The Postcards',style: 'xerox',    imageUrl: DEMO_XEROX,    vinyl: { color: 'orange',  finish: 'marbled' } } },
  { name: 'isaya',  album: { ...DEMO_ALBUM, id: 'd', catalog: 'ALT-004', title: 'Window Light',   bandName: 'Soft Coat',    style: 'shoegaze', imageUrl: DEMO_SHOEGAZE, vinyl: { color: 'bone',    finish: 'opaque' } } },
  { name: 'isabel', album: { ...DEMO_ALBUM, id: 'e', catalog: 'ALT-005', title: 'Quiet Hour',     bandName: 'Pale Field',   style: 'xerox',    imageUrl: DEMO_XEROX,    vinyl: { color: 'black',   finish: 'opaque' } } },
  { name: 'ghost',  album: { ...DEMO_ALBUM, id: 'f', catalog: 'ALT-006', title: 'Static',         bandName: 'Worn Hum',     style: 'shoegaze', imageUrl: DEMO_SHOEGAZE, vinyl: { color: 'orange',  finish: 'translucent' } } },
];

export default function AlbumCoverGenerator() {
  const demo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('demo');
  }, []);

  const { savedData, persist } = useGameSave<AlbumSave>('album-cover-generator');
  const albumGen = useAlbumGen();
  const wall = useWall();

  // Wall (archive) is the landing screen — the social emphasis is now
  // browsing other people's pressings; pressing your own is a tap away
  // via the footer hero. Input phase is reached on demand.
  const [phase, setPhase] = useState<Phase>('wall');
  const [current, setCurrent] = useState<Album | null>(null);
  const [pending, setPending] = useState<{ catalog: string; vinyl: ReturnType<typeof vinylFor> } | null>(null);
  const [shareLabel, setShareLabel] = useState<string>('');
  const [hasFirstTouched, setHasFirstTouched] = useState(false);

  // Apply demo overrides AFTER first render so URL drives the screen.
  useEffect(() => {
    if (!demo) return;
    if (demo === 'input') setPhase('input');
    else if (demo === 'loading') {
      setPending({ catalog: 'ALT-024', vinyl: { color: 'orange', finish: 'marbled' } });
      setPhase('generating');
    }
    else if (demo === 'result') {
      setCurrent(DEMO_ALBUM);
      setPhase('result');
    } else if (demo === 'wall') {
      setPhase('wall');
    } else if (demo === 'poster') {
      // Poster composition reused later in puppeteer screenshot.
      setCurrent(DEMO_ALBUM);
      setPhase('result');
    }
  }, [demo]);

  // First-touch unlock: start ambient + flag for hint fade.
  const firstTouchRef = useRef(false);
  useEffect(() => {
    function onPointer() {
      if (firstTouchRef.current) return;
      firstTouchRef.current = true;
      setHasFirstTouched(true);
      startAmbient();
    }
    window.addEventListener('pointerdown', onPointer, { once: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  // Silence ambient on the result page so it doesn't bleed under the
  // synthesized track that has its own dedicated Play button. Resume
  // ambient on any other phase if the audio context is already unlocked.
  useEffect(() => {
    if (phase === 'result') {
      stopAmbient();
    } else if (hasFirstTouched) {
      startAmbient();
    }
  }, [phase, hasFirstTouched]);

  // Local mirror of the user's discography so freshly pressed records
  // immediately show with the correct catalog #, instead of waiting for
  // useGameSave to rehydrate (it doesn't update savedData on persist).
  const [localExtra, setLocalExtra] = useState<Album[]>([]);
  const pressed = (savedData?.albums?.length ?? 0) + localExtra.length;
  // Combined own discography — locally pressed + cloud-rehydrated.
  const albums: Album[] = [...localExtra, ...(savedData?.albums ?? [])];

  // First time we know how many albums the user has, pick the better
  // default tab (no albums → ALL is more interesting). After that the
  // user's manual selection wins, even across Wall remounts.
  useEffect(() => {
    if (scopeInitialized.current) return;
    if (savedData === undefined) return; // still rehydrating
    scopeInitialized.current = true;
    if (albums.length === 0) setWallScope('all');
  }, [savedData, albums.length]);

  // True when the user navigated to result via tapping a wall entry.
  // Used to route the "back" gesture back to wall instead of input.
  const [cameFromWall, setCameFromWall] = useState(false);
  // Lifted out of <Wall> so the tab the user was browsing survives a
  // round-trip through the result view. Without this, opening any row
  // from "ALL" and tapping back lands on "MY" because <Wall> remounts.
  const [wallScope, setWallScope] = useState<ScopeMode>('my');
  const scopeInitialized = useRef(false);
  // Author of the album currently being viewed in play mode. Carried
  // here (not on the Album itself) since Album is a save artifact and
  // the author depends on which wall entry was tapped.
  const [currentAuthor, setCurrentAuthor] = useState<{
    userId: string; userName?: string; userAvatarUrl?: string;
  } | null>(null);

  const handleViewFromWall = (album: Album, author?: {
    userId: string; userName?: string; userAvatarUrl?: string;
  }) => {
    playClick();
    setCurrent(album);
    setCameFromWall(true);
    setCurrentAuthor(author ?? null);
    setPhase('result');
  };

  // ─── Reactions ────────────────────────────────────────────────────
  // New model: per-album list of ReactionKind. Migrate the legacy
  // single-like `save.liked` array into reactions[id].heart on first
  // read so saved hearts don't vanish.
  const myReactions = (() => {
    const out = new Map<string, Set<import('./types').ReactionKind>>();
    const reactions = savedData?.reactions ?? {};
    for (const [id, kinds] of Object.entries(reactions)) {
      out.set(id, new Set(kinds));
    }
    for (const legacyId of savedData?.liked ?? []) {
      if (!out.has(legacyId)) out.set(legacyId, new Set(['heart']));
      else out.get(legacyId)!.add('heart');
    }
    return out;
  })();
  // Real cross-user reactions: each (album, kind) is a platform event;
  // an extra aggregate `react:<albumId>` event tracks unique reactors
  // per album so the wall can show a single number per row.
  // ONE-WAY: the platform increments only — no decrement API exists,
  // so a tap on an already-reacted kind is a no-op. Surface this in
  // UI as a permanently-active button state.
  const events = useGameEvent();
  const reactionsFor = (id: string) => myReactions.get(id) ?? new Set<import('./types').ReactionKind>();
  const toggleReaction = (albumId: string, kind: import('./types').ReactionKind) => {
    const current = new Set(myReactions.get(albumId) ?? []);
    if (current.has(kind)) return; // tap-once, no untap
    const isFirstReactionOnAlbum = current.size === 0;
    current.add(kind);
    // Fire-and-forget platform events. The matching useGameStats hooks
    // in CoverResult / WallRow re-fetch after a short delay so the
    // count visually reflects the +1.
    events.trigger(`react:${albumId}:${kind}`);
    if (isFirstReactionOnAlbum) events.trigger(`react:${albumId}`);
    // Persist locally so the active state survives reload + so we know
    // not to re-trigger the same event on subsequent taps.
    const reactions: Record<string, import('./types').ReactionKind[]> = {};
    for (const [id, kinds] of myReactions) {
      if (id === albumId) reactions[id] = [...current];
      else reactions[id] = [...kinds];
    }
    if (!reactions[albumId]) reactions[albumId] = [...current];
    persist({ albums: savedData?.albums ?? [], reactions });
  };

  // ---- Phase transitions ----

  const handleSubmit = async (words: [string, string, string]) => {
    playNeedleDrop();
    // Smooth-scroll the input body to top first, so the vinyl insertion
    // animation lands in the user's visible area (and not below the
    // viewport where the press button was tapped).
    const body = document.querySelector('.acg-ticket__body');
    if (body && body.scrollTop > 0) {
      body.scrollTo({ top: 0, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 280));
    }
    const catalog = catalogNumber(pressed);
    const forecastId = newAlbumId();
    const vinyl = vinylFor(forecastId);
    setPending({ catalog, vinyl });
    setPhase('generating');
    try {
      const album = await albumGen.generate({ words, catalog });
      // Stamp the album with the pre-rolled identity so loading/result
      // share the same vinyl.
      const stamped: Album = { ...album, id: forecastId, vinyl };
      // Brief settling beat — lets the pressing screen visually close
      // out (ring at 100%, ambient still spinning) before the result
      // takes over. Without this, the swap feels jarring after a
      // ~60s pressing wait.
      await new Promise((r) => setTimeout(r, 320));
      setCurrent(stamped);
      setPhase('result');
      playRevealChord();
      const nextAlbums = prependAlbum(savedData?.albums, stamped);
      persist({ albums: nextAlbums });
      setLocalExtra(prev => [stamped, ...prev].slice(0, 12));
    } catch {
      // Surface a quick error then bounce back to input.
      setPhase('input');
    } finally {
      setPending(null);
    }
  };

  const handleNew = () => {
    playClick();
    setShareLabel('');
    setCameFromWall(false);
    setPhase('input');
  };

  const handleWall = () => {
    playClick();
    wall.refresh();
    setPhase('wall');
  };

  const handleBackFromWall = () => {
    playClick();
    setPhase(current ? 'result' : 'input');
  };

  const handleShare = () => {
    if (!current) return;
    // Copy a short share string. The platform AW.POST.OPEN call is one
    // possible future hook — for now we just give visual feedback.
    const text = `${current.title} — ${current.bandName} · alteru.studio`;
    try { navigator.clipboard?.writeText(text); } catch { /* no-op */ }
    setShareLabel('copied ✓');
    setTimeout(() => setShareLabel(''), 1600);
  };

  // ---- Wall data: real or demo ----

  const wallEntries = demo === 'wall' || demo === 'poster'
    ? DEMO_WALL.map((d, i) => ({
        userId: `demo-${i}`,
        userName: d.name,
        userAvatarUrl: undefined,
        album: d.album,
      }))
    : wall.entries;
  const wallLoaded = (demo === 'wall' || demo === 'poster') ? true : wall.loaded;

  if (demo === 'gallery') {
    return (
      <div className="acg-root acg-root--demo">
        <VinylGallery />
      </div>
    );
  }
  if (demo === 'anim') {
    return (
      <div className="acg-root acg-root--demo">
        <AnimDemo />
      </div>
    );
  }

  return (
    <div className="acg-root">
      <div className="acg-frame">
        {phase === 'input' && (
          <InputForm
            onSubmit={handleSubmit}
            onWall={handleWall}
            pressed={pressed}
            hasFirstTouched={hasFirstTouched}
          />
        )}
        {phase === 'generating' && pending && (
          <CoverLoading stage={albumGen.stage} catalog={pending.catalog} vinyl={pending.vinyl} />
        )}
        {phase === 'result' && current && (
          <CoverResult
            album={current}
            viewMode={cameFromWall ? 'play' : 'release'}
            myReactions={reactionsFor(current.id)}
            onToggleReaction={cameFromWall ? (k) => toggleReaction(current.id, k) : undefined}
            onNew={handleNew}
            onWall={handleWall}
            onShare={isInAigram ? undefined : handleShare}
            shareLabel={shareLabel || undefined}
            shareDisabled={!!shareLabel}
            author={cameFromWall && currentAuthor && currentAuthor.userName
              ? currentAuthor
              : undefined}
          />
        )}
        {phase === 'wall' && (
          <Wall
            community={wallEntries}
            mine={albums}
            loaded={wallLoaded}
            myReactions={myReactions}
            // No back when wall is the landing screen. Once the user has
            // pressed (or peeked at) a record, `current` is set and back
            // takes them to the result view.
            onBack={current ? handleBackFromWall : undefined}
            onView={handleViewFromWall}
            onNew={handleNew}
            scope={wallScope}
            onScopeChange={setWallScope}
          />
        )}
      </div>
      {phase === 'input' && !hasFirstTouched && (
        <div className="acg-hint">{t('hint_tap_play')}</div>
      )}
    </div>
  );
}
