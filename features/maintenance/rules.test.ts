import { describe, expect, it } from "vitest";
import { canEditMaintenance, responsibleTechnician } from "./rules";

const admin = { id: "admin-1", role: "admin" as const };
const tech = { id: "tech-1", role: "technician" as const };

describe("canEditMaintenance (BR-MNT-01)", () => {
  it("lets an admin edit any record", () => {
    expect(canEditMaintenance("tech-2", admin)).toBe(true);
  });

  it("lets a technician edit only their own records (TC-MNT-04, TC-MNT-05)", () => {
    expect(canEditMaintenance("tech-1", tech)).toBe(true);
    expect(canEditMaintenance("tech-2", tech)).toBe(false);
  });
});

describe("responsibleTechnician", () => {
  it("uses the technician an admin picked", () => {
    expect(responsibleTechnician("tech-2", admin)).toBe("tech-2");
  });

  it("always uses the technician themselves, whatever was submitted", () => {
    expect(responsibleTechnician("tech-2", tech)).toBe("tech-1");
    expect(responsibleTechnician("", tech)).toBe("tech-1");
  });
});
