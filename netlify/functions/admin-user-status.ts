import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";
import { getCurrentUser } from "./authUtils";

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

    if (event.httpMethod !== "POST") {
      return json(405, { error: "METHOD_NOT_ALLOWED" });
    }

    const body = JSON.parse(event.body || "{}") as {
      userId?: string;
      suspend?: boolean;
    };

    if (!body.userId || typeof body.suspend !== "boolean") {
      return json(400, { error: "BAD_REQUEST" });
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        is_suspended: body.suspend,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.userId);

    if (error) {
      console.error(error);
      return json(500, { error: "DB_ERROR", message: error.message });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error(err);
    return json(500, { error: "SERVER_ERROR" });
  }
};