import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMarketIndices } from "../../redux/slices/marketSlice";
import { formatCurrency, formatPercent } from "../../utils/formatCurrency";
import "./IndexTicker.css";

/**
 * IndexTicker
 * Displays Sensex + Nifty 50 with live LTP, change, and % change.
 * Compact pill-style design for the search row.
 * 
 * Redux state structure (from marketSlice):
 * state.market.indices = {
 *   "SENSEX": { symbol, name, value, change, changePercent },
 *   "NIFTY50": { symbol, name, value, change, changePercent },
 *   ...other indices
 * }
 */

function IndexPill({ label, data }) {
  if (!data) {
    return (
      <div className="index-ticker__pill index-ticker__pill--loading">
        <span className="index-ticker__name">{label}</span>
        <span className="index-ticker__skeleton" />
      </div>
    );
  }

  const { value, change, changePercent } = data;
  const isUp = changePercent >= 0;
  const changeSign = isUp ? "+" : "";

  return (
    <div className={`index-ticker__pill ${isUp ? "is-up" : "is-down"}`}>
      <span className="index-ticker__live-dot" aria-hidden="true" />
      <span className="index-ticker__name">{label}</span>
      <span className="index-ticker__value">
        {formatCurrency(value, { decimals: 2 })}
      </span>
      <span className="index-ticker__change">
        {isUp ? "▲" : "▼"} {changeSign}{formatPercent(changePercent, { showSign: false })}
      </span>
    </div>
  );
}

export default function IndexTicker() {
  const dispatch = useDispatch();
  const indices = useSelector((state) => state.market.indices || {});

  // Fetch indices immediately on mount
  useEffect(() => {
    dispatch(fetchMarketIndices());

    // Poll every 10 seconds for live updates
    const intervalId = setInterval(() => {
      dispatch(fetchMarketIndices());
    }, 10000);

    return () => clearInterval(intervalId);
  }, [dispatch]);

  // Find indices by exact keys (case-insensitive fallback)
  const findIndex = (keys) => {
    for (const key of keys) {
      if (indices[key]) return indices[key];
    }
    // Fallback: search by name
    const searchName = keys[0].toLowerCase().replace(/[^a-z]/g, "");
    return Object.values(indices).find((idx) =>
      (idx.name || "").toLowerCase().includes(searchName) ||
      (idx.symbol || "").toLowerCase().includes(searchName)
    );
  };

  const sensex = findIndex(["SENSEX", "sensex", "Sensex"]);
  const nifty = findIndex(["NIFTY50", "NIFTY 50", "NIFTY", "nifty", "nifty50", "Nifty50"]);

  return (
    <div className="index-ticker" role="region" aria-label="Market indices ticker">
      <IndexPill label="SENSEX" data={sensex} />
      <IndexPill label="NIFTY 50" data={nifty} />
    </div>
  );
}