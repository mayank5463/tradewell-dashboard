import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  executeBuyOrder,
  executeSellOrder,
} from "../../redux/actions/tradeActions";
import { formatCurrency } from "../../utils/formatCurrency";
import "./BuyActionWindow.css";

// Rebuilt against GeneralContext.jsx's actual contract:
//   <BuyActionWindow isOpen mode stock defaultProductType onClose />
// where stock is { symbol, name, ltp } (or null while closed) and mode is
// "BUY" | "SELL". Renders through a portal to document.body — see
// BuyActionWindow.css's header comment confirming that's the intended
// setup (the .buy-window z-index bump was added "alongside the new
// createPortal render").
//
// Submits via executeBuyOrder/executeSellOrder from tradeActions.js, which
// now: (a) actually sends `product` to the backend so MIS orders land in
// PositionModel instead of silently defaulting to CNC, and (b) relies on
// ordersSlice's placeOrder thunk to re-fetch orders/holdings/positions
// from the server afterward — this component doesn't need to do any local
// optimistic list updates itself.
export default function BuyActionWindow({
  isOpen,
  mode,
  stock,
  defaultProductType,
  onClose,
}) {
  const dispatch = useDispatch();
  // FIXED — fundsSlice.js stores the paper-trading balance as
  // `state.funds.balance` (see fundsSlice's initialState / fetchWallet
  // reducer), not `state.funds.availableFunds`. That field never existed,
  // so this was always reading `undefined` and rendering a bogus balance.
  const availableFunds = useSelector((state) => state.funds.balance);
  const holdings = useSelector((state) => state.holdings.list);
  const positions = useSelector((state) => state.positions.list);

  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [productType, setProductType] = useState("CNC");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Reset the form every time the window is opened for a (possibly new)
  // stock/mode — otherwise qty/price/productType would carry over from
  // whatever the previous order ticket had.
  useEffect(() => {
    if (!isOpen || !stock) return;
    setQty(1);
    setPrice(stock.ltp ?? 0);
    setProductType(defaultProductType || "CNC");
    setError(null);
    setSuccess(null);
    setSubmitting(false);
  }, [isOpen, stock, defaultProductType]);

  if (!isOpen || !stock) return null;

  const isSell = mode === "SELL";
  const pool = productType === "MIS" ? positions : holdings;
  const heldQty = pool.find((item) => item.symbol === stock.symbol)?.qty ?? 0;

  const numericQty = Number(qty) || 0;
  const numericPrice = Number(price) || 0;
  const total = numericQty * numericPrice;

  const canDecrement = numericQty > 1;
  const canIncrement = !isSell || numericQty < heldQty;

  const handleStep = (delta) => {
    setQty((q) => {
      const next = (Number(q) || 0) + delta;
      if (next < 1) return 1;
      if (isSell && next > heldQty) return heldQty || 1;
      return next;
    });
  };

  const handleProductToggle = (next) => {
    if (submitting) return;
    setProductType(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const action = isSell ? executeSellOrder : executeBuyOrder;
    const result = await dispatch(
      action({
        symbol: stock.symbol,
        name: stock.name,
        qty: numericQty,
        price: numericPrice,
        productType,
      }),
    );

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || "Something went wrong. Please try again.");
      return;
    }

    setSuccess(
      isSell
        ? `Sold ${numericQty} ${stock.symbol} @ ${formatCurrency(numericPrice)}`
        : `Bought ${numericQty} ${stock.symbol} @ ${formatCurrency(numericPrice)}`,
    );

    // Brief confirmation, then close on its own — matches the
    // buy-window__success styling already defined in the CSS.
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return createPortal(
    <div className="buy-window" role="dialog" aria-modal="true">
      <div
        className="buy-window__backdrop"
        onClick={submitting ? undefined : onClose}
      />
      <div className={`buy-window__panel${isSell ? " is-sell" : ""}`}>
        <div className="buy-window__header">
          <h3>
            {isSell ? "Sell" : "Buy"} {stock.symbol}
          </h3>
          <button
            type="button"
            className="buy-window__close"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {stock.name && <p className="buy-window__name">{stock.name}</p>}

        {success ? (
          <p className="buy-window__success">{success}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="buy-window__product-toggle">
              <button
                type="button"
                className={productType === "CNC" ? "is-active" : ""}
                onClick={() => handleProductToggle("CNC")}
                disabled={submitting}
              >
                Delivery (CNC)
              </button>
              <button
                type="button"
                className={productType === "MIS" ? "is-active" : ""}
                onClick={() => handleProductToggle("MIS")}
                disabled={submitting}
              >
                Intraday (MIS)
              </button>
            </div>

            <div className="buy-window__row">
              <label className="buy-window__field">
                Qty.
                <div className="buy-window__qty-control">
                  <button
                    type="button"
                    className="buy-window__step-btn"
                    onClick={() => handleStep(-1)}
                    disabled={submitting || !canDecrement}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={qty}
                    disabled={submitting}
                    onChange={(e) => setQty(e.target.value)}
                  />
                  <button
                    type="button"
                    className="buy-window__step-btn"
                    onClick={() => handleStep(1)}
                    disabled={submitting || !canIncrement}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </label>

              <label className="buy-window__field">
                Price
                <div className="buy-window__price-control">
                  <span className="buy-window__currency-prefix">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={price}
                    disabled={submitting}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </label>
            </div>

            {isSell && (
              <p className="buy-window__funds">
                You hold {heldQty} share{heldQty === 1 ? "" : "s"} in{" "}
                {productType === "MIS" ? "positions" : "holdings"}.
              </p>
            )}

            <div className="buy-window__summary">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {!isSell && (
              <p className="buy-window__funds">
                Available funds: {formatCurrency(availableFunds)}
              </p>
            )}

            {error && <p className="buy-window__error">{error}</p>}

            <button
              type="submit"
              className={`buy-window__submit ${isSell ? "is-sell" : "is-buy"}`}
              disabled={
                submitting ||
                numericQty <= 0 ||
                numericPrice <= 0 ||
                (isSell && numericQty > heldQty)
              }
            >
              {submitting ? "Placing order…" : isSell ? "Sell" : "Buy"}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
