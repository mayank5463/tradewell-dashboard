

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
import "./Holdings.css";
import "../../../styles/icons.css";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
const fmt = (n) => formatCurrency(n);

const fmtPct = (n, digits = 2) =>
  `${n >= 0 ? "+" : ""}${(n ?? 0).toFixed(digits)}%`;

// Flags a value as "up" or "down" for ~700ms right after it changes, so
// live price/P&L updates get a brief flash — the same cue Kite/Groww use
// to signal a live tick instead of a static number.
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
// Summary stat card
// ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, percent, tone = "neutral" }) {
  const flash = useFlash(value);
  const resolvedTone = tone === "auto" ? (value >= 0 ? "up" : "down") : tone;

  return (
    <div className={`holdings-stat ${flash ? `holdings-stat--flash-${flash}` : ""}`}>
      <div className={`holdings-stat__icon is-${resolvedTone}`}>
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div className="holdings-stat__body">
        <span className="holdings-stat__label">{label}</span>
        <span className={`holdings-stat__value is-${resolvedTone}`}>{fmt(value)}</span>
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
// Bar chart tooltip
// ────────────────────────────────────────────────────────────
function HoldingsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const isUp = row.pnl >= 0;
  const ltp = row.qty > 0 ? row.current / row.qty : 0;

  return (
    <div className="holdings-tooltip">
      <div className="holdings-tooltip__symbol">{row.symbol}</div>
      <div className="holdings-tooltip__row">
        <span>LTP</span>
        <strong>{fmt(ltp)}</strong>
      </div>
      <div className="holdings-tooltip__row">
        <span>Invested</span>
        <strong>{fmt(row.invested)}</strong>
      </div>
      <div className="holdings-tooltip__row">
        <span>Current</span>
        <strong>{fmt(row.current)}</strong>
      </div>
      <div className={`holdings-tooltip__row ${isUp ? "is-up" : "is-down"}`}>
        <span>P&amp;L</span>
        <strong>
          {fmt(row.pnl)} ({fmtPct(row.pnlPercent)})
        </strong>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Page header — used in BOTH the loaded and empty states, so
// the page always identifies itself the same way regardless of
// whether there's data yet.
// ────────────────────────────────────────────────────────────
function HoldingsHeader({ count }) {
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
          <span className="holdings__live-dot" />
          {count} stocks · live
        </span>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
// FIXED — this component only ever read state.holdings.list via the two
// selectors below; nothing dispatched fetchHoldings() to populate it.
// holdings.list was only ever warm because ordersSlice's placeOrder thunk
// re-dispatches fetchHoldings() after a trade in the same session. On a
// hard refresh the store resets to initialState (list: []), and this
// permanently rendered the empty state even though /allholdings would
// have returned real data.
export default function Holdings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pnlData = useSelector(selectHoldingsPnLBreakdown);
  const summary = useSelector(selectPortfolioSummary);
  const status = useSelector((state) => state.holdings.status);

  useEffect(() => {
    dispatch(fetchHoldings());
  }, [dispatch]);

  const goToStock = (symbol) => navigate(`/stock/${symbol}`);

  // Loading gate — without this there's a one-frame flash of "No holdings
  // to display" between mount and the fetch resolving.
  if (status === "loading" || status === "idle") {
    return (
      <div className="holdings">
        <HoldingsHeader />
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
        <HoldingsHeader />
        <div className="empty-state">
          <PageIcon src={iconHoldings} tone="muted" size="xl" />
          <p className="empty-state__title">No holdings yet</p>
          <p className="empty-state__subtitle">
            Buy a stock from the market and it'll show up here with live P&amp;L, allocation and
            performance tracking against your ₹5,00,000 paper capital.
          </p>
        </div>
      </div>
    );
  }

  const prevDayValue = summary.totalCurrent - summary.dayPnL;
  const dayPnLPct = prevDayValue > 0 ? (summary.dayPnL / prevDayValue) * 100 : 0;

  return (
    <div className="holdings">
      <HoldingsHeader count={pnlData.length} />

      {/* Live summary strip */}
      <div className="holdings__summary">
        <StatCard icon={Layers} label="Invested" value={summary.totalInvestment} tone="neutral" />
        <StatCard
          icon={Layers}
          label="Current Value"
          value={summary.totalCurrent}
          tone="neutral"
        />
        <StatCard
          icon={summary.dayPnL >= 0 ? TrendingUp : TrendingDown}
          label="Day's P&amp;L"
          value={summary.dayPnL}
          percent={dayPnLPct}
          tone="auto"
        />
        <StatCard
          icon={summary.totalPnL >= 0 ? TrendingUp : TrendingDown}
          label="Overall P&amp;L"
          value={summary.totalPnL}
          percent={summary.totalPnLPct}
          tone="auto"
        />
      </div>

      {/* Holdings bar */}
      <Card className="holdings__chart" raised>
        <div className="holdings__chart-header">
          <span className="holdings__chart-title">
            <Layers size={14} strokeWidth={2.25} />
            Your Holdings
          </span>
          <span className="holdings__chart-count">
            <span className="holdings__live-dot" />
            {pnlData.length} stocks · live
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(pnlData.length * 34, 160)}>
          <BarChart
            data={pnlData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="symbol"
              width={70}
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<HoldingsTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            <Bar
              dataKey="pnl"
              radius={[4, 4, 4, 4]}
              barSize={18}
              onClick={(entry) => goToStock(entry.symbol)}
              cursor="pointer"
            >
              {pnlData.map((row) => (
                <Cell
                  key={row.symbol}
                  fill={row.pnl >= 0 ? "var(--success-fill)" : "var(--danger-fill)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}