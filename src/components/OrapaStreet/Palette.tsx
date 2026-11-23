import { useTranslation } from "react-i18next";
import { Link, useInRouterContext } from "react-router-dom";
import type { ParentTile } from "../../engine/orapaStreet/models";
import { getFirstTileVariant } from "../../engine/orapaStreet/tiles";
import TokenIcon from "./TokenIcon";

interface PaletteProps {
  tiles: ParentTile[];
}

export default function Palette({ tiles }: PaletteProps) {
  const { t } = useTranslation();
  const paletteTiles = tiles.map(getFirstTileVariant);
  const contents = (
    <aside
      className="orapa-street-tile-palette"
      aria-labelledby="orapa-street-palette-title"
    >
      <h3
        id="orapa-street-palette-title"
        className="orapa-street-palette-title"
      >
        {t("orapaStreet.availableTiles")}
      </h3>
      {paletteTiles.map((tile) => (
        <div
          key={tile.name}
          className="orapa-street-palette-tile"
          data-testid={`palette-tile-${tile.name}`}
        >
          <TokenIcon tile={tile} />
        </div>
      ))}
    </aside>
  );

  if (useInRouterContext()) {
    return (
      <Link
        className="orapa-street-palette-link"
        to="/orapa-street-221b/tokens"
        aria-label={t("orapaStreet.viewAllTokens")}
      >
        {contents}
      </Link>
    );
  }
  return (
    <a
      className="orapa-street-palette-link"
      href="#/orapa-street-221b/tokens"
      aria-label={t("orapaStreet.viewAllTokens")}
    >
      {contents}
    </a>
  );
}