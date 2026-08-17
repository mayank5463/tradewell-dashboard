// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { selectTradeStats } from "../../../redux/selectors/tradeAnalyticsSelectors";
// import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
// import "./TradeAnalyticsCards.css";
// import "../../../styles/variables.css";
// import "../../../styles/global.css";

// function formatHoldingPeriod(days) {
//   if (days < 1) return `${Math.round(days * 24)}h`;
//   return `${days.toFixed(1)}d`;
// }

// export default function TradeAnalyticsCards() {
//   const navigate = useNavigate();
//   const stats = useSelector(selectTradeStats);

//   if (stats.totalClosedTrades === 0) {
//     return (
//       <div className="trade-stats trade-stats--empty">
//         No closed trades yet — win rate and holding-period stats show up here once you've bought
//         and sold something.
//       </div>
//     );
//   }

//   const isWinRateGood = stats.winRate >= 50;

//   return (
//     <div className="trade-stats">
//       <div className="trade-stat-card">
//         <div className="trade-stat-card__label">Win Rate</div>
//         <div className={`trade-stat-card__value ${isWinRateGood ? "is-up" : "is-down"}`}>
//           {formatPercent(stats.winRate)}
//         </div>
//         <div className="trade-stat-card__sub">
//           {stats.wins}W / {stats.losses}L
//         </div>
//       </div>

//       <div className="trade-stat-card">
//         <div className="trade-stat-card__label">Closed Trades</div>
//         <div className="trade-stat-card__value">{stats.totalClosedTrades}</div>
//         <div className="trade-stat-card__sub">round trips</div>
//       </div>

//       <div className="trade-stat-card">
//         <div className="trade-stat-card__label">Avg. Holding Period</div>
//         <div className="trade-stat-card__value">{formatHoldingPeriod(stats.avgHoldingDays)}</div>
//         <div className="trade-stat-card__sub">per closed trade</div>
//       </div>

//       {stats.bestTrade && (
//         <div
//           className="trade-stat-card trade-stat-card--clickable"
//           onClick={() => navigate(`/stock/${stats.bestTrade.symbol}`)}
//         >
//           <div className="trade-stat-card__label">Best Trade</div>
//           <div className="trade-stat-card__value is-up">{formatCurrency(stats.bestTrade.pnl)}</div>
//           <div className="trade-stat-card__sub">
//             {stats.bestTrade.symbol} · {formatPercent(stats.bestTrade.pnlPercent)}
//           </div>
//         </div>
//       )}

//       {stats.worstTrade && (
//         <div
//           className="trade-stat-card trade-stat-card--clickable"
//           onClick={() => navigate(`/stock/${stats.worstTrade.symbol}`)}
//         >
//           <div className="trade-stat-card__label">Worst Trade</div>
//           <div className="trade-stat-card__value is-down">
//             {formatCurrency(stats.worstTrade.pnl)}
//           </div>
//           <div className="trade-stat-card__sub">
//             {stats.worstTrade.symbol} · {formatPercent(stats.worstTrade.pnlPercent)}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

















// TradeAnalyticsCards.jsx
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectTradeStats } from "../../../redux/selectors/tradeAnalyticsSelectors";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import "./TradeAnalyticsCards.css";
import "../../../styles/variables.css";
import "../../../styles/global.css";
import "../../../styles/SectionHeadingsTheme.css";

function formatHoldingPeriod(days) {
  if (days < 1) return `${Math.round(days * 24)}h`;
  return `${days.toFixed(1)}d`;
}

export default function TradeAnalyticsCards() {
  const navigate = useNavigate();
  const stats = useSelector(selectTradeStats);

  if (stats.totalClosedTrades === 0) {
    return (
      <div className="trade-stats trade-stats--empty">
        No closed trades yet — win rate and holding-period stats show up here once you've bought
        and sold something.
      </div>
    );
  }

  const isWinRateGood = stats.winRate >= 50;

  return (
    <div className="trade-stats">
      <div className="trade-stat-card">
        <div className="trade-stat-card__label">Win Rate</div>
        <div className={`trade-stat-card__value ${isWinRateGood ? "is-up" : "is-down"}`}>
          {formatPercent(stats.winRate)}
        </div>
        <div className="trade-stat-card__sub">
          {stats.wins}W / {stats.losses}L
        </div>
      </div>

      <div className="trade-stat-card">
        <div className="trade-stat-card__label">Closed Trades</div>
        <div className="trade-stat-card__value">{stats.totalClosedTrades}</div>
        <div className="trade-stat-card__sub">round trips</div>
      </div>

      <div className="trade-stat-card">
        <div className="trade-stat-card__label">Avg. Holding Period</div>
        <div className="trade-stat-card__value">{formatHoldingPeriod(stats.avgHoldingDays)}</div>
        <div className="trade-stat-card__sub">per closed trade</div>
      </div>

      {stats.bestTrade && (
        <div
          className="trade-stat-card trade-stat-card--clickable"
          onClick={() => navigate(`/stock/${stats.bestTrade.symbol}`)}
        >
          <div className="trade-stat-card__label">Best Trade</div>
          <div className="trade-stat-card__value is-up">{formatCurrency(stats.bestTrade.pnl)}</div>
          <div className="trade-stat-card__sub">
            {stats.bestTrade.symbol} · {formatPercent(stats.bestTrade.pnlPercent)}
          </div>
        </div>
      )}

      {stats.worstTrade && (
        <div
          className="trade-stat-card trade-stat-card--clickable"
          onClick={() => navigate(`/stock/${stats.worstTrade.symbol}`)}
        >
          <div className="trade-stat-card__label">Worst Trade</div>
          <div className="trade-stat-card__value is-down">
            {formatCurrency(stats.worstTrade.pnl)}
          </div>
          <div className="trade-stat-card__sub">
            {stats.worstTrade.symbol} · {formatPercent(stats.worstTrade.pnlPercent)}
          </div>
        </div>
      )}
    </div>
  );
}














































