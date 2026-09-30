import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MaintenanceStatusBadge from "./MaintenanceStatusBadge";

describe("MaintenanceStatusBadge", () => {
  it.each([
    ["Pending", "gray"],
    ["In Progress", "yellow"],
    ["Completed", "green"],
  ] as const)("shows %s with text and a %s colour", (status, colour) => {
    const html = renderToStaticMarkup(<MaintenanceStatusBadge status={status} />);

    expect(html).toContain(`>${status}</span>`);
    expect(html).toContain(`bg-${colour}-100`);
  });
});
