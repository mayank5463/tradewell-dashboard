import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { usePriceFlash } from "../../../hooks/usePriceFlash";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./HoldingsTable.css";

// FIXED — this row used to compute currentValue/P&L from h.ltp/
// h.dayChangePercent stored directly on the holding object. Those only get
// refreshed when fetchHoldings() re-runs (page load), not on every market
// poll tick - so this table looked "frozen" between refreshes even while
// the live ticker elsewhere on the page was moving.
//
// Fix: look the symbol up in state.market.stocks (the same live feed
// GainersLosers/SearchBar/Holdings.jsx's own table already use) and prefer
// that price when it's available. useSelector means this re-renders on
// every market poll tick automatically - no prop drilling, no extra
// wiring needed elsewhere.
function HoldingRow({ h, liveStocksBySymbol, onClick }) {
  const live = liveStocksBySymbol[h.symbol];
  const ltp = live?.ltp ?? h.ltp;
  const dayChangePercent = live?.dayChangePercent ?? h.dayChangePercent ?? 0;

  const currentValue = ltp * h.qty;
  const invested = h.avgPrice * h.qty;
  const overallPnL = currentValue - invested;
  const overallPct = invested > 0 ? (overallPnL / invested) * 100 : 0;
  const dayPnL = ltp * h.qty * (dayChangePercent / 100);
  const flashClass = usePriceFlash(ltp);

  return (
    <tr className="holdings-table__row" onClick={onClick}>
      <td className="is-left">
        <span className="holdings-table__symbol">{h.symbol}</span>
      </td>
      <td>{h.qty}</td>
      <td>{formatCurrency(h.avgPrice)}</td>
      <td className={flashClass}>{formatCurrency(ltp)}</td>
      <td className={flashClass}>{formatCurrency(currentValue)}</td>
      <td className={dayPnL >= 0 ? "is-up" : "is-down"}>{formatCurrency(dayPnL)}</td>
      <td className={dayChangePercent >= 0 ? "is-up" : "is-down"}>
        {formatPercent(dayChangePercent)}
      </td>
      <td className={overallPnL >= 0 ? "is-up" : "is-down"}>{formatCurrency(overallPnL)}</td>
      <td className={overallPct >= 0 ? "is-up" : "is-down"}>{formatPercent(overallPct)}</td>
    </tr>
  );
}

function HoldingRowWrapper({ h, liveStocksBySymbol }) {
  const navigate = useNavigate();
  return (
    <HoldingRow
      h={h}
      liveStocksBySymbol={liveStocksBySymbol}
      onClick={() => navigate(`/stock/${h.symbol}`)}
    />
  );
}

export default function HoldingsTable({ holdings }) {
  // Built once per render as a lookup map instead of holdings.map(() =>
  // stocks.find(...)) - avoids an O(n*m) scan across every row on every
  // single market tick once someone holds more than a handful of symbols.
  const liveStocks = useSelector((state) => state.market.stocks);
  const liveStocksBySymbol = Array.isArray(liveStocks)
    ? Object.fromEntries(liveStocks.map((s) => [s.symbol, s]))
    : liveStocks || {};

  if (!holdings.length) return null;

  return (
    <div className="holdings-table-card">
      <div className="holdings-table-wrap">
        <table className="holdings-table">
          <thead>
            <tr>
              <th className="is-left">Symbol ({holdings.length})</th>
              <th>Net Qty</th>
              <th>Avg. Price</th>
              <th>LTP</th>
              <th>Current Value</th>
              <th>Day P&amp;L</th>
              <th>Day %</th>
              <th>Overall P&amp;L</th>
              <th>Overall %</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <HoldingRowWrapper key={h.symbol} h={h} liveStocksBySymbol={liveStocksBySymbol} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}