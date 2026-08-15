

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { fetchMarketQuotes, fetchMarketIndices } from "../redux/slices/marketSlice";

// Mirrors marketQuoteService.js's own POLL_INTERVAL_MS (7s) — polling
// faster than the backend's liveCache actually refreshes just burns
// requests for no new data.
const POLL_INTERVAL_MS = 7000;

// Mount this once near the top of the dashboard (e.g. in the Dashboard
// page component). It fires an immediate fetch, then keeps stocks +
// indices fresh every 7s for as long as the component is mounted.
export function useMarketPolling() {
  const dispatch = useDispatch();
  const timerRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      dispatch(fetchMarketQuotes());
      dispatch(fetchMarketIndices());
    };

    tick(); // don't wait for the first interval to elapse
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => clearInterval(timerRef.current);
  }, [dispatch]);
}