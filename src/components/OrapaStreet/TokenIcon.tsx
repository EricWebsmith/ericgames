import {
  Orient,
  TriangleLine,
  type ParentTile,
} from "../../engine/orapaStreet/models";
import { getTileColor } from "./tileColor";

interface TokenIconProps {
  tile: ParentTile;
}

const TRIANGLE_SIDE = 12;
const TRIANGLE_WIDTH = (Math.sqrt(3) * TRIANGLE_SIDE) / 2;
const TRIANGLE_ROW_GAP = TRIANGLE_SIDE / 2;

export default function TokenIcon({ tile }: TokenIconProps) {
  const minQ = Math.min(...tile.subTiles.map((subTile) => subTile.q));
  const maxQ = Math.max(...tile.subTiles.map((subTile) => subTile.q));
  const minR = Math.min(...tile.subTiles.map((subTile) => subTile.r));
  const maxR = Math.max(...tile.subTiles.map((subTile) => subTile.r));
  const padding = 4;
  const viewBoxX = minQ * TRIANGLE_WIDTH - padding;
  const viewBoxY = minR * TRIANGLE_ROW_GAP - padding;
  const viewBoxWidth =
    (maxQ - minQ) * TRIANGLE_WIDTH + TRIANGLE_WIDTH + padding * 2;
  const viewBoxHeight =
    (maxR - minR) * TRIANGLE_ROW_GAP + TRIANGLE_SIDE + padding * 2;

  return (
    <svg
      className="orapa-street-token-icon"
      viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
      aria-hidden="true"
    >
      {tile.subTiles.map((subTile, index) => {
        const x = subTile.q * TRIANGLE_WIDTH;
        const y = subTile.r * TRIANGLE_ROW_GAP;
        const points =
          subTile.orient === Orient.PointyLeft
            ? `${x},${y + TRIANGLE_SIDE / 2} ${x + TRIANGLE_WIDTH},${y} ${x + TRIANGLE_WIDTH},${y + TRIANGLE_SIDE}`
            : `${x + TRIANGLE_WIDTH},${y + TRIANGLE_SIDE / 2} ${x},${y} ${x},${y + TRIANGLE_SIDE}`;
        const vertices =
          subTile.orient === Orient.PointyLeft
            ? [
                { x, y: y + TRIANGLE_SIDE / 2 },
                { x: x + TRIANGLE_WIDTH, y },
                { x: x + TRIANGLE_WIDTH, y: y + TRIANGLE_SIDE },
              ]
            : [
                { x: x + TRIANGLE_WIDTH, y: y + TRIANGLE_SIDE / 2 },
                { x, y },
                { x, y: y + TRIANGLE_SIDE },
              ];
        const lineEdgeIndex = {
          [TriangleLine.Top]: 0,
          [TriangleLine.Vertical]: 1,
          [TriangleLine.Bottom]: 2,
        }[subTile.lineTileLine];
        const lineStart = vertices[lineEdgeIndex];
        const lineEnd = vertices[(lineEdgeIndex + 1) % vertices.length];

        return (
          <g key={`${subTile.parentName}-${index}`}>
            {!subTile.lineTile && (
              <polygon
                points={points}
                fill={getTileColor(subTile.colors)}
                stroke="#7ba4bd"
                strokeWidth="1"
              />
            )}
            {subTile.lineTile && (
              <line
                x1={lineStart.x}
                y1={lineStart.y}
                x2={lineEnd.x}
                y2={lineEnd.y}
                stroke={getTileColor(subTile.colors)}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
