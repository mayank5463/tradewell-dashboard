import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockResetIcon from "@mui/icons-material/LockReset";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import { logout } from "../../redux/slices/authSlice";
import { logout as apiLogout } from "../../services/authService"; // ← ADDED
import { LOGIN_APP_URL, } from "../../utils/constants";
import "./ProfileMenu.css";

export default function ProfileMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const goTo = (path) => {
    setAnchorEl(null);
    navigate(path);
  };

  // ── FIXED: Handle Logout Properly ────────────────────────────────────
  const handleLogout = async () => {
    setAnchorEl(null);

    // Step 1: Set flag so login page doesn't auto-redirect
    sessionStorage.setItem("just_logged_out", "true");

    // Step 2: Clear Redux state immediately
    dispatch(logout());

    // Step 3: Call backend to clear httpOnly cookie
    try {
      await apiLogout();
      console.log("[LOGOUT] ✅ Backend cookie cleared");
    } catch (err) {
      console.warn("[LOGOUT] Backend logout failed:", err.message);
      // Continue anyway - we'll try to clear cookie via redirect
    }

    // Step 4: Clear all local storage
    localStorage.clear();

    // Step 5: Redirect to login page
    window.location.href = LOGIN_APP_URL;
  };

  return (
    <>
      <button
        type="button"
        className="profile-menu__trigger"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Avatar className="profile-menu__avatar">{initials}</Avatar>
        <span className="profile-menu__name">{user?.name ?? "Trader"}</span>
        <KeyboardArrowDownIcon
          className="profile-menu__caret"
          fontSize="small"
        />
      </button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { className: "profile-menu__paper" } }}
      >
        <MenuItem onClick={() => goTo("/account")}>
          <ListItemIcon>
            <PersonOutlineIcon fontSize="small" />
          </ListItemIcon>
          My Account
        </MenuItem>
        <MenuItem onClick={() => goTo("/change-password")}>
          <ListItemIcon>
            <LockResetIcon fontSize="small" />
          </ListItemIcon>
          Change Password
        </MenuItem>
        <MenuItem onClick={() => goTo("/settings")}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} className="profile-menu__logout-item">
          <ListItemIcon>
            <LogoutIcon
              fontSize="small"
              className="profile-menu__logout-icon"
            />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
