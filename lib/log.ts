// Records why a page or form fell back to its error state, so the cause shows
// up in the Vercel runtime logs (server) or the browser console (client)
// while the user only sees the Thai error message. Pass only the error the
// failing function threw: never env values, keys or a Supabase client
// (AGENTS.md: never print secrets in logs).
export function logLoadError(where: string, error: unknown): void {
  console.error(`[load error] ${where}:`, error instanceof Error ? error.message : error);
}
