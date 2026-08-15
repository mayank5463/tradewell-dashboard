import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  status: "checking", // "checking" | "ok" | "fail"
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated(state, action) {
      state.user = action.payload;
      state.status = "ok";
    },
    setUnauthenticated(state) {
      state.user = null;
      state.status = "fail";
    },
    logout(state) {
      state.user = null;
      state.status = "fail";
    },
  },
});

export const { setAuthenticated, setUnauthenticated, logout } =
  authSlice.actions;
export default authSlice.reducer;
