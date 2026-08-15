import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHistory, fetchIntraday } from "../../services/historicalApi";

const initialState = {
  byKey: {}, // "RELIANCE_1M" -> { candles, status, error, lastFetched }
};

// FIXED — this used to be historicalKey(symbol, unit, interval), building
// keys like "RELIANCE_days_1". Problem: 1W/1M/6M/1Y all share
// unit:"days", interval:1 in RANGES (RangeSelector.jsx) — the only thing
// that told them apart was `days`, which was never part of this key. So
// every "days" range stored candles under the SAME slot, and whichever
// fetch resolved last (not necessarily the one for the tab you're
// looking at) is what every tab showed.
//
// useStockHistory.js was already updated to send/read a `cacheKey` (the
// RANGES tab key: "1D"/"1W"/"1M"/"6M"/"1Y"/"5Y"/"MAX", which IS unique
// per tab) — but this slice was still building storage keys from
// unit/interval and ignoring cacheKey entirely, so the two sides could
// never agree on a key. selectCandles always missed and fell back to its
// empty-array default, which is why charts rendered an empty box for
// every symbol/range: candles.length was always 0, so StockChart.jsx's
// setData() effect never ran.
export function historicalKey(symbol, cacheKey) {
  return `${symbol}_${cacheKey}`;
}

function keyFromThunkArg(arg) {
  return historicalKey(arg.symbol, arg.cacheKey);
}

// Calls GET /market/history/:symbol — the same cache-first endpoint
// historicalController.js exposes. Candle shape coming back is exactly
// { timestamp, open, high, low, close, volume, oi, live? } already, so no
// reshaping is needed here.
// arg: { symbol, unit, interval, from, to, cacheKey }
export const fetchHistorical = createAsyncThunk("historical/fetch", async (arg) => {
  const { candles } = await fetchHistory(arg.symbol, arg);
  return { key: keyFromThunkArg(arg), candles };
});

// For the "1D" chart tab. Hits the /intraday route instead of the regular
// one. Stored under the SAME byKey shape, keyed by cacheKey like
// everything else — so selectCandles/selectCandlesStatus work unchanged.
// arg: { symbol, unit, interval, cacheKey } — no from/to, always "today
// so far".
export const fetchIntradayHistorical = createAsyncThunk(
  "historical/fetchIntraday",
  async (arg) => {
    const { candles } = await fetchIntraday(arg.symbol, arg);
    return { key: keyFromThunkArg(arg), candles };
  },
);

const historicalSlice = createSlice({
  name: "historical",
  initialState,
  reducers: {
    // Merge today's live tick onto the cached candle set instead of a full
    // refetch — call this from useMarketPolling (or its own poll loop) for
    // whichever chart is currently open. `key` here must be a cacheKey-
    // based key (e.g. historicalKey(symbol, "1D")) to match how candles
    // are actually stored.
    upsertLiveCandle(state, action) {
      const { key, candle } = action.payload;
      const entry = state.byKey[key];
      if (!entry) return;
      const idx = entry.candles.findIndex((c) => c.timestamp === candle.timestamp);
      if (idx >= 0) entry.candles[idx] = candle;
      else entry.candles.push(candle);
    },
    clearHistorical(state, action) {
      if (action.payload) delete state.byKey[action.payload];
      else state.byKey = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistorical.pending, (state, action) => {
        const key = keyFromThunkArg(action.meta.arg);
        state.byKey[key] = {
          ...(state.byKey[key] || { candles: [] }),
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchHistorical.fulfilled, (state, action) => {
        const { key, candles } = action.payload;
        state.byKey[key] = {
          candles,
          status: "succeeded",
          error: null,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchHistorical.rejected, (state, action) => {
        const key = keyFromThunkArg(action.meta.arg);
        state.byKey[key] = {
          ...(state.byKey[key] || { candles: [] }),
          status: "failed",
          error: action.error.message,
        };
      })
      // Same three-state handling as fetchHistorical above, just for the
      // intraday/1D thunk.
      .addCase(fetchIntradayHistorical.pending, (state, action) => {
        const key = keyFromThunkArg(action.meta.arg);
        state.byKey[key] = {
          ...(state.byKey[key] || { candles: [] }),
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchIntradayHistorical.fulfilled, (state, action) => {
        const { key, candles } = action.payload;
        state.byKey[key] = {
          candles,
          status: "succeeded",
          error: null,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchIntradayHistorical.rejected, (state, action) => {
        const key = keyFromThunkArg(action.meta.arg);
        state.byKey[key] = {
          ...(state.byKey[key] || { candles: [] }),
          status: "failed",
          error: action.error.message,
        };
      });
  },
});

export const { upsertLiveCandle, clearHistorical } = historicalSlice.actions;
export default historicalSlice.reducer;

// FIXED — now takes cacheKey directly (the RANGES tab key) instead of
// (unit, interval). This is what useStockHistory.js has been calling all
// along: selectCandles(state, symbol, cacheKey). Previously this
// signature was (state, symbol, unit, interval), so cacheKey landed in
// the `unit` param and produced a key that never matched anything stored.
export const selectCandles = (state, symbol, cacheKey) =>
  state.historical.byKey[historicalKey(symbol, cacheKey)]?.candles ?? [];

export const selectCandlesStatus = (state, symbol, cacheKey) =>
  state.historical.byKey[historicalKey(symbol, cacheKey)]?.status ?? "idle";