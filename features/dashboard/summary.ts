import type { AlarmStatus } from "@/features/alarms/status";
import type { MaintenanceStatus } from "@/features/maintenance/rules";
import type { Enums } from "@/types/database";

type MachineStatus = Enums<"machine_status">;

// Row counts per status, each counted by the database (NFR-PERF-02).
export type StatusCounts = {
  machines: Record<MachineStatus, number>;
  alarms: Record<AlarmStatus, number>;
  maintenance: Record<MaintenanceStatus, number>;
};

function sum(counts: Record<string, number>): number {
  return Object.values(counts).reduce((total, count) => total + count, 0);
}

// The numbers the dashboard shows (REQ-DSH-01 to REQ-DSH-04). Every status is
// a database enum, so the per-status counts always add up to the total.
export function buildSummary(counts: StatusCounts) {
  return {
    machines: { total: sum(counts.machines), byStatus: counts.machines },
    alarms: {
      total: sum(counts.alarms),
      // Not closed yet: still needs someone's attention (REQ-DSH-03).
      open: counts.alarms.Open + counts.alarms["In Progress"],
      byStatus: counts.alarms,
    },
    maintenance: {
      total: sum(counts.maintenance),
      // Not finished yet (REQ-DSH-04).
      unfinished: counts.maintenance.Pending + counts.maintenance["In Progress"],
      byStatus: counts.maintenance,
    },
  };
}

export type DashboardSummary = ReturnType<typeof buildSummary>;
