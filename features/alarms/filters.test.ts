import { describe, expect, it } from "vitest";
import { alarmFiltersQuery, hasActiveAlarmFilters, parseAlarmFilters } from "./filters";

const machine = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";

describe("parseAlarmFilters", () => {
  it("returns defaults for an empty URL", () => {
    expect(parseAlarmFilters({})).toEqual({
      machine: undefined,
      status: undefined,
      code: "",
      from: undefined,
      to: undefined,
      invalidRange: false,
      page: 1,
    });
  });

  it("reads every filter", () => {
    expect(
      parseAlarmFilters({ machine, status: "In Progress", code: " e-1 ", page: "2" }),
    ).toEqual({ machine, status: "In Progress", code: "e-1", from: undefined, to: undefined, invalidRange: false, page: 2 });
  });

  it("reads a date range and drops dates that are not real", () => {
    expect(parseAlarmFilters({ from: "2026-09-01", to: "2026-09-30" })).toMatchObject({
      from: "2026-09-01",
      to: "2026-09-30",
      invalidRange: false,
    });
    expect(parseAlarmFilters({ from: "2026-02-30", to: "soon" })).toMatchObject({
      from: undefined,
      to: undefined,
    });
  });

  it("marks a range that ends before it starts", () => {
    expect(parseAlarmFilters({ from: "2026-09-30", to: "2026-09-01" }).invalidRange).toBe(true);
  });

  it("drops a machine id that is not a uuid and an unknown status", () => {
    const filters = parseAlarmFilters({ machine: "CNC-001", status: "Done" });
    expect(filters.machine).toBeUndefined();
    expect(filters.status).toBeUndefined();
  });
});

describe("alarmFiltersQuery", () => {
  it("keeps the filters, applies overrides and leaves out page 1", () => {
    const filters = parseAlarmFilters({ machine, status: "Open", page: "3" });

    expect(alarmFiltersQuery(filters)).toBe(`?machine=${machine}&status=Open&page=3`);
    expect(alarmFiltersQuery(filters, { page: 1 })).toBe(`?machine=${machine}&status=Open`);
  });

  it("keeps the date range", () => {
    const filters = parseAlarmFilters({ code: "E", from: "2026-09-01", to: "2026-09-30" });
    expect(alarmFiltersQuery(filters)).toBe("?code=E&from=2026-09-01&to=2026-09-30");
  });

  it("encodes a status with a space", () => {
    expect(alarmFiltersQuery(parseAlarmFilters({ status: "In Progress" }))).toBe(
      "?status=In+Progress",
    );
  });
});

describe("hasActiveAlarmFilters", () => {
  it("ignores the page", () => {
    expect(hasActiveAlarmFilters(parseAlarmFilters({ page: "4" }))).toBe(false);
    expect(hasActiveAlarmFilters(parseAlarmFilters({ code: "E" }))).toBe(true);
    expect(hasActiveAlarmFilters(parseAlarmFilters({ to: "2026-09-30" }))).toBe(true);
  });
});
