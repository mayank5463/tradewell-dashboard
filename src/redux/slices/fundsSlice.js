import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchWalletRequest,
  fetchWalletLedgerRequest,
  resetWalletRequest,
} from "../../services/walletService";

// Backend-persisted paper trading balance (walletController.js /
// walletService.js). Balance only ever moves via BUY debit / SELL credit
// (both happen server-side, inside newOrder's Mongo transaction) or a
// full account reset. There is deliberately NO manual add/withdraw here —
// that would let a user push past the fixed ₹5,00,000 paper capital the
// backend enforces (WalletModel starts at STARTING_BALANCE; debit()/
// credit() are the only things that ever change it).

const initialState = {
  balance: 0,
  marginUsed: 0,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
  transactions: [],
  transactionsStatus: "idle",
};

export const fetchWallet = createAsyncThunk(
  "funds/fetchWallet",
  async () => fetchWalletRequest(),
  { condition: (_, { getState }) => getState().funds.status !== "loading" },
);

export const fetchWalletLedger = createAsyncThunk("funds/fetchLedger", async (params) => {
  const data = await fetchWalletLedgerRequest(params);
  return data.transactions;
});

// Wipes holdings/positions/orders/ledger server-side and re-issues
// ₹5,00,000 — see resetPaperTradingAccount() in walletService.js. This
// thunk only updates the funds slice itself; redux/actions/
// resetPaperTrading.js also re-fetches holdings/positions/orders so the
// whole dashboard reflects the clean slate in one go.
export const resetWallet = createAsyncThunk("funds/reset", async () => resetWalletRequest());

const fundsSlice = createSlice({
  name: "funds",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (state) => { state.status = "loading"; })
      .addCase(fetchWallet.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.marginUsed = action.payload.marginUsed;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchWallet.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchWalletLedger.pending, (state) => { state.transactionsStatus = "loading"; })
      .addCase(fetchWalletLedger.fulfilled, (state, action) => {
        state.transactions = action.payload;
        state.transactionsStatus = "succeeded";
      })
      .addCase(fetchWalletLedger.rejected, (state) => { state.transactionsStatus = "failed"; })
      .addCase(resetWallet.fulfilled, (state, action) => {
        state.balance = action.payload.balance;
        state.marginUsed = action.payload.marginUsed;
        state.transactions = [];
      });
  },
});

export default fundsSlice.reducer;