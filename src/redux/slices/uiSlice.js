import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  colorTheme: "navy", // "navy" | "olive" | "charcoal" | "sand" — set only from SettingsPage
  mode: "light",       // "light" | "dark" — toggled from navbar icon
  searchQuery: "",
  isWatchlistExpanded: true,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setColorTheme(state, action) {
      state.colorTheme = action.payload;
    },
    setMode(state, action) {
      state.mode = action.payload;
    },
    toggleMode(state) {
      state.mode = state.mode === "light" ? "dark" : "light";
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
  setSearchQuery,
  toggleWatchlistPanel,
} = uiSlice.actions;
export default uiSlice.reducer;