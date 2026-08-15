import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./StockAnalyticsPanel.css";

function formatHolding(days = 0) {
  if (days < 1) {
    const hrs = Math.max(Math.round(days * 24), 1);
    return `${hrs} hr`;
  }
  if (days < 30) return `${Math.round(days)} Days`;
  if (days < 365) return `${(days / 30).toFixed(1)} Months`;
  return `${(days / 365).toFixed(1)} Years`;
}

// Extracted out of MostTradedSymbols so it can be positioned by
// TradingAnalyticsSection.jsx between the Top Traded card and the
// P&L calendar, instead of being nested inside the Top Traded card.
export default function StockAnalyticsPanel({ stock, onClose, onOpenStock }) {
  if (!stock) return null;

  const totalClosed = stock.profitTradeCount + stock.lossTradeCount;
  const estimatedReturn =
    stock.totalValue > 0 ? (stock.netRealizedPnL / stock.totalValue) * 100 : 0;

  return (
    <div className="stock-analytics-panel">
      <div className="stock-analytics-panel__header">
        <div>
          <span className="stock-analytics-panel__label">Trading Analytics</span>
          <h4>{stock.symbol}</h4>
          {stock.name !== stock.symbol && (
            <span className="stock-analytics-panel__company">{stock.name}</span>
          )}
        </div>
        <button
          type="button"
          className="stock-analytics-panel__close"
          onClick={onClose}
          aria-label="Close analytics"
        >
          ×
        </button>
      </div>

      <div className="stock-analytics-panel__grid">
        <div className="stock-analytics-panel__card">
          <span>Total Orders</span>
          <strong>{stock.orderCount}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Buy Orders</span>
          <strong>{stock.buyOrders}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Sell Orders</span>
          <strong>{stock.sellOrders}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Total Quantity</span>
          <strong>{stock.totalQty.toLocaleString("en-IN")}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Trade Value</span>
          <strong>{formatCurrency(stock.totalValue)}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Closed Trades</span>
          <strong>{totalClosed}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Profit Trades</span>
          <strong className="is-up">{stock.profitTradeCount}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Loss Trades</span>
          <strong className="is-down">{stock.lossTradeCount}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Max Order Qty</span>
          <strong>{stock.maxOrderQty}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Min Order Qty</span>
          <strong>{stock.minOrderQty}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Average Holding</span>
          <strong>{formatHolding(stock.avgHoldingDays)}</strong>
        </div>
        <div className="stock-analytics-panel__card">
          <span>Net Return</span>
          <strong className={estimatedReturn >= 0 ? "is-up" : "is-down"}>
            {formatPercent(estimatedReturn)}
          </strong>
        </div>
      </div>

      <div className="stock-analytics-panel__performance">
        <div>
          <span>Net Realized P&amp;L</span>
          <strong className={stock.netRealizedPnL >= 0 ? "is-up" : "is-down"}>
            {formatCurrency(stock.netRealizedPnL)}
          </strong>
        </div>
        <div>
          <span>Short-term Capital</span>
          <strong>{formatCurrency(stock.shortTermValue)}</strong>
        </div>
        <div>
          <span>Long-term Capital</span>
          <strong>{formatCurrency(stock.longTermValue)}</strong>
        </div>
      </div>

      {(stock.bestTrade || stock.worstTrade) && (
        <div className="stock-analytics-panel__trades">
          {stock.bestTrade && (
            <div>
              <span>Best Trade</span>
              <strong className="is-up">{formatCurrency(stock.bestTrade.pnl)}</strong>
            </div>
          )}
          {stock.worstTrade && (
            <div>
              <span>Worst Trade</span>
              <strong className="is-down">{formatCurrency(stock.worstTrade.pnl)}</strong>
            </div>
          )}
        </div>
      )}

      <button type="button" className="stock-analytics-panel__open-btn" onClick={onOpenStock}>
        Open {stock.symbol}
        <span>→</span>
      </button>
    </div>
  );
}