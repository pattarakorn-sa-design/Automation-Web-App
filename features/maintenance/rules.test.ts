import { describe, expect, it } from "vitest";
import { canEditMaintenance, responsibleTechnician, technicianOptions } from "./rules";

const admin = { id: "admin-1", role: "admin" as const };
const tech = { id: "tech-1", role: "technician" as const };
const viewer = { id: "viewer-1", role: "viewer" as const };

describe("canEditMaintenance (BR-MNT-01)", () => {
  it("lets an admin edit any record", () => {
    expect(canEditMaintenance("tech-2", admin)).toBe(true);
  });

  it("lets a technician edit only their own records (TC-MNT-04, TC-MNT-05)", () => {
    expect(canEditMaintenance("tech-1", tech)).toBe(true);
    expect(canEditMaintenance("tech-2", tech)).toBe(false);
  });

  it("never lets a viewer edit, even a record in their name (REQ-AUTH-08)", () => {
    expect(canEditMaintenance("viewer-1", viewer)).toBe(false);
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

describe("technicianOptions", () => {
  const people = [
    { id: "a", full_name: "Ann", role: "admin" as const },
    { id: "t", full_name: "Tom", role: "technician" as const },
    { id: "v", full_name: "Vic", role: "viewer" as const },
  ];

  it("lists admins and technicians but not viewers", () => {
    expect(technicianOptions(people, "")).toEqual([
      { value: "a", label: "Ann (admin)" },
      { value: "t", label: "Tom" },
    ]);
  });

  it("keeps the person already on the record even if they are now a viewer", () => {
    expect(technicianOptions(people, "v").map((option) => option.value)).toEqual(["a", "t", "v"]);
  });
});
