import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
} from "lightweight-charts";
import { useStockHistory } from "./useStockHistory";
import RangeSelector, { RANGES, candleDurationLabel } from "./RangeSelector";
import "./StockChart.css";

// Requires: npm install lightweight-charts
// Written against v5's API (chart.addSeries(SeriesType, options) — the
// older chart.addCandlestickSeries()/addLineSeries() methods were removed
// in v5). If your installed version is 4.x, swap those two calls back.

// lightweight-charts wants either a UTC timestamp (seconds) for intraday
// resolutions, or a "YYYY-MM-DD" business-day string for daily+ — mixing
// the two within one series breaks rendering.
function toChartTime(timestamp, unit) {
  if (unit === "minutes" || unit === "hours") {
    return Math.floor(new Date(timestamp).getTime() / 1000);
  }
  return timestamp.slice(0, 10);
}

function toCandlestickPoint(candle, unit) {
  return {
    time: toChartTime(candle.timestamp, unit),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  };
}

function toLinePoint(candle, unit) {
  return { time: toChartTime(candle.timestamp, unit), value: candle.close };
}

function toVolumePoint(candle, unit, upColor, downColor) {
  return {
    time: toChartTime(candle.timestamp, unit),
    value: candle.volume ?? 0,
    color: candle.close >= candle.open ? upColor : downColor,
  };
}

