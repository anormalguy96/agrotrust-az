import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }

    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing request body" }) };
    }

    const payload = JSON.parse(event.body) as {
      userId?: string;
      fullName?: string | null;
      phone?: string | null;
      companyName?: string | null;
      country?: string | null;
      city?: string | null;
    };

    const userId = payload.userId ?? null;
    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };
    }

    const updateRow: any = {
      full_name: payload.fullName ?? null,
      phone: payload.phone ?? null,
      company_name: payload.companyName ?? null,
      country: payload.country ?? null,
      city: payload.city ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updateRow)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("profile-update: supabase error", error);
      return { statusCode: 500, body: JSON.stringify({ error: "Failed to update profile", details: error.message }) };
    }

    return { statusCode: 200, body: JSON.stringify({ profile: data }) };
  } catch (err) {
    console.error("profile-update: unexpected error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected error updating profile" }) };
  }
};
