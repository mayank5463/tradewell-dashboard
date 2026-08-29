import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHistory, fetchIntraday } from "../../services/historicalApi";

const initialState = {
  byKey: {}, // "RELIANCE_1M" -> { candles, status, error, lastFetched }
};

export function historicalKey(symbol, cacheKey) {
  return `${symbol}_${cacheKey}`;
}

function keyFromThunkArg(arg) {
  return historicalKey(arg.symbol, arg.cacheKey);
}

export const fetchHistorical = createAsyncThunk(
  "historical/fetch",
  async (arg) => {
    const { candles } = await fetchHistory(arg.symbol, arg);
    return { key: keyFromThunkArg(arg), candles };
  },
);

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
    upsertLiveCandle(state, action) {
      const { key, candle } = action.payload;
      const entry = state.byKey[key];
      if (!entry) return;
      const idx = entry.candles.findIndex(
        (c) => c.timestamp === candle.timestamp,
      );
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


export const selectCandles = (state, symbol, cacheKey) =>
  state.historical.byKey[historicalKey(symbol, cacheKey)]?.candles ?? [];

export const selectCandlesStatus = (state, symbol, cacheKey) =>
  state.historical.byKey[historicalKey(symbol, cacheKey)]?.status ?? "idle";
