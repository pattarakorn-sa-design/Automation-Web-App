import { z } from "zod";
import { Constants } from "@/types/database";

// Same rule as the profiles.full_name check in the database.
export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกชื่อ")
  .max(100, "ชื่อยาวได้ไม่เกิน 100 ตัวอักษร");

// Admin editing another user on the Users page.
export const updateUserSchema = z.object({
  userId: z.uuid("ไม่พบผู้ใช้ที่ต้องการแก้ไข"),
  fullName: fullNameSchema,
  role: z.enum(Constants.public.Enums.app_role, "กรุณาเลือก Role ที่ถูกต้อง"),
});

// Any user editing their own name on the Profile page (REQ-AUTH-09).
export const updateOwnNameSchema = z.object({
  fullName: fullNameSchema,
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
