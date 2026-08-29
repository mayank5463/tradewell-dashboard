// import { useState, useEffect } from "react";
// import { useSelector, useDispatch } from "react-redux";
// import { toggleWatchlistPanel } from "../../redux/slices/uiSlice";
// import {
//   fetchWatchlist,
//   deleteList,
//   renameList,
// } from "../../redux/slices/watchlistSlice";
// import {
//   selectWatchlistLists,
//   selectActiveList,
// } from "../../redux/selectors/watchlistSelectors";
// import WatchlistSwitcher from "./watchlistSwitcher";
// import WatchlistItem from "./watchlistItem";
// import "./WatchList.css";
// import "../../styles/variables.css";
// import "../../styles/global.css";

// export default function WatchList({ onCloseMobile }) {
//   const dispatch = useDispatch();
//   const lists = useSelector(selectWatchlistLists);
//   const activeList = useSelector(selectActiveList);
//   const status = useSelector((state) => state.watchlist.status);
//   const stocks = useSelector((state) => state.market.stocks);
//   const isExpanded = useSelector((state) => state.ui.isWatchlistExpanded ?? true);

//   const [isRenaming, setIsRenaming] = useState(false);
//   const [renameValue, setRenameValue] = useState("");

//   useEffect(() => {
//     dispatch(fetchWatchlist());
//   }, [dispatch]);

//   const symbols = activeList?.symbols ?? [];
//   const isOnlyList = lists.length <= 1;

//   const resolvedStocks = symbols
//     .map((symbol) => stocks.find((s) => s.symbol === symbol))
//     .filter(Boolean);

//   const handleDeleteActiveList = () => {
//     if (!activeList || isOnlyList) return;
//     if (!window.confirm(`Delete "${activeList.name}"? This can't be undone.`))
//       return;
//     dispatch(deleteList(activeList.id));
//   };

//   const startRename = () => {
//     if (!activeList) return;
//     setRenameValue(activeList.name);
//     setIsRenaming(true);
//   };

//   const cancelRename = () => {
//     setIsRenaming(false);
//     setRenameValue("");
//   };

//   const submitRename = (e) => {
//     e.preventDefault();
//     const trimmed = renameValue.trim();
//     if (!trimmed || !activeList) return;
//     dispatch(renameList({ id: activeList.id, name: trimmed }));
//     setIsRenaming(false);
//   };

//   const handleTogglePanel = () => {
//     dispatch(toggleWatchlistPanel());
//   };

//   const handleClosePanel = (e) => {
//     e.stopPropagation();
//     const isMobile = window.innerWidth <= 768;

//     if (isMobile) {
//       if (onCloseMobile) {
//         onCloseMobile();
//       }
//       return;
//     }

//     dispatch(toggleWatchlistPanel());
//   };

//   return (
//     <aside
//       className={`watchlist-panel ${isExpanded ? "" : "watchlist-panel--collapsed"}`}
//     >
//       <div className="watchlist-panel__header">
//         {isExpanded && <h3 className="watchlist-panel__heading">Watchlist</h3>}

//         <div className="watchlist-panel__header-actions">
//           {isExpanded && (
//             <button
//               type="button"
//               className="watchlist-panel__close-btn"
//               onClick={handleClosePanel}
//               aria-label="Close watchlist"
//               title="Close watchlist"
//             >
//               <svg
//                 width="18"
//                 height="18"
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 strokeWidth="2.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               >
//                 <line x1="18" y1="6" x2="6" y2="18" />
//                 <line x1="6" y1="6" x2="18" y2="18" />
//               </svg>
//             </button>
//           )}

//           <button
//             type="button"
//             className="watchlist-panel__collapse"
//             onClick={handleTogglePanel}
//             aria-label={isExpanded ? "Collapse watchlist" : "Expand watchlist"}
//             title={isExpanded ? "Collapse" : "Expand"}
//           >
//             {isExpanded ? "◀" : "▶"}
//           </button>
//         </div>
//       </div>

//       {isExpanded && activeList && (
//         <>
//           <WatchlistSwitcher lists={lists} activeListId={activeList.id} />

//           <div className="watchlist-panel__list scroll-area">
//             {resolvedStocks.length === 0 ? (
//               <p className="watchlist-panel__empty">
//                 No stocks in "{activeList.name}" yet. Use the + above to search
//                 and add some.
//               </p>
//             ) : (
//               resolvedStocks.map((stock) => (
//                 <WatchlistItem
//                   key={stock.symbol}
//                   stock={stock}
//                   listId={activeList.id}
//                 />
//               ))
//             )}

