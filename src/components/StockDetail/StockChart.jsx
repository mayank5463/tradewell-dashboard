
// import { useEffect, useRef, useState, useMemo, useCallback } from "react";
// import {
//   createChart,
//   CandlestickSeries,
//   LineSeries,
//   AreaSeries,
//   HistogramSeries,
//   ColorType,
//   CrosshairMode,
//   LineStyle,
// } from "lightweight-charts";
// import { useStockHistory } from "./useStockHistory";
// import RangeSelector, { RANGES, candleDurationLabel } from "./RangeSelector";
// import "./StockChart.css";

// // --- Utility Functions ---

// // lightweight-charts wants either a UTC timestamp (seconds) for intraday
// // resolutions, or a "YYYY-MM-DD" business-day string for daily+
// function toChartTime(timestamp, unit) {
//   if (unit === "minutes" || unit === "hours") {
//     return Math.floor(new Date(timestamp).getTime() / 1000);
//   }
//   return timestamp.slice(0, 10);
// }

// function toCandlestickPoint(candle, unit) {
//   return {
//     time: toChartTime(candle.timestamp, unit),
//     open: candle.open,
//     high: candle.high,
//     low: candle.low,
//     close: candle.close,
//   };
// }

// function toLinePoint(candle, unit) {
//   return { time: toChartTime(candle.timestamp, unit), value: candle.close };
// }

// function toVolumePoint(candle, unit, upColor, downColor) {
//   return {
//     time: toChartTime(candle.timestamp, unit),
//     value: candle.volume ?? 0,
//     color: candle.close >= candle.open ? upColor : downColor,
//   };
// }

// // Canvas-based charts don't resolve CSS custom properties the way regular
// // DOM elements do — resolve the actual value once via getComputedStyle
// function cssVar(name, fallback) {
//   if (typeof window === "undefined") return fallback;
//   const value = getComputedStyle(document.documentElement)
//     .getPropertyValue(name)
//     .trim();
//   return value || fallback;
// }

// function formatCurrency(n) {
//   if (n == null) return "—";
//   return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// }

// // Indian-style compact volume — 1,20,000 → "1.2L", 15,00,00,000 → "15 Cr"
// function formatVolume(n) {
//   if (n == null) return "—";
//   const num = Number(n);
//   if (num >= 1e7) return `${(num / 1e7).toFixed(2)} Cr`;
//   if (num >= 1e5) return `${(num / 1e5).toFixed(2)} L`;
//   if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
//   return num.toLocaleString("en-IN");
// }

// // --- Constants ---

// const CHART_TYPES = [
//   { key: "candles", label: "Candles" },
//   { key: "line", label: "Line" },
//   { key: "area", label: "Area" },
// ];

// // --- Main Component ---

// export default function StockChart({ symbol }) {
//   const { range, setRange, candles, status, isLive, oneDayPlan } =
//     useStockHistory(symbol);
//   const [chartType, setChartType] = useState("candles");
//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [hoverLegend, setHoverLegend] = useState(null);

//   const rangeConfig = useMemo(
//     () => RANGES.find((r) => r.key === range),
//     [range]
//   );
//   const unit = rangeConfig?.unit || "days";

//   const wrapperRef = useRef(null);
//   const containerRef = useRef(null);
//   const chartRef = useRef(null);
//   const seriesRef = useRef(null);
//   const volumeSeriesRef = useRef(null);
//   const renderedKeyRef = useRef(null);
//   const nearLiveEdgeRef = useRef(true);

//   const upColor = cssVar("--sd-up", "#0f9d58");
//   const downColor = cssVar("--sd-down", "#e11d48");

//   // --- Create Chart Effect ---
//   useEffect(() => {
//     if (!containerRef.current) return undefined;

