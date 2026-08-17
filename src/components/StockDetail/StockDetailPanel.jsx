// import { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { useGeneralContext } from "../Trade/GeneralContext";
// import {
//   fetchCompany,
//   selectCompanyProfile,
//   selectCompanyProfileStatus,
// } from "../../redux/slices/companyProfileSlice";
// import {
//   addStockToList,
//   removeStockFromList,
// } from "../../redux/slices/watchlistSlice";
// import {
//   selectActiveList,
//   selectIsSymbolWatched,
// } from "../../redux/selectors/watchlistSelectors";
// // NEW — same slice TopIndexFunds.jsx / IndexDetailModal.jsx already use
// // to read/refresh index quotes.
// import {
//   fetchMarketIndexFunds,
//   selectIndexFundBySymbol,
// } from "../../redux/slices/marketSlice";
// import { usePriceFlash } from "../../hooks/usePriceFlash";
// import { useStockQuote } from "../../hooks/useStockQuote";
// import StockChart from "./StockChart";
// import logoMap from "../../data/logoMap.json";
// import "./StockDetailPanel.css";

// // NEW — mirrors INDEX_THEME's key set in TopIndexFunds.jsx. Indices live
// // in a separate market.indexFunds slice (not market.stocks) and have no
// // company profile / holdings / watchlist concept at all — this list is
// // what lets this one page branch into a trimmed rendering for them
// // instead of trying to fetch equity-only data for e.g. "NIFTY50".
// const INDEX_SYMBOLS = new Set([
//   "NIFTY50",
//   "SENSEX",
//   "NIFTYBANK",
//   "NIFTYIT",
//   "NIFTYFMCG",
//   "NIFTYAUTO",
//   "NIFTYPHARMA",
//   "NIFTYMETAL",
//   "NIFTYENERGY",
//   "NIFTYREALTY",
// ]);

// function formatCurrency(n) {
//   if (n == null || n === "") return "—";
//   return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// }

// function formatNumber(n, suffix = "") {
//   if (n == null || n === "") return "—";
//   return `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}`;
// }

// function formatChange(n) {
//   if (n == null) return "—";
//   const num = Number(n);
//   const sign = num > 0 ? "+" : num < 0 ? "−" : "";
//   return `${sign}₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
// }

// function formatMarketCapCr(crValue) {
//   if (crValue == null || crValue === "") return "—";
//   const cr = Number(crValue);
//   if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
//   return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
// }

// function findMetric(profile, category, keySubstring) {
//   const list = profile?.keyMetrics?.[category];
//   if (!Array.isArray(list)) return null;
//   const target = keySubstring.toLowerCase().replace(/\s+/g, "");
//   const entry = list.find((m) =>
//     (m.key || "").toLowerCase().replace(/\s+/g, "").includes(target),
//   );
//   return entry?.value ?? null;
// }

// function latestShareholding(profile) {
//   const rows = profile?.shareholding ?? [];
//   return rows
//     .map((cat) => {
//       const latest = cat.categories?.[cat.categories.length - 1];
//       return {
//         name: cat.displayName,
//         percentage: latest ? Number(latest.percentage) : null,
//       };
//     })
//     .filter((r) => r.percentage != null);
// }

// function resolveLocalLogo(symbol) {
//   if (!symbol) return null;
//   return logoMap[symbol.toUpperCase()] ?? null;
// }

// function CompanyLogo({ symbol, name, logoUrl }) {
//   const [imgFailed, setImgFailed] = useState(false);
//   const initials =
//     (name || symbol || "?")
//       .replace(/[^A-Za-z]/g, "")
//       .slice(0, 2)
//       .toUpperCase() || "?";

//   const localSrc = resolveLocalLogo(symbol);
//   const primarySrc = localSrc || logoUrl || null;

//   if (primarySrc && !imgFailed) {
//     return (
//       <img
//         src={primarySrc}
//         alt={`${name || symbol} logo`}
//         className="stock-detail__logo-img"
//         onError={(e) => {
//           const img = e.currentTarget;
//           const triedFallback = img.dataset.triedFallback === "1";

//           if (
//             !triedFallback &&
//             localSrc &&
//             logoUrl &&
//             img.src.includes(localSrc)
//           ) {
//             img.dataset.triedFallback = "1";
//             img.src = logoUrl;
//             return;
//           }

//           setImgFailed(true);
//         }}
//       />
//     );
//   }

//   return (
//     <div className="stock-detail__logo-fallback" aria-hidden="true">
//       {initials}
//     </div>
//   );
// }

// const RATING_COLORS = {
//   "Strong Buy": "#02552E",
//   Buy: "#06AA5A",
//   Hold: "#898989",
//   Sell: "#FF0000",
//   "Strong Sell": "#B40000",
// };

// const SHAREHOLDING_COLORS = {
//   Promoter: "#1e3a8a",
//   FII: "#3b82f6",
//   MF: "#93c5fd",
//   Other: "#e5e7eb",
// };

// export default function StockDetailPanel() {
//   const { symbol } = useParams();
//   const dispatch = useDispatch();
//   const { openBuyWindow, openSellWindow } = useGeneralContext();

//   // NEW — branch point. Everything below either reads from the equity
//   // path (unchanged from before) or the index path (new), depending on
//   // this flag.
//   const isIndex = !!symbol && INDEX_SYMBOLS.has(symbol.toUpperCase());

