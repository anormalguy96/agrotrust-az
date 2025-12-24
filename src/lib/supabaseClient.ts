import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // This helps you catch "undefined env vars" immediately
  console.error("Missing Supabase env vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

console.log("VITE_SUPABASE_URL =", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);