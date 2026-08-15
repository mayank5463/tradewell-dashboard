import api from "../../services/api";

// Call this from a "Reset Account" button. After it resolves, re-fetch
// holdings/positions/orders/wallet so the UI drops the wiped data —
// wire in your existing load-thunks for those slices here.
export const resetPaperAccount = () => async (dispatch) => {
  try {
    const { data } = await api.post("/wallet/reset");
    // e.g.: dispatch(loadHoldings(true)); dispatch(loadPositions(true));
    //       dispatch(loadOrders(true)); dispatch(loadWallet(true));
    // Deliberately NOT touching watchlist — reset never calls loadWatchlist.
    return { success: true, data };
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Failed to reset account.";
    return { success: false, error: message };
  }
};