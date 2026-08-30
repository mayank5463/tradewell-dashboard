// import { fetchHistoricalCandles } from "../../services/historicalService";
// import {
//   fetchHistoricalStart,
//   fetchHistoricalSuccess,
//   fetchHistoricalFailure,
//   historicalKey,
// } from "../slices/historicalSlice";


// export const loadHistoricalCandles = (symbol, options = {}, force = false) => {
//   return async (dispatch, getState) => {
//     const unit = options.unit || "days";
//     const interval = options.interval || 1;
//     const key = historicalKey(symbol, unit, interval);

//     const existing = getState().historical.byKey[key];
//     if (!force && existing?.status === "succeeded") {
//       return { success: true, cached: true };
//     }

//     dispatch(fetchHistoricalStart(key));
//     try {
//       const { candles } = await fetchHistoricalCandles(symbol, options);
//       dispatch(fetchHistoricalSuccess({ key, candles }));
//       return { success: true, candles };
//     } catch (err) {
//       const message = err.response?.data?.message || err.message || "Failed to load history.";
//       dispatch(fetchHistoricalFailure({ key, error: message }));
//       return { success: false, error: message };
//     }
//   };
// };


















import { fetchHistorical, historicalKey } from "../slices/historicalSlice";

// FIXED — this used to import `fetchHistoricalCandles` from
// "../../services/historicalService", a file that doesn't exist (the
// real service is historicalApi.js, exporting fetchHistory/fetchIntraday
// instead). It also dispatched fetchHistoricalStart/Success/Failure
// action creators that historicalSlice.js no longer exports — that slice
// was rewritten around createAsyncThunk's fetchHistorical/
// fetchIntradayHistorical, which already dispatch their own
// pending/fulfilled/rejected internally and don't need separate
// start/success/failure actions at all.
//
// dispatch(fetchHistoricalStart(key)) was calling `undefined` as a
// function, and it sat OUTSIDE the try/catch below it — so the throw
// was never caught. Dev-mode module resolution tolerated the missing
// export silently until the call site actually ran; production's
// bundling didn't, which is why this broke specifically in production.
//
// This now wraps the real, working fetchHistorical thunk instead. Same
// exported name, same signature, same return shape — nothing calling
// loadHistoricalCandles() elsewhere needs to change.
export const loadHistoricalCandles = (symbol, options = {}, force = false) => {
  return async (dispatch, getState) => {
    const unit = options.unit || "days";
    const interval = options.interval || 1;

    // historicalSlice.js keys stored candles by (symbol, cacheKey) — a
    // RangeSelector tab key like "1D"/"1W" normally. This legacy action
    // only ever received unit/interval from its callers, so derive a
    // stable cache key from those instead; it just needs to be
    // consistent between calls, not match an actual RANGES tab.
    const cacheKey = options.cacheKey || `${unit}_${interval}`;
    const key = historicalKey(symbol, cacheKey);

    const existing = getState().historical.byKey[key];
    if (!force && existing?.status === "succeeded") {
      return { success: true, cached: true, candles: existing.candles };
    }

    try {
      const { candles } = await dispatch(
        fetchHistorical({
          symbol,
          unit,
          interval,
          from: options.from,
          to: options.to,
          cacheKey,
        }),
      ).unwrap();
      return { success: true, candles };
    } catch (err) {
      const message =
        typeof err === "string" ? err : err?.message || "Failed to load history.";
      return { success: false, error: message };
    }
  };
};