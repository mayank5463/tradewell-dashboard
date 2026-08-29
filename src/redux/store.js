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