//   // ── Equity quote (unchanged) — still called unconditionally per the
//   // rules of hooks even when isIndex is true; its result just isn't used
//   // for indices. See the note in my reply about confirming this hook
//   // doesn't hard-fail on an unrecognized/index symbol. ──
//   const { quote: stockQuote, status: quoteStatus } = useStockQuote(symbol);

//   // ── Index quote (NEW) — same selector IndexDetailModal.jsx already
//   // used. Poll it on mount so a direct link / refresh to /stock/NIFTY50
//   // populates data the same way TopIndexFunds.jsx's own strip does. ──
//   const indexData = useSelector((state) =>
//     selectIndexFundBySymbol(state, symbol),
//   );
//   useEffect(() => {
//     if (!isIndex) return undefined;
//     dispatch(fetchMarketIndexFunds());
//     const id = setInterval(() => dispatch(fetchMarketIndexFunds()), 10000);
//     return () => clearInterval(id);
//   }, [isIndex, dispatch]);

//   const stock = isIndex ? indexData : stockQuote;
//   const flashClass = usePriceFlash(stock?.ltp);

//   const profile = useSelector((state) => selectCompanyProfile(state, symbol));
//   const profileStatus = useSelector((state) =>
//     selectCompanyProfileStatus(state, symbol),
//   );

//   const holding = useSelector((state) =>
//     state.holdings.list.find((h) => h.symbol === symbol),
//   );

//   const activeList = useSelector(selectActiveList);
//   const isWatched = useSelector((state) =>
//     selectIsSymbolWatched(state, symbol),
//   );

//   useEffect(() => {
//     // UPDATED — skip the company-profile fetch entirely for indices;
//     // there's no company behind "NIFTY50" for fetchCompany to resolve.
//     if (!isIndex && symbol && profileStatus === "idle") {
//       dispatch(fetchCompany({ symbol }));
//     }
//   }, [symbol, profileStatus, dispatch, isIndex]);

//   if (!symbol) {
//     return <div className="stock-detail">No stock selected.</div>;
//   }

//   if (!stock) {
//     if (!isIndex && quoteStatus === "failed") {
//       return (
//         <div className="stock-detail stock-detail--message">
//           <p>
//             Couldn't load live data for {symbol} right now — market may be
//             closed, or the symbol isn't watched.
//           </p>
//         </div>
//       );
//     }
//     return (
//       <div className="stock-detail stock-detail--message">
//         <div className="stock-detail__spinner" />
//         <p>Loading {symbol}…</p>
//       </div>
//     );
//   }

//   const toggleWatch = () => {
//     if (!activeList) return;
//     dispatch(
//       isWatched
//         ? removeStockFromList({ listId: activeList.id, symbol })
//         : addStockToList({ listId: activeList.id, symbol }),
//     );
//   };

//   const isUp = (stock.dayChangePercent ?? 0) >= 0;

//   // UPDATED — an index reports its absolute day move as `netChange`
//   // (see TopIndexFunds.jsx / IndexDetailModal.jsx); a stock reports
//   // `dayChange`, falling back to ltp - prevClose. Same pill either way,
//   // just a different source field depending on which data shape `stock`
//   // actually is.
//   const dayChangeValue = isIndex
//     ? stock.netChange
//     : (stock.dayChange ??
//       (stock.ltp != null && stock.prevClose != null
//         ? stock.ltp - stock.prevClose
//         : null));

//   const dayLow = stock.low;
//   const dayHigh = stock.high;
//   const hasRange =
//     dayLow != null && dayHigh != null && dayHigh > dayLow && stock.ltp != null;
//   const rangePercent = hasRange
//     ? Math.min(
//         100,
//         Math.max(0, ((stock.ltp - dayLow) / (dayHigh - dayLow)) * 100),
//       )
//     : null;

//   // Every value below is company-profile-derived — `profile` is never
//   // fetched in the index branch above, so these all naturally stay
//   // null/empty for an index, which is what the `{recos && ...}` /
//   // `{shareholdingRows.length > 0 && ...}` etc. guards further down
//   // already need in order to skip those whole sections.
//   const marketCapCr = !isIndex
//     ? (profile?.stockDetailsReusableData?.marketCap ??
//       findMetric(profile, "priceandVolume", "marketcap"))
//     : null;
//   const peRatio = !isIndex
//     ? (profile?.stockDetailsReusableData
//         ?.pPerEBasicExcludingExtraordinaryItemsTTM ??
//       findMetric(
//         profile,
//         "valuation",
//         "pperebasicexcludingextraordinaryitemsttm",
//       ))
//     : null;
//   const sectorPE = !isIndex
//     ? profile?.stockDetailsReusableData?.sectorPriceToEarningsValueRatio
//     : null;
//   const dividendYield = !isIndex
//     ? (profile?.stockDetailsReusableData
//         ?.currentDividendYieldCommonStockPrimaryIssueLTM ??
//       findMetric(profile, "valuation", "currentdividendyield"))
//     : null;
//   const beta = !isIndex ? findMetric(profile, "priceandVolume", "beta") : null;
//   const bookValuePerShare = !isIndex
//     ? (findMetric(
//         profile,
//         "persharedata",
//         "bookvalue(tangible)persharemostrecentfiscalyear",
//       ) ??
//       findMetric(
//         profile,
//         "persharedata",
//         "bookvaluepersharemostrecentfiscalyear",
//       ))
//     : null;
//   const roe = !isIndex
//     ? findMetric(
//         profile,
//         "mgmtEffectiveness",
//         "returnonaverageequitymostrecentfiscalyear",
//       )
//     : null;
//   const debtToEquity = !isIndex
//     ? findMetric(
//         profile,
//         "financialstrength",
//         "totaldebtpertotalequitymostrecentfiscalyear",
//       )
//     : null;

