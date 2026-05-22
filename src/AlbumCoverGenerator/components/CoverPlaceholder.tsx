// Calm placeholder cover panel used by the input + loading phases.
// Same dimensions / chrome as the real cover (chip + cat pill), so the
// composition stays consistent across all phases. The center has a small
// vinyl. In loading mode it spins.

import { t } from '../i18n';

interface Props {
  catalog: string;
  /** When true: vinyl spins, chip says "PRESSING NOW". */
  pressing?: boolean;
}

export default function CoverPlaceholder({ catalog, pressing = false }: Props) {
  const chipKey = pressing ? 'cover_chip_pressing' : 'cover_chip_awaiting';
  return (
    <div className="acg-cover-panel acg-cover-panel--placeholder">
      <div className={`acg-cover-vinyl ${pressing ? 'is-spinning' : ''}`}>
        <div className="acg-cover-vinyl__grooves" />
        <div className="acg-cover-vinyl__label">
          <span className="acg-cover-vinyl__label-text">A</span>
        </div>
        <div className="acg-cover-vinyl__spindle" />
      </div>
      <span className="acg-cover-panel__chip">
        <svg viewBox="0 0 18 12" width="14" height="10" aria-hidden>
          <path d="M2 2h14v8h-3l-1.5-2H6.5L5 10H2z" fill="currentColor" />
        </svg>
        {t(chipKey)}
      </span>
      <span className="acg-cover-panel__cat">{catalog}</span>
      <div className="acg-cover-panel__caption">{t(pressing ? 'cover_caption_pressing' : 'cover_caption_awaiting')}</div>
    </div>
  );
}
