import { isDateValue } from "./format";

// Bangkok has no daylight saving time, so its UTC offset is fixed.
const BANGKOK_OFFSET = "+07:00";

// A date range from the URL (REQ-SRC-06). `from` and `to` are "YYYY-MM-DD" and
// both ends are included. When `from` is after `to`, the values are kept so the
// form can show them, `invalidRange` is true and the range is not applied.
export type DateRange = {
  from?: string;
  to?: string;
  invalidRange: boolean;
};

// Reads the two URL values. A value that is not a real date is dropped, like
// the other filters.
export function parseDateRange(rawFrom: string, rawTo: string): DateRange {
  const from = isDateValue(rawFrom) ? rawFrom : undefined;
  const to = isDateValue(rawTo) ? rawTo : undefined;
  // "YYYY-MM-DD" strings sort in date order.
  return { from, to, invalidRange: Boolean(from && to && from > to) };
}

export function hasDateRange(range: DateRange): boolean {
  return Boolean(range.from || range.to);
}

// The day after a "YYYY-MM-DD" date, e.g. "2026-03-01" after "2026-02-28".
export function nextDate(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + 1);
  return day.toISOString().slice(0, 10);
}

// Start of a day in Bangkok as an ISO instant, e.g. "2026-10-01" gives
// "2026-09-30T17:00:00.000Z". The server runs in UTC on Vercel, so the factory
// day has to be pinned to Bangkok time.
export function bangkokDayStart(date: string): string {
  return new Date(`${date}T00:00:00${BANGKOK_OFFSET}`).toISOString();
}

// Bounds for a timestamptz column (alarm occurred_at): from the start of the
// first day up to, but not including, the start of the day after the last.
// Empty when no range is applied.
export function timestampBounds(range: DateRange): { gte?: string; lt?: string } {
  if (range.invalidRange) return {};
  return {
    gte: range.from ? bangkokDayStart(range.from) : undefined,
    lt: range.to ? bangkokDayStart(nextDate(range.to)) : undefined,
  };
}

// Bounds for a date column (maintenance start_date). Both ends are included.
// Empty when no range is applied.
export function dateBounds(range: DateRange): { gte?: string; lte?: string } {
  if (range.invalidRange) return {};
  return { gte: range.from, lte: range.to };
}
