import { describe, expect, it } from "vitest";
import { hasRole } from "./roles";

describe("hasRole", () => {
  it("allows a role that is in the list", () => {
    expect(hasRole("admin", ["admin"])).toBe(true);
    expect(hasRole("technician", ["admin", "technician"])).toBe(true);
  });

  it("rejects a role that is not in the list", () => {
    expect(hasRole("technician", ["admin"])).toBe(false);
  });

  it("rejects every role when the list is empty", () => {
    expect(hasRole("admin", [])).toBe(false);
  });
});