//   const isin = !isIndex ? profile?.companyProfile?.isInId : null;
//   const about = !isIndex
//     ? profile?.about || profile?.companyProfile?.companyDescription
//     : null;
//   const officers = !isIndex
//     ? (profile?.companyProfile?.officers?.officer ?? [])
//         .slice()
//         .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
//         .slice(0, 4)
//     : [];

//   const shareholdingRows = !isIndex ? latestShareholding(profile) : [];
//   const risk = !isIndex ? profile?.riskMeter : null;
//   const recos = !isIndex ? profile?.recosBar : null;
//   const news = !isIndex ? (profile?.recentNews ?? []).slice(0, 4) : [];

//   return (
//     <div className="stock-detail">
//       <div className="stock-detail__header">
//         <div className="stock-detail__identity">
//           <CompanyLogo
//             symbol={symbol}
//             name={isIndex ? stock.name : profile?.name}
//             logoUrl={isIndex ? null : profile?.logoUrl}
//           />

//           <div>
//             <div className="stock-detail__title-row">
//               <h2>{isIndex ? stock.name || symbol : symbol}</h2>
//               {/* Watch toggle is equity-only — the watchlist resolves
//                  symbols against market.stocks, indices aren't part of
//                  that concept. */}
//               {!isIndex && (
//                 <button
//                   type="button"
//                   className={`stock-detail__watch-toggle ${isWatched ? "is-active" : ""}`}
//                   onClick={toggleWatch}
//                   aria-label={
//                     isWatched ? "Remove from watchlist" : "Add to watchlist"
//                   }
//                 >
//                   {isWatched ? "★" : "☆"}
//                 </button>
//               )}
//             </div>
//             {!isIndex && (
//               <p className="stock-detail__name">
//                 {profile?.name || stock.name || symbol}
//               </p>
//             )}
//             {isIndex ? (
//               <span className="stock-detail__industry-badge">Index</span>
//             ) : (
//               profile?.industry && (
//                 <span className="stock-detail__industry-badge">
//                   {profile.industry}
//                 </span>
//               )
//             )}
//           </div>
//         </div>

//         <div className="stock-detail__price">
//           <span className="stock-detail__live-tag">
//             <i className="stock-detail__live-dot" />
//             NSE · Live
//           </span>
//           <span className={`stock-detail__ltp ${flashClass}`}>
//             {formatCurrency(stock.ltp)}
//           </span>
//           <span
//             className={`stock-detail__change-pill ${isUp ? "is-up" : "is-down"}`}
//           >
//             <svg
//               className="stock-detail__change-arrow"
//               viewBox="0 0 12 12"
//               width="10"
//               height="10"
//               aria-hidden="true"
//             >
//               {isUp ? (
//                 <path d="M6 1.5 L10.5 8.5 L1.5 8.5 Z" fill="currentColor" />
//               ) : (
//                 <path d="M6 10.5 L1.5 3.5 L10.5 3.5 Z" fill="currentColor" />
//               )}
//             </svg>
//             {formatChange(dayChangeValue)}
//             <span className="stock-detail__change-pill-divider" />
//             {isUp ? "+" : ""}
//             {stock.dayChangePercent?.toFixed(2)}%
//           </span>
//         </div>

//         {hasRange && (
//           <div className="stock-detail__range-meter" aria-hidden="true">
//             <span className="stock-detail__range-edge">
//               {formatCurrency(dayLow)}
//             </span>
//             <div className="stock-detail__range-track">
//               <div
//                 className="stock-detail__range-fill"
//                 style={{ width: `${rangePercent}%` }}
//               />
//               <div
//                 className="stock-detail__range-dot"
//                 style={{ left: `${rangePercent}%` }}
//               />
//             </div>
//             <span className="stock-detail__range-edge">
//               {formatCurrency(dayHigh)}
//             </span>
//           </div>
//         )}
//       </div>

//       {/* Buy/Sell + holding banner — equity-only. An index can't be
//          bought, sold, or held directly. */}
//       {!isIndex && (
//         <div className="stock-detail__actions">
//           <button
//             className="stock-detail__btn stock-detail__btn--buy"
//             onClick={() => openBuyWindow(stock)}
//           >
//             Buy
//           </button>
//           <button
//             className="stock-detail__btn stock-detail__btn--sell"
//             onClick={() => openSellWindow(stock)}
//           >
//             Sell
//           </button>
//         </div>
//       )}

//       {!isIndex && holding && (
//         <div className="stock-detail__holding-row">
//           <span>
//             You hold <strong>{holding.qty}</strong> shares
//           </span>
//           <span>
//             Avg. <strong>{formatCurrency(holding.avgPrice)}</strong>
//           </span>
//         </div>
//       )}

//       <div className="stock-detail__chart-card">
//         <StockChart symbol={symbol} />
//       </div>

