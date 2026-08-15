





import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAllQuotes, fetchIndices, fetchIndexFunds, fetchPopular, fetchFeatured } from "../../services/marketService";
// UPDATED — added fetchIndexFunds import above. It doesn't exist in
// marketService.js yet — see the note at the bottom of this response for
// the exact function to add there; this thunk will throw at call time
// until that's in place.

export const fetchMarketQuotes = createAsyncThunk(
  "market/fetchQuotes",
  async () => {
    const data = await fetchAllQuotes();
    return data.quotes || [];
  },
);

export const fetchMarketIndices = createAsyncThunk(
  "market/fetchIndices",
  async () => {
    const list = await fetchIndices();
    return list.reduce((acc, idx) => {
      const key = idx.symbol || idx.name;
      acc[key] = {
        name: idx.name,
        value: idx.ltp,
        changePercent: idx.dayChangePercent,
        // Points change — see marketQuoteService.mapQuote, which already
        // gives every index the same netChange field a stock gets, since
        // indices go through the identical quotes batch.
        change: idx.netChange ?? 0,
      };
      return acc;
    }, {});
  },
);

// NEW — the 10-index "Top Index Funds" strip on the Summary page. Unlike
// fetchMarketIndices above, this does NOT reshape the response into the
// lighter {value, changePercent} pill shape — it stores the FULL quote
// objects as-is (symbol, name, ltp, netChange, dayChangePercent, open,
// high, low, prevClose, ...), because TopIndexFunds.jsx's cards and
// IndexDetailModal's OHLC grid both need those extra fields, and
// backend's getTopIndexFunds() already returns them in exactly this
// shape (see marketQuoteService.js) — no transform needed here.
export const fetchMarketIndexFunds = createAsyncThunk(
  "market/fetchIndexFunds",
  async () => {
    return await fetchIndexFunds();
  },
);

export const fetchPopularStocks = createAsyncThunk(
  "market/fetchPopular",
  async () => {
    return await fetchPopular();
  },
);

export const fetchFeaturedStocks = createAsyncThunk(
  "market/fetchFeatured",
  async () => {
    return await fetchFeatured();
  },
);

const initialState = {
  stocks: [],
  popularStocks: [],
  featuredStocks: [],
  indices: {},
  indexFunds: [], // NEW — array of full quote objects for the Top Index Funds strip
  connectionStatus: "connecting",
  visibleCount: 20,
};

const marketSlice = createSlice({
  name: "market",
  initialState,
  reducers: {
    setStocks(state, action) {
      state.stocks = action.payload;
    },
    setIndices(state, action) {
      state.indices = action.payload;
    },
    updateStockPrice(state, action) {
      const { symbol, ltp, dayChangePercent } = action.payload;
      const stock = state.stocks.find((s) => s.symbol === symbol);
      if (stock) {
        stock.ltp = ltp;
        stock.dayChangePercent = dayChangePercent;
      }
    },
    setConnectionStatus(state, action) {
      state.connectionStatus = action.payload;
    },
    updateIndex(state, action) {
      const { key, value, change, changePercent } = action.payload;
      if (state.indices[key]) {
        state.indices[key].value = value;
        if (change !== undefined) {
          state.indices[key].change = change;
        }
        state.indices[key].changePercent = changePercent;
      }
    },
    setVisibleCount(state, action) {
      state.visibleCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketQuotes.fulfilled, (state, action) => {
        state.stocks = action.payload;
        state.connectionStatus = "live";
      })
      .addCase(fetchMarketQuotes.rejected, (state) => {
        state.connectionStatus = "error";
      })
      .addCase(fetchMarketIndices.fulfilled, (state, action) => {
        state.indices = action.payload;
      })
      .addCase(fetchMarketIndices.rejected, (state) => {
        state.connectionStatus = "error";
      })
      // NEW
      .addCase(fetchMarketIndexFunds.fulfilled, (state, action) => {
        state.indexFunds = action.payload;
      })
      .addCase(fetchMarketIndexFunds.rejected, (state) => {
        // Deliberately doesn't touch connectionStatus — a failure here
        // shouldn't flip the whole app into "error" over one strip.
      })
      .addCase(fetchPopularStocks.fulfilled, (state, action) => {
        state.popularStocks = action.payload;
      })
      .addCase(fetchFeaturedStocks.fulfilled, (state, action) => {
        state.featuredStocks = action.payload;
      });
  },
});

export const {
  setStocks,
  setIndices,
  updateStockPrice,
  updateIndex,
  setVisibleCount,
  setConnectionStatus,
} = marketSlice.actions;
export default marketSlice.reducer;

// ============================================================
// UPDATED GAINERS & LOSERS SELECTORS
// Properly fetches from Upstox API data
// ============================================================

/**
 * Select top gainers from the market data
 * Sorts by dayChangePercent descending (highest gain first)
 * Returns the top N based on visibleCount
 */
export const selectGainers = (state, visibleCount = 20) => {
  const stocks = state.market.stocks || [];

  // Filter out stocks with invalid data
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === 'number' &&
      !isNaN(stock.dayChangePercent) &&
      stock.ltp > 0
  );

  // Sort by dayChangePercent descending (highest gainers first)
  const sorted = [...validStocks].sort((a, b) => b.dayChangePercent - a.dayChangePercent);

  // Return the top N based on visibleCount
  return sorted.slice(0, visibleCount);
};

/**
 * Select top losers from the market data
 * Sorts by dayChangePercent ascending (highest loss first)
 * Returns the top N based on visibleCount
 */
export const selectLosers = (state, visibleCount = 20) => {
  const stocks = state.market.stocks || [];

  // Filter out stocks with invalid data
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === 'number' &&
      !isNaN(stock.dayChangePercent) &&
      stock.ltp > 0
  );

  // Sort by dayChangePercent ascending (most negative first)
  const sorted = [...validStocks].sort((a, b) => a.dayChangePercent - b.dayChangePercent);

  // Return the top N based on visibleCount
  return sorted.slice(0, visibleCount);
};

/**
 * Get the total count of gainers and losers
 * Useful for showing statistics
 */
export const selectMarketStats = (state) => {
  const stocks = state.market.stocks || [];
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === 'number' &&
      !isNaN(stock.dayChangePercent)
  );

  const gainers = validStocks.filter(s => s.dayChangePercent > 0);
  const losers = validStocks.filter(s => s.dayChangePercent < 0);
  const unchanged = validStocks.filter(s => s.dayChangePercent === 0);

  return {
    total: validStocks.length,
    gainers: gainers.length,
    losers: losers.length,
    unchanged: unchanged.length,
  };
};

export const selectIndexByName = (state, nameMatch) => {
  const indices = state.market.indices || {};
  return Object.values(indices).find((idx) =>
    idx.name?.toLowerCase().includes(nameMatch.toLowerCase()),
  );
};

// NEW — for TopIndexFunds.jsx / IndexDetailModal.jsx
export const selectIndexFunds = (state) => state.market.indexFunds;

export const selectIndexFundBySymbol = (state, symbol) =>
  state.market.indexFunds.find((idx) => idx.symbol === symbol);

export const selectPopularStocks = (state) => state.market.popularStocks.slice(0, 100);
export const selectFeaturedStocks = (state) => state.market.featuredStocks.slice(0, 100);
