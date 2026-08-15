import { useState } from "react";
import { useSelector } from "react-redux";
import Card from "../../common/Card/Card";
import PageIcon from "../../common/PageIcon/PageIcon";
import iconOrders from "../../../assets/icons/icon-orders.png";
import {
  PERIODS,
  selectBookedPnlForPeriod,
} from "../../../redux/selectors/bookedPnlSelectors";
import { formatCurrency } from "../../../utils/formatCurrency";
import "./OrdersBookedPnl.css";

function pnlTone(value) {
  if (value > 0) return "profit";
  if (value < 0) return "loss";
  return "flat";
}

function BookedPnlCard({ label, sublabel, value, isEmpty, emptyText, children }) {
  const tone = pnlTone(value);
  return (
    <Card raised className={`booked-pnl-card booked-pnl-card--${tone}`}>
      <div className="booked-pnl-card__top">
        <div className="booked-pnl-card__label-group">
          <span className="booked-pnl-card__label">{label}</span>
          <span className="booked-pnl-card__sublabel">{sublabel}</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="booked-pnl-card__empty">{emptyText}</div>
      ) : (
        <div className="booked-pnl-card__value">
          {value >= 0 ? "+" : ""}
          {formatCurrency(value)}
        </div>
      )}

      {children}
    </Card>
  );
}

// FIXED — the left ("all-time") box used to call selectAllTimeBookedPnl,
// a separate selector that only returns a bare number. That meant its
// sublabel was a hardcoded static string with no real trade count, and
// isEmpty was hardcoded to false, so it never actually distinguished
// "zero trades ever closed" from "closed trades netting exactly ₹0" —
// both rendered the identical "+₹0.00" card with no way to tell them
// apart.
//
// PERIODS already contains { key: "ALL", days: null }, which
// selectBookedPnlForPeriod resolves to "no cutoff" — i.e. the exact same
// population of orders selectAllTimeBookedPnl was summing. Using that
// selector for both boxes means the all-time card now gets a real
// tradeCount and a real isEmpty check for free, and there's only one
// source of truth for "what counts as a closed trade" instead of two
// selectors that have to be kept in sync by hand.
export function BookedPnlBoxes() {
  const [period, setPeriod] = useState("1D");

  const { total: allTimeTotal, tradeCount: allTimeCount } = useSelector((state) =>
    selectBookedPnlForPeriod(state, "ALL"),
  );
  const { total: periodTotal, tradeCount: periodCount } = useSelector((state) =>
    selectBookedPnlForPeriod(state, period),
  );

  const periodMeta = PERIODS.find((p) => p.key === period);

  return (
    <div className="booked-pnl-row">
      <BookedPnlCard
        label="Overall Booked P&L"
        sublabel={`${allTimeCount} closed trade${allTimeCount === 1 ? "" : "s"}, all time`}
        value={allTimeTotal}
        isEmpty={allTimeCount === 0}
        emptyText="No trades closed yet — this fills in once you square off a position."
      />

      <BookedPnlCard
        label={`Booked P&L · ${periodMeta?.label ?? period}`}
        sublabel={`${periodCount} closed trade${periodCount === 1 ? "" : "s"} in this range`}
        value={periodTotal}
        isEmpty={periodCount === 0}
        emptyText="No trades closed in this range."
      >
        <div className="booked-pnl-card__selector" role="group" aria-label="Booked P&L period">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className="booked-pnl-card__pill"
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </BookedPnlCard>
    </div>
  );
}