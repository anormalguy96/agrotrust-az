import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

const storage = typeof window !== "undefined" ? window.localStorage : undefined;

const g = globalThis as unknown as { __agrotrust_supabase__?: SupabaseClient };

export const supabase =
  g.__agrotrust_supabase__ ??
  (g.__agrotrust_supabase__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
      storageKey: "agrotrust-auth", // ✅ avoids fighting old sb-* keys
    },
  }));