import { fetchWallet } from "../slices/fundsSlice";
import { placeOrder as placeOrderOnServer } from "../slices/ordersSlice";

export const executeBuyOrder = ({
  symbol,
  name,
  qty,
  price,
  productType = "CNC",
}) => {
  return async (dispatch, getState) => {
    const quantity = Number(qty);
    const orderPrice = Number(price);

    if (!symbol || !quantity || quantity <= 0) {
      return { ok: false, error: "Enter a valid quantity." };
    }
    if (!orderPrice || orderPrice <= 0) {
      return { ok: false, error: "Enter a valid price." };
    }

    const amount = quantity * orderPrice;
    const availableFunds = getState().funds.balance;
    if (amount > availableFunds) {
      return { ok: false, error: "Insufficient funds for this order." };
    }

    try {
      await dispatch(
        placeOrderOnServer({
          symbol,
          qty: quantity,
          price: orderPrice,
          mode: "BUY",
          product: productType,
        }),
      ).unwrap();
    } catch (err) {
      return { ok: false, error: err || "Failed to place order." };
    }

    // Server already debited the wallet inside the order transaction —
    // just pull the fresh balance down.
    dispatch(fetchWallet());

    return { ok: true };
  };
};

export const executeSellOrder = ({
  symbol,
  name,
  qty,
  price,
  productType = "CNC",
}) => {
  return async (dispatch, getState) => {
    const quantity = Number(qty);
    const orderPrice = Number(price);

    if (!symbol || !quantity || quantity <= 0) {
      return { ok: false, error: "Enter a valid quantity." };
    }
    if (!orderPrice || orderPrice <= 0) {
      return { ok: false, error: "Enter a valid price." };
    }

    const state = getState();
    const pool =
      productType === "MIS" ? state.positions.list : state.holdings.list;
    const existing = pool.find((item) => item.symbol === symbol);
    const heldQty = existing?.qty ?? 0;

    if (quantity > heldQty) {
      return {
        ok: false,
        error: `You only hold ${heldQty} share${heldQty === 1 ? "" : "s"} of ${symbol} in ${
          productType === "MIS" ? "positions" : "holdings"
        }.`,
      };
    }

    try {
      await dispatch(
        placeOrderOnServer({
          symbol,
          qty: quantity,
          price: orderPrice,
          mode: "SELL",
          product: productType,
        }),
      ).unwrap();
    } catch (err) {
      return { ok: false, error: err || "Failed to place order." };
    }

    // Server already credited the wallet — refresh, don't recompute locally.
    dispatch(fetchWallet());

    const amount = quantity * orderPrice;
    const costBasis = quantity * (existing?.avgPrice ?? orderPrice);
    const realizedPnl = amount - costBasis; // still useful for a toast/confirmation UI

    return { ok: true, realizedPnl };
  };
};
