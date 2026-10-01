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
    expect(html).toMatch(/>10<span[^>]*> in total<\/span>/);
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

  it("links every headline number to its full list", () => {
    expect(html).toMatch(/<a [^>]*href="\/machines"[^>]*>10<span[^>]*> in total<\/span><\/a>/);
    expect(html).toMatch(/<a [^>]*href="\/alarms"[^>]*>5<span[^>]*> of 9<\/span><\/a>/);
    expect(html).toMatch(/<a [^>]*href="\/maintenance"[^>]*>4<span[^>]*> of 8<\/span><\/a>/);
  });

  it("makes the whole row the link in every card, label and count together", () => {
    // Machine row: badge and count inside one link.
    expect(html).toMatch(/<a [^>]*href="\/machines\?status=Stop"[^>]*>.*?Stop<\/span>.*?>2<\/span><\/a>/);
    // Alarm row: badge and count inside one link.
    expect(html).toMatch(/<a [^>]*href="\/alarms\?status=Open"[^>]*>.*?Open<\/span>.*?>3<\/span><\/a>/);
    // Ten status rows in total (4 machine, 3 alarm, 3 maintenance).
    expect(html.match(/<li><a /g)).toHaveLength(10);
  });

  // The alarm and maintenance rows use the same coloured badges as their lists
  // and as the machine card, so every card reads the same way.
  it.each([
    ["/alarms?status=Open", "bg-red-100"],
    ["/alarms?status=In+Progress", "bg-yellow-100"],
    ["/alarms?status=Closed", "bg-green-100"],
    ["/maintenance?status=Pending", "bg-gray-100"],
    ["/maintenance?status=In+Progress", "bg-yellow-100"],
    ["/maintenance?status=Completed", "bg-green-100"],
  ])("shows the row for %s as a %s badge", (href, colour) => {
    const row = new RegExp(
      `<a [^>]*href="${href.replace(/[?+]/g, "\\$&")}"[^>]*>(?:(?!</a>).)*${colour}`,
    );

    expect(html).toMatch(row);
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
