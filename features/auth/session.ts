import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRole, type Role } from "./roles";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
};

// The signed-in user with their profile, or null. Cached per request, so
// layouts, pages and Server Actions can all call it without extra queries.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  // getClaims() verifies the JWT, unlike getSession() which trusts the cookie.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!profile) return null;

  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    fullName: profile.full_name,
    role: profile.role,
  };
});

// For pages and Server Actions that need a signed-in user.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// For pages and Server Actions limited to some roles (REQ-AUTH-05, REQ-AUTH-06).
// Users without the role are sent to the dashboard with a message.
// This is the server-side check; RLS enforces the same rules in the database.
export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasRole(user.role, allowed)) redirect("/?error=forbidden");
  return user;
}
