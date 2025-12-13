import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Body = {
  cooperativeId: string;
  productName: string;
  variety?: string;
  quantityKg: number;
  region: string;
  harvestDate: string;
  certifications?: string[];
};

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}") as Body;

    // Basic validation
    if (!body.cooperativeId) return json(400, { error: "cooperativeId is required" });
    if (!isUuid(body.cooperativeId)) return json(400, { error: "cooperativeId must be a UUID" });
    if (!body.productName?.trim()) return json(400, { error: "productName is required" });
    if (!Number.isFinite(body.quantityKg) || body.quantityKg <= 0) {
      return json(400, { error: "quantityKg must be a positive number" });
    }
    if (!body.region?.trim()) return json(400, { error: "region is required" });
    if (!body.harvestDate?.trim()) return json(400, { error: "harvestDate is required" });

    const id = `lot-${crypto.randomUUID().slice(0, 8)}`;

    const { data, error } = await supabase
      .from("lots")
      .insert({
        id,
        cooperative_id: body.cooperativeId,
        product_name: body.productName.trim(),
        variety: body.variety?.trim() || null,
        quantity_kg: body.quantityKg,
        region: body.region.trim(),
        harvest_date: body.harvestDate,
        certifications: body.certifications ?? []
      })
      .select("*")
      .single();

    if (error) return json(400, { error: error.message });

    return json(201, { lot: data });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Server error" });
  }
};

function json(statusCode: number, obj: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj)
  };
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