//     const chart = createChart(containerRef.current, {
//       layout: {
//         background: { type: ColorType.Solid, color: "transparent" },
//         textColor: cssVar("--text-secondary", "#6b7280"),
//         fontFamily:
//           "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
//       },
//       grid: {
//         vertLines: { color: cssVar("--border-default", "#eef0f7") },
//         horzLines: { color: cssVar("--border-default", "#eef0f7") },
//       },
//       width: containerRef.current.clientWidth,
//       height: containerRef.current.clientHeight || 400,
//       localization: { priceFormatter: (p) => formatCurrency(p) },
//       timeScale: {
//         borderColor: cssVar("--border-default", "#eef0f7"),
//         fixLeftEdge: true,
//         fixRightEdge: true,
//         rightOffset: 4,
//         minBarSpacing: 0.6,
//       },
//       rightPriceScale: {
//         borderColor: cssVar("--border-default", "#eef0f7"),
//         scaleMargins: { top: 0.1, bottom: 0.28 },
//       },
//       crosshair: {
//         mode: CrosshairMode.Normal,
//         vertLine: {
//           color: cssVar("--color-primary-500", "#3d4fe0"),
//           width: 1,
//           style: LineStyle.Dashed,
//           labelBackgroundColor: cssVar("--color-primary-500", "#3d4fe0"),
//         },
//         horzLine: {
//           color: cssVar("--color-primary-500", "#3d4fe0"),
//           width: 1,
//           style: LineStyle.Dashed,
//           labelBackgroundColor: cssVar("--color-primary-500", "#3d4fe0"),
//         },
//       },
//     });

//     chartRef.current = chart;

//     // Track whether the visible window currently sits at the newest bar
//     const handleVisibleLogicalRangeChange = (logicalRange) => {
//       if (!logicalRange || !seriesRef.current) return;
//       const info = seriesRef.current.barsInLogicalRange(logicalRange);
//       nearLiveEdgeRef.current =
//         !info || info.barsAfter == null || info.barsAfter <= 2;
//     };
//     chart
//       .timeScale()
//       .subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

//     // Crosshair-driven OHLCV legend
//     const handleCrosshairMove = (param) => {
//       if (!param || !param.time || !seriesRef.current) {
//         setHoverLegend(null);
//         return;
//       }
//       const point = param.seriesData.get(seriesRef.current);
//       if (!point) {
//         setHoverLegend(null);
//         return;
//       }
//       const volumePoint = volumeSeriesRef.current
//         ? param.seriesData.get(volumeSeriesRef.current)
//         : null;
//       setHoverLegend({
//         open: point.open,
//         high: point.high,
//         low: point.low,
//         close: point.close ?? point.value,
//         volume: volumePoint?.value,
//         time: param.time,
//       });
//     };
//     chart.subscribeCrosshairMove(handleCrosshairMove);

//     // ResizeObserver instead of window "resize" listener
//     const resizeObserver = new ResizeObserver((entries) => {
//       const entry = entries[0];
//       if (!entry) return;
//       const { width, height } = entry.contentRect;
//       chart.applyOptions({ width, height });
//     });
//     resizeObserver.observe(containerRef.current);

//     return () => {
//       resizeObserver.disconnect();
//       chart
//         .timeScale()
//         .unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
//       chart.unsubscribeCrosshairMove(handleCrosshairMove);
//       chart.remove();
//       chartRef.current = null;
//       seriesRef.current = null;
//       volumeSeriesRef.current = null;
//       renderedKeyRef.current = null;
//     };
//   }, []);

//   // --- Swap Series Type Effect ---
//   useEffect(() => {
//     const chart = chartRef.current;
//     if (!chart) return;

//     if (seriesRef.current) {
//       chart.removeSeries(seriesRef.current);
//       seriesRef.current = null;
//     }

//     const priceFormat = { type: "price", precision: 2, minMove: 0.01 };

