import { describe, expect, it } from "vitest";
import { maintenanceSchema } from "./schema";

const valid = {
  machineId: "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f",
  alarmId: "",
  technicianId: "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d",
  type: "Corrective",
  problem: "Hydraulic oil leak",
  actionTaken: "",
  status: "In Progress",
  startDate: "2026-09-29",
  endDate: "",
};

function errors(input: Record<string, unknown>) {
  const result = maintenanceSchema.safeParse(input);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
}

describe("maintenanceSchema", () => {
  it("accepts an in-progress record without action taken or end date", () => {
    expect(maintenanceSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts an optional alarm link", () => {
    expect(
      maintenanceSchema.safeParse({
        ...valid,
        alarmId: "11111111-2222-4333-8444-555555555555",
      }).success,
    ).toBe(true);
    expect(errors({ ...valid, alarmId: "E-101" })).toEqual({
      alarmId: "Alarm ที่เลือกไม่ถูกต้อง",
    });
  });

  it("requires machine, technician, type and problem", () => {
    expect(
      errors({ ...valid, machineId: "", technicianId: "", type: "", problem: "  " }),
    ).toEqual({
      machineId: "กรุณาเลือกเครื่องจักร",
      technicianId: "กรุณาเลือก Technician ผู้รับผิดชอบ",
      type: "กรุณาเลือกประเภทงาน",
      problem: "กรุณากรอกปัญหาที่พบ",
    });
  });

  it("needs action taken and an end date to complete (BR-MNT-02, TC-MNT-02)", () => {
    expect(errors({ ...valid, status: "Completed" })).toEqual({
      actionTaken: "กรุณากรอก Action Taken ก่อนตั้งสถานะเป็น Completed",
      endDate: "กรุณาระบุวันจบก่อนตั้งสถานะเป็น Completed",
    });
    expect(
      maintenanceSchema.safeParse({
        ...valid,
        status: "Completed",
        actionTaken: "Replaced the hose",
        endDate: "2026-09-30",
      }).success,
    ).toBe(true);
  });

  it("rejects an end date before the start date (TC-MNT-03)", () => {
    expect(errors({ ...valid, endDate: "2026-09-28" })).toEqual({
      endDate: "วันจบต้องไม่ก่อนวันเริ่ม",
    });
    expect(maintenanceSchema.safeParse({ ...valid, endDate: "2026-09-29" }).success).toBe(
      true,
    );
  });

  it("asks for a start date and rejects dates that do not exist", () => {
    expect(errors({ ...valid, startDate: "" })).toEqual({ startDate: "กรุณาระบุวันเริ่ม" });
    expect(errors({ ...valid, startDate: "2026-02-30" })).toEqual({
      startDate: "วันเริ่มไม่ถูกต้อง",
    });
  });

  it("limits problem and action taken to 1000 characters", () => {
    expect(
      errors({ ...valid, problem: "a".repeat(1001), actionTaken: "a".repeat(1001) }),
    ).toEqual({
      problem: "Problem ยาวได้ไม่เกิน 1000 ตัวอักษร",
      actionTaken: "Action Taken ยาวได้ไม่เกิน 1000 ตัวอักษร",
    });
  });
});
