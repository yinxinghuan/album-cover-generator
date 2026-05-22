import React, { useRef, useState } from 'react';
import Ticket from './Ticket';
import { t } from '../i18n';
import { catalogNumber } from '../utils/catalog';

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
      <h1 className="acg-display acg-display--hero">{t('input_heading')}</h1>

      <div className="acg-meta-grid">
        <Field label="SIDE A" value={t('input_hint_a')} />
        <Field label="SIDE B" value={t('input_hint_b')} />
      </div>

      <div className="acg-perf" />

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
        <span className="acg-press__arrow" aria-hidden>→</span>
      </button>
    </Ticket>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="acg-field">
      <div className="acg-field__label">{label}</div>
      <div className="acg-field__value">{value}</div>
    </div>
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
      <span className="acg-track-in__n">{String(n).padStart(2, '0')}</span>
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
