import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RecentAlarms from "./RecentAlarms";
import SummaryCards from "./SummaryCards";
import { buildSummary } from "./summary";

const summary = buildSummary({
  machines: { Running: 6, Stop: 2, Alarm: 1, Maintenance: 1 },
  alarms: { Open: 3, "In Progress": 2, Closed: 4 },
  maintenance: { Pending: 2, "In Progress": 2, Completed: 4 },
});

describe("SummaryCards", () => {
  const html = renderToStaticMarkup(<SummaryCards summary={summary} />);

  it("shows the totals the requirements ask for (TC-DSH-01 to 03)", () => {
    expect(html).toContain(">10<");
    expect(html).toMatch(/>5<span[^>]*> of 9<\/span>/);
    expect(html).toMatch(/>4<span[^>]*> of 8<\/span>/);
  });

  it("links each machine status count to the filtered machine list", () => {
    expect(html).toContain('href="/machines?status=Running"');
    expect(html).toContain('href="/machines?status=Maintenance"');
  });

  it("links alarm and maintenance statuses with spaces encoded", () => {
    expect(html).toContain('href="/alarms?status=In+Progress"');
    expect(html).toContain('href="/maintenance?status=Completed"');
  });
});

describe("RecentAlarms", () => {
  it("links each alarm to its page", () => {
    const html = renderToStaticMarkup(
      <RecentAlarms
        alarms={[
          {
            id: "a-1",
            alarm_code: "E-101",
            description: "Injection pressure too high",
            occurred_at: "2026-09-29T04:15:00Z",
            status: "Open",
            machine: { id: "m-1", machine_code: "INJ-002" },
          },
        ]}
      />,
    );

    expect(html).toContain('href="/alarms/a-1"');
    expect(html).toContain("INJ-002");
    expect(html).toContain("29 Sept 2026, 11:15");
  });

  it("shows the empty state when there are no alarms", () => {
    expect(renderToStaticMarkup(<RecentAlarms alarms={[]} />)).toContain("ยังไม่มี Alarm ในระบบ");
  });
});
