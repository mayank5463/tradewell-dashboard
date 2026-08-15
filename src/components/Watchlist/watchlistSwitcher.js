

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setActiveList,
  createList,
  deleteList,
  addStockToList,
} from "../../redux/slices/watchlistSlice";
import { formatCurrency } from "../../utils/formatCurrency";
import TrashIcon from "../common/icons/TrashIcon";
import "./watchlistSwitcher.css";
import "../../styles/variables.css";
import "../../styles/global.css";

export default function WatchlistSwitcher({ lists, activeListId }) {
  const dispatch = useDispatch();
  const stocks = useSelector((state) => state.market.stocks);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const [isAddingStock, setIsAddingStock] = useState(false);
  const [addStockTarget, setAddStockTarget] = useState(null);
  const [query, setQuery] = useState("");

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeList = lists.find((l) => l.id === activeListId);
  const isOnlyList = lists.length <= 1;

  // Close the dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isDropdownOpen]);

  const handleSelectList = (id) => {
    dispatch(setActiveList(id));
    setIsDropdownOpen(false);
  };

  const handleDeleteList = (e, list) => {
    e.stopPropagation(); // don't also trigger handleSelectList on the row
    if (isOnlyList) return;
    if (!window.confirm(`Delete "${list.name}"? This can't be undone.`)) return;
    dispatch(deleteList(list.id));
  };

  // ── Create a new list, then immediately open the add-stock search for it ──
  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;

    // createList is a createAsyncThunk — dispatching it returns a promise
    // that resolves to the action object itself, so the server's newList
    // (with its Mongo-issued id) lives at result.payload.newList.
    const result = await dispatch(createList(name));

    setNewName("");
    setIsCreating(false);

    const newListId = result?.payload?.newList?.id ?? activeListId;
    setAddStockTarget(newListId);
    setQuery("");
    setIsAddingStock(true);
  };

  const openAddStockFor = (listId) => {
    setAddStockTarget(listId);
    setQuery("");
    setIsAddingStock(true);
  };

  // FIXED — was reading `activeList?.stocks`, but the backend
  // (watchlistService.js's serialize()) sends the field as `symbols`, not
  // `stocks`. Because of the `|| []` fallback this never crashed — it just
  // silently evaluated to `[]` every time, which made the "already in
  // list" filter a no-op: every stock showed up in the add-stock search
  // results regardless of whether it was already on the list. Same root
  // cause as the crash in StockDetailPanel.jsx and the empty-list render
  // in WatchList.js — just a quieter symptom here.
  const matches = stocks
    .filter((s) => !(activeList?.symbols || []).includes(s.symbol))
    .filter((s) =>
      query.trim()
        ? s.symbol.toLowerCase().includes(query.trim().toLowerCase())
        : true
    )
    .slice(0, 8);

  const handleAddStock = (symbol) => {
    if (!addStockTarget) return;
    dispatch(addStockToList({ listId: addStockTarget, symbol }));
  };

  return (
    <div className="watchlist-switcher">
      <div className="watchlist-switcher__row">
        {/* Custom dropdown replaces the old native <select> — this is what
            lets each list row carry its own delete icon, which a native
            <option> can't do. */}
        <div className="watchlist-switcher__dropdown" ref={dropdownRef}>
          <button
            type="button"
            className="watchlist-switcher__select"
            onClick={() => setIsDropdownOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span className="watchlist-switcher__select-label">
              {activeList?.name ?? "Select list"}
            </span>
            <span className="watchlist-switcher__select-chevron" aria-hidden="true">
              {isDropdownOpen ? "▲" : "▼"}
            </span>
          </button>

          {isDropdownOpen && (
            <ul className="watchlist-switcher__dropdown-menu" role="listbox">
              {lists.map((list) => (
                <li
                  key={list.id}
                  role="option"
                  aria-selected={list.id === activeListId}
                  className={`watchlist-switcher__dropdown-item ${
                    list.id === activeListId ? "is-active" : ""
                  }`}
                  onClick={() => handleSelectList(list.id)}
                >
                  <span className="watchlist-switcher__dropdown-item-name">
                    {list.name}
                  </span>
                  <button
                    type="button"
                    className="watchlist-switcher__dropdown-item-delete"
                    onClick={(e) => handleDeleteList(e, list)}
                    disabled={isOnlyList}
                    title={
                      isOnlyList
                        ? "Create another watchlist before deleting this one"
                        : `Delete "${list.name}"`
                    }
                    aria-label={`Delete "${list.name}"`}
                  >
                    <TrashIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="watchlist-switcher__add-stock-btn"
          onClick={() => openAddStockFor(activeListId)}
          title="Add stock to this list"
        >
          Add stock
        </button>

        <button
          className="watchlist-switcher__add-list-btn"
          onClick={() => setIsCreating((c) => !c)}
          aria-label="New watchlist"
          title="New watchlist"
        >
          +
        </button>
      </div>

      {isCreating && (
        <form className="watchlist-switcher__form" onSubmit={handleCreate}>
          <input
            autoFocus
            placeholder="New list name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit">Create</button>
          <button
            type="button"
            className="watchlist-switcher__form-cancel"
            onClick={() => {
              setIsCreating(false);
              setNewName("");
            }}
          >
            ✕
          </button>
        </form>
      )}

      {isAddingStock && (
        <div className="watchlist-switcher__add-stock-panel">
          <div className="watchlist-switcher__add-stock-header">
            <span>
              Add stocks to "
              {lists.find((l) => l.id === addStockTarget)?.name}"
            </span>
            <button onClick={() => setIsAddingStock(false)}>✕</button>
          </div>
          <input
            autoFocus
            className="watchlist-switcher__add-stock-input"
            placeholder="Search stock e.g. INFY, TCS"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="watchlist-switcher__add-stock-results">
            {matches.map((s) => (
              <li key={s.symbol} onClick={() => handleAddStock(s.symbol)}>
                <span className="watchlist-switcher__add-stock-symbol">
                  {s.symbol}
                </span>
                <span className="watchlist-switcher__add-stock-price">
                  {formatCurrency(s.ltp)}
                </span>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="watchlist-switcher__add-stock-empty">
                No matching stocks
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}