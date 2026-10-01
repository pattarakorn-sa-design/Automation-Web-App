import "server-only";
import { z } from "zod";
import { containsPattern, pageRange } from "@/features/machines/filters";
import { timestampBounds } from "@/lib/dateRange";
import { fetchExportRows } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";
import type { AlarmFilters } from "./filters";
import {
  fetchAlarmOptions,
  fetchLinkedAlarm,
  withLinkedAlarm,
  type AlarmOption,
} from "./options";

// One page of alarms, newest first, with the machine for each row and the
// total counted by the database (NFR-PERF-02). Throws when the query fails so
// the page can show its error state.
export async function listAlarms(filters: AlarmFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("alarms")
    .select(
      "id, alarm_code, description, occurred_at, status, machine:machines!alarms_machine_id_fkey(id, machine_code, name)",
      { count: "exact" },
    )
    .order("occurred_at", { ascending: false })
    .range(from, to);

  if (filters.machine) query = query.eq("machine_id", filters.machine);
  if (filters.status) query = query.eq("status", filters.status);
  const pattern = containsPattern(filters.code);
  if (pattern) query = query.ilike("alarm_code", pattern);
  const occurred = timestampBounds(filters);
  if (occurred.gte) query = query.gte("occurred_at", occurred.gte);
  if (occurred.lt) query = query.lt("occurred_at", occurred.lt);

  const { data, count, error } = await query;
  // PGRST103: the page is past the last row. Treat it as an empty page.
  if (error?.code === "PGRST103") return { alarms: [], total: count ?? 0 };
  if (error) throw new Error(`listAlarms failed: ${error.message}`);
  return { alarms: data, total: count ?? 0 };
}

export type AlarmListItem = Awaited<ReturnType<typeof listAlarms>>["alarms"][number];

// Alarms of one machine as choices for the "caused by alarm" field of a
// maintenance record, for the first page load. The form loads the alarms of
// another machine itself when the user changes it. Pass the alarm already
// linked to a record so it stays selectable when it is older.
export async function listAlarmOptions(
  machineId: string | null,
  includeId?: string | null,
): Promise<AlarmOption[]> {
  if (!machineId) return [];
  const supabase = await createClient();
  const options = await fetchAlarmOptions(supabase, machineId);
  if (!includeId) return options;

  const linked = await fetchLinkedAlarm(supabase, includeId);
  return withLinkedAlarm(options, linked?.machine_id === machineId ? linked : null);
}

// One alarm with its machine and the names of who created and closed it.
// Null when the id is not a valid uuid or no row exists.
export async function getAlarm(id: string) {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alarms")
    .select(
      `id, machine_id, alarm_code, description, occurred_at, cause, action_taken,
       status, closed_at, created_at, updated_at,
       machine:machines!alarms_machine_id_fkey(id, machine_code, name),
       creator:profiles!alarms_created_by_fkey(full_name),
       closer:profiles!alarms_closed_by_fkey(full_name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getAlarm failed: ${error.message}`);
  return data;
}

export type Alarm = NonNullable<Awaited<ReturnType<typeof getAlarm>>>;

// Every alarm matching the list filters, newest first, for the CSV export
// (plan 9.4). Same filters and order as listAlarms but without pages, capped
// at EXPORT_ROW_LIMIT rows; `truncated` is true when more rows matched. Read
// in pages of EXPORT_PAGE_SIZE rows, with `id` as the last sort key so the
// order cannot change between pages (issue #42). Throws when the query fails.
export async function exportAlarms(filters: AlarmFilters) {
  const supabase = await createClient();

  return fetchExportRows(async (from, to) => {
    let query = supabase
      .from("alarms")
      .select(
        `id, alarm_code, description, occurred_at, cause, action_taken, status, closed_at,
         machine:machines!alarms_machine_id_fkey(machine_code, name),
         creator:profiles!alarms_created_by_fkey(full_name),
         closer:profiles!alarms_closed_by_fkey(full_name)`,
      )
      .order("occurred_at", { ascending: false })
      .order("id")
      .range(from, to);

    if (filters.machine) query = query.eq("machine_id", filters.machine);
    if (filters.status) query = query.eq("status", filters.status);
    const pattern = containsPattern(filters.code);
    if (pattern) query = query.ilike("alarm_code", pattern);
    const occurred = timestampBounds(filters);
    if (occurred.gte) query = query.gte("occurred_at", occurred.gte);
    if (occurred.lt) query = query.lt("occurred_at", occurred.lt);

    const { data, error } = await query;
    if (error) throw new Error(`exportAlarms failed: ${error.message}`);
    return data;
  });
}

export type AlarmExportRow = Awaited<ReturnType<typeof exportAlarms>>["rows"][number];
