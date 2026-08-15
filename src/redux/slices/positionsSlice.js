


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../services/api";

// CONFIRMED against positionController.js:
//   GET /allpositions — array of positions, ALREADY live-enriched the same
//   way holdings are (ltp/dayChangePercent/netChangePercent/isLoss computed
//   server-side). Auth-scoped to req.user.id via cookie.
//
// NOTE: there's no order-placement path for positions the way there is for
// holdings (orderController.js only ever writes to HoldingModel on
// BUY/SELL, never PositionModel). If you want MIS/intraday orders to
// create Positions instead of Holdings, that logic still needs to be added
// on the backend — right now positionsSlice has nothing that populates it.

const initialState = { list: [], status: "idle", error: null };

// Same condition guard as holdingsSlice's fetchHoldings — only one
// dispatcher (Positions.jsx) exists today, but this keeps the two data
// slices consistent and avoids a repeat of the holdings duplicate-fetch
// issue if another component starts reading state.positions.list later.
export const fetchPositions = createAsyncThunk(
  "positions/fetch",
  async () => {
    return await apiFetch("/allpositions");
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