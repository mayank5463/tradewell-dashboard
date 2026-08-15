// src/redux/selectors/watchlistSelectors.js

export function selectWatchlistLists(state) {
  return state.watchlist.lists;
}

export function selectActiveListId(state) {
  return state.watchlist.activeListId;
}

export function selectActiveList(state) {
  const { lists, activeListId } = state.watchlist;
  return lists.find((l) => l.id === activeListId) ?? lists[0] ?? null;
}

// Always returns an array — never undefined — so callers never need their
// own fallback or optional chaining past this point.
export function selectActiveListSymbols(state) {
  return selectActiveList(state)?.symbols ?? [];
}

export function selectIsSymbolWatched(state, symbol) {
  return selectActiveListSymbols(state).includes(symbol);
}