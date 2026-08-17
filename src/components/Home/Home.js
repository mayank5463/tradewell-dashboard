


import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
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

  // Mobile watchlist - local state for slide-in drawer
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Get the watchlist expansion state from Redux
  const isWatchlistExpanded = useSelector(
    (state) => state.ui.isWatchlistExpanded ?? true,
  );

  // Log state changes
  useEffect(() => {
    console.log("🔍 [Home] State:", {
      isWatchlistOpen,
      isWatchlistExpanded,
      width: window.innerWidth,
      isMobile: window.innerWidth <= MOBILE_BREAKPOINT,
    });
  }, [isWatchlistOpen, isWatchlistExpanded]);

  // Force isWatchlistExpanded to true on mobile
  useEffect(() => {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    if (mobile && !isWatchlistExpanded) {
      console.log("⚠️ [Home] Fixing collapsed state on mobile");
      dispatch(toggleWatchlistPanel());
    }
  }, [isWatchlistExpanded, dispatch]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
      if (mobile && !isWatchlistExpanded) {
        dispatch(toggleWatchlistPanel());
      }
      if (!mobile && isWatchlistOpen) {
        setIsWatchlistOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isWatchlistExpanded, isWatchlistOpen, dispatch]);

  // Close watchlist on route change
  useEffect(() => {
    if (isWatchlistOpen) {
      setIsWatchlistOpen(false);
    }
  }, [pathname]);

  // Risk disclaimer
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

  // Toggle watchlist
  const handleWatchlistToggle = () => {
    const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
    console.log(`🔄 [Home] Toggle: mobile=${mobile}, current=${isWatchlistOpen}`);

    if (mobile) {
      const newState = !isWatchlistOpen;
      if (newState && !isWatchlistExpanded) {
        dispatch(toggleWatchlistPanel());
      }
      setIsWatchlistOpen(newState);
    } else {
      dispatch(toggleWatchlistPanel());
    }
  };

  const handleCloseWatchlist = () => {
    console.log("🔙 [Home] Closing watchlist");
    setIsWatchlistOpen(false);
  };

  const handleCloseMobileDrawer = () => {
    console.log("❌ [Home] Closing via X button");
    setIsWatchlistOpen(false);
  };

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

  // Determine if mobile
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

  console.log(`🎨 [Home] Rendering: isWatchlistOpen=${isWatchlistOpen}, isMobile=${isMobile}`);

  // Mobile sidebar styles
  const mobileSidebarStyle = isMobile ? {
    position: 'fixed',
    top: '60px',
    left: '0',
    bottom: '0',
    width: '290px',
    maxWidth: '85%',
    height: 'calc(100% - 60px)',
    zIndex: 100,
    transform: isWatchlistOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
    borderRight: '1px solid var(--border-primary)',
    borderTop: '1px solid var(--border-primary)',
    background: 'var(--surface-primary)',
    overflow: 'hidden',
    display: 'block',
    flex: '0 0 auto',
  } : {};

  // Mobile backdrop styles
  const mobileBackdropStyle = isMobile ? {
    display: isWatchlistOpen ? 'block' : 'none',
    position: 'fixed',
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: '99',
    opacity: isWatchlistOpen ? '1' : '0',
    pointerEvents: isWatchlistOpen ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
  } : {};

  return (
    <div className="app-shell">
      <TopBar
        user={user}
        onWatchlistToggle={handleWatchlistToggle}
        isWatchlistOpen={isWatchlistOpen}
      />

      <div className="app-shell__body">
        {/* Mobile Backdrop */}
        <div
          className="app-shell__backdrop"
          style={mobileBackdropStyle}
          onClick={handleCloseWatchlist}
        />

        {/* Watchlist Sidebar */}
        <aside 
          className="app-shell__sidebar"
          style={mobileSidebarStyle}
        >
          <WatchList onCloseMobile={handleCloseMobileDrawer} />
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