//     if (chartType === "candles") {
//       seriesRef.current = chart.addSeries(CandlestickSeries, {
//         upColor,
//         downColor,
//         borderVisible: false,
//         wickUpColor: upColor,
//         wickDownColor: downColor,
//         priceFormat,
//         priceLineStyle: LineStyle.Dashed,
//         priceLineWidth: 1,
//         priceLineColor: cssVar("--color-primary-500", "#3d4fe0"),
//       });
//     } else if (chartType === "line") {
//       seriesRef.current = chart.addSeries(LineSeries, {
//         color: cssVar("--color-primary-500", "#3d4fe0"),
//         lineWidth: 2,
//         priceFormat,
//         priceLineStyle: LineStyle.Dashed,
//       });
//     } else {
//       seriesRef.current = chart.addSeries(AreaSeries, {
//         lineColor: cssVar("--color-primary-500", "#3d4fe0"),
//         topColor: "rgba(61, 79, 224, 0.28)",
//         bottomColor: "rgba(61, 79, 224, 0.02)",
//         lineWidth: 2,
//         priceFormat,
//         priceLineStyle: LineStyle.Dashed,
//       });
//     }

//     renderedKeyRef.current = null;
//   }, [chartType, upColor, downColor]);

//   // --- Push Candles to Chart Effect ---
//   useEffect(() => {
//     const series = seriesRef.current;
//     if (!series || candles.length === 0) return;

//     // DEFENSIVE SORT: Ensures data is oldest-to-newest
//     const sortedCandles = [...candles].sort(
//       (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
//     );

//     const toPoint = chartType === "candles" ? toCandlestickPoint : toLinePoint;
//     const renderKey = `${symbol}_${range}_${chartType}`;

//     const hasVolume = sortedCandles.some((c) => c.volume != null);
//     if (hasVolume && !volumeSeriesRef.current && chartRef.current) {
//       volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
//         priceFormat: { type: "volume" },
//         priceScaleId: "sd-volume",
//         color: upColor,
//       });
//       chartRef.current.priceScale("sd-volume").applyOptions({
//         scaleMargins: { top: 0.78, bottom: 0 },
//       });
//     }

//     if (renderedKeyRef.current !== renderKey) {
//       series.setData(sortedCandles.map((c) => toPoint(c, unit)));
//       if (hasVolume && volumeSeriesRef.current) {
//         volumeSeriesRef.current.setData(
//           sortedCandles.map((c) => toVolumePoint(c, unit, upColor, downColor))
//         );
//       }
//       chartRef.current?.timeScale().fitContent();
//       renderedKeyRef.current = renderKey;
//       nearLiveEdgeRef.current = true;
//     } else {
//       const last = sortedCandles[sortedCandles.length - 1];
//       series.update(toPoint(last, unit));
//       if (hasVolume && volumeSeriesRef.current) {
//         volumeSeriesRef.current.update(
//           toVolumePoint(last, unit, upColor, downColor)
//         );
//       }
//       if (nearLiveEdgeRef.current) {
//         chartRef.current?.timeScale().scrollToRealTime();
//       }
//     }
//   }, [candles, range, symbol, chartType, unit, upColor, downColor]);

//   // --- Fullscreen Toggle ---
//   useEffect(() => {
//     const handleChange = () =>
//       setIsFullscreen(document.fullscreenElement === wrapperRef.current);
//     document.addEventListener("fullscreenchange", handleChange);
//     return () => document.removeEventListener("fullscreenchange", handleChange);
//   }, []);

//   const toggleFullscreen = useCallback(() => {
//     if (document.fullscreenElement) {
//       document.exitFullscreen();
//     } else {
//       wrapperRef.current?.requestFullscreen?.();
//     }
//   }, []);

//   // --- Zoom Handlers ---
//   const handleZoom = useCallback((factor) => {
//     const chart = chartRef.current;
//     if (!chart) return;
//     const timeScale = chart.timeScale();
//     const current = timeScale.options().barSpacing ?? 6;
//     const next = Math.min(60, Math.max(2, current * factor));
//     timeScale.applyOptions({ barSpacing: next });
//   }, []);

