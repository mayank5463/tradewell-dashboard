import { apiFetch } from "./api";

export function fetchPositionsRequest() {
  return apiFetch("/allpositions");
}
