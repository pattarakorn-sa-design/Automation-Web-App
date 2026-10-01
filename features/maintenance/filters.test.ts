import { describe, expect, it } from "vitest";
import {
  hasActiveMaintenanceFilters,
  maintenanceFiltersQuery,
  parseMaintenanceFilters,
} from "./filters";

const machine = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";
const technician = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

describe("parseMaintenanceFilters", () => {
  it("returns defaults for an empty URL", () => {
    expect(parseMaintenanceFilters({})).toEqual({
      machine: undefined,
      status: undefined,
      technician: undefined,
      from: undefined,
      to: undefined,
      invalidRange: false,
      page: 1,
    });
  });

  it("reads every filter", () => {
    expect(
      parseMaintenanceFilters({ machine, status: "Completed", technician, page: "2" }),
    ).toEqual({ machine, status: "Completed", technician, from: undefined, to: undefined, invalidRange: false, page: 2 });
  });

  it("reads a start date range and marks one that ends before it starts", () => {
    expect(parseMaintenanceFilters({ from: "2026-09-01", to: "2026-09-30" })).toMatchObject({
      from: "2026-09-01",
      to: "2026-09-30",
      invalidRange: false,
    });
    expect(
      parseMaintenanceFilters({ from: "2026-09-30", to: "2026-09-01" }).invalidRange,
    ).toBe(true);
  });

  it("drops ids that are not uuids and unknown statuses", () => {
    expect(
      parseMaintenanceFilters({ machine: "CNC-001", technician: "me", status: "Done" }),
    ).toEqual({ machine: undefined, status: undefined, technician: undefined, from: undefined, to: undefined, invalidRange: false, page: 1 });
  });
});

describe("maintenanceFiltersQuery", () => {
  it("keeps the filters, applies overrides and leaves out page 1", () => {
    const filters = parseMaintenanceFilters({ technician, status: "In Progress", page: "2" });

    expect(maintenanceFiltersQuery(filters)).toBe(
      `?status=In+Progress&technician=${technician}&page=2`,
    );
    expect(maintenanceFiltersQuery(filters, { page: 1 })).toBe(
      `?status=In+Progress&technician=${technician}`,
    );
  });

  it("keeps the date range", () => {
    const filters = parseMaintenanceFilters({ from: "2026-09-01", to: "2026-09-30" });
    expect(maintenanceFiltersQuery(filters)).toBe("?from=2026-09-01&to=2026-09-30");
  });
});

describe("hasActiveMaintenanceFilters", () => {
  it("ignores the page", () => {
    expect(hasActiveMaintenanceFilters(parseMaintenanceFilters({ page: "3" }))).toBe(false);
    expect(hasActiveMaintenanceFilters(parseMaintenanceFilters({ technician }))).toBe(true);
    expect(
      hasActiveMaintenanceFilters(parseMaintenanceFilters({ from: "2026-09-01" })),
    ).toBe(true);
  });
});
