import { useState, useMemo } from 'react';
import Ticket from './Ticket';
import Arrow from './Arrow';
import { RealisticVinyl } from './Vinyl';
import { t } from '../i18n';
import { genreFor } from '../utils/catalog';
import { vinylFor } from '../utils/vinyl';
import { displayLikeCount } from '../utils/likes';
import type { Album, WallEntry } from '../types';

interface Props {
  community: WallEntry[];
  mine: Album[];
  loaded: boolean;
  liked: Set<string>;
  onBack: () => void;
  onView: (album: Album) => void;
}

type ViewMode = 'list' | 'grid';
type ScopeMode = 'my' | 'all';

export default function Wall({ community, mine, loaded, liked, onBack, onView }: Props) {
  const [view, setView] = useState<ViewMode>('list');
  // Default to MY when user has records, otherwise show community first.
  const [scope, setScope] = useState<ScopeMode>(mine.length > 0 ? 'my' : 'all');

  // Wrap own albums into WallEntry shape so the renderers stay uniform.
  // MY → chronological (newest first, already that way in mine[]).
  // ALL → sorted by like count desc, then chronological.
  const entries: WallEntry[] = useMemo(() => {
    if (scope === 'my') {
      return mine.map((a) => ({ userId: 'self', userName: 'You', album: a }));
    }
    return [...community].sort((a, b) => {
      const ca = displayLikeCount(a.album.id, liked.has(a.album.id));
      const cb = displayLikeCount(b.album.id, liked.has(b.album.id));
      return cb - ca;
    });
  }, [scope, mine, community, liked]);

  const total = entries.length;

  return (
    <Ticket
      topLabel={t('ticket_label_wall')}
      catalog={`${String(total).padStart(2, '0')} ${t('on_file')}`}
      footerHero={t('footer_hero_wall')}
    >
      <div className="acg-archive-head">
        <button type="button" className="acg-btn acg-btn--ghost acg-btn--small acg-back-btn"
                onPointerDown={onBack}>
          <svg viewBox="0 0 24 12" width={18} height={9} aria-hidden>
            <path d="M 24 6 H 3 M 9 0 L 2 6 L 9 12"
                  stroke="currentColor" strokeWidth="2.4"
                  fill="none" strokeLinecap="square" strokeLinejoin="miter" />
          </svg>
          {t('wall_back')}
        </button>
        <ArchiveIcon className="acg-archive-icon" />
      </div>

      <h1 className="acg-display acg-display--xl">{t('wall_heading')}</h1>
      <p className="acg-deck">{t('wall_sub')}</p>

      <div className="acg-wall-nav">
        {/* Scope = primary navigation (underline tab strip) */}
        <div className="acg-scope-tabs" role="tablist" aria-label="scope">
          <button
            type="button"
            role="tab"
            className={`acg-scope-tab ${scope === 'my' ? 'is-active' : ''}`}
            onPointerDown={() => setScope('my')}
            aria-selected={scope === 'my'}
          >
            {t('scope_my')}
          </button>
          <button
            type="button"
            role="tab"
            className={`acg-scope-tab ${scope === 'all' ? 'is-active' : ''}`}
            onPointerDown={() => setScope('all')}
            aria-selected={scope === 'all'}
          >
            {t('scope_all')}
          </button>
        </div>

        {/* View = secondary preference (compact icon-only toggle) */}
        <div className="acg-view-switch" role="group" aria-label="view mode">
          <button
            type="button"
            className={`acg-view-switch__btn ${view === 'list' ? 'is-active' : ''}`}
            onPointerDown={() => setView('list')}
            aria-label={t('view_list')}
            aria-pressed={view === 'list'}
          >
            <IconList />
          </button>
          <button
            type="button"
            className={`acg-view-switch__btn ${view === 'grid' ? 'is-active' : ''}`}
            onPointerDown={() => setView('grid')}
            aria-label={t('view_grid')}
            aria-pressed={view === 'grid'}
          >
            <IconGrid />
          </button>
        </div>
      </div>

      <div className="acg-perf acg-perf--label" data-label={t('perf_archive')} />

      {!loaded ? (
        <div className="acg-wall-empty">…</div>
      ) : entries.length === 0 ? (
        <div className="acg-wall-empty">{t('wall_empty')}</div>
      ) : view === 'list' ? (
        <ListView entries={entries} liked={liked} onSelect={onView} scope={scope} />
      ) : (
        <GridView entries={entries} liked={liked} onSelect={onView} scope={scope} />
      )}
    </Ticket>
  );
}

// ─────────────── View renderers ───────────────

