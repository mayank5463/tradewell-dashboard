

import { apiFetch } from "./api";

// POST /newOrder -> { message } on success, throws with the real server
// error message on failure (e.g. "You only have 3 shares of RELIANCE.")
export function placeOrderRequest({ symbol, qty, price, mode, product, orderType }) {
  return apiFetch("/newOrder", {
    method: "POST",
    body: JSON.stringify({ symbol, qty, price, mode, product, orderType }),
  });
}

// GET /allorders -> array of Order documents, newest first
export function fetchOrdersRequest() {
  return apiFetch("/allorders");
}