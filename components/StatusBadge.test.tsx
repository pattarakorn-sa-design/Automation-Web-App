import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import StatusBadge, { type MachineStatus } from "./StatusBadge";

const cases: [MachineStatus, string][] = [
  ["Running", "green"],
  ["Stop", "gray"],
  ["Alarm", "red"],
  ["Maintenance", "yellow"],
];

describe("StatusBadge", () => {
  it.each(cases)("shows the %s label with a %s colour", (status, colour) => {
    const html = renderToStaticMarkup(<StatusBadge status={status} />);

    expect(html).toContain(status);
    expect(html).toContain(`bg-${colour}-100`);
  });

  it("appends a custom class name", () => {
    const html = renderToStaticMarkup(
      <StatusBadge status="Running" className="ml-2" />,
    );

    expect(html).toContain("ml-2");
  });
});
