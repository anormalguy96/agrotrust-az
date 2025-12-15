// netlify/functions/rfqs-create.ts
import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && uuidRe.test(v.trim());
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
      createdBy?: string;
      buyerId?: string;
      cooperativeId?: string;
      lotId?: string;

      productName?: string; // preferred
      product?: string;     // allow old clients

      quantityKg?: number;
      targetPricePerKg?: number;
      regionPreference?: string;
      preferredCertifications?: string[];
      notes?: string;
    };

    const productName = (payload.productName ?? payload.product ?? "").trim();
    const quantityKg = Number(payload.quantityKg);

    if (!productName) {
      return { statusCode: 400, body: JSON.stringify({ error: "productName is required." }) };
    }
    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "quantityKg must be a positive number." }) };
    }

    // buyer_id & cooperative_id are UUID columns -> only store if valid UUID
    const buyerId = isUuid(payload.buyerId) ? payload.buyerId : null;
    const cooperativeId = isUuid(payload.cooperativeId) ? payload.cooperativeId : null;

    const { data, error } = await supabaseAdmin
      .from("rfqs")
      .insert({
        created_by: payload.createdBy ?? null,
        status: "draft",
        buyer_id: buyerId,
        cooperative_id: cooperativeId,
        lot_id: payload.lotId ?? null,

        // ✅ matches your DB columns
        product_name: productName,
        quantity_kg: quantityKg,
        target_price_per_kg: payload.targetPricePerKg ?? null,
        region_preference: payload.regionPreference ?? null,
        preferred_certifications: payload.preferredCertifications ?? [],
        notes: payload.notes ?? null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("rfqs-create supabase error:", error);
      return { statusCode: 500, body: JSON.stringify({ error: "DB_ERROR", message: error.message }) };
    }

    // Return raw DB row (your frontend mapper can map tolerant keys)
    return { statusCode: 201, body: JSON.stringify(data) };
  } catch (err) {
    console.error("rfqs-create unexpected:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Unexpected error creating RFQ" }) };
  }
};
