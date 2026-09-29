import { describe, expect, it } from "vitest";
import { updateOwnNameSchema, updateUserSchema } from "./schema";

const userId = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";

describe("updateUserSchema", () => {
  it("accepts a valid user, trimmed name and role", () => {
    const result = updateUserSchema.safeParse({
      userId,
      fullName: "  Somchai  ",
      role: "technician",
    });

    expect(result.success).toBe(true);
    expect(result.data?.fullName).toBe("Somchai");
  });

  it("rejects a role that does not exist", () => {
    const result = updateUserSchema.safeParse({
      userId,
      fullName: "Somchai",
      role: "owner",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("กรุณาเลือก Role ที่ถูกต้อง");
  });

  it("rejects an invalid user id", () => {
    const result = updateUserSchema.safeParse({
      userId: "not-a-uuid",
      fullName: "Somchai",
      role: "admin",
    });

    expect(result.success).toBe(false);
  });
});

describe("updateOwnNameSchema", () => {
  it("rejects a name that is only spaces", () => {
    const result = updateOwnNameSchema.safeParse({ fullName: "   " });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("กรุณากรอกชื่อ");
  });

  it("rejects a name longer than 100 characters", () => {
    const result = updateOwnNameSchema.safeParse({ fullName: "a".repeat(101) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe(
      "ชื่อยาวได้ไม่เกิน 100 ตัวอักษร",
    );
  });

  it("accepts a name of exactly 100 characters", () => {
    expect(
      updateOwnNameSchema.safeParse({ fullName: "a".repeat(100) }).success,
    ).toBe(true);
  });
});
