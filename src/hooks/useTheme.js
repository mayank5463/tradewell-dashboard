



// hooks/useTheme.js
// Advanced theme management with Redux + localStorage persistence.
// Default: Navy + Light. Remembers user selection across sessions.

import { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  setColorTheme as setColorThemeAction, 
  setMode as setModeAction, 
  toggleMode as toggleModeAction 
} from "../redux/slices/uiSlice";

const THEMES = ["navy", "olive", "charcoal", "sand"];
const MODES = ["light", "dark"];

const STORAGE_KEYS = {
  theme: "app-theme",
  mode: "app-mode",
};

function safeGetStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value || fallback;
  } catch (e) {
    return fallback;
  }
}

function safeSetStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`[useTheme] Could not save ${key}:`, e);
  }
}

export function useTheme() {
  const dispatch = useDispatch();
  const colorTheme = useSelector((state) => state.ui.colorTheme);
  const mode = useSelector((state) => state.ui.mode);

  // ── Initialize from localStorage (or defaults) ─────────────────────
  useEffect(() => {
    const storedTheme = safeGetStorage(STORAGE_KEYS.theme, "navy");
    const storedMode = safeGetStorage(STORAGE_KEYS.mode, "light");

    if (THEMES.includes(storedTheme) && storedTheme !== colorTheme) {
      dispatch(setColorThemeAction(storedTheme));
    }

    if (MODES.includes(storedMode) && storedMode !== mode) {
      dispatch(setModeAction(storedMode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save to localStorage when values change ────────────────────────
  useEffect(() => {
    safeSetStorage(STORAGE_KEYS.theme, colorTheme);
    safeSetStorage(STORAGE_KEYS.mode, mode);
  }, [colorTheme, mode]);

  // ── Apply to document element ──────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", colorTheme);
    document.documentElement.setAttribute("data-mode", mode);
    document.documentElement.style.colorScheme = mode;
  }, [colorTheme, mode]);

  // ── Action creators with validation ────────────────────────────────
  const setColorTheme = useCallback((key) => {
    if (THEMES.includes(key)) {
      dispatch(setColorThemeAction(key));
    } else {
      console.warn(`[useTheme] Invalid theme key: ${key}`);
    }
  }, [dispatch]);

  const setMode = useCallback((m) => {
    if (MODES.includes(m)) {
      dispatch(setModeAction(m));
    } else {
      console.warn(`[useTheme] Invalid mode: ${m}`);
    }
  }, [dispatch]);

  const toggleMode = useCallback(() => {
    dispatch(toggleModeAction());
  }, [dispatch]);

  // ── Derived values ────────────────────────────────────────────────
  const isDark = mode === "dark";
  const isLight = mode === "light";
  
  const themeInfo = useMemo(() => ({
    navy: { label: "Navy", color: "#2563eb", darkColor: "#3b82f6" },
    olive: { label: "Olive", color: "#728a39", darkColor: "#a3e635" },
    charcoal: { label: "Charcoal", color: "#374151", darkColor: "#fafafa" },
    sand: { label: "Sand", color: "#b67942", darkColor: "#f59e0b" },
  }), []);

  const currentThemeInfo = themeInfo[colorTheme] || themeInfo.navy;
  const activeColor = isDark ? currentThemeInfo.darkColor : currentThemeInfo.color;

  return { 
    colorTheme,
    setColorTheme,
    mode,
    setMode,
    toggleMode,
    isDark,
    isLight,
    currentThemeInfo,
    activeColor,
    themeLabel: currentThemeInfo.label,
  };
}