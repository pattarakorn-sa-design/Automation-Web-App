// Dates are stored as timestamptz and shown in factory time (assumption A-03).
const TIME_ZONE = "Asia/Bangkok";
// Bangkok has no daylight saving time, so its UTC offset is fixed.
const BANGKOK_OFFSET = "+07:00";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: TIME_ZONE,
});

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(typeof value === "string" ? new Date(value) : value);
}

const inputParts = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

// Value for <input type="datetime-local">, e.g. "2026-09-30T14:05", in
// Bangkok time. The server may run in another time zone (Vercel uses UTC),
// so both directions pin the time zone instead of using the machine's.
export function toBangkokInputValue(value: string | Date): string {
  const parts = Object.fromEntries(
    inputParts
      .formatToParts(typeof value === "string" ? new Date(value) : value)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

// Reads a datetime-local value as Bangkok time. Returns null when invalid.
export function fromBangkokInputValue(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00${BANGKOK_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}
