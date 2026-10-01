import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AlarmTable from "./AlarmTable";
import type { AlarmListItem } from "./queries";

const alarms: AlarmListItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    alarm_code: "E-101",
    description: "Injection pressure too high",
    occurred_at: "2026-10-01T04:00:00Z",
    status: "Open",
    machine: {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      machine_code: "INJ-002",
      name: "Injection Molder 2",
    },
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    alarm_code: "H-501",
    description: "Hydraulic oil leak",
    occurred_at: "2026-09-30T02:00:00Z",
    status: "In Progress",
    // The database type says an alarm always has a machine; the table still
    // guards against a missing one, so this row tests that guard.
    machine: null as unknown as AlarmListItem["machine"],
  },
];

function count(html: string, text: string) {
  return html.split(text).length - 1;
}

describe("AlarmTable", () => {
  const html = renderToStaticMarkup(<AlarmTable alarms={alarms} />);
  const cards = html.slice(html.indexOf("<ul"), html.indexOf("</ul>"));

  it("renders a card list below lg and a table from lg up", () => {
    expect(html).toMatch(/<ul class="[^"]*lg:hidden/);
    expect(html).toMatch(/<div class="hidden [^"]*lg:block/);
    expect(html).toContain("<table");
  });

  it("shows every alarm in both the cards and the table", () => {
    for (const alarm of alarms) {
      // Once in the card and once in the table row.
      expect(count(html, `href="/alarms/${alarm.id}"`)).toBe(2);
      // Match the shown text (>...<), not the table cell's title attribute.
      expect(count(html, `>${alarm.alarm_code}<`)).toBe(2);
      expect(count(html, `>${alarm.description}<`)).toBe(2);
    }
  });

  it("keeps the status and the description visible in the card", () => {
    expect(cards).toContain("Open");
    expect(cards).toContain("In Progress");
    expect(cards).toContain("Injection pressure too high");
  });

  it("shows the machine code and the time under the description in the card", () => {
    expect(cards).toContain("INJ-002");
    // 04:00 UTC is 11:00 in Bangkok.
    expect(cards).toContain("1 Oct 2026, 11:00");
  });

  it("leaves the machine out of the card and shows a dash in the table when there is none", () => {
    expect(cards).not.toContain("null");
    expect(html).toContain(">–<");
  });

  it("has the five column headers in the table", () => {
    for (const column of ["Occurred", "Machine", "Alarm code", "Description", "Status"]) {
      expect(html).toContain(`>${column}</th>`);
    }
  });
});
