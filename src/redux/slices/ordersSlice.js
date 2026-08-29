


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { placeOrderRequest, fetchOrdersRequest } from "../../services/orderService";
import { fetchHoldings } from "./holdingsSlice";
import { fetchPositions } from "./positionsSlice";



export const fetchOrders = createAsyncThunk("orders/fetch", async () => {
  return await fetchOrdersRequest(); // array, newest first
});


export const placeOrder = createAsyncThunk(
  "orders/place",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const result = await placeOrderRequest(payload); // POST /newOrder -> { message }

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