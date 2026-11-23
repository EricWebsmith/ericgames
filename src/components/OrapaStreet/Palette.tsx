import { useTranslation } from "react-i18next";
import {
  Orient,
  type Color,
  type ParentTile,
} from "../../engine/orapaStreet/models";
import { getFirstTileVariant } from "../../engine/orapaStreet/tiles";

interface PaletteProps {
  tiles: ParentTile[];
  getTileColor: (colors: Color[]) => string;
}

const TRIANGLE_SIDE = 12;
const TRIANGLE_WIDTH = (Math.sqrt(3) * TRIANGLE_SIDE) / 2;
const TRIANGLE_ROW_GAP = TRIANGLE_SIDE / 2;

export default function Palette({ tiles, getTileColor }: PaletteProps) {
  const { t } = useTranslation();
  const paletteTiles = tiles.map(getFirstTileVariant);

  return (
    <aside
      className="orapa-street-tile-palette"
      aria-labelledby="orapa-street-palette-title"
    >
      <h3 id="orapa-street-palette-title" className="orapa-street-palette-title">
        {t("orapaStreet.availableTiles")}
      </h3>
      {paletteTiles.map((tile) => (
        <div
          key={tile.name}
          className="orapa-street-palette-tile"
          data-testid={`palette-tile-${tile.name}`}
        >
          <svg viewBox="0 0 70 70" aria-hidden="true">
            {tile.subTiles.map((subTile, index) => {
              const x = subTile.q * TRIANGLE_WIDTH + 12;
              const y = subTile.r * TRIANGLE_ROW_GAP + 8;
              const points =
                subTile.orient === Orient.PointyLeft
                  ? `${x},${y + TRIANGLE_SIDE / 2} ${x + TRIANGLE_WIDTH},${y} ${x + TRIANGLE_WIDTH},${y + TRIANGLE_SIDE}`
                  : `${x + TRIANGLE_WIDTH},${y + TRIANGLE_SIDE / 2} ${x},${y} ${x},${y + TRIANGLE_SIDE}`;
              const verticalEdgeX =
                subTile.orient === Orient.PointyLeft
                  ? x + TRIANGLE_WIDTH
                  : x;
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
                      x1={verticalEdgeX}
                      y1={y}
                      x2={verticalEdgeX}
                      y2={y + TRIANGLE_SIDE}
                      stroke={getTileColor(subTile.colors)}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      ))}
    </aside>
  );
}