//       <h3 className="stock-detail__section-title">Today's Trading</h3>
//       <div className="stock-detail__stats-grid">
//         <div className="stock-detail__stat">
//           <span>Open</span>
//           <strong>{formatCurrency(stock.open)}</strong>
//         </div>
//         <div className="stock-detail__stat">
//           <span>Prev. Close</span>
//           <strong>{formatCurrency(stock.prevClose)}</strong>
//         </div>
//         <div className="stock-detail__stat">
//           <span>Day High</span>
//           <strong>{formatCurrency(stock.high)}</strong>
//         </div>
//         <div className="stock-detail__stat">
//           <span>Day Low</span>
//           <strong>{formatCurrency(stock.low)}</strong>
//         </div>
//         {/* Volume / 52W range / market cap are all equity-profile-
//            derived — an index quote (selectIndexFundBySymbol's shape)
//            doesn't carry them, so these tiles are skipped entirely for
//            an index rather than rendering as a row of "—". */}
//         {!isIndex && (
//           <>
//             <div className="stock-detail__stat">
//               <span>52W High</span>
//               <strong>{formatCurrency(profile?.high52w)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>52W Low</span>
//               <strong>{formatCurrency(profile?.low52w)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Volume</span>
//               <strong>{stock.volume?.toLocaleString("en-IN") ?? "—"}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Market Cap</span>
//               <strong>{formatMarketCapCr(marketCapCr)}</strong>
//             </div>
//           </>
//         )}
//       </div>

//       {/* Everything from here down — Fundamentals, Analyst
//          Recommendation, Shareholding, Risk meter, Management, About,
//          Recent News — is entirely company-profile-derived. None of it
//          exists for an index, so the whole block is equity-only. */}
//       {!isIndex && (
//         <>
//           <h3 className="stock-detail__section-title">Fundamentals</h3>
//           <div className="stock-detail__stats-grid">
//             <div className="stock-detail__stat">
//               <span>P/E Ratio (TTM)</span>
//               <strong>{formatNumber(peRatio)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Sector P/E</span>
//               <strong>{formatNumber(sectorPE)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Dividend Yield</span>
//               <strong>
//                 {dividendYield != null ? `${dividendYield}%` : "—"}
//               </strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Book Value/Share</span>
//               <strong>{formatCurrency(bookValuePerShare)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>ROE</span>
//               <strong>{roe != null ? `${roe}%` : "—"}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Debt/Equity</span>
//               <strong>{formatNumber(debtToEquity)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>Beta</span>
//               <strong>{formatNumber(beta)}</strong>
//             </div>
//             <div className="stock-detail__stat">
//               <span>ISIN</span>
//               <strong className="stock-detail__stat--small">
//                 {isin || "—"}
//               </strong>
//             </div>
//           </div>

//           {recos && (
//             <>
//               <h3 className="stock-detail__section-title">
//                 Analyst Recommendation
//               </h3>
//               <div className="stock-detail__reco-card">
//                 <div className="stock-detail__reco-summary">
//                   <span
//                     className="stock-detail__reco-badge"
//                     style={{
//                       background:
//                         RATING_COLORS[
//                           profile?.stockDetailsReusableData?.averageRating
//                         ] || "#374151",
//                     }}
//                   >
//                     {profile?.stockDetailsReusableData?.averageRating || "—"}
//                   </span>
//                   <span className="stock-detail__reco-count">
//                     {recos.noOfRecommendations} analysts
//                   </span>
//                 </div>
//                 <div className="stock-detail__reco-bars">
//                   {(recos.stockAnalyst ?? []).map((r) => (
//                     <div className="stock-detail__reco-row" key={r.ratingName}>
//                       <span className="stock-detail__reco-label">
//                         {r.ratingName}
//                       </span>
//                       <div className="stock-detail__reco-bar">
//                         <div
//                           className="stock-detail__reco-bar-fill"
//                           style={{
//                             width: `${(r.numberOfAnalysts / recos.noOfRecommendations) * 100}%`,
//                             background: r.colorCode || "#9ca3af",
//                           }}
//                         />
//                       </div>
//                       <span className="stock-detail__reco-value">
//                         {r.numberOfAnalysts}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </>
//           )}

//           {shareholdingRows.length > 0 && (
//             <>
//               <h3 className="stock-detail__section-title">
//                 Shareholding Pattern
//               </h3>
//               <div className="stock-detail__shareholding">
//                 <div className="stock-detail__shareholding-bar">
//                   {shareholdingRows.map((r) => (
//                     <div
//                       key={r.name}
//                       className="stock-detail__shareholding-segment"
//                       style={{
//                         width: `${r.percentage}%`,
//                         background: SHAREHOLDING_COLORS[r.name] || "#9ca3af",
//                       }}
//                       title={`${r.name}: ${r.percentage}%`}
//                     />
//                   ))}
//                 </div>
//                 <div className="stock-detail__shareholding-legend">
//                   {shareholdingRows.map((r) => (
//                     <span
//                       key={r.name}
//                       className="stock-detail__shareholding-legend-item"
//                     >
//                       <i
//                         style={{
//                           background: SHAREHOLDING_COLORS[r.name] || "#9ca3af",
//                         }}
//                       />
//                       {r.name} {r.percentage}%
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </>
//           )}

//           {risk && (
//             <div className="stock-detail__risk-badge">
//               Risk Level: <strong>{risk.categoryName}</strong>
//               <span className="stock-detail__risk-stddev">σ {risk.stdDev}</span>
//             </div>
//           )}

