import { apiFetch } from "./api";

export function placeOrderRequest({
  symbol,
  qty,
  price,
  mode,
  product,
  orderType,
}) {
  return apiFetch("/newOrder", {
    method: "POST",
    body: JSON.stringify({ symbol, qty, price, mode, product, orderType }),
  });
}

export function fetchOrdersRequest() {
  return apiFetch("/allorders");
}
