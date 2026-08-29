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

export function fetchIndices() {
  return apiFetch("/market/indices");
}

export function fetchIndexFunds() {
  return apiFetch("/market/index-funds");
}

// GET /market/popular -> array
export function fetchPopular() {
  return apiFetch("/market/popular");
}

export function fetchFeatured() {
  return apiFetch("/market/featured");
}
