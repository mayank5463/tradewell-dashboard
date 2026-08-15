import { apiFetch } from "./api";

// GET /market/history/:symbol?unit=&interval=&from=&to=&live=
// Mirrors historicalController.js's query params exactly.
// options: { unit, interval, from, to, live }
//   live: pass `false` to exclude today's still-forming candle
export function fetchHistory(symbol, options = {}) {
  const params = new URLSearchParams();
  if (options.unit) params.set("unit", options.unit);
  if (options.interval) params.set("interval", options.interval);
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  if (options.live === false) params.set("live", "false");

  const qs = params.toString();
  // -> { symbol, unit, interval, count, candles }
  return apiFetch(`/market/history/${symbol}${qs ? `?${qs}` : ""}`);
}

// ADDED — GET /market/history/:symbol/intraday?unit=&interval=
// For the "1D" chart tab specifically. No from/to — always "today so far".
// options: { unit, interval } — defaults to 1-minute bars.
export function fetchIntraday(symbol, options = {}) {
  const params = new URLSearchParams();
  if (options.unit) params.set("unit", options.unit);
  if (options.interval) params.set("interval", options.interval);

  const qs = params.toString();
  return apiFetch(`/market/history/${symbol}/intraday${qs ? `?${qs}` : ""}`);
}