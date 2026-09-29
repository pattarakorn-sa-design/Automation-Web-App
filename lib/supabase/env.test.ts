import { afterEach, describe, expect, it, vi } from "vitest";

// env.ts reads process.env when the module is loaded, so each test
// sets the variables first and then imports a fresh copy of the module.
async function loadGetSupabaseEnv() {
  vi.resetModules();
  const mod = await import("./env");
  return mod.getSupabaseEnv;
}

describe("getSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the url and publishable key when both are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const getSupabaseEnv = await loadGetSupabaseEnv();

    expect(getSupabaseEnv()).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("throws when the url is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const getSupabaseEnv = await loadGetSupabaseEnv();

    expect(() => getSupabaseEnv()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when the publishable key is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const getSupabaseEnv = await loadGetSupabaseEnv();

    expect(() => getSupabaseEnv()).toThrow(/PUBLISHABLE_KEY/);
  });
});