//   // --- Legend Data ---
//   const latestCandle = useMemo(() => {
//     if (candles.length === 0) return null;
//     return candles.reduce((latest, c) =>
//       new Date(c.timestamp) > new Date(latest.timestamp) ? c : latest
//     );
//   }, [candles]);

//   const legend =
//     hoverLegend ||
//     (latestCandle
//       ? {
//           open: latestCandle.open,
//           high: latestCandle.high,
//           low: latestCandle.low,
//           close: latestCandle.close,
//           volume: latestCandle.volume,
//           time: latestCandle.timestamp,
//         }
//       : null);
//   const legendIsUp = legend ? legend.close >= legend.open : true;

//   const legendDateTime = useMemo(() => {
//     if (!legend?.time) return null;
//     let date;
//     if (typeof legend.time === "number") {
//       date = new Date(legend.time * 1000);
//     } else if (typeof legend.time === "string" && legend.time.length === 10) {
//       date = new Date(`${legend.time}T00:00:00`);
//       return {
//         dateStr: date.toLocaleDateString("en-IN", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         }),
//         timeStr: null,
//       };
//     } else {
//       date = new Date(legend.time);
//     }
//     return {
//       dateStr: date.toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "short",
//         year: "numeric",
//       }),
//       timeStr: date.toLocaleTimeString("en-IN", {
//         hour12: false,
//         hour: "2-digit",
//         minute: "2-digit",
//         second: "2-digit",
//       }),
//     };
//   }, [legend?.time]);

//   // --- Render ---
//   return (
//     <div
//       ref={wrapperRef}
//       className={`stock-chart ${isFullscreen ? "stock-chart--fullscreen" : ""}`}
//     >
//       <div className="stock-chart__toolbar">
//         <div
//           className="stock-chart__type-group"
//           role="group"
//           aria-label="Chart type"
//         >
//           {CHART_TYPES.map((t) => (
//             <button
//               key={t.key}
//               type="button"
//               className={`stock-chart__type-btn ${chartType === t.key ? "is-active" : ""}`}
//               onClick={() => setChartType(t.key)}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>
//         <div className="stock-chart__toolbar-right">
//           <div
//             className="stock-chart__zoom-group"
//             role="group"
//             aria-label="Zoom"
//           >
//             <button
//               type="button"
//               className="stock-chart__zoom-btn"
//               onClick={() => handleZoom(0.8)}
//               aria-label="Zoom out"
//               title="Zoom out"
//             >
//               −
//             </button>
//             <button
//               type="button"
//               className="stock-chart__zoom-btn"
//               onClick={() => handleZoom(1.25)}
//               aria-label="Zoom in"
//               title="Zoom in"
//             >
//               +
//             </button>
//           </div>
//           <button
//             type="button"
//             className="stock-chart__fullscreen-btn"
//             onClick={toggleFullscreen}
//             aria-label={isFullscreen ? "Exit fullscreen" : "Expand chart"}
//             title={isFullscreen ? "Exit fullscreen" : "Expand chart"}
//           >
//             {isFullscreen ? (
//               <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
//                 <path
//                   d="M8 3H3v5M12 17h5v-5M3 8V3h5M17 12v5h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.6"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             ) : (
//               <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
//                 <path
//                   d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
//                   fill="none"
//                   stroke="currentColor"
//                   strokeWidth="1.6"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             )}
//           </button>
//         </div>
//       </div>

//       <RangeSelector range={range} onChange={setRange} isLive={isLive} />

