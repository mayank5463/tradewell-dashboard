import { createContext, useContext, useState, useCallback } from "react";
import BuyActionWindow from "./BuyActionWindow";

// PHASE 4 — rebuilt to actually drive the Buy/Sell overlay end-to-end.
// Naming/pattern kept exactly as locked in during Phase 1: GeneralContext +
// BuyActionWindow. If your working copy of this file already has state/logic
// beyond what's here, merge rather than blindly overwrite — this version assumes
// a clean slate for the Trade overlay specifically.
//
// NO CHANGE NEEDED HERE — rendering <BuyActionWindow /> as a child of this
// provider is still correct even now that BuyActionWindow.js renders through
// a portal internally (createPortal targets document.body regardless of
// where in the React tree this component sits, so it doesn't matter that
// GeneralContextProvider itself might be nested deep inside Dashboard.jsx).
//
// Usage from anywhere in the tree:
//   const { openBuyWindow, openSellWindow } = useGeneralContext();
//   openBuyWindow({ symbol, name, ltp })
const GeneralContext = createContext(null);

export function GeneralContextProvider({ children }) {
  const [state, setState] = useState({
    isOpen: false,
    mode: "BUY", // "BUY" | "SELL"
    stock: null, // { symbol, name, ltp }
    defaultProductType: "CNC",
  });

  // defaultProductType lets callers (e.g. the Positions page "Exit" button) open
  // the window pre-set to "MIS" instead of always defaulting to delivery.
  const openBuyWindow = useCallback((stock, defaultProductType = "CNC") => {
    setState({ isOpen: true, mode: "BUY", stock, defaultProductType });
  }, []);

  const openSellWindow = useCallback((stock, defaultProductType = "CNC") => {
    setState({ isOpen: true, mode: "SELL", stock, defaultProductType });
  }, []);

  const closeWindow = useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  return (
    <GeneralContext.Provider value={{ ...state, openBuyWindow, openSellWindow, closeWindow }}>
      {children}
      <BuyActionWindow
        isOpen={state.isOpen}
        mode={state.mode}
        stock={state.stock}
        defaultProductType={state.defaultProductType}
        onClose={closeWindow}
      />
    </GeneralContext.Provider>
  );
}

export function useGeneralContext() {
  const ctx = useContext(GeneralContext);
  if (!ctx) {
    throw new Error("useGeneralContext must be used inside <GeneralContextProvider>");
  }
  return ctx;
}

export default GeneralContext;