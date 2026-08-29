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

export function useStockHistory(symbol) {
  const dispatch = useDispatch();
  const [range, setRange] = useState("1D");

  // clockTick itself is never read inside a callback — it exists purely
  // to force `oneDayPlan` below to recompute every CLOCK_TICK_MS so the
  // 1D range flips from "live" to "static" right at market close without
  // needing a page refresh. It's a deliberate re-run trigger, not a
  // missing dependency, hence the disable comment on that line.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), CLOCK_TICK_MS);
    return () => clearInterval(t);
  }, []);

  // Always resolve to a valid config so every hook below runs
  // unconditionally on every render (Rules of Hooks) — never
  // early-return before this point.
  const config = useMemo(
    () => RANGES.find((r) => r.key === range) ?? RANGES.find((r) => r.key === "1D"),
    [range],
  );

  // Guard against a stale/invalid range key as a side effect, not
  // during render.
  useEffect(() => {
    if (!RANGES.some((r) => r.key === range)) {
      console.warn(`[useStockHistory] Invalid range key: ${range}, defaulting to 1D`);
      setRange("1D");
    }
  }, [range]);

  const oneDayPlan = useMemo(() => getOneDayPlan(), [clockTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const planKey = useMemo(
    () => `${oneDayPlan.dateStr}|${oneDayPlan.isToday}|${oneDayPlan.live}`,
    [oneDayPlan],
  );

  const cacheKey = config.key;

  const isLive = useMemo(() => {
    if (!config.live) return false;
    if (config.key === "1D") return oneDayPlan.live;
    return isMarketOpenNow();
  }, [config, oneDayPlan]);

  const useIntradayThunk = config.kind === "intraday" && oneDayPlan.isToday;

  const options = useMemo(() => {
    if (config.kind === "intraday") {
      if (oneDayPlan.isToday) {
        return { symbol, unit: config.unit, interval: config.interval, cacheKey };
      }
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

  const dispatchFetch = useMemoizedDispatchFetch(dispatch, useIntradayThunk, options);

  useEffect(() => {
    if (symbol) dispatchFetch();
  }, [symbol, range, planKey, dispatchFetch]);

  useEffect(() => {
    if (!symbol || !isLive) return undefined;
    const timer = setInterval(dispatchFetch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [symbol, isLive, dispatchFetch]);

  const candles = useSelector((state) => selectCandles(state, symbol, cacheKey));
  const status = useSelector((state) => selectCandlesStatus(state, symbol, cacheKey));

  return { range, setRange, candles, status, isLive, oneDayPlan };
}

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
  return useMemo(() => () => ref.current(), []);
}