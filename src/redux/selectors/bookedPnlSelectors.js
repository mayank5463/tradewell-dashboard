import dayjs from "dayjs";

// Mirrors the pattern in orderAnalyticsSelectors.js — reads state.orders.list
// directly, using the CONFIRMED real field names (order.mode, order.status,
// order.timestamp), the same ones DailyOrderVolume/BuySellSplit already rely on.
const selectAllOrders = (state) => state.orders?.list ?? [];

export const PERIODS = [
  { key: "1D", label: "1D", days: 1 },
  { key: "1W", label: "1W", days: 7 },
  { key: "1M", label: "1M", days: 30 },
  { key: "6M", label: "6M", days: 182 },
  { key: "1Y", label: "1Y", days: 365 },
  { key: "ALL", label: "All time", days: null },
];

function isRealizedSell(order) {
  // realizedPnl is written by the backend at sell time (see the
  // Order.model.js / orderController.js patch) — a plain qty*price
  // difference can't be trusted here because avgPrice drifts every time
  // more of the same symbol is bought, so only orders that actually carry
  // a computed realizedPnl count toward booked P&L. Orders placed before
  // that field existed are silently excluded rather than mis-summed.
  return order.mode === "SELL" && order.status === "COMPLETE" && typeof order.realizedPnl === "number";
}

// Left box — all-time booked P&L. Always a number, never undefined, so the
// box renders ₹0.00 rather than disappearing when there are no closed trades.
export function selectAllTimeBookedPnl(state) {
  return selectAllOrders(state)
    .filter(isRealizedSell)
    .reduce((sum, o) => sum + o.realizedPnl, 0);
}

// Right box — booked P&L within a selected period, keyed off each sell
// order's own timestamp (when it executed), not when the position opened.
export function selectBookedPnlForPeriod(state, periodKey) {
  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[0];
  const cutoff = period.days ? dayjs().subtract(period.days, "day") : null;

  const matching = selectAllOrders(state).filter((o) => {
    if (!isRealizedSell(o)) return false;
    if (!cutoff) return true; // "All time"
    return dayjs(o.timestamp).isAfter(cutoff);
  });

  return {
    total: matching.reduce((sum, o) => sum + o.realizedPnl, 0),
    tradeCount: matching.length,
  };
}

// True once at least one SELL order exists with a usable realizedPnl,
// regardless of period — lets the UI distinguish "no closed trades yet"
// from "your data predates the realizedPnl field" if that ever matters.
export function selectHasAnyBookedPnl(state) {
  return selectAllOrders(state).some(isRealizedSell);
}