





import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleWatchlistPanel } from "../../redux/slices/uiSlice";
import {
  fetchWatchlist,
  deleteList,
  renameList,
} from "../../redux/slices/watchlistSlice";
import {
  selectWatchlistLists,
  selectActiveList,
} from "../../redux/selectors/watchlistSelectors";
import WatchlistSwitcher from "./watchlistSwitcher";
import WatchlistItem from "./watchlistItem";
import "./WatchList.css";
import "../../styles/variables.css";
import "../../styles/global.css";

export default function WatchList() {
  const dispatch = useDispatch();

  // FIXED — was reading `activeList?.stocks`, but the backend
  // (watchlistService.js's serialize()) sends the field as `symbols`, not
  // `stocks`. That field-name mismatch is what made lists render empty
  // even when they had stocks in them, and is the same root cause as the
  // crash in StockDetailPanel.jsx. Now sourced from the shared selector
  // file so this can't drift out of sync with the backend shape again.
  const lists = useSelector(selectWatchlistLists);
  const activeList = useSelector(selectActiveList);
  const status = useSelector((state) => state.watchlist.status);
  const stocks = useSelector((state) => state.market.stocks);

  const isExpanded = useSelector(
    (state) => state.ui.isWatchlistExpanded ?? true,
  );

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Single load on mount — this is the only place fetchWatchlist is
  // dispatched from this component. (useAuth() also fires it once right
  // after login/refresh, so on first paint it's usually already cached —
  // the condition guard on fetchWatchlist skips a duplicate call while
  // one is in flight.)
  useEffect(() => {
    dispatch(fetchWatchlist());
  }, [dispatch]);

  // FIXED — `symbols`, not `stocks`. selectActiveList already resolves the
  // active-or-first-list fallback, so this only needs the field-name fix.
  const symbols = activeList?.symbols ?? [];
  const isOnlyList = lists.length <= 1;

  const resolvedStocks = symbols
    .map((symbol) => stocks.find((s) => s.symbol === symbol))
    .filter(Boolean);

  const handleDeleteActiveList = () => {
    if (!activeList || isOnlyList) return; // safety net — button is disabled in this case anyway
    if (!window.confirm(`Delete "${activeList.name}"? This can't be undone.`))
      return;
    dispatch(deleteList(activeList.id));
  };

  const startRename = () => {
    if (!activeList) return;
    setRenameValue(activeList.name);
    setIsRenaming(true);
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setRenameValue("");
  };

  const submitRename = (e) => {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed || !activeList) return;
    dispatch(renameList({ id: activeList.id, name: trimmed }));
    setIsRenaming(false);
  };

  return (
    <aside
      className={`watchlist-panel ${isExpanded ? "" : "watchlist-panel--collapsed"}`}
    >
      <div className="watchlist-panel__header">
        {isExpanded && <h3 className="watchlist-panel__heading">Watchlist</h3>}
        <button
          className="watchlist-panel__collapse"
          onClick={() => dispatch(toggleWatchlistPanel())}
          aria-label={isExpanded ? "Collapse watchlist" : "Expand watchlist"}
        >
          {isExpanded ? "‹" : "›"}
        </button>
      </div>

      {isExpanded && activeList && (
        <>
          <WatchlistSwitcher lists={lists} activeListId={activeList.id} />

          {/* UPDATED — Rename/Delete footer moved INSIDE this scrollable
             div, right after the last stock item, instead of sitting
             pinned below it. It now scrolls with the list and only comes
             into view once the user scrolls down to the bottom — it's no
             longer a permanently-visible fixed footer. Nothing else in
             this component changed. */}
          <div className="watchlist-panel__list scroll-area">
            {resolvedStocks.length === 0 ? (
              <p className="watchlist-panel__empty">
                No stocks in "{activeList.name}" yet. Use the + above to search
                and add some.
              </p>
            ) : (
              resolvedStocks.map((stock) => (
                <WatchlistItem
                  key={stock.symbol}
                  stock={stock}
                  listId={activeList.id}
                />
              ))
            )}

            <div className="watchlist-panel__footer">
              {isRenaming ? (
                <form
                  className="watchlist-panel__rename-form"
                  onSubmit={submitRename}
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="List name"
                    maxLength={40}
                  />
                  <button type="submit" title="Save name" aria-label="Save name">
                    ✓
                  </button>
                  <button
                    type="button"
                    title="Cancel"
                    aria-label="Cancel rename"
                    onClick={cancelRename}
                  >
                    ✕
                  </button>
                </form>
              ) : (
                /* Rename + Delete grouped together — Delete no longer
                   disappears when there's only one list, it just disables
                   itself with an explanation, so it's always visible here. */
                <span className="watchlist-panel__footer-actions">
                  <button
                    className="watchlist-panel__footer-btn watchlist-panel__footer-btn--edit"
                    onClick={startRename}
                    title={`Rename "${activeList.name}"`}
                  >
                    ✎ Rename
                  </button>
                  <button
                    className="watchlist-panel__footer-btn watchlist-panel__footer-btn--delete"
                    onClick={handleDeleteActiveList}
                    disabled={isOnlyList}
                    title={
                      isOnlyList
                        ? "Create another watchlist before deleting this one"
                        : `Delete "${activeList.name}"`
                    }
                  >
                    🗑 Delete
                  </button>
                </span>
              )}
            </div>
          </div>
        </>
      )}

      {isExpanded && !activeList && status === "loading" && (
        <p className="watchlist-panel__empty">Loading your watchlist…</p>
      )}
    </aside>
  );
}