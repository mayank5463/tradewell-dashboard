// services/holdingService.js
//
// NEW FILE — holdingsSlice.js needs this to talk to holdingController.js.
// Nothing called GET /allholdings from the frontend before this.

import { apiFetch } from "./api";

// GET /allholdings -> array of Holding documents, enriched with live
// ltp/dayChangePercent server-side (see enrichWithLiveQuote in
// holdingController.js)
export function fetchHoldingsRequest() {
  return apiFetch("/allholdings");
}