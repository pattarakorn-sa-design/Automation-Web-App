import { describe, expect, it } from "vitest";
import { buildSummary } from "./summary";

// The counts the seed data produces (US-07, TC-DSH-01).
const seed = {
  machines: { Running: 6, Stop: 2, Alarm: 1, Maintenance: 1 },
  alarms: { Open: 3, "In Progress": 2, Closed: 4 },
  maintenance: { Pending: 2, "In Progress": 2, Completed: 4 },
};

describe("buildSummary", () => {
  it("totals machines and keeps the count per status (REQ-DSH-01, 02)", () => {
    const summary = buildSummary(seed);

    expect(summary.machines.total).toBe(10);
    expect(summary.machines.byStatus).toEqual(seed.machines);
  });

  it("counts open plus in-progress alarms as not closed (REQ-DSH-03)", () => {
    const summary = buildSummary(seed);

    expect(summary.alarms.open).toBe(5);
    expect(summary.alarms.total).toBe(9);
  });

  it("counts pending plus in-progress work as unfinished (REQ-DSH-04)", () => {
    const summary = buildSummary(seed);

    expect(summary.maintenance.unfinished).toBe(4);
    expect(summary.maintenance.total).toBe(8);
  });

  it("drops by one when an alarm is closed (TC-DSH-04)", () => {
    const after = buildSummary({
      ...seed,
      alarms: { Open: 2, "In Progress": 2, Closed: 5 },
    });

    expect(after.alarms.open).toBe(buildSummary(seed).alarms.open - 1);
    expect(after.alarms.total).toBe(9);
  });

  it("handles an empty database", () => {
    const summary = buildSummary({
      machines: { Running: 0, Stop: 0, Alarm: 0, Maintenance: 0 },
      alarms: { Open: 0, "In Progress": 0, Closed: 0 },
      maintenance: { Pending: 0, "In Progress": 0, Completed: 0 },
    });

    expect(summary.machines.total).toBe(0);
    expect(summary.alarms.open).toBe(0);
    expect(summary.maintenance.unfinished).toBe(0);
  });
});