//           {officers.length > 0 && (
//             <>
//               <h3 className="stock-detail__section-title">Management</h3>
//               <div className="stock-detail__officers">
//                 {officers.map((o) => (
//                   <div className="stock-detail__officer" key={o.rank}>
//                     <span className="stock-detail__officer-name">
//                       {o.firstName} {o.mI ? `${o.mI} ` : ""}
//                       {o.lastName}
//                     </span>
//                     <span className="stock-detail__officer-title">
//                       {o.title?.Value}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//             </>
//           )}

//           {profileStatus === "loading" && !profile && (
//             <p className="stock-detail__about stock-detail__about--muted">
//               Loading company details…
//             </p>
//           )}

//           {profileStatus === "failed" && !profile && (
//             <p className="stock-detail__about stock-detail__about--muted">
//               Couldn't load company details for {symbol} right now.
//             </p>
//           )}

//           {about && (
//             <div className="stock-detail__about">
//               <h4>About {profile?.name || symbol}</h4>
//               <p>{about}</p>
//             </div>
//           )}

//           {news.length > 0 && (
//             <>
//               <h3 className="stock-detail__section-title">Recent News</h3>
//               <div className="stock-detail__news">
//                 {news.map((n) => {
//                   return (
//                     <a
//                       key={n.id}
//                       className="stock-detail__news-item"
//                       href={`https://www.livemint.com${n.url}`}
//                       target="_blank"
//                       rel="noreferrer"
//                     >
//                       {n.thumbnailImage ? (
//                         <img src={n.thumbnailImage} alt="" />
//                       ) : null}
//                       <div>
//                         <p className="stock-detail__news-headline">
//                           {n.headline}
//                         </p>
//                         <span className="stock-detail__news-date">
//                           {new Date(n.date).toLocaleDateString("en-IN", {
//                             day: "numeric",
//                             month: "short",
//                             year: "numeric",
//                           })}
//                         </span>
//                       </div>
//                     </a>
//                   );
//                 })}
//               </div>
//             </>
//           )}
//         </>
//       )}
//     </div>
//   );
// }
















































































// StockDetailPanel.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useGeneralContext } from "../Trade/GeneralContext";
import {
  fetchCompany,
  selectCompanyProfile,
  selectCompanyProfileStatus,
} from "../../redux/slices/companyProfileSlice";
import {
  addStockToList,
  removeStockFromList,
} from "../../redux/slices/watchlistSlice";
import {
  selectActiveList,
  selectIsSymbolWatched,
} from "../../redux/selectors/watchlistSelectors";
import {
  fetchMarketIndexFunds,
  selectIndexFundBySymbol,
} from "../../redux/slices/marketSlice";
import { usePriceFlash } from "../../hooks/usePriceFlash";
import { useStockQuote } from "../../hooks/useStockQuote";
import StockChart from "./StockChart";
import logoMap from "../../data/logoMap.json";
import "./StockDetailPanel.css";

// --- Constants ---

const INDEX_SYMBOLS = new Set([
  "NIFTY50",
  "SENSEX",
  "NIFTYBANK",
  "NIFTYIT",
  "NIFTYFMCG",
  "NIFTYAUTO",
  "NIFTYPHARMA",
  "NIFTYMETAL",
  "NIFTYENERGY",
  "NIFTYREALTY",
]);

const RATING_COLORS = {
  "Strong Buy": "#02552E",
  Buy: "#06AA5A",
  Hold: "#898989",
  Sell: "#FF0000",
  "Strong Sell": "#B40000",
};

const SHAREHOLDING_COLORS = {
  Promoter: "#1e3a8a",
  FII: "#3b82f6",
  MF: "#93c5fd",
  Other: "#e5e7eb",
};

// --- Utility Functions ---

