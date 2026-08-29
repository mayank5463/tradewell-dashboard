

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


export function selectActiveListSymbols(state) {
  return selectActiveList(state)?.symbols ?? [];
}

export function selectIsSymbolWatched(state, symbol) {
  return selectActiveListSymbols(state).includes(symbol);
}