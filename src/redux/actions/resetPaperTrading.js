import { resetWallet, fetchWalletLedger } from "../slices/fundsSlice";
import { clearHoldings, fetchHoldings } from "../slices/holdingsSlice";
import { clearPositions, fetchPositions } from "../slices/positionsSlice";
import { clearOrders, fetchOrders } from "../slices/ordersSlice";

export const resetPaperTrading = () => async (dispatch) => {
  dispatch(clearHoldings());
  dispatch(clearPositions());
  dispatch(clearOrders());

  await dispatch(resetWallet());
  await Promise.all([
    dispatch(fetchHoldings()),
    dispatch(fetchPositions()),
    dispatch(fetchOrders()),
    dispatch(fetchWalletLedger()),
  ]);
};
