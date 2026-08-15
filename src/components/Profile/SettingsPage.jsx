

import Card from "../common/Card/Card";
import { useTheme } from "../../hooks/useTheme";
import { THEMES } from "../../config/themes";
import "./Profile.css";
import "./SettingsPage.css";

export default function SettingsPage() {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <div className="profile-page">
      <h2 className="profile-page__title">Settings</h2>
      <p className="profile-page__subtitle">Manage how the app looks and behaves.</p>

      <div className="profile-section">
        <span className="profile-section__title">Appearance</span>
        <Card raised>
          <div className="theme-picker">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`theme-picker__option ${t.key === colorTheme ? "is-active" : ""}`}
                onClick={() => setColorTheme(t.key)}
                aria-pressed={t.key === colorTheme}
              >
                <span className="theme-picker__preview" aria-hidden="true">
                  {t.swatch.map((c, i) => (
                    <span key={i} className="theme-picker__preview-slice" style={{ background: c }} />
                  ))}
                </span>
                <span className="theme-picker__label">{t.label}</span>
                <span className="theme-picker__desc">{t.description}</span>
                {t.key === colorTheme && (
                  <span className="theme-picker__check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                )}
              </button>
            ))}
          </div>
        </Card>
        <p className="settings-page__more-hint">
          Dark mode is toggled from the icon in the top navigation bar and applies to whichever theme is selected above.
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}