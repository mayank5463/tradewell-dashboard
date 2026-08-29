import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkAuth, logout } from "../services/authService";
import {
  setAuthenticated,
  setUnauthenticated,
} from "../redux/slices/authSlice";
import { fetchHoldings } from "../redux/slices/holdingsSlice";
import { fetchPositions } from "../redux/slices/positionsSlice";
import { fetchOrders } from "../redux/slices/ordersSlice";
import { fetchWallet, fetchWalletLedger } from "../redux/slices/fundsSlice";
import { fetchWatchlist } from "../redux/slices/watchlistSlice";

const FRONTEND_URL =
  process.env.REACT_APP_FRONTEND_URL || "http://localhost:3001";

if (!process.env.REACT_APP_FRONTEND_URL && process.env.NODE_ENV === "production") {
  console.error(
    "[CONFIG] REACT_APP_FRONTEND_URL is not set. Logged-out users will be sent to localhost instead of the real login page. Set it in Vercel's environment variables and redeploy.",
  );
}

export function useAuth() {
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  useEffect(() => {
    if (status !== "checking") return;

    console.log("[useAuth] Verifying session via check-auth...");

    checkAuth()
      .then((data) => {
        // Only proceed if truly authenticated
        if (data && data.isAuthenticated === true) {
          console.log("[useAuth] ✅ Authenticated:", data.user);
          dispatch(setAuthenticated(data.user));

          // Load all dashboard data
          dispatch(fetchHoldings());
          dispatch(fetchPositions());
          dispatch(fetchOrders());
          dispatch(fetchWallet());
          dispatch(fetchWalletLedger());
          dispatch(fetchWatchlist());
        } else {
          // Not authenticated - redirect
          throw new Error("Not authenticated");
        }
      })
      .catch((err) => {
        console.warn("[useAuth] ❌ Not authenticated:", err.message);
        dispatch(setUnauthenticated());

        // Set flag that user was logged out
        sessionStorage.setItem("just_logged_out", "true");

        // Redirect to login page
        window.location.href = `${FRONTEND_URL}/login`;
      });
  }, [status, dispatch]);

  // Handle logout
  const handleLogout = async () => {
    console.log("[useAuth] Logging out...");

    // Set flag BEFORE calling backend
    sessionStorage.setItem("just_logged_out", "true");

    try {
      await logout();
      console.log("[useAuth] ✅ Logout successful");
    } catch (err) {
      console.error("[useAuth] Logout API error:", err.message);
    } finally {
      // Clear all local storage
      localStorage.clear();

      // Dispatch logout action
      dispatch(setUnauthenticated());

      // Redirect to login page
      window.location.href = `${FRONTEND_URL}/login`;
    }
  };

  return { user, status, handleLogout };
}