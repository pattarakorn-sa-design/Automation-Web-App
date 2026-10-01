import "server-only";
import { ALARM_STATUSES } from "@/features/alarms/status";
import { MAINTENANCE_STATUSES } from "@/features/maintenance/rules";
import { MACHINE_STATUSES } from "@/features/machines/schema";
import { createClient } from "@/lib/supabase/server";
import { buildSummary, type StatusCounts } from "./summary";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type CountedTable = "machines" | "alarms" | "maintenance_records";

// Number of rows with one status. `head: true` asks the database for the
// count only, without sending any rows (NFR-PERF-02).
async function countByStatus(supabase: Supabase, table: CountedTable, status: string) {
  // The status column is a different enum in each table; the values come from
  // that table's own status list, so the cast is safe.
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("status", status as never);
  if (error) throw new Error(`count ${table}.${status} failed: ${error.message}`);
  return count ?? 0;
}

async function countAll<S extends string>(
  supabase: Supabase,
  table: CountedTable,
  statuses: readonly S[],
): Promise<Record<S, number>> {
  const counts = await Promise.all(
    statuses.map((status) => countByStatus(supabase, table, status)),
  );
  return Object.fromEntries(statuses.map((status, i) => [status, counts[i]])) as Record<
    S,
    number
  >;
}

// Everything the dashboard shows. Throws when any query fails, so the page
// shows its error state instead of wrong numbers (NFR-REL-01, issue #17).
export async function getDashboard() {
  const supabase = await createClient();

  const [machines, alarms, maintenance, recentAlarms] = await Promise.all([
    countAll(supabase, "machines", MACHINE_STATUSES),
    countAll(supabase, "alarms", ALARM_STATUSES),
    countAll(supabase, "maintenance_records", MAINTENANCE_STATUSES),
    listRecentAlarms(supabase),
  ]);

  const counts: StatusCounts = { machines, alarms, maintenance };
  return { summary: buildSummary(counts), recentAlarms };
}

// REQ-DSH-05: the five newest alarms with their machine.
async function listRecentAlarms(supabase: Supabase) {
  const { data, error } = await supabase
    .from("alarms")
    .select(
      "id, alarm_code, description, occurred_at, status, machine:machines!alarms_machine_id_fkey(id, machine_code)",
    )
    .order("occurred_at", { ascending: false })
    .limit(5);
  if (error) throw new Error(`recent alarms failed: ${error.message}`);
  return data;
}

export type RecentAlarm = Awaited<ReturnType<typeof listRecentAlarms>>[number];
