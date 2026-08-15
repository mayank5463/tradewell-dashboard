import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchCompanyProfile } from "../../services/companyApi";

const initialState = {
  byKey: {}, // symbol -> { profile, status, error, lastFetched }
};

export const fetchCompany = createAsyncThunk(
  "companyProfile/fetch",
  async ({ symbol, force }) => {
    const profile = await fetchCompanyProfile(symbol, force);
    return { symbol, profile };
  }
);

const companyProfileSlice = createSlice({
  name: "companyProfile",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompany.pending, (state, action) => {
        const { symbol } = action.meta.arg;
        state.byKey[symbol] = {
          ...(state.byKey[symbol] || {}),
          status: "loading",
          error: null,
        };
      })
      .addCase(fetchCompany.fulfilled, (state, action) => {
        const { symbol, profile } = action.payload;
        state.byKey[symbol] = {
          profile,
          status: "succeeded",
          error: null,
          lastFetched: Date.now(),
        };
      })
      .addCase(fetchCompany.rejected, (state, action) => {
        const { symbol } = action.meta.arg;
        state.byKey[symbol] = {
          ...(state.byKey[symbol] || {}),
          status: "failed",
          error: action.error.message,
        };
      });
  },
});

export default companyProfileSlice.reducer;

export const selectCompanyProfile = (state, symbol) =>
  state.companyProfile.byKey[symbol]?.profile ?? null;

export const selectCompanyProfileStatus = (state, symbol) =>
  state.companyProfile.byKey[symbol]?.status ?? "idle";