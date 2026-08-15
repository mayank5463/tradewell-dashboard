import { selectTradeStats } from "./tradeAnalyticsSelectors";

function enrichedPositions(state) {
  return [...(state.holdings?.list ?? []), ...(state.positions?.list ?? [])];
}

export function selectCashBalance(state) {
  return state.funds.balance;
}

export function selectIntradayBuyingPower(state) {
  return Math.max(state.funds.balance, 0) * 5;
}

export function selectInvestedValue(state) {
  return enrichedPositions(state).reduce((sum, p) => sum + (p.qty ?? 0) * (p.avgPrice ?? 0), 0);
}

export function selectCurrentHoldingsValue(state) {
  return enrichedPositions(state).reduce(
    (sum, p) => sum + (p.qty ?? 0) * (p.ltp ?? p.avgPrice ?? 0),
    0,
  );
}

export function selectTodaysPL(state) {
  return enrichedPositions(state).reduce((sum, p) => {
    const current = (p.qty ?? 0) * (p.ltp ?? p.avgPrice ?? 0);
    const dayChangePercent = p.dayChangePercent ?? 0;
    return sum + current * (dayChangePercent / 100);
  }, 0);
}

export function selectRealizedPnL(state) {
  return selectTradeStats(state).realizedPnL;
}

export function selectNetWorth(state) {
  return Math.max(state.funds.balance, 0) + selectCurrentHoldingsValue(state);
}

export function selectFundsHistory(state) {
  return state.funds.transactions;
}

// ── Portfolio allocation (pie chart) ──────────────────────────────────────
export function selectHoldingsAllocation(state) {
  const combined = enrichedPositions(state);
  const total = combined.reduce(
    (sum, p) => sum + (p.qty ?? 0) * (p.ltp ?? p.avgPrice ?? 0),
    0,
  );
  if (total <= 0) return [];

  return combined
    .map((p) => {
      const value = (p.qty ?? 0) * (p.ltp ?? p.avgPrice ?? 0);
      return { symbol: p.symbol, value, percent: (value / total) * 100 };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

// ── Capital deployed + realized P&L over time (area chart) ───────────────
export function selectPortfolioGrowthSeries(state) {
  const orders = [...(state.orders?.list ?? [])].sort(
    (a, b) => new Date(a.timestamp ?? a.createdAt) - new Date(b.timestamp ?? b.createdAt),
  );

  const lots = {};
  let capitalDeployed = 0;
  let realizedPnL = 0;
  const byDate = new Map();

  for (const order of orders) {
    const { symbol, qty, price, mode, timestamp, createdAt } = order;
    const dateKey = new Date(timestamp ?? createdAt).toISOString().slice(0, 10);
    if (!lots[symbol]) lots[symbol] = [];

    if (mode === "BUY") {
      lots[symbol].push({ qty, price });
      capitalDeployed += qty * price;
    } else if (mode === "SELL") {
      let remaining = qty;
      while (remaining > 0 && lots[symbol].length > 0) {
        const lot = lots[symbol][0];
        const matchQty = Math.min(remaining, lot.qty);
        realizedPnL += matchQty * (price - lot.price);
        capitalDeployed -= matchQty * lot.price;
        lot.qty -= matchQty;
        remaining -= matchQty;
        if (lot.qty <= 0) lots[symbol].shift();
      }
    }

    byDate.set(dateKey, { capitalDeployed, realizedPnL });
  }

  const series = Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    capitalDeployed: values.capitalDeployed,
    realizedPnL: values.realizedPnL,
    isToday: false,
  }));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaysUnrealizedPL = selectTodaysPL(state);

  if (series.length === 0 || series[series.length - 1].date !== todayKey) {
    series.push({
      date: todayKey,
      capitalDeployed,
      realizedPnL: realizedPnL + todaysUnrealizedPL,
      isToday: true,
    });
  } else {
    series[series.length - 1].realizedPnL += todaysUnrealizedPL;
    series[series.length - 1].isToday = true;
  }

  return series;
}