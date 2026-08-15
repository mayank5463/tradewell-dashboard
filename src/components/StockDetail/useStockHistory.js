
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

// UPDATED — spec now asks for a 6s cadence (was 7s). Kept as its own
// named constant since it's still meant to track the backend's own
// liveCache refresh rate; if that changes, this should move with it.
const POLL_INTERVAL_MS = 6000;

// How often we recompute "what should the 1D tab show right now" / "is
// the market open right now", even when nothing is actively fetching.
// This is a local, network-free timer — its only job is to notice when
// wall-clock time crosses 09:15 or 15:30 (or midnight) so a chart left
// open across one of those boundaries transitions itself (starts/stops
// polling, or flips 1D from "yesterday" to "today live") without the
// user needing to click the tab again.
const CLOCK_TICK_MS = 15000;

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

// Single hook that owns: which range is selected, dispatching the fetch
// for that range, live polling while the market's genuinely open, and
// reading back the right cached candle array. This is the ONLY place
// StockChart / StockDetailPanel needs to touch for chart data.
export function useStockHistory(symbol) {
  const dispatch = useDispatch();
  const [range, setRange] = useState("1M");

  // Ticks every CLOCK_TICK_MS just to force the memos below to
  // re-evaluate wall-clock time. Doesn't do anything else — no network
  // call lives here.
  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setClockTick((n) => n + 1), CLOCK_TICK_MS);
    return () => clearInterval(t);
  }, []);

  const config = useMemo(() => RANGES.find((r) => r.key === range), [range]);

  // A plain STRING summarizing "what's the market/1D situation right
  // now" — deliberately a primitive, not an object, so it's safe to use
  // directly in dependency arrays: it only actually changes value at the
  // 09:15 / 15:30 / midnight boundaries, even though this memo re-runs
  // on every 15s clock tick. That means switching to a non-1D tab (1W,
  // 6M, etc) does NOT cause spurious refetches every 15s — only at those
  // real transition points, which is desirable everywhere anyway (e.g.
  // it also nudges a 1W/6M/etc view to refresh right as the market opens
  // or closes).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const planKey = useMemo(() => {
    const p = getOneDayPlan();
    return `${p.dateStr}|${p.isToday}|${p.live}`;
  }, [clockTick]);

  const oneDayPlan = useMemo(() => getOneDayPlan(), [planKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const cacheKey = config.key;

  // Is the CURRENTLY ACTIVE tab allowed to poll right now?
  //  1. It must be flagged live:true in RANGES (1D/1W/1M/3M/6M/1Y — never
  //     5Y/MAX, a monthly/daily candle doesn't "tick live").
  //  2. For the 1D tab specifically: oneDayPlan.live must be true — i.e.
  //     we're actually looking at TODAY's session during market hours,
  //     not a resolved past day (before 9:15, or a weekend). A 1D tab
  //     showing Friday's closed candles must never poll even though the
  //     tab itself is live-eligible.
  //  3. For every other live-eligible tab: the market must be open RIGHT
  //     NOW (09:15–15:30 IST, Mon–Fri) — no polling 1W/6M/etc data while
  //     the market's shut, and no polling at all on weekends/off-hours.
  const isLive = useMemo(() => {
    if (!config.live) return false;
    if (config.key === "1D") return oneDayPlan.live;
    return isMarketOpenNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, planKey]);

  // For the 1D tab: does "now" resolve to TODAY (use the /intraday
  // endpoint, which only ever returns the current session), or to a
  // PAST trading day (use the regular historical endpoint with an
  // explicit from=to=that day, since /intraday physically cannot return
  // a previous day's candles)?
  const useIntradayThunk = config.kind === "intraday" && oneDayPlan.isToday;

  const options = useMemo(() => {
    if (config.kind === "intraday") {
      if (oneDayPlan.isToday) {
        return { symbol, unit: config.unit, interval: config.interval, cacheKey };
      }
      // Before 9:15am on a weekday, or any time on a weekend — resolve
      // to the last real trading day and pull its FULL session (still
      // 1-minute granularity) via the historical route instead.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, symbol, cacheKey, planKey]);

  const dispatchFetch = useMemoizedDispatchFetch(dispatch, useIntradayThunk, options);

  // Re-fetch when: symbol changes, the user switches tabs, or the 1D
  // plan meaningfully changes (planKey flips at a market-hours
  // boundary — e.g. it's now 9:15am so 1D should switch from "yesterday,
  // static" to "today, live").
  useEffect(() => {
    if (symbol) dispatchFetch();
  }, [symbol, range, planKey, dispatchFetch]);

  // Live polling — only while isLive is true. isLive itself is
  // recomputed on every clock tick (via planKey), so this effect's
  // cleanup/re-subscribe naturally fires the moment the market closes or
  // a resolved-past-day 1D view stops being "live" — no manual
  // intervention needed.
  useEffect(() => {
    if (!symbol || !isLive) return undefined;
    const timer = setInterval(dispatchFetch, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [symbol, isLive, dispatchFetch]);

  const candles = useSelector((state) => selectCandles(state, symbol, cacheKey));
  const status = useSelector((state) => selectCandlesStatus(state, symbol, cacheKey));

  return { range, setRange, candles, status, isLive, oneDayPlan };
}

// Small helper so the effects above have a stable function reference
// (avoids re-subscribing the poll interval on every render) while still
// picking the right thunk for intraday vs historical, and picking that
// choice up even when it changes (e.g. 1D flips from "yesterday,
// historical" to "today, intraday" exactly at market open) — ref.current
// is reassigned with the latest closure every render, so the interval
// (which always calls dispatchFetch() -> ref.current()) stays correct
// without needing to be recreated.
//
// Also stamps each dispatch with a monotonic requestId per cacheKey, to
// guard against two in-flight fetches for the same range resolving out
// of order (e.g. a poll tick firing right as a manual refetch goes out).
// historicalSlice.js can use `latestRequestId[cacheKey]` to ignore a
// stale response if a newer request for that key has since gone out.
function useMemoizedDispatchFetch(dispatch, useIntradayThunk, options) {
  const requestIdRef = useRef(0);
  const ref = useRef();
  ref.current = () => {
    requestIdRef.current += 1;
    const payload = { ...options, requestId: `${options.cacheKey}:${requestIdRef.current}` };
    dispatch(useIntradayThunk ? fetchIntradayHistorical(payload) : fetchHistorical(payload));
  };
  return useMemo(() => () => ref.current(), []); // eslint-disable-line react-hooks/exhaustive-deps
}