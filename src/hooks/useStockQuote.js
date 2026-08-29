import { useEffect, useRef, useState } from "react";
import { fetchOneQuote } from "../services/marketService";

// Matches marketQuoteService.js's own poll cadence.
const POLL_INTERVAL_MS = 7000;


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