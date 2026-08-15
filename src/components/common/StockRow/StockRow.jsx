import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./StockRow.css";

// Pulled out of GainersLosers in Phase 3 so Watchlist can use the exact same
// card look instead of a second copy of this markup. `trailing` is an optional
// slot for a per-row control (Watchlist uses it for the remove "×" button).
export default function StockRow({ stock, onClick, trailing }) {
  const isUp = stock.dayChangePercent >= 0;

  return (
    <div className="stock-row">
      <button className="stock-row__main" onClick={() => onClick(stock.symbol)}>
        <div className="stock-row__id">
          <span className="stock-row__symbol">{stock.symbol}</span>
          <span className="stock-row__name">{stock.name}</span>
        </div>
        <div className="stock-row__figures">
          <span className="stock-row__price">{formatCurrency(stock.ltp)}</span>
          <span className={`stock-row__change ${isUp ? "is-up" : "is-down"}`}>
            {formatPercent(stock.dayChangePercent)}
          </span>
        </div>
      </button>
      {trailing && <div className="stock-row__trailing">{trailing}</div>}
    </div>
  );
}