//       <div className="stock-chart__stage">
//         {legend && (
//           <div
//             className={`stock-chart__legend ${legendIsUp ? "is-up" : "is-down"}`}
//           >
//             <div className="stock-chart__legend-row">
//               <span className="stock-chart__legend-item">
//                 <i>O</i>
//                 {formatCurrency(legend.open)}
//               </span>
//               <span className="stock-chart__legend-item">
//                 <i>H</i>
//                 {formatCurrency(legend.high)}
//               </span>
//               <span className="stock-chart__legend-item">
//                 <i>L</i>
//                 {formatCurrency(legend.low)}
//               </span>
//               <span className="stock-chart__legend-item">
//                 <i>C</i>
//                 {formatCurrency(legend.close)}
//               </span>
//               {legend.volume != null && (
//                 <span className="stock-chart__legend-item">
//                   <i>Vol</i>
//                   {formatVolume(legend.volume)}
//                 </span>
//               )}
//             </div>
//             {legendDateTime && (
//               <div className="stock-chart__legend-datetime">
//                 {legendDateTime.dateStr}
//                 {legendDateTime.timeStr && (
//                   <span> · {legendDateTime.timeStr}</span>
//                 )}
//               </div>
//             )}
//           </div>
//         )}

//         <div className="stock-chart__duration-badge">
//           {candleDurationLabel(rangeConfig)} candles
//           {range === "1D" && !oneDayPlan.isToday && (
//             <span className="stock-chart__duration-note">
//               {" "}
//               · {oneDayPlan.dateStr} session
//             </span>
//           )}
//         </div>

//         {status === "loading" && candles.length === 0 && (
//           <div className="stock-chart--empty stock-chart--skeleton">
//             <div className="stock-chart__skeleton-bars">
//               {Array.from({ length: 24 }).map((_, i) => (
//                 <span key={i} style={{ height: `${18 + ((i * 37) % 60)}%` }} />
//               ))}
//             </div>
//             <p>Loading chart…</p>
//           </div>
//         )}
//         {status === "failed" && candles.length === 0 && (
//           <div className="stock-chart--empty">
//             <p>
//               Couldn't load chart data
//               {range === "1D" ? " — market may be closed right now" : ""}.
//             </p>
//           </div>
//         )}

//         <div
//           ref={containerRef}
//           className="stock-chart__container"
//           data-symbol={symbol}
//         />
//       </div>
//     </div>
//   );
// }




















































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

// --- Utility Functions ---

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

function formatVolume(n) {
  if (n == null) return "—";
  const num = Number(n);
  if (num >= 1e7) return `${(num / 1e7).toFixed(2)} Cr`;
  if (num >= 1e5) return `${(num / 1e5).toFixed(2)} L`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
}

// Best-effort landscape lock for the expanded view. Guarded at every
// level: `window` may not exist (SSR), `window.screen.orientation` may
// not exist (iOS Safari), and `.lock()` can throw synchronously on some
// browsers. Always via `window.screen`, never the bare `screen` global.
function tryLockLandscape() {
  if (typeof window === "undefined") return;
  const orientation = window.screen && window.screen.orientation;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    const result = orientation.lock("landscape");
    if (result && typeof result.catch === "function") {
      result.catch(() => {});
    }
  } catch {
    // Some browsers throw synchronously instead of rejecting.
  }
}

function tryUnlockOrientation() {
  if (typeof window === "undefined") return;
  const orientation = window.screen && window.screen.orientation;
  if (!orientation || typeof orientation.unlock !== "function") return;
  try {
    orientation.unlock();
  } catch {
    // no-op
  }
}

// --- Constants ---

const CHART_TYPES = [
  { key: "candles", label: "Candles" },
  { key: "line", label: "Line" },
  { key: "area", label: "Area" },
];

// --- Main Component ---

