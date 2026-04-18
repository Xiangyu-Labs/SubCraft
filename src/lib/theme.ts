export type ThemeName = "modern" | "anthropic";

export interface ThemeConfig {
  name: ThemeName;
  label: string;
  description: string;
}

export const THEMES: ThemeConfig[] = [
  {
    name: "modern",
    label: "Modern",
    description: "Clean, modern UI inspired by OpenAI",
  },
  {
    name: "anthropic",
    label: "Anthropic",
    description: "Warm, classic design inspired by Anthropic",
  },
];

export const STORAGE_KEY_THEME = "app-theme";
export const STORAGE_KEY_DARK = "app-dark-mode";
const THEME_CHANGE_EVENT = "themechange";

export function getStoredTheme(): ThemeName {
  if (typeof window === "undefined") return "modern";
  return (localStorage.getItem(STORAGE_KEY_THEME) as ThemeName) || "modern";
}

export function getStoredDarkMode(): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY_DARK);
  if (stored === null) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  return stored === "true";
}

export function applyTheme(theme: ThemeName, isDark: boolean) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function saveTheme(theme: ThemeName, isDark: boolean) {
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  localStorage.setItem(STORAGE_KEY_DARK, String(isDark));
  applyTheme(theme, isDark);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function subscribeTheme(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}
