// import { useState } from "react";
// import Modal from "./Modal";
// import Button from "./Button";
// import WarningIcon from "./icons/WarningIcon";
// import "./RiskDisclaimerModal.css";

// const STORAGE_KEY = "nivesh:riskDisclaimerAcknowledged";

// // Call this from wherever login success is handled (e.g. right after the
// // auth redirect resolves). It's the only piece that talks to storage, so
// // swapping storage for a backend "accepted terms" flag later only means
// // editing this hook, not every screen that renders the modal.
// export function useRiskDisclaimer() {
//   const [isOpen, setIsOpen] = useState(() => {
//     try {
//       return localStorage.getItem(STORAGE_KEY) !== "true";
//     } catch {
//       // Storage can be unavailable (private browsing, disabled cookies) -
//       // fail open and just show the notice every time rather than crash.
//       return true;
//     }
//   });

//   const acknowledge = (remember) => {
//     if (remember) {
//       try {
//         localStorage.setItem(STORAGE_KEY, "true");
//       } catch {
//         /* non-fatal - notice will simply show again next login */
//       }
//     }
//     setIsOpen(false);
//   };

//   return { isOpen, acknowledge };
// }

// // `onAcknowledge` fires once the user confirms they understand the risk.
// // `onDecline`, if passed, renders a secondary "Log out instead" action for
// // anyone who'd rather back out than proceed - useful right after login
// // where "close the modal" shouldn't silently mean "continue anyway".
// export default function RiskDisclaimerModal({ isOpen, onAcknowledge, onDecline }) {
//   const [remember, setRemember] = useState(true);

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={() => onAcknowledge(remember)}
//       title={
//         <span className="risk-modal__title">
//           <span className="risk-modal__icon">
//             <WarningIcon width={18} height={18} />
//           </span>
//           Before you continue
//         </span>
//       }
//       footer={
//         <div className="risk-modal-footer">
//           <label className="risk-modal__remember">
//             <input
//               type="checkbox"
//               checked={remember}
//               onChange={(e) => setRemember(e.target.checked)}
//             />
//             Don't show this again
//           </label>

//           {onDecline && (
//             <Button variant="ghost" size="md" onClick={onDecline}>
//               Log out instead
//             </Button>
//           )}

//           <Button variant="primary" size="md" onClick={() => onAcknowledge(remember)}>
//             I Understand, Continue
//           </Button>
//         </div>
//       }
//     >
//       <p className="risk-modal__intro">
//         Investments in the securities market are subject to market risk. Prices of
//         stocks, mutual funds, and derivatives can rise or fall, and past performance
//         is never a guarantee of future returns.
//       </p>

//       <ul className="risk-modal__list">
//         <li>
//           <span className="risk-modal__bullet" aria-hidden="true" />
//           Equity and derivatives markets are inherently volatile and unpredictable.
//         </li>
//         <li>
//           <span className="risk-modal__bullet" aria-hidden="true" />
//           You may lose part, or all, of the capital you invest.
//         </li>
//         <li>
//           <span className="risk-modal__bullet" aria-hidden="true" />
//           niveshAi's AI-generated insights and recommendations are for informational
//           purposes only and do not constitute investment advice.
//         </li>
//         <li>
//           <span className="risk-modal__bullet" aria-hidden="true" />
//           Please read all related exchange and scheme documents carefully before
//           investing.
//         </li>
//       </ul>

//       <p className="risk-modal__footnote">
//         Trade responsibly and only with capital you can afford to risk.
//       </p>
//     </Modal>
//   );
// }
















































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
          Please read and acknowledge the following before using NiveshAI.
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












