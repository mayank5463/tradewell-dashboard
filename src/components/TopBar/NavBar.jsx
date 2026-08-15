







import { useState } from "react";
import { NavLink } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import ThemeSwitcher from "./ThemeSwitcher";
import "./NavBar.css";

/* ==========================================================
   PRIMARY NAVIGATION
========================================================== */

const NAV_LINKS = [
  { to: "/dashboard", label: "Dashboard", end: true },
  { to: "/dashboard/holdings", label: "Holdings" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/positions", label: "Positions" },
  { to: "/dashboard/funds", label: "Funds" },
];

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="navbar-row">
      {/* ======================================================
          BRAND
      ====================================================== */}

      <div className="navbar-row__brand">
        <span className="navbar-row__logo" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 16V4"
              className="navbar-row__logo-stroke is-up"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M4 4L16 16"
              className="navbar-row__logo-stroke is-down"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M16 16V4"
              className="navbar-row__logo-stroke is-up"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </div>

      {/* ======================================================
          MOBILE HAMBURGER
      ====================================================== */}

      <button
        className={`navbar-row__hamburger ${mobileMenuOpen ? "is-open" : ""}`}
        aria-label="Toggle Navigation"
        aria-expanded={mobileMenuOpen}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        <span />
        <span />
        <span />
      </button>

      {/* ======================================================
          NAVIGATION
      ====================================================== */}

      <div className={`navbar-row__mobile ${mobileMenuOpen ? "is-open" : ""}`}>
        <nav className="navbar-row__links" aria-label="Primary Navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `navbar-row__link${isActive ? " is-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* ======================================================
          RIGHT SIDE
      ====================================================== */}

      <div className="navbar-row__right">
        <ThemeSwitcher />

        {/* ProfileMenu will render the circular
            Gmail/Groww style avatar and dropdown */}

        <ProfileMenu />
      </div>
    </header>
  );
}