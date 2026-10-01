import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MachineTable from "./MachineTable";
import type { Machine } from "./queries";

const machines: Machine[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    machine_code: "INJ-002",
    name: "Injection Molder 2",
    type: "Injection Molding",
    location: "Line B",
    status: "Alarm",
    created_at: "2026-09-29T08:00:00Z",
    updated_at: "2026-09-29T08:00:00Z",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    machine_code: "CMP-001",
    name: "Air Compressor 1",
    type: "Compressor",
    location: "Utility Room",
    status: "Stop",
    created_at: "2026-09-29T08:00:00Z",
    updated_at: "2026-09-29T08:00:00Z",
  },
];

function count(html: string, text: string) {
  return html.split(text).length - 1;
}

describe("MachineTable", () => {
  const html = renderToStaticMarkup(<MachineTable machines={machines} />);

  it("renders a card list for small screens and a table from md up", () => {
    expect(html).toMatch(/<ul class="[^"]*md:hidden/);
    expect(html).toMatch(/<div class="hidden [^"]*md:block/);
    expect(html).toContain("<table");
  });

  it("shows every machine in both the cards and the table", () => {
    for (const machine of machines) {
      // Once in the card and once in the table row.
      expect(count(html, `href="/machines/${machine.id}"`)).toBe(2);
      expect(count(html, machine.machine_code)).toBe(2);
      expect(count(html, machine.name)).toBe(2);
    }
  });

  it("keeps the status visible in the card, not only in the table", () => {
    const cards = html.slice(html.indexOf("<ul"), html.indexOf("</ul>"));

    expect(cards).toContain("Alarm");
    expect(cards).toContain("Stop");
  });

  it("shows type and location together under the name in the card", () => {
    expect(html).toContain("Injection Molding · Line B");
    expect(html).toContain("Compressor · Utility Room");
  });

  it("has the five column headers in the table", () => {
    for (const column of ["Machine ID", "Name", "Type", "Location", "Status"]) {
      expect(html).toContain(`>${column}</th>`);
    }
  });
});
