"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, requireUser } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import { updateOwnNameSchema, updateUserSchema } from "./schema";

export type FormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  success?: string;
};

const SAVE_FAILED = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

// Admin changes another user's name or role (REQ-AUTH-07).
export async function updateUser(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireRole("admin");

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { userId, fullName, role } = parsed.data;
  if (userId === admin.id) {
    return {
      formError: "แก้ข้อมูลของตัวเองได้ที่หน้า Profile และเปลี่ยน Role ของตัวเองไม่ได้",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, role })
    .eq("id", userId)
    .select("id");

  if (error) return { formError: SAVE_FAILED };
  // RLS filters out rows the user may not update, so no row means no access.
  if (data.length === 0) return { formError: "ไม่พบผู้ใช้ หรือคุณไม่มีสิทธิ์แก้ไข" };

  revalidatePath("/users");
  return { success: "บันทึกแล้ว" };
}

// Any user fixes their own display name (REQ-AUTH-09).
export async function updateOwnName(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();

  const parsed = updateOwnNameSchema.safeParse({
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", user.id);

  if (error) return { formError: SAVE_FAILED };

  revalidatePath("/", "layout");
  return { success: "บันทึกชื่อแล้ว" };
}
