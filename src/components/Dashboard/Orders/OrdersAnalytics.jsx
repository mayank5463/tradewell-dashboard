import { useSelector } from "react-redux";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconOrders from "../../../assets/icons/icon-orders.png";
import {
  selectBuySellSplit,
  selectDailyOrderVolume,
  selectOrderSizeDistribution,
} from "../../../redux/selectors/orderAnalyticsSelectors";
import { formatCurrency } from "../../../utils/formatCurrency";
import "./OrdersAnalytics.css";
import "../../../styles/icons.css";

function SplitTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="order-split__tooltip">
      <div className="order-split__tooltip-label">{row.label}</div>
      <div className="order-split__tooltip-row">
        <span>Orders</span>
        <strong>{row.count}</strong>
      </div>
      <div className="order-split__tooltip-row">
        <span>Value</span>
        <strong>{formatCurrency(row.value)}</strong>
      </div>
    </div>
  );
}

// Buy vs Sell split, by order count. A quick "am I mostly buying or
// mostly rotating out of positions" read at a glance.
export function BuySellSplit() {
  const split = useSelector(selectBuySellSplit);
  const totalOrders = split.buyCount + split.sellCount;
  const isEmpty = totalOrders === 0;

  const data = [
    { key: "buy", label: "Buy orders", count: split.buyCount, value: split.buyValue },
    { key: "sell", label: "Sell orders", count: split.sellCount, value: split.sellValue },
  ];

  return (
    <Card className="order-split" raised>
      <div className="section-heading">
        <PageIcon src={iconOrders} tone="orders" size="sm" />
        <div className="section-heading__text">
          <span className="section-heading__title">Buy / Sell Split</span>
          <span className="section-heading__subtitle">By number of orders placed</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="order-split__empty">
          No orders yet — your buy/sell mix will show up here once you start trading.
        </div>
      ) : (
        <div className="order-split__body">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius="62%"
                outerRadius="95%"
                paddingAngle={3}
                stroke="var(--card-bg)"
                strokeWidth={2}
              >
                <Cell key="buy" fill="var(--success-fill)" />
                <Cell key="sell" fill="var(--danger-fill)" />
              </Pie>
              <Tooltip content={<SplitTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="order-split__legend">
            {data.map((row) => (
              <div className="order-split__legend-item" key={row.key}>
                <span className={`order-split__legend-dot order-split__legend-dot--${row.key}`} />
                <div className="order-split__legend-text">
                  <span className="order-split__legend-label">
                    {row.label} · {row.count}
                  </span>
                  <span className="order-split__legend-value">{formatCurrency(row.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function VolumeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="order-volume__tooltip">
      <div className="order-volume__tooltip-date">
        {row.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
      </div>
      <div className="order-volume__tooltip-row">
        <span>Buys</span>
        <strong>{row.buyCount}</strong>
      </div>
      <div className="order-volume__tooltip-row">
        <span>Sells</span>
        <strong>{row.sellCount}</strong>
      </div>
      <div className="order-volume__tooltip-row">
        <span>Value</span>
        <strong>{formatCurrency(row.value)}</strong>
      </div>
    </div>
  );
}

// Last 14 days of order activity - stacked buy/sell counts per day. Shows
// whether trading is a daily habit or a once-a-month burst, and pairs well
// with the PnL calendar heatmap already on Summary.
export function DailyOrderVolume() {
  const data = useSelector((state) => selectDailyOrderVolume(state, 14));
  const hasAny = data.some((d) => d.buyCount + d.sellCount > 0);

  return (
    <Card className="order-volume" raised>
      <div className="section-heading">
        <PageIcon src={iconOrders} tone="orders" size="sm" />
        <div className="section-heading__text">
          <span className="section-heading__title">Order Activity</span>
          <span className="section-heading__subtitle">Last 14 days</span>
        </div>
      </div>

      {!hasAny ? (
        <div className="order-volume__empty">
          No orders in the last 14 days — recent activity will show up here.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={0}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey={(row) => row.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              minTickGap={16}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip content={<VolumeTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            <Bar dataKey="buyCount" stackId="orders" fill="var(--success-fill)" radius={[0, 0, 0, 0]} name="Buys" />
            <Bar dataKey="sellCount" stackId="orders" fill="var(--danger-fill)" radius={[4, 4, 0, 0]} name="Sells" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

function SizeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="order-volume__tooltip">
      <div className="order-volume__tooltip-date">{row.label}</div>
      <div className="order-volume__tooltip-row">
        <span>Orders</span>
        <strong>{row.count}</strong>
      </div>
    </div>
  );
}

// Order size histogram - buckets built from this account's own min/max
// order value (see selectOrderSizeDistribution), so it reads correctly
// whether someone places ₹500 orders or ₹5,00,000 orders. Reveals whether
// trading is consistently sized or wildly inconsistent position sizing -
// a real risk-discipline signal a plain order list can't surface.
//
// NEW — a dashed reference line marks the account's average order value,
// so instead of just seeing five bars, you can immediately see whether
// your typical trade sits left (small, cautious) or right (large,
// concentrated) of your own average.
export function OrderSizeDistribution() {
  const data = useSelector((state) => selectOrderSizeDistribution(state, 5));
  const isEmpty = data.length === 0;

  // Weighted average bucket position, derived purely from the same `data`
  // already returned by the selector — no new data source.
  const avgBucketIndex = (() => {
    if (isEmpty) return null;
    const totalCount = data.reduce((sum, d) => sum + d.count, 0);
    if (totalCount === 0) return null;
    const weighted = data.reduce((sum, d, i) => sum + d.count * i, 0);
    return weighted / totalCount;
  })();

  return (
    <Card className="order-volume" raised>
      <div className="section-heading">
        <PageIcon src={iconOrders} tone="orders" size="sm" />
        <div className="section-heading__text">
          <span className="section-heading__title">Order Size Distribution</span>
          <span className="section-heading__subtitle">How consistently you size your orders</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="order-volume__empty">
          No orders yet — your order-size pattern will show up here once you start trading.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "var(--chart-grid)" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={44}
            />
            <YAxis
              stroke="var(--chart-axis)"
              tick={{ fill: "var(--chart-label)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip content={<SizeTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
            {avgBucketIndex !== null && (
              <ReferenceLine
                x={data[Math.round(avgBucketIndex)]?.label}
                stroke="var(--chart-neutral)"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: "Avg.",
                  position: "top",
                  fill: "var(--chart-neutral)",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              />
            )}
            <Bar dataKey="count" fill="var(--brand-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}