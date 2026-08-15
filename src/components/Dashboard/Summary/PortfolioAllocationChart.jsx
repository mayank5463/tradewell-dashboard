import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconHoldings from "../../../assets/icons/icon-holdings.png";
import { selectHoldingsAllocation } from "../../../redux/selectors/fundsSelectors";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./PortfolioAllocationChart.css";
// NOTE: PortfolioAllocationChart.css needs one small addition — see the
// README section "PortfolioAllocationChart.css addition" for the exact
// snippet (styles for the new .portfolio-allocation-chart__total badge
// and .portfolio-allocation-chart__header layout).
import "../../../styles/variables.css";
import "../../../styles/global.css";
import "../../../styles/icons.css";

// Palette is deliberately built ONLY from tokens that are re-mapped in
// EVERY theme block in variables.css (navy/olive/charcoal/sand) — so a
// slice never silently falls back to the wrong hue when the theme
// switches. Cycled with a slightly lower opacity pass for portfolios with
// more holdings than base colors.
const BASE_SLICE_VARS = [
  "--brand-primary",
  "--success-fill",
  "--info-fill",
  "--warning-fill",
  "--danger-fill",
];

function colorForIndex(index) {
  const base = BASE_SLICE_VARS[index % BASE_SLICE_VARS.length];
  const cycle = Math.floor(index / BASE_SLICE_VARS.length);
  return cycle === 0 ? `var(${base})` : `color-mix(in srgb, var(${base}) ${70 - cycle * 15}%, transparent)`;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="portfolio-allocation-chart__tooltip">
      <div className="portfolio-allocation-chart__tooltip-symbol">{row.symbol}</div>
      <div className="portfolio-allocation-chart__tooltip-value">{formatCurrency(row.value)}</div>
      <div className="portfolio-allocation-chart__tooltip-percent">{formatPercent(row.percent)} of holdings</div>
    </div>
  );
}

export default function PortfolioAllocationChart() {
  const navigate = useNavigate();
  const allocation = useSelector(selectHoldingsAllocation);

  const isEmpty = allocation.length === 0;
  const totalValue = allocation.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="portfolio-allocation-chart" raised>
      <div className="portfolio-allocation-chart__header">
        <div className="section-heading" style={{ marginBottom: 0 }}>
          <PageIcon src={iconHoldings} tone="holdings" size="sm" />
          <div className="section-heading__text">
            <span className="section-heading__title">Portfolio Allocation</span>
            <span className="section-heading__subtitle">By current holding value</span>
          </div>
        </div>
        {!isEmpty && (
          <span className="portfolio-allocation-chart__total">{formatCurrency(totalValue)}</span>
        )}
      </div>

      {isEmpty ? (
        <div className="portfolio-allocation-chart__empty">
          No holdings yet — buy a stock to see your allocation breakdown here.
        </div>
      ) : (
        <div className="portfolio-allocation-chart__body">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={allocation}
                dataKey="value"
                nameKey="symbol"
                innerRadius="62%"
                outerRadius="92%"
                paddingAngle={2}
                stroke="var(--card-bg)"
                strokeWidth={2}
                onClick={(entry) => navigate(`/stock/${entry.symbol}`)}
              >
                {allocation.map((row, index) => (
                  <Cell key={row.symbol} fill={colorForIndex(index)} cursor="pointer" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <ul className="portfolio-allocation-chart__legend">
            {allocation.map((row, index) => (
              <li
                key={row.symbol}
                className="portfolio-allocation-chart__legend-item"
                onClick={() => navigate(`/stock/${row.symbol}`)}
              >
                <span
                  className="portfolio-allocation-chart__legend-dot"
                  style={{ background: colorForIndex(index) }}
                />
                <span className="portfolio-allocation-chart__legend-symbol">{row.symbol}</span>
                <span className="portfolio-allocation-chart__legend-percent">
                  {formatPercent(row.percent)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}