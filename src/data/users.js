// Demo users — each with their own portfolio and watchlists.
// Real app only ever cares about "the current user," matched by
// whatever id/email comes back from /check-auth.
export const demoUsers = {
  "user_1": {
    id: "user_1",
    name: "Aarav Sharma",
    funds: {
      totalFunds: 500000,   // fixed paper-trading base — 5 lakh
      usedFunds: 82500,
      availableFunds: 417500,
    },
    holdings: [
      { symbol: "TCS", qty: 10, avg: 4050.0 },
      { symbol: "RELIANCE", qty: 5, avg: 2870.0 },
    ],
    positions: [
      { symbol: "INFY", product: "MIS", qty: 8, avg: 1810.0 },
    ],
    orders: [
      { id: "o1", symbol: "TCS", qty: 10, price: 4050.0, mode: "BUY", timestamp: Date.now() - 3600000 },
      { id: "o2", symbol: "RELIANCE", qty: 5, price: 2870.0, mode: "BUY", timestamp: Date.now() - 1800000 },
    ],
    watchlists: [
      {
        id: "wl_default",
        name: "My Watchlist",
        stocks: ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ITC"],
      },
      {
        id: "wl_trending",
        name: "Trending",
        stocks: ["ADANIENT", "TATAMOTORS", "TITAN"],
      },
    ],
  },
};