import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Most alarms one machine can offer in the "caused by alarm" select. Older
// ones are left out; an alarm already linked to a record is always kept.
export const ALARM_OPTIONS_LIMIT = 200;

const COLUMNS = "id, machine_id, alarm_code, occurred_at, status";

// Alarms of one machine, newest first, as choices for a maintenance record
// (REQ-MNT-03, BR-MNT-03). Shared by the server (first page load) and the
// browser (when the user picks another machine), so both apply the same rules.
// Reading alarms is allowed for every signed-in user by RLS.
export async function fetchAlarmOptions(
  supabase: SupabaseClient<Database>,
  machineId: string,
) {
  const { data, error } = await supabase
    .from("alarms")
    .select(COLUMNS)
    .eq("machine_id", machineId)
    .order("occurred_at", { ascending: false })
    .limit(ALARM_OPTIONS_LIMIT);
  if (error) throw new Error(`fetchAlarmOptions failed: ${error.message}`);
  return data;
}

export type AlarmOption = Awaited<ReturnType<typeof fetchAlarmOptions>>[number];

// Adds the alarm already linked to a record when it is older than the ones
// fetched, so editing a record never loses its link.
export function withLinkedAlarm(
  options: AlarmOption[],
  linked: AlarmOption | null,
): AlarmOption[] {
  if (!linked || options.some((alarm) => alarm.id === linked.id)) return options;
  return [...options, linked];
}

export async function fetchLinkedAlarm(
  supabase: SupabaseClient<Database>,
  alarmId: string,
): Promise<AlarmOption | null> {
  const { data } = await supabase
    .from("alarms")
    .select(COLUMNS)
    .eq("id", alarmId)
    .maybeSingle();
  return data;
}
