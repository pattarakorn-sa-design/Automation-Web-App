import "server-only";
import { createClient } from "@/lib/supabase/server";

// Users with email, for admins. The database function returns no rows for
// anyone else, so callers must also check the role with requireRole("admin").
export async function listUsersForAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw new Error(`admin_list_users failed: ${error.message}`);
  return data;
}
