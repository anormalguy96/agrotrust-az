import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

type Body = {
  userId?: string | null;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "cooperative" | "buyer" | "admin";
};

function json(statusCode: number, obj: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const body = JSON.parse(event.body || "{}") as Body;

    if (!body.email?.trim()) return json(400, { error: "email is required" });

    let uid = body.userId ?? null;

    if (!uid) {
      return json(400, { error: "userId is required" });
    }

    const dbRole = body.role === "admin" ? "admin" : body.role === "buyer" ? "buyer" : "coop";

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: uid,
          email: body.email.trim(),
          first_name: body.firstName?.trim() || null,
          last_name: body.lastName?.trim() || null,
          role: dbRole,
        },
        { onConflict: "id" }
      )
      .select("id, email, first_name, last_name, role")
      .single();

    if (error) return json(400, { error: error.message });

    return json(200, { ok: true, profile: data });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Server error" });
  }
};