export default function StockChart({ symbol }) {
  const { range, setRange, candles, status, isLive, oneDayPlan } =
    useStockHistory(symbol);
  const [chartType, setChartType] = useState("candles");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverLegend, setHoverLegend] = useState(null);
  const [chartError, setChartError] = useState(false);

  const rangeConfig = useMemo(
    () => RANGES.find((r) => r.key === range),
    [range]
  );
  const unit = rangeConfig?.unit || "days";

  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const renderedKeyRef = useRef(null);
  const nearLiveEdgeRef = useRef(true);
  // Throttles the crosshair handler to one React state update per
  // animation frame instead of one per raw mousemove event — fixes
  // hover jank on dense charts (1D/1W with hundreds of 1-min candles).
  const crosshairFrameRef = useRef(null);
  const pendingLegendRef = useRef(null);

  const upColor = cssVar("--sd-up", "#0f9d58");
  const downColor = cssVar("--sd-down", "#e11d48");

  // --- Create Chart Effect ---
  useEffect(() => {
    if (!containerRef.current) return undefined;

    let chart;
    try {
      chart = createChart(containerRef.current, {
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
        localization: { priceFormatter: (p) => formatCurrency(p) },
        timeScale: {
          borderColor: cssVar("--border-default", "#eef0f7"),
          fixLeftEdge: true,
          fixRightEdge: true,
          rightOffset: 4,
          minBarSpacing: 0.6,
        },
        rightPriceScale: {
          borderColor: cssVar("--border-default", "#eef0f7"),
          scaleMargins: { top: 0.14, bottom: 0.28 },
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
    } catch (err) {
      console.error("[StockChart] Failed to create chart:", err);
      setChartError(true);
      return undefined;
    }

    chartRef.current = chart;

    const handleVisibleLogicalRangeChange = (logicalRange) => {
      if (!logicalRange || !seriesRef.current) return;
      const info = seriesRef.current.barsInLogicalRange(logicalRange);
      nearLiveEdgeRef.current =
        !info || info.barsAfter == null || info.barsAfter <= 2;
    };
    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

    // Crosshair-driven OHLCV overlay content. Throttled via
    // requestAnimationFrame: lightweight-charts can fire this dozens of
    // times per second while the mouse moves across a dense 1D/1W chart,
    // and calling setState that often was the main source of hover lag.
    // Only the LAST point seen within a frame actually triggers a
    // re-render.
    const handleCrosshairMove = (param) => {
      if (!param || !param.time || !seriesRef.current) {
        pendingLegendRef.current = null;
      } else {
        const point = param.seriesData.get(seriesRef.current);
        if (!point) {
          pendingLegendRef.current = null;
        } else {
          const volumePoint = volumeSeriesRef.current
            ? param.seriesData.get(volumeSeriesRef.current)
            : null;
          pendingLegendRef.current = {
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close ?? point.value,
            volume: volumePoint?.value,
            time: param.time,
          };
        }
      }

      if (crosshairFrameRef.current != null) return;
      crosshairFrameRef.current = requestAnimationFrame(() => {
        crosshairFrameRef.current = null;
        setHoverLegend(pendingLegendRef.current);
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (crosshairFrameRef.current != null) {
        cancelAnimationFrame(crosshairFrameRef.current);
        crosshairFrameRef.current = null;
      }
      try {
        chart
          .timeScale()
          .unsubscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);
        chart.unsubscribeCrosshairMove(handleCrosshairMove);
        chart.remove();
      } catch {
        // chart may already be torn down
      }
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      renderedKeyRef.current = null;
    };
  }, []);

  // --- Swap Series Type Effect ---
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

    renderedKeyRef.current = null;
  }, [chartType, upColor, downColor]);

  // --- Push Candles to Chart Effect ---
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || candles.length === 0) return;

    const sortedCandles = [...candles].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
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
          sortedCandles.map((c) => toVolumePoint(c, unit, upColor, downColor))
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
          toVolumePoint(last, unit, upColor, downColor)
        );
      }
      if (nearLiveEdgeRef.current) {
        chartRef.current?.timeScale().scrollToRealTime();
      }
    }
  }, [candles, range, symbol, chartType, unit, upColor, downColor]);

  // --- Expanded (fullscreen-style) mode ---
  // CSS overlay, not the native Fullscreen API — iOS Safari has no
  // requestFullscreen() support on arbitrary elements.
  useEffect(() => {
    if (!isExpanded) return undefined;
    if (typeof document === "undefined") return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    tryLockLandscape();

    const handleKey = (e) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", handleKey);

    const resizeTimer = setTimeout(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    }, 220);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
      tryUnlockOrientation();
      clearTimeout(resizeTimer);
    };
  }, [isExpanded]);

  const toggleExpanded = useCallback(() => setIsExpanded((v) => !v), []);

  // --- Zoom Handlers ---
  const handleZoom = useCallback((factor) => {
    const chart = chartRef.current;
    if (!chart) return;
    const timeScale = chart.timeScale();
    const current = timeScale.options().barSpacing ?? 6;
    const next = Math.min(60, Math.max(2, current * factor));
    timeScale.applyOptions({ barSpacing: next });
  }, []);

  // --- Overlay Data (duration label + OHLCV, merged into one block) ---
  const latestCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, c) =>
      new Date(c.timestamp) > new Date(latest.timestamp) ? c : latest
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
          time: latestCandle.timestamp,
        }
      : null);
  const legendIsUp = legend ? legend.close >= legend.open : true;

  const legendDateTime = useMemo(() => {
    if (!legend?.time) return null;
    let date;
    if (typeof legend.time === "number") {
      date = new Date(legend.time * 1000);
    } else if (typeof legend.time === "string" && legend.time.length === 10) {
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

  const ExpandIcon = () =>
    isExpanded ? (
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
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
      <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
        <path
          d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  // --- Render ---
  return (
    <>
      <div
        ref={wrapperRef}
        className={`stock-chart ${isExpanded ? "stock-chart--expanded" : ""}`}
      >
        {isExpanded && (
          <button
            type="button"
            className="stock-chart__close-btn"
            onClick={toggleExpanded}
            aria-label="Close fullscreen chart"
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <path
                d="M5 5l10 10M15 5L5 15"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}

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
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Exit fullscreen" : "Expand chart"}
              title={isExpanded ? "Exit fullscreen" : "Expand chart"}
            >
              <ExpandIcon />
            </button>
          </div>
        </div>

        <RangeSelector range={range} onChange={setRange} isLive={isLive} />

        <div className="stock-chart__stage">
          {/* Fixed top-left overlay, sitting directly on the chart canvas
              (below the range tabs above, which are outside the stage).
              Two stacked lines: candle-size label on top, OHLCV row
              beneath it — a single block, not two separately-positioned
              pieces, so there's nothing to recompute or drift out of
              place while zooming/panning. */}
          <div className="stock-chart__overlay">
            <div className="stock-chart__overlay-duration">
              {rangeConfig ? candleDurationLabel(rangeConfig) : "…"} candles
              {range === "1D" && !oneDayPlan.isToday && (
                <span className="stock-chart__duration-note">
                  {" "}
                  · {oneDayPlan.dateStr} session
                </span>
              )}
            </div>

            {legend && (
              <div
                className={`stock-chart__overlay-ohlcv ${legendIsUp ? "is-up" : "is-down"}`}
              >
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
                {legendDateTime && (
                  <span className="stock-chart__legend-datetime">
                    {legendDateTime.dateStr}
                    {legendDateTime.timeStr && ` · ${legendDateTime.timeStr}`}
                  </span>
                )}
              </div>
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
                {range === "1D" && !oneDayPlan.isToday
                  ? " — market may be closed right now."
                  : "."}
              </p>
            </div>
          )}
          {chartError && (
            <div className="stock-chart--empty">
              <p>Chart couldn't render. Try reloading the page.</p>
            </div>
          )}

          <div
            ref={containerRef}
            className="stock-chart__container"
            data-symbol={symbol}
          />
        </div>
      </div>
      {isExpanded && (
        <div className="stock-chart__backdrop" onClick={toggleExpanded} />
      )}
    </>
  );
}