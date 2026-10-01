import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import type { AlarmExportRow } from "./queries";

const HEADER = [
  "Alarm code",
  "Machine ID",
  "Machine name",
  "Description",
  "Occurred at",
  "Status",
  "Cause",
  "Action taken",
  "Created by",
  "Closed by",
  "Closed at",
];

// CSV text for the alarm export (plan 9.4, TC-BNS-04). Times are shown in
// Bangkok time like the list page.
export function alarmsToCsv(rows: readonly AlarmExportRow[]): string {
  return toCsv(
    HEADER,
    rows.map((alarm) => [
      alarm.alarm_code,
      alarm.machine?.machine_code,
      alarm.machine?.name,
      alarm.description,
      formatDateTime(alarm.occurred_at),
      alarm.status,
      alarm.cause,
      alarm.action_taken,
      alarm.creator?.full_name,
      alarm.closer?.full_name,
      alarm.closed_at ? formatDateTime(alarm.closed_at) : "",
    ]),
  );
}
