import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import CoverPlaceholder from './CoverPlaceholder';
import { t } from '../i18n';
import type { VinylDesign } from '../types';

interface Props {
  stage: '' | 'naming' | 'pressing';
  catalog: string;
  vinyl: VinylDesign;
}

const STEPS = [
  'step_master',
  'step_lacquer',
  'step_wax',
  'step_sleeve',
  'step_ship',
];

const STEP_MS = 11_000;

export default function CoverLoading({ stage, catalog, vinyl }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
    const id = setInterval(() => {
      setActiveIdx((i) => Math.min(STEPS.length - 1, i + 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [stage]);

  return (
    <Ticket
      topLabel={t('ticket_label_pressing')}
      catalog={catalog}
      footerHero={t('footer_hero_pressing')}
    >
      <CoverPlaceholder catalog={catalog} variant="pressing" design={vinyl} />

      <div className="acg-press-caption">
        <span className="acg-press-caption__name" key={STEPS[activeIdx]}>
          {t(STEPS[activeIdx])}
        </span>
        <span className="acg-press-caption__hint">{t('loading_fineprint')}</span>
      </div>

      <div className="acg-press-specs" aria-hidden>
        <span className="acg-press-specs__rule" />
        <div className="acg-press-specs__strip">
          <span>33⅓ RPM</span>
          <span className="acg-press-specs__dot">·</span>
          <span>12" LP</span>
          <span className="acg-press-specs__dot">·</span>
          <span>180 G</span>
          <span className="acg-press-specs__dot">·</span>
          <span>SIDE A</span>
        </div>
        <div className="acg-press-specs__plant">
          ALTERU PRESSING PLANT — {catalog}
        </div>
      </div>
    </Ticket>
  );
}
