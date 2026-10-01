import { toCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import type { MaintenanceExportRow } from "./queries";

const HEADER = [
  "Machine ID",
  "Machine name",
  "Alarm code",
  "Type",
  "Problem",
  "Action taken",
  "Status",
  "Technician",
  "Start date",
  "End date",
];

// CSV text for the maintenance export (plan 9.4, TC-BNS-04). The dates are
// date columns without a time zone, shown the same way as on the list page.
export function maintenanceToCsv(rows: readonly MaintenanceExportRow[]): string {
  return toCsv(
    HEADER,
    rows.map((record) => [
      record.machine?.machine_code,
      record.machine?.name,
      record.alarm?.alarm_code,
      record.type,
      record.problem,
      record.action_taken,
      record.status,
      record.technician?.full_name,
      formatDate(record.start_date),
      record.end_date ? formatDate(record.end_date) : "",
    ]),
  );
}
