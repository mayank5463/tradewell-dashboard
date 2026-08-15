// hooks/useTheme.js
// Two independent pieces of state now, both in Redux (ui.colorTheme,
// ui.mode) — no localStorage (matches the existing security posture).
// colorTheme is set ONLY from SettingsPage. mode is toggled from the
// navbar icon, and can be flipped from anywhere in the app.

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setColorTheme as setColorThemeAction, setMode as setModeAction, toggleMode as toggleModeAction } from "../redux/slices/uiSlice";

export function useTheme() {
  const dispatch = useDispatch();
  const colorTheme = useSelector((state) => state.ui.colorTheme); // "navy" | "olive" | "charcoal" | "sand"
  const mode = useSelector((state) => state.ui.mode); // "light" | "dark"

  // One-time OS-preference check for MODE only — color theme always
  // starts at "navy" regardless of OS settings, since there's no OS
  // signal for "which of 4 brand palettes do you want."
  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    if (prefersDark && mode !== "dark") {
      dispatch(setModeAction("dark"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
    document.documentElement.dataset.mode = mode;
  }, [colorTheme, mode]);

  const setColorTheme = (key) => dispatch(setColorThemeAction(key));
  const setMode = (m) => dispatch(setModeAction(m));
  const toggleMode = () => dispatch(toggleModeAction());

  return { colorTheme, setColorTheme, mode, setMode, toggleMode, isDark: mode === "dark" };
}