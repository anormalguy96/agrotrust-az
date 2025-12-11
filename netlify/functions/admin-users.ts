// netlify/functions/admin-users.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";
import { getCurrentUser } from "./authUtils"; // <-- you must hook this to your real auth

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  try {
    const authUser = await getCurrentUser(event);

    if (!authUser || authUser.role !== "admin") {
      return json(403, { error: "FORBIDDEN", message: "Admin only." });
    }

    if (event.httpMethod !== "GET") {
      return json(405, { error: "METHOD_NOT_ALLOWED" });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, role, phone, email_verified, is_suspended, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return json(500, { error: "DB_ERROR", message: error.message });
    }

    return json(200, { users: data ?? [] });
  } catch (err) {
    console.error(err);
    return json(500, { error: "SERVER_ERROR" });
  }
};
