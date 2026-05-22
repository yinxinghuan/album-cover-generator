import { useEffect, useRef, useState } from 'react';
import Ticket from './Ticket';
import Arrow from './Arrow';
import { RealisticVinyl } from './Vinyl';
import { t } from '../i18n';
import { trackTime, genreFor } from '../utils/catalog';
import { vinylFor, vinylDesignLabel } from '../utils/vinyl';
import { playMusic, parseMusicSpec, type MusicHandle } from '../utils/music';
import type { Album } from '../types';

interface Props {
  album: Album;
  /** 'release' = just-pressed (default); 'play' = viewing from wall. */
  viewMode?: 'release' | 'play';
  /** Has the current user liked this album? (Play mode only.) */
  liked?: boolean;
  onToggleLike?: () => void;
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
}

export default function CoverResult({
  album,
  viewMode = 'release',
  liked = false,
  onToggleLike,
  onNew,
  onWall,
  onShare,
  shareLabel,
  shareDisabled,
}: Props) {
  const isPlayMode = viewMode === 'play';
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [album.id]);

  const cat = album.catalog ?? 'ALT-001';
  const vinyl = album.vinyl ?? vinylFor(album.id);
  const music = album.music ?? parseMusicSpec('');
  const pressedOn = formatDate(new Date(album.createdAt));

  // Display mode for the release composition. Tap cycles through.
  const [displayMode, setDisplayMode] = useState<'both' | 'cover' | 'vinyl'>('both');
  const cycleDisplay = () => {
    setDisplayMode((m) => (m === 'both' ? 'cover' : m === 'cover' ? 'vinyl' : 'both'));
  };

  const [playing, setPlaying] = useState(false);
  const handleRef = useRef<MusicHandle | null>(null);
  const togglePlay = () => {
    if (playing) {
      handleRef.current?.stop();
      handleRef.current = null;
      setPlaying(false);
    } else {
      handleRef.current = playMusic(music);
      setPlaying(true);
    }
  };
  // Stop playback if the album switches or component unmounts.
  useEffect(() => {
    return () => {
      handleRef.current?.stop();
      handleRef.current = null;
    };
  }, [album.id]);

  const totalSec = album.words
    .map((w) => trackTime(w).split(':').map(Number))
    .reduce((acc, [m, s]) => acc + m * 60 + s, 0);
  const tm = Math.floor(totalSec / 60);
  const ts = totalSec % 60;
  const runtime = `${tm}:${String(ts).padStart(2, '0')}`;

  return (
    <div className={`acg-reveal ${revealed ? 'is-revealed' : ''}`}>
      <Ticket
        topLabel={isPlayMode ? t('ticket_label_play') : t('ticket_label_done')}
        catalog={cat}
        footerHero={isPlayMode ? t('footer_hero_play') : t('footer_hero_done')}
      >
        <div
          className={`acg-release-display acg-release-display--${displayMode}`}
          onPointerDown={cycleDisplay}
          role="button"
          aria-label="cycle display"
        >
          {/* Half-extracted vinyl behind the sleeve, only the right portion
              shows. Spins while music plays. */}
          <div className="acg-release-display__vinyl">
            <RealisticVinyl design={vinyl} catalog={cat} spinning={playing} />
          </div>
          {/* Cover sleeve — square AI artwork on top, occluding the left
              half of the vinyl. */}
          <div className="acg-release-display__sleeve">
            <img
              src={album.imageUrl}
              alt={`${album.title} — ${album.bandName}`}
              className={`acg-release-display__art acg-cover-panel__art--${album.style}`}
              draggable={false}
            />
            <span className="acg-cover-panel__chip">
              <svg viewBox="0 0 18 12" width="14" height="10" aria-hidden>
                <path d="M2 2h14v8h-3l-1.5-2H6.5L5 10H2z" fill="currentColor" />
              </svg>
              {t('ticket_label_done')}
            </span>
            <span className="acg-cover-panel__cat">{cat}</span>
            <span className="acg-cover-panel__qc" aria-hidden>
              <span className="acg-cover-panel__qc-mark">✓</span>
              <span className="acg-cover-panel__qc-text">{t('qc_inspected')}</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`acg-play ${playing ? 'is-playing' : ''}`}
          onPointerDown={togglePlay}
          aria-pressed={playing}
        >
          <span className="acg-play__icon" aria-hidden>
            {playing ? (
              <svg viewBox="0 0 16 16" width="14" height="14">
                <rect x="3" y="2" width="3.5" height="12" fill="currentColor" />
                <rect x="9.5" y="2" width="3.5" height="12" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" width="14" height="14">
                <polygon points="3,2 14,8 3,14" fill="currentColor" />
              </svg>
            )}
          </span>
          <span className="acg-play__label">
            {playing ? t('music_pause') : t('music_play')}
          </span>
          <span className="acg-play__detail">
            {music.bpm} BPM · {music.key} · {music.mood}
          </span>
        </button>

        <div className="acg-vinyl-credit">
          <span className="acg-vinyl-credit__label">{t('vinyl_finish')}</span>
          <span className="acg-vinyl-credit__value">{vinylDesignLabel(vinyl)}</span>
        </div>

        <div className="acg-orderline">
          <span className="acg-orderline__label">{t('pressed_on')}</span>
          <span className="acg-orderline__value">{pressedOn}</span>
          <span className="acg-orderline__sep">/</span>
          <span className="acg-orderline__value">{t('result_qty')}</span>
        </div>

        <div className="acg-result-headline">
          <h1 className="acg-display acg-display--xl">{album.bandName}</h1>
          <h2 className="acg-display acg-display--lg acg-display--orange">{album.title}</h2>
        </div>

        <div className="acg-perf acg-perf--label" data-label={t('perf_credits')} />

        <div className="acg-meta-grid">
          <Field label={t('result_artist')} value={album.bandName} />
          <Field label={t('result_title')} value={album.title} />
          <Field label={t('result_genre')} value={genreFor(album.style, album.subtitle)} />
          <Field label={t('result_runtime')} value={runtime} mono />
        </div>

        <div className="acg-perf acg-perf--tear" data-label={t('perf_tear')} />

        <ol className="acg-tracks">
          {album.words.map((w, i) => (
            <li key={i} className="acg-track-row">
              <span className="acg-track-row__n">TR.{String(i + 1).padStart(2, '0')}</span>
              <span className="acg-track-row__name">{toTrackCase(w)}</span>
              <span className="acg-track-row__time">{trackTime(w)}</span>
            </li>
          ))}
        </ol>

        <div className="acg-actions">
          {isPlayMode && onToggleLike && (
            <button
              type="button"
              className={`acg-btn acg-btn--like ${liked ? 'is-liked' : ''}`}
              onPointerDown={onToggleLike}
              aria-pressed={liked}
            >
              <svg viewBox="0 0 16 14" width={14} height={12} aria-hidden>
                <path
                  d="M8 13.5 L 1.5 7.5 a 3.5 3.5 0 0 1 5 -5 L 8 4 L 9.5 2.5 a 3.5 3.5 0 0 1 5 5 Z"
                  fill={liked ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="miter"
                />
              </svg>
              {liked ? t('liked') : t('like')}
            </button>
          )}
          {onShare && (
            <button type="button" className="acg-btn acg-btn--ghost"
                    onPointerDown={onShare} disabled={shareDisabled}>
              {shareLabel || t('result_share')}
            </button>
          )}
          {isPlayMode ? (
            <button type="button" className="acg-btn acg-btn--solid" onPointerDown={onWall}>
              ← {t('result_back_to_wall')}
            </button>
          ) : (
            <>
              <button type="button" className="acg-btn acg-btn--ghost" onPointerDown={onWall}>
                {t('result_wall')}
              </button>
              <button type="button" className="acg-btn acg-btn--solid" onPointerDown={onNew}>
                {t('result_new')}
                <Arrow className="acg-press__arrow" size={18} />
              </button>
            </>
          )}
        </div>
      </Ticket>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="acg-field">
      <div className="acg-field__label">{label}</div>
      <div className={`acg-field__value ${mono ? 'is-mono' : ''}`}>{value}</div>
    </div>
  );
}

function toTrackCase(w: string): string {
  if (!w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function formatDate(d: Date): string {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
