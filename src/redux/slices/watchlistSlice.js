import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchWatchlistRequest,
  createWatchlistListRequest,
  renameWatchlistListRequest,
  deleteWatchlistListRequest,
  setActiveWatchlistRequest,
  addStockToWatchlistRequest,
  removeStockFromWatchlistRequest,
} from "../../services/watchlistService";

// Backend-persisted (MongoDB) — see watchlistController.js /
// watchlistService.js on the server. Every mutation below round-trips to
// the DB and applies whatever it returns as the new state, so the UI can
// never drift from what's actually stored — a refresh or a login on a
// different device always shows the exact same lists.

const initialState = {
  lists: [],
  activeListId: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

export const fetchWatchlist = createAsyncThunk(
  "watchlist/fetch",
  async () => fetchWatchlistRequest(),
  { condition: (_, { getState }) => getState().watchlist.status !== "loading" },
);

export const createList = createAsyncThunk("watchlist/createList", async (name) => {
  return createWatchlistListRequest(name); // { lists, activeListId, newList }
});

export const renameList = createAsyncThunk("watchlist/renameList", async ({ id, name }) => {
  return renameWatchlistListRequest(id, name);
});

export const deleteList = createAsyncThunk("watchlist/deleteList", async (listId) => {
  return deleteWatchlistListRequest(listId);
});

export const setActiveList = createAsyncThunk("watchlist/setActiveList", async (listId) => {
  return setActiveWatchlistRequest(listId);
});

export const addStockToList = createAsyncThunk(
  "watchlist/addStock",
  async ({ listId, symbol }) => addStockToWatchlistRequest(listId, symbol),
);

export const removeStockFromList = createAsyncThunk(
  "watchlist/removeStock",
  async ({ listId, symbol }) => removeStockFromWatchlistRequest(listId, symbol),
);

function applyServerState(state, action) {
  state.lists = action.payload.lists;
  state.activeListId = action.payload.activeListId;
  state.status = "succeeded";
  state.error = null;
}

function applyError(state, action) {
  state.status = "failed";
  state.error = action.error.message;
}

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => { state.status = "loading"; })
      .addCase(fetchWatchlist.fulfilled, applyServerState)
      .addCase(fetchWatchlist.rejected, applyError)
      .addCase(createList.fulfilled, applyServerState)
      .addCase(createList.rejected, applyError)
      .addCase(renameList.fulfilled, applyServerState)
      .addCase(renameList.rejected, applyError)
      .addCase(deleteList.fulfilled, applyServerState)
      .addCase(deleteList.rejected, applyError)
      .addCase(setActiveList.fulfilled, applyServerState)
      .addCase(setActiveList.rejected, applyError)
      .addCase(addStockToList.fulfilled, applyServerState)
      .addCase(addStockToList.rejected, applyError)
      .addCase(removeStockFromList.fulfilled, applyServerState)
      .addCase(removeStockFromList.rejected, applyError);
  },
});

export default watchlistSlice.reducer;