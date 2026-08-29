import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./Home.css";

import TopBar from "../TopBar/TopBar";
import WatchList from "../Watchlist/WatchList";
import RiskDisclaimerModal from "../common/RiskDisclaimerModal";

import { useAuth } from "../../hooks/useAuth";
import { useMarketPolling } from "../../hooks/useMarketPolling";
import { toggleWatchlistPanel } from "../../redux/slices/uiSlice";

function riskAckKey(userId) {
  return `niveshai:riskAck:${userId}`;
}

const MOBILE_BREAKPOINT = 768;

export default function Home() {
  const { user, status } = useAuth();
  const { pathname } = useLocation();
  const dispatch = useDispatch();

  // Starts global market polling once
  useMarketPolling();

  // Mobile watchlist — local state for the slide-in drawer. Deliberately
  // NOT in Redux: this is purely "is the drawer currently open," a
  // transient per-viewport UI concern, independent of the desktop rail's
  // expanded/collapsed preference (state.ui.isWatchlistExpanded). Keeping
  // these two concerns separate is what fixes the bug where collapsing the
  // rail on desktop, then resizing to mobile, used to leave the drawer's
  // content (switcher / rename / delete) unrendered — see WatchList.jsx
  // for the other half of this fix.
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  const isWatchlistExpanded = useSelector(
    (state) => state.ui.isWatchlistExpanded ?? true,
  );

  // Close the mobile drawer on route change, and on resize back to desktop.
  useEffect(() => {
    setIsWatchlistOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (!mobile && isWatchlistOpen) {
        setIsWatchlistOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isWatchlistOpen]);

  // Risk disclaimer (shown once per user)
  const [showRiskModal, setShowRiskModal] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const acknowledged = localStorage.getItem(riskAckKey(user.id));
    setShowRiskModal(!acknowledged);
  }, [user?.id]);

  const handleAcknowledge = () => {
    if (user?.id) {
      localStorage.setItem(riskAckKey(user.id), "true");
    }
    setShowRiskModal(false);
  };

  // Toggle watchlist — mobile just flips the local drawer flag; desktop
  // dispatches the rail collapse/expand. The two no longer share any
  // state, so opening the drawer on mobile can never be blocked or
  // half-rendered by whatever the desktop rail was last left at.
  const handleWatchlistToggle = () => {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (mobile) {
      setIsWatchlistOpen((open) => !open);
    } else {
      dispatch(toggleWatchlistPanel());
    }
  };

  const handleCloseWatchlist = () => setIsWatchlistOpen(false);

  // Session loading screen
  if (status === "checking") {
    return (
      <div className="home-loading">
        <div className="home-loading-inner">
          <div className="home-spinner" />
          <p className="home-loading-text">Loading Tradewell...</p>
          <p className="home-loading-sub">Verifying your session</p>
        </div>
      </div>
    );
  }

  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  // Mobile sidebar: full-width slide-in drawer, independent of the
  // desktop `isWatchlistExpanded` rail state — that flag only affects the
  // `.watchlist-panel--collapsed` styling inside WatchList itself on
  // desktop widths (see the media query in WatchlistPanel.css), and
  // WatchList.jsx now ignores it entirely below the mobile breakpoint.
  // FIXED — this used to be `position: fixed` anchored to the viewport
  // with a hardcoded `top: 60px`. TopBar's actual height is NOT a fixed
  // 60px — it includes MarqueeStrip + the search row + IndexTicker
  // (.topbar-shell__collapsible), which is fully expanded until the user
  // scrolls 40px, so on a fresh mobile load the real topbar can easily be
  // 150px+ tall. TopBar.css also sets `.topbar-shell { z-index: 1000 }`,
  // far above this drawer's old z-index: 100. Combined, the topbar was
  // both taller than assumed AND stacked above the drawer — so the top
  // ~90+px of the drawer (title, close button, the whole switcher row)
  // rendered physically underneath the topbar. Only list items further
  // down (past wherever the real topbar happened to end) peeked out.
  //
  // Fix: don't guess a pixel height at all. `.app-shell__body` already
  // has `position: relative` (see Home.css) and sits right after the
  // sticky topbar in normal flow — anchoring the drawer to THAT with
  // `position: absolute; inset: 0` means it always starts exactly where
  // the topbar visually ends, whatever height the topbar happens to be,
  // with no magic number and no z-index arms race against it.
  const mobileSidebarStyle = isMobile
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        width: "290px",
        maxWidth: "85%",
        height: "100%",
        zIndex: 20,
        transform: isWatchlistOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "4px 0 20px rgba(0, 0, 0, 0.15)",
        borderRight: "1px solid var(--border-primary)",
        background: "var(--surface-primary)",
        overflow: "hidden",
        display: "block",
        flex: "0 0 auto",
      }
    : {};

  const mobileBackdropStyle = isMobile
    ? {
        display: isWatchlistOpen ? "block" : "none",
        position: "absolute",
        inset: "0",
        background: "rgba(0, 0, 0, 0.5)",
        zIndex: "10",
        opacity: isWatchlistOpen ? "1" : "0",
        pointerEvents: isWatchlistOpen ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }
    : {};

  return (
    <div className="app-shell">
      <TopBar
        user={user}
        onWatchlistToggle={handleWatchlistToggle}
        isWatchlistOpen={isMobile ? isWatchlistOpen : isWatchlistExpanded}
      />

      <div className="app-shell__body">
        {/* Mobile Backdrop */}
        <div
          className="app-shell__backdrop"
          style={mobileBackdropStyle}
          onClick={handleCloseWatchlist}
        />

        {/* Watchlist Sidebar */}
        <aside className="app-shell__sidebar" style={mobileSidebarStyle}>
          <WatchList onCloseMobile={handleCloseWatchlist} />
        </aside>

        <main className="app-shell__main scroll-area">
          <Outlet />
        </main>
      </div>

      <RiskDisclaimerModal
        isOpen={showRiskModal}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}