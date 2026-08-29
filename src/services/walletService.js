import { apiFetch } from "./api";

export function fetchWalletRequest() {
  return apiFetch("/wallet");
}

export function fetchWalletLedgerRequest(params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", params.limit);
  if (params.before) query.set("before", params.before);
  const qs = query.toString();
  return apiFetch(`/wallet/transactions${qs ? `?${qs}` : ""}`);
}

export function resetWalletRequest() {
  return apiFetch("/wallet/reset", { method: "POST" });
}
