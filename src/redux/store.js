import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import watchlistReducer from "./slices/watchlistSlice";
import ordersReducer from "./slices/ordersSlice";
import positionsReducer from "./slices/positionsSlice";
import holdingsReducer from "./slices/holdingsSlice";
import fundsReducer from "./slices/fundsSlice";
import marketReducer from "./slices/marketSlice";
import historicalReducer from "./slices/historicalSlice";
import uiReducer from "./slices/uiSlice";
import companyProfileReducer from "./slices/companyProfileSlice";

// FIXED — `middleware` was nested INSIDE the `reducer` map, which silently
// created a bogus `state.middleware` slice instead of registering
// middleware at all. Also removed watchlistSyncMiddleware entirely — the
// new watchlistSlice.js thunks already persist to the server on every
// mutation (see applyServerState), so a separate debounced sync layer is
// now redundant and would double-fire requests.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    watchlist: watchlistReducer,
    orders: ordersReducer,
    positions: positionsReducer,
    holdings: holdingsReducer,
    funds: fundsReducer,
    market: marketReducer,
    historical: historicalReducer,
    companyProfile: companyProfileReducer,
    ui: uiReducer,
  },
});