import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(statusCode: number, obj: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...cors,
    },
    body: JSON.stringify(obj),
  };
}

function extractLotId(event: any): string | null {
  const q = event.queryStringParameters?.id;
  if (typeof q === "string" && q.trim()) return q.trim();

  const path: string = event.path || "";
  const m = path.match(/\/api\/lots\/([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);

  return null;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "GET") return json(405, { error: "METHOD_NOT_ALLOWED" });

  const id = extractLotId(event);
  if (!id) {
    return json(400, {
      error: "Missing lot id",
      hint: "Call /.netlify/functions/lots-get?id=lot-xxxx OR /api/lots/lot-xxxx",
      got: { path: event.path, query: event.queryStringParameters },
    });
  }

  const { data, error } = await supabase
    .from("lots")
    .select("id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id")
    .eq("id", id)
    .maybeSingle();

  if (error) return json(400, { error: error.message });
  if (!data) return json(404, { error: "Lot not found", id });

  return json(200, {
    id: data.id,
    product: data.product_name,
    variety: data.variety ?? undefined,
    coopId: data.cooperative_id ?? undefined,
    cooperativeId: data.cooperative_id ?? undefined,
    coopName: undefined,
    region: data.region ?? undefined,
    harvestDate: data.harvest_date ?? undefined,
    quantityKg: data.quantity_kg == null ? undefined : Number(data.quantity_kg),
    certifications: data.certifications ?? [],
    passportId: data.passport_id ?? null,
    status: "ready",
    notes: undefined,
    photos: [],
  });
};
