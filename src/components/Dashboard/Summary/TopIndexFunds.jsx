

import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMarketIndexFunds, selectIndexFunds } from "../../../redux/slices/marketSlice";
import "./TopIndexFunds.css";
import "../../../styles/SectionHeadingsTheme.css";

// Simple deterministic color/monogram per index, since these aren't
// ISIN-backed equities — instrumentMapService.buildLogoUrl() only works
// for stocks, indices have no ISIN and so no real logo to fetch from
// IndianAPI/Upstox. This gives each index a stable, distinct "brand"
// look instead of a generic placeholder icon repeated 10 times.
const INDEX_THEME = {
  NIFTY50: { label: "N50", hue: 210 },
  SENSEX: { label: "SNX", hue: 25 },
  NIFTYBANK: { label: "BANK", hue: 150 },
  NIFTYIT: { label: "IT", hue: 265 },
  NIFTYFMCG: { label: "FMCG", hue: 95 },
  NIFTYAUTO: { label: "AUTO", hue: 15 },
  NIFTYPHARMA: { label: "PHRM", hue: 340 },
  NIFTYMETAL: { label: "MTL", hue: 200 },
  NIFTYENERGY: { label: "NRG", hue: 45 },
  NIFTYREALTY: { label: "RLTY", hue: 280 },
};

function IndexBadge({ symbol }) {
  const theme = INDEX_THEME[symbol] || { label: symbol?.slice(0, 3), hue: 220 };
  return (
    <div
      className="index-fund-card__badge"
      style={{
        background: `hsl(${theme.hue} 70% 94%)`,
        color: `hsl(${theme.hue} 55% 32%)`,
      }}
    >
      {theme.label}
    </div>
  );
}

export default function TopIndexFunds() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const indexFunds = useSelector(selectIndexFunds);

  useEffect(() => {
    dispatch(fetchMarketIndexFunds());
    // Local poll — remove if a socket feed or a shared parent poller
    // already refreshes state.market.indexFunds elsewhere; no need to
    // double-poll the same slice.
    const id = setInterval(() => {
      dispatch(fetchMarketIndexFunds());
    }, 10000);
    return () => clearInterval(id);
  }, [dispatch]);

  const hasData = indexFunds && indexFunds.length > 0;
  const skeletonCount = 10;

  // UPDATED — was setOpenSymbol(idx.symbol) to open IndexDetailModal in
  // a popup. Now routes to the same /stock/:symbol page used for
  // regular equities — StockDetailPanel.jsx detects index symbols (see
  // INDEX_SYMBOLS there) and renders a trimmed version of that same
  // page (chart + today's stats only, no Buy/Sell/fundamentals/news)
  // instead of the old standalone modal.
  const openIndexDetail = (symbol) => navigate(`/stock/${symbol}`);

  return (
    <div className="index-fund-section">
      <div className="section-heading">
        <div className="section-heading__text">
          <span className="section-heading__title">Top Index Funds</span>
          <span className="section-heading__subtitle">
            Sensex, Nifty and the sector indices that move them
          </span>
        </div>
      </div>

      <div className="index-fund-strip scroll-area">
        {hasData
          ? indexFunds.map((idx) => {
              const isUp = idx.dayChangePercent >= 0;
              return (
                <button
                  key={idx.symbol}
                  type="button"
                  className="index-fund-card"
                  onClick={() => openIndexDetail(idx.symbol)}
                >
                  <IndexBadge symbol={idx.symbol} />
                  <div className="index-fund-card__text">
                    <span className="index-fund-card__name">{idx.name}</span>
                    <span className="index-fund-card__value numeric">
                      {idx.ltp?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </span>
                    <span className={`index-fund-card__change ${isUp ? "is-up" : "is-down"}`}>
                      {isUp ? "▲" : "▼"}{" "}
                      {idx.netChange?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}{" "}
                      ({isUp ? "+" : ""}
                      {idx.dayChangePercent?.toFixed(2)}%)
                    </span>
                  </div>
                </button>
              );
            })
          : Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="index-fund-card index-fund-card--loading">
                <div className="index-fund-card__badge index-fund-card__badge--skeleton" />
                <div className="index-fund-card__text">
                  <span className="index-fund-card__skeleton-line" />
                  <span className="index-fund-card__skeleton-line index-fund-card__skeleton-line--wide" />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}