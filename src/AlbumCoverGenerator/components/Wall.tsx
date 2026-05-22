import { useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { genreFor, trackTime } from '../utils/catalog';
import type { WallEntry } from '../types';

interface Props {
  entries: WallEntry[];
  loaded: boolean;
  onBack: () => void;
}

export default function Wall({ entries, loaded, onBack }: Props) {
  const [focus, setFocus] = useState<WallEntry | null>(null);

  return (
    <Ticket topLabel={t('ticket_label_wall')} catalog={String(entries.length).padStart(2, '0') + ' ON FILE'}
            footerHero={t('footer_hero_done')}>
      <button type="button" className="acg-back-pill" onPointerDown={onBack}>
        ← {t('wall_back')}
      </button>

      <h1 className="acg-display acg-display--xl">{t('wall_heading')}</h1>
      <p className="acg-wall-sub">{t('wall_sub')}</p>

      <div className="acg-perf" />

      {!loaded ? (
        <div className="acg-wall-empty">…</div>
      ) : entries.length === 0 ? (
        <div className="acg-wall-empty">{t('wall_empty')}</div>
      ) : (
        <ul className="acg-wall-list">
          {entries.map((e, i) => (
            <li key={`${e.userId}-${e.album.id}`}>
              <button type="button" className="acg-wall-row"
                      onPointerDown={() => setFocus(e)}>
                <img className={`acg-wall-row__cover acg-cover-panel__art--${e.album.style}`}
                     src={e.album.imageUrl} alt="" draggable={false} />
                <div className="acg-wall-row__info">
                  <div className="acg-wall-row__band">{e.album.bandName}</div>
                  <div className="acg-wall-row__title">{e.album.title}</div>
                  <div className="acg-wall-row__meta">
                    <span>{e.album.catalog ?? `ALT-${String(i + 1).padStart(3, '0')}`}</span>
                    <span>{genreFor(e.album.style)}</span>
                  </div>
                </div>
                <span className="acg-wall-row__arrow">→</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {focus && (
        <div className="acg-modal" onPointerDown={() => setFocus(null)}>
          <div className="acg-modal__card" onPointerDown={(ev) => ev.stopPropagation()}>
            <img className={`acg-modal__cover acg-cover-panel__art--${focus.album.style}`}
                 src={focus.album.imageUrl} alt="" draggable={false} />
            <div className="acg-modal__band">{focus.album.bandName}</div>
            <div className="acg-modal__title">{focus.album.title}</div>
            <ul className="acg-modal__tracks">
              {focus.album.words.map((w, i) => (
                <li key={i}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  <span>{w[0]?.toUpperCase() + w.slice(1).toLowerCase()}</span>
                  <span>{trackTime(w)}</span>
                </li>
              ))}
            </ul>
            <UserChip name={focus.userName} avatar={focus.userAvatarUrl} />
            <button type="button" className="acg-btn acg-btn--solid"
                    onPointerDown={() => setFocus(null)}>
              {t('wall_back')}
            </button>
          </div>
        </div>
      )}
    </Ticket>
  );
}

function UserChip({ name, avatar }: { name?: string; avatar?: string }) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  return (
    <span className="acg-user-chip">
      {avatar ? (
        <img className="acg-user-chip__avatar" src={avatar} alt={name || ''} draggable={false} />
      ) : (
        <span className="acg-user-chip__avatar acg-user-chip__avatar--mono">{initial}</span>
      )}
      <span className="acg-user-chip__name">{name || 'anonymous'}</span>
    </span>
  );
}
