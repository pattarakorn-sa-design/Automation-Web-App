import { describe, expect, it } from "vitest";
import { alarmFiltersQuery, hasActiveAlarmFilters, parseAlarmFilters } from "./filters";

const machine = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";

describe("parseAlarmFilters", () => {
  it("returns defaults for an empty URL", () => {
    expect(parseAlarmFilters({})).toEqual({
      machine: undefined,
      status: undefined,
      code: "",
      page: 1,
    });
  });

  it("reads every filter", () => {
    expect(
      parseAlarmFilters({ machine, status: "In Progress", code: " e-1 ", page: "2" }),
    ).toEqual({ machine, status: "In Progress", code: "e-1", page: 2 });
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
  });
});
