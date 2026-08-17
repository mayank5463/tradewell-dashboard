import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  useId,
} from "react";
import { createPortal } from "react-dom";
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
  const stocks = useSelector((state) => state.market.stocks || []);

  // FIXED — TopBar renders two <SearchBar /> instances at the same time
  // (one in the compact-mode flyout, one in the collapsible search row;
  // the inactive one is just visually hidden via a 0fr grid row, not
  // unmounted). Both previously hardcoded the SAME id
  // ("search-bar-listbox") on their <ul> and referenced it via the same
  // aria-controls value. Two elements sharing one id is invalid HTML and
  // breaks aria-controls / getElementById lookups — whichever instance's
  // node the browser resolves to "wins" regardless of which input the
  // user is actually interacting with. useId() gives each mounted
  // instance its own unique, stable id.
  const listboxId = useId();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Where the portaled dropdown should sit on screen — computed from the
  // real input box, not guessed via CSS. null until first measured.
  const [coords, setCoords] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !stocks.length) return [];
    return stocks
      .filter(
        (s) =>
          (s.symbol && s.symbol.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, stocks]);

  // Portal the dropdown onto document.body and position it with `fixed`,
  // computed from the input's real bounding box, so no ancestor's
  // overflow/clip-path/transform can clip it.
  const updatePosition = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen, updatePosition]);

  // Keep it glued to the input if the page scrolls or resizes anywhere —
  // capture:true catches scroll events from any scrollable ancestor,
  // since scroll events don't bubble but capture-phase listeners on
  // window still see them fire on any descendant.
  useEffect(() => {
    if (!isOpen) return undefined;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Outside-click has to check the portaled dropdown too, since it's no
  // longer a DOM descendant of containerRef.
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setIsOpen(value.trim().length > 0);
    setHighlightedIndex(-1);
  };

  const clearQuery = () => {
    setQuery("");
    dispatch(setSearchQuery(""));
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
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

  const showDropdown = isOpen && results.length > 0 && coords;
  const showEmpty = isOpen && query.trim() && results.length === 0 && coords;

  return (
    <div className="search-bar" ref={containerRef}>
      <div className="search-bar__field">
        <SearchIcon className="search-bar__icon" fontSize="small" aria-hidden="true" />

        <input
          ref={inputRef}
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
          aria-controls={listboxId}
          autoComplete="off"
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

      {(showDropdown || showEmpty) &&
        createPortal(
          <div
            ref={dropdownRef}
            className="search-bar__portal"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {showDropdown && (
              <ul className="search-bar__dropdown" role="listbox" id={listboxId}>
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

            {showEmpty && (
              <div className="search-bar__empty">No stocks match "{query}"</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}