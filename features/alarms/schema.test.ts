import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { alarmDetailsSchema, alarmStatusSchema } from "./schema";

const machineId = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";

// "Now" is 2026-09-30 12:00 in Bangkok (05:00 UTC).
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T05:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

const details = {
  machineId,
  alarmCode: "E-101",
  description: "Injection pressure too high",
  occurredAt: "2026-09-30T10:15",
  cause: "",
};

function detailsError(input: Record<string, unknown>) {
  const result = alarmDetailsSchema.safeParse(input);
  return result.success ? undefined : result.error.issues[0].message;
}

describe("alarmDetailsSchema", () => {
  it("accepts valid details, uppercases the code and reads the time as Bangkok time", () => {
    const result = alarmDetailsSchema.safeParse({ ...details, alarmCode: " e-101 " });

    expect(result.success).toBe(true);
    expect(result.data?.alarmCode).toBe("E-101");
    expect(result.data?.occurredAt.toISOString()).toBe("2026-09-30T03:15:00.000Z");
  });

  it("requires a machine", () => {
    expect(detailsError({ ...details, machineId: "" })).toBe("กรุณาเลือกเครื่องจักร");
  });

  it.each(["E", "E 101", "E_101", "x".repeat(21)])(
    "rejects the alarm code %j",
    (alarmCode) => {
      expect(detailsError({ ...details, alarmCode })).toMatch(/^Alarm Code ต้องเป็น/);
    },
  );

  it("requires a description of at most 500 characters", () => {
    expect(detailsError({ ...details, description: "  " })).toBe(
      "กรุณากรอกรายละเอียด Alarm",
    );
    expect(detailsError({ ...details, description: "a".repeat(501) })).toBe(
      "รายละเอียดยาวได้ไม่เกิน 500 ตัวอักษร",
    );
  });

  it("rejects a time in the future but allows a few minutes of clock difference", () => {
    expect(detailsError({ ...details, occurredAt: "2026-09-30T13:00" })).toBe(
      "เวลาที่เกิด Alarm ต้องไม่อยู่ในอนาคต",
    );
    expect(alarmDetailsSchema.safeParse({ ...details, occurredAt: "2026-09-30T12:03" }).success).toBe(true);
  });

  it("asks for the time when it is empty and rejects a broken value", () => {
    expect(detailsError({ ...details, occurredAt: "" })).toBe(
      "กรุณาระบุวันและเวลาที่เกิด Alarm",
    );
    expect(detailsError({ ...details, occurredAt: "yesterday" })).toBe(
      "วันและเวลาไม่ถูกต้อง",
    );
  });
});

describe("alarmStatusSchema (BR-ALM-03)", () => {
  function fieldErrors(input: Record<string, unknown>) {
    const result = alarmStatusSchema.safeParse(input);
    return result.success
      ? {}
      : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
  }

  it("allows moving to In Progress without notes", () => {
    expect(
      alarmStatusSchema.safeParse({ status: "In Progress", cause: "", actionTaken: "" })
        .success,
    ).toBe(true);
  });

  it("needs both cause and action taken to close, and points at each missing field", () => {
    expect(fieldErrors({ status: "Closed", cause: " ", actionTaken: "" })).toEqual({
      cause: "กรุณากรอก Cause ก่อนปิด Alarm",
      actionTaken: "กรุณากรอก Action Taken ก่อนปิด Alarm",
    });
    expect(fieldErrors({ status: "Closed", cause: "Worn heater", actionTaken: "" })).toEqual({
      actionTaken: "กรุณากรอก Action Taken ก่อนปิด Alarm",
    });
  });

  it("closes when both notes are given and trims them", () => {
    const result = alarmStatusSchema.safeParse({
      status: "Closed",
      cause: " Worn heater ",
      actionTaken: " Replaced it ",
    });
    expect(result.data).toEqual({
      status: "Closed",
      cause: "Worn heater",
      actionTaken: "Replaced it",
    });
  });

  it("rejects an unknown status and notes that are too long", () => {
    expect(fieldErrors({ status: "Done", cause: "", actionTaken: "" })).toEqual({
      status: "กรุณาเลือกสถานะ",
    });
    expect(
      fieldErrors({ status: "Open", cause: "a".repeat(501), actionTaken: "a".repeat(1001) }),
    ).toEqual({
      cause: "Cause ยาวได้ไม่เกิน 500 ตัวอักษร",
      actionTaken: "Action Taken ยาวได้ไม่เกิน 1000 ตัวอักษร",
    });
  });
});
