import { z } from "zod";
import { hasDateRange, parseDateRange, type DateRange } from "@/lib/dateRange";
import { MAINTENANCE_STATUSES, type MaintenanceStatus } from "./rules";

// `from` / `to` filter by start date (REQ-SRC-06).
export type MaintenanceFilters = DateRange & {
  machine?: string;
  status?: MaintenanceStatus;
  technician?: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function uuidOrUndefined(value: string): string | undefined {
  return z.uuid().safeParse(value).success ? value : undefined;
}

// REQ-SRC-03, REQ-SRC-05, REQ-SRC-06: filters come from the URL. Invalid values are
// dropped instead of causing an error.
export function parseMaintenanceFilters(searchParams: SearchParams): MaintenanceFilters {
  const rawStatus = first(searchParams.status);
  const status = (MAINTENANCE_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as MaintenanceStatus)
    : undefined;

  const pageNumber = Number.parseInt(first(searchParams.page), 10);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  return {
    machine: uuidOrUndefined(first(searchParams.machine)),
    status,
    technician: uuidOrUndefined(first(searchParams.technician)),
    ...parseDateRange(first(searchParams.from), first(searchParams.to)),
    page,
  };
}

export function hasActiveMaintenanceFilters(filters: MaintenanceFilters): boolean {
  return Boolean(
    filters.machine || filters.status || filters.technician || hasDateRange(filters),
  );
}

export function maintenanceFiltersQuery(
  filters: MaintenanceFilters,
  overrides: Partial<MaintenanceFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.machine) params.set("machine", merged.machine);
  if (merged.status) params.set("status", merged.status);
  if (merged.technician) params.set("technician", merged.technician);
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.page > 1) params.set("page", String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
