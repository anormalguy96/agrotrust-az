import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type Payload = {
  userId?: string;
  email?: string | null;
  role?: string | null;

  fullName?: string | null;
  phoneE164?: string | null;
  phone?: string | null;

  companyName?: string | null;

  countryIso2?: string | null;
  country?: string | null;
  city?: string | null;
};

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function normText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t : null;
}

function normIso2(v: unknown): string | null {
  const t = normText(v);
  if (!t) return null;
  const iso = t.toUpperCase();
  return iso.length === 2 ? iso : iso;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }
    if (!event.body) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing request body" }) };
    }

    const parsed = JSON.parse(event.body) as unknown;
    if (!isObject(parsed)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    const payload = parsed as Payload;
    const userId = normText(payload.userId);

    if (!userId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };
    }

    const row: Record<string, unknown> = {
      app_user_id: userId,
    };

    if ("email" in payload) row.email = normText(payload.email);
    if ("role" in payload) row.role = normText(payload.role);

    if ("fullName" in payload) row.full_name = normText(payload.fullName);

    if ("phoneE164" in payload) row.phone_e164 = normText(payload.phoneE164);
    else if ("phone" in payload) row.phone_e164 = normText(payload.phone);

    if ("companyName" in payload) row.company_name = normText(payload.companyName);

    if ("countryIso2" in payload) row.country_iso2 = normIso2(payload.countryIso2);
    else if ("country" in payload) row.country_iso2 = normIso2(payload.country);

    if ("city" in payload) row.city = normText(payload.city);

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(row, { onConflict: "app_user_id" })
      .select("*")
      .single();

    if (error) {
      console.error("profile-update: supabase error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to update profile", details: error.message }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ profile: data }) };
  } catch (err) {
    console.error("profile-update: unexpected error", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected error updating profile" }) };
  }
};
