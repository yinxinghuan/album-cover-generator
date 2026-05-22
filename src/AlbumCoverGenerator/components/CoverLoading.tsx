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
  'step_master',   // cut master
  'step_lacquer',  // coat lacquer
  'step_wax',      // press wax
  'step_sleeve',   // ink sleeve
  'step_ship',     // ship out
];

// Approx time per step. The full 5-step ramp lines up roughly with the
// actual gen-image latency (~50-60s). Each step gets ~11s in the
// indicator; if generation finishes early/late the next phase change
// supersedes anyway.
const STEP_MS = 11_000;

export default function CoverLoading({ stage, catalog, vinyl }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    // Reset on every loading mount.
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

      <div className="acg-press-progress">
        <div className="acg-press-progress__label">
          <span className="acg-press-progress__step">
            {String(activeIdx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
          </span>
          <span className="acg-press-progress__name">{t(STEPS[activeIdx])}</span>
        </div>
        <div className="acg-press-progress__track">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={
                'acg-press-progress__seg ' +
                (i < activeIdx ? 'is-done' : i === activeIdx ? 'is-active' : '')
              }
            />
          ))}
        </div>
      </div>

      <p className="acg-fineprint acg-fineprint--center">{t('loading_fineprint')}</p>
    </Ticket>
  );
}
