// redux/selectors/tradeAnalyticsSelectors.js

const MS_PER_DAY = 1000 * 60 * 60 * 24;



function selectAllOrders(state) {
  return state.orders?.list ?? [];
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLocalDayKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

/* ============================================================
   CLOSED TRADES — FIFO MATCHING
   ============================================================ */

export function selectClosedTrades(state) {
  const orders = selectAllOrders(state)
    .slice()
    .filter((order) => order?.symbol && order?.timestamp)
    .sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

  const openLotsBySymbol = {};
  const closedTrades = [];

  orders.forEach((order) => {
    const symbol = order.symbol;
    const qty = toNumber(order.qty);
    const price = toNumber(order.price);

    if (!symbol || qty <= 0 || price <= 0) return;

    if (order.mode === "BUY") {
      if (!openLotsBySymbol[symbol]) {
        openLotsBySymbol[symbol] = [];
      }
      openLotsBySymbol[symbol].push({ qty, price, date: order.timestamp });
      return;
    }

    if (order.mode !== "SELL") return;

    const lots = openLotsBySymbol[symbol] ?? [];

    let remaining = qty;
    let costBasis = 0;
    let weightedHoldingDays = 0;
    let earliestBuyAt = null;

    while (remaining > 0 && lots.length > 0) {
      const lot = lots[0];
      const matchedQty = Math.min(lot.qty, remaining);

      const buyDate = new Date(lot.date);
      const sellDate = new Date(order.timestamp);
      const holdingDays = Math.max(
        (sellDate.getTime() - buyDate.getTime()) / MS_PER_DAY,
        0,
      );

      if (!earliestBuyAt || buyDate < new Date(earliestBuyAt)) {
        earliestBuyAt = lot.date;
      }

      costBasis += matchedQty * lot.price;
      weightedHoldingDays += holdingDays * matchedQty;

      lot.qty -= matchedQty;
      remaining -= matchedQty;

      if (lot.qty <= 0) {
        lots.shift();
      }
    }

    const matchedQty = qty - remaining;
    if (matchedQty <= 0) return;

    const proceeds = matchedQty * price;
    const pnl = proceeds - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    const holdingDays = weightedHoldingDays / matchedQty;

    closedTrades.push({
      symbol,
      name: order.name || symbol,
      qty: matchedQty,
      sellPrice: price,
      costBasis,
      proceeds,
      pnl,
      pnlPercent,
      holdingDays,
      openedAt: earliestBuyAt,
      closedAt: order.timestamp,
      isWin: pnl > 0,
      isLoss: pnl < 0,
      isBreakeven: pnl === 0,
      investmentType: holdingDays >= 365 ? "longTerm" : "shortTerm",
    });
  });

  return closedTrades;
}

/* ============================================================
   GLOBAL TRADE STATS
   ============================================================ */

export function selectTradeStats(state) {
  const trades = selectClosedTrades(state);
  const total = trades.length;

  const wins = trades.filter((trade) => trade.pnl > 0).length;
  const losses = trades.filter((trade) => trade.pnl < 0).length;

  const avgHoldingDays =
    total > 0
      ? trades.reduce((sum, trade) => sum + trade.holdingDays, 0) / total
      : 0;

  const bestTrade =
    total > 0 ? trades.reduce((best, trade) => (trade.pnl > best.pnl ? trade : best)) : null;

  const worstTrade =
    total > 0 ? trades.reduce((worst, trade) => (trade.pnl < worst.pnl ? trade : worst)) : null;

  const realizedPnL = trades.reduce((sum, trade) => sum + trade.pnl, 0);

  return {
    totalClosedTrades: total,
    wins,
    losses,
    winRate: total > 0 ? (wins / total) * 100 : 0,
    avgHoldingDays,
    realizedPnL,
    bestTrade,
    worstTrade,
  };
}

/* ============================================================
   TOP TRADED
   ============================================================ */

export const TOP_TRADED_CRITERIA = {
  orders: {
    label: "Number of Orders",
    metric: "orderCount",
    description: "Ranked by total buy + sell orders placed",
  },
  value: {
    label: "Trade Value",
    metric: "totalValue",
    description: "Ranked by total ₹ traded",
  },
  profitTrades: {
    label: "Profit Trades",
    metric: "profitTradeCount",
    description: "Ranked by number of winning closed trades",
  },
  lossTrades: {
    label: "Loss Trades",
    metric: "lossTradeCount",
    description: "Ranked by number of losing closed trades",
  },
  shortTerm: {
    label: "Short-term Investment",
    metric: "shortTermValue",
    description: "Ranked by capital in trades held under 1 year",
  },
  longTerm: {
    label: "Long-term Investment",
    metric: "longTermValue",
    description: "Ranked by capital in trades held 1 year or more",
  },
};

// FIXED — signature now matches how MostTradedSymbols.jsx actually calls
// this: selectTopTradedSymbols(state, { criteria, limit }). Previously this
// took (state, criteria, limit) as separate positional args, so the
// component's single options-object argument landed in `criteria` as a
// whole object, TOP_TRADED_CRITERIA[criteria] never matched anything, and
// the ranking silently always fell back to "orders" regardless of what the
// dropdown selected.
export function selectTopTradedSymbols(state, { criteria = "orders", limit = 5 } = {}) {
  const orders = selectAllOrders(state);
  const closedTrades = selectClosedTrades(state);

  const bySymbol = {};

  /* ------------------------------------------------------------
     ORDER DATA
     ------------------------------------------------------------ */

  orders.forEach((order) => {
    if (!order?.symbol) return;

    const symbol = order.symbol;
    const qty = toNumber(order.qty);
    const price = toNumber(order.price);

    if (!bySymbol[symbol]) {
      bySymbol[symbol] = {
        symbol,
        name: order.name || symbol,
        orderCount: 0,
        buyOrders: 0,
        sellOrders: 0,
        totalQty: 0,
        maxOrderQty: 0,
        minOrderQty: null,
        totalValue: 0,
        profitTradeCount: 0,
        lossTradeCount: 0,
        realizedProfit: 0,
        realizedLoss: 0,
        netRealizedPnL: 0,
        shortTermValue: 0,
        longTermValue: 0,
        shortTermTrades: 0,
        longTermTrades: 0,
        avgHoldingDays: 0,
        longestHoldingDays: 0,
        shortestHoldingDays: null,
        bestTrade: null,
        worstTrade: null,
      };
    }

    const row = bySymbol[symbol];

    row.orderCount += 1;
    if (order.mode === "BUY") row.buyOrders += 1;
    if (order.mode === "SELL") row.sellOrders += 1;

    row.totalQty += qty;
    row.maxOrderQty = Math.max(row.maxOrderQty, qty);
    row.minOrderQty = row.minOrderQty == null ? qty : Math.min(row.minOrderQty, qty);
    row.totalValue += qty * price;
  });

  /* ------------------------------------------------------------
     CLOSED TRADE DATA
     ------------------------------------------------------------ */

  const holdingAccumulator = {};

  closedTrades.forEach((trade) => {
    const row = bySymbol[trade.symbol];
    if (!row) return;

    if (!holdingAccumulator[trade.symbol]) {
      holdingAccumulator[trade.symbol] = { totalDays: 0, count: 0 };
    }

    if (trade.pnl > 0) {
      row.profitTradeCount += 1;
      row.realizedProfit += trade.pnl;
    }
    if (trade.pnl < 0) {
      row.lossTradeCount += 1;
      row.realizedLoss += Math.abs(trade.pnl);
    }

    row.netRealizedPnL += trade.pnl;

    if (trade.holdingDays < 365) {
      row.shortTermTrades += 1;
      row.shortTermValue += trade.costBasis;
    } else {
      row.longTermTrades += 1;
      row.longTermValue += trade.costBasis;
    }

    row.longestHoldingDays = Math.max(row.longestHoldingDays, trade.holdingDays);
    row.shortestHoldingDays =
      row.shortestHoldingDays == null
        ? trade.holdingDays
        : Math.min(row.shortestHoldingDays, trade.holdingDays);

    if (!row.bestTrade || trade.pnl > row.bestTrade.pnl) row.bestTrade = trade;
    if (!row.worstTrade || trade.pnl < row.worstTrade.pnl) row.worstTrade = trade;

    holdingAccumulator[trade.symbol].totalDays += trade.holdingDays;
    holdingAccumulator[trade.symbol].count += 1;
  });

  /* ------------------------------------------------------------
     FINALIZE
     ------------------------------------------------------------ */

  Object.values(bySymbol).forEach((row) => {
    const holding = holdingAccumulator[row.symbol];
    row.avgHoldingDays = holding?.count > 0 ? holding.totalDays / holding.count : 0;
    row.minOrderQty ??= 0;
    row.shortestHoldingDays ??= 0;
  });

  const config = TOP_TRADED_CRITERIA[criteria] ?? TOP_TRADED_CRITERIA.orders;
  const metric = config.metric;

  const allRows = Object.values(bySymbol).sort((a, b) => {
    const metricDifference = toNumber(b[metric]) - toNumber(a[metric]);
    if (metricDifference !== 0) return metricDifference;
    return b.totalValue - a.totalValue; // stable tiebreaker
  });

  // FIXED — MostTradedSymbols.jsx reads `ranking.rows` and
  // `ranking.totalSymbols`; this previously returned a bare array, so
  // `ranking?.rows ?? []` always evaluated to [] and the widget was stuck
  // permanently showing its empty state regardless of real order data.
  return {
    rows: allRows.slice(0, limit),
    totalSymbols: allRows.length,
    criteria,
  };
}

/* Backwards compatibility */
export function selectMostTradedSymbols(state, limit = 6) {
  return selectTopTradedSymbols(state, { criteria: "orders", limit }).rows;
}

/* ============================================================
   DAILY REALIZED P&L — rich calendar data
   ============================================================ */

export function selectDailyTradingPerformance(state) {
  const trades = selectClosedTrades(state);
  const byDay = {};

  trades.forEach((trade) => {
    const key = getLocalDayKey(trade.closedAt);

    if (!byDay[key]) {
      byDay[key] = {
        dateKey: key,
        pnl: 0,
        profit: 0,
        loss: 0,
        tradeCount: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalValue: 0,
        totalQty: 0,
        bestTrade: null,
        worstTrade: null,
        symbols: new Set(),
        trades: [],
      };
    }

    const day = byDay[key];

    day.pnl += trade.pnl;
    day.tradeCount += 1;
    day.totalValue += trade.proceeds;
    day.totalQty += trade.qty;
    day.symbols.add(trade.symbol);
    day.trades.push(trade);

    if (trade.pnl > 0) {
      day.profit += trade.pnl;
      day.winningTrades += 1;
    }
    if (trade.pnl < 0) {
      day.loss += Math.abs(trade.pnl);
      day.losingTrades += 1;
    }

    if (!day.bestTrade || trade.pnl > day.bestTrade.pnl) day.bestTrade = trade;
    if (!day.worstTrade || trade.pnl < day.worstTrade.pnl) day.worstTrade = trade;
  });

  Object.values(byDay).forEach((day) => {
    day.symbols = Array.from(day.symbols);
    day.winRate = day.tradeCount > 0 ? (day.winningTrades / day.tradeCount) * 100 : 0;
  });

  return byDay;
}

/* ============================================================
   BACKWARDS COMPATIBILITY
   ============================================================ */

export function selectDailyRealizedPnL(state) {
  const performance = selectDailyTradingPerformance(state);
  const result = {};

  Object.entries(performance).forEach(([key, day]) => {
    result[key] = day.pnl;
  });

  return result;
}