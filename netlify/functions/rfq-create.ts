import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: unknown): v is string {
  return typeof v === "string" && uuidRe.test(v.trim());
}

function num(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? ""));
  return Number.isFinite(n) ? n : NaN;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    const payload = JSON.parse(event.body) as {
      createdBy?: string | null;

      buyerId?: string | null;
      buyerName?: string | null;

      cooperativeId?: string | null; 
      lotId?: string | null;

      product?: string | null;
      productName?: string | null;

      quantityKg?: number | string | null;
      targetPricePerKg?: number | string | null;
      regionPreference?: string | null;

      preferredCertifications?: string[] | null;
      notes?: string | null;
    };

    const productName = String(payload.productName ?? payload.product ?? "").trim();
    const quantityKg = num(payload.quantityKg);

    if (!productName) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "product (or productName) is required." }),
      };
    }

    if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "quantityKg must be a positive number." }),
      };
    }

    const buyerId = isUuid(payload.buyerId) ? payload.buyerId : null;
    const cooperativeId = isUuid(payload.cooperativeId) ? payload.cooperativeId : null;

    const createdBy =
      (payload.createdBy && String(payload.createdBy).trim()) ||
      buyerId ||
      cooperativeId ||
      null;

    const insertRow = {
      created_by: createdBy,
      status: "draft",

      buyer_id: buyerId,
      buyer_name: (payload.buyerName ?? null) ? String(payload.buyerName).trim() : null,

      cooperative_id: cooperativeId,
      lot_id: payload.lotId ?? null,

      product_name: productName,
      product: productName,

      quantity_kg: quantityKg,
      target_price_per_kg:
        payload.targetPricePerKg === null || payload.targetPricePerKg === undefined || payload.targetPricePerKg === ""
          ? null
          : Number(payload.targetPricePerKg),

      region_preference: payload.regionPreference ?? null,
      preferred_certifications: Array.isArray(payload.preferredCertifications)
        ? payload.preferredCertifications
        : [],

      notes: payload.notes ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from("rfqs")
      .insert(insertRow)
      .select(
        "id,created_at,status,buyer_id,buyer_name,cooperative_id,lot_id,product,product_name,quantity_kg,target_price_per_kg,region_preference,preferred_certifications,notes,created_by"
      )
      .single();

    if (error) {
      console.error("rfq-create supabase error:", error);
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "DB_ERROR", message: error.message }),
      };
    }

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("rfq-create unexpected:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Unexpected error creating RFQ" }),
    };
  }
};
