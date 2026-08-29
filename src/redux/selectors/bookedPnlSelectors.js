import dayjs from "dayjs";

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
  return (
    order.mode === "SELL" &&
    order.status === "COMPLETE" &&
    typeof order.realizedPnl === "number"
  );
}

export function selectAllTimeBookedPnl(state) {
  return selectAllOrders(state)
    .filter(isRealizedSell)
    .reduce((sum, o) => sum + o.realizedPnl, 0);
}

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

export function selectHasAnyBookedPnl(state) {
  return selectAllOrders(state).some(isRealizedSell);
}
