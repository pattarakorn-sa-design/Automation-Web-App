import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ThemeToggle from "./ThemeToggle";

describe("ThemeToggle", () => {
  // The server cannot read localStorage, so it renders System.
  const html = renderToStaticMarkup(<ThemeToggle />);

  it("is a real button, so the keyboard can press it", () => {
    expect(html).toMatch(/^<button type="button"/);
  });

  it("names the current mode and what the next press does, not only an icon", () => {
    expect(html).toContain('aria-label="Theme: System. Switch to Light"');
  });

  it("shows the mode as text in the folded menu and hides the icon from screen readers", () => {
    expect(html).toContain('<span class="lg:sr-only">Theme: System</span>');
    expect(html).toMatch(/<svg aria-hidden="true"/);
  });

  it("takes extra classes for placing it in the navbar", () => {
    expect(renderToStaticMarkup(<ThemeToggle className="order-3 w-full" />)).toContain(
      "order-3 w-full",
    );
  });
});
