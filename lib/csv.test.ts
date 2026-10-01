import { describe, expect, it } from "vitest";
import { csvCell, csvErrorResponse, csvResponse, toCsv } from "./csv";

// A small reader that follows the CSV rules (RFC 4180), the way Excel does:
// quoted cells may hold commas, new lines and doubled quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\r" && text[i + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
    } else {
      cell += char;
    }
  }
  return rows;
}

describe("csvCell", () => {
  it("wraps every value in double quotes", () => {
    expect(csvCell("Hello")).toBe('"Hello"');
    expect(csvCell("")).toBe('""');
  });

  it("treats null and undefined as an empty cell", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
  });

  it("doubles a double quote inside the value", () => {
    expect(csvCell('Valve "A" stuck')).toBe('"Valve ""A"" stuck"');
  });

  it("keeps commas and new lines inside the quotes", () => {
    expect(csvCell("pressure high, oil low\nsecond line")).toBe(
      '"pressure high, oil low\nsecond line"',
    );
  });

  it("keeps Thai text as it is", () => {
    expect(csvCell("น้ำมันรั่ว")).toBe('"น้ำมันรั่ว"');
  });

  it.each(["=SUM(A1:A9)", "+1+1", "-2+3", "@cmd", "\t=1", "\r=1"])(
    "puts a ' in front of %j so a spreadsheet does not run it (CSV injection)",
    (value) => {
      expect(csvCell(value)).toBe(`"'${value}"`);
    },
  );

  it("leaves text that only contains a formula character later in the value", () => {
    expect(csvCell("E-101 = high")).toBe('"E-101 = high"');
    expect(csvCell("1 Oct 2026, 14:00")).toBe('"1 Oct 2026, 14:00"');
  });
});

describe("toCsv", () => {
  it("starts with a byte order mark so Excel reads Thai correctly", () => {
    expect(toCsv(["A"], []).startsWith("﻿")).toBe(true);
  });

  it("writes the header, then one CRLF-terminated line per row", () => {
    expect(toCsv(["Code", "Note"], [["E-101", "ok"], ["E-102", null]])).toBe(
      '﻿"Code","Note"\r\n"E-101","ok"\r\n"E-102",""\r\n',
    );
  });

  it("writes only the header when there are no rows", () => {
    expect(toCsv(["Code"], [])).toBe('﻿"Code"\r\n');
  });
});

describe("a file read back by the CSV rules (TC-BNS-04)", () => {
  const tricky = [
    "plain",
    "pressure high, oil low",
    "first line\nsecond line\r\nthird line",
    'a "quoted" word',
    "น้ำมันรั่ว, ความดันต่ำ",
    "",
  ];
  const csv = toCsv(
    ["A", "B", "C"],
    [
      [tricky[0], tricky[1], tricky[2]],
      [tricky[3], tricky[4], tricky[5]],
    ],
  );

  it("gives back the same number of rows and columns, so no column shifts", () => {
    const rows = parseCsv(csv.slice(1));

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.length === 3)).toBe(true);
  });

  it("gives back every value unchanged", () => {
    const rows = parseCsv(csv.slice(1));

    expect(rows[1]).toEqual([tricky[0], tricky[1], tricky[2]]);
    expect(rows[2]).toEqual([tricky[3], tricky[4], tricky[5]]);
  });

  it("is written as UTF-8 with a byte order mark, which Excel needs for Thai", () => {
    const bytes = new TextEncoder().encode(csv);

    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  });
});

describe("csvResponse", () => {
  it("sends text/csv as an attachment named with today's date", () => {
    const response = csvResponse("x", { name: "alarms", today: "2026-10-01", partial: false });

    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="alarms-2026-10-01.csv"',
    );
  });

  it("adds -partial to the file name when rows were left out", () => {
    const response = csvResponse("x", { name: "maintenance", today: "2026-10-01", partial: true });

    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="maintenance-2026-10-01-partial.csv"',
    );
  });

  it("is never cached, because it depends on who is signed in", () => {
    const response = csvResponse("x", { name: "alarms", today: "2026-10-01", partial: false });

    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("csvErrorResponse", () => {
  it("returns a 500 with a Thai message, not an empty file", async () => {
    const response = csvErrorResponse();

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toContain("ส่งออกข้อมูลไม่สำเร็จ");
  });
});
