export type Theme = "light" | "dark";

const KEYS = {
  theme: "steadyhand_theme",
  hardMode: "steadyhand_hard_mode",
  dailyDone: "steadyhand_daily_done",
} as const;

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(KEYS.theme);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function setTheme(theme: Theme) {
  localStorage.setItem(KEYS.theme, theme);
  document.documentElement.dataset.theme = theme;
}

export function getHardMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEYS.hardMode) === "1";
}

export function setHardMode(enabled: boolean) {
  localStorage.setItem(KEYS.hardMode, enabled ? "1" : "0");
}

export function getLocalDailyDone(date: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(`${KEYS.dailyDone}_${date}`) === "1";
}

export function setLocalDailyDone(date: string) {
  localStorage.setItem(`${KEYS.dailyDone}_${date}`, "1");
}

export function clearLocalDailyDone(date: string) {
  localStorage.removeItem(`${KEYS.dailyDone}_${date}`);
}
