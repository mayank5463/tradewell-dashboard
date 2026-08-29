// import { useEffect, useMemo, useState, useRef } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   fetchHistorical,
//   fetchIntradayHistorical,
//   selectCandles,
//   selectCandlesStatus,
// } from "../../redux/slices/historicalSlice";
// import { RANGES } from "./RangeSelector";
// import { getOneDayPlan, isMarketOpenNow } from "./marketTime";

// const POLL_INTERVAL_MS = 6000;
// const CLOCK_TICK_MS = 15000;

// function toDateStr(d) {
//   return d.toISOString().slice(0, 10);
// }

// export function useStockHistory(symbol) {
//   const dispatch = useDispatch();
//   const [range, setRange] = useState("1M");

//   const [clockTick, setClockTick] = useState(0);
//   useEffect(() => {
//     const t = setInterval(() => setClockTick((n) => n + 1), CLOCK_TICK_MS);
//     return () => clearInterval(t);
//   }, []);

//   const config = useMemo(() => RANGES.find((r) => r.key === range), [range]);

//   const oneDayPlan = useMemo(() => getOneDayPlan(), [clockTick]); // eslint-disable-line react-hooks/exhaustive-deps

//   const planKey = useMemo(
//     () => `${oneDayPlan.dateStr}|${oneDayPlan.isToday}|${oneDayPlan.live}`,
//     [oneDayPlan],
//   );

//   const cacheKey = config.key;

//   const isLive = useMemo(() => {
//     if (!config.live) return false;
//     if (config.key === "1D") return oneDayPlan.live;
//     return isMarketOpenNow();
//   }, [config, oneDayPlan]);

//   const useIntradayThunk = config.kind === "intraday" && oneDayPlan.isToday;

//   const options = useMemo(() => {
//     if (config.kind === "intraday") {
//       if (oneDayPlan.isToday) {
//         return {
//           symbol,
//           unit: config.unit,
//           interval: config.interval,
//           cacheKey,
//         };
//       }
//       return {
//         symbol,
//         unit: config.unit,
//         interval: config.interval,
//         from: oneDayPlan.dateStr,
//         to: oneDayPlan.dateStr,
//         cacheKey,
//       };
//     }
//     const to = new Date();
//     const from = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
//     return {
//       symbol,
//       unit: config.unit,
//       interval: config.interval,
//       from: toDateStr(from),
//       to: toDateStr(to),
//       cacheKey,
//     };
//   }, [config, symbol, cacheKey, oneDayPlan]);

//   const dispatchFetch = useMemoizedDispatchFetch(
//     dispatch,
//     useIntradayThunk,
//     options,
//   );

//   useEffect(() => {
//     if (symbol) dispatchFetch();
//   }, [symbol, range, planKey, dispatchFetch]);

//   useEffect(() => {
//     if (!symbol || !isLive) return undefined;
//     const timer = setInterval(dispatchFetch, POLL_INTERVAL_MS);
//     return () => clearInterval(timer);
//   }, [symbol, isLive, dispatchFetch]);

//   const candles = useSelector((state) =>
//     selectCandles(state, symbol, cacheKey),
//   );
//   const status = useSelector((state) =>
//     selectCandlesStatus(state, symbol, cacheKey),
//   );

//   return { range, setRange, candles, status, isLive, oneDayPlan };
// }

// function useMemoizedDispatchFetch(dispatch, useIntradayThunk, options) {
//   const requestIdRef = useRef(0);
//   const ref = useRef();
//   ref.current = () => {
//     requestIdRef.current += 1;
//     const payload = {
//       ...options,
//       requestId: `${options.cacheKey}:${requestIdRef.current}`,
//     };
//     dispatch(
//       useIntradayThunk
//         ? fetchIntradayHistorical(payload)
//         : fetchHistorical(payload),
//     );
//   };
//   return useMemo(() => () => ref.current(), []); // eslint-disable-line react-hooks/exhaustive-deps
// }

















import { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHistorical,
  fetchIntradayHistorical,
  selectCandles,
  selectCandlesStatus,
} from "../../redux/slices/historicalSlice";
import { RANGES } from "./RangeSelector";
import { getOneDayPlan, isMarketOpenNow } from "./marketTime";

