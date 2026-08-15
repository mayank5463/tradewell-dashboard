

function selectHoldings(state) {
  return state.holdings?.list ?? [];
}

function selectLiveStocks(state) {
  return state.market?.stocks ?? [];
}

// Attaches live price, invested/current value, P&L, and day P&L to every
// holding.
function enrichHoldings(holdings, liveStocks) {
  return holdings.map((h) => {
    const live = liveStocks.find((s) => s.symbol === h.symbol);
    const ltp = live?.ltp ?? h.ltp ?? h.avgPrice ?? 0;
    const invested = (h.qty ?? 0) * (h.avgPrice ?? 0);
    const current = (h.qty ?? 0) * ltp;
    const pnl = current - invested;
    const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;
    const dayChangePercent = live?.dayChangePercent ?? h.dayChangePercent ?? 0;
    const dayPnL = current * (dayChangePercent / 100);

    return { ...h, ltp, invested, current, pnl, pnlPercent, dayChangePercent, dayPnL, live };
  });
}

// Per-holding P&L, sorted best -> worst. Feeds the horizontal bar chart.
export function selectHoldingsPnLBreakdown(state) {
  const enriched = enrichHoldings(selectHoldings(state), selectLiveStocks(state));

  return enriched
    .map((h) => ({
      symbol: h.symbol,
      pnl: h.pnl,
      pnlPercent: h.pnlPercent,
      invested: h.invested,
      current: h.current,
      qty: h.qty,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

// Overall portfolio summary stats for the top stat strip.
export function selectPortfolioSummary(state) {
  const enriched = enrichHoldings(selectHoldings(state), selectLiveStocks(state));

  if (!enriched.length) return null;

  const totalInvestment = enriched.reduce((s, r) => s + r.invested, 0);
  const totalCurrent = enriched.reduce((s, r) => s + r.current, 0);
  const totalPnL = totalCurrent - totalInvestment;
  const totalPnLPct = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;
  const dayPnL = enriched.reduce((s, r) => s + r.dayPnL, 0);

  const winners = enriched.filter((r) => r.pnl > 0);
  const losers = enriched.filter((r) => r.pnl < 0);

  return {
    totalInvestment,
    totalCurrent,
    totalPnL,
    totalPnLPct,
    dayPnL,
    positionsCount: enriched.length,
    winnersCount: winners.length,
    losersCount: losers.length,
    winRate: enriched.length > 0 ? (winners.length / enriched.length) * 100 : 0,
    avgPosition: totalCurrent / enriched.length,
  };
}