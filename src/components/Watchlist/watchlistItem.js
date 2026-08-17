import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { removeStockFromList } from "../../redux/slices/watchlistSlice";
import { useGeneralContext } from "../Trade/GeneralContext";
import { usePriceFlash } from "../../hooks/usePriceFlash";
import StockLogo from "../common/StockLogo";
import { formatCurrency, formatPercent } from "../../utils/formatCurrency";
import TrashIcon from "../common/icons/TrashIcon";
import "./watchlistItem.css";
import "../../styles/variables.css";
import "../../styles/global.css";

function getDayChange(stock) {
  if (stock.netChange != null) return stock.netChange;
  if (!stock.ltp || !stock.dayChangePercent) return 0;
  const prevClose = stock.ltp / (1 + stock.dayChangePercent / 100);
  return stock.ltp - prevClose;
}

export default function WatchlistItem({ stock, listId }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openBuyWindow, openSellWindow } = useGeneralContext();

  const flashClass = usePriceFlash(stock?.ltp);

  if (!stock) return null;

  const isUp = stock.dayChangePercent >= 0;
  const dayChange = getDayChange(stock);
  const directionClass = isUp ? "is-up" : "is-down";

  const openDetail = () => navigate(`/stock/${stock.symbol}`);

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch(removeStockFromList({ listId, symbol: stock.symbol }));
  };

  const handleBuy = (e) => {
    e.stopPropagation();
    openBuyWindow(stock);
  };

  const handleSell = (e) => {
    e.stopPropagation();
    openSellWindow(stock);
  };

  return (
    <div className={`watchlist-item ${directionClass}`}>
      <button
        className="watchlist-item__main"
        onClick={openDetail}
        type="button"
      >
        <span className="watchlist-item__left">
          <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={34} />
          <span className="watchlist-item__symbol-block">
            <span className="watchlist-item__symbol">{stock.symbol}</span>
            {stock.name && (
              <span className="watchlist-item__name">{stock.name}</span>
            )}
          </span>
        </span>

        <span className={`watchlist-item__right ${flashClass ?? ""}`}>
          <span className="watchlist-item__price">
            {formatCurrency(stock.ltp)}
          </span>
          <span className={`watchlist-item__change ${directionClass}`}>
            {isUp ? "▲" : "▼"} {formatPercent(stock.dayChangePercent)}
          </span>
          <span className={`watchlist-item__day-change ${directionClass}`}>
            {isUp ? "+" : "-"}
            {formatCurrency(Math.abs(dayChange))}
          </span>
        </span>
      </button>

      <div className="watchlist-item__quick-actions">
        <div className="watchlist-item__trade-actions">
          <button
            className="watchlist-item__trade-btn watchlist-item__trade-btn--buy"
            title={`Buy ${stock.symbol}`}
            onClick={handleBuy}
            type="button"
            aria-label={`Buy ${stock.symbol}`}
          >
            Buy
          </button>
          <button
            className="watchlist-item__trade-btn watchlist-item__trade-btn--sell"
            title={`Sell ${stock.symbol}`}
            onClick={handleSell}
            type="button"
            aria-label={`Sell ${stock.symbol}`}
          >
            Sell
          </button>
        </div>

        <div className="watchlist-item__icon-actions">
          <button
            className="watchlist-item__icon-btn"
            title={`Analytics for ${stock.symbol}`}
            onClick={openDetail}
            type="button"
            aria-label={`View analytics for ${stock.symbol}`}
          >
            📈
          </button>
          <button
            className="watchlist-item__icon-btn watchlist-item__icon-btn--delete"
            title={`Remove ${stock.symbol} from list`}
            onClick={handleRemove}
            type="button"
            aria-label={`Remove ${stock.symbol} from watchlist`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
}