//             {resolvedStocks.length > 0 && (
//               <div className="watchlist-panel__footer">
//                 {isRenaming ? (
//                   <form
//                     className="watchlist-panel__rename-form"
//                     onSubmit={submitRename}
//                   >
//                     <input
//                       autoFocus
//                       value={renameValue}
//                       onChange={(e) => setRenameValue(e.target.value)}
//                       placeholder="List name"
//                       maxLength={40}
//                     />
//                     <button type="submit" title="Save name" aria-label="Save name">
//                       ✓
//                     </button>
//                     <button
//                       type="button"
//                       title="Cancel"
//                       aria-label="Cancel rename"
//                       onClick={cancelRename}
//                     >
//                       ✕
//                     </button>
//                   </form>
//                 ) : (
//                   <div className="watchlist-panel__footer-actions">
//                     <button
//                       className="watchlist-panel__footer-btn watchlist-panel__footer-btn--edit"
//                       onClick={startRename}
//                       title={`Rename "${activeList.name}"`}
//                     >
//                       <span className="watchlist-panel__footer-btn-icon">✎</span>
//                       Rename
//                     </button>
//                     <button
//                       className="watchlist-panel__footer-btn watchlist-panel__footer-btn--delete"
//                       onClick={handleDeleteActiveList}
//                       disabled={isOnlyList}
//                       title={
//                         isOnlyList
//                           ? "Create another watchlist before deleting this one"
//                           : `Delete "${activeList.name}"`
//                       }
//                     >
//                       <span className="watchlist-panel__footer-btn-icon">🗑</span>
//                       Delete
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {isExpanded && !activeList && status === "loading" && (
//         <p className="watchlist-panel__empty">Loading your watchlist…</p>
//       )}
//     </aside>
//   );
// }




















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
import { useResponsive } from "../../hooks/useResponsive";
import WatchlistSwitcher from "./watchlistSwitcher";
import WatchlistItem from "./watchlistItem";
import "./WatchList.css";
import "../../styles/variables.css";
import "../../styles/global.css";

export default function WatchList({ onCloseMobile }) {
  const dispatch = useDispatch();
  const lists = useSelector(selectWatchlistLists);
  const activeList = useSelector(selectActiveList);
  const status = useSelector((state) => state.watchlist.status);
  const stocks = useSelector((state) => state.market.stocks);

  // "Collapsed to a 60px icon rail" is a DESKTOP-only concept. On mobile
  // the watchlist renders as a full-width slide-in drawer — there is no
  // rail to collapse to, so isWatchlistExpanded (which toggleWatchlistPanel
  // in uiSlice.js also flips whenever the user collapses the rail on
  // desktop) must never be allowed to hide content here.
  //
  // FIXED — this was previously read directly as `isExpanded` and used to
  // gate whether WatchlistSwitcher / the item list / the rename-delete
  // footer rendered AT ALL (a JS conditional, not a CSS class). If a user
  // collapsed the rail on desktop and then resized down to mobile width,
  // isWatchlistExpanded stayed false, and the mobile drawer opened with
  // those elements never mounted in the first place — no CSS override can
  // un-hide something that was never rendered. `effectiveExpanded` below
  // ignores the Redux flag entirely on mobile/tablet, so the drawer always
  // shows its full structure regardless of whatever the desktop rail state
  // happens to be.
  const isWatchlistExpanded = useSelector(
    (state) => state.ui.isWatchlistExpanded ?? true,
  );
  const { isMobileOrTablet } = useResponsive();
  const isExpanded = isMobileOrTablet ? true : isWatchlistExpanded;

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    dispatch(fetchWatchlist());
  }, [dispatch]);

  const symbols = activeList?.symbols ?? [];
  const isOnlyList = lists.length <= 1;

  const resolvedStocks = symbols
    .map((symbol) => stocks.find((s) => s.symbol === symbol))
    .filter(Boolean);

  const handleDeleteActiveList = () => {
    if (!activeList || isOnlyList) return;
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

  // Collapse/expand the rail — desktop only. On mobile this button isn't
  // rendered at all (see below), so there's nothing to guard here anymore.
  const handleTogglePanel = () => {
    dispatch(toggleWatchlistPanel());
  };

  const handleClosePanel = (e) => {
    e.stopPropagation();
    if (isMobileOrTablet) {
      onCloseMobile?.();
      return;
    }
    dispatch(toggleWatchlistPanel());
  };

  return (
    <aside
      className={`watchlist-panel ${isExpanded ? "" : "watchlist-panel--collapsed"}`}
    >
      <div className="watchlist-panel__header">
        {isExpanded && <h3 className="watchlist-panel__heading">Watchlist</h3>}

        <div className="watchlist-panel__header-actions">
          {isExpanded && (
            <button
              type="button"
              className="watchlist-panel__close-btn"
              onClick={handleClosePanel}
              aria-label="Close watchlist"
              title="Close watchlist"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Collapse-to-rail toggle — desktop only. Rendering this on
              mobile made no sense (there's no rail to collapse a full-width
              drawer to) and was the button most likely to accidentally
              flip isWatchlistExpanded false right before someone resized
              down to mobile. */}
          {!isMobileOrTablet && (
            <button
              type="button"
              className="watchlist-panel__collapse"
              onClick={handleTogglePanel}
              aria-label={isExpanded ? "Collapse watchlist" : "Expand watchlist"}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? "◀" : "▶"}
            </button>
          )}
        </div>
      </div>

      {isExpanded && activeList && (
        <>
          <WatchlistSwitcher lists={lists} activeListId={activeList.id} />

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

            {resolvedStocks.length > 0 && (
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
                  <div className="watchlist-panel__footer-actions">
                    <button
                      className="watchlist-panel__footer-btn watchlist-panel__footer-btn--edit"
                      onClick={startRename}
                      title={`Rename "${activeList.name}"`}
                    >
                      <span className="watchlist-panel__footer-btn-icon">✎</span>
                      Rename
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
                      <span className="watchlist-panel__footer-btn-icon">🗑</span>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {isExpanded && !activeList && status === "loading" && (
        <p className="watchlist-panel__empty">Loading your watchlist…</p>
      )}
    </aside>
  );
}