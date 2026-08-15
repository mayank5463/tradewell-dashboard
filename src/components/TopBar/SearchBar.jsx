import { useState, useMemo, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { setSearchQuery } from "../../redux/slices/uiSlice";
import StockLogo from "../common/StockLogo";
import { formatCurrency, formatPercent } from "../../utils/formatCurrency";
import "./SearchBar.css";

export default function SearchBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const stocks = useSelector((state) => state.market.stocks);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return stocks
      .filter((s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, stocks]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const goToStock = (symbol) => {
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
    dispatch(setSearchQuery(""));
    navigate(`/stock/${symbol}`);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    dispatch(setSearchQuery(value));
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const clearQuery = () => {
    setQuery("");
    dispatch(setSearchQuery(""));
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[highlightedIndex] ?? results[0];
      if (pick) goToStock(pick.symbol);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="search-bar" ref={containerRef}>
      <div className="search-bar__field">
        <SearchIcon className="search-bar__icon" fontSize="small" aria-hidden="true" />

        <input
          type="text"
          className="search-bar__input"
          placeholder="Search stocks, e.g. RELIANCE"
          value={query}
          onChange={handleChange}
          onFocus={() => query && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Search stocks"
          aria-expanded={isOpen}
          role="combobox"
          aria-controls="search-bar-listbox"
        />

        {query && (
          <IconButton
            size="small"
            className="search-bar__clear"
            aria-label="Clear search"
            onClick={clearQuery}
          >
            <ClearIcon fontSize="inherit" />
          </IconButton>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="search-bar__dropdown" role="listbox" id="search-bar-listbox">
          {results.map((stock, i) => {
            const isUp = stock.dayChangePercent >= 0;
            return (
              <li
                key={stock.symbol}
                role="option"
                aria-selected={i === highlightedIndex}
                className={`search-bar__row ${i === highlightedIndex ? "is-highlighted" : ""}`}
                onMouseEnter={() => setHighlightedIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToStock(stock.symbol)}
              >
                <StockLogo symbol={stock.symbol} logoUrl={stock.logoUrl} size={32} />

                <div className="search-bar__row-main">
                  <span className="search-bar__symbol">{stock.symbol}</span>
                  <span className="search-bar__name">{stock.name}</span>
                </div>

                <div className="search-bar__row-price">
                  <span className="search-bar__ltp">{formatCurrency(stock.ltp)}</span>
                  <span className={`search-bar__pct ${isUp ? "is-up" : "is-down"}`}>
                    {isUp ? "▲" : "▼"} {formatPercent(stock.dayChangePercent)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {isOpen && query.trim() && results.length === 0 && (
        <div className="search-bar__empty">No stocks match "{query}"</div>
      )}
    </div>
  );
}