import { useEffect, useState } from 'react';
import Ticket from './Ticket';
import CoverPlaceholder from './CoverPlaceholder';
import { t } from '../i18n';

interface Props {
  stage: '' | 'naming' | 'pressing';
}

const STEP_KEYS = [
  'step_master',
  'step_lacquer',
  'step_wax',
  'step_sleeve',
  'step_ship',
];

export default function CoverLoading({ stage }: Props) {
  // Walk through the steps over time. Naming stage progresses through 1-2,
  // pressing stage progresses through 3-5. The motion is purely visual —
  // the real generation timing is non-deterministic.
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    setActiveIdx(stage === 'naming' ? 0 : 2);
    let id: ReturnType<typeof setInterval> | null = null;
    if (stage === 'naming') {
      id = setInterval(() => setActiveIdx(i => Math.min(1, i + 1)), 3500);
    } else if (stage === 'pressing') {
      id = setInterval(() => setActiveIdx(i => Math.min(4, i + 1)), 4200);
    }
    return () => { if (id) clearInterval(id); };
  }, [stage]);

  return (
    <Ticket
      topLabel={t('ticket_label_pressing')}
      catalog="ALT-???"
      footerHero={t('footer_hero_pressing')}
    >
      <CoverPlaceholder catalog="ALT-???" pressing />

      <h1 className="acg-display acg-display--hero">{t('loading_status')}</h1>
      <p className="acg-deck">{t('loading_sub')}</p>

      <div className="acg-perf acg-perf--label" data-label={t('perf_process')} />

      <ol className="acg-process">
        {STEP_KEYS.map((k, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          const cls = done ? 'is-done' : active ? 'is-active' : '';
          return (
            <li key={k} className={`acg-process__step ${cls}`}>
              <span className="acg-process__mark" aria-hidden>
                {done ? '✓' : active ? '◉' : '◦'}
              </span>
              <span className="acg-process__name">{t(k)}</span>
              {active && <span className="acg-process__pulse" aria-hidden />}
            </li>
          );
        })}
      </ol>

      <div className="acg-loading-bar"><span /></div>

      <p className="acg-fineprint">{t('loading_fineprint')}</p>
    </Ticket>
  );
}
