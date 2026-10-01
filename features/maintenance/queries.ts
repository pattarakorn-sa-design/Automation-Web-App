import "server-only";
import { z } from "zod";
import { pageRange } from "@/features/machines/filters";
import { dateBounds } from "@/lib/dateRange";
import { fetchExportRows } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceFilters } from "./filters";

// One page of maintenance records, newest start date first, with the machine
// and technician of each row and the total counted by the database
// (NFR-PERF-02). Throws when the query fails so the page can show its error state.
export async function listMaintenance(filters: MaintenanceFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("maintenance_records")
    .select(
      `id, type, problem, status, start_date, end_date,
       machine:machines!maintenance_records_machine_id_fkey(id, machine_code, name),
       technician:profiles!maintenance_records_technician_id_fkey(id, full_name)`,
      { count: "exact" },
    )
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.machine) query = query.eq("machine_id", filters.machine);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.technician) query = query.eq("technician_id", filters.technician);
  const started = dateBounds(filters);
  if (started.gte) query = query.gte("start_date", started.gte);
  if (started.lte) query = query.lte("start_date", started.lte);

  const { data, count, error } = await query;
  // PGRST103: the page is past the last row. Treat it as an empty page.
  if (error?.code === "PGRST103") return { records: [], total: count ?? 0 };
  if (error) throw new Error(`listMaintenance failed: ${error.message}`);
  return { records: data, total: count ?? 0 };
}

export type MaintenanceListItem = Awaited<
  ReturnType<typeof listMaintenance>
>["records"][number];

// One record with its machine, technician, linked alarm and creator.
// Null when the id is not a valid uuid or no row exists.
export async function getMaintenance(id: string) {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .select(
      `id, machine_id, alarm_id, technician_id, type, problem, action_taken, status,
       start_date, end_date, created_at, updated_at,
       machine:machines!maintenance_records_machine_id_fkey(id, machine_code, name),
       technician:profiles!maintenance_records_technician_id_fkey(id, full_name),
       alarm:alarms!maintenance_records_alarm_same_machine_fkey(id, alarm_code),
       creator:profiles!maintenance_records_created_by_fkey(full_name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getMaintenance failed: ${error.message}`);
  return data;
}

export type Maintenance = NonNullable<Awaited<ReturnType<typeof getMaintenance>>>;

// Every maintenance record matching the list filters, newest start date first,
// for the CSV export (plan 9.4). Same filters and order as listMaintenance but
// without pages, capped at EXPORT_ROW_LIMIT rows; `truncated` is true when
// more rows matched. Read in pages of EXPORT_PAGE_SIZE rows (issue #42).
// Throws when the query fails.
export async function exportMaintenance(filters: MaintenanceFilters) {
  const supabase = await createClient();

  return fetchExportRows(async (from, to) => {
    let query = supabase
      .from("maintenance_records")
      .select(
        `id, type, problem, action_taken, status, start_date, end_date,
         machine:machines!maintenance_records_machine_id_fkey(machine_code, name),
         technician:profiles!maintenance_records_technician_id_fkey(full_name),
         alarm:alarms!maintenance_records_alarm_same_machine_fkey(alarm_code)`,
      )
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false })
      // A unique last key keeps the order fixed from one page to the next.
      .order("id")
      .range(from, to);

    if (filters.machine) query = query.eq("machine_id", filters.machine);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.technician) query = query.eq("technician_id", filters.technician);
    const started = dateBounds(filters);
    if (started.gte) query = query.gte("start_date", started.gte);
    if (started.lte) query = query.lte("start_date", started.lte);

    const { data, error } = await query;
    if (error) throw new Error(`exportMaintenance failed: ${error.message}`);
    return data;
  });
}

export type MaintenanceExportRow = Awaited<
  ReturnType<typeof exportMaintenance>
>["rows"][number];
