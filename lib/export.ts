// Most rows one CSV export may contain, so an export never reads a whole table
// (NFR-PERF-02). Queries ask for one row more to know whether rows were left out.
export const EXPORT_ROW_LIMIT = 5000;

// Keeps the first `limit` rows and says whether more rows matched.
export function capRows<T>(
  rows: T[],
  limit = EXPORT_ROW_LIMIT,
): { rows: T[]; truncated: boolean } {
  if (rows.length <= limit) return { rows, truncated: false };
  return { rows: rows.slice(0, limit), truncated: true };
}
