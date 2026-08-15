


import "./RangeSelector.css";


export const RANGES = [
  { key: "1D", label: "1D", kind: "intraday", unit: "minutes", interval: 1, days: 1, live: true },
  { key: "1W", label: "1W", kind: "historical", unit: "minutes", interval: 5, days: 7, live: true },
  { key: "1M", label: "1M", kind: "historical", unit: "minutes", interval: 20, days: 30, live: true },
  { key: "3M", label: "3M", kind: "historical", unit: "hours", interval: 1, days: 91, live: true },
  { key: "6M", label: "6M", kind: "historical", unit: "days", interval: 1, days: 182, live: true },
  { key: "1Y", label: "1Y", kind: "historical", unit: "days", interval: 1, days: 365, live: true },
  { key: "5Y", label: "5Y", kind: "historical", unit: "days", interval: 1, days: 365 * 5, live: false },
  { key: "MAX", label: "Max", kind: "historical", unit: "months", interval: 1, days: 365 * 20, live: false },
];

// Human-readable candle size for the toolbar badge in StockChart.jsx —
// e.g. "5 min candles", "1 hr candles". Centralized here since it's
// purely a function of a RANGES entry's unit/interval.
export function candleDurationLabel(rangeConfig) {
  const n = rangeConfig.interval;
  switch (rangeConfig.unit) {
    case "minutes":
      return n === 1 ? "1 min" : `${n} min`;
    case "hours":
      return n === 1 ? "1 hr" : `${n} hr`;
    case "days":
      return n === 1 ? "1 day" : `${n} day`;
    case "weeks":
      return n === 1 ? "1 week" : `${n} week`;
    case "months":
      return n === 1 ? "1 month" : `${n} month`;
    default:
      return "";
  }
}

export default function RangeSelector({ range, onChange, isLive }) {
  return (
    <div className="range-selector" role="tablist" aria-label="Chart range">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          role="tab"
          aria-selected={r.key === range}
          className={`range-selector__btn ${r.key === range ? "is-active" : ""}`}
          onClick={() => onChange(r.key)}
        >
          {r.label}
          {/* Only show the pulsing live dot when this tab is BOTH the
              active one AND actually polling right now (market open) —
              not just because it's flagged live:true in RANGES. A 1D
              tab showing yesterday's closed session, or a 1W tab open
              after 3:30pm, is not "live" even though it's live-eligible. */}
          {r.key === range && isLive && <i className="range-selector__live-dot" aria-hidden="true" />}
        </button>
      ))}
    </div>
  );
}