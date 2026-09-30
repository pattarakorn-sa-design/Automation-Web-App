import { z } from "zod";
import { ALARM_STATUSES, type AlarmStatus } from "./status";

export type AlarmFilters = {
  machine?: string;
  status?: AlarmStatus;
  code: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

// REQ-SRC-02, REQ-SRC-05: filters come from the URL. Invalid values are
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

  return { machine, status, code, page };
}

export function hasActiveAlarmFilters(filters: AlarmFilters): boolean {
  return Boolean(filters.machine || filters.status || filters.code);
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
  if (merged.page > 1) params.set("page", String(merged.page));
  const query = params.toString();
  return query ? `?${query}` : "";
}
