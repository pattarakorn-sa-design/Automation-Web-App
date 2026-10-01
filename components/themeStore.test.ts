import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { THEME_STORAGE_KEY } from "./theme";
import { CHANGE_EVENT, applyTheme, readTheme, saveTheme, subscribe } from "./themeStore";

// A tiny stand-in for the browser: a window that can fire events, a <html>
// class list, a localStorage and the device colour setting.
function setUpBrowser(options: { deviceDark?: boolean; storageThrows?: boolean } = {}) {
  const classes = new Set<string>();
  const storage = new Map<string, string>();
  const listeners = new Map<string, Set<(event: Event) => void>>();
  const fakeWindow = {
    matchMedia: (query: string) => {
      expect(query).toBe("(prefers-color-scheme: dark)");
      return { matches: Boolean(options.deviceDark) };
    },
    addEventListener: (type: string, listener: (event: Event) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener: (type: string, listener: (event: Event) => void) => {
      listeners.get(type)?.delete(listener);
    },
    dispatchEvent: (event: Event) => {
      listeners.get(event.type)?.forEach((listener) => listener(event));
      return true;
    },
  };
  const fakeStorage = {
    getItem: (key: string) => {
      if (options.storageThrows) throw new Error("blocked");
      return storage.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (options.storageThrows) throw new Error("blocked");
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      if (options.storageThrows) throw new Error("blocked");
      storage.delete(key);
    },
  };
  vi.stubGlobal("window", fakeWindow);
  vi.stubGlobal("localStorage", fakeStorage);
  vi.stubGlobal("document", {
    documentElement: {
      classList: {
        toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name)),
        contains: (name: string) => classes.has(name),
      },
    },
  });

  return {
    isDark: () => classes.has("dark"),
    stored: () => storage.get(THEME_STORAGE_KEY) ?? null,
    listenerCount: (type: string) => listeners.get(type)?.size ?? 0,
    // What another tab does: it changes the storage, and this tab gets an event
    // with the key but without having written anything itself.
    otherTabSets: (value: string | null) => {
      if (value === null) storage.delete(THEME_STORAGE_KEY);
      else storage.set(THEME_STORAGE_KEY, value);
      fakeWindow.dispatchEvent(Object.assign(new Event("storage"), { key: THEME_STORAGE_KEY }));
    },
    // localStorage.clear() in another tab: the storage is empty and the event has no key.
    otherTabClears: () => {
      storage.clear();
      fakeWindow.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
    },
    otherTabFires: (key: string | null) => {
      fakeWindow.dispatchEvent(Object.assign(new Event("storage"), { key }));
    },
    seed: (value: string) => storage.set(THEME_STORAGE_KEY, value),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("a change made in another tab (storage event)", () => {
  let browser: ReturnType<typeof setUpBrowser>;
  let onChange: Mock<() => void>;

  beforeEach(() => {
    browser = setUpBrowser({ deviceDark: false });
    onChange = vi.fn<() => void>();
    subscribe(onChange);
  });

  it("puts the dark class on the page when the other tab chose Dark", () => {
    expect(browser.isDark()).toBe(false);

    browser.otherTabSets("dark");

    expect(browser.isDark()).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("takes the dark class off when the other tab chose Light on a dark page", () => {
    browser.otherTabSets("dark");

    browser.otherTabSets("light");

    expect(browser.isDark()).toBe(false);
  });

  it("follows the device when the other tab went back to System (key removed)", () => {
    browser.otherTabSets("dark");

    browser.otherTabSets(null);

    // The device is light in this setup, so System means light.
    expect(browser.isDark()).toBe(false);
  });

  it("applies System on a dark device as dark", () => {
    const dark = setUpBrowser({ deviceDark: true });
    subscribe(() => {});
    dark.otherTabSets("light");
    expect(dark.isDark()).toBe(false);

    dark.otherTabSets(null);

    expect(dark.isDark()).toBe(true);
  });

  it("follows a cleared storage (no key in the event) back to System", () => {
    browser.otherTabSets("dark");
    expect(browser.isDark()).toBe(true);

    browser.otherTabClears();

    // Nothing is saved any more, so it follows the device, which is light here.
    expect(browser.isDark()).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("ignores a storage event for a different key", () => {
    browser.otherTabFires("something-else");

    expect(browser.isDark()).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stops listening after the unsubscribe", () => {
    const quiet = setUpBrowser();
    const unsubscribe = subscribe(() => {});
    expect(quiet.listenerCount("storage")).toBe(1);
    expect(quiet.listenerCount(CHANGE_EVENT)).toBe(1);

    unsubscribe();

    expect(quiet.listenerCount("storage")).toBe(0);
    expect(quiet.listenerCount(CHANGE_EVENT)).toBe(0);
  });
});

describe("saveTheme (a change made in this tab)", () => {
  it("saves the choice, changes the page and tells the listeners", () => {
    const browser = setUpBrowser({ deviceDark: false });
    const onChange = vi.fn<() => void>();
    subscribe(onChange);

    saveTheme("dark");

    expect(browser.stored()).toBe("dark");
    expect(browser.isDark()).toBe(true);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("removes the key for System and follows the device", () => {
    const browser = setUpBrowser({ deviceDark: true });
    saveTheme("light");
    expect(browser.isDark()).toBe(false);

    saveTheme("system");

    expect(browser.stored()).toBeNull();
    expect(browser.isDark()).toBe(true);
  });

  it("still applies and remembers the choice when storage is blocked", () => {
    const browser = setUpBrowser({ deviceDark: false, storageThrows: true });

    saveTheme("dark");

    expect(browser.isDark()).toBe(true);
    // Storage cannot be read, so the in-memory choice is what the button shows.
    expect(readTheme()).toBe("dark");
  });
});

describe("readTheme and applyTheme", () => {
  it("reads an unknown stored value as System", () => {
    const browser = setUpBrowser();
    browser.seed("purple");

    expect(readTheme()).toBe("system");
  });

  it("applies each theme to the page", () => {
    const browser = setUpBrowser({ deviceDark: true });

    applyTheme("light");
    expect(browser.isDark()).toBe(false);
    applyTheme("dark");
    expect(browser.isDark()).toBe(true);
    applyTheme("system");
    expect(browser.isDark()).toBe(true);
  });
});
