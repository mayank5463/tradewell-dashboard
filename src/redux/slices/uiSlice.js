import { createSlice } from "@reduxjs/toolkit";

const THEMES = ["navy", "olive", "charcoal", "sand"];
const MODES = ["light", "dark"];

const initialState = {
  colorTheme: "navy",
  mode: "light",
  initialized: false,
  searchQuery: "",
  // DESKTOP ONLY — whether the sidebar shows full content or is collapsed
  // to a 60px icon rail. Mobile ignores this entirely (see WatchList.jsx);
  // the mobile drawer's open/closed state lives as local component state
  // in Home.jsx, not here, since it's a transient UI concern with no
  // reason to round-trip through Redux.
  isWatchlistExpanded: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setColorTheme(state, action) {
      if (THEMES.includes(action.payload)) {
        state.colorTheme = action.payload;
      }
    },
    setMode(state, action) {
      if (MODES.includes(action.payload)) {
        state.mode = action.payload;
      }
    },
    toggleMode(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    markInitialized(state) {
      state.initialized = true;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    // FIXED — previously this toggled BOTH `watchlistPanelOpen` (unused
    // now that the mobile drawer is local state) AND `isWatchlistExpanded`
    // (a desktop-only concept) together as one action. That coupling was
    // the actual root cause of the mobile watchlist bug: collapsing the
    // rail on desktop, then resizing to mobile, left the drawer's content
    // un-rendered with no way for CSS to recover it. This action now does
    // exactly one thing — toggle the desktop rail — and nothing else reads
    // or depends on a second flag.
    toggleWatchlistPanel(state) {
      state.isWatchlistExpanded = !state.isWatchlistExpanded;
    },
  },
});

export const {
  setColorTheme,
  setMode,
  toggleMode,
  markInitialized,
  setSearchQuery,
  toggleWatchlistPanel,
} = uiSlice.actions;

export default uiSlice.reducer;