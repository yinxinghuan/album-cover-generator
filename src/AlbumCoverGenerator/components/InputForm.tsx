import { useEffect, useMemo, useRef, useState } from 'react';
import Ticket from './Ticket';
import CoverPlaceholder from './CoverPlaceholder';
import { t } from '../i18n';
import { catalogNumber } from '../utils/catalog';
import { vinylFor } from '../utils/vinyl';

interface Props {
  onSubmit: (words: [string, string, string]) => void;
  onWall: () => void;
  pressed: number;
  hasFirstTouched: boolean;
}

type Step = 0 | 1 | 2;

export default function InputForm({ onSubmit, onWall, pressed, hasFirstTouched }: Props) {
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [w3, setW3] = useState('');
  const [err, setErr] = useState('');
  const [step, setStep] = useState<Step>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cat = catalogNumber(pressed);
  const today = formatDate(new Date());

  const values: [string, string, string] = [w1, w2, w3];
  const setters = [setW1, setW2, setW3] as const;
  const placeholders = [t('input_w1'), t('input_w2'), t('input_w3')];

  const allFilled = !!(w1.trim() && w2.trim() && w3.trim());
  const previewVinyl = useMemo(() => {
    if (!allFilled) return undefined;
    return vinylFor(`${w1.trim()}|${w2.trim()}|${w3.trim()}`.toLowerCase());
  }, [allFilled, w1, w2, w3]);

  const currentValue = values[step];
  const canAdvance = currentValue.trim().length > 0;

  // Keep the input focused across step changes so iOS keeps the keyboard
  // open. Only refocus if the user has already engaged the page — Aigram
  // preloads games and we must not pop the keyboard on cold mount while
  // the previous game is still on screen.
  useEffect(() => {
    if (!hasFirstTouched) return;
    inputRef.current?.focus();
  }, [step, hasFirstTouched]);

  const submitAll = () => {
    const a = w1.trim(), b = w2.trim(), c = w3.trim();
    if (!a || !b || !c) {
      setErr(t('err_words'));
      if (!a) setStep(0);
      else if (!b) setStep(1);
      else setStep(2);
      return;
    }
    setErr('');
    onSubmit([a, b, c]);
  };

  const goTo = (s: Step) => {
    if (s === step) return;
    setStep(s);
    setErr('');
  };

  const next = () => {
    if (!canAdvance) return;
    if (step < 2) goTo((step + 1) as Step);
    else submitAll();
  };

  // Footer hero: "next track" on steps 0/1, "order a pressing" on step 2.
  const footerHeroLabel = step < 2 ? t('wizard_next') : t('footer_hero_in');

  return (
    <Ticket
      topLabel={t('ticket_label_in')}
      catalog={cat}
      footerHero={footerHeroLabel}
      onFooterHeroClick={next}
      footerLeftAction={{ label: t('wall_link'), onClick: onWall }}
    >
      <CoverPlaceholder
        catalog={cat}
        variant={allFilled ? 'preview' : 'empty'}
        design={previewVinyl}
      />

      <div className="acg-orderline">
        <span className="acg-orderline__label">{t('order_placed')}</span>
        <span className="acg-orderline__value">{today}</span>
        <span className="acg-orderline__sep">/</span>
        <span className="acg-orderline__value">{t('form_no')}</span>
      </div>

      <h1 className="acg-display acg-display--hero">{t('input_heading')}</h1>
      <p className="acg-deck">{t('input_deck')}</p>

      <div className="acg-perf acg-perf--label" data-label={t('perf_a_side')} />

      <div className="acg-wizard">
        <div className="acg-wizard__head">
          <span key={`label-${step}`} className="acg-wizard__step-label">
            TR.{String(step + 1).padStart(2, '0')}/03
          </span>
          <div className="acg-wizard__dots" role="tablist">
            {[0, 1, 2].map((i) => {
              const filled = !!values[i].trim();
              const active = i === step;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Track ${i + 1}`}
                  className={
                    'acg-wizard__dot' +
                    (active ? ' acg-wizard__dot--active' : '') +
                    (filled && !active ? ' acg-wizard__dot--filled' : '')
                  }
                  // Prevent focus shift so the on-screen keyboard stays open
                  // while user taps between dots.
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={() => {
                    goTo(i as Step);
                    // Synchronously re-focus the input; some iOS versions
                    // briefly blur on button tap even without focus shift.
                    inputRef.current?.focus();
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="acg-wizard__field-wrap">
          <span key={`pulse-${step}`} className="acg-wizard__pulse" aria-hidden />
          <input
            ref={inputRef}
            className="acg-wizard__field"
            type="text"
            inputMode="text"
            // NOTE: do NOT set autoCorrect="off" / spellCheck={false}.
            // Those together suppress the iOS IME candidate strip — the
            // bar with suggestions that Chinese pinyin / Japanese kana /
            // Korean hangul depend on for word selection. Leaving them at
            // their defaults restores the native keyboard experience.
            autoComplete="off"
            autoCapitalize="none"
            enterKeyHint={step < 2 ? 'next' : 'done'}
            maxLength={20}
            placeholder={placeholders[step]}
            value={currentValue}
            onChange={(e) => setters[step](e.target.value.replace(/\s+/g, ' ').slice(0, 20))}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); next(); } }}
          />
        </div>
      </div>

      {err && <div className="acg-err">{err}</div>}

      <p className="acg-fineprint">{t('input_fineprint')}</p>
      {!hasFirstTouched && <p className="acg-fineprint" aria-hidden />}
    </Ticket>
  );
}

function formatDate(d: Date): string {
  // 22 MAY 2026
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
