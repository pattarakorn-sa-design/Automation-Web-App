import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Navbar from "./Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/alarms",
}));

const signOutAction = async () => {};

function render(role: "admin" | "technician") {
  return renderToStaticMarkup(
    <Navbar user={{ fullName: "Somchai", role }} signOutAction={signOutAction} />,
  );
}

describe("Navbar", () => {
  it("shows the Users link to an admin", () => {
    const html = render("admin");

    expect(html).toContain('href="/users"');
    expect(html).toContain(">Users<");
  });

  it("hides the Users link from a technician", () => {
    const html = render("technician");

    expect(html).not.toContain('href="/users"');
    expect(html).toContain('href="/machines"');
    expect(html).toContain('href="/alarms"');
    expect(html).toContain('href="/maintenance"');
  });

  it("shows the user's name and role and links to the profile page", () => {
    const html = render("technician");

    expect(html).toContain("Somchai");
    expect(html).toContain(">technician<");
    expect(html).toContain('href="/profile"');
  });

  it("has a Logout button inside a form", () => {
    const html = render("admin");

    expect(html).toMatch(/<form[^>]*>\s*<button type="submit"[^>]*>Logout<\/button>/);
  });

  it("marks only the current page as active", () => {
    const html = render("admin");

    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    // The current link (Alarms, from the mocked pathname) carries aria-current.
    expect(html).toMatch(/<a aria-current="page"[^>]*href="\/alarms"/);
  });

  it("has the theme button for every role, next to Logout (plan 9.5)", () => {
    for (const role of ["admin", "technician"] as const) {
      const html = render(role);

      expect(html).toContain('aria-label="Theme: System. Switch to Light"');
      expect(html.indexOf("Theme: System")).toBeLessThan(html.indexOf(">Logout<"));
    }
  });

  it("starts with the mobile menu folded", () => {
    const html = render("admin");

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="main-menu"');
  });
});
