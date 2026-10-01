// Light / dark mode (plan 9.5). The theme is a class on <html>: `dark` turns on
// the dark styles (see `@custom-variant dark` in app/globals.css). The user
// picks Light, Dark or System; System follows the device setting.

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];

// localStorage key. A missing or unknown value means "System".
export const THEME_STORAGE_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

// The theme a stored value stands for. Anything unknown is System.
export function parseTheme(value: string | null | undefined): Theme {
  return isTheme(value) ? value : "system";
}

// The next theme when the button is pressed: Light, Dark, System, Light, ...
export function nextTheme(theme: Theme): Theme {
  return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
}

// Whether the page is dark for a chosen theme and the device setting.
export function isDark(theme: Theme, systemPrefersDark: boolean): boolean {
  return theme === "dark" || (theme === "system" && systemPrefersDark);
}

export const THEME_LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

// Runs in <head>, before the first paint, so a saved dark theme never shows a
// white page first (see "preventing flash before hydration" in the Next.js
// docs). It must not depend on anything else in this file: it is inlined as
// plain text. Reading localStorage is wrapped on its own, because it throws
// when site data is blocked and the device setting should still apply then.
export const themeInitScript = `(function(){var t=null;try{t=localStorage.getItem("${THEME_STORAGE_KEY}")}catch(e){}var d=t==="dark"||(t!=="light"&&!!window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")})()`;
