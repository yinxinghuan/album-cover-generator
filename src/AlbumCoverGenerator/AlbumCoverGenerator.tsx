import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameSave } from '@shared/save';
import { isInAigram } from '@shared/runtime';
import InputForm from './components/InputForm';
import CoverLoading from './components/CoverLoading';
import CoverResult from './components/CoverResult';
import Wall from './components/Wall';
import { useAlbumGen } from './hooks/useAlbumGen';
import { useWall } from './hooks/useWall';
import { pickStyle, prependAlbum } from './utils/album';
import { catalogNumber } from './utils/catalog';
import { startAmbient, playNeedleDrop, playClick, playRevealChord } from './utils/audio';
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
  createdAt: Date.now(),
};

const DEMO_WALL: Array<{ name: string; album: Album }> = [
  { name: 'jenny',  album: { ...DEMO_ALBUM, id: 'a', title: 'Burnt Map',      bandName: 'Cheap Halo',   style: 'xerox',    imageUrl: DEMO_XEROX } },
  { name: 'algram', album: { ...DEMO_ALBUM, id: 'b', title: 'Closer to Empty',bandName: 'Velvet Boy',   style: 'shoegaze', imageUrl: DEMO_SHOEGAZE } },
  { name: 'jm·f',   album: { ...DEMO_ALBUM, id: 'c', title: 'Tape Hiss',      bandName: 'The Postcards',style: 'xerox',    imageUrl: DEMO_XEROX } },
  { name: 'isaya',  album: { ...DEMO_ALBUM, id: 'd', title: 'Window Light',   bandName: 'Soft Coat',    style: 'shoegaze', imageUrl: DEMO_SHOEGAZE } },
  { name: 'isabel', album: { ...DEMO_ALBUM, id: 'e', title: 'Quiet Hour',     bandName: 'Pale Field',   style: 'xerox',    imageUrl: DEMO_XEROX } },
  { name: 'ghost',  album: { ...DEMO_ALBUM, id: 'f', title: 'Static',         bandName: 'Worn Hum',     style: 'shoegaze', imageUrl: DEMO_SHOEGAZE } },
];

export default function AlbumCoverGenerator() {
  const demo = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('demo');
  }, []);

  const { savedData, persist } = useGameSave<AlbumSave>('album-cover-generator');
  const albumGen = useAlbumGen();
  const wall = useWall();

  const [phase, setPhase] = useState<Phase>('input');
  const [current, setCurrent] = useState<Album | null>(null);
  const [shareLabel, setShareLabel] = useState<string>('');
  const [hasFirstTouched, setHasFirstTouched] = useState(false);

  // Apply demo overrides AFTER first render so URL drives the screen.
  useEffect(() => {
    if (!demo) return;
    if (demo === 'input') setPhase('input');
    else if (demo === 'loading') setPhase('generating');
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

  // Local mirror of the user's discography so freshly pressed records
  // immediately show with the correct catalog #, instead of waiting for
  // useGameSave to rehydrate (it doesn't update savedData on persist).
  const [localExtra, setLocalExtra] = useState<Album[]>([]);
  const pressed = (savedData?.albums?.length ?? 0) + localExtra.length;

  // ---- Phase transitions ----

  const handleSubmit = async (words: [string, string, string]) => {
    playNeedleDrop();
    setPhase('generating');
    try {
      const catalog = catalogNumber(pressed);
      const album = await albumGen.generate({ words, style: pickStyle(), catalog });
      setCurrent(album);
      setPhase('result');
      playRevealChord();
      const nextAlbums = prependAlbum(savedData?.albums, album);
      persist({ albums: nextAlbums });
      setLocalExtra(prev => [album, ...prev].slice(0, 12));
    } catch {
      // Surface a quick error then bounce back to input.
      setPhase('input');
    }
  };

  const handleNew = () => {
    playClick();
    setShareLabel('');
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

  return (
    <div className="acg-root">
      <div className="acg-frame">
        {phase === 'input' && (
          <InputForm
            onSubmit={handleSubmit}
            pressed={pressed}
            hasFirstTouched={hasFirstTouched}
          />
        )}
        {phase === 'generating' && <CoverLoading stage={albumGen.stage} />}
        {phase === 'result' && current && (
          <CoverResult
            album={current}
            onNew={handleNew}
            onWall={handleWall}
            onShare={isInAigram ? undefined : handleShare}
            shareLabel={shareLabel || undefined}
            shareDisabled={!!shareLabel}
          />
        )}
        {phase === 'wall' && (
          <Wall entries={wallEntries} loaded={wallLoaded} onBack={handleBackFromWall} />
        )}
      </div>
      {phase === 'input' && !hasFirstTouched && (
        <div className="acg-hint">{t('hint_tap_play')}</div>
      )}
    </div>
  );
}
