import { apiFetch } from "./api";

// GET /market/company/:symbol
export function fetchCompanyProfile(symbol, force = false) {
  return apiFetch(`/market/company/${symbol}${force ? "?force=true" : ""}`);
}