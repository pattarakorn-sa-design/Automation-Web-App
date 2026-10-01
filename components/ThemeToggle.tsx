"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  THEME_LABELS,
  THEME_STORAGE_KEY,
  isDark,
  nextTheme,
  parseTheme,
  type Theme,
} from "./theme";

// Same-tab changes are announced with this event; other tabs fire `storage`.
const CHANGE_EVENT = "themechange";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// Used only when localStorage is blocked, so the button still shows what the
// page is doing instead of staying on System.
let fallbackTheme: Theme = "system";

function readTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return fallbackTheme;
  }
}

function applyTheme(theme: Theme) {
  const dark = isDark(theme, window.matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
}

function saveTheme(theme: Theme) {
  fallbackTheme = theme;
  try {
    // System is "no choice made", so it removes the key.
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Blocked storage: the choice only lasts until the page is reloaded.
  }
  applyTheme(theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// The server cannot know the saved theme, so it renders System. The browser
// reads the real value right after hydration. The page itself is already
// correct by then: the inline script in app/layout.tsx sets it before painting.
const serverTheme = (): Theme => "system";

function Icon({ theme }: { theme: Theme }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className: "h-5 w-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (theme === "light") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (theme === "dark") {
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

// Button that cycles Light, Dark and System (plan 9.5). The accessible name
// says the current mode and what the next press does, so it is not only an icon.
export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const next = nextTheme(theme);

  // In System mode the page has to follow the device when its setting changes
  // while the page is open.
  useEffect(() => {
    if (theme !== "system") return;
    const query = window.matchMedia(DARK_QUERY);
    const follow = () => applyTheme("system");
    query.addEventListener("change", follow);
    return () => query.removeEventListener("change", follow);
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => saveTheme(next)}
      aria-label={`Theme: ${THEME_LABELS[theme]}. Switch to ${THEME_LABELS[next]}`}
      title={`Theme: ${THEME_LABELS[theme]}. Switch to ${THEME_LABELS[next]}`}
      className={`inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 lg:px-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800${className ? ` ${className}` : ""}`}
    >
      <Icon theme={theme} />
      {/* The word is shown in the folded menu; the wide bar keeps just the icon. */}
      <span className="lg:sr-only">Theme: {THEME_LABELS[theme]}</span>
    </button>
  );
}
