import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchHoldingsRequest } from "../../services/holdingService";

const initialState = { list: [], status: "idle", error: null };

export const fetchHoldings = createAsyncThunk(
  "holdings/fetch",
  async () => {
    return await fetchHoldingsRequest();
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
    addHolding(state, action) {
      const { symbol, name, instrumentToken, qty, avgPrice, ltp } =
        action.payload;
      const existing = state.list.find((h) => h.symbol === symbol);

      if (existing) {
        const totalQty = existing.qty + qty;
        existing.avgPrice =
          (existing.avgPrice * existing.qty + avgPrice * qty) / totalQty;
        existing.qty = totalQty;
        existing.ltp = ltp ?? existing.ltp;
        existing.netChangePercent = Number(
          (
            ((existing.ltp - existing.avgPrice) / existing.avgPrice) *
            100
          ).toFixed(2),
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
          (((h.ltp - h.avgPrice) / h.avgPrice) * 100).toFixed(2),
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
