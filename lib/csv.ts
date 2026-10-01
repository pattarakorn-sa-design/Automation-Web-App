// CSV text for the Alarm and Maintenance exports (plan 9.4). Pure functions,
// so they are easy to test; the Route Handlers add the HTTP headers.

// Excel opens a CSV as the local ANSI code page unless the file starts with a
// byte order mark, which turns Thai text into garbage.
const BOM = "﻿";

// A cell that starts with one of these is read as a formula by Excel and
// LibreOffice (CSV injection). Tab and carriage return are included because
// some versions strip them before looking at the first character.
const FORMULA_START = /^[=+\-@\t\r]/;

// Quotes one cell: every cell is wrapped in double quotes, a double quote in
// the data is doubled, and a leading formula character gets a ' in front.
export function csvCell(value: string | null | undefined): string {
  let text = value ?? "";
  if (FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

// Whole file: BOM, header row, then one line per row. Lines end with CRLF as
// RFC 4180 asks. New lines inside a cell stay inside its quotes.
export function toCsv(header: readonly string[], rows: readonly (readonly (string | null | undefined)[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(","));
  return `${BOM}${lines.join("\r\n")}\r\n`;
}

// The response for a finished file. `partial` is true when more rows matched
// than the export limit, and is shown in the file name so nobody mistakes a cut
// file for a complete one. `today` is "YYYY-MM-DD" in Bangkok time.
export function csvResponse(
  body: string,
  options: { name: string; today: string; partial: boolean },
): Response {
  const suffix = options.partial ? "-partial" : "";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${options.name}-${options.today}${suffix}.csv"`,
      // The file depends on who is signed in, so it must never be cached.
      "Cache-Control": "private, no-store",
    },
  });
}

// Plain-text error for a failed export, in Thai like the rest of the app.
export function csvErrorResponse(): Response {
  return new Response("ส่งออกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
