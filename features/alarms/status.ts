import { Constants, type Enums } from "@/types/database";
import type { Role } from "@/features/auth/roles";

export type AlarmStatus = Enums<"alarm_status">;

export const ALARM_STATUSES = Constants.public.Enums.alarm_status;

// BR-ALM-01 and BR-ALM-02. The database trigger enforce_alarm_update_rules
// applies the same rules; this copy lets the app explain a refusal in Thai
// before sending anything, and decide which options to show.
const TRANSITIONS: Record<AlarmStatus, readonly AlarmStatus[]> = {
  Open: ["In Progress", "Closed"],
  "In Progress": ["Open", "Closed"],
  // Only admins may reopen a closed alarm, and only back to Open.
  Closed: ["Open"],
};

export function nextStatuses(current: AlarmStatus, role: Role): AlarmStatus[] {
  if (current === "Closed" && role !== "admin") return [];
  return [...TRANSITIONS[current]];
}

// Whether this user may save changes to an alarm in this status at all
// (status, cause or action taken). Closed alarms are read-only except for admins.
export function canUpdateAlarm(current: AlarmStatus, role: Role): boolean {
  return current !== "Closed" || role === "admin";
}

export function canChangeStatus(
  from: AlarmStatus,
  to: AlarmStatus,
  role: Role,
): boolean {
  if (from === to) return canUpdateAlarm(from, role);
  return nextStatuses(from, role).includes(to);
}
