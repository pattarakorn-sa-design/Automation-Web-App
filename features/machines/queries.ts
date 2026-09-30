import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  containsPattern,
  pageRange,
  type MachineFilters,
} from "./filters";

const MACHINE_COLUMNS =
  "id, machine_code, name, type, location, status, created_at, updated_at";

// One page of machines matching the filters, with the total count done by
// the database (NFR-PERF-02). Throws when the query fails so the page can
// show its error state.
export async function listMachines(filters: MachineFilters) {
  const supabase = await createClient();
  const { from, to } = pageRange(filters.page);

  let query = supabase
    .from("machines")
    .select(MACHINE_COLUMNS, { count: "exact" })
    .order("machine_code")
    .range(from, to);

  const pattern = containsPattern(filters.q);
  if (pattern) {
    query = query.or(`machine_code.ilike.${pattern},name.ilike.${pattern}`);
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);

  const { data, count, error } = await query;
  // PGRST103: the page is past the last row, e.g. after deleting the last
  // machine on the final page. Treat it as an empty page.
  if (error?.code === "PGRST103") return { machines: [], total: count ?? 0 };
  if (error) throw new Error(`listMachines failed: ${error.message}`);

  return { machines: data, total: count ?? 0 };
}

// Distinct machine types for the Type filter. The machine table is small
// (hundreds of rows at most), so reading one column is cheap.
export async function listMachineTypes(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("type")
    .order("type");
  if (error) throw new Error(`listMachineTypes failed: ${error.message}`);
  return [...new Set(data.map((row) => row.type))];
}

// Every machine as a choice for a <select>, e.g. in the alarm and maintenance
// forms and filters. The machine table is small, so this is not paginated.
export async function listMachineOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select("id, machine_code, name")
    .order("machine_code");
  if (error) throw new Error(`listMachineOptions failed: ${error.message}`);
  return data;
}

export type MachineOption = Awaited<ReturnType<typeof listMachineOptions>>[number];

// A single machine, or null when the id is not a valid uuid or no row exists.
export async function getMachine(id: string) {
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .select(MACHINE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getMachine failed: ${error.message}`);
  return data;
}

export type Machine = NonNullable<Awaited<ReturnType<typeof getMachine>>>;
