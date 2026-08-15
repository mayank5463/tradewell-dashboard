

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { apiFetch } from "../../services/api";

// CONFIRMED against holdingController.js:
//   GET /allholdings — returns an array of holdings, ALREADY live-enriched
//   (ltp, dayChangePercent, netChangePercent, isLoss are computed
//   server-side from getLiveQuote() on every request). Auth-scoped to
//   req.user.id via cookie, so no userId needs to be sent from here.

const initialState = { list: [], status: "idle", error: null };

// `condition` guard — as of this change, fetchHoldings() is dispatched
// independently from three places: Holdings.jsx's own mount effect,
// Summary.jsx's mount effect, and ordersSlice's placeOrder thunk after
// every trade. Without this guard, a route that mounts Holdings + Summary
// together fires two concurrent /allholdings requests on load, and a
// third can land mid-trade. Skipping while a fetch is already "loading"
// makes every dispatcher just ride the one in-flight request instead.
export const fetchHoldings = createAsyncThunk(
  "holdings/fetch",
  async () => {
    return await apiFetch("/allholdings");
  },
  {
    condition: (_, { getState }) => getState().holdings.status !== "loading",
  },
);

function recalcLossFlag(holding) {
  holding.isLoss = holding.ltp < holding.avgPrice;
}

const holdingsSlice = createSlice({
  name: "holdings",
  initialState,
  reducers: {
    // Local/optimistic helpers — in practice the backend (newOrder ->
    // handleBuy/handleSell in orderController.js) is what actually creates
    // and updates holdings. Prefer re-dispatching fetchHoldings() after a
    // BUY/SELL over calling these directly, so the DB stays the source of
    // truth. Kept here in case you want instant optimistic UI before the
    // refetch lands.
    addHolding(state, action) {
      const { symbol, name, instrumentToken, qty, avgPrice, ltp } = action.payload;
      const existing = state.list.find((h) => h.symbol === symbol);

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

    reduceHolding(state, action) {
      const { symbol, qty } = action.payload;
      const existing = state.list.find((h) => h.symbol === symbol);
      if (!existing) return;
      existing.qty -= qty;
      if (existing.qty <= 0) {
        state.list = state.list.filter((h) => h.symbol !== symbol);
      }
    },

    // OPTIONAL now — /allholdings already re-enriches ltp/dayChangePercent
    // on every fetch. Only useful if you want holdings to tick every 7s in
    // between fetchHoldings() calls, by feeding it the same market poll
    // (mapQuote() shape) that marketSlice consumes.
    updateHoldingsWithLiveQuotes(state, action) {
      const quotes = action.payload;
      const bySymbol = Array.isArray(quotes)
        ? Object.fromEntries(quotes.map((q) => [q.symbol, q]))
        : quotes;

      state.list.forEach((h) => {
        const q = bySymbol[h.symbol];
        if (!q) return;
        h.ltp = q.ltp ?? h.ltp;
        h.dayChangePercent = q.dayChangePercent ?? h.dayChangePercent;
        h.netChangePercent = Number(
          (((h.ltp - h.avgPrice) / h.avgPrice) * 100).toFixed(2)
        );
        recalcLossFlag(h);
      });
    },

    clearHoldings(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHoldings.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchHoldings.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchHoldings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export const {
  addHolding,
  reduceHolding,
  updateHoldingsWithLiveQuotes,
  clearHoldings,
} = holdingsSlice.actions;
export default holdingsSlice.reducer;