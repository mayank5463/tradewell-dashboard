import { apiFetch } from "./api";

// Thin wrappers around the real backend wallet endpoints
// (walletController.js). fundsSlice.js's thunks call these directly —
// no axios, matches api.js's fetch-based apiFetch helper.

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

// Requires a new backend route — see note at the end of this response.
export function resetWalletRequest() {
  return apiFetch("/wallet/reset", { method: "POST" });
}