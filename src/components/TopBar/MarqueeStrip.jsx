import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchFeaturedStocks, selectFeaturedStocks } from "../../redux/slices/marketSlice";
import { formatCurrency, formatPercent } from "../../utils/formatCurrency";
import "./MarqueeStrip.css";

// Same 7s cadence as the rest of the app's live-quote polling (see
// StockQuote.js's comment on quote freshness) — keeps the marquee's prices
// moving in step with everything else instead of on its own schedule.
const POLL_INTERVAL_MS = 7000;

// TARGET SPEED, not target duration. This is the actual fix for "runs very
// fast": the old version had a fixed `animation-duration: 210s` in the CSS
// no matter how many stocks were in the track. Since the track is always
// exactly 2x the full stock list (see renderRow comment below), a bigger
// watched-symbol universe means a wider track — and covering a WIDER
// distance in the SAME fixed time means a HIGHER px/sec speed. That's why
// it sped up: more symbols in state.market.stocks, not a bug in the loop
// itself. Pinning px/sec instead of seconds keeps the crawl speed constant
// no matter how many symbols are watched.
const PIXELS_PER_SECOND = 60;

// Floor ONLY — a near-empty stock list (say, 2-3 symbols) would otherwise
// produce a distractingly short/fast loop. Deliberately NO ceiling: an
// upper cap was tried here first and is exactly what caused "still
// running very fast" — capping duration for a LARGE stock list forces the
// same big distance into a shorter time, which is a HIGHER speed, the
// opposite of the goal. Duration must be allowed to grow without limit as
// the watched-symbol count grows, or the constant-px/sec promise breaks
// for exactly the large-list case this was meant to fix.
const MIN_DURATION_S = 20;

// Rendering the stock list twice back-to-back lets the CSS animation loop seamlessly -
// once the first copy has scrolled fully out, the second is already in the exact same
// spot, so the reset is invisible. Pure CSS, no JS interval needed.
//
// This strip is intentionally NOT paused on hover or click - it scrolls right to left
// continuously, no matter what the user does with the mouse.
export default function MarqueeStrip() {
  const dispatch = useDispatch();
  // CHANGED AGAIN: was selectPopularStocks (POPULAR_SYMBOLS — only 15
  // symbols, meant for a "Popular" badge UI elsewhere, not a ticker
  // strip). WATCHED_SYMBOLS is the actual ~100-symbol curated liquid-stock
  // list — selectFeaturedStocks/fetchFeaturedStocks pull that instead.
  const stocks = useSelector(selectFeaturedStocks);
  const trackRef = useRef(null);
  const [duration, setDuration] = useState(90); // matches CSS's var(--marquee-duration, 90s) fallback

  // featuredStocks isn't covered by whatever hook/interval feeds
  // state.market.stocks elsewhere in the app (useMarketPolling.js only
  // dispatches fetchMarketQuotes/fetchMarketIndices) — so the marquee
  // fetches and refreshes its own list independently.
  useEffect(() => {
    dispatch(fetchFeaturedStocks());
    const interval = setInterval(() => {
      dispatch(fetchFeaturedStocks());
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Recomputes duration from the REAL rendered width of one copy of the
  // list (trackRef.scrollWidth / 2, since the track is two copies back to
  // back — see renderRow below). Deliberately depends on `stocks.length`
  // rather than the whole `stocks` array: live price ticks (every ~7s from
  // market polling) change values inside existing items but not how many
  // items exist or roughly how wide they are, so this only recalculates
  // when symbols are actually added/removed — not on every price update,
  // which would otherwise cause tiny duration jitters on every poll tick
  // for no visual benefit.
  useEffect(() => {
    if (!trackRef.current || stocks.length === 0) return;

    const measure = () => {
      if (!trackRef.current) return;
      const fullTrackWidth = trackRef.current.scrollWidth;
      const oneCopyWidth = fullTrackWidth / 2;
      const rawDuration = oneCopyWidth / PIXELS_PER_SECOND;
      setDuration(Math.max(MIN_DURATION_S, rawDuration));
    };

    // rAF instead of measuring synchronously: waits one frame so fonts/
    // layout for this render pass are settled before reading scrollWidth
    // (measuring too early is the other classic cause of a marquee's
    // speed being wrong — see the "no fonts loaded yet" case).
    const raf = requestAnimationFrame(measure);

    // Also re-measure on resize — the same stock list renders at a
    // different pixel width on a resize (font rendering, container
    // width), so the target px/sec would silently drift without this.
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [stocks.length]);

  const renderRow = (keyPrefix) =>
    stocks.map((stock) => {
      const isUp = stock.dayChangePercent >= 0;
      return (
        <span key={`${keyPrefix}-${stock.symbol}`} className="marquee-strip__item">
          <span className="marquee-strip__symbol">{stock.symbol}</span>
          <span className="marquee-strip__price">{formatCurrency(stock.ltp)}</span>
          <span className={`marquee-strip__change ${isUp ? "is-up" : "is-down"}`}>
            {isUp ? "▲" : "▼"} {formatPercent(stock.dayChangePercent)}
          </span>
        </span>
      );
    });

  return (
    <div className="marquee-strip">
      <div
        className="marquee-strip__track"
        ref={trackRef}
        style={{ "--marquee-duration": `${duration}s` }}
      >
        {renderRow("a")}
        {renderRow("b")}
      </div>
    </div>
  );
}