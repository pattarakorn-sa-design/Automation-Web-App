import { describe, expect, it } from "vitest";
import {
  containsPattern,
  hasActiveFilters,
  machineFiltersQuery,
  pageCount,
  pageRange,
  parseMachineFilters,
} from "./filters";

describe("parseMachineFilters", () => {
  it("returns defaults for an empty URL", () => {
    expect(parseMachineFilters({})).toEqual({
      q: "",
      status: undefined,
      type: undefined,
      page: 1,
    });
  });

  it("reads and trims every filter", () => {
    expect(
      parseMachineFilters({ q: " cnc ", status: "Alarm", type: " Robot ", page: "3" }),
    ).toEqual({ q: "cnc", status: "Alarm", type: "Robot", page: 3 });
  });

  it("drops a status that does not exist", () => {
    expect(parseMachineFilters({ status: "Broken" }).status).toBeUndefined();
  });

  it.each(["0", "-2", "abc", ""])("falls back to page 1 for %j", (page) => {
    expect(parseMachineFilters({ page }).page).toBe(1);
  });

  it("uses the first value when a parameter repeats", () => {
    expect(parseMachineFilters({ q: ["a", "b"] }).q).toBe("a");
  });

  it("limits the search text to 50 characters", () => {
    expect(parseMachineFilters({ q: "x".repeat(80) }).q).toHaveLength(50);
  });
});

describe("hasActiveFilters", () => {
  it("is false with no filters and true when any filter is set", () => {
    expect(hasActiveFilters(parseMachineFilters({ page: "2" }))).toBe(false);
    expect(hasActiveFilters(parseMachineFilters({ type: "Robot" }))).toBe(true);
  });
});

describe("machineFiltersQuery", () => {
  const filters = parseMachineFilters({ q: "cnc", status: "Running", page: "2" });

  it("keeps the filters and the page", () => {
    expect(machineFiltersQuery(filters)).toBe("?q=cnc&status=Running&page=2");
  });

  it("applies overrides and leaves out page 1", () => {
    expect(machineFiltersQuery(filters, { page: 1 })).toBe("?q=cnc&status=Running");
  });

  it("returns an empty string when nothing is set", () => {
    expect(machineFiltersQuery(parseMachineFilters({}))).toBe("");
  });
});

describe("containsPattern", () => {
  it("wraps the text for a contains match", () => {
    expect(containsPattern("CNC")).toBe("%CNC%");
  });

  it("removes wildcard and filter-syntax characters", () => {
    expect(containsPattern("a%b_c,d(e)f*g\"h\\i")).toBe("%abcdefghi%");
  });

  it("returns an empty string when nothing is left to search", () => {
    expect(containsPattern("%,()")).toBe("");
  });
});

describe("pagination", () => {
  it("counts at least one page", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(20)).toBe(1);
    expect(pageCount(21)).toBe(2);
  });

  it("returns an inclusive row range", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 19 });
    expect(pageRange(3)).toEqual({ from: 40, to: 59 });
  });
});
