import { z } from "zod";

// Shared by the login form and the sign-in Server Action, so the client and
// the server validate with the same rules (REQ-VAL-02).
export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอก Email")
    .pipe(z.email("รูปแบบ Email ไม่ถูกต้อง")),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type SignInInput = z.infer<typeof signInSchema>;
