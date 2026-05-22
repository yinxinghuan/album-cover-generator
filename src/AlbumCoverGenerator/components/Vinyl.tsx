// Two vinyl forms used across the game:
//
//   <BauhausVinyl />            — flat geometric schematic (input empty)
//   <RealisticVinyl design= />  — pressed product, color + finish per album
//
// labelStyle:
//   'full'  — brand + catalog + side text (loading, result)
//   'blank' — solid blank white label, no text (input preview state —
//             record pressed but label not yet printed)
//
// The realistic vinyl's outer wrapper holds the static drop shadow +
// specular highlight; the inner spinner rotates.

import type { VinylDesign } from '../types';

type LabelStyle = 'full' | 'blank';

interface BauhausProps {
  labelStyle?: LabelStyle;
}

export function BauhausVinyl({ labelStyle = 'full' }: BauhausProps = {}) {
  const cream = '#FFE2C9';
  const blankLabel = '#f5ebd5'; // unprinted paper white
  const groove = (r: number, op = 0.32) => (
    <circle cx="50" cy="50" r={r} fill="none"
            stroke={cream} strokeWidth="0.45" strokeOpacity={op} />
  );
  return (
    <svg viewBox="0 0 100 100" className="acg-vinyl__svg" aria-hidden>
      <circle cx="50" cy="50" r="48" fill="none"
              stroke={cream} strokeWidth="0.9" strokeOpacity="0.55" />
      {groove(45, 0.38)}
      {groove(43, 0.38)}
      {groove(41, 0.34)}
      {groove(39, 0.30)}
      {groove(34, 0.30)}
      {groove(32, 0.28)}
      {groove(30, 0.26)}
      <circle cx="50" cy="50" r="23" fill="none"
              stroke={cream} strokeWidth="0.6" strokeOpacity="0.4" />
      {labelStyle === 'full' ? (
        <>
          <circle cx="50" cy="50" r="22" fill="#FF6A00" />
          <circle cx="50" cy="50" r="6" fill="none" stroke="#0a0a0a"
                  strokeWidth="0.5" strokeOpacity="0.45" />
          <rect x="49.4" y="29.5" width="1.2" height="14" rx="0.6" fill={cream} />
        </>
      ) : (
        <>
          {/* Blank unprinted paper label — no text, no tick */}
          <circle cx="50" cy="50" r="22" fill={blankLabel} />
          <circle cx="50" cy="50" r="6" fill="none" stroke="#0a0a0a"
                  strokeWidth="0.4" strokeOpacity="0.2" />
        </>
      )}
      <circle cx="50" cy="50" r="1.8" fill="#0a0a0a" />
    </svg>
  );
}

interface RealisticVinylProps {
  design: VinylDesign;
  catalog?: string;
  spinning?: boolean;
  /** When true, an extra mount-time insertion animation plays once. */
  inserting?: boolean;
  /** 'full' = brand + cat + side text. 'blank' = unprinted paper label. */
  labelStyle?: LabelStyle;
}

export function RealisticVinyl({
  design, catalog, spinning, inserting, labelStyle = 'full',
}: RealisticVinylProps) {
  const cls = [
    'acg-vinyl-real',
    `acg-vinyl-real--${design.color}`,
    `acg-vinyl-real--${design.finish}`,
    inserting ? 'is-inserting' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div className="acg-vinyl-real__shadow" aria-hidden />
      <div className={`acg-vinyl-real__spinner ${spinning ? 'is-spinning' : ''}`}>
        <div className="acg-vinyl-real__disc" />
        <div className="acg-vinyl-real__rim" />
        {labelStyle === 'full' ? (
          design.labelArt === 'logo' ? (
            <>
              <div className="acg-vinyl-real__label acg-vinyl-real__label--logo">
                <span className="acg-vinyl-real__label-mark" aria-hidden />
                <div className="acg-vinyl-real__label-cat acg-vinyl-real__label-cat--logo">
                  {catalog ?? 'ALT'}
                </div>
              </div>
              <div className="acg-vinyl-real__inner-stripe" aria-hidden />
            </>
          ) : (
            <>
              <div className="acg-vinyl-real__label">
                <div className="acg-vinyl-real__label-brand">ALTERU</div>
                <div className="acg-vinyl-real__label-cat">{catalog ?? 'ALT'}</div>
                <div className="acg-vinyl-real__label-side">SIDE A · 33⅓</div>
              </div>
              <div className="acg-vinyl-real__inner-stripe" aria-hidden />
            </>
          )
        ) : (
          <div className="acg-vinyl-real__label acg-vinyl-real__label--blank" aria-hidden />
        )}
        <div className="acg-vinyl-real__spindle" />
      </div>
      <div className="acg-vinyl-real__highlight" aria-hidden />
    </div>
  );
}
