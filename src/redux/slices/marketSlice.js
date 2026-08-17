import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchAllQuotes,
  fetchIndices,
  fetchIndexFunds,
  fetchPopular,
  fetchFeatured,
} from "../../services/marketService";

/**
 * ASYNC THUNKS
 */

export const fetchMarketQuotes = createAsyncThunk(
  "market/fetchQuotes",
  async () => {
    const data = await fetchAllQuotes();
    return data.quotes || [];
  }
);

/**
 * Fetch market indices (SENSEX, NIFTY50)
 * Backend returns: [
 *   { symbol: "SENSEX", name: "BSE Sensex", ltp: 75123.45, netChange: 123.45, dayChangePercent: 0.16, ... },
 *   { symbol: "NIFTY50", name: "Nifty 50", ltp: 22456.78, netChange: 56.78, dayChangePercent: 0.25, ... }
 * ]
 * 
 * Transform to indexed object keyed by symbol:
 * {
 *   "SENSEX": { symbol, name, value, change, changePercent },
 *   "NIFTY50": { symbol, name, value, change, changePercent }
 * }
 */
export const fetchMarketIndices = createAsyncThunk(
  "market/fetchIndices",
  async () => {
    const list = await fetchIndices();
    if (!Array.isArray(list)) return {};

    return list.reduce((acc, idx) => {
      if (!idx || !idx.symbol) return acc;

      const key = idx.symbol.toUpperCase(); // Normalize: SENSEX, NIFTY50
      acc[key] = {
        symbol: idx.symbol,
        name: idx.name || idx.symbol,
        value: idx.ltp ?? 0,
        change: idx.netChange ?? 0,
        changePercent: idx.dayChangePercent ?? 0,
      };

      return acc;
    }, {});
  }
);

/**
 * Fetch top 10 index funds (Sensex, Nifty, + 8 sector indices)
 * Backend returns full quote objects, store as-is for cards/modals.
 * Array format: [
 *   { symbol: "NIFTY50", ltp: 22456, netChange: 56, dayChangePercent: 0.25, open, high, low, ... },
 *   { symbol: "SENSEX", ltp: 75123, netChange: 123, dayChangePercent: 0.16, ... },
 *   ...more indices
 * ]
 */
export const fetchMarketIndexFunds = createAsyncThunk(
  "market/fetchIndexFunds",
  async () => {
    try {
      const data = await fetchIndexFunds();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("[REDUX] fetchMarketIndexFunds failed:", err.message);
      return [];
    }
  }
);

export const fetchPopularStocks = createAsyncThunk(
  "market/fetchPopular",
  async () => {
    const data = await fetchPopular();
    return Array.isArray(data) ? data : [];
  }
);

export const fetchFeaturedStocks = createAsyncThunk(
  "market/fetchFeatured",
  async () => {
    const data = await fetchFeatured();
    return Array.isArray(data) ? data : [];
  }
);

/**
 * INITIAL STATE
 */
const initialState = {
  stocks: [],
  popularStocks: [],
  featuredStocks: [],
  indices: {}, // Keyed by symbol: { "SENSEX": {...}, "NIFTY50": {...} }
  indexFunds: [], // Array of full quote objects for TopIndexFunds.jsx
  connectionStatus: "connecting", // connecting | live | error
  visibleCount: 20,
  error: null,
};

