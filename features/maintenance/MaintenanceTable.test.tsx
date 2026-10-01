import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MaintenanceTable from "./MaintenanceTable";
import type { MaintenanceListItem } from "./queries";

const records: MaintenanceListItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    type: "Corrective",
    problem: "Hydraulic oil leaking at the main cylinder hose",
    status: "In Progress",
    start_date: "2026-09-30",
    end_date: null,
    machine: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      machine_code: "PRS-001",
      name: "Hydraulic Press 1",
    },
    technician: { id: "t1", full_name: "Somchai Jaidee" },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    type: "Preventive",
    problem: "Quarterly air filter and oil change",
    status: "Pending",
    start_date: "2026-10-04",
    end_date: null,
    machine: {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      machine_code: "CMP-001",
      name: "Air Compressor 1",
    },
    // The database type says a record always has a technician; the table still
    // guards against a missing one, so this row tests that guard.
    technician: null as unknown as MaintenanceListItem["technician"],
  },
];

function count(html: string, text: string) {
  return html.split(text).length - 1;
}

describe("MaintenanceTable", () => {
  const html = renderToStaticMarkup(<MaintenanceTable records={records} />);
  const cards = html.slice(html.indexOf("<ul"), html.indexOf("</ul>"));

  it("renders a card list below lg and a table from lg up", () => {
    expect(html).toMatch(/<ul class="[^"]*lg:hidden/);
    expect(html).toMatch(/<div class="hidden [^"]*lg:block/);
    expect(html).toContain("<table");
  });

  it("shows every record in both the cards and the table", () => {
    for (const record of records) {
      // Once in the card and once in the table row.
      expect(count(html, `href="/maintenance/${record.id}"`)).toBe(2);
      // Match the shown text (>...<), not the table cell's title attribute.
      expect(count(html, `>${record.problem}<`)).toBe(2);
      expect(count(html, `>${record.machine.machine_code}<`)).toBe(2);
    }
  });

  it("keeps the status, type and technician visible in the card", () => {
    expect(cards).toContain("In Progress");
    expect(cards).toContain("Pending");
    expect(cards).toContain("Corrective");
    expect(cards).toContain("Preventive");
    expect(cards).toContain("Somchai Jaidee");
  });

  it("shows the start date of each record in the card", () => {
    expect(cards).toMatch(/30 Sep(t)? 2026/);
    expect(cards).toMatch(/4 Oct 2026/);
  });

  it("shows a dash when a record has no technician", () => {
    expect(cards).toContain("–");
    expect(html).toContain(">–<");
  });

  it("has the six column headers in the table", () => {
    for (const column of ["Start", "Machine", "Problem", "Type", "Technician", "Status"]) {
      expect(html).toContain(`>${column}</th>`);
    }
  });
});
