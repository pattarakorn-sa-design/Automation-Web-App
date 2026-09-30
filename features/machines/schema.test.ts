import { describe, expect, it } from "vitest";
import { machineSchema } from "./schema";

const valid = {
  machineCode: "M-001",
  name: "CNC Lathe 1",
  type: "CNC Lathe",
  location: "Line A",
  status: "Running",
};

function firstError(input: Record<string, unknown>) {
  const result = machineSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0].message;
}

describe("machineSchema", () => {
  it("accepts a valid machine and trims text fields", () => {
    const result = machineSchema.safeParse({
      ...valid,
      name: "  CNC Lathe 1  ",
      location: " Line A ",
    });

    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("CNC Lathe 1");
    expect(result.data?.location).toBe("Line A");
  });

  it("uppercases the Machine ID so m-001 and M-001 are the same", () => {
    const result = machineSchema.safeParse({ ...valid, machineCode: " cnc-0012 " });

    expect(result.success).toBe(true);
    expect(result.data?.machineCode).toBe("CNC-0012");
  });

  it.each(["abc", "M001", "TOOLONG-1", "M-01", "M-123456", "1-001", "M-00A"])(
    "rejects the Machine ID %s",
    (machineCode) => {
      expect(firstError({ ...valid, machineCode })).toMatch(
        /^รูปแบบ Machine ID ไม่ถูกต้อง/,
      );
    },
  );

  it("asks for a Machine ID when it is empty", () => {
    expect(firstError({ ...valid, machineCode: "   " })).toBe("กรุณากรอก Machine ID");
  });

  it("rejects a name that is only spaces", () => {
    expect(firstError({ ...valid, name: "   " })).toBe("กรุณากรอกชื่อเครื่องจักร");
  });

  it("enforces the length limits of the database", () => {
    expect(firstError({ ...valid, name: "a".repeat(101) })).toBe(
      "ชื่อเครื่องจักรยาวได้ไม่เกิน 100 ตัวอักษร",
    );
    expect(firstError({ ...valid, type: "a".repeat(51) })).toBe(
      "ประเภทเครื่องจักรยาวได้ไม่เกิน 50 ตัวอักษร",
    );
    expect(firstError({ ...valid, location: "a".repeat(101) })).toBe(
      "ตำแหน่งที่ตั้งยาวได้ไม่เกิน 100 ตัวอักษร",
    );
    expect(machineSchema.safeParse({ ...valid, type: "a".repeat(50) }).success).toBe(
      true,
    );
  });

  it("accepts only the four machine statuses", () => {
    for (const status of ["Running", "Stop", "Alarm", "Maintenance"]) {
      expect(machineSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
    expect(firstError({ ...valid, status: "Broken" })).toBe(
      "กรุณาเลือกสถานะเครื่องจักร",
    );
  });
});
