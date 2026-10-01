import "server-only";
import { createClient } from "@/lib/supabase/server";

// Every user as a choice for a <select>, e.g. the responsible technician on a
// maintenance record. Any signed-in user may read profiles (names and roles,
// no emails), and the list is small, so it is not paginated.
export async function listProfileOptions() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .order("full_name");
  if (error) throw new Error(`listProfileOptions failed: ${error.message}`);
  return data;
}

export type ProfileOption = Awaited<ReturnType<typeof listProfileOptions>>[number];

// Users with email, for admins. The database function returns no rows for
// anyone else, so callers must also check the role with requireRole("admin").
export async function listUsersForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw new Error(`admin_list_users failed: ${error.message}`);
  return data;
}
