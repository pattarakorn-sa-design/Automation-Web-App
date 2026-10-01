import { describe, expect, it } from "vitest";
import {
  THEME_STORAGE_KEY,
  isDark,
  isTheme,
  nextTheme,
  parseTheme,
  themeInitScript,
} from "./theme";

describe("parseTheme and isTheme", () => {
  it("accepts the three themes", () => {
    for (const theme of ["light", "dark", "system"]) {
      expect(isTheme(theme)).toBe(true);
      expect(parseTheme(theme)).toBe(theme);
    }
  });

  it("treats a missing or unknown value as System", () => {
    expect(parseTheme(null)).toBe("system");
    expect(parseTheme(undefined)).toBe("system");
    expect(parseTheme("")).toBe("system");
    expect(parseTheme("purple")).toBe("system");
    expect(isTheme("purple")).toBe(false);
    expect(isTheme(42)).toBe(false);
  });
});

describe("nextTheme", () => {
  it("cycles Light, Dark, System and back to Light", () => {
    expect(nextTheme("light")).toBe("dark");
    expect(nextTheme("dark")).toBe("system");
    expect(nextTheme("system")).toBe("light");
  });
});

describe("isDark", () => {
  it("follows the device only in System mode", () => {
    expect(isDark("system", true)).toBe(true);
    expect(isDark("system", false)).toBe(false);
  });

  it("ignores the device when Light or Dark is chosen", () => {
    expect(isDark("dark", false)).toBe(true);
    expect(isDark("light", true)).toBe(false);
  });
});

// Runs the inline script with a fake page, the way the browser would.
function runInitScript(options: {
  stored?: string | null;
  storageThrows?: boolean;
  deviceDark?: boolean;
  noMatchMedia?: boolean;
}) {
  const classes = new Set<string>();
  const document = { documentElement: { classList: { add: (name: string) => classes.add(name) } } };
  const localStorage = {
    getItem: (key: string) => {
      if (options.storageThrows) throw new Error("blocked");
      expect(key).toBe(THEME_STORAGE_KEY);
      return options.stored ?? null;
    },
  };
  const window = options.noMatchMedia
    ? {}
    : {
        matchMedia: (query: string) => {
          expect(query).toBe("(prefers-color-scheme: dark)");
          return { matches: Boolean(options.deviceDark) };
        },
      };

  new Function("document", "localStorage", "window", themeInitScript)(document, localStorage, window);
  return classes.has("dark");
}

describe("themeInitScript (runs before the first paint)", () => {
  it("turns dark on for a saved Dark choice, even on a light device", () => {
    expect(runInitScript({ stored: "dark", deviceDark: false })).toBe(true);
  });

  it("stays light for a saved Light choice, even on a dark device", () => {
    expect(runInitScript({ stored: "light", deviceDark: true })).toBe(false);
  });

  it("follows the device when nothing is saved", () => {
    expect(runInitScript({ stored: null, deviceDark: true })).toBe(true);
    expect(runInitScript({ stored: null, deviceDark: false })).toBe(false);
  });

  it("follows the device for a saved System choice or an unknown value", () => {
    expect(runInitScript({ stored: "system", deviceDark: true })).toBe(true);
    expect(runInitScript({ stored: "banana", deviceDark: true })).toBe(true);
    expect(runInitScript({ stored: "banana", deviceDark: false })).toBe(false);
  });

  it("still follows the device when site data is blocked (localStorage throws)", () => {
    expect(runInitScript({ storageThrows: true, deviceDark: true })).toBe(true);
    expect(runInitScript({ storageThrows: true, deviceDark: false })).toBe(false);
  });

  it("does not throw when matchMedia is missing", () => {
    expect(runInitScript({ stored: null, noMatchMedia: true })).toBe(false);
    expect(runInitScript({ stored: "dark", noMatchMedia: true })).toBe(true);
  });

  it("is a single self-contained function call", () => {
    expect(themeInitScript.startsWith("(function(){")).toBe(true);
    expect(themeInitScript.endsWith("})()")).toBe(true);
    expect(themeInitScript).not.toContain("import ");
  });
});
