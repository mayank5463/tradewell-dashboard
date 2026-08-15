import { resetWallet, fetchWalletLedger } from "../slices/fundsSlice";
import { clearHoldings, fetchHoldings } from "../slices/holdingsSlice";
import { clearPositions, fetchPositions } from "../slices/positionsSlice";
import { clearOrders, fetchOrders } from "../slices/ordersSlice";

// Real backend reset now — POST /wallet/reset deletes every Holding/
// Position/Order/Transaction row for this user inside one Mongo
// transaction and re-issues a fresh ₹5,00,000 balance (see
// resetPaperTradingAccount() in walletService.js). Watchlist is
// deliberately untouched — that endpoint never imports or references
// WatchlistModel, by construction.
export const resetPaperTrading = () => async (dispatch) => {
  dispatch(clearHoldings());
  dispatch(clearPositions());
  dispatch(clearOrders());

  await dispatch(resetWallet());

  // Re-sync everything from the now-clean DB state, so Holdings/Positions/
  // Orders/Summary/Funds all reflect the reset immediately — no manual
  // page refresh needed.
  await Promise.all([
    dispatch(fetchHoldings()),
    dispatch(fetchPositions()),
    dispatch(fetchOrders()),
    dispatch(fetchWalletLedger()),
  ]);
};