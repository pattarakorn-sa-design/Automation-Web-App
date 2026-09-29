import { describe, expect, it } from "vitest";
import { getNavItems, isActive } from "./navigation";

describe("getNavItems", () => {
  it("shows every menu item to an admin, including Users", () => {
    expect(getNavItems("admin").map((item) => item.label)).toEqual([
      "Dashboard",
      "Machines",
      "Alarms",
      "Maintenance",
      "Users",
    ]);
  });

  it("hides Users from a technician", () => {
    const items = getNavItems("technician");

    expect(items.map((item) => item.label)).toEqual([
      "Dashboard",
      "Machines",
      "Alarms",
      "Maintenance",
    ]);
    expect(items.some((item) => item.href === "/users")).toBe(false);
  });
});

describe("isActive", () => {
  it("matches the page itself and the pages below it", () => {
    expect(isActive("/machines", "/machines")).toBe(true);
    expect(isActive("/machines/new", "/machines")).toBe(true);
    expect(isActive("/machines/abc/edit", "/machines")).toBe(true);
  });

  it("does not match a different page that starts with the same letters", () => {
    expect(isActive("/machines2", "/machines")).toBe(false);
    expect(isActive("/alarms", "/machines")).toBe(false);
  });

  it("matches the dashboard only on the home page", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/alarms", "/")).toBe(false);
  });

  it("matches nothing when the path is unknown", () => {
    expect(isActive(null, "/")).toBe(false);
  });
});
