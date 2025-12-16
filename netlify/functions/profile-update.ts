import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && uuidRe.test(v.trim());
}

function digitsOnly(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

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
      companyName?: string | null;

      country?: string | null;
      countryIso2?: string | null;
      city?: string | null;

      phoneCountryCallingCode?: string | null;
      phoneNational?: string | null;
      phoneE164?: string | null;
    };

    const userId = (payload.userId ?? "").trim();
    if (!isUuid(userId)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing/invalid userId" }) };
    }

    const iso2 = (payload.countryIso2 ?? "").trim().toUpperCase();
    const calling = digitsOnly(String(payload.phoneCountryCallingCode ?? ""));
    const national = digitsOnly(String(payload.phoneNational ?? ""));

    const computedE164 =
      calling && national ? `+${calling}${national}` : null;

    const row = {
      id: userId,

      app_user_id: userId,

      full_name: payload.fullName ?? null,
      company_name: payload.companyName ?? null,

      country: payload.country ?? null,
      country_iso2: iso2 || null,
      city: payload.city ?? null,

      phone_country_calling_code: calling || null,
      phone_e164: computedE164 ?? (payload.phoneE164 ?? null),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(row, { onConflict: "id" })
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

