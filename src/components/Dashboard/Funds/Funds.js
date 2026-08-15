import { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import Card from "../../common/Card/Card";
import Button from "../../common/Button/Button";
import Modal from "../../common/Modal/Modal";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconFunds from "../../../assets/icons/icon-funds.png";
import { fetchWallet, fetchWalletLedger } from "../../../redux/slices/fundsSlice";
import { resetPaperTrading } from "../../../redux/actions/resetPaperTrading";
import {
  selectCashBalance,
  selectIntradayBuyingPower,
  selectInvestedValue,
  selectCurrentHoldingsValue,
  selectTodaysPL,
  selectNetWorth,
  selectFundsHistory,
  selectRealizedPnL,
  // Already used elsewhere in this codebase (see Orders.jsx notes on
  // orderAnalyticsSelectors vs fundsSelectors field sets) — reused here
  // to give Funds an actual trend chart instead of only static totals.
  selectPortfolioGrowthSeries,
} from "../../../redux/selectors/fundsSelectors";
import { formatCurrency } from "../../../utils/formatCurrency";
import { BASE_FUNDS } from "../../../utils/constants";
import "./Funds.css";
import "../../../styles/icons.css";

const HISTORY_FILTERS = [
  { key: "all", label: "All" },
  { key: "DEPOSIT", label: "Deposits" },
  { key: "BUY", label: "Buys" },
  { key: "SELL", label: "Sells" },
];

function isCredit(type) {
  return type === "DEPOSIT" || type === "SELL";
}

function formatHistoryDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Segment tabs — unchanged ─────────────────────────────────────────── */
function SegmentTabs() {
  return (
    <div className="funds-tabs" role="tablist" aria-label="Trading segment">
      <button className="funds-tab funds-tab--active" role="tab" aria-selected="true">
        Equity
      </button>
      <button className="funds-tab" role="tab" aria-selected="false" disabled title="Not available in paper trading yet">
        F&amp;O
        <span className="funds-tab__badge">Soon</span>
      </button>
      <button className="funds-tab" role="tab" aria-selected="false" disabled title="Not available in paper trading yet">
        Commodity
        <span className="funds-tab__badge">Soon</span>
      </button>
    </div>
  );
}

function StatCard({ label, value, tone, caption }) {
  return (
    <Card className="funds-stat-card" raised>
      <div className="funds-stat-card__label">{label}</div>
      <div className={`funds-stat-card__value${tone ? ` ${tone}` : ""}`}>{value}</div>
      {caption && <div className="funds-stat-card__caption">{caption}</div>}
    </Card>
  );
}

function NetWorthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="funds-trend__tooltip">
      <div className="funds-trend__tooltip-date">{label}</div>
      <div className="funds-trend__tooltip-row">
        <span>Net worth</span>
        <strong>{formatCurrency(value)}</strong>
      </div>
    </div>
  );
}

