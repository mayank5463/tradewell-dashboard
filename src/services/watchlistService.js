import { apiFetch } from "./api";

// Thin wrappers around the backend's multi-list watchlist endpoints.
// Every function returns { lists, activeListId } (or a superset of it) —
// watchlistSlice.js's applyServerState() reads exactly that shape and
// replaces local state with it, so the client can never drift from the DB.

export function fetchWatchlistRequest() {
  return apiFetch("/watchlist");
}

export function createWatchlistListRequest(name) {
  return apiFetch("/watchlist/list", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function renameWatchlistListRequest(listId, name) {
  return apiFetch(`/watchlist/list/${listId}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteWatchlistListRequest(listId) {
  return apiFetch(`/watchlist/list/${listId}`, { method: "DELETE" });
}

export function setActiveWatchlistRequest(listId) {
  return apiFetch("/watchlist/active", {
    method: "PUT",
    body: JSON.stringify({ listId }),
  });
}

export function addStockToWatchlistRequest(listId, symbol) {
  return apiFetch(`/watchlist/list/${listId}/stock`, {
    method: "POST",
    body: JSON.stringify({ symbol }),
  });
}

export function removeStockFromWatchlistRequest(listId, symbol) {
  return apiFetch(`/watchlist/list/${listId}/stock/${symbol}`, {
    method: "DELETE",
  });
}