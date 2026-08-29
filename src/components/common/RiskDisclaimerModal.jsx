



import { useState } from "react";
import "./RiskDisclaimerModal.css";

const RISK_POINTS = [
  "Stock market investments are subject to market risk. Prices of securities can go up or down without warning.",
  "Past performance of any stock or index is not indicative of future returns.",
  "This is a paper trading (simulated) platform. No real money is invested, and profits or losses here do not reflect real financial outcomes.",
  "Real trading involves brokerage, transaction charges, and taxes that may not be fully reflected in this simulation.",
  "Always consult a registered financial advisor before making real investment decisions.",
];

// Not dismissible via backdrop click or Escape — this is an acknowledgment
// gate, not a casual dialog. Continue is disabled until the checkbox is
// checked, matching how real brokers (Zerodha, Groww, Upstox) gate this.
export default function RiskDisclaimerModal({ isOpen, onAcknowledge }) {
  const [checked, setChecked] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="risk-modal-backdrop">
      <div
        className="risk-modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="risk-modal-title"
      >
        <div className="risk-modal-icon" aria-hidden="true">⚠</div>

        <h2 id="risk-modal-title" className="risk-modal-title">
          Before you start trading
        </h2>
        <p className="risk-modal-subtitle">
          Please read and acknowledge the following before using Tradewell.
        </p>

        <ul className="risk-modal-list">
          {RISK_POINTS.map((point, i) => (
            <li key={i} className="risk-modal-list-item">
              <span className="risk-modal-list-bullet" aria-hidden="true" />
              {point}
            </li>
          ))}
        </ul>

        <label className="risk-modal-checkbox">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          <span>I have read and understood the risks involved in stock market trading.</span>
        </label>

        <button
          className="risk-modal-continue"
          disabled={!checked}
          onClick={onAcknowledge}
        >
          I Understand, Continue
        </button>
      </div>
    </div>
  );
}












