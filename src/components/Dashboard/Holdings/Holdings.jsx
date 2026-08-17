import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Layers } from "lucide-react";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconHoldings from "../../../assets/icons/icon-holdings.png";
import { fetchHoldings } from "../../../redux/slices/holdingsSlice";
import {
  selectHoldingsPnLBreakdown,
  selectPortfolioSummary,
} from "../../../redux/selectors/holdingsAnalyticsSelectors";
import { formatCurrency } from "../../../utils/formatCurrency";
import { isMarketOpenNow } from "../../StockDetail/marketTime";
import "./Holdings.css";
import "../../../styles/icons.css";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const fmt = (n) => formatCurrency(n);

const fmtPct = (n, digits = 2) =>
  `${n >= 0 ? "+" : ""}${(n ?? 0).toFixed(digits)}%`;

function useFlash(value) {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    if (typeof value !== "number" || Number.isNaN(value)) return undefined;
    if (prevRef.current !== value) {
      const direction = value > prevRef.current ? "up" : "down";
      prevRef.current = value;
      setFlash(direction);
      const t = setTimeout(() => setFlash(null), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [value]);

  return flash;
}

// ────────────────────────────────────────────────────────────
// Market status hook
// ────────────────────────────────────────────────────────────
function useMarketStatus() {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkMarket = () => {
      setIsLive(isMarketOpenNow());
    };

    checkMarket();
    const intervalId = setInterval(checkMarket, 15000);

    return () => clearInterval(intervalId);
  }, []);

  return isLive;
}

