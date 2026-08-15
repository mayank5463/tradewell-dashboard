// Central place for config/magic numbers so we're not hunting through components later.

export const BASE_FUNDS = 500000; // ₹5,00,000 starting paper-trading balance

export const VISIBLE_COUNT_OPTIONS = [10, 50, 100]; // how many stocks the gainers/losers pool is drawn from

export const GAINERS_LOSERS_LIMIT = 10; // how many rows we actually show per column

// FIXED: Added /login at the end
export const LOGIN_APP_URL = "http://localhost:3001/login"; // ← CHANGED THIS LINE

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
};