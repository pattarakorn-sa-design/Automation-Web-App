// Most rows one CSV export may contain, so an export never reads a whole table
// (NFR-PERF-02). Queries read one row more to know whether rows were left out.
export const EXPORT_ROW_LIMIT = 5000;

// Rows asked for per request. Supabase returns at most "Max rows" rows per
// request (1000 by default) whatever limit the query asks for, so one request
// for 5001 rows could come back cut at 1000 without any error (issue #42).
export const EXPORT_PAGE_SIZE = 1000;

// Keeps the first `limit` rows and says whether more rows matched.
export function capRows<T>(
  rows: T[],
  limit = EXPORT_ROW_LIMIT,
): { rows: T[]; truncated: boolean } {
  if (rows.length <= limit) return { rows, truncated: false };
  return { rows: rows.slice(0, limit), truncated: true };
}

// Reads rows page by page with `fetchPage(from, to)` (inclusive, like
// `.range()`) until `limit + 1` rows are read or a page comes back empty. The
// next page always starts after the rows actually received, so a server that
// returns fewer rows than asked for (a lower "Max rows") cannot leave a gap.
export async function fetchExportRows<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  limit = EXPORT_ROW_LIMIT,
  pageSize = EXPORT_PAGE_SIZE,
): Promise<{ rows: T[]; truncated: boolean }> {
  const wanted = limit + 1;
  const rows: T[] = [];
  while (rows.length < wanted) {
    const from = rows.length;
    const to = Math.min(from + pageSize, wanted) - 1;
    const page = await fetchPage(from, to);
    if (page.length === 0) break;
    rows.push(...page);
  }
  return capRows(rows, limit);
}
