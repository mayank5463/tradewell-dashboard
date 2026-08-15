export const BASE_FUNDS = 500000;

export const VISIBLE_COUNT_OPTIONS = [10, 50, 100];

export const GAINERS_LOSERS_LIMIT = 10;

export const LOGIN_APP_URL = process.env.REACT_APP_FRONTEND_URL 
  ? `${process.env.REACT_APP_FRONTEND_URL}/login`
  : "http://localhost:3001/login";

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3002";

export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  laptop: 1024,
  desktop: 1280,
};