// ────────────────────────────────────────────────────────────
// Summary stat card
// ────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  percent,
  tone = "neutral",
  isLive,
}) {
  const flash = useFlash(value);
  const resolvedTone = tone === "auto" ? (value >= 0 ? "up" : "down") : tone;

  return (
    <div
      className={`holdings-stat ${flash && isLive ? `holdings-stat--flash-${flash}` : ""}`}
    >
      <div className={`holdings-stat__icon is-${resolvedTone}`}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="holdings-stat__body">
        <span className="holdings-stat__label">{label}</span>
        <span className={`holdings-stat__value is-${resolvedTone}`}>
          {fmt(value)}
        </span>
        {percent !== undefined && (
          <span className={`holdings-stat__pct is-${resolvedTone}`}>
            {resolvedTone === "up" ? (
              <TrendingUp size={11} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={11} strokeWidth={2.5} />
            )}
            {fmtPct(percent)}
          </span>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// ENHANCED TOOLTIP - Full details with theming
// ────────────────────────────────────────────────────────────
function HoldingsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const isUp = row.pnl >= 0;
  
  const qty = row.qty || 0;
  const buyPrice = qty > 0 ? row.invested / qty : 0;
  const currentPrice = qty > 0 ? row.current / qty : 0;

  return (
    <div className="holdings-tooltip">
      <div className="holdings-tooltip__header">
        <span className="holdings-tooltip__symbol">{row.symbol}</span>
        <span className={`holdings-tooltip__pnl-badge ${isUp ? "is-up" : "is-down"}`}>
          {isUp ? "▲" : "▼"} {fmtPct(row.pnlPercent)}
        </span>
      </div>

      <div className="holdings-tooltip__divider" />

      <div className="holdings-tooltip__grid">
        <div className="holdings-tooltip__item">
          <span className="holdings-tooltip__label">Qty</span>
          <span className="holdings-tooltip__value">{qty}</span>
        </div>
        <div className="holdings-tooltip__item">
          <span className="holdings-tooltip__label">Buy Price</span>
          <span className="holdings-tooltip__value">{fmt(buyPrice)}</span>
        </div>
        <div className="holdings-tooltip__item">
          <span className="holdings-tooltip__label">LTP</span>
          <span className="holdings-tooltip__value">{fmt(currentPrice)}</span>
        </div>
      </div>

      <div className="holdings-tooltip__divider" />

      <div className="holdings-tooltip__grid">
        <div className="holdings-tooltip__item">
          <span className="holdings-tooltip__label">Invested</span>
          <span className="holdings-tooltip__value">{fmt(row.invested)}</span>
        </div>
        <div className="holdings-tooltip__item">
          <span className="holdings-tooltip__label">Current</span>
          <span className="holdings-tooltip__value">{fmt(row.current)}</span>
        </div>
      </div>

      <div className="holdings-tooltip__divider" />

      <div className={`holdings-tooltip__pnl-row ${isUp ? "is-up" : "is-down"}`}>
        <span className="holdings-tooltip__pnl-label">P&L</span>
        <span className="holdings-tooltip__pnl-value">
          {fmt(row.pnl)} <span className="holdings-tooltip__pnl-pct">({fmtPct(row.pnlPercent)})</span>
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page header
// ────────────────────────────────────────────────────────────
function HoldingsHeader({ count, isLive }) {
  return (
    <div className="page-header">
      <PageIcon src={iconHoldings} tone="holdings" size="lg" />
      <div className="page-header__text">
        <h1 className="page-header__title">Holdings</h1>
        <p className="page-header__subtitle">
          Your long-term investments, marked to market in real time
        </p>
      </div>
      {typeof count === "number" && count > 0 && (
        <span className="page-header__meta holdings__chart-count">
          {isLive ? (
            <>
              <span className="holdings__live-dot" />
              {count} stocks · live
            </>
          ) : (
            <>
              <span className="holdings__closed-dot" />
              {count} stocks · market closed
            </>
          )}
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function Holdings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pnlData = useSelector(selectHoldingsPnLBreakdown);
  const summary = useSelector(selectPortfolioSummary);
  const status = useSelector((state) => state.holdings.status);
  const isLive = useMarketStatus();
  const chartContainerRef = useRef(null);
  const [selectedBar, setSelectedBar] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    dispatch(fetchHoldings());
  }, [dispatch]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle bar click for mobile
  const handleBarClick = (data) => {
    if (isMobile) {
      setSelectedBar(data);
    }
  };

  // Close tooltip on mobile
  const closeTooltip = () => {
    setSelectedBar(null);
  };

  // Navigate to stock detail
  const goToStock = (symbol) => {
    if (!isMobile) {
      navigate(`/stock/${symbol}`);
    }
  };

  if (status === "loading" || status === "idle") {
    return (
      <div className="holdings">
        <HoldingsHeader isLive={isLive} />
        <div className="empty-state">
          <PageIcon src={iconHoldings} tone="muted" size="xl" />
          <p className="empty-state__title">Loading your holdings…</p>
        </div>
      </div>
    );
  }

  if (!summary || pnlData.length === 0) {
    return (
      <div className="holdings">
        <HoldingsHeader isLive={isLive} />
        <div className="empty-state">
          <PageIcon src={iconHoldings} tone="muted" size="xl" />
          <p className="empty-state__title">No holdings yet</p>
          <p className="empty-state__subtitle">
            Buy a stock from the market and it'll show up here with live
            P&amp;L, allocation and performance tracking.
          </p>
        </div>
      </div>
    );
  }

  const prevDayValue = summary.totalCurrent - summary.dayPnL;
  const dayPnLPct =
    prevDayValue > 0 ? (summary.dayPnL / prevDayValue) * 100 : 0;

  // Calculate chart height based on data and screen size
  const getChartHeight = () => {
    const baseHeight = Math.max(pnlData.length * 34, 160);
    if (window.innerWidth <= 480) {
      return Math.max(pnlData.length * 28, 140);
    }
    return baseHeight;
  };

  // Check if we're on mobile
  const isMobileDevice = window.innerWidth <= 768;

  return (
    <div className="holdings" ref={chartContainerRef}>
      <HoldingsHeader count={pnlData.length} isLive={isLive} />

      {/* Summary strip */}
      <div className="holdings__summary">
        <StatCard
          icon={Layers}
          label="Invested"
          value={summary.totalInvestment}
          tone="neutral"
          isLive={isLive}
        />
        <StatCard
          icon={Layers}
          label="Current Value"
          value={summary.totalCurrent}
          tone="neutral"
          isLive={isLive}
        />
        <StatCard
          icon={summary.dayPnL >= 0 ? TrendingUp : TrendingDown}
          label="Day's P&amp;L"
          value={summary.dayPnL}
          percent={dayPnLPct}
          tone="auto"
          isLive={isLive}
        />
        <StatCard
          icon={summary.totalPnL >= 0 ? TrendingUp : TrendingDown}
          label="Overall P&amp;L"
          value={summary.totalPnL}
          percent={summary.totalPnLPct}
          tone="auto"
          isLive={isLive}
        />
      </div>

      {/* Holdings bar chart */}
      <Card className="holdings__chart" raised>
        <div className="holdings__chart-header">
          <span className="holdings__chart-title">
            <Layers size={14} strokeWidth={2.25} />
            Your Holdings
          </span>
          <span className="holdings__chart-count">
            {isLive ? (
              <>
                <span className="holdings__live-dot" />
                {pnlData.length} stocks · live
              </>
            ) : (
              <>
                <span className="holdings__closed-dot" />
                {pnlData.length} stocks · market closed
              </>
            )}
          </span>
        </div>
        
        {/* Responsive chart with touch support */}
        <div className="holdings__chart-wrapper">
          <ResponsiveContainer
            width="100%"
            height={getChartHeight()}
          >
            <BarChart
              data={pnlData}
              layout="vertical"
              margin={{ 
                top: 4, 
                right: 12, 
                left: 0, 
                bottom: 4 
              }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="symbol"
                width={isMobileDevice ? 50 : 70}
                stroke="var(--chart-axis)"
                tick={{
                  fill: "var(--chart-label)",
                  fontSize: isMobileDevice ? 10 : 11,
                  fontWeight: 600,
                }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<HoldingsTooltip />}
                cursor={{ fill: "var(--surface-hover)" }}
                wrapperStyle={{
                  zIndex: 100,
                  pointerEvents: 'auto',
                }}
                isAnimationActive={!isMobileDevice}
                animationDuration={isMobileDevice ? 0 : 200}
              />
              <Bar
                dataKey="pnl"
                radius={[4, 4, 4, 4]}
                barSize={isMobileDevice ? 14 : 18}
                onClick={(entry) => {
                  if (isMobileDevice) {
                    handleBarClick(entry);
                  } else {
                    goToStock(entry.symbol);
                  }
                }}
                cursor="pointer"
              >
                {pnlData.map((row) => (
                  <Cell
                    key={row.symbol}
                    fill={
                      row.pnl >= 0 ? "var(--success-fill)" : "var(--danger-fill)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Mobile hint - tap for details */}
        <div className="holdings__chart-hint">
          <span>Tap any bar to view details</span>
        </div>
        
        {/* Mobile tooltip overlay - shows when a bar is tapped */}
        {isMobileDevice && selectedBar && (
          <div className="holdings__mobile-tooltip-overlay" onClick={closeTooltip}>
            <div className="holdings__mobile-tooltip" onClick={(e) => e.stopPropagation()}>
              <button className="holdings__mobile-tooltip-close" onClick={closeTooltip}>
                ✕
              </button>
              <div className="holdings-tooltip">
                <div className="holdings-tooltip__header">
                  <span className="holdings-tooltip__symbol">{selectedBar.symbol}</span>
                  <span className={`holdings-tooltip__pnl-badge ${selectedBar.pnl >= 0 ? "is-up" : "is-down"}`}>
                    {selectedBar.pnl >= 0 ? "▲" : "▼"} {fmtPct(selectedBar.pnlPercent)}
                  </span>
                </div>
                <div className="holdings-tooltip__divider" />
                <div className="holdings-tooltip__grid">
                  <div className="holdings-tooltip__item">
                    <span className="holdings-tooltip__label">Qty</span>
                    <span className="holdings-tooltip__value">{selectedBar.qty || 0}</span>
                  </div>
                  <div className="holdings-tooltip__item">
                    <span className="holdings-tooltip__label">Buy Price</span>
                    <span className="holdings-tooltip__value">
                      {fmt((selectedBar.invested || 0) / (selectedBar.qty || 1))}
                    </span>
                  </div>
                  <div className="holdings-tooltip__item">
                    <span className="holdings-tooltip__label">LTP</span>
                    <span className="holdings-tooltip__value">
                      {fmt((selectedBar.current || 0) / (selectedBar.qty || 1))}
                    </span>
                  </div>
                </div>
                <div className="holdings-tooltip__divider" />
                <div className="holdings-tooltip__grid">
                  <div className="holdings-tooltip__item">
                    <span className="holdings-tooltip__label">Invested</span>
                    <span className="holdings-tooltip__value">{fmt(selectedBar.invested || 0)}</span>
                  </div>
                  <div className="holdings-tooltip__item">
                    <span className="holdings-tooltip__label">Current</span>
                    <span className="holdings-tooltip__value">{fmt(selectedBar.current || 0)}</span>
                  </div>
                </div>
                <div className="holdings-tooltip__divider" />
                <div className={`holdings-tooltip__pnl-row ${selectedBar.pnl >= 0 ? "is-up" : "is-down"}`}>
                  <span className="holdings-tooltip__pnl-label">P&L</span>
                  <span className="holdings-tooltip__pnl-value">
                    {fmt(selectedBar.pnl || 0)} <span className="holdings-tooltip__pnl-pct">({fmtPct(selectedBar.pnlPercent)})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}