const POLL_INTERVAL_MS = 6000;
const CLOCK_TICK_MS = 15000;

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// DEFAULT RANGE = "1D" — clicking into any stock opens straight into the
// 1-day intraday chart (today's session if the market's open or already
// closed today, otherwise the last trading day), matching RANGES[0] in
// RangeSelector.jsx. Every other tab (1W/1M/3M/6M/1Y/5Y/MAX) is fetched
// on demand only once the user actually switches to it.
export function useStockHistory(symbol) {
  const dispatch = useDispatch();
  const [range, setRange] = useState("1D");

  // Re-evaluates whether today's session just opened/closed without
  // needing a full poll — cheap enough to just re-derive the plan on a
  // slow interval rather than wiring a precise open/close timer.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), CLOCK_TICK_MS);
    return () => clearInterval(t);
  }, []);

  const config = useMemo(() => RANGES.find((r) => r.key === range), [range]);

  const oneDayPlan = useMemo(() => getOneDayPlan(), [clockTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Changes whenever which day/session the "1D" tab should be showing
  // changes (e.g. market just opened, or just closed) — triggers a
  // refetch even if `range` itself hasn't changed.
  const planKey = useMemo(
    () => `${oneDayPlan.dateStr}|${oneDayPlan.isToday}|${oneDayPlan.live}`,
    [oneDayPlan],
  );

  const cacheKey = config.key;

  // Only the currently active tab polls — switching tabs starts/stops
  // polling automatically since this recomputes off `range`.
  const isLive = useMemo(() => {
    if (!config.live) return false;
    if (config.key === "1D") return oneDayPlan.live;
    return isMarketOpenNow();
  }, [config, oneDayPlan]);

  const useIntradayThunk = config.kind === "intraday" && oneDayPlan.isToday;

  const options = useMemo(() => {
    if (config.kind === "intraday") {
      if (oneDayPlan.isToday) {
        // Today's session, live or just-closed — no from/to needed, the
        // intraday endpoint always means "today so far."
        return {
          symbol,
          unit: config.unit,
          interval: config.interval,
          cacheKey,
        };
      }
      // Weekend or before market open — show the last completed session
      // as a fixed from=to= date via the regular historical endpoint.
      return {
        symbol,
        unit: config.unit,
        interval: config.interval,
        from: oneDayPlan.dateStr,
        to: oneDayPlan.dateStr,
        cacheKey,
      };
    }
    const to = new Date();
    const from = new Date(Date.now() - config.days * 24 * 60 * 60 * 1000);
    return {
      symbol,
      unit: config.unit,
      interval: config.interval,
      from: toDateStr(from),
      to: toDateStr(to),
      cacheKey,
    };
  }, [config, symbol, cacheKey, oneDayPlan]);

  const dispatchFetch = useMemoizedDispatchFetch(
    dispatch,
    useIntradayThunk,
    options,
  );

  // Refetches on: symbol change (new stock clicked), range change (tab
  // switch), or planKey change (today's session state moved on).
  useEffect(() => {
    if (symbol) dispatchFetch();
  }, [symbol, range, planKey, dispatchFetch]);

  // Only the live-eligible, currently-open-market tab polls.
  useEffect(() => {
    if (!symbol || !isLive) return undefined;
    const timer = setInterval(dispatchFetch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [symbol, isLive, dispatchFetch]);

  const candles = useSelector((state) =>
    selectCandles(state, symbol, cacheKey),
  );
  const status = useSelector((state) =>
    selectCandlesStatus(state, symbol, cacheKey),
  );

  return { range, setRange, candles, status, isLive, oneDayPlan };
}

// Guards against a slow, stale request landing after a newer one (e.g.
// rapidly switching 1D -> 1M -> 1D before the first 1D fetch resolves) by
// tagging each dispatch with an incrementing id. historicalSlice.js keys
// candles purely by symbol+cacheKey, so this doesn't change what gets
// stored — it's a hook-level no-op today, but cheap insurance if a
// dedupe/cancel check is ever added to the thunk later.
function useMemoizedDispatchFetch(dispatch, useIntradayThunk, options) {
  const requestIdRef = useRef(0);
  const ref = useRef();
  ref.current = () => {
    requestIdRef.current += 1;
    const payload = {
      ...options,
      requestId: `${options.cacheKey}:${requestIdRef.current}`,
    };
    dispatch(
      useIntradayThunk
        ? fetchIntradayHistorical(payload)
        : fetchHistorical(payload),
    );
  };
  return useMemo(() => () => ref.current(), []); // eslint-disable-line react-hooks/exhaustive-deps
}