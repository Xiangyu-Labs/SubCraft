"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Moon, Sun, Palette } from "lucide-react";
import {
  type ThemeName,
  THEMES,
  getStoredTheme,
  getStoredDarkMode,
  saveTheme,
  subscribeTheme,
} from "@/lib/theme";

export function ThemeSwitcher() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getStoredTheme,
    () => "modern"
  );
  const isDark = useSyncExternalStore(
    subscribeTheme,
    getStoredDarkMode,
    () => false
  );

  const handleThemeChange = useCallback((newTheme: ThemeName) => {
    saveTheme(newTheme, getStoredDarkMode());
  }, []);

  const handleToggleDark = useCallback(() => {
    saveTheme(getStoredTheme(), !getStoredDarkMode());
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <div className="relative">
        <select
          value={theme}
          onChange={(e) => handleThemeChange(e.target.value as ThemeName)}
          className="h-9 appearance-none rounded-md border bg-transparent px-3 pr-8 text-sm outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          {THEMES.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label}
            </option>
          ))}
        </select>
        <Palette
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
      </div>

      <button
        onClick={handleToggleDark}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--muted)",
        }}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
