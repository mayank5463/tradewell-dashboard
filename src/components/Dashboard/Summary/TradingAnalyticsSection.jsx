import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MostTradedSymbols from "./MostTradedSymbols";
import StockAnalyticsPanel from "./StockAnalyticsPanel";
import PnLCalendarHeatmap from "./PnLCalendarHeatmap";
import "./TradingAnalyticsSection.css";

export default function TradingAnalyticsSection() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState(null);

  const handleSelectStock = useCallback((row) => setSelectedStock(row), []);
  const handleCloseAnalytics = useCallback(() => setSelectedStock(null), []);
  const handleOpenStock = useCallback(() => {
    if (selectedStock) navigate(`/stock/${selectedStock.symbol}`);
  }, [navigate, selectedStock]);

  return (
    <div className="trading-analytics-section">
      <div className={`trading-analytics-section__lower ${selectedStock ? "has-analytics" : ""}`}>
        <MostTradedSymbols
          selectedSymbol={selectedStock?.symbol ?? null}
          onSelectStock={handleSelectStock}
        />
        {selectedStock && (
          <StockAnalyticsPanel
            stock={selectedStock}
            onClose={handleCloseAnalytics}
            onOpenStock={handleOpenStock}
          />
        )}
        <PnLCalendarHeatmap compact={!!selectedStock} />
      </div>
    </div>
  );
}