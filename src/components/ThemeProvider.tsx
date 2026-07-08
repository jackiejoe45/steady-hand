"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getHardMode,
  getTheme,
  setHardMode as persistHardMode,
  setTheme as persistTheme,
  type Theme,
} from "@/lib/preferences";

interface PreferencesContextValue {
  theme: Theme;
  hardMode: boolean;
  setTheme: (theme: Theme) => void;
  setHardMode: (enabled: boolean) => void;
  ready: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hardMode, setHardModeState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialTheme = getTheme();
    const initialHardMode = getHardMode();
    setThemeState(initialTheme);
    setHardModeState(initialHardMode);
    document.documentElement.dataset.theme = initialTheme;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        theme === "light" ? "#f5f2ec" : "#0b0b0a",
      );
    }
  }, [theme, ready]);

  const setTheme = useCallback((next: Theme) => {
    persistTheme(next);
    setThemeState(next);
  }, []);

  const setHardMode = useCallback((enabled: boolean) => {
    persistHardMode(enabled);
    setHardModeState(enabled);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ theme, hardMode, setTheme, setHardMode, ready }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within ThemeProvider");
  }
  return ctx;
}
