




import { useSelector } from "react-redux";
import { formatPercent } from "../../utils/formatCurrency";
import "./IndexTicker.css";

// UPDATED — was `Object.values(indices).map(...)`, which rendered
// whatever the backend response happened to contain, in whatever order
// it arrived in. Since state.market.indices is only ever populated with
// Sensex + Nifty (see marketSlice's fetchMarketIndices, which reads
// WATCHED_INDICES on the backend), this pinned list just guarantees a
// stable Sensex-then-Nifty order and a visible skeleton pill for
// whichever one hasn't loaded yet yet, instead of the ticker being empty
// or single-pill until both happen to have arrived.
const DISPLAY_ORDER = [
  { key: "SENSEX", label: "SENSEX" },
  { key: "NIFTY50", label: "NIFTY 50" },
];

export default function IndexTicker() {
  const indices = useSelector((state) => state.market.indices);

  return (
    <div className="index-ticker">
      {DISPLAY_ORDER.map(({ key, label }) => {
        const idx = indices?.[key];

        if (!idx) {
          return (
            <div key={key} className="index-ticker__pill index-ticker__pill--loading">
              <span className="index-ticker__name">{label}</span>
              <span className="index-ticker__skeleton" />
            </div>
          );
        }

        const isUp = idx.changePercent >= 0;
        return (
          <div key={key} className={`index-ticker__pill ${isUp ? "is-up" : "is-down"}`}>
            <span className="index-ticker__live-dot" aria-hidden="true" />
            <span className="index-ticker__name">{label}</span>
            <span className="index-ticker__value">
              {idx.value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span className="index-ticker__change">
              {isUp ? "▲" : "▼"} {formatPercent(idx.changePercent)}
            </span>
          </div>
        );
      })}
    </div>
  );
}






