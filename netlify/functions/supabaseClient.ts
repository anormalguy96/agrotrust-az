import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  
  console.error("Supabase admin env vars missing at runtime:", {
    has_SUPABASE_URL: !!process.env.SUPABASE_URL,
    has_SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  throw new Error("Supabase admin env vars missing at runtime");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
