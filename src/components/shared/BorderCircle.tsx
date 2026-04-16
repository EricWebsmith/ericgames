import type { Color } from '../../engine/arclight/models';
import { GEM_FILL } from './colors';

const DEFAULT_GEM_COLOR = '#999999';
const ARC_STROKE_WIDTH = 3.5;

// SVG path for a clockwise arc from startDeg to endDeg on a circle of radius r at (cx, cy)
function arcSegmentPath(
  cx: number, cy: number, r: number, startDeg: number, endDeg: number,
): string {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const startX = cx + r * Math.cos(startRad);
  const startY = cy + r * Math.sin(startRad);
  const endX = cx + r * Math.cos(endRad);
  const endY = cy + r * Math.sin(endRad);
  const largeArc = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M${startX.toFixed(2)},${startY.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${endX.toFixed(2)},${endY.toFixed(2)}`;
}

interface BorderCircleProps {
  cx: number;
  cy: number;
  r: number;
  colors: Color[];
  isEntry: boolean;
  isExit: boolean;
  label: string;
  onClick: () => void;
  glowFilter?: string;
}

export default function BorderCircle({
  cx, cy, r, colors, isEntry, isExit, label, onClick, glowFilter,
}: BorderCircleProps) {
  const circleFill = isEntry ? '#1e1e5a' : isExit ? '#1a3a1a' : '#111130';
  const circleStroke = isEntry ? '#7777ee' : isExit ? '#44cc44' : '#3a3a7a';
  const textFill = isEntry ? '#ccccff' : isExit ? '#88ff88' : '#8888aa';

  // Deduplicate colors while preserving order so that e.g. ['red','red','blue']
  // renders as 2 arcs (red + blue), not 3.
  const uniqueColors = [...new Set(colors)];
  const count = uniqueColors.length;

  // Arc segments: [startDeg, endDeg] pairs, clockwise from top (-90°)
  // 1 color  → full circle (handled separately)
  // 2 colors → two 180° halves
  // 3 colors → three 120° thirds
  // 4 colors → four 90° quarters
  const arcs: [number, number][] =
    count === 2 ? [[-90, 90], [90, 270]]
      : count === 3 ? [[-90, 30], [30, 150], [150, 270]]
        : count === 4 ? [[-90, 0], [0, 90], [90, 180], [180, 270]]
          : [];

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      aria-label={`Border ${label}`}
    >
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={circleFill}
        stroke={count === 0 ? circleStroke : 'none'}
        strokeWidth={isEntry || isExit ? 2 : 1.5}
        filter={isEntry ? glowFilter : undefined}
      />

      {/* Single color: full-circle stroke */}
      {count === 1 && (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={GEM_FILL[uniqueColors[0]] ?? DEFAULT_GEM_COLOR}
          strokeWidth={ARC_STROKE_WIDTH}
        />
      )}

      {/* Two or three colors: arc segments */}
      {arcs.map(([start, end], i) => (
        <path
          key={i}
          d={arcSegmentPath(cx, cy, r, start, end)}
          fill="none"
          stroke={GEM_FILL[uniqueColors[i]] ?? DEFAULT_GEM_COLOR}
          strokeWidth={ARC_STROKE_WIDTH}
          strokeLinecap="butt"
        />
      ))}

      {/* Border label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textFill}
        fontSize={10}
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {label}
      </text>
    </g>
  );
}
