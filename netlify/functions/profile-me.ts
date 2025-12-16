import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const userId = (event.queryStringParameters?.userId ?? "").trim();
    if (!userId) {
      return json(400, { error: "Missing userId" });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("app_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("profile-me: supabase error", error);
      return json(500, {
        error: "Failed to load profile",
        details: error.message,
      });
    }

    return json(200, {
      profile: data ?? { app_user_id: userId },
    });
  } catch (err: any) {
    console.error("profile-me: unexpected error", err);
    return json(500, {
      error: "Unexpected error loading profile",
      details: err?.message ?? String(err),
    });
  }
};
