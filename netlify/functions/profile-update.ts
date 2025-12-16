import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function digitsOnly(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Method not allowed" });
    }
    if (!event.body) {
      return json(400, { error: "Missing request body" });
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

    const userId = String(payload.userId ?? "").trim();
    if (!userId) {
      return json(400, { error: "Missing userId" });
    }

    const iso2 = String(payload.countryIso2 ?? "").trim().toUpperCase();
    const calling = digitsOnly(String(payload.phoneCountryCallingCode ?? ""));
    const national = digitsOnly(String(payload.phoneNational ?? ""));

    const computedE164 = calling && national ? `+${calling}${national}` : null;

    const row = {
      app_user_id: userId,

      full_name: payload.fullName ?? null,
      company_name: payload.companyName ?? null,

      country: payload.country ?? null,
      country_iso2: iso2 || null,

      phone_country_calling_code: calling || null,
      phone_e164: computedE164 ?? (payload.phoneE164 ?? null),

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(row, { onConflict: "app_user_id" })
      .select("*")
      .single();

    if (error) {
      console.error("profile-update: supabase error", error);
      return json(500, {
        error: "Failed to update profile",
        details: error.message,
      });
    }

    return json(200, { profile: data });
  } catch (err: any) {
    console.error("profile-update: unexpected error", err);
    return json(500, {
      error: "Unexpected error updating profile",
      details: err?.message ?? String(err),
    });
  }
};
