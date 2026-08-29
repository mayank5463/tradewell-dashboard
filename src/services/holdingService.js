import { apiFetch } from "./api";

export function fetchHoldingsRequest() {
  return apiFetch("/allholdings");
}
