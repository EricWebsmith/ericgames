import type { Color } from '../../engine/orapaStreet/models';
import { GEM_FILL } from './colors';

interface ResultCircleProps {
  cx: number;
  cy: number;
  r: number;
  testId: string;
  colors: Color[];
}

function getSectorPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const startRadians = (startAngle * Math.PI) / 180;
  const endRadians = (endAngle * Math.PI) / 180;
  const startX = cx + r * Math.cos(startRadians);
  const startY = cy + r * Math.sin(startRadians);
  const endX = cx + r * Math.cos(endRadians);
  const endY = cy + r * Math.sin(endRadians);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

export default function ResultCircle({ cx, cy, r, testId, colors }: ResultCircleProps) {
  const uniqueColors = [...new Set(colors)];
  uniqueColors.sort(); // Sort it so the gamer does not know which color is met first.
  const sectorAngle = uniqueColors.length > 0 ? 360 / uniqueColors.length : 0;

  return (
    <>
      {uniqueColors.length === 1 && (
        <circle cx={cx} cy={cy} r={r} fill={GEM_FILL[uniqueColors[0]]} />
      )}

      <circle
        data-testid={testId}
        cx={cx}
        cy={cy}
        r={r}
        fill='none'
        stroke="#a9bfd5"
        strokeDasharray="3 2"
        strokeWidth={1.5}
      />
      {uniqueColors.length > 1 && uniqueColors.map((color, index) => {
        const startAngle = -90 + index * sectorAngle;
        return (
          <path
            key={color}
            d={getSectorPath(cx, cy, r, startAngle, startAngle + sectorAngle)}
            fill={GEM_FILL[color]}
          />
        );
      })}
    </>
  );
}
