import { useState, useMemo } from 'react';
import Ticket from './Ticket';
import Arrow from './Arrow';
import { RealisticVinyl } from './Vinyl';
import ReactionIcon from './ReactionIcons';
import { t } from '../i18n';
import { genreFor } from '../utils/catalog';
import { vinylFor } from '../utils/vinyl';
import { totalReactions, dominantReaction } from '../utils/reactions';
import type { Album, ReactionKind, WallEntry } from '../types';

interface Props {
  community: WallEntry[];
  mine: Album[];
  loaded: boolean;
  /** Map: album.id → set of reaction kinds I've given. */
  myReactions: Map<string, Set<ReactionKind>>;
  onBack: () => void;
  onView: (album: Album) => void;
  onNew: () => void;
}

type ViewMode = 'list' | 'grid';
type ScopeMode = 'my' | 'all';

export default function Wall({ community, mine, loaded, myReactions, onBack, onView, onNew }: Props) {
  const [view, setView] = useState<ViewMode>('list');
  const [scope, setScope] = useState<ScopeMode>(mine.length > 0 ? 'my' : 'all');

  const reactionsOf = (id: string): Set<ReactionKind> =>
    myReactions.get(id) ?? new Set<ReactionKind>();

  // MY → chronological (newest first, already that way in mine[]).
  // ALL → sorted by total reaction count desc.
  const entries: WallEntry[] = useMemo(() => {
    if (scope === 'my') {
      return mine.map((a) => ({ userId: 'self', userName: 'You', album: a }));
    }
    return [...community].sort((a, b) => {
      const ca = totalReactions(a.album.id, reactionsOf(a.album.id));
      const cb = totalReactions(b.album.id, reactionsOf(b.album.id));
      return cb - ca;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, mine, community, myReactions]);

  const total = entries.length;

  return (
    <Ticket
      topLabel={t('ticket_label_wall')}
      catalog={`${String(total).padStart(2, '0')} ${t('on_file')}`}
      footerHero={t('result_new')}
      onFooterHeroClick={onNew}
      footerLeftAction={{ label: t('wall_back'), onClick: onBack }}
    >
      <div className="acg-archive-head">
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
        <ListView entries={entries} reactionsOf={reactionsOf} onSelect={onView} scope={scope} />
      ) : (
        <GridView entries={entries} reactionsOf={reactionsOf} onSelect={onView} scope={scope} />
      )}
    </Ticket>
  );
}

// ─────────────── View renderers ───────────────

interface ViewProps {
  entries: WallEntry[];
  reactionsOf: (id: string) => Set<ReactionKind>;
  scope: ScopeMode;
  onSelect: (album: Album) => void;
}

function ListView({ entries, reactionsOf, scope, onSelect }: ViewProps) {
  return (
    <ul className="acg-wall-list">
      {entries.map((e, i) => {
        const idx = i + 1;
        const catNum = e.album.catalog ?? `ALT-${String(idx).padStart(3, '0')}`;
        const vinyl = e.album.vinyl ?? vinylFor(e.album.id);
        const myR = reactionsOf(e.album.id);
        const dominant = dominantReaction(e.album.id, myR);
        const total = totalReactions(e.album.id, myR);
        return (
          <li key={`${e.userId}-${e.album.id}`}>
            <button type="button" className="acg-wall-row"
                    onClick={() => onSelect(e.album)}>
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
                  <span>{genreFor(e.album.style, e.album.subtitle)}</span>
                </div>
              </div>
              {scope === 'all'
                ? <ReactionBadge dominant={dominant} count={total} mine={myR.size > 0} />
                : <span />}
              <Arrow className="acg-wall-row__arrow" size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function GridView({ entries, reactionsOf, scope, onSelect }: ViewProps) {
  return (
    <ul className="acg-wall-grid">
      {entries.map((e, i) => {
        const idx = i + 1;
        const catNum = e.album.catalog ?? `ALT-${String(idx).padStart(3, '0')}`;
        const myR = reactionsOf(e.album.id);
        const dominant = dominantReaction(e.album.id, myR);
        const total = totalReactions(e.album.id, myR);
        return (
          <li key={`${e.userId}-${e.album.id}`}>
            <button type="button" className="acg-wall-tile"
                    onClick={() => onSelect(e.album)}>
              <div className="acg-wall-tile__cover-wrap">
                <img className={`acg-wall-tile__cover acg-cover-panel__art--${e.album.style}`}
                     src={e.album.imageUrl} alt={e.album.title} draggable={false} />
                {scope === 'all' && (
                  <span className="acg-wall-tile__like">
                    <ReactionIcon kind={dominant} size={10} />
                    {total}
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

function ReactionBadge({ dominant, count, mine }: { dominant: ReactionKind; count: number; mine: boolean }) {
  return (
    <span className={`acg-like-badge ${mine ? 'is-liked' : ''}`}>
      <ReactionIcon kind={dominant} size={11} />
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

