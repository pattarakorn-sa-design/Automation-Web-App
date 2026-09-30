import { describe, expect, it } from "vitest";
import { formatDateTime } from "./format";

describe("formatDateTime", () => {
  it("shows UTC timestamps in Bangkok time", () => {
    // 17:30 UTC is 00:30 the next day in Bangkok (UTC+7).
    expect(formatDateTime("2026-09-29T17:30:00Z")).toBe("30 Sept 2026, 00:30");
  });

  it("accepts a Date", () => {
    expect(formatDateTime(new Date("2026-01-05T03:00:00Z"))).toBe("5 Jan 2026, 10:00");
  });
});
