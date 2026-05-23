import { useEffect, useRef, useState } from 'react';
import Ticket from './Ticket';
import { RealisticVinyl } from './Vinyl';
import ReactionIcon from './ReactionIcons';
import { t } from '../i18n';
import { trackTime, genreFor } from '../utils/catalog';
import { vinylFor, vinylDesignLabel } from '../utils/vinyl';
import { playMusic, parseMusicSpec, type MusicHandle } from '../utils/music';
import { reactionCount } from '../utils/reactions';
import { openAigramProfile } from '@shared/runtime/bridge';
import { REACTION_KINDS, type Album, type ReactionKind } from '../types';

interface Props {
  album: Album;
  /** 'release' = just-pressed (default); 'play' = viewing from wall. */
  viewMode?: 'release' | 'play';
  /** Which reactions the current user has given this album. */
  myReactions?: Set<ReactionKind>;
  onToggleReaction?: (kind: ReactionKind) => void;
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
  /** Album author — present only in play mode (forwarded from wall). */
  author?: { userId: string; userName?: string; userAvatarUrl?: string };
}

export default function CoverResult({
  album,
  viewMode = 'release',
  myReactions,
  onToggleReaction,
  onNew,
  onWall,
  onShare,
  shareLabel,
  shareDisabled,
  author,
}: Props) {
  const isPlayMode = viewMode === 'play';
  const reactions = myReactions ?? new Set<ReactionKind>();
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
        footerHero={isPlayMode ? t('result_back_to_wall') : t('result_new')}
        footerHeroDirection={isPlayMode ? 'back' : 'forward'}
        onFooterHeroClick={isPlayMode ? onWall : onNew}
        footerLeftAction={isPlayMode
          ? { label: t('new_press_link'), onClick: onNew }
          : { label: t('wall_link'), onClick: onWall }}
      >
        <div
          className={`acg-release-display acg-release-display--${displayMode} ${isPlayMode ? '' : 'is-fresh'}`}
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

        {isPlayMode && author && author.userName && (
          <button type="button" className="acg-author-chip acg-author-chip--result"
                  aria-label={`Open ${author.userName}'s profile`}
                  onClick={() => openAigramProfile(author.userId)}>
            {author.userAvatarUrl
              ? <img className="acg-author-chip__avatar" src={author.userAvatarUrl} alt="" draggable={false} />
              : <span className="acg-author-chip__initial">{(author.userName[0] ?? '?').toUpperCase()}</span>}
            <span className="acg-author-chip__name">{author.userName}</span>
          </button>
        )}

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

        {isPlayMode && onToggleReaction && (
          <div className="acg-reactions" role="group" aria-label="reactions">
            {REACTION_KINDS.map((k) => {
              const active = reactions.has(k);
              const count = reactionCount(album.id, k, active);
              return (
                <button
                  key={k}
                  type="button"
                  className={`acg-reaction ${active ? 'is-on' : ''}`}
                  onPointerDown={() => onToggleReaction(k)}
                  aria-pressed={active}
                  aria-label={k}
                >
                  <ReactionIcon kind={k} size={14} className="acg-reaction__icon" />
                  <span className="acg-reaction__count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {onShare && (
          <div className="acg-actions">
            <button type="button" className="acg-btn acg-btn--ghost"
                    onPointerDown={onShare} disabled={shareDisabled}>
              {shareLabel || t('result_share')}
            </button>
          </div>
        )}
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
