import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import Card from "../../common/Card/Card";
import Button from "../../common/Button/Button";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconPositions from "../../../assets/icons/icon-positions.png";
import { useGeneralContext } from "../../Trade/GeneralContext";
import { fetchPositions } from "../../../redux/slices/positionsSlice";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./Positions.css";
import "../../../styles/icons.css";

// Reads MIS (intraday) fills from BuyActionWindow via positionsSlice. P&L is
// computed live against marketSlice.stocks, same source IndexTicker/
// GainersLosers/TopBar use. Calculation logic is unchanged from before —
// only the UI, the page header, and one new *derived* visual (a bar chart
// built from the same per-row pnl values already computed below) were
// added.
//
// FIXED — this component only ever read state.positions.list; nothing
// dispatched fetchPositions() to populate it. Positions showed up after a
// same-session MIS buy (openSellWindow / BuyActionWindow keep the slice
// warm locally) but vanished on every hard refresh, since the store resets
// to initialState (list: []) and nothing here ever re-fetched from
// /allpositions. Same root cause and same fix pattern as Holdings.jsx.
export default function Positions() {
  const dispatch = useDispatch();
  const positions = useSelector((state) => state.positions.list);
  const status = useSelector((state) => state.positions.status);
  const stocks = useSelector((state) => state.market.stocks);
  const { openSellWindow } = useGeneralContext();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchPositions());
  }, [dispatch]);

  const rows = positions.map((p) => {
    const live = stocks.find((s) => s.symbol === p.symbol);
    const ltp = live?.ltp ?? p.ltp;
    const pnl = (ltp - p.avgPrice) * p.qty;
    const pnlPercent = p.avgPrice > 0 ? ((ltp - p.avgPrice) / p.avgPrice) * 100 : 0;
    return { ...p, ltp, pnl, pnlPercent, live };
  });

  // Sum of the pnl values already computed above, for the summary strip.
  const totals = useMemo(() => {
    const totalPnL = rows.reduce((sum, r) => sum + r.pnl, 0);
    const totalInvested = rows.reduce((sum, r) => sum + r.avgPrice * r.qty, 0);
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const profitableCount = rows.filter((r) => r.pnl >= 0).length;
    return { totalPnL, totalPnLPercent, profitableCount };
  }, [rows]);

  // NEW — same rows, reshaped for the bar chart. No new calculation, just
  // a sort so the biggest winner/loser reads clearly top-to-bottom.
  const chartRows = useMemo(
    () => [...rows].sort((a, b) => b.pnl - a.pnl),
    [rows],
  );

  const hasPositions = rows.length > 0;

  const header = (
    <div className="page-header">
      <PageIcon src={iconPositions} tone="positions" size="lg" />
      <div className="page-header__text">
        <h1 className="page-header__title">Positions</h1>
        <p className="page-header__subtitle">Today's open intraday (MIS) trades, marked live</p>
      </div>
      {hasPositions && (
        <span className="page-header__meta positions-page__count">{rows.length} open</span>
      )}
    </div>
  );

  // Loading gate — without this there's a one-frame flash of the "no open
  // positions" empty state between mount and the fetch resolving, same as
  // the bug this whole fix addresses, just one level down.
  if (status === "loading" || status === "idle") {
    return (
      <div className="positions-page">
        {header}
        <Card raised className="empty-state">
          <PageIcon src={iconPositions} tone="muted" size="xl" />
          <p className="empty-state__title">Loading positions…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="positions-page">
      {header}

      {hasPositions && (
        <>
          <Card raised className="positions-summary">
            <div className="positions-summary__stat">
              <span className="positions-summary__label">Total M2M P&amp;L</span>
              <span className={`positions-summary__value ${totals.totalPnL >= 0 ? "is-up" : "is-down"}`}>
                {formatCurrency(totals.totalPnL)}
              </span>
              <span className={`positions-summary__sub ${totals.totalPnL >= 0 ? "is-up" : "is-down"}`}>
                ({formatPercent(totals.totalPnLPercent)})
              </span>
            </div>
            <div className="positions-summary__divider" />
            <div className="positions-summary__stat">
              <span className="positions-summary__label">Profitable</span>
              <span className="positions-summary__value">
                {totals.profitableCount} / {rows.length}
              </span>
            </div>
          </Card>

          {/* NEW — P&L by symbol, same visual language as the Holdings bar
              chart so the two pages feel like one system. */}
          <Card className="positions-chart" raised>
            <div className="section-heading">
              <PageIcon src={iconPositions} tone="positions" size="sm" />
              <div className="section-heading__text">
                <span className="section-heading__title">P&amp;L by Position</span>
                <span className="section-heading__subtitle">Unrealized, marked to last traded price</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={Math.max(chartRows.length * 34, 120)}>
              <BarChart
                data={chartRows}
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
                <Tooltip
                  cursor={{ fill: "var(--surface-hover)" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0].payload;
                    return (
                      <div className="positions-pnl-tooltip">
                        <div className="positions-pnl-tooltip__symbol">{row.symbol}</div>
                        <div className="positions-pnl-tooltip__row">
                          <span>Qty.</span>
                          <strong>{row.qty}</strong>
                        </div>
                        <div className="positions-pnl-tooltip__row">
                          <span>Avg. Price</span>
                          <strong>{formatCurrency(row.avgPrice)}</strong>
                        </div>
                        <div className="positions-pnl-tooltip__row">
                          <span>LTP</span>
                          <strong>{formatCurrency(row.ltp)}</strong>
                        </div>
                        <div className={`positions-pnl-tooltip__row ${row.pnl >= 0 ? "is-up" : "is-down"}`}>
                          <span>P&amp;L</span>
                          <strong>
                            {formatCurrency(row.pnl)} ({formatPercent(row.pnlPercent)})
                          </strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="pnl" radius={[4, 4, 4, 4]} barSize={18}>
                  {chartRows.map((row) => (
                    <Cell key={row.symbol} fill={row.pnl >= 0 ? "var(--success-fill)" : "var(--danger-fill)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {!hasPositions ? (
        <Card raised className="empty-state">
          <PageIcon src={iconPositions} tone="muted" size="xl" />
          <p className="empty-state__title">No open intraday positions yet</p>
          <p className="empty-state__subtitle">
            Buy a stock with product type "Intraday (MIS)" to see it here, with live P&amp;L and a
            per-position breakdown.
          </p>
          <Button variant="primary" onClick={() => navigate("/")}>
            Browse Market Movers
          </Button>
        </Card>
      ) : (
        <Card raised padded={false} className="positions-table-card">
          <div className="positions-table-wrap">
            <table className="positions-table">
              <thead>
                <tr>
                  <th className="is-left">Symbol</th>
                  <th>Qty.</th>
                  <th>Avg. Price</th>
                  <th>LTP</th>
                  <th>P&amp;L</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const isProfit = row.pnl >= 0;
                  return (
                    <tr key={row.symbol} className="positions-table__row">
                      <td className="is-left">
                        <div className="positions-table__identity">
                          <span className="positions-table__symbol">{row.symbol}</span>
                          {row.live?.name && (
                            <span className="positions-table__name">{row.live.name}</span>
                          )}
                        </div>
                      </td>
                      <td>{row.qty}</td>
                      <td>{formatCurrency(row.avgPrice)}</td>
                      <td>
                        <span className="positions-table__ltp-wrap">
                          {row.live && <span className="positions-table__live-dot" aria-hidden="true" />}
                          {formatCurrency(row.ltp)}
                        </span>
                      </td>
                      <td className={isProfit ? "is-up" : "is-down"}>
                        <span className="positions-table__pnl">
                          {formatCurrency(row.pnl)}
                          <span className="positions-table__pnl-pct">
                            ({formatPercent(row.pnlPercent)})
                          </span>
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={!row.live}
                          title={!row.live ? "Live price unavailable for this symbol" : undefined}
                          onClick={() => openSellWindow(row.live, "MIS")}
                        >
                          Exit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}