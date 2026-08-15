import { useEffect, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import GreetingBanner from "./GreetingBanner";
import HoldingsSummaryBar from "./HoldingsSummaryBar";
import HoldingsTable from "./HoldingsTable";
import TopIndexFunds from "./TopIndexFunds";
import GainersLosers from "./GainersLosers";

import TradeAnalyticsCards from "./TradeAnalyticsCards";
import Button from "../../common/Button/Button";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconGrowth from "../../../assets/icons/icon-growth.png";
import { getEmptyStateQuote } from "../../../data/quotes";
import { fetchOrders } from "../../../redux/slices/ordersSlice";
import { fetchHoldings } from "../../../redux/slices/holdingsSlice";
import TradingAnalyticsSection from "./TradingAnalyticsSection";
import MarketHighlights from "./MarketHighlights";
import SectorStocks from "./SectorStocks";
import "./Summary.css";
import "./SummaryCharts.css";
import "../../../styles/icons.css";

// FIXED — this component already dispatched fetchOrders() on mount, but
// never dispatched fetchHoldings() despite reading state.holdings.list
// directly for every total on this page (invested, current value, day
// P&L, overall P&L). Before this fix, holdings.list was only ever warm
// here because Holdings.jsx (a sibling route, not always mounted) or a
// same-session trade had already populated it via ordersSlice's
// placeOrder thunk. On a hard refresh while sitting on the Summary route
// itself, holdings.list was [], so every total silently rendered as ₹0
// instead of erroring — same root cause as the Holdings.jsx/Positions.jsx/
// Orders.jsx bug, just with a more misleading symptom (wrong numbers
// instead of an empty state).
//
// fetchHoldings() has a `condition` guard (see holdingsSlice.js) that
// skips the request if one is already in flight, so dispatching it here
// AND in Holdings.jsx when both happen to mount doesn't double-fetch.
export default function Summary() {
  const dispatch = useDispatch();
  const holdings = useSelector((state) => state.holdings.list);
  const holdingsStatus = useSelector((state) => state.holdings.status);
  const liveStocks = useSelector((state) => state.market.stocks);
  const gainersLosersRef = useRef(null);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchHoldings());
  }, [dispatch]);

  const hasHoldings = holdings.length > 0;
  const holdingsLoading =
    holdingsStatus === "loading" || holdingsStatus === "idle";

  const liveStocksBySymbol = useMemo(() => {
    return Array.isArray(liveStocks)
      ? Object.fromEntries(liveStocks.map((s) => [s.symbol, s]))
      : liveStocks || {};
  }, [liveStocks]);

  const totals = useMemo(() => {
    return holdings.reduce(
      (acc, h) => {
        const live = liveStocksBySymbol[h.symbol];
        const ltp = live?.ltp ?? h.ltp;
        const dayChangePercent =
          live?.dayChangePercent ?? h.dayChangePercent ?? 0;

        const currentValue = ltp * h.qty;
        const investedValue = h.avgPrice * h.qty;
        const dayPnL = ltp * h.qty * (dayChangePercent / 100);

        acc.invested += investedValue;
        acc.current += currentValue;
        acc.dayPnL += dayPnL;
        return acc;
      },
      { invested: 0, current: 0, dayPnL: 0 },
    );
  }, [holdings, liveStocksBySymbol]);

  const overallPnL = totals.current - totals.invested;
  const overallPct =
    totals.invested > 0 ? (overallPnL / totals.invested) * 100 : 0;

  const previousValue = totals.current - totals.dayPnL;
  const dayPct = previousValue > 0 ? (totals.dayPnL / previousValue) * 100 : 0;

  const emptyQuote = getEmptyStateQuote();

  const scrollToMarket = () => {
    gainersLosersRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="summary">
      <GreetingBanner
        hasHoldings={hasHoldings}
        portfolioValue={totals.current}
        dayPnL={totals.dayPnL}
        dayPct={dayPct}
      />

      {holdingsLoading ? (
        <div className="summary-cards">
          <div className="stat-card stat-card--empty">
            <p>Loading your portfolio…</p>
          </div>
        </div>
      ) : hasHoldings ? (
        <>
          <HoldingsSummaryBar
            invested={totals.invested}
            current={totals.current}
            overallPnL={overallPnL}
            overallPct={overallPct}
            dayPnL={totals.dayPnL}
            dayPct={dayPct}
          />

          <HoldingsTable holdings={holdings} />
        </>
      ) : (
        <div className="summary-cards">
          <div className="stat-card stat-card--empty">
            {emptyQuote?.text && <p>{emptyQuote.text}</p>}
            <Button variant="primary" onClick={scrollToMarket}>
              Start Investing
            </Button>
          </div>
        </div>
      )}

      {/* Trade performance — win rate, holding period, best/worst trade */}
      <div className="summary__section">
        <div className="section-heading">
          <PageIcon src={iconGrowth} tone="growth" size="sm" />
          <div className="section-heading__text">
            <span className="section-heading__title">Trade Performance</span>
            <span className="section-heading__subtitle">
              How your closed trades have actually done
            </span>
          </div>
        </div>
        <TradeAnalyticsCards />
      </div>

      {/* Most-traded symbols + stock drill-down + P&L calendar */}
      <div className="summary__section">
        <div className="section-heading">
          <PageIcon src={iconGrowth} tone="growth" size="sm" />
          <div className="section-heading__text">
            <span className="section-heading__title">Trading Analytics</span>
            <span className="section-heading__subtitle">
              Your most-traded stocks and daily realized P&amp;L
            </span>
          </div>
        </div>
        <TradingAnalyticsSection />
      </div>

      {/* NEW — Top Index Funds strip. Deliberately placed here, right
         before GainersLosers, per request: "it comes before market
         gainer and losers". Has its own useEffect polling loop (see
         TopIndexFunds.jsx), independent of the ref below — the ref stays
         attached only to the GainersLosers wrapper since that's what
         the empty-state "Start Investing" button scrolls to. */}
      <TopIndexFunds />

      <div ref={gainersLosersRef}>
        <GainersLosers />
      </div>

      <MarketHighlights />

      <SectorStocks />
    </div>
  );
}
