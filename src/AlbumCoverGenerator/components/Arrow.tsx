// Sharp Bauhaus arrow — line + chevron head, square caps + miter joins.
// (Played-button triangle was rejected as too misleading like a play icon.)

interface Props {
  size?: number;
  className?: string;
}

export default function Arrow({ size = 22, className }: Props) {
  const w = size;
  const h = Math.round(size * 0.5);
  return (
    <svg
      viewBox="0 0 24 12"
      width={w}
      height={h}
      className={className}
      aria-hidden
    >
      <path
        d="M0 6 H 21 M 15 0 L 22 6 L 15 12"
        stroke="currentColor"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
