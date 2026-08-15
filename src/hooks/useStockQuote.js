import { useEffect, useRef, useState } from "react";
import { fetchOneQuote } from "../services/marketService";

// Matches marketQuoteService.js's own poll cadence.
const POLL_INTERVAL_MS = 7000;

// StockDetailPanel used to read its price off state.market.stocks, which
// is only kept warm by useMarketPolling() — and that hook only runs while
// Summary.jsx is mounted. Since /stock/:symbol is a SIBLING route to
// /dashboard (not nested inside it), navigating to a stock detail page
// unmounts Summary and stops that polling — so the price goes stale, and a
// direct link or page refresh to /stock/RELIANCE finds market.stocks empty
// and never recovers.
//
// This hook makes the detail page self-sufficient: it fetches GET
// /market/quote/:symbol itself on mount and keeps polling every 7s for as
// long as it's mounted, regardless of whether the dashboard was ever
// visited first. Returned shape is the same mapQuote()-shaped object
// market.stocks entries already use (symbol, name, ltp, dayChangePercent,
// open, high, low, prevClose, volume, ...), so nothing downstream needs to
// change field names.
export function useStockQuote(symbol) {
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "succeeded" | "failed"
  const timerRef = useRef(null);

  useEffect(() => {
    if (!symbol) return undefined;

    let cancelled = false;

    const tick = async () => {
      try {
        setStatus((s) => (s === "succeeded" ? s : "loading"));
        const data = await fetchOneQuote(symbol);
        if (!cancelled) {
          setQuote(data);
          setStatus("succeeded");
        }
      } catch (err) {
        if (!cancelled) setStatus("failed");
      }
    };

    tick(); // don't wait for the first interval
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
    };
  }, [symbol]);

  return { quote, status };
}