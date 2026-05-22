// Bauhaus-geometric reaction icons.
// Solid filled shapes, sharp joins (miter), no rounded caps —
// matches the rest of the design system (watermark, label mark,
// archive pictogram). 16×16 viewBox, currentColor fill.

import type { ReactionKind } from '../types';

interface IconProps {
  size?: number;
  className?: string;
}

export function IconHeart({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
         className={className} aria-hidden>
      <path
        d="M8 14.5 L 1.6 7.6 A 3.6 3.6 0 0 1 7.2 3.4 L 8 4.4 L 8.8 3.4 A 3.6 3.6 0 0 1 14.4 7.6 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function IconFire({ size = 14, className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
         className={className} aria-hidden>
      {/* Outer flame — angular tongue, three peaks ridged inward */}
      <path
        d="M8 1 L 10.4 4.2 L 9.2 5.6 L 12.5 8 L 11 10.2 L 13 14 L 8 14.6 L 3 14 L 5 10.2 L 3.5 8 L 6.8 5.6 L 5.6 4.2 Z"
        fill="currentColor"
        strokeLinejoin="miter"
      />
      {/* Inner highlight cutout — gives the flame depth */}
      <path
        d="M8 6 L 9.4 8.4 L 8 11 L 6.6 8.4 Z"
        fill="rgba(0,0,0,0.22)"
      />
    </svg>
  );
}

export function IconMind({ size = 14, className }: IconProps) {
  // Eight-point starburst — "mind blown" abstracted to a radiating
  // explosion, more legible at 16px than a brain or face glyph.
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
         className={className} aria-hidden>
      <path
        d="M8 0.5 L 9.2 5.4 L 13.6 2.5 L 10.6 6.8 L 15.5 8 L 10.6 9.2 L 13.6 13.5 L 9.2 10.6 L 8 15.5 L 6.8 10.6 L 2.4 13.5 L 5.4 9.2 L 0.5 8 L 5.4 6.8 L 2.4 2.5 L 6.8 5.4 Z"
        fill="currentColor"
        strokeLinejoin="miter"
      />
      <circle cx="8" cy="8" r="1.4" fill="rgba(0,0,0,0.4)" />
    </svg>
  );
}

export function IconEye({ size = 14, className }: IconProps) {
  // Solid almond eye + pupil hole via even-odd fill — single path.
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}
         className={className} aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0.5 8 A 8 5 0 0 1 15.5 8 A 8 5 0 0 1 0.5 8 Z M 8 10.6 A 2.6 2.6 0 0 0 8 5.4 A 2.6 2.6 0 0 0 8 10.6 Z"
        fill="currentColor"
      />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}

const MAP: Record<ReactionKind, typeof IconHeart> = {
  heart: IconHeart,
  fire:  IconFire,
  mind:  IconMind,
  eye:   IconEye,
};

interface ReactionIconProps extends IconProps {
  kind: ReactionKind;
}

export default function ReactionIcon({ kind, ...rest }: ReactionIconProps) {
  const C = MAP[kind];
  return <C {...rest} />;
}
