import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// For Client Components. Uses the publishable key only, so every query is
// subject to Row Level Security.
export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
