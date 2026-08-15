import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getGreetingLabel, getTimeOfDay } from "../../../utils/formatTime";
import { getGreetingQuote } from "../../../data/quotes";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./Summary.css";
import "../../../styles/variables.css";
import "../../../styles/global.css";

// NEW: portfolioValue / dayPnL / dayPct are optional props, supplied by
// Summary.jsx from the SAME `totals` useMemo it already computes for
// HoldingsSummaryBar - no new calculations added here, just displaying
// numbers that already existed one level up. Omit them entirely and this
// component renders exactly as it did before (greeting + quote only).
export default function GreetingBanner({ portfolioValue, dayPnL, dayPct, hasHoldings }) {
  const user = useSelector((state) => state.auth.user);
  const firstName = user?.name ? user.name.split(" ")[0] : "Trader";

  // Picked once per mount, not every render, so it doesn't change mid-read.
  const quote = useMemo(() => getGreetingQuote(getTimeOfDay()), []);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  // Simple heuristic for NSE cash-market hours (9:15–15:30 IST, Mon–Fri).
  // NOT wired to a real holiday calendar - presentational only, matches the
  // "current market status" ask without inventing a new data dependency.
  const marketStatus = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun, 6 = Sat
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = minutesNow >= 9 * 60 + 15 && minutesNow <= 15 * 60 + 30;
    return isWeekday && isMarketHours ? "open" : "closed";
  }, []);

  const isProfit = (dayPnL ?? 0) >= 0;
  const showPortfolioRow = hasHoldings && portfolioValue !== undefined;

  return (
    <div className="greeting-banner">
      <div className="greeting-banner__top">
        <div>
          <h1 className="greeting-banner__title">
            {getGreetingLabel()}, <span>{firstName}</span>
          </h1>
          {quote?.text && <p className="greeting-banner__quote">{quote.text}</p>}
        </div>

        <div className="greeting-banner__meta">
          <span className="greeting-banner__date">{today}</span>
          <span className={`greeting-banner__market-pill is-${marketStatus}`}>
            <span className="greeting-banner__market-dot" aria-hidden="true" />
            Market {marketStatus === "open" ? "Open" : "Closed"}
          </span>
        </div>
      </div>

      {/* Only shown once the user actually has holdings - matches Summary.jsx's
          own hasHoldings branch, so this never shows ₹0 for a fresh account. */}
      {showPortfolioRow && (
        <div className="greeting-banner__portfolio">
          <div className="greeting-banner__portfolio-stat">
            <span className="greeting-banner__portfolio-label">Portfolio Value</span>
            <span className="greeting-banner__portfolio-value">
              {formatCurrency(portfolioValue)}
            </span>
          </div>
          <div className="greeting-banner__portfolio-stat">
            <span className="greeting-banner__portfolio-label">Today&apos;s P&amp;L</span>
            <span className={`greeting-banner__portfolio-value ${isProfit ? "is-up" : "is-down"}`}>
              {formatCurrency(dayPnL)}{" "}
              <span className="greeting-banner__portfolio-sub">({formatPercent(dayPct)})</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}






// // import { useMemo } from "react";
// // import { useSelector } from "react-redux";
// // import { getGreetingLabel, getTimeOfDay } from "../../../utils/formatTime";
// // import { getGreetingQuote } from "../../../data/quotes";
// // import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
// // import "./GreetingBanner.css";

// // /**
// //  * GreetingBanner
// //  *
// //  * Props (all optional — omit them and only the greeting + quote row renders):
// //  *   portfolioValue  {number}  Current portfolio value in ₹
// //  *   dayPnL          {number}  Today's absolute P&L in ₹
// //  *   dayPct          {number}  Today's return as a percentage
// //  *   hasHoldings     {boolean} Whether the user has any active holdings
// //  *
// //  * Class names intentionally match the ones already defined in Summary.css
// //  * (greeting-banner__top / __meta / __market-pill / __portfolio / etc.) so
// //  * no new CSS is required and nothing breaks on screens that already work.
// //  */
// // export default function GreetingBanner({
// //   portfolioValue,
// //   dayPnL,
// //   dayPct,
// //   hasHoldings,
// // }) {
// //   // ── Auth ────────────────────────────────────────────────────────────────
// //   const user = useSelector((state) => state.auth.user);

// //   const firstName = useMemo(() => {
// //     if (!user?.name) return "Investor";
// //     return user.name.split(" ")[0];
// //   }, [user]);

// //   // ── Quote — stable for the lifetime of this mount ───────────────────────
// //   const quote = useMemo(() => getGreetingQuote(getTimeOfDay()), []);

// //   // ── Date / time strings ──────────────────────────────────────────────────
// //   const today = useMemo(
// //     () =>
// //       new Date().toLocaleDateString("en-IN", {
// //         weekday: "long",
// //         day: "numeric",
// //         month: "long",
// //         year: "numeric",
// //       }),
// //     []
// //   );

// //   const currentTime = useMemo(
// //     () =>
// //       new Date().toLocaleTimeString("en-IN", {
// //         hour: "numeric",
// //         minute: "2-digit",
// //       }),
// //     []
// //   );

// //   // ── Market status — simple heuristic for NSE cash-market hours ──────────
// //   // 09:15–15:30 IST, Mon–Fri. Not wired to a holiday calendar — presentational only.
// //   const marketStatus = useMemo(() => {
// //     const now = new Date();
// //     const day = now.getDay(); // 0 = Sun, 6 = Sat
// //     const minutes = now.getHours() * 60 + now.getMinutes();
// //     const isWeekday = day >= 1 && day <= 5;
// //     const isMarketHours = minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
// //     return isWeekday && isMarketHours ? "open" : "closed";
// //   }, []);

// //   // ── Derived display values ───────────────────────────────────────────────
// //   const isProfit = (dayPnL ?? 0) >= 0;
// //   const showPortfolio = hasHoldings && portfolioValue !== undefined;

// //   // ─────────────────────────────────────────────────────────────────────────
// //   return (
// //     <div className="greeting-banner">
// //       {/* ── Top row: greeting + market status ── */}
// //       <div className="greeting-banner__top">

// //         {/* Left: title + quote */}
// //         <div>
// //           <h1 className="greeting-banner__title">
// //             {getGreetingLabel()},&nbsp;<span>{firstName}</span>
// //           </h1>

// //           {quote?.text && (
// //             <p className="greeting-banner__quote">{quote.text}</p>
// //           )}
// //         </div>

// //         {/* Right: date + market pill */}
// //         <div className="greeting-banner__meta">
// //           <span className="greeting-banner__date">
// //             {today} &middot; {currentTime}
// //           </span>

// //           <span className={`greeting-banner__market-pill is-${marketStatus}`}>
// //             <span className="greeting-banner__market-dot" aria-hidden="true" />
// //             Market {marketStatus === "open" ? "Open" : "Closed"}
// //           </span>
// //         </div>

// //       </div>

// //       {/* ── Portfolio row: only shown when the user has holdings ── */}
// //       {showPortfolio && (
// //         <div className="greeting-banner__portfolio">

// //           {/* Portfolio value */}
// //           <div className="greeting-banner__portfolio-stat">
// //             <span className="greeting-banner__portfolio-label">
// //               Portfolio Value
// //             </span>
// //             <span className="greeting-banner__portfolio-value">
// //               {formatCurrency(portfolioValue)}
// //             </span>
// //           </div>

// //           {/* Today's P&L */}
// //           <div className="greeting-banner__portfolio-stat">
// //             <span className="greeting-banner__portfolio-label">
// //               Today&apos;s P&amp;L
// //             </span>
// //             <span
// //               className={`greeting-banner__portfolio-value ${
// //                 isProfit ? "is-up" : "is-down"
// //               }`}
// //             >
// //               {formatCurrency(dayPnL)}{" "}
// //               <span className="greeting-banner__portfolio-sub">
// //                 ({formatPercent(dayPct)})
// //               </span>
// //             </span>
// //           </div>

// //           {/* Live / closed indicator */}
// //           <div
// //             className="greeting-banner__portfolio-stat"
// //             style={{ marginLeft: "auto" }}
// //           >
// //             <span
// //               className={`greeting-banner__market-pill is-${marketStatus}`}
// //               style={{ fontSize: "var(--font-size-xs)" }}
// //             >
// //               <span
// //                 className="greeting-banner__market-dot"
// //                 aria-hidden="true"
// //               />
// //               {marketStatus === "open"
// //                 ? "Live data updating"
// //                 : "Market closed"}
// //             </span>
// //           </div>

// //         </div>
// //       )}
// //     </div>
// //   );
// // }










