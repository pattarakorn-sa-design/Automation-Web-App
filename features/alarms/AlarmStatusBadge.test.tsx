import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AlarmStatusBadge from "./AlarmStatusBadge";

describe("AlarmStatusBadge", () => {
  it.each([
    ["Open", "red"],
    ["In Progress", "yellow"],
    ["Closed", "green"],
  ] as const)("shows %s with text and a %s colour", (status, colour) => {
    const html = renderToStaticMarkup(<AlarmStatusBadge status={status} />);

    expect(html).toContain(`>${status}</span>`);
    expect(html).toContain(`bg-${colour}-100`);
  });
});
