import { describe, expect, it } from "vitest";
import { capRows, EXPORT_ROW_LIMIT, fetchExportRows } from "./export";

describe("capRows", () => {
  it("keeps every row up to the limit", () => {
    expect(capRows([1, 2, 3], 3)).toEqual({ rows: [1, 2, 3], truncated: false });
  });

  it("cuts the extra row and marks the result as truncated", () => {
    expect(capRows([1, 2, 3, 4], 3)).toEqual({ rows: [1, 2, 3], truncated: true });
  });

  it("handles no rows", () => {
    expect(capRows([], 3)).toEqual({ rows: [], truncated: false });
  });

  it("uses the export limit by default", () => {
    const rows = Array.from({ length: EXPORT_ROW_LIMIT + 1 }, (_, i) => i);
    const result = capRows(rows);
    expect(result.rows).toHaveLength(EXPORT_ROW_LIMIT);
    expect(result.truncated).toBe(true);
  });
});

// A fake table of `total` rows that returns at most `maxRows` per request,
// like Supabase's "Max rows" setting, and records every range asked for.
function fakeTable(total: number, maxRows = Infinity) {
  const calls: [number, number][] = [];
  const fetchPage = async (from: number, to: number) => {
    calls.push([from, to]);
    const end = Math.min(to + 1, total, from + maxRows);
    return Array.from({ length: Math.max(end - from, 0) }, (_, i) => from + i);
  };
  return { fetchPage, calls };
}

describe("fetchExportRows", () => {
  it("reads every row of a small table and stops at the empty page", async () => {
    const table = fakeTable(3);
    expect(await fetchExportRows(table.fetchPage, 10, 4)).toEqual({
      rows: [0, 1, 2],
      truncated: false,
    });
    expect(table.calls).toEqual([
      [0, 3],
      [3, 6],
    ]);
  });

  it("reads past the server's per-request cap instead of stopping there", async () => {
    // Issue #42: 2500 rows, the server returns 1000 per request.
    const table = fakeTable(2500, 1000);
    const result = await fetchExportRows(table.fetchPage, 5000, 1000);
    expect(result.rows).toHaveLength(2500);
    expect(result.rows[1000]).toBe(1000);
    expect(result.truncated).toBe(false);
  });

  it("leaves no gap when the server returns fewer rows than one page", async () => {
    const table = fakeTable(25, 7);
    const result = await fetchExportRows(table.fetchPage, 100, 10);
    expect(result.rows).toEqual(Array.from({ length: 25 }, (_, i) => i));
  });

  it("asks for one row past the limit and marks the result as truncated", async () => {
    const table = fakeTable(50);
    const result = await fetchExportRows(table.fetchPage, 20, 10);
    expect(result.rows).toHaveLength(20);
    expect(result.truncated).toBe(true);
    expect(table.calls.at(-1)).toEqual([20, 20]);
  });

  it("is not truncated when the table holds exactly the limit", async () => {
    const result = await fetchExportRows(fakeTable(20).fetchPage, 20, 10);
    expect(result).toMatchObject({ truncated: false });
    expect(result.rows).toHaveLength(20);
  });

  it("passes on a failed page", async () => {
    const failing = async () => {
      throw new Error("boom");
    };
    await expect(fetchExportRows(failing, 20, 10)).rejects.toThrow("boom");
  });
});
