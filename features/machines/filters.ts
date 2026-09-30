import type { Enums } from "@/types/database";
import { MACHINE_STATUSES } from "./schema";

export type MachineStatus = Enums<"machine_status">;

export const PAGE_SIZE = 20;
const MAX_SEARCH_LENGTH = 50;

export type MachineFilters = {
  q: string;
  status?: MachineStatus;
  type?: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// Filters come from the URL (REQ-SRC-05), so anything can be in there.
// Unknown or invalid values are dropped instead of causing an error.
export function parseMachineFilters(searchParams: SearchParams): MachineFilters {
  const q = first(searchParams.q).slice(0, MAX_SEARCH_LENGTH);

  const rawStatus = first(searchParams.status);
  const status = (MACHINE_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as MachineStatus)
    : undefined;

  const type = first(searchParams.type).slice(0, 50) || undefined;

  const pageNumber = Number.parseInt(first(searchParams.page), 10);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  return { q, status, type, page };
}

export function hasActiveFilters(filters: MachineFilters): boolean {
  return Boolean(filters.q || filters.status || filters.type);
}

// Builds the ?query for a link that keeps the current filters, e.g. for the
// pagination links. Page 1 is left out so the default URL stays clean.
export function machineFiltersQuery(
  filters: MachineFilters,
  overrides: Partial<MachineFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.status) params.set("status", merged.status);
  if (merged.type) params.set("type", merged.type);
  if (merged.page > 1) params.set("page", String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

// ILIKE pattern for a "contains" search. Characters that are wildcards in
// ILIKE (% _ \) or that break the PostgREST or=(...) filter syntax
// (, ( ) " *) are removed, so user input is always matched as plain text.
export function containsPattern(q: string): string {
  const cleaned = q.replace(/[%_\\,()"*]/g, "").trim();
  return cleaned ? `%${cleaned}%` : "";
}

export function pageCount(total: number, pageSize = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// Row range for Supabase .range(from, to), both ends inclusive.
export function pageRange(page: number, pageSize = PAGE_SIZE) {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}
