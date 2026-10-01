import { describe, expect, it } from "vitest";
import { capRows, EXPORT_ROW_LIMIT } from "./export";

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
