// Cover panel placeholder shown by the input + loading phases.
//
// variant=empty    → label-less Bauhaus disc (no input yet)
// variant=preview  → label-less colored realistic vinyl (input ready;
//                     color rolls from the typed words, updates on edit)
// variant=pressing → spinning realistic vinyl with label (loading)
//
// The chip + cat pill that exist on the result page's cover are NOT
// rendered here — they duplicate the ticket header's chrome and only
// belong on a real printed cover artifact.

import { t } from '../i18n';
import { BauhausVinyl, RealisticVinyl } from './Vinyl';
import type { VinylDesign } from '../types';

interface Props {
  variant: 'empty' | 'preview' | 'pressing';
  catalog: string;
  /** Required for 'preview' + 'pressing'. */
  design?: VinylDesign;
}

export default function CoverPlaceholder({ variant, catalog, design }: Props) {
  const captionKey =
    variant === 'pressing' ? 'cover_caption_pressing'
    : variant === 'preview' ? 'cover_caption_preview'
    : 'cover_caption_awaiting';

  return (
    <div className="acg-cover-panel acg-cover-panel--placeholder">
      {variant === 'empty' && (
        // Mount key tied to variant so the next mount of preview/pressing
        // replays the insertion animation.
        <div className="acg-vinyl" key="empty">
          <BauhausVinyl labelStyle="blank" />
        </div>
      )}
      {variant === 'preview' && design && (
        <div className="acg-vinyl" key={`preview-${design.color}-${design.finish}`}>
          <RealisticVinyl design={design} labelStyle="blank" inserting />
        </div>
      )}
      {variant === 'pressing' && design && (
        <div className="acg-vinyl" key="pressing">
          <RealisticVinyl design={design} catalog={catalog} spinning inserting />
        </div>
      )}
      <div className="acg-cover-panel__caption">{t(captionKey)}</div>
    </div>
  );
}
