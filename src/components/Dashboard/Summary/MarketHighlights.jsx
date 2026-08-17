import { useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import StockLogo from "../../common/StockLogo";
import { formatCurrency, formatCompactNumber } from "../../../utils/formatCurrency";
import { usePriceFlash } from "../../../hooks/usePriceFlash";
import "./MarketHighlights.css";
import "../../../styles/SectionHeadingsTheme.css"; 


const VIEW_OPTIONS = [
  { value: "mostTraded", label: "Most Traded", requiresData: "orderCount" },
  { value: "mostVolume", label: "Most Volume", requiresData: "volume" },
  { value: "high52W", label: "52W High", requiresData: "high52W" },
  { value: "low52W", label: "52W Low", requiresData: "low52W" },
];

const LIMIT_OPTIONS = [10, 20, 50];

function StockCard({ stock, viewType, index, onClick }) {
  const isUp = stock.dayChangePercent >= 0;
  const flashClass = usePriceFlash(stock.ltp);

  const getMetricValue = () => {
    switch (viewType) {
      case "mostTraded":
        return stock.orderCount || stock.trades || 0;
      case "mostVolume":
        return stock.volume || stock.totalVolume || 0;
      case "high52W":
        return stock.high52W || stock.yearHigh || 0;
      case "low52W":
        return stock.low52W || stock.yearLow || 0;
      default:
        return 0;
    }
  };

  const getMetricLabel = () => {
    switch (viewType) {
      case "mostTraded":
        return "Trades";
      case "mostVolume":
        return "Volume";
      case "high52W":
        return "52W High";
      case "low52W":
        return "52W Low";
      default:
        return "";
    }
  };

  const metricValue = getMetricValue();
  const metricLabel = getMetricLabel();

  // Determine if we should show the metric
  const showMetric = metricValue > 0;

  return (
    <button 
      className="market-highlights__card" 
      onClick={() => onClick(stock.symbol)}
      role="button"
      tabIndex={0}
    >
      <div className="market-highlights__card-rank">{index + 1}</div>
      
      <div className="market-highlights__card-identity">
        <div className="market-highlights__card-logo">
          <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={32} />
        </div>
        <div className="market-highlights__card-info">
          <span className="market-highlights__card-symbol">{stock.symbol}</span>
          <span className="market-highlights__card-name">{stock.name}</span>
        </div>
      </div>

      <div className="market-highlights__card-metrics">
        <div className={`market-highlights__card-price ${flashClass}`}>
          {formatCurrency(stock.ltp)}
        </div>
        <div className={`market-highlights__card-change ${isUp ? "is-up" : "is-down"}`}>
          {isUp ? "+" : ""}{stock.dayChangePercent?.toFixed(2) || "0.00"}%
        </div>
      </div>

      {showMetric && (
        <div className="market-highlights__card-metric">
          <span className="market-highlights__card-metric-label">{metricLabel}</span>
          <span className="market-highlights__card-metric-value">
            {viewType === "mostVolume" || viewType === "mostTraded"
              ? formatCompactNumber(metricValue)
              : formatCurrency(metricValue)}
          </span>
        </div>
      )}
    </button>
  );
}

export default function MarketHighlights() {
  const navigate = useNavigate();
  const stocks = useSelector((state) => state.market.stocks || []);
  
  const [viewType, setViewType] = useState("mostVolume");
  const [limit, setLimit] = useState(10);

  // Process stocks based on view type
  const processedStocks = useMemo(() => {
    if (!stocks.length) return [];

    let sorted = [...stocks];
    
    switch (viewType) {
      case "mostTraded":
        sorted.sort((a, b) => (b.orderCount || b.trades || 0) - (a.orderCount || a.trades || 0));
        break;
      case "mostVolume":
        sorted.sort((a, b) => (b.volume || b.totalVolume || 0) - (a.volume || a.totalVolume || 0));
        break;
      case "high52W":
        sorted.sort((a, b) => (b.high52W || b.yearHigh || 0) - (a.high52W || a.yearHigh || 0));
        break;
      case "low52W":
        sorted.sort((a, b) => (a.low52W || a.yearLow || 0) - (b.low52W || b.yearLow || 0));
        break;
      default:
        break;
    }

    // Filter out stocks with zero or undefined values for the selected metric
    const filtered = sorted.filter((stock) => {
      let value = 0;
      switch (viewType) {
        case "mostTraded":
          value = stock.orderCount || stock.trades || 0;
          break;
        case "mostVolume":
          value = stock.volume || stock.totalVolume || 0;
          break;
        case "high52W":
          value = stock.high52W || stock.yearHigh || 0;
          break;
        case "low52W":
          value = stock.low52W || stock.yearLow || 0;
          break;
        default:
          return true;
      }
      return value > 0;
    });

    return filtered.slice(0, limit);
  }, [stocks, viewType, limit]);

  const handleViewChange = useCallback((e) => {
    setViewType(e.target.value);
  }, []);

  const handleLimitChange = useCallback((e) => {
    setLimit(Number(e.target.value));
  }, []);

  const goToStock = useCallback((symbol) => {
    navigate(`/stock/${symbol}`);
  }, [navigate]);

  const getViewTitle = () => {
    const option = VIEW_OPTIONS.find(v => v.value === viewType);
    return option ? option.label : "Market Highlights";
  };

  const getViewSubtitle = () => {
    switch (viewType) {
      case "mostTraded":
        return "Most actively traded stocks";
      case "mostVolume":
        return "Highest volume stocks";
      case "high52W":
        return "Stocks near 52-week highs";
      case "low52W":
        return "Stocks near 52-week lows";
      default:
        return "";
    }
  };

  const isEmpty = processedStocks.length === 0;

  // Get available view options (only those with data)
  const availableViews = useMemo(() => {
    if (!stocks.length) return VIEW_OPTIONS;
    
    return VIEW_OPTIONS.filter(option => {
      const hasData = stocks.some(stock => {
        let value = 0;
        switch (option.value) {
          case "mostTraded":
            value = stock.orderCount || stock.trades || 0;
            break;
          case "mostVolume":
            value = stock.volume || stock.totalVolume || 0;
            break;
          case "high52W":
            value = stock.high52W || stock.yearHigh || 0;
            break;
          case "low52W":
            value = stock.low52W || stock.yearLow || 0;
            break;
          default:
            return false;
        }
        return value > 0;
      });
      return hasData;
    });
  }, [stocks]);

  // If current view has no data, switch to first available
  if (availableViews.length > 0 && !availableViews.some(v => v.value === viewType)) {
    // This will trigger on next render, but we can handle it
    setTimeout(() => setViewType(availableViews[0].value), 0);
  }

  return (
    <div className="market-highlights">
      <div className="market-highlights__header">
        <div className="market-highlights__title-group">
          <h3 className="market-highlights__title">Market Highlights</h3>
          <span className="market-highlights__subtitle">{getViewSubtitle()}</span>
        </div>
        
        <div className="market-highlights__controls">
          <div className="market-highlights__control">
            <select 
              className="market-highlights__select"
              value={viewType} 
              onChange={handleViewChange}
            >
              {availableViews.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="market-highlights__control">
            <select 
              className="market-highlights__select"
              value={limit} 
              onChange={handleLimitChange}
            >
              {LIMIT_OPTIONS.map((num) => (
                <option key={num} value={num}>
                  Top {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="market-highlights__content">
        {isEmpty ? (
          <div className="market-highlights__empty">
            <span className="market-highlights__empty-icon">📊</span>
            <p>No data available for {getViewTitle().toLowerCase()}</p>
          </div>
        ) : (
          <div className="market-highlights__grid">
            {processedStocks.map((stock, index) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                viewType={viewType}
                index={index}
                onClick={goToStock}
              />
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="market-highlights__footer">
          <span className="market-highlights__footer-info">
            Showing {processedStocks.length} of {processedStocks.length} stocks
          </span>
          <span className="market-highlights__footer-view">
            {getViewTitle()}
          </span>
        </div>
      )}
    </div>
  );
}