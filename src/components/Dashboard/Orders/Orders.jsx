

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconOrders from "../../../assets/icons/icon-orders.png";
import { BuySellSplit, DailyOrderVolume, OrderSizeDistribution } from "./OrdersAnalytics";
import { BookedPnlBoxes } from "./OrdersBookedPnl";
import { fetchOrders } from "../../../redux/slices/ordersSlice";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatOrderTimestamp } from "../../../utils/formatTime";
import "./Orders.css";
import "../../../styles/icons.css";

// PHASE 4 — reads ordersSlice, which BuyActionWindow (via placeOrder) keeps
// in sync the instant an order fills.
//
// FIXED (again) — the table was reading order.transactionType/.productType,
// which don't exist on the real Order docs coming back from the API. The
// backend schema (and the analytics selectors below, which already worked
// correctly) use order.mode ("BUY"/"SELL") and order.product ("CNC"/"MIS").
// That mismatch was the actual cause of the empty Type/Product cells —
// nothing wrong with the CSS, the fields were just always undefined.
export default function Orders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const orders = useSelector((state) => state.orders.list);
  const status = useSelector((state) => state.orders.status);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const sorted = [...orders].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const goToStock = (symbol) => navigate(`/stock/${symbol}`); // matches the /stock/:symbol route in index.js

  const header = (
    <div className="page-header">
      <PageIcon src={iconOrders} tone="orders" size="lg" />
      <div className="page-header__text">
        <h1 className="page-header__title">Orders</h1>
        <p className="page-header__subtitle">Every order you've placed, and how you trade</p>
      </div>
      {sorted.length > 0 && (
        <span className="page-header__meta orders-page__count">{sorted.length} total</span>
      )}
    </div>
  );

  // Loading gate — without this there's a flash of "no orders" between
  // mount and the fetch resolving, same pattern as Holdings/Positions.
  if (status === "loading" || status === "idle") {
    return (
      <div className="orders-page">
        {header}
        <Card raised className="empty-state">
          <PageIcon src={iconOrders} tone="muted" size="xl" />
          <p className="empty-state__title">Loading orders…</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {header}

      {/* Booked P&L is a historical ledger, not a reflection of what's
          currently held — shown unconditionally, even with zero orders,
          so it never has to disappear or feel broken. */}
      <BookedPnlBoxes />

      <div className="orders-page__charts-row">
        <BuySellSplit />
        <DailyOrderVolume />
        <OrderSizeDistribution />
      </div>

      {sorted.length === 0 ? (
        <Card raised className="empty-state">
          <PageIcon src={iconOrders} tone="muted" size="xl" />
          <p className="empty-state__title">You haven't placed any orders yet</p>
          <p className="empty-state__subtitle">
            Every buy and sell you make will land here, along with your buy/sell mix, daily
            activity and order-size consistency above.
          </p>
        </Card>
      ) : (
        <Card raised padded={false} className="orders-page__table-card">
          <div className="orders-page__table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Symbol</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Qty.</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => (
                  <tr key={order.id}>
                    <td>{formatOrderTimestamp(order.timestamp)}</td>
                    <td>
                      <button
                        type="button"
                        className="orders-table__symbol-btn"
                        onClick={() => goToStock(order.symbol)}
                      >
                        <span className="orders-table__symbol">{order.symbol}</span>
                      </button>
                    </td>
                    <td>
                      <span
                        className={`orders-table__mode ${
                          order.mode === "BUY" ? "orders-table__mode--buy" : "orders-table__mode--sell"
                        }`}
                      >
                        {order.mode}
                      </span>
                    </td>
                    <td>
                      <span className="orders-table__product">
                        {order.product === "MIS" ? "Intraday" : "Delivery"}
                      </span>
                    </td>
                    <td>{order.qty}</td>
                    <td>{formatCurrency(order.price)}</td>
                    <td>{formatCurrency(order.qty * order.price)}</td>
                    <td>
                      <span
                        className={`orders-table__status ${
                          order.status === "REJECTED" || order.status === "CANCELLED"
                            ? "orders-table__status--rejected"
                            : order.status === "PENDING"
                              ? "orders-table__status--pending"
                              : ""
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}