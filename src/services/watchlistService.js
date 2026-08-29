import { apiFetch } from "./api";

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
