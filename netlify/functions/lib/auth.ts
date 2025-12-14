import type { HandlerEvent } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseAdmin";

export async function requireUser(event: HandlerEvent) {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing Authorization Bearer token." };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: false as const, status: 401, error: "Invalid or expired session." };
  }

  const user = data.user;
  const { data: profile, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, email, first_name, last_name, role")
    .eq("id", user.id)
    .single();

  if (pErr || !profile) {
    return { ok: false as const, status: 403, error: "Profile not found." };
  }

  return { ok: true as const, user, profile, token };
}
