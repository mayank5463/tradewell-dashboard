
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

const LEGEND_MARGIN_ABOVE = 14; // px gap between the box and the peak candle's wick
const LEGEND_TOP_CLAMP = 8; // never let the box go above the chart's own top edge
const LEGEND_HALF_WIDTH_ESTIMATE = 130; // used only to keep the box on-screen horizontally

// --- Main Component ---

export default function StockChart({ symbol }) {
  const { range, setRange, candles, status, isLive, oneDayPlan } =
    useStockHistory(symbol);
  const [chartType, setChartType] = useState("candles");
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoverLegend, setHoverLegend] = useState(null);
  const [chartError, setChartError] = useState(false);
  const [anchor, setAnchor] = useState(null); // { left, top } in px, relative to .stock-chart__stage

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
  const sortedCandlesRef = useRef([]);
  const unitRef = useRef(unit);
  unitRef.current = unit;

  const upColor = cssVar("--sd-up", "#0f9d58");
  const downColor = cssVar("--sd-down", "#e11d48");

  // Recomputes where the OHLC box should sit: directly above the
  // highest-high candle currently loaded, using the chart's own pixel
  // coordinate conversion so it tracks zoom/pan/resize correctly.
  // Falls back to a safe top-center position if the chart can't yet
  // resolve a coordinate (e.g. right after data loads).
  const recomputeAnchor = useCallback(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;
    const data = sortedCandlesRef.current;
    if (!chart || !series || !container || data.length === 0) return;

    let peak = data[0];
    for (const c of data) {
      if (c.high > peak.high) peak = c;
    }

    const time = toChartTime(peak.timestamp, unitRef.current);
    let x = chart.timeScale().timeToCoordinate(time);
    let y = series.priceToCoordinate(peak.high);

    const width = container.clientWidth || 300;

    if (x == null || y == null || Number.isNaN(x) || Number.isNaN(y)) {
      setAnchor({ left: width / 2, top: LEGEND_TOP_CLAMP });
      return;
    }

    x = Math.min(
      Math.max(x, LEGEND_HALF_WIDTH_ESTIMATE),
      Math.max(width - LEGEND_HALF_WIDTH_ESTIMATE, LEGEND_HALF_WIDTH_ESTIMATE)
    );
    y = Math.max(y - LEGEND_MARGIN_ABOVE, LEGEND_TOP_CLAMP);

    setAnchor({ left: x, top: y });
  }, []);

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
      recomputeAnchor();
    };
    chart
      .timeScale()
      .subscribeVisibleLogicalRangeChange(handleVisibleLogicalRangeChange);

    // Crosshair-driven OHLCV legend content (position stays peak-anchored;
    // only the numbers inside the box change on hover/click).
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
        time: param.time,
      });
    };
    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width, height });
        recomputeAnchor();
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
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
  }, [recomputeAnchor]);

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
    sortedCandlesRef.current = sortedCandles;

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

    // Recompute after the next paint so timeToCoordinate/priceToCoordinate
    // resolve against the freshly-set data instead of stale scales.
    requestAnimationFrame(recomputeAnchor);
  }, [candles, range, symbol, chartType, unit, upColor, downColor, recomputeAnchor]);

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
        recomputeAnchor();
      }
    }, 220);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
      tryUnlockOrientation();
      clearTimeout(resizeTimer);
    };
  }, [isExpanded, recomputeAnchor]);

  const toggleExpanded = useCallback(() => setIsExpanded((v) => !v), []);

  // --- Zoom Handlers ---
  const handleZoom = useCallback(
    (factor) => {
      const chart = chartRef.current;
      if (!chart) return;
      const timeScale = chart.timeScale();
      const current = timeScale.options().barSpacing ?? 6;
      const next = Math.min(60, Math.max(2, current * factor));
      timeScale.applyOptions({ barSpacing: next });
      requestAnimationFrame(recomputeAnchor);
    },
    [recomputeAnchor]
  );

  // --- Legend Data (content only — position comes from `anchor`) ---
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

        {/* Candle-size label — its own row, below the range selector and
            above the chart. No longer overlaps the OHLC box or the chart
            itself. */}
        <div className="stock-chart__duration-row">
          <span className="stock-chart__duration-badge">
            {rangeConfig ? candleDurationLabel(rangeConfig) : "…"} candles
            {range === "1D" && !oneDayPlan.isToday && (
              <span className="stock-chart__duration-note">
                {" "}
                · {oneDayPlan.dateStr} session
              </span>
            )}
          </span>
        </div>

        <div className="stock-chart__stage">
          {legend && anchor && (
            <div
              className={`stock-chart__legend ${legendIsUp ? "is-up" : "is-down"}`}
              style={{
                left: `${anchor.left}px`,
                top: `${anchor.top}px`,
              }}
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