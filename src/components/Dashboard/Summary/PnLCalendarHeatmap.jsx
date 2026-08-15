import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconGrowth from "../../../assets/icons/icon-growth.png";
import { selectDailyTradingPerformance } from "../../../redux/selectors/tradeAnalyticsSelectors";
import { formatCurrency } from "../../../utils/formatCurrency";
import "./PnLCalendarHeatmap.css";
import "../../../styles/variables.css";
import "../../../styles/global.css";
import "../../../styles/icons.css";

/* Range presets. `weeks` is chosen so each preset always renders full
   Sun→Sat columns while comfortably covering the named period (13
   weeks safely spans "3 months", 53 weeks safely spans "1 year"
   including a possible partial edge week). */
const RANGES = [
  { key: "3M", label: "3M", weeks: 13, description: "Last 3 months" },
  { key: "6M", label: "6M", weeks: 26, description: "Last 6 months" },
  { key: "1Y", label: "1Y", weeks: 53, description: "Last 1 year" },
];

/* Fixed "standard" cell size per range — the GAP between cells is what
   stretches dynamically (see the ResizeObserver effect below) to fill
   the card's actual measured width, so every range uses the full box
   consistently instead of leaving a dead zone for less-dense ranges. */
const CELL_SIZE_BY_RANGE = { "3M": 22, "6M": 14, "1Y": 9 };
const BASE_GAP = 3; // minimum spacing — also what's used (with horizontal scroll) if a container is too narrow to fit at all
const MAX_GAP = 14; // upper bound so gaps can't blow out into oddly sparse spacing on very wide cards

function cellRadiusFor(cellSize) {
  if (cellSize >= 18) return 6;
  if (cellSize >= 12) return 4;
  return 2;
}

/**
 * dayKey — creates a YYYY-MM-DD key from a Date object.
 * Used consistently to match dailyPerformance Redux keys.
 */
function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * buildGrid — builds `weeksToShow` Sun→Sat week columns that always
 * END on the Saturday of the CURRENT week.
 *
 * Anchoring to the Saturday of the current week first, then counting
 * backward exactly `weeksToShow * 7` days, lands on a Sunday with no
 * correction needed — so today is always inside the grid. Days after
 * today (within this same trailing week) are marked isFuture and
 * rendered as empty placeholders.
 */
