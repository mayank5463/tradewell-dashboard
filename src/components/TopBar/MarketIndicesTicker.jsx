import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchMarketIndices } from "../../redux/slices/marketSlice";
import "./MarketIndicesTicker.css";

function IndexBlock({ label, index }) {
  if (!index) {
    return (
      <div className="market-ticker__block market-ticker__block--loading">
        <span className="market-ticker__label">{label}</span>
        <span className="market-ticker__skeleton" />
      </div>
    );
  }

  const isUp = index.changePercent >= 0;
  const sign = isUp ? "+" : "";

  return (
    <div className="market-ticker__block">
      <span className="market-ticker__label">{label}</span>
      <div className="market-ticker__figures">
        <span className="market-ticker__value numeric">
          {index.value?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </span>
        <span className={`market-ticker__change ${isUp ? "is-up" : "is-down"}`}>
          {isUp ? "▲" : "▼"} {sign}
          {index.change?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          {" "}
          ({sign}
          {index.changePercent?.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
}

export default function MarketIndicesTicker() {
  const dispatch = useDispatch();
  const indices = useSelector((state) => state.market.indices);

  useEffect(() => {
    dispatch(fetchMarketIndices());
    const id = setInterval(() => {
      dispatch(fetchMarketIndices());
    }, 10000);
    return () => clearInterval(id);
  }, [dispatch]);

  // Find Sensex by KEY
  const sensexKey = Object.keys(indices || {}).find((k) =>
    k.toUpperCase().includes("SENSEX")
  );
  const sensex = sensexKey ? indices[sensexKey] : null;

  // Find Nifty by KEY (exclude BANK)
  const niftyKey = Object.keys(indices || {}).find((k) =>
    k.toUpperCase().includes("NIFTY") && !k.toUpperCase().includes("BANK")
  );
  const nifty = niftyKey ? indices[niftyKey] : null;

  return (
    <div className="market-ticker">
      <IndexBlock label="SENSEX" index={sensex} />
      <div className="market-ticker__divider" />
      <IndexBlock label="NIFTY 50" index={nifty} />
    </div>
  );
}