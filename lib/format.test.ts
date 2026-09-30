import { describe, expect, it } from "vitest";
import { formatDateTime, fromBangkokInputValue, toBangkokInputValue } from "./format";

describe("formatDateTime", () => {
  it("shows UTC timestamps in Bangkok time", () => {
    // 17:30 UTC is 00:30 the next day in Bangkok (UTC+7).
    expect(formatDateTime("2026-09-29T17:30:00Z")).toBe("30 Sept 2026, 00:30");
  });

  it("accepts a Date", () => {
    expect(formatDateTime(new Date("2026-01-05T03:00:00Z"))).toBe("5 Jan 2026, 10:00");
  });
});

describe("datetime-local values in Bangkok time", () => {
  it("formats a UTC timestamp as a Bangkok datetime-local value", () => {
    expect(toBangkokInputValue("2026-09-29T17:30:00Z")).toBe("2026-09-30T00:30");
  });

  it("reads a datetime-local value as Bangkok time", () => {
    expect(fromBangkokInputValue("2026-09-30T00:30")?.toISOString()).toBe(
      "2026-09-29T17:30:00.000Z",
    );
  });

  it("round-trips", () => {
    const value = "2026-02-28T23:59";
    expect(toBangkokInputValue(fromBangkokInputValue(value)!)).toBe(value);
  });

  it.each(["", "2026-09-30", "2026-13-01T10:00", "not a date"])(
    "returns null for %j",
    (value) => {
      expect(fromBangkokInputValue(value)).toBeNull();
    },
  );
});