interface ViewProps {
  entries: WallEntry[];
  liked: Set<string>;
  scope: ScopeMode;
  onSelect: (album: Album) => void;
}

function ListView({ entries, liked, scope, onSelect }: ViewProps) {
  return (
    <ul className="acg-wall-list">
      {entries.map((e, i) => {
        const idx = i + 1;
        const catNum = e.album.catalog ?? `ALT-${String(idx).padStart(3, '0')}`;
        const vinyl = e.album.vinyl ?? vinylFor(e.album.id);
        const isLiked = liked.has(e.album.id);
        const likeCount = displayLikeCount(e.album.id, isLiked);
        return (
          <li key={`${e.userId}-${e.album.id}`}>
            <button type="button" className="acg-wall-row"
                    onPointerDown={() => onSelect(e.album)}>
              <span className="acg-wall-row__stub">No.{String(idx).padStart(2, '0')}</span>
              <div className="acg-wall-row__display">
                <div className="acg-wall-row__vinyl">
                  <RealisticVinyl design={vinyl} catalog={catNum} />
                </div>
                <img className={`acg-wall-row__cover acg-cover-panel__art--${e.album.style}`}
                     src={e.album.imageUrl} alt="" draggable={false} />
              </div>
              <div className="acg-wall-row__info">
                <div className="acg-wall-row__band">{e.album.bandName}</div>
                <div className="acg-wall-row__title">{e.album.title}</div>
                <div className="acg-wall-row__meta">
                  <span>{catNum}</span>
                  <span className="acg-wall-row__sep">·</span>
                  <span>{genreFor(e.album.style)}</span>
                </div>
              </div>
              {scope === 'all' && <LikeBadge liked={isLiked} count={likeCount} />}
              <Arrow className="acg-wall-row__arrow" size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function GridView({ entries, liked, scope, onSelect }: ViewProps) {
  return (
    <ul className="acg-wall-grid">
      {entries.map((e, i) => {
        const idx = i + 1;
        const catNum = e.album.catalog ?? `ALT-${String(idx).padStart(3, '0')}`;
        const isLiked = liked.has(e.album.id);
        const likeCount = displayLikeCount(e.album.id, isLiked);
        return (
          <li key={`${e.userId}-${e.album.id}`}>
            <button type="button" className="acg-wall-tile"
                    onPointerDown={() => onSelect(e.album)}>
              <div className="acg-wall-tile__cover-wrap">
                <img className={`acg-wall-tile__cover acg-cover-panel__art--${e.album.style}`}
                     src={e.album.imageUrl} alt={e.album.title} draggable={false} />
                {scope === 'all' && (
                  <span className="acg-wall-tile__like">
                    <LikeIcon liked={isLiked} />
                    {likeCount}
                  </span>
                )}
              </div>
              <div className="acg-wall-tile__meta">
                <span className="acg-wall-tile__cat">{catNum}</span>
                <span className="acg-wall-tile__band">{e.album.bandName}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LikeIcon({ liked }: { liked: boolean }) {
  return (
    <svg viewBox="0 0 16 14" width={11} height={10} aria-hidden>
      <path
        d="M8 13.5 L 1.5 7.5 a 3.5 3.5 0 0 1 5 -5 L 8 4 L 9.5 2.5 a 3.5 3.5 0 0 1 5 5 Z"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

function LikeBadge({ liked, count }: { liked: boolean; count: number }) {
  return (
    <span className={`acg-like-badge ${liked ? 'is-liked' : ''}`}>
      <LikeIcon liked={liked} />
      <span>{count}</span>
    </span>
  );
}

// ─────────────── Inline icons ───────────────

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 30 26" fill="none"
         stroke="currentColor" strokeWidth={2}
         strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      {/* Three records sticking up out of the crate */}
      <line x1="9"  y1="4" x2="9"  y2="11" />
      <line x1="15" y1="2" x2="15" y2="11" />
      <line x1="21" y1="4" x2="21" y2="11" />
      {/* Crate body */}
      <rect x="2" y="11" width="26" height="13" />
      {/* Label slat across the crate */}
      <line x1="6" y1="18" x2="24" y2="18" />
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
      <rect x="2" y="3" width="3" height="3" />
      <rect x="6" y="3" width="8" height="3" />
      <rect x="2" y="10" width="3" height="3" />
      <rect x="6" y="10" width="8" height="3" />
    </svg>
  );
}

function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor" aria-hidden>
      <rect x="2" y="2" width="5" height="5" />
      <rect x="9" y="2" width="5" height="5" />
      <rect x="2" y="9" width="5" height="5" />
      <rect x="9" y="9" width="5" height="5" />
    </svg>
  );
}

