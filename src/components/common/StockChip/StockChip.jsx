import { formatPercent } from "../../utils/formatCurrency";
import "./StockChip.css";

// Small reusable badge for a symbol + its day change - used in search results,
// watchlist rows, and anywhere we need a compact stock reference (Phase 4 will lean on this too).
export default function StockChip({ symbol, dayChangePercent }) {
  const isUp = dayChangePercent >= 0;
  return (
    <span className={`stock-chip ${isUp ? "stock-chip--up" : "stock-chip--down"}`}>
      {symbol}
      <span className="stock-chip__pct">{formatPercent(dayChangePercent)}</span>
    </span>
  );
}
