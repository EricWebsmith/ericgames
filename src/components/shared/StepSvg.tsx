interface StepSvgProps {
  tileNo: number;
  rotate: 1 | -1;
  ariaLabel: string;
}

const STEP_STROKE = '#9de7ff';

export default function StepSvg({ tileNo, rotate, ariaLabel }: StepSvgProps) {
  const isClockwise = rotate === 1;

  return (
    <svg width={44} height={44} viewBox="0 0 44 44" role="img" aria-label={ariaLabel}>
      <circle cx="22" cy="22" r="14" fill="none" stroke={STEP_STROKE} strokeWidth="1.4" opacity="0.25" />
      <path
        d={isClockwise ? 'M22 8 A14 14 0 1 1 34.5 30' : 'M22 8 A14 14 0 1 0 9.5 30'}
        fill="none"
        stroke={STEP_STROKE}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <polygon
        points={isClockwise ? '34.5,30 29.8,28.6 31.6,33.2' : '9.5,30 14.2,28.6 12.4,33.2'}
        fill={STEP_STROKE}
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontWeight="bold" fontSize={12}>
        {tileNo}
      </text>
    </svg>
  );
}
