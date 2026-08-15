import { useTheme } from "../../hooks/useTheme";
import "./ThemeSwitcher.css";

export default function ThemeSwitcher() {
  const {  toggleMode, isDark } = useTheme();

  return (
    <button
      type="button"
      className="mode-toggle"
      onClick={toggleMode}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <span className={`mode-toggle__track ${isDark ? "is-dark" : ""}`}>
        <span className="mode-toggle__thumb">
          {isDark ? <MoonIcon /> : <SunIcon />}
        </span>
      </span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
      <circle cx="10" cy="10" r="4.2" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 1.5v2.2M10 16.3v2.2M18.5 10h-2.2M3.7 10H1.5" />
        <path d="M15.6 4.4l-1.55 1.55M5.95 14.05L4.4 15.6M15.6 15.6l-1.55-1.55M5.95 5.95L4.4 4.4" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden="true">
      <path
        d="M17 11.5A7.5 7.5 0 1 1 8.5 3a6 6 0 0 0 8.5 8.5z"
        fill="currentColor"
      />
    </svg>
  );
}