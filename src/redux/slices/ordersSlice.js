


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { placeOrderRequest, fetchOrdersRequest } from "../../services/orderService";
import { fetchHoldings } from "./holdingsSlice";
import { fetchPositions } from "./positionsSlice";

// NEW FILE — tradeActions.js already dispatched
// `placeOrderOnServer(...).unwrap()` (a `placeOrder` thunk imported from
// this slice) and expected it to internally refresh orders + holdings on
// success. This slice never existed before.

export const fetchOrders = createAsyncThunk("orders/fetch", async () => {
  return await fetchOrdersRequest(); // array, newest first
});

// thunkAPI.rejectWithValue(err.message) lets tradeActions.js's
// `.unwrap()` throw the REAL server error text (e.g. "You only have 3
// shares of RELIANCE.") instead of a generic "Rejected" message.
export const placeOrder = createAsyncThunk(
  "orders/place",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const result = await placeOrderRequest(payload); // POST /newOrder -> { message }
      // Re-sync all three from the real DB state right after a successful
      // order — this is what makes orders/holdings/positions reflect the
      // trade immediately everywhere in the app, not just wherever
      // placeOrder was called from. fetchPositions() is a no-op for CNC
      // trades (nothing changed in PositionModel) but it's cheap and
      // simpler than branching on payload.product here.
      await Promise.all([
        dispatch(fetchOrders()),
        dispatch(fetchHoldings()),
        dispatch(fetchPositions()),
      ]);
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  },
);

const initialState = {
  list: [],
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Clears the LOCAL cache only — does not delete the real DB rows. See
    // resetPaperTrading.js's own comment for why a true reset needs a
    // backend endpoint.
    clearOrders(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.list = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export const { clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;