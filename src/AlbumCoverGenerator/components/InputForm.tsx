import React, { useMemo, useRef, useState } from 'react';
import Ticket from './Ticket';
import Arrow from './Arrow';
import CoverPlaceholder from './CoverPlaceholder';
import { t } from '../i18n';
import { catalogNumber } from '../utils/catalog';
import { vinylFor } from '../utils/vinyl';

interface Props {
  onSubmit: (words: [string, string, string]) => void;
  pressed: number;
  hasFirstTouched: boolean;
}

export default function InputForm({ onSubmit, pressed, hasFirstTouched }: Props) {
  const [w1, setW1] = useState('');
  const [w2, setW2] = useState('');
  const [w3, setW3] = useState('');
  const [err, setErr] = useState('');
  const r1 = useRef<HTMLInputElement>(null);
  const r2 = useRef<HTMLInputElement>(null);
  const r3 = useRef<HTMLInputElement>(null);

  const cat = catalogNumber(pressed);
  const today = formatDate(new Date());

  // Preview vinyl: once all three tracks are typed, roll a vinyl design
  // from the words. Deterministic per word-set, so edits re-roll.
  const ready = !!(w1.trim() && w2.trim() && w3.trim());
  const previewVinyl = useMemo(() => {
    if (!ready) return undefined;
    return vinylFor(`${w1.trim()}|${w2.trim()}|${w3.trim()}`.toLowerCase());
  }, [ready, w1, w2, w3]);

  const submit = () => {
    const a = w1.trim(), b = w2.trim(), c = w3.trim();
    if (!a || !b || !c) {
      setErr(t('err_words'));
      if (!a) r1.current?.focus();
      else if (!b) r2.current?.focus();
      else r3.current?.focus();
      return;
    }
    setErr('');
    onSubmit([a, b, c]);
  };

  return (
    <Ticket topLabel={t('ticket_label_in')} catalog={cat} footerHero={t('footer_hero_in')}>
      <CoverPlaceholder
        catalog={cat}
        variant={ready ? 'preview' : 'empty'}
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

      <ol className="acg-tracks">
        <TrackInput n={1} placeholder={t('input_w1')} value={w1} setValue={setW1}
                    inputRef={r1} onEnter={() => r2.current?.focus()} />
        <TrackInput n={2} placeholder={t('input_w2')} value={w2} setValue={setW2}
                    inputRef={r2} onEnter={() => r3.current?.focus()} />
        <TrackInput n={3} placeholder={t('input_w3')} value={w3} setValue={setW3}
                    inputRef={r3} onEnter={submit} />
      </ol>

      {err && <div className="acg-err">{err}</div>}

      <button
        type="button"
        className={`acg-press ${!hasFirstTouched ? 'is-pulse' : ''}`}
        onPointerDown={submit}
      >
        {t('input_press')}
        <Arrow className="acg-press__arrow" size={26} />
      </button>

      <p className="acg-fineprint">{t('input_fineprint')}</p>
    </Ticket>
  );
}

interface TrackInputProps {
  n: number;
  placeholder: string;
  value: string;
  setValue: (s: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onEnter: () => void;
}

function TrackInput({ n, placeholder, value, setValue, inputRef, onEnter }: TrackInputProps) {
  return (
    <li className="acg-track-in">
      <span className="acg-track-in__n">TR.{String(n).padStart(2, '0')}</span>
      <input
        ref={inputRef}
        className="acg-track-in__field"
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={20}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\s+/g, ' ').slice(0, 20))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } }}
      />
    </li>
  );
}

function formatDate(d: Date): string {
  // 22 MAY 2026
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