function buildGrid(dailyPerformance, now, weeksToShow) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayKey = dayKey(today);

  // Saturday of the week containing today.
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const totalDays = weeksToShow * 7;
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - totalDays + 1); // lands on a Sunday

  const days = [];
  const cursor = new Date(startDate);
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(cursor);
    const key = dayKey(d);

    days.push({
      date: d,
      key,
      data: dailyPerformance[key] ?? null,
      isFuture: d > today,
      isToday: key === todayKey,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

/**
 * buildMonthLabels — creates month labels for each week column.
 * Only shows a label when the month changes from the previous week.
 */
function buildMonthLabels(weeks) {
  let lastMonth = null;
  return weeks.map((week) => {
    const firstDay = week[0].date;
    const month = firstDay.getMonth();
    if (month !== lastMonth) {
      lastMonth = month;
      return firstDay.toLocaleDateString("en-IN", { month: "short" });
    }
    return null;
  });
}

/**
 * intensityStyle — returns background color based on P&L value.
 * Uses CSS color-mix so it adapts automatically to light/dark mode
 * and to every theme (navy/olive/charcoal/sand), since it's built
 * from --success-fill / --danger-fill / --surface-tertiary, all of
 * which are already theme-reactive tokens.
 */
function intensityStyle(pnl, maxAbs) {
  if (pnl == null) return { background: "var(--surface-tertiary)" };
  if (maxAbs === 0) return { background: "var(--surface-tertiary)" };

  const intensity = Math.min(Math.abs(pnl) / maxAbs, 1);
  const strength = 18 + intensity * 62; // 18% (min) to 80% (max)
  const token = pnl >= 0 ? "--success-fill" : "--danger-fill";

  return {
    background: `color-mix(in srgb, var(${token}) ${strength}%, var(--surface-tertiary))`,
  };
}

/**
 * topSymbolsForDay — extracts top N symbols by P&L for a given day.
 * Used in the detail panel to show which symbols drove the day's P&L.
 */
function topSymbolsForDay(day, max = 6) {
  if (!day?.trades?.length) return [];

  const bySymbol = {};
  day.trades.forEach((t) => {
    if (!bySymbol[t.symbol]) {
      bySymbol[t.symbol] = { symbol: t.symbol, pnl: 0 };
    }
    bySymbol[t.symbol].pnl += t.pnl;
  });

  return Object.values(bySymbol)
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
    .slice(0, max);
}

/**
 * PnLCalendarHeatmap — rolling P&L calendar with a 3M / 6M / 1Y range
 * selector. Shows closing P&L per day, color-coded from red (loss) to
 * green (profit). Always ends on today; future dates in the current
 * week are grayed out. Rolls over to the next day automatically at
 * midnight. Grid always fills the card's full width regardless of
 * range (see the ResizeObserver effect below).
 *
 * UPDATED — day details no longer appear in a floating per-cell
 * tooltip (which could get clipped near the top of the card and left
 * the space below the grid empty). Hovering/focusing a cell now
 * populates a persistent detail panel docked under the grid, which
 * also fills what used to be dead space and reads as a proper "info
 * card" rather than a hover-only affordance.
 */
export default function PnLCalendarHeatmap({ compact = false }) {
  const dailyPerformance = useSelector(selectDailyTradingPerformance);

  const [now, setNow] = useState(() => new Date());
  const [range, setRange] = useState("3M");
  const [activeDay, setActiveDay] = useState(null);
  const scrollRef = useRef(null);
  const [gap, setGap] = useState(BASE_GAP);

  // Ticking `now` every minute is what makes the grid roll over to a
  // new day at midnight — today's key changes, isFuture/isToday
  // recompute, and a new trailing cell appears without a reload.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const activeRange = useMemo(
    () => RANGES.find((r) => r.key === range) ?? RANGES[0],
    [range],
  );

  const cellSize = CELL_SIZE_BY_RANGE[activeRange.key];
  const cellRadius = cellRadiusFor(cellSize);

  // Measures the scroll container's actual visible width and stretches
  // the gap between cells so `weeks` columns always fill it exactly.
  // This is what makes 3M (13 columns) use just as much of the card's
  // width as 1Y (53 columns) instead of leaving empty space. Falls back
  // to BASE_GAP (with horizontal scroll taking over) only if a
  // container is too narrow to fit even at minimum spacing.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    const measure = () => {
      const containerWidth = el.clientWidth;
      const weeks = activeRange.weeks;
      const rawGap =
        weeks > 1
          ? (containerWidth - weeks * cellSize) / (weeks - 1)
          : BASE_GAP;
      setGap(Math.min(MAX_GAP, Math.max(BASE_GAP, rawGap)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeRange.weeks, cellSize]);

  const weeks = useMemo(
    () => buildGrid(dailyPerformance, now, activeRange.weeks),
    [dailyPerformance, now, activeRange.weeks],
  );

  const monthLabels = useMemo(() => buildMonthLabels(weeks), [weeks]);

  // Scale color intensity relative to the *visible* range only, so a
  // quiet month doesn't look washed out just because some other month
  // in your history had one huge outlier day.
  const maxAbs = useMemo(() => {
    let max = 0;
    weeks.forEach((week) =>
      week.forEach((day) => {
        if (day.data?.pnl != null) max = Math.max(max, Math.abs(day.data.pnl));
      }),
    );
    return max;
  }, [weeks]);

  // Total realized P&L across the whole visible range, shown as a
  // headline stat next to the range selector so the header carries real
  // information, not just controls.
  const rangeTotal = useMemo(() => {
    let total = 0;
    weeks.forEach((week) =>
      week.forEach((day) => {
        if (!day.isFuture && day.data?.pnl != null) total += day.data.pnl;
      }),
    );
    return total;
  }, [weeks]);

  // Clear the active day whenever the range changes (its date object no
  // longer maps to a rendered cell) so the panel doesn't show stale data.
  useEffect(() => {
    setActiveDay(null);
  }, [range]);

  const activeSymbols = useMemo(
    () => topSymbolsForDay(activeDay?.data),
    [activeDay],
  );

  const hasAnyTrade = Object.keys(dailyPerformance).length > 0;

  // Keep "today" in view whenever the range or data changes — the
  // grid scrolls right-to-left through time, most recent on the right.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [range, weeks]);

  const monthYearLabel = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const handleEnter = (day) => {
    if (day.isFuture) return;
    setActiveDay(day);
  };
  const handleLeave = (day) => {
    setActiveDay((cur) => (cur?.key === day.key ? null : cur));
  };

  return (
    <Card
      className={`pnl-heatmap ${compact ? "pnl-heatmap--compact" : ""}`}
      data-range={range}
      raised
    >
      {/* Cell-size/gap/radius custom properties live on this inner
         wrapper (set from React state) rather than relying on Card
         forwarding an arbitrary `style` prop through to its root
         element. `display: contents` (in the CSS) makes this wrapper
         invisible to layout — its children still sit directly in
         .pnl-heatmap's flex column exactly as before — while the custom
         properties it defines still inherit down to every descendant
         that reads var(--cell-size) etc. */}
      <div
        className="pnl-heatmap__vars"
        style={{
          "--cell-size": `${cellSize}px`,
          "--cell-gap": `${gap}px`,
          "--cell-radius": `${cellRadius}px`,
        }}
      >
        {/* Header: icon + title/subtitle on the left, range total + range
           selector on the right */}
        <div className="pnl-heatmap__header">
          <div className="section-heading">
            <PageIcon src={iconGrowth} tone="growth" size="sm" />
            <div className="section-heading__text">
              <span className="section-heading__title">
                Realized P&amp;L Calendar
              </span>
              <span className="section-heading__subtitle">
                {monthYearLabel} &middot; {activeRange.description}
              </span>
            </div>
          </div>

          <div className="pnl-heatmap__header-right">
            {hasAnyTrade && (
              <span
                className={`pnl-heatmap__range-total ${rangeTotal >= 0 ? "is-up" : "is-down"}`}
              >
                {formatCurrency(rangeTotal)}
                <small>{activeRange.label} P&amp;L</small>
              </span>
            )}

            <div
              className="pnl-heatmap__range"
              role="tablist"
              aria-label="Calendar range"
            >
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  role="tab"
                  aria-selected={r.key === range}
                  className={`pnl-heatmap__range-btn ${r.key === range ? "is-active" : ""}`}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty state when no trades at all */}
        {!hasAnyTrade ? (
          <div className="pnl-heatmap__empty">
            Close a trade (sell something you hold) and its daily P&amp;L will
            show up here.
          </div>
        ) : (
          <>
            {/* Scrollable region: month labels + grid scroll together */}
            <div className="pnl-heatmap__scroll scroll-area" ref={scrollRef}>
              <div className="pnl-heatmap__months">
                {monthLabels.map((label, i) => (
                  <div className="pnl-heatmap__month-cell" key={i}>
                    {label && <span>{label}</span>}
                  </div>
                ))}
              </div>

              <div className="pnl-heatmap__grid" role="grid">
                {weeks.map((week, wi) => (
                  <div className="pnl-heatmap__week" key={wi}>
                    {week.map((day) => (
                      <div
                        key={day.key}
                        className={`pnl-heatmap__cell ${
                          day.isFuture ? "is-future" : ""
                        } ${day.isToday ? "is-today" : ""} ${
                          activeDay?.key === day.key ? "is-active" : ""
                        }`}
                        style={
                          day.isFuture
                            ? undefined
                            : intensityStyle(day.data?.pnl, maxAbs)
                        }
                        role="gridcell"
                        tabIndex={day.isFuture ? -1 : 0}
                        onMouseEnter={() => handleEnter(day)}
                        onMouseLeave={() => handleLeave(day)}
                        onFocus={() => handleEnter(day)}
                        onBlur={() => handleLeave(day)}
                        aria-label={`${day.date.toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}: ${
                          day.data
                            ? `${day.data.tradeCount} trades, ${formatCurrency(day.data.pnl)}`
                            : "No trades"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel — docked below the grid. Idle state shows the
               legend; hovering/focusing any (non-future) cell swaps it
               for that day's full breakdown. This is what now fills the
               previously-empty space under the grid, and avoids the old
               floating tooltip getting clipped near the top of the card. */}
            <div
              className="pnl-heatmap__detail"
              data-state={activeDay ? "active" : "idle"}
            >
              {activeDay ? (
                <div className="pnl-heatmap__detail-content">
                  <div className="pnl-heatmap__detail-head">
                    <div className="pnl-heatmap__detail-date">
                      <strong>
                        {activeDay.date.toLocaleDateString("en-IN", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </strong>
                      {activeDay.isToday && (
                        <span className="pnl-heatmap__detail-today">Today</span>
                      )}
                    </div>

                    {activeDay.data ? (
                      <div
                        className={`pnl-heatmap__detail-pnl ${
                          activeDay.data.pnl >= 0 ? "is-up" : "is-down"
                        }`}
                      >
                        {formatCurrency(activeDay.data.pnl)}
                        <small>
                          {activeDay.data.tradeCount} trade
                          {activeDay.data.tradeCount !== 1 ? "s" : ""}
                        </small>
                      </div>
                    ) : (
                      <div className="pnl-heatmap__detail-pnl is-empty">
                        <small>No closed trades</small>
                      </div>
                    )}
                  </div>

                  {activeSymbols.length > 0 ? (
                    <div className="pnl-heatmap__detail-symbols">
                      {activeSymbols.map((s) => (
                        <div
                          key={s.symbol}
                          className="pnl-heatmap__detail-symbol-row"
                        >
                          <span className="pnl-heatmap__detail-symbol-name">
                            {s.symbol}
                          </span>
                          <span
                            className={`pnl-heatmap__detail-symbol-pnl ${
                              s.pnl >= 0 ? "is-up" : "is-down"
                            }`}
                          >
                            {formatCurrency(s.pnl)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    activeDay.data && (
                      <div className="pnl-heatmap__detail-empty-note">
                        No per-symbol breakdown available for this day.
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="pnl-heatmap__detail-placeholder">
                  <span
                    className="pnl-heatmap__detail-placeholder-icon"
                    aria-hidden="true"
                  />
                  <span>
                    Hover or focus any day above to see its full trade breakdown
                    here
                  </span>
                </div>
              )}

              <div className="pnl-heatmap__legend">
                <span>Loss</span>
                <span
                  className="pnl-heatmap__legend-gradient"
                  aria-hidden="true"
                />
                <span>Profit</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
