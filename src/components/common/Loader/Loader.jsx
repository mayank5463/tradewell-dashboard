import "./Loader.css";

// size: "sm" for inline-with-text use, "md" default, "lg" for full-section loading states.
export default function Loader({ size = "md", label }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className={`loader__spinner loader__spinner--${size}`} />
      {label && <span className="loader__label">{label}</span>}
    </div>
  );
}