// Canvas-based charts don't resolve CSS custom properties the way regular
// DOM elements do — resolve the actual value once via getComputedStyle
// instead of passing the literal "var(--x)" string, with a sane fallback.
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function formatCurrency(n) {
  if (n == null) return "—";
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

// Indian-style compact volume — 1,20,000 → "1.2L", 15,00,00,000 → "15 Cr".
function formatVolume(n) {
  if (n == null) return "—";
  const num = Number(n);
  if (num >= 1e7) return `${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
}

const CHART_TYPES = [
  { key: "candles", label: "Candles" },
  { key: "line", label: "Line" },
  { key: "area", label: "Area" },
];

export default function StockChart({ symbol }) {
  const { range, setRange, candles, status, isLive, oneDayPlan } =
    useStockHistory(symbol);
  const [chartType, setChartType] = useState("candles"); // "candles" | "line" | "area"
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverLegend, setHoverLegend] = useState(null); // candle under the crosshair, or null

  // Pull unit straight from the range config instead of guessing from
  // candle shape — RANGES already knows exactly what each tab requested.
  const rangeConfig = useMemo(
    () => RANGES.find((r) => r.key === range),
    [range],
  );
  const unit = rangeConfig?.unit || "days";

  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const renderedKeyRef = useRef(null); // which range is currently setData()'d in the chart
  const nearLiveEdgeRef = useRef(true); // is the visible window currently at the newest bar?

  const upColor = cssVar("--sd-up", "#0f9d58");
  const downColor = cssVar("--sd-down", "#e11d48");

  // ── Create the chart once, destroy on unmount ──────────────────────────
  useEffect(() => {
    if (!containerRef.current) return undefined;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: cssVar("--text-secondary", "#6b7280"),
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
      },
      grid: {
        vertLines: { color: cssVar("--border-default", "#eef0f7") },
        horzLines: { color: cssVar("--border-default", "#eef0f7") },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 400,
      localization: {
        priceFormatter: (p) => formatCurrency(p),
      },
      timeScale: {
        borderColor: cssVar("--border-default", "#eef0f7"),
        // FIXED — this is what stops the "zoom out and see blank space"
        // problem. Without these, the time scale is free to scroll past
        // the last candle actually loaded (whatever range/unit that is),
        // so zooming out on a 1-day intraday chart drags you into empty
        // canvas beyond market close. Pinning both edges means the user
        // can zoom/pan freely, but only ever within the data that's
        // actually been fetched for the active tab — never past it.
        fixLeftEdge: true,
        fixRightEdge: true,
        rightOffset: 4,
        minBarSpacing: 0.6,
      },
      rightPriceScale: {
        borderColor: cssVar("--border-default", "#eef0f7"),
        scaleMargins: { top: 0.1, bottom: 0.28 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: cssVar("--color-primary-500", "#3d4fe0"),
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: cssVar("--color-primary-500", "#3d4fe0"),
        },
        horzLine: {
          color: cssVar("--color-primary-500", "#3d4fe0"),
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: cssVar("--color-primary-500", "#3d4fe0"),
        },
      },
    });

    chartRef.current = chart;

    // Track whether the visible window currently sits at the newest bar.
    // Used below so a live poll tick only auto-scrolls the chart forward
    // if the user hadn't already scrolled back to look at history —
    // otherwise every 7s tick would yank them back to "now".
    const handleVisibleLogicalRangeChange = (logicalRange) => {
      if (!logicalRange || !seriesRef.current) return;
      const info = seriesRef.current.barsInLogicalRange(logicalRange);
      nearLiveEdgeRef.current =
        !info || info.barsAfter == null || info.barsAfter <= 2;
    };
    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

    // Crosshair-driven OHLCV legend. Falls back to null on mouse-leave —
    // the caller renders the latest candle's values in that case, so the
    // legend never goes blank.
    const handleCrosshairMove = (param) => {
      if (!param || !param.time || !seriesRef.current) {
        setHoverLegend(null);
        return;
      }
      const point = param.seriesData.get(seriesRef.current);
      if (!point) {
        setHoverLegend(null);
        return;
      }
      const volumePoint = volumeSeriesRef.current
        ? param.seriesData.get(volumeSeriesRef.current)
        : null;
      setHoverLegend({
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close ?? point.value,
        volume: volumePoint?.value,
        // param.time is a unix-seconds number for minutes/hours resolutions,
        // or a "YYYY-MM-DD" business-day string for days/weeks/months —
        // formatCandleDateTime below branches on which shape it got.
        time: param.time,
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    // ResizeObserver instead of a window "resize" listener — this also
    // catches the container changing size for reasons that have nothing
    // to do with the browser window (a sidebar collapsing, fullscreen
    // toggle, orientation change on mobile, etc), which `resize` misses.
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart
        .timeScale()
        .unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      renderedKeyRef.current = null;
    };
  }, []);

  // ── Swap series type when the Candles/Line/Area toggle changes ─────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
      seriesRef.current = null;
    }

    const priceFormat = { type: "price", precision: 2, minMove: 0.01 };

    if (chartType === "candles") {
      seriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderVisible: false,
        wickUpColor: upColor,
        wickDownColor: downColor,
        priceFormat,
        priceLineStyle: LineStyle.Dashed,
        priceLineWidth: 1,
        priceLineColor: cssVar("--color-primary-500", "#3d4fe0"),
      });
    } else if (chartType === "line") {
      seriesRef.current = chart.addSeries(LineSeries, {
        color: cssVar("--color-primary-500", "#3d4fe0"),
        lineWidth: 2,
        priceFormat,
        priceLineStyle: LineStyle.Dashed,
      });
    } else {
      seriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: cssVar("--color-primary-500", "#3d4fe0"),
        topColor: "rgba(61, 79, 224, 0.28)",
        bottomColor: "rgba(61, 79, 224, 0.02)",
        lineWidth: 2,
        priceFormat,
        priceLineStyle: LineStyle.Dashed,
      });
    }

    renderedKeyRef.current = null; // force a full setData() next
  }, [chartType, upColor, downColor]);

  // ── Push candles into the chart ─────────────────────────────────────────
  // New range/symbol → full setData() + fitContent(), so switching tabs
  // always shows the WHOLE requested duration (all of 6M when you click
  // 6M, all of 1Y when you click 1Y) — zooming from there is unrestricted
  // within that data, just bounded by fixLeftEdge/fixRightEdge above.
  // Same range, array just re-fetched (live poll tick) → only update()
  // the last bar, so the chart doesn't reset zoom/scroll on every 7s
  // refresh, and only auto-follows to the new bar if the user was
  // already looking at the live edge.
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || candles.length === 0) return;

    // DEFENSIVE — Upstox's raw API returns candles newest-first. If the
    // backend doesn't reverse that before handing candles to the
    // frontend (or does so inconsistently across routes), setData()
    // below either throws (chart silently never renders) or paints
    // garbled candles. Sorting here costs nothing on already-correct
    // data and makes the frontend resilient regardless of what the
    // backend does — this does NOT replace fixing it server-side, since
    // wrong ordering can still break backend-side aggregation/caching,
    // but it stops it from breaking the chart.
    const sortedCandles = [...candles].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );

    const toPoint = chartType === "candles" ? toCandlestickPoint : toLinePoint;
    const renderKey = `${symbol}_${range}_${chartType}`;

    const hasVolume = sortedCandles.some((c) => c.volume != null);
    if (hasVolume && !volumeSeriesRef.current && chartRef.current) {
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "sd-volume",
        color: upColor,
      });
      chartRef.current.priceScale("sd-volume").applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });
    }

    if (renderedKeyRef.current !== renderKey) {
      series.setData(sortedCandles.map((c) => toPoint(c, unit)));
      if (hasVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(
          sortedCandles.map((c) => toVolumePoint(c, unit, upColor, downColor)),
        );
      }
      chartRef.current?.timeScale().fitContent();
      renderedKeyRef.current = renderKey;
      nearLiveEdgeRef.current = true;
    } else {
      const last = sortedCandles[sortedCandles.length - 1];
      series.update(toPoint(last, unit));
      if (hasVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.update(
          toVolumePoint(last, unit, upColor, downColor),
        );
      }
      if (nearLiveEdgeRef.current) {
        chartRef.current?.timeScale().scrollToRealTime();
      }
    }
  }, [candles, range, symbol, chartType, unit, upColor, downColor]);

  // ── Fullscreen toggle ────────────────────────────────────────────────────
  useEffect(() => {
    const handleChange = () =>
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current?.requestFullscreen?.();
    }
  }, []);

  // ── Zoom in/out ──────────────────────────────────────────────────────
  // lightweight-charts has no zoomIn()/zoomOut() method — the standard
  // approach (used across the library's own examples/community) is to
  // adjust the time scale's barSpacing: the pixel width allotted to each
  // candle. Wider spacing = fewer candles visible = "zoomed in"; narrower
  // = more candles visible = "zoomed out". fixLeftEdge/fixRightEdge (set
  // when the chart was created) keep this bounded to the actual fetched
  // data — you can't zoom out into blank space past what's loaded.
  //
  // Clamped to [2, 60]px: below ~2px candles visually merge into a smear,
  // above ~60px a single candle dominates the whole view — both ends
  // stop being useful well before hitting those numbers.
  const handleZoom = useCallback((factor) => {
    const chart = chartRef.current;
    if (!chart) return;
    const timeScale = chart.timeScale();
    const current = timeScale.options().barSpacing ?? 6;
    const next = Math.min(60, Math.max(2, current * factor));
    timeScale.applyOptions({ barSpacing: next });
  }, []);

  // Don't assume `candles` is already ordered — find the actual latest
  // one by timestamp rather than trusting array position (same reasoning
  // as the defensive sort above).
  const latestCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, c) =>
      new Date(c.timestamp) > new Date(latest.timestamp) ? c : latest,
    );
  }, [candles]);
  const legend =
    hoverLegend ||
    (latestCandle
      ? {
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
          volume: latestCandle.volume,
          // Raw ISO timestamp here (not the unix-seconds/business-day shape
          // the crosshair gives us) — formatCandleDateTime handles both.
          time: latestCandle.timestamp,
        }
      : null);
  const legendIsUp = legend ? legend.close >= legend.open : true;

  // Formats whatever shape `legend.time` is in (unix seconds from the
  // crosshair, an ISO string from the latest-candle fallback, or a
  // "YYYY-MM-DD" business-day string) into a consistent "date · hh:mm:ss"
  // line. Daily+ candles have no intraday time component — that's not a
  // bug, a daily candle IS one whole day, so only the date is shown for
  // those and the clock is omitted rather than faked as 00:00:00.
  const legendDateTime = useMemo(() => {
    if (!legend?.time) return null;
    let date;
    if (typeof legend.time === "number") {
      date = new Date(legend.time * 1000);
    } else if (typeof legend.time === "string" && legend.time.length === 10) {
      // "YYYY-MM-DD" business-day string — no time component to show
      date = new Date(`${legend.time}T00:00:00`);
      return {
        dateStr: date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        timeStr: null,
      };
    } else {
      date = new Date(legend.time);
    }
    return {
      dateStr: date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      timeStr: date.toLocaleTimeString("en-IN", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  }, [legend?.time]);

  return (
    <div
      ref={wrapperRef}
      className={`stock-chart ${isFullscreen ? "stock-chart--fullscreen" : ""}`}
    >
      <div className="stock-chart__toolbar">
        <div
          className="stock-chart__type-group"
          role="group"
          aria-label="Chart type"
        >
          {CHART_TYPES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`stock-chart__type-btn ${chartType === t.key ? "is-active" : ""}`}
              onClick={() => setChartType(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="stock-chart__toolbar-right">
          {/* Zoom controls — since a range like 6M/1Y can hold ~180-375
              candles, letting the user tighten or widen how many are
              visible at once (rather than only pinch/scroll-zooming,
              which isn't discoverable on desktop) is what makes that
              density actually usable instead of just dense. */}
          <div
            className="stock-chart__zoom-group"
            role="group"
            aria-label="Zoom"
          >
            <button
              type="button"
              className="stock-chart__zoom-btn"
              onClick={() => handleZoom(0.8)}
              aria-label="Zoom out"
              title="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              className="stock-chart__zoom-btn"
              onClick={() => handleZoom(1.25)}
              aria-label="Zoom in"
              title="Zoom in"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="stock-chart__fullscreen-btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Expand chart"}
            title={isFullscreen ? "Exit fullscreen" : "Expand chart"}
          >
            {isFullscreen ? (
              <svg
                viewBox="0 0 20 20"
                width="15"
                height="15"
                aria-hidden="true"
              >
                <path
                  d="M8 3H3v5M12 17h5v-5M3 8V3h5M17 12v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                width="15"
                height="15"
                aria-hidden="true"
              >
                <path
                  d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <RangeSelector range={range} onChange={setRange} isLive={isLive} />

      <div className="stock-chart__stage">
        {legend && (
          <div
            className={`stock-chart__legend ${legendIsUp ? "is-up" : "is-down"}`}
          >
            <div className="stock-chart__legend-row">
              <span className="stock-chart__legend-item">
                <i>O</i>
                {formatCurrency(legend.open)}
              </span>
              <span className="stock-chart__legend-item">
                <i>H</i>
                {formatCurrency(legend.high)}
              </span>
              <span className="stock-chart__legend-item">
                <i>L</i>
                {formatCurrency(legend.low)}
              </span>
              <span className="stock-chart__legend-item">
                <i>C</i>
                {formatCurrency(legend.close)}
              </span>
              {legend.volume != null && (
                <span className="stock-chart__legend-item">
                  <i>Vol</i>
                  {formatVolume(legend.volume)}
                </span>
              )}
            </div>
            {/* Date/time for the candle under the crosshair (or the latest
                candle, when nothing's being hovered) — sits below O/H/L/C/Vol
                as its own row. hh:mm:ss only shows for minute/hour candles;
                a daily candle spans the whole day, so only the date is
                shown for those, never a faked 00:00:00. */}
            {legendDateTime && (
              <div className="stock-chart__legend-datetime">
                {legendDateTime.dateStr}
                {legendDateTime.timeStr && (
                  <span> · {legendDateTime.timeStr}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Candle-duration badge — always reflects the ACTIVE range's
            configured granularity (5 min for 1W, 1 hr for 3M, etc). This
            updates whenever the range tab changes. Note: this does NOT
            mean zooming in/out re-buckets data into finer/coarser
            candles — lightweight-charts (and the backend) only ever
            fetch one fixed granularity per range tab; zoom just changes
            how much of that fixed data is visible on screen. The badge
            is honest about which granularity you're looking at, not a
            claim of adaptive multi-resolution rendering. */}
        <div className="stock-chart__duration-badge">
          {candleDurationLabel(rangeConfig)} candles
          {range === "1D" && !oneDayPlan.isToday && (
            <span className="stock-chart__duration-note">
              {" "}
              · {oneDayPlan.dateStr} session
            </span>
          )}
        </div>

        {status === "loading" && candles.length === 0 && (
          <div className="stock-chart--empty stock-chart--skeleton">
            <div className="stock-chart__skeleton-bars">
              {Array.from({ length: 24 }).map((_, i) => (
                <span key={i} style={{ height: `${18 + ((i * 37) % 60)}%` }} />
              ))}
            </div>
            <p>Loading chart…</p>
          </div>
        )}
        {status === "failed" && candles.length === 0 && (
          <div className="stock-chart--empty">
            <p>
              Couldn't load chart data
              {range === "1D" ? " — market may be closed right now" : ""}.
            </p>
          </div>
        )}

        <div
          ref={containerRef}
          className="stock-chart__container"
          data-symbol={symbol}
        />
      </div>
    </div>
  );
}
