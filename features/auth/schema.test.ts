import { describe, expect, it } from "vitest";
import { signInSchema } from "./schema";

describe("signInSchema", () => {
  it("accepts a valid email and password and trims the email", () => {
    const result = signInSchema.safeParse({
      email: "  tech@example.com ",
      password: "secret",
    });

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("tech@example.com");
  });

  it("asks for an email when it is empty or only spaces", () => {
    const result = signInSchema.safeParse({ email: "   ", password: "secret" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("กรุณากรอก Email");
  });

  it("rejects an email with the wrong format", () => {
    const result = signInSchema.safeParse({ email: "tech", password: "secret" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("รูปแบบ Email ไม่ถูกต้อง");
  });

  it("asks for a password when it is empty", () => {
    const result = signInSchema.safeParse({
      email: "tech@example.com",
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("กรุณากรอกรหัสผ่าน");
  });
});
