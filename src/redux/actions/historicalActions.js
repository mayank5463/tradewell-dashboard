import { fetchHistoricalCandles } from "../../services/historicalService";
import {
  fetchHistoricalStart,
  fetchHistoricalSuccess,
  fetchHistoricalFailure,
  historicalKey,
} from "../slices/historicalSlice";


export const loadHistoricalCandles = (symbol, options = {}, force = false) => {
  return async (dispatch, getState) => {
    const unit = options.unit || "days";
    const interval = options.interval || 1;
    const key = historicalKey(symbol, unit, interval);

    const existing = getState().historical.byKey[key];
    if (!force && existing?.status === "succeeded") {
      return { success: true, cached: true };
    }

    dispatch(fetchHistoricalStart(key));
    try {
      const { candles } = await fetchHistoricalCandles(symbol, options);
      dispatch(fetchHistoricalSuccess({ key, candles }));
      return { success: true, candles };
    } catch (err) {
      const message = err.response?.data?.message || err.message || "Failed to load history.";
      dispatch(fetchHistoricalFailure({ key, error: message }));
      return { success: false, error: message };
    }
  };
};