// NEW — the one real chart this page was missing. Cash + holdings, over
// time, against the fixed ₹5,00,000 starting line — the single most
// important visual for a paper-trading account, since capital never
// moves except through your own trades.
function NetWorthTrendChart() {
  const series = useSelector(selectPortfolioGrowthSeries);
  const hasData = Array.isArray(series) && series.length > 1;

  return (
    <Card className="funds-trend" raised>
      <div className="section-heading">
        <PageIcon src={iconFunds} tone="funds" size="sm" />
        <div className="section-heading__text">
          <span className="section-heading__title">Net Worth Trend</span>
          <span className="section-heading__subtitle">
            Cash + holdings, vs. your {formatCurrency(BASE_FUNDS, { decimals: 0 })} starting capital
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="funds-trend__empty">
          Your net worth curve will build up here as you trade — check back after your first
          order.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fundsNetWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-primary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--brand-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              minTickGap={24}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(v) => formatCurrency(v)}
            />
            <Tooltip content={<NetWorthTooltip />} cursor={{ stroke: "var(--chart-neutral)", strokeWidth: 1 }} />
            <ReferenceLine
              y={BASE_FUNDS}
              stroke="var(--chart-axis)"
              strokeDasharray="4 4"
              label={{
                value: `Start · ${formatCurrency(BASE_FUNDS, { decimals: 0 })}`,
                position: "insideTopLeft",
                fill: "var(--text-tertiary)",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--brand-primary)"
              strokeWidth={2}
              fill="url(#fundsNetWorthFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function HistoryList({ history, filter }) {
  const filtered = filter === "all" ? history : history.filter((row) => row.type === filter);

  if (filtered.length === 0) {
    return (
      <div className="empty-state funds-empty">
        <PageIcon src={iconFunds} tone="muted" size="lg" />
        <p className="empty-state__title">No transactions yet</p>
        <p className="empty-state__subtitle">Trades and account resets will show up here.</p>
      </div>
    );
  }

  return (
    <div className="funds-history__list">
      {filtered.map((row) => {
        const credit = isCredit(row.type);
        return (
          <div className="funds-history__row" key={row._id}>
            <div className="funds-history__row-main">
              <span
                className={`funds-history__icon funds-history__icon--${credit ? "deposit" : "withdrawal"}`}
                aria-hidden="true"
              >
                {credit ? "+" : "−"}
              </span>
              <div className="funds-history__text">
                <span className="funds-history__type">{row.note || row.type}</span>
                <span className="funds-history__date">{formatHistoryDate(row.createdAt)}</span>
              </div>
            </div>
            <span className={`funds-history__amount ${credit ? "is-up" : "is-down"}`}>
              {credit ? "+" : "−"}
              {formatCurrency(row.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function FundsPage() {
  const dispatch = useDispatch();

  const cashBalance = useSelector(selectCashBalance);
  const buyingPower = useSelector(selectIntradayBuyingPower);
  const investedValue = useSelector(selectInvestedValue);
  const currentHoldingsValue = useSelector(selectCurrentHoldingsValue);
  const todaysPL = useSelector(selectTodaysPL);
  const netWorth = useSelector(selectNetWorth);
  const realizedPnL = useSelector(selectRealizedPnL);
  const history = useSelector(selectFundsHistory);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    dispatch(fetchWallet());
    dispatch(fetchWalletLedger());
  }, [dispatch]);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 3000);
  }, []);

  const totalCapital = Math.max(cashBalance, 0) + currentHoldingsValue;
  const cashPercent = totalCapital > 0 ? (Math.max(cashBalance, 0) / totalCapital) * 100 : 100;
  const investedPercent = totalCapital > 0 ? (currentHoldingsValue / totalCapital) * 100 : 0;

  const handleReset = async () => {
    setResetting(true);
    await dispatch(resetPaperTrading());
    setResetting(false);
    setResetOpen(false);
    showToast("Account reset — fresh ₹5,00,000 paper trading balance allotted.", "neutral");
  };

  return (
    <div className="funds-page">
      <header className="page-header funds-page__header-row">
        <PageIcon src={iconFunds} tone="funds" size="lg" />
        <div className="page-header__text">
          <p className="funds-page__eyebrow">Funds</p>
          <h1 className="page-header__title">Equity funds &amp; margin</h1>
        </div>
        <div className="page-header__meta">
          <SegmentTabs />
        </div>
      </header>

      <Card className="funds-hero" raised padded>
        <div>
          <span className="funds-hero__label">Available to trade</span>
          <div className="funds-hero__value">{formatCurrency(cashBalance)}</div>
          <span className="funds-hero__sub">
            {formatCurrency(buyingPower)} intraday buying power (5x, informational) · fixed{" "}
            {formatCurrency(BASE_FUNDS, { decimals: 0 })} paper capital — moves only with your
            trades
          </span>
        </div>

        <div className="funds-hero__actions">
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            Reset paper trading
          </Button>
        </div>

        <div className="funds-allocation">
          <div className="funds-allocation__row">
            <span>Cash vs. invested</span>
            <strong>{formatCurrency(totalCapital)} total</strong>
          </div>
          <div className="funds-allocation__bar">
            <span className="funds-allocation__segment funds-allocation__segment--cash" style={{ width: `${cashPercent}%` }} />
            <span className="funds-allocation__segment funds-allocation__segment--invested" style={{ width: `${investedPercent}%` }} />
          </div>
          <div className="funds-allocation__legend">
            <span>
              <span className="funds-allocation__dot funds-allocation__dot--cash" />
              Free cash · {formatCurrency(Math.max(cashBalance, 0))}
            </span>
            <span>
              <span className="funds-allocation__dot funds-allocation__dot--invested" />
              Invested (current value) · {formatCurrency(currentHoldingsValue)}
            </span>
          </div>
        </div>
      </Card>

      <NetWorthTrendChart />

      <section className="funds-stats">
        <StatCard label="Invested (cost)" value={formatCurrency(investedValue)} />
        <StatCard
          label="Today's P&amp;L"
          value={`${todaysPL >= 0 ? "+" : ""}${formatCurrency(todaysPL)}`}
          tone={todaysPL >= 0 ? "is-up" : "is-down"}
          caption="Holdings + open positions, marked to market"
        />
        <StatCard
          label="Realized P&amp;L"
          value={`${realizedPnL >= 0 ? "+" : ""}${formatCurrency(realizedPnL)}`}
          tone={realizedPnL >= 0 ? "is-up" : "is-down"}
          caption="Booked on closed trades (FIFO-matched)"
        />
        <StatCard label="Net worth" value={formatCurrency(netWorth)} caption="Cash + holdings + open P&L" />
      </section>

      <Card padded>
        <div className="funds-history__header">
          <h2 className="funds-history__title">Transaction history</h2>
          <div className="funds-history__filters">
            {HISTORY_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`funds-chip${historyFilter === f.key ? " funds-chip--active" : ""}`}
                onClick={() => setHistoryFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <HistoryList history={history} filter={historyFilter} />
      </Card>

      <p className="funds-page__disclaimer">
        All figures are virtual and reflect your paper trading account only. No real funds, banks
        or payment providers are involved.
      </p>

      <Modal
        isOpen={resetOpen}
        onClose={() => !resetting && setResetOpen(false)}
        title="Reset paper trading account?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset} disabled={resetting}>
              {resetting ? "Resetting…" : "Yes, reset everything"}
            </Button>
          </>
        }
      >
        <p>
          This clears every holding, position and order, and restores your virtual balance to{" "}
          {formatCurrency(BASE_FUNDS, { decimals: 0 })}. Your watchlist is not affected. This
          can't be undone.
        </p>
      </Modal>

      {toast && (
        <div className={`funds-toast funds-toast--${toast.tone}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}