import { createSlice } from "@reduxjs/toolkit";

const THEMES = ["navy", "olive", "charcoal", "sand"];
const MODES = ["light", "dark"];

const initialState = {
  colorTheme: "navy",
  mode: "light",
  initialized: false,
  searchQuery: "",

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