import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { trackTime, genreFor } from '../utils/catalog';
import type { Album } from '../types';

interface Props {
  album: Album;
  onNew: () => void;
  onWall: () => void;
  onShare?: () => void;
  shareLabel?: string;
  shareDisabled?: boolean;
}

export default function CoverResult({
  album,
  onNew,
  onWall,
  onShare,
  shareLabel,
  shareDisabled,
}: Props) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [album.id]);

  const cat = album.catalog ?? 'ALT-001';
  const pressedOn = formatDate(new Date(album.createdAt));

  const totalSec = album.words
    .map((w) => trackTime(w).split(':').map(Number))
    .reduce((acc, [m, s]) => acc + m * 60 + s, 0);
  const tm = Math.floor(totalSec / 60);
  const ts = totalSec % 60;
  const runtime = `${tm}:${String(ts).padStart(2, '0')}`;

  return (
    <div className={`acg-reveal ${revealed ? 'is-revealed' : ''}`}>
      <Ticket
        topLabel={t('ticket_label_done')}
        catalog={cat}
        footerHero={t('footer_hero_done')}
      >
        <div className="acg-cover-panel">
          <img
            src={album.imageUrl}
            alt={`${album.title} — ${album.bandName}`}
            className={`acg-cover-panel__art acg-cover-panel__art--${album.style}`}
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
          <Field label={t('result_genre')} value={genreFor(album.style)} />
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
          {onShare && (
            <button type="button" className="acg-btn acg-btn--ghost"
                    onPointerDown={onShare} disabled={shareDisabled}>
              {shareLabel || t('result_share')}
            </button>
          )}
          <button type="button" className="acg-btn acg-btn--ghost" onPointerDown={onWall}>
            {t('result_wall')}
          </button>
          <button type="button" className="acg-btn acg-btn--solid" onPointerDown={onNew}>
            {t('result_new')}
            <span className="acg-press__arrow" aria-hidden>→</span>
          </button>
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
