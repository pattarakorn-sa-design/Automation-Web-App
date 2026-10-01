import { z } from "zod";
import { hasDateRange, parseDateRange, type DateRange } from "@/lib/dateRange";
import { ALARM_STATUSES, type AlarmStatus } from "./status";

// `from` / `to` filter by the day the alarm occurred (REQ-SRC-06).
export type AlarmFilters = DateRange & {
  machine?: string;
  status?: AlarmStatus;
  code: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// REQ-SRC-02, REQ-SRC-05, REQ-SRC-06: filters come from the URL. Invalid values are
// dropped instead of causing an error.
export function parseAlarmFilters(searchParams: SearchParams): AlarmFilters {
  const rawMachine = first(searchParams.machine);
  const machine = z.uuid().safeParse(rawMachine).success ? rawMachine : undefined;

  const rawStatus = first(searchParams.status);
  const status = (ALARM_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as AlarmStatus)
    : undefined;

  const code = first(searchParams.code).slice(0, 20);

  const pageNumber = Number.parseInt(first(searchParams.page), 10);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const range = parseDateRange(first(searchParams.from), first(searchParams.to));

  return { machine, status, code, ...range, page };
}

export function hasActiveAlarmFilters(filters: AlarmFilters): boolean {
  return Boolean(filters.machine || filters.status || filters.code || hasDateRange(filters));
}

export function alarmFiltersQuery(
  filters: AlarmFilters,
  overrides: Partial<AlarmFilters> = {},
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.machine) params.set("machine", merged.machine);
  if (merged.status) params.set("status", merged.status);
  if (merged.code) params.set("code", merged.code);
  if (merged.from) params.set("from", merged.from);
  if (merged.to) params.set("to", merged.to);
  if (merged.page > 1) params.set("page", String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
