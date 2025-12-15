import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

function normText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    const userId = normText(event.queryStringParameters?.userId);
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("app_user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("profile-me: supabase error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to load profile", details: error.message }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ profile: data ?? { app_user_id: userId } }),
    };
  } catch (err) {
    console.error("profile-me: unexpected error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected error loading profile" }) };
  }
};
