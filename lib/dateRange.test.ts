import { describe, expect, it } from "vitest";
import {
  bangkokDayStart,
  dateBounds,
  hasDateRange,
  nextDate,
  parseDateRange,
  timestampBounds,
} from "./dateRange";

describe("parseDateRange", () => {
  it("reads both ends", () => {
    expect(parseDateRange("2026-09-01", "2026-09-30")).toEqual({
      from: "2026-09-01",
      to: "2026-09-30",
      invalidRange: false,
    });
  });

  it("allows one end only and the same day on both ends", () => {
    expect(parseDateRange("2026-09-01", "")).toEqual({
      from: "2026-09-01",
      to: undefined,
      invalidRange: false,
    });
    expect(parseDateRange("2026-09-01", "2026-09-01").invalidRange).toBe(false);
  });

  it("drops values that are not real dates", () => {
    expect(parseDateRange("2026-02-30", "yesterday")).toEqual({
      from: undefined,
      to: undefined,
      invalidRange: false,
    });
  });

  it("keeps the values but marks a range that ends before it starts", () => {
    expect(parseDateRange("2026-09-30", "2026-09-01")).toEqual({
      from: "2026-09-30",
      to: "2026-09-01",
      invalidRange: true,
    });
  });
});

describe("hasDateRange", () => {
  it("is true when either end is set", () => {
    expect(hasDateRange(parseDateRange("", ""))).toBe(false);
    expect(hasDateRange(parseDateRange("", "2026-09-01"))).toBe(true);
  });
});

describe("nextDate", () => {
  it("moves to the next day across months and leap years", () => {
    expect(nextDate("2026-09-30")).toBe("2026-10-01");
    expect(nextDate("2026-12-31")).toBe("2027-01-01");
    expect(nextDate("2028-02-28")).toBe("2028-02-29");
  });
});

describe("bangkokDayStart", () => {
  it("is midnight in Bangkok, 17:00 UTC the day before", () => {
    expect(bangkokDayStart("2026-10-01")).toBe("2026-09-30T17:00:00.000Z");
  });
});

describe("timestampBounds", () => {
  it("covers whole Bangkok days, including the last one", () => {
    expect(timestampBounds(parseDateRange("2026-09-01", "2026-09-30"))).toEqual({
      gte: "2026-08-31T17:00:00.000Z",
      lt: "2026-09-30T17:00:00.000Z",
    });
  });

  it("includes an alarm at 23:59 Bangkok time on the last day", () => {
    const { lt } = timestampBounds(parseDateRange("", "2026-09-30"));
    const lateAlarm = new Date("2026-09-30T23:59:00+07:00").toISOString();
    expect(lateAlarm < lt!).toBe(true);
  });

  it("is empty without a range or with an invalid one", () => {
    expect(timestampBounds(parseDateRange("", ""))).toEqual({ gte: undefined, lt: undefined });
    expect(timestampBounds(parseDateRange("2026-09-30", "2026-09-01"))).toEqual({});
  });
});

describe("dateBounds", () => {
  it("keeps the dates as they are, both ends included", () => {
    expect(dateBounds(parseDateRange("2026-09-01", "2026-09-30"))).toEqual({
      gte: "2026-09-01",
      lte: "2026-09-30",
    });
  });

  it("is empty with an invalid range", () => {
    expect(dateBounds(parseDateRange("2026-09-30", "2026-09-01"))).toEqual({});
  });
});