function formatCurrency(n) {
  if (n == null || n === "") return "—";
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatNumber(n, suffix = "") {
  if (n == null || n === "") return "—";
  return `${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}${suffix}`;
}

function formatChange(n) {
  if (n == null) return "—";
  const num = Number(n);
  const sign = num > 0 ? "+" : num < 0 ? "−" : "";
  return `${sign}₹${Math.abs(num).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatMarketCapCr(crValue) {
  if (crValue == null || crValue === "") return "—";
  const cr = Number(crValue);
  if (cr >= 100000) return `₹${(cr / 100000).toFixed(2)} Lakh Cr`;
  return `₹${cr.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr`;
}

function findMetric(profile, category, keySubstring) {
  const list = profile?.keyMetrics?.[category];
  if (!Array.isArray(list)) return null;
  const target = keySubstring.toLowerCase().replace(/\s+/g, "");
  const entry = list.find((m) =>
    (m.key || "").toLowerCase().replace(/\s+/g, "").includes(target)
  );
  return entry?.value ?? null;
}

function latestShareholding(profile) {
  const rows = profile?.shareholding ?? [];
  return rows
    .map((cat) => {
      const latest = cat.categories?.[cat.categories.length - 1];
      return {
        name: cat.displayName,
        percentage: latest ? Number(latest.percentage) : null,
      };
    })
    .filter((r) => r.percentage != null);
}

function resolveLocalLogo(symbol) {
  if (!symbol) return null;
  return logoMap[symbol.toUpperCase()] ?? null;
}

// --- CompanyLogo Component ---

function CompanyLogo({ symbol, name, logoUrl }) {
  const [imgFailed, setImgFailed] = useState(false);
  const initials =
    (name || symbol || "?")
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 2)
      .toUpperCase() || "?";

  const localSrc = resolveLocalLogo(symbol);
  const primarySrc = localSrc || logoUrl || null;

  if (primarySrc && !imgFailed) {
    return (
      <img
        src={primarySrc}
        alt={`${name || symbol} logo`}
        className="stock-detail__logo-img"
        onError={(e) => {
          const img = e.currentTarget;
          const triedFallback = img.dataset.triedFallback === "1";

          if (
            !triedFallback &&
            localSrc &&
            logoUrl &&
            img.src.includes(localSrc)
          ) {
            img.dataset.triedFallback = "1";
            img.src = logoUrl;
            return;
          }

          setImgFailed(true);
        }}
      />
    );
  }

  return (
    <div className="stock-detail__logo-fallback" aria-hidden="true">
      {initials}
    </div>
  );
}

// --- Main Component ---

export default function StockDetailPanel() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openBuyWindow, openSellWindow } = useGeneralContext();

  const isIndex = !!symbol && INDEX_SYMBOLS.has(symbol.toUpperCase());

  const { quote: stockQuote, status: quoteStatus } = useStockQuote(symbol);
  const indexData = useSelector((state) =>
    selectIndexFundBySymbol(state, symbol)
  );

  useEffect(() => {
    if (!isIndex) return undefined;
    dispatch(fetchMarketIndexFunds());
    const id = setInterval(() => dispatch(fetchMarketIndexFunds()), 10000);
    return () => clearInterval(id);
  }, [isIndex, dispatch]);

  const stock = isIndex ? indexData : stockQuote;
  const flashClass = usePriceFlash(stock?.ltp);

  const profile = useSelector((state) => selectCompanyProfile(state, symbol));
  const profileStatus = useSelector((state) =>
    selectCompanyProfileStatus(state, symbol)
  );

  const holding = useSelector((state) =>
    state.holdings.list.find((h) => h.symbol === symbol)
  );

  const activeList = useSelector(selectActiveList);
  const isWatched = useSelector((state) =>
    selectIsSymbolWatched(state, symbol)
  );

  useEffect(() => {
    if (!isIndex && symbol && profileStatus === "idle") {
      dispatch(fetchCompany({ symbol }));
    }
  }, [symbol, profileStatus, dispatch, isIndex]);

  // --- Navigation Handler ---
  const handleGoBack = () => {
    navigate(-1);
  };

  // --- Loading / Error States ---
  if (!symbol) {
    return <div className="stock-detail">No stock selected.</div>;
  }

  if (!stock) {
    if (!isIndex && quoteStatus === "failed") {
      return (
        <div className="stock-detail stock-detail--message">
          <p>
            Couldn't load live data for {symbol} right now — market may be
            closed, or the symbol isn't watched.
          </p>
        </div>
      );
    }
    return (
      <div className="stock-detail stock-detail--message">
        <div className="stock-detail__spinner" />
        <p>Loading {symbol}…</p>
      </div>
    );
  }

  // --- Handlers ---
  const toggleWatch = () => {
    if (!activeList) return;
    dispatch(
      isWatched
        ? removeStockFromList({ listId: activeList.id, symbol })
        : addStockToList({ listId: activeList.id, symbol })
    );
  };

  // --- Derived Data ---
  const isUp = (stock.dayChangePercent ?? 0) >= 0;
  const dayChangeValue = isIndex
    ? stock.netChange
    : (stock.dayChange ??
      (stock.ltp != null && stock.prevClose != null
        ? stock.ltp - stock.prevClose
        : null));

  const dayLow = stock.low;
  const dayHigh = stock.high;
  const hasRange =
    dayLow != null && dayHigh != null && dayHigh > dayLow && stock.ltp != null;
  const rangePercent = hasRange
    ? Math.min(
        100,
        Math.max(0, ((stock.ltp - dayLow) / (dayHigh - dayLow)) * 100)
      )
    : null;

  // --- Profile-derived data for equities ---
  const marketCapCr = !isIndex
    ? (profile?.stockDetailsReusableData?.marketCap ??
      findMetric(profile, "priceandVolume", "marketcap"))
    : null;
  const peRatio = !isIndex
    ? (profile?.stockDetailsReusableData
        ?.pPerEBasicExcludingExtraordinaryItemsTTM ??
      findMetric(
        profile,
        "valuation",
        "pperebasicexcludingextraordinaryitemsttm"
      ))
    : null;
  const sectorPE = !isIndex
    ? profile?.stockDetailsReusableData?.sectorPriceToEarningsValueRatio
    : null;
  const dividendYield = !isIndex
    ? (profile?.stockDetailsReusableData
        ?.currentDividendYieldCommonStockPrimaryIssueLTM ??
      findMetric(profile, "valuation", "currentdividendyield"))
    : null;
  const beta = !isIndex ? findMetric(profile, "priceandVolume", "beta") : null;
  const bookValuePerShare = !isIndex
    ? (findMetric(
        profile,
        "persharedata",
        "bookvalue(tangible)persharemostrecentfiscalyear"
      ) ??
      findMetric(
        profile,
        "persharedata",
        "bookvaluepersharemostrecentfiscalyear"
      ))
    : null;
  const roe = !isIndex
    ? findMetric(
        profile,
        "mgmtEffectiveness",
        "returnonaverageequitymostrecentfiscalyear"
      )
    : null;
  const debtToEquity = !isIndex
    ? findMetric(
        profile,
        "financialstrength",
        "totaldebtpertotalequitymostrecentfiscalyear"
      )
    : null;

  const isin = !isIndex ? profile?.companyProfile?.isInId : null;
  const about = !isIndex
    ? profile?.about || profile?.companyProfile?.companyDescription
    : null;
  const officers = !isIndex
    ? (profile?.companyProfile?.officers?.officer ?? [])
        .slice()
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
        .slice(0, 4)
    : [];

  const shareholdingRows = !isIndex ? latestShareholding(profile) : [];
  const risk = !isIndex ? profile?.riskMeter : null;
  const recos = !isIndex ? profile?.recosBar : null;
  const news = !isIndex ? (profile?.recentNews ?? []).slice(0, 4) : [];

  // --- Render ---
  return (
    <div className="stock-detail">
      {/* --- Header --- */}
      <div className="stock-detail__header">
        <div className="stock-detail__identity">
          {/* Back Button */}
          <button
            className="stock-detail__back-btn"
            onClick={handleGoBack}
            aria-label="Go back"
            title="Go back"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <CompanyLogo
            symbol={symbol}
            name={isIndex ? stock.name : profile?.name}
            logoUrl={isIndex ? null : profile?.logoUrl}
          />

          <div>
            <div className="stock-detail__title-row">
              <h2>{isIndex ? stock.name || symbol : symbol}</h2>
              {!isIndex && (
                <button
                  type="button"
                  className={`stock-detail__watch-toggle ${isWatched ? "is-active" : ""}`}
                  onClick={toggleWatch}
                  aria-label={
                    isWatched ? "Remove from watchlist" : "Add to watchlist"
                  }
                >
                  {isWatched ? "★" : "☆"}
                </button>
              )}
            </div>
            {!isIndex && (
              <p className="stock-detail__name">
                {profile?.name || stock.name || symbol}
              </p>
            )}
            {isIndex ? (
              <span className="stock-detail__industry-badge">Index</span>
            ) : (
              profile?.industry && (
                <span className="stock-detail__industry-badge">
                  {profile.industry}
                </span>
              )
            )}
          </div>
        </div>

        <div className="stock-detail__price">
          <span className="stock-detail__live-tag">
            <i className="stock-detail__live-dot" />
            NSE · Live
          </span>
          <span className={`stock-detail__ltp ${flashClass}`}>
            {formatCurrency(stock.ltp)}
          </span>
          <span
            className={`stock-detail__change-pill ${isUp ? "is-up" : "is-down"}`}
          >
            <svg
              className="stock-detail__change-arrow"
              viewBox="0 0 12 12"
              width="10"
              height="10"
              aria-hidden="true"
            >
              {isUp ? (
                <path d="M6 1.5 L10.5 8.5 L1.5 8.5 Z" fill="currentColor" />
              ) : (
                <path d="M6 10.5 L1.5 3.5 L10.5 3.5 Z" fill="currentColor" />
              )}
            </svg>
            {formatChange(dayChangeValue)}
            <span className="stock-detail__change-pill-divider" />
            {isUp ? "+" : ""}
            {stock.dayChangePercent?.toFixed(2)}%
          </span>
        </div>

        {hasRange && (
          <div className="stock-detail__range-meter" aria-hidden="true">
            <span className="stock-detail__range-edge">
              {formatCurrency(dayLow)}
            </span>
            <div className="stock-detail__range-track">
              <div
                className="stock-detail__range-fill"
                style={{ width: `${rangePercent}%` }}
              />
              <div
                className="stock-detail__range-dot"
                style={{ left: `${rangePercent}%` }}
              />
            </div>
            <span className="stock-detail__range-edge">
              {formatCurrency(dayHigh)}
            </span>
          </div>
        )}
      </div>

      {/* --- Buy/Sell Actions --- */}
      {!isIndex && (
        <div className="stock-detail__actions">
          <button
            className="stock-detail__btn stock-detail__btn--buy"
            onClick={() => openBuyWindow(stock)}
          >
            Buy
          </button>
          <button
            className="stock-detail__btn stock-detail__btn--sell"
            onClick={() => openSellWindow(stock)}
          >
            Sell
          </button>
        </div>
      )}

      {/* --- Holding Banner --- */}
      {!isIndex && holding && (
        <div className="stock-detail__holding-row">
          <span>
            You hold <strong>{holding.qty}</strong> shares
          </span>
          <span>
            Avg. <strong>{formatCurrency(holding.avgPrice)}</strong>
          </span>
        </div>
      )}

      {/* --- Chart Card --- */}
      <div className="stock-detail__chart-card">
        <StockChart symbol={symbol} />
      </div>

      {/* --- Today's Trading Stats --- */}
      <h3 className="stock-detail__section-title">Today's Trading</h3>
      <div className="stock-detail__stats-grid">
        <div className="stock-detail__stat">
          <span>Open</span>
          <strong>{formatCurrency(stock.open)}</strong>
        </div>
        <div className="stock-detail__stat">
          <span>Prev. Close</span>
          <strong>{formatCurrency(stock.prevClose)}</strong>
        </div>
        <div className="stock-detail__stat">
          <span>Day High</span>
          <strong>{formatCurrency(stock.high)}</strong>
        </div>
        <div className="stock-detail__stat">
          <span>Day Low</span>
          <strong>{formatCurrency(stock.low)}</strong>
        </div>
        {!isIndex && (
          <>
            <div className="stock-detail__stat">
              <span>52W High</span>
              <strong>{formatCurrency(profile?.high52w)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>52W Low</span>
              <strong>{formatCurrency(profile?.low52w)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Volume</span>
              <strong>{stock.volume?.toLocaleString("en-IN") ?? "—"}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Market Cap</span>
              <strong>{formatMarketCapCr(marketCapCr)}</strong>
            </div>
          </>
        )}
      </div>

      {/* --- Equity-only details --- */}
      {!isIndex && (
        <>
          <h3 className="stock-detail__section-title">Fundamentals</h3>
          <div className="stock-detail__stats-grid">
            <div className="stock-detail__stat">
              <span>P/E Ratio (TTM)</span>
              <strong>{formatNumber(peRatio)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Sector P/E</span>
              <strong>{formatNumber(sectorPE)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Dividend Yield</span>
              <strong>
                {dividendYield != null ? `${dividendYield}%` : "—"}
              </strong>
            </div>
            <div className="stock-detail__stat">
              <span>Book Value/Share</span>
              <strong>{formatCurrency(bookValuePerShare)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>ROE</span>
              <strong>{roe != null ? `${roe}%` : "—"}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Debt/Equity</span>
              <strong>{formatNumber(debtToEquity)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>Beta</span>
              <strong>{formatNumber(beta)}</strong>
            </div>
            <div className="stock-detail__stat">
              <span>ISIN</span>
              <strong className="stock-detail__stat--small">
                {isin || "—"}
              </strong>
            </div>
          </div>

          {/* Analyst Recommendation */}
          {recos && (
            <>
              <h3 className="stock-detail__section-title">
                Analyst Recommendation
              </h3>
              <div className="stock-detail__reco-card">
                <div className="stock-detail__reco-summary">
                  <span
                    className="stock-detail__reco-badge"
                    style={{
                      background:
                        RATING_COLORS[
                          profile?.stockDetailsReusableData?.averageRating
                        ] || "#374151",
                    }}
                  >
                    {profile?.stockDetailsReusableData?.averageRating || "—"}
                  </span>
                  <span className="stock-detail__reco-count">
                    {recos.noOfRecommendations} analysts
                  </span>
                </div>
                <div className="stock-detail__reco-bars">
                  {(recos.stockAnalyst ?? []).map((r) => (
                    <div className="stock-detail__reco-row" key={r.ratingName}>
                      <span className="stock-detail__reco-label">
                        {r.ratingName}
                      </span>
                      <div className="stock-detail__reco-bar">
                        <div
                          className="stock-detail__reco-bar-fill"
                          style={{
                            width: `${(r.numberOfAnalysts / recos.noOfRecommendations) * 100}%`,
                            background: r.colorCode || "#9ca3af",
                          }}
                        />
                      </div>
                      <span className="stock-detail__reco-value">
                        {r.numberOfAnalysts}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Shareholding Pattern */}
          {shareholdingRows.length > 0 && (
            <>
              <h3 className="stock-detail__section-title">
                Shareholding Pattern
              </h3>
              <div className="stock-detail__shareholding">
                <div className="stock-detail__shareholding-bar">
                  {shareholdingRows.map((r) => (
                    <div
                      key={r.name}
                      className="stock-detail__shareholding-segment"
                      style={{
                        width: `${r.percentage}%`,
                        background: SHAREHOLDING_COLORS[r.name] || "#9ca3af",
                      }}
                      title={`${r.name}: ${r.percentage}%`}
                    />
                  ))}
                </div>
                <div className="stock-detail__shareholding-legend">
                  {shareholdingRows.map((r) => (
                    <span
                      key={r.name}
                      className="stock-detail__shareholding-legend-item"
                    >
                      <i
                        style={{
                          background: SHAREHOLDING_COLORS[r.name] || "#9ca3af",
                        }}
                      />
                      {r.name} {r.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Risk Meter */}
          {risk && (
            <div className="stock-detail__risk-badge">
              Risk Level: <strong>{risk.categoryName}</strong>
              <span className="stock-detail__risk-stddev">σ {risk.stdDev}</span>
            </div>
          )}

          {/* Management */}
          {officers.length > 0 && (
            <>
              <h3 className="stock-detail__section-title">Management</h3>
              <div className="stock-detail__officers">
                {officers.map((o) => (
                  <div className="stock-detail__officer" key={o.rank}>
                    <span className="stock-detail__officer-name">
                      {o.firstName} {o.mI ? `${o.mI} ` : ""}
                      {o.lastName}
                    </span>
                    <span className="stock-detail__officer-title">
                      {o.title?.Value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Loading / Error / About */}
          {profileStatus === "loading" && !profile && (
            <p className="stock-detail__about stock-detail__about--muted">
              Loading company details…
            </p>
          )}
          {profileStatus === "failed" && !profile && (
            <p className="stock-detail__about stock-detail__about--muted">
              Couldn't load company details for {symbol} right now.
            </p>
          )}
          {about && (
            <div className="stock-detail__about">
              <h4>About {profile?.name || symbol}</h4>
              <p>{about}</p>
            </div>
          )}

          {/* Recent News */}
          {news.length > 0 && (
            <>
              <h3 className="stock-detail__section-title">Recent News</h3>
              <div className="stock-detail__news">
                {news.map((n) => {
                  return (
                    <a
                      key={n.id}
                      className="stock-detail__news-item"
                      href={`https://www.livemint.com${n.url}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {n.thumbnailImage ? (
                        <img src={n.thumbnailImage} alt="" />
                      ) : null}
                      <div>
                        <p className="stock-detail__news-headline">
                          {n.headline}
                        </p>
                        <span className="stock-detail__news-date">
                          {new Date(n.date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}