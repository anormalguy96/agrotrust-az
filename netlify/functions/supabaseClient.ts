import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error("Missing required env var at runtime:", {
      name,
      available: Object.keys(process.env).filter((k) =>
        k.includes("SUPABASE")
      ),
    });
    throw new Error(`Missing env var: ${name}`);
  }
  return v;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  _client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _client;
}

export const supabaseAdmin = getSupabaseAdmin();
