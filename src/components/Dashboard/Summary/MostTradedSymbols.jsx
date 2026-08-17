import { useMemo, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import "../../../styles/SectionHeadingsTheme.css"; 

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

import Card from "../../common/Card/Card";
import {
  selectTopTradedSymbols,
  TOP_TRADED_CRITERIA,
} from "../../../redux/selectors/tradeAnalyticsSelectors";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./MostTradedSymbols.css";
import "../../../styles/variables.css";
import "../../../styles/global.css";

const LIMIT_OPTIONS = [5, 10, 20, 50, 100];

function formatCompact(value) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

function getMetric(row, criteria) {
  switch (criteria) {
    case "value": return row.totalValue;
    case "profitTrades": return row.profitTradeCount;
    case "lossTrades": return row.lossTradeCount;
    case "shortTerm": return row.shortTermValue;
    case "longTerm": return row.longTermValue;
    default: return row.orderCount;
  }
}

function formatMetric(value, criteria) {
  switch (criteria) {
    case "value":
    case "shortTerm":
    case "longTerm":
      return formatCurrency(value);
    default:
      return formatCompact(value);
  }
}

function CustomTooltip({ active, payload, criteria }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const config = TOP_TRADED_CRITERIA[criteria] ?? TOP_TRADED_CRITERIA.orders;

  return (
    <div className="most-traded__tooltip">
      <div className="most-traded__tooltip-header">
        <div>
          <div className="most-traded__tooltip-symbol">{row.symbol}</div>
          {row.name !== row.symbol && (
            <div className="most-traded__tooltip-company">{row.name}</div>
          )}
        </div>
        <span className="most-traded__tooltip-rank">#{row.rank}</span>
      </div>

      <div className="most-traded__tooltip-highlight">
        <span>{config.label}</span>
        <strong>{formatMetric(getMetric(row, criteria), criteria)}</strong>
      </div>

      <div className="most-traded__tooltip-grid">
        <div><span>Total Orders</span><strong>{row.orderCount}</strong></div>
        <div><span>Trade Value</span><strong>{formatCurrency(row.totalValue)}</strong></div>
        <div><span>Profit Trades</span><strong className="is-up">{row.profitTradeCount}</strong></div>
        <div><span>Loss Trades</span><strong className="is-down">{row.lossTradeCount}</strong></div>
      </div>

      <div className="most-traded__tooltip-footer">Click the bar to view complete analytics</div>
    </div>
  );
}

export default function MostTradedSymbols({ selectedSymbol, onSelectStock }) {
  const [criteria, setCriteria] = useState("orders");
  const [limit, setLimit] = useState(5);

  const ranking = useSelector((state) => selectTopTradedSymbols(state, { criteria, limit }));
  const rows = ranking?.rows ?? [];
  const rankingInfo = TOP_TRADED_CRITERIA[criteria] ?? TOP_TRADED_CRITERIA.orders;
  const isEmpty = rows.length === 0;

  const handleCriteriaChange = useCallback((e) => {
    setCriteria(e.target.value);
    onSelectStock?.(null);
  }, [onSelectStock]);

  const handleLimitChange = useCallback((e) => {
    setLimit(Number(e.target.value));
    onSelectStock?.(null);
  }, [onSelectStock]);

  const handleBarClick = useCallback((row) => {
    if (!row) return;
    onSelectStock?.(row.symbol === selectedSymbol ? null : row);
  }, [onSelectStock, selectedSymbol]);

  const chartData = useMemo(
    () => rows.map((row, index) => ({ ...row, rank: index + 1, metric: getMetric(row, criteria) })),
    [rows, criteria],
  );

  const chartHeight = useMemo(() => {
    const bars = Math.max(chartData.length, 5);
    return Math.max(280, bars * 52);
  }, [chartData.length]);

  if (isEmpty) {
    return (
      <Card className="most-traded" raised>
        <div className="most-traded__header">
          <div>
            <h3>Top Traded</h3>
            <span className="most-traded__subtitle">Your most active trading symbols</span>
          </div>
        </div>
        <div className="most-traded__empty">
          <h4>No trading history yet</h4>
          <p>Your most traded stocks will automatically appear here once you begin placing orders.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="most-traded" raised>
      <div className="most-traded__header">
        <div className="most-traded__heading">
          <h3>Top Traded</h3>
          <span className="most-traded__subtitle">{rankingInfo.description}</span>
        </div>

        <div className="most-traded__controls">
          <div className="most-traded__control">
            <label htmlFor="rankBy">Rank By</label>
            <select id="rankBy" value={criteria} onChange={handleCriteriaChange}>
              {Object.entries(TOP_TRADED_CRITERIA).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="most-traded__control">
            <label htmlFor="topCount">Top</label>
            <select id="topCount" value={limit} onChange={handleLimitChange}>
              {LIMIT_OPTIONS.map((count) => (
                <option key={count} value={count}>{count}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 6, right: 28, left: 12, bottom: 8 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="symbol"
            width={88}
            tickLine={false}
            axisLine={false}
            stroke="var(--ranking-axis)"
            tick={{ fill: "var(--ranking-label)", fontWeight: 600, fontSize: 13 }}
          />
          <Tooltip cursor={{ fill: "var(--analytics-hover)" }} content={<CustomTooltip criteria={criteria} />} />
          <Bar
            dataKey="metric"
            radius={[0, 8, 8, 0]}
            barSize={24}
            cursor="pointer"
            animationDuration={500}
            onClick={handleBarClick}
            activeBar={{}}
            isAnimationActive={false}
          >
            {chartData.map((row) => (
              <Cell
                key={row.symbol}
                stroke="none"
                fill={selectedSymbol === row.symbol ? "var(--ranking-bar-hover)" : "var(--ranking-bar)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="most-traded__footer">
        <div className="most-traded__footer-left">
          <span className="most-traded__footer-title">Ranking Method</span>
          <span className="most-traded__footer-value">{rankingInfo.label}</span>
        </div>
        <div className="most-traded__footer-right">
          <span>Showing</span>
          <strong>{chartData.length}</strong>
          <span>of</span>
          <strong>{ranking.totalSymbols}</strong>
          <span>Symbols</span>
        </div>
      </div>
    </Card>
  );
}