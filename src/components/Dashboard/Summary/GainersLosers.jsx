

import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectGainers,
  selectLosers,
  selectMarketStats,
  setVisibleCount,
} from "../../../redux/slices/marketSlice";
import { usePriceFlash } from "../../../hooks/usePriceFlash";
import StockLogo from "../../common/StockLogo";
import { formatCurrency, formatPercent } from "../../../utils/formatCurrency";
import { VISIBLE_COUNT_OPTIONS } from "../../../utils/constants";
import "./GainersLosers.css";
import "../../../styles/variables.css";
import "../../../styles/global.css";
import "../../../styles/SectionHeadingsTheme.css";

function StockCard({ stock, onClick, index }) {
  const isUp = stock.dayChangePercent >= 0;
  const flashClass = usePriceFlash(stock.ltp);

  return (
    <li className="stock-card">
      <button
        className="stock-card__button"
        onClick={() => onClick(stock.symbol)}
        aria-label={`${stock.symbol} - ${stock.name}`}
      >
        <div className="stock-card__rank">{index + 1}</div>
        <div className="stock-card__identity">
          <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={32} />
          <div className="stock-card__identity-text">
            <span className="stock-card__symbol">{stock.symbol}</span>
            <span className="stock-card__name">{stock.name}</span>
          </div>
        </div>
        <div className={`stock-card__figures ${flashClass}`}>
          <span className="stock-card__price">{formatCurrency(stock.ltp)}</span>
          <span className={`stock-card__change ${isUp ? "is-up" : "is-down"}`}>
            {formatPercent(stock.dayChangePercent)}
          </span>
        </div>
      </button>
    </li>
  );
}

function MoversPanel({ title, tone, stocks, emptyLabel, onClick, totalCount }) {
  return (
    <div className="movers__panel">
      <div className="movers__panel-header">
        <div className="movers__panel-title">
          <h4 className={`movers__title movers__title--${tone}`}>{title}</h4>
          <span className="movers__panel-count">
            {stocks.length} / {totalCount}
          </span>
        </div>
      </div>
      {stocks.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state__icon">📊</span>
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <ul className="movers__list" role="list">
          {stocks.map((s, index) => (
            <StockCard
              key={s.symbol}
              stock={s}
              onClick={onClick}
              index={index}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GainersLosers() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const visibleCount = useSelector((state) => state.market.visibleCount);
  const gainers = useSelector((state) => selectGainers(state, visibleCount));
  const losers = useSelector((state) => selectLosers(state, visibleCount));
  const marketStats = useSelector(selectMarketStats);

  const goToStock = (symbol) => navigate(`/stock/${symbol}`);

  return (
    <div className="movers-section">
      <div className="movers-section__header">
        <div className="movers-section__title-group">
          <h3 className="movers-section__title">Market Movers</h3>
          <div className="movers-section__stats">
            <span className="movers-section__stat movers-section__stat--gainers">
              ▲ {marketStats.gainers}
            </span>
            <span className="movers-section__stat movers-section__stat--losers">
              ▼ {marketStats.losers}
            </span>
            <span className="movers-section__stat movers-section__stat--total">
              {marketStats.total} stocks
            </span>
          </div>
        </div>
        <div className="movers__filter-group">
          <label htmlFor="stock-count-select" className="movers__label">
            Show:
          </label>
          <select
            id="stock-count-select"
            className="movers__count-select"
            value={visibleCount}
            onChange={(e) => dispatch(setVisibleCount(Number(e.target.value)))}
          >
            {VISIBLE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                Top {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* UPDATED — removed the "movers--stacked" modifier so this falls
         through to the base ".movers" rule in GainersLosers.css, which is
         already a 2-column grid (Gainers left, Losers right) on desktop
         and collapses to 1 column under 1024px via the existing
         @media rule. No CSS changes were needed. */}
      <div className="movers">
        <MoversPanel
          title="Top Gainers"
          tone="gainers"
          stocks={gainers}
          totalCount={marketStats.gainers}
          emptyLabel="No gainers at the moment"
          onClick={goToStock}
        />
        <MoversPanel
          title="Top Losers"
          tone="losers"
          stocks={losers}
          totalCount={marketStats.losers}
          emptyLabel="No losers at the moment"
          onClick={goToStock}
        />
      </div>
    </div>
  );
}