/**
 * SLICE
 */
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
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Quotes
      .addCase(fetchMarketQuotes.fulfilled, (state, action) => {
        state.stocks = action.payload;
        state.connectionStatus = "live";
        state.error = null;
      })
      .addCase(fetchMarketQuotes.rejected, (state, action) => {
        state.connectionStatus = "error";
        state.error = action.error.message;
      })

      // Indices
      .addCase(fetchMarketIndices.fulfilled, (state, action) => {
        state.indices = action.payload;
        state.connectionStatus = "live";
        state.error = null;
      })
      .addCase(fetchMarketIndices.rejected, (state, action) => {
        state.connectionStatus = "error";
        state.error = action.error.message;
      })

      // Index Funds (10-index strip) — silent fail if unavailable
      .addCase(fetchMarketIndexFunds.fulfilled, (state, action) => {
        state.indexFunds = action.payload;
      })
      .addCase(fetchMarketIndexFunds.rejected, (state) => {
        // Deliberately doesn't touch connectionStatus — a failure here
        // shouldn't flip the whole app into "error" over one strip.
        state.indexFunds = [];
      })

      // Popular Stocks
      .addCase(fetchPopularStocks.fulfilled, (state, action) => {
        state.popularStocks = action.payload;
      })
      .addCase(fetchPopularStocks.rejected, (state) => {
        state.popularStocks = [];
      })

      // Featured Stocks
      .addCase(fetchFeaturedStocks.fulfilled, (state, action) => {
        state.featuredStocks = action.payload;
      })
      .addCase(fetchFeaturedStocks.rejected, (state) => {
        state.featuredStocks = [];
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
  clearError,
} = marketSlice.actions;

export default marketSlice.reducer;

/**
 * SELECTORS
 * All defensive against missing/null data
 */

export const selectGainers = (state, visibleCount = 20) => {
  const stocks = state.market?.stocks || [];
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === "number" &&
      !isNaN(stock.dayChangePercent) &&
      stock.ltp > 0
  );
  const sorted = [...validStocks].sort(
    (a, b) => b.dayChangePercent - a.dayChangePercent
  );
  return sorted.slice(0, visibleCount);
};

export const selectLosers = (state, visibleCount = 20) => {
  const stocks = state.market?.stocks || [];
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === "number" &&
      !isNaN(stock.dayChangePercent) &&
      stock.ltp > 0
  );
  const sorted = [...validStocks].sort(
    (a, b) => a.dayChangePercent - b.dayChangePercent
  );
  return sorted.slice(0, visibleCount);
};

export const selectMarketStats = (state) => {
  const stocks = state.market?.stocks || [];
  const validStocks = stocks.filter(
    (stock) =>
      stock &&
      typeof stock.dayChangePercent === "number" &&
      !isNaN(stock.dayChangePercent)
  );

  const gainers = validStocks.filter((s) => s.dayChangePercent > 0);
  const losers = validStocks.filter((s) => s.dayChangePercent < 0);
  const unchanged = validStocks.filter((s) => s.dayChangePercent === 0);

  return {
    total: validStocks.length,
    gainers: gainers.length,
    losers: losers.length,
    unchanged: unchanged.length,
  };
};

/**
 * Get index by symbol (SENSEX, NIFTY50, etc.)
 * Exact match, case-insensitive
 */
export const selectIndexBySymbol = (state, symbol) => {
  if (!symbol) return null;
  const key = symbol.toUpperCase();
  return state.market?.indices?.[key] || null;
};

/**
 * Get index by name or symbol (fuzzy search)
 * Used when you don't know exact key
 */
export const selectIndexByName = (state, nameMatch) => {
  if (!nameMatch) return null;
  const indices = state.market?.indices || {};
  const match = nameMatch.toLowerCase();

  // Try exact key match first (most reliable)
  const keyMatch = Object.keys(indices).find(
    (k) => k.toLowerCase() === match
  );
  if (keyMatch) return indices[keyMatch];

  // Try partial key match
  const partialKeyMatch = Object.keys(indices).find((k) =>
    k.toLowerCase().includes(match)
  );
  if (partialKeyMatch) return indices[partialKeyMatch];

  // Try name or symbol search
  return Object.values(indices).find((idx) => {
    const name = (idx.name || "").toLowerCase();
    const symbol = (idx.symbol || "").toLowerCase();
    return name.includes(match) || symbol.includes(match);
  });
};

// Index Funds (10-index strip for TopIndexFunds.jsx / IndexDetailModal.jsx)
export const selectIndexFunds = (state) => state.market?.indexFunds || [];

export const selectIndexFundBySymbol = (state, symbol) =>
  (state.market?.indexFunds || []).find((idx) => idx.symbol === symbol) || null;

// Popular & Featured Stocks (bounded lists for MarqueeStrip, etc.)
export const selectPopularStocks = (state) =>
  (state.market?.popularStocks || []).slice(0, 100);

export const selectFeaturedStocks = (state) =>
  (state.market?.featuredStocks || []).slice(0, 100);

// Connection status
export const selectConnectionStatus = (state) =>
  state.market?.connectionStatus || "connecting";

// Error
export const selectMarketError = (state) => state.market?.error || null;