import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectIndexFundBySymbol } from "../../../redux/slices/marketSlice";
import "./IndexDetailModal.css";

export default function IndexDetailModal({ symbol, onClose }) {
  const data = useSelector((state) => selectIndexFundBySymbol(state, symbol));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!data) return null;

  const isUp = data.dayChangePercent >= 0;

  return (
    <div className="index-detail-overlay" onClick={onClose}>
      <div
        className="index-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label={data.name}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="index-detail-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="index-detail-modal__header">
          <span className="index-detail-modal__name">{data.name}</span>
          <span className="index-detail-modal__symbol">{data.symbol}</span>
        </div>

        <div className="index-detail-modal__price-row">
          <span className="index-detail-modal__value numeric">
            {data.ltp?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </span>
          <span className={`index-detail-modal__change ${isUp ? "is-up" : "is-down"}`}>
            {isUp ? "▲" : "▼"}{" "}
            {data.netChange?.toLocaleString("en-IN", { maximumFractionDigits: 2 })} (
            {isUp ? "+" : ""}
            {data.dayChangePercent?.toFixed(2)}%)
          </span>
        </div>

        {/* Chart placeholder — Upstox's historical-candle endpoint is not
           confirmed yet to accept NSE_INDEX/BSE_INDEX instrument_keys
           the same way it does NSE_EQ ones (getHistoricalCandles /
           getIntradayCandles in historicalCandleService.js only ever get
           called with equity symbols today). Once you've confirmed that
           against the API for one of these index instrument_keys, this
           can become a real chart the same way StockDetailPanel already
           renders one for equities — wiring instructions in the reply
           below this file. */}
        <div className="index-detail-modal__chart-placeholder">Chart coming soon</div>

        <div className="index-detail-modal__stats">
          <div className="index-detail-modal__stat">
            <span className="index-detail-modal__stat-label">Open</span>
            <span className="index-detail-modal__stat-value numeric">
              {data.open?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}
            </span>
          </div>
          <div className="index-detail-modal__stat">
            <span className="index-detail-modal__stat-label">High</span>
            <span className="index-detail-modal__stat-value numeric">
              {data.high?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}
            </span>
          </div>
          <div className="index-detail-modal__stat">
            <span className="index-detail-modal__stat-label">Low</span>
            <span className="index-detail-modal__stat-value numeric">
              {data.low?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}
            </span>
          </div>
          <div className="index-detail-modal__stat">
            <span className="index-detail-modal__stat-label">Prev Close</span>
            <span className="index-detail-modal__stat-value numeric">
              {data.prevClose?.toLocaleString("en-IN", { maximumFractionDigits: 2 }) ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}