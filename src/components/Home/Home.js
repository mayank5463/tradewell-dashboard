import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import "./Home.css";

import TopBar from "../TopBar/TopBar";
import WatchList from "../Watchlist/WatchList";
import RiskDisclaimerModal from "../common/RiskDisclaimerModal";

import { useAuth } from "../../hooks/useAuth";
import { useMarketPolling } from "../../hooks/useMarketPolling";

function riskAckKey(userId) {
  return `niveshai:riskAck:${userId}`;
}

export default function Home() {
  const { user, status } = useAuth();
  const { pathname } = useLocation();

  // Starts global market polling once. Every dashboard page
  // consumes the same Redux market state.
  useMarketPolling();

  // Mobile watchlist
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  // Close watchlist whenever route changes
  useEffect(() => {
    setIsWatchlistOpen(false);
  }, [pathname]);

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

  // Session loading screen
  if (status === "checking") {
    return (
      <div className="home-loading">
        <div className="home-loading-inner">
          <div className="home-spinner" />

          <p className="home-loading-text">Loading NiveshAI...</p>

          <p className="home-loading-sub">Verifying your session</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sticky Top Navigation */}
      <TopBar
        user={user}
        onWatchlistToggle={() => setIsWatchlistOpen((open) => !open)}
      />

      {/* Sidebar + Main */}
      <div className="app-shell__body">
        {/* Mobile Overlay */}
        <div
          className="app-shell__backdrop"
          data-open={isWatchlistOpen}
          onClick={() => setIsWatchlistOpen(false)}
        />

        {/* Watchlist Sidebar */}
        <aside className="app-shell__sidebar" data-open={isWatchlistOpen}>
          <WatchList />
        </aside>

        {/* Routed Dashboard Pages */}
        <main className="app-shell__main scroll-area">
          <Outlet />
        </main>
      </div>

      {/* One-time Risk Disclaimer */}
      <RiskDisclaimerModal
        isOpen={showRiskModal}
        onAcknowledge={handleAcknowledge}
      />
    </div>
  );
}
