// The saved theme, read and written in the browser. ThemeToggle uses it through
// `useSyncExternalStore`; it lives here, without React, so it can be tested.
import { THEME_STORAGE_KEY, isDark, parseTheme, type Theme } from "./theme";

// Same-tab changes are announced with this event; other tabs fire `storage`.
export const CHANGE_EVENT = "themechange";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

// Used only when localStorage is blocked, so the button still shows what the
// page is doing instead of staying on System.
let fallbackTheme: Theme = "system";

export function readTheme(): Theme {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return fallbackTheme;
  }
}

// Puts the page in line with a theme: the `dark` class on <html>.
export function applyTheme(theme: Theme) {
  const dark = isDark(theme, window.matchMedia(DARK_QUERY).matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function saveTheme(theme: Theme) {
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

// `onChange` is told whenever the saved theme may have changed. A change made
// in another tab arrives as a `storage` event. The page has to follow it, not
// only the button: nothing else puts the `dark` class on <html> in this tab.
// `key` is null when the whole storage was cleared.
export function subscribe(onChange: () => void) {
  const onStorage = (event: Event) => {
    const key = (event as StorageEvent).key;
    if (key !== null && key !== THEME_STORAGE_KEY) return;
    applyTheme(readTheme());
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}
