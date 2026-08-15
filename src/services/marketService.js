


// Thin wrappers around marketController.js's routes. One function per
// endpoint, names mirror the controller functions so it's obvious which
// backend handler answers each call.
import { apiFetch } from "./api";

// GET /market/quotes -> { count, quotes: [...] }
export function fetchAllQuotes() {
  return apiFetch("/market/quotes");
}

// GET /market/quote/:symbol -> single mapQuote()-shaped object
export function fetchOneQuote(symbol) {
  return apiFetch(`/market/quote/${symbol}`);
}

// GET /market/gainers?limit=20 -> array
export function fetchGainers(limit = 20) {
  return apiFetch(`/market/gainers?limit=${limit}`);
}

// GET /market/losers?limit=20 -> array
export function fetchLosers(limit = 20) {
  return apiFetch(`/market/losers?limit=${limit}`);
}

// GET /market/indices -> array of quote objects (NIFTY50, SENSEX) — NOT an
// object keyed by symbol, that's on the frontend to do if it wants to.
export function fetchIndices() {
  return apiFetch("/market/indices");
}

// NEW — GET /market/index-funds -> array of quote objects for the 10-index
// "Top Index Funds" strip (Sensex, Nifty, + 8 sector indices). Same
// mapQuote() shape as fetchIndices() above — full OHLC/netChange fields,
// not a symbol-keyed object — so TopIndexFunds.jsx / IndexDetailModal.jsx
// on the frontend can consume it directly without a reshape, same as
// marketSlice's fetchMarketIndexFunds thunk already assumes.
export function fetchIndexFunds() {
  return apiFetch("/market/index-funds");
}

// GET /market/popular -> array
export function fetchPopular() {
  return apiFetch("/market/popular");
}

// GET /market/featured -> array — the ~100-symbol curated liquid-stock
// list (WATCHED_SYMBOLS server-side), distinct from the smaller 15-symbol
// fetchPopular() "featured badge" list above.
export function fetchFeatured() {
  return apiFetch("/market/featured");
}