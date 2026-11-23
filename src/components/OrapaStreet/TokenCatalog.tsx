import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  getAllTileTypes,
  getTileVariants,
} from "../../engine/orapaStreet/tiles";
import TokenIcon from "./TokenIcon";

export default function TokenCatalog() {
  const { t } = useTranslation();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const selectedVariants = selectedToken
    ? getTileVariants(selectedToken)
    : [];

  return (
    <section className="game-container orapa-street-token-catalog">
      <h2 className="game-title">{t("orapaStreet.allTokens")}</h2>
      <Link className="btn-reset orapa-street-token-back" to="/orapa-street-221b">
        {t("orapaStreet.backToPuzzle")}
      </Link>
      {selectedToken ? (
        <>
          <h3 className="orapa-street-token-detail-title">
            {selectedToken} · {t("orapaStreet.variants")}
          </h3>
          <button
            className="btn-reset orapa-street-token-back"
            type="button"
            onClick={() => setSelectedToken(null)}
          >
            {t("orapaStreet.backToTokens")}
          </button>
          <div className="orapa-street-token-grid">
            {selectedVariants.map((tile, index) => (
              <article
                key={`${tile.name}-${index}`}
                className="orapa-street-token-card"
                data-testid={`token-variant-${index + 1}`}
              >
                <h3>{t("orapaStreet.variantLabel", { count: index + 1 })}</h3>
                <TokenIcon tile={tile} />
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="orapa-street-token-grid">
          {getAllTileTypes().map((tile) => (
            <button
              key={tile.name}
              className="orapa-street-token-card orapa-street-token-select"
              data-testid={`token-card-${tile.name}`}
              type="button"
              onClick={() => setSelectedToken(tile.name)}
            >
              <h3>{tile.name}</h3>
              <TokenIcon tile={tile} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
