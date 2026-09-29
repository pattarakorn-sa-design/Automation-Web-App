"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { signInSchema } from "./schema";

export type SignInState = {
  fieldErrors?: { email?: string[]; password?: string[] };
  formError?: string;
  email?: string;
};

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail : "";

  const parsed = signInSchema.safeParse({
    email: rawEmail,
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // One message for a wrong email or a wrong password, so the form does not
    // reveal which accounts exist.
    const formError =
      error.code === "invalid_credentials"
        ? "Email หรือรหัสผ่านไม่ถูกต้อง"
        : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
    return { formError, email };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
