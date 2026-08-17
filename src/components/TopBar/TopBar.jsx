import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import ProfileMenu from "./ProfileMenu";
import MarqueeStrip from "./MarqueeStrip";
import SearchBar from "./SearchBar";
import IndexTicker from "./IndexTicker";
import "./TopBar.css";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/holdings", label: "Holdings" },
  { to: "/dashboard/positions", label: "Positions" },
  { to: "/dashboard/funds", label: "Funds" },
];

const THEMES = [
  { id: "navy", label: "Navy", color: "#2563eb" },
  { id: "olive", label: "Olive", color: "#728a39" },
  { id: "charcoal", label: "Charcoal", color: "#374151" },
  { id: "sand", label: "Sand", color: "#b67942" },
];

const COMPACT_THRESHOLD = 40;

export default function TopBar({ 
  scrollTarget = null, 
  onWatchlistToggle, 
  isWatchlistOpen = false 
}) {
  const { colorTheme, setColorTheme, mode, toggleMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const flyoutRef = useRef(null);
  const searchToggleRef = useRef(null);
  const themeDropdownRef = useRef(null);
  const themeToggleRef = useRef(null);

  const closeDrawer = () => setOpen(false);

  // --- Scroll handler for compact mode ---
  useEffect(() => {
    const el = scrollTarget ? document.querySelector(scrollTarget) : window;
    if (!el) return undefined;

    const getScrollY = () => (el === window ? window.scrollY : el.scrollTop);

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setCompact(getScrollY() > COMPACT_THRESHOLD);
        ticking = false;
      });
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollTarget]);

  // --- Close search when compact mode changes ---
  useEffect(() => {
    if (!compact) setSearchOpen(false);
  }, [compact]);

  // --- Click outside handlers for search ---
  useEffect(() => {
    if (!searchOpen) return undefined;

    function onPointerDown(e) {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(e.target) &&
        searchToggleRef.current &&
        !searchToggleRef.current.contains(e.target)
      ) {
        setSearchOpen(false);
      }
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setSearchOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [searchOpen]);

  // --- Click outside handler for theme dropdown ---
  useEffect(() => {
    if (!themeOpen) return undefined;

    function handleClickOutside(e) {
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(e.target) &&
        themeToggleRef.current &&
        !themeToggleRef.current.contains(e.target)
      ) {
        setThemeOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === "Escape") setThemeOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [themeOpen]);

  // --- Get current theme color ---
  const currentThemeColor = THEMES.find(t => t.id === colorTheme)?.color || "#2563eb";

  return (
    <>
      <div
        className={`topbar-overlay ${open ? "open" : ""}`}
        onClick={closeDrawer}
      />

      <header
        className={`topbar-shell${compact ? " topbar-shell--compact" : ""}`}
      >
        <div className="topbar-nav">
          <div className="topbar-nav__wrap">
            <a
              href="/dashboard"
              className="topbar-brand"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
            >
              <span className="topbar-brand__mark" aria-hidden="true">
                TD
              </span>
              <span className="topbar-brand__name">Tradewell</span>
            </a>

            <nav className="topbar-nav__links" aria-label="Primary">
              {LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/dashboard"}
                  className={({ isActive }) =>
                    `topbar-nav__link${isActive ? " active" : ""}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="topbar-nav__right">
              {/* Theme Switcher - Desktop only */}
              <div className="topbar-theme-switcher">
                <button
                  type="button"
                  ref={themeToggleRef}
                  className={`topbar-theme-toggle ${themeOpen ? "is-open" : ""}`}
                  onClick={() => setThemeOpen((o) => !o)}
                  aria-label="Switch theme"
                  aria-expanded={themeOpen}
                  title={`Theme: ${colorTheme}`}
                >
                  <span 
                    className="topbar-theme-toggle-dot"
                    style={{ backgroundColor: currentThemeColor }}
                  />
                  <span className="topbar-theme-toggle-label">
                    {THEMES.find(t => t.id === colorTheme)?.label || "Navy"}
                  </span>
                  <svg 
                    className={`topbar-theme-toggle-chevron ${themeOpen ? "is-rotated" : ""}`}
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {themeOpen && (
                  <div className="topbar-theme-dropdown" ref={themeDropdownRef}>
                    <div className="topbar-theme-dropdown-header">
                      <span className="topbar-theme-dropdown-label">Theme</span>
                    </div>
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`topbar-theme-option ${colorTheme === t.id ? "active" : ""}`}
                        onClick={() => {
                          setColorTheme(t.id);
                          setThemeOpen(false);
                        }}
                      >
                        <span 
                          className="topbar-theme-dot" 
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="topbar-theme-label">{t.label}</span>
                        {colorTheme === t.id && (
                          <svg className="topbar-theme-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="topbar-mode-toggle"
                onClick={toggleMode}
                aria-label={
                  mode === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {mode === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>

              {/* ⭐ WATCHLIST TOGGLE BUTTON - Always visible */}
              <button
                type="button"
                className={`topbar-watchlist-toggle ${isWatchlistOpen ? "is-active" : ""}`}
                onClick={onWatchlistToggle}
                aria-label={isWatchlistOpen ? "Close watchlist" : "Open watchlist"}
                title={isWatchlistOpen ? "Close watchlist" : "Open watchlist"}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <rect x="2.5" y="2.5" width="15" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M6.5 6.5h7M6.5 10h7M6.5 13.5h4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>

              <button
                type="button"
                ref={searchToggleRef}
                className="topbar-search-toggle"
                onClick={() => setSearchOpen((o) => !o)}
                aria-label={searchOpen ? "Close search" : "Search stocks"}
                aria-expanded={searchOpen}
                title="Search stocks"
              >
                {searchOpen ? <CloseIcon /> : <SearchGlyphIcon />}
              </button>

              <ProfileMenu />

              <button
                type="button"
                className="topbar-burger"
                onClick={() => setOpen((o) => !o)}
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                {open ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          <div
            ref={flyoutRef}
            className={`topbar-search-flyout${compact && searchOpen ? " is-open" : ""}`}
            aria-hidden={!(compact && searchOpen)}
          >
            <div className="topbar-search-flyout__wrap">
              <SearchBar />
            </div>
          </div>
        </div>

        <div className="topbar-shell__collapsible" aria-hidden={compact}>
          <div className="topbar-shell__collapsible-inner">
            <MarqueeStrip />

            <div className="topbar-search-row">
              <div className="topbar-search-row__wrap">
                <div className="topbar-search-slot">
                  <SearchBar />
                </div>
                <IndexTicker />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={`topbar-mobile-menu ${open ? "open" : ""}`}>
        <div className="topbar-mobile-menu__wrap">
          <button
            type="button"
            className="topbar-mobile-close"
            onClick={closeDrawer}
            aria-label="Close menu"
          >
            <CloseIcon />
          </button>

          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              onClick={closeDrawer}
              className={({ isActive }) =>
                `topbar-mobile-link${isActive ? " active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="topbar-mobile-section">
            <span className="topbar-mobile-section__title">Appearance</span>

            <button
              type="button"
              className="topbar-mobile-mode-btn"
              onClick={toggleMode}
            >
              <span className="topbar-mobile-mode-icon">
                {mode === "dark" ? <SunIcon /> : <MoonIcon />}
              </span>
              <span className="topbar-mobile-mode-text">
                {mode === "dark" ? "Light Mode" : "Dark Mode"}
              </span>
              <span className="topbar-mobile-mode-toggle">
                <span
                  className={`topbar-toggle-knob ${mode === "dark" ? "active" : ""}`}
                />
              </span>
            </button>

            <span className="topbar-mobile-section__subtitle">
              Select Theme
            </span>
            <div className="topbar-mobile-themes">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`topbar-mobile-theme-btn ${colorTheme === t.id ? "active" : ""}`}
                  onClick={() => setColorTheme(t.id)}
                >
                  <span
                    className="topbar-theme-dot"
                    style={{ background: t.color }}
                  />
                  {t.label}
                  {colorTheme === t.id && <CheckMark />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* Icons */
function CheckMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      style={{ marginLeft: "auto" }}
    >
      <path
        d="M3.5 8.5l3 3 6-6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 1.8v2.4M10 15.8v2.4M18.2 10h-2.4M4.2 10H1.8" />
        <path d="M15.7 4.3l-1.7 1.7M6 14l-1.7 1.7M15.7 15.7L14 14M6 6L4.3 4.3" />
      </g>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M17 11.2A7.4 7.4 0 118.8 3 6 6 0 0017 11.2z"
        fill="currentColor"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchGlyphIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M17 17l-4.2-4.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}










