import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function json(statusCode: number, obj: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

export const handler: Handler = async (event) => {
  try {
    const id = event.queryStringParameters?.id?.trim();

    if (!id) {
      return json(400, {
        error: "Missing id query param",
        path: event.path,
        rawQuery: event.rawQuery,
        queryStringParameters: event.queryStringParameters,
      });
    }

    const { data, error } = await supabase
      .from("lots")
      .select("id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id")
      .eq("id", id)
      .single();

    if (error) return json(400, { error: error.message });

    return json(200, {
      id: data.id,
      product: data.product_name,
      variety: data.variety ?? undefined,
      coopId: data.cooperative_id ?? undefined,
      cooperativeId: data.cooperative_id ?? undefined,
      coopName: undefined,
      region: data.region ?? undefined,
      harvestDate: data.harvest_date ?? undefined,
      quantityKg: typeof data.quantity_kg === "number" ? data.quantity_kg : Number(data.quantity_kg),
      certifications: data.certifications ?? [],
      passportId: data.passport_id ?? null,
      status: "ready",
      notes: undefined,
      photos: [],
    });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Server error" });
  }
};
