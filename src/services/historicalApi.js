import { apiFetch } from "./api";


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


export function fetchIntraday(symbol, options = {}) {
  const params = new URLSearchParams();
  if (options.unit) params.set("unit", options.unit);
  if (options.interval) params.set("interval", options.interval);

  const qs = params.toString();
  return apiFetch(`/market/history/${symbol}/intraday${qs ? `?${qs}` : ""}`);
}