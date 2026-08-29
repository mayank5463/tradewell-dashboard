

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchPositionsRequest } from "../../services/positionService";



const initialState = { list: [], status: "idle", error: null };


export const fetchPositions = createAsyncThunk(
  "positions/fetch",
  async () => {
    return await fetchPositionsRequest();
  },
  {
    condition: (_, { getState }) => getState().positions.status !== "loading",
  },
);

function recalcLossFlag(position) {
  position.isLoss = position.ltp < position.avgPrice;
}

const positionsSlice = createSlice({
  name: "positions",
  initialState,
  reducers: {
    addPosition(state, action) {
      const { symbol, name, instrumentToken, qty, avgPrice, ltp } = action.payload;
      const existing = state.list.find((p) => p.symbol === symbol);

      if (existing) {
        const totalQty = existing.qty + qty;
        existing.avgPrice =
          (existing.avgPrice * existing.qty + avgPrice * qty) / totalQty;
        existing.qty = totalQty;
        existing.ltp = ltp ?? existing.ltp;
        existing.netChangePercent = Number(
          (((existing.ltp - existing.avgPrice) / existing.avgPrice) * 100).toFixed(2)
        );
        recalcLossFlag(existing);
      } else {
        state.list.push({
          symbol,
          name,
          instrumentToken: instrumentToken ?? null,
          qty,
          avgPrice,
          ltp: ltp ?? avgPrice,
          netChangePercent: 0,
          dayChangePercent: 0,
          isLoss: false,
        });
      }
    },

    reducePosition(state, action) {
      const { symbol, qty } = action.payload;
      const existing = state.list.find((p) => p.symbol === symbol);
      if (!existing) return;
      existing.qty -= qty;
      if (existing.qty <= 0) {
        state.list = state.list.filter((p) => p.symbol !== symbol);
      }
    },

    // OPTIONAL — same note as holdingsSlice: /allpositions already
    // re-enriches on every fetch, this just lets you tick between fetches.
    updatePositionsWithLiveQuotes(state, action) {
      const quotes = action.payload;
      const bySymbol = Array.isArray(quotes)
        ? Object.fromEntries(quotes.map((q) => [q.symbol, q]))
        : quotes;

      state.list.forEach((p) => {
        const q = bySymbol[p.symbol];
        if (!q) return;
        p.ltp = q.ltp ?? p.ltp;
        p.dayChangePercent = q.dayChangePercent ?? p.dayChangePercent;
        p.netChangePercent = Number(
          (((p.ltp - p.avgPrice) / p.avgPrice) * 100).toFixed(2)
        );
        recalcLossFlag(p);
      });
    },

    clearPositions(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPositions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPositions.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchPositions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const {
  addPosition,
  reducePosition,
  updatePositionsWithLiveQuotes,
  clearPositions,
} = positionsSlice.actions;
export default positionsSlice.reducer;