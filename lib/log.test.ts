import { afterEach, describe, expect, it, vi } from "vitest";
import { logLoadError } from "./log";

describe("logLoadError", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs where it happened and the error message", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logLoadError("dashboard", new Error("count alarms.Open failed: timeout"));

    expect(spy).toHaveBeenCalledWith(
      "[load error] dashboard:",
      "count alarms.Open failed: timeout",
    );
  });

  it("logs values that are not Error objects as they are", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logLoadError("machines list", "offline");

    expect(spy).toHaveBeenCalledWith("[load error] machines list:", "offline");
  });
});
