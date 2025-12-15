import type { Handler } from "@netlify/functions";
import { requireUser } from "./_lib/auth";
import { supabaseAdmin } from "./_lib/supabaseAdmin";

type RFQStatus = "draft" | "sent" | "answered" | "closed";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(body),
  };
}

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type CreatePayload = {
  productName?: string;
  product?: string;

  quantityKg?: number;
  targetPricePerKg?: number | null;
  regionPreference?: string | null;

  lotId?: string | null;
  cooperativeId?: string | null;

  notes?: string | null;

  buyerId?: string | null;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const auth = await requireUser(event);
  if (!auth.ok) return json(auth.status, { ok: false, error: auth.error });

  let payload: CreatePayload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { ok: false, error: "INVALID_JSON" });
  }

  const productName = (payload.productName ?? payload.product ?? "").trim();
  const quantityKg = Number(payload.quantityKg);

  if (!productName) {
    return json(400, { ok: false, error: "VALIDATION_ERROR", field: "productName", message: "productName is required." });
  }
  if (!Number.isFinite(quantityKg) || quantityKg <= 0) {
    return json(400, { ok: false, error: "VALIDATION_ERROR", field: "quantityKg", message: "quantityKg must be a positive number." });
  }

  const lotId = (payload.lotId ?? null) ? String(payload.lotId).trim() : null;

  const role = auth.profile?.role;
  const requesterId = auth.profile?.id;

  if (!requesterId || !isUuid(requesterId)) {
    return json(401, { ok: false, error: "UNAUTHORIZED", message: "Missing/invalid auth user id." });
  }

  let buyerId = requesterId;
  if (role === "admin" && payload.buyerId) {
    const candidate = String(payload.buyerId).trim();
    if (!isUuid(candidate)) {
      return json(400, { ok: false, error: "VALIDATION_ERROR", field: "buyerId", message: "buyerId must be a UUID." });
    }
    buyerId = candidate;
  } else if (role !== "admin" && role !== "buyer") {
    return json(403, { ok: false, error: "FORBIDDEN", message: "Only buyer/admin can create RFQs." });
  }

  let cooperativeId: string | null = null;

  if (payload.cooperativeId) {
    const c = String(payload.cooperativeId).trim();
    if (!isUuid(c)) {
      return json(400, { ok: false, error: "VALIDATION_ERROR", field: "cooperativeId", message: "cooperativeId must be a UUID." });
    }
    cooperativeId = c;
  } else if (lotId) {
    const { data: lot, error: lotErr } = await supabaseAdmin
      .from("lots")
      .select("id, cooperative_id")
      .eq("id", lotId)
      .single();

    if (lotErr || !lot) {
      return json(400, { ok: false, error: "VALIDATION_ERROR", field: "lotId", message: "lotId not found; cannot derive cooperative_id." });
    }

    if (!lot.cooperative_id || !isUuid(String(lot.cooperative_id))) {
      return json(400, { ok: false, error: "VALIDATION_ERROR", field: "lotId", message: "Lot has no valid cooperative_id." });
    }

    cooperativeId = String(lot.cooperative_id);
  }

  const targetPricePerKg =
    payload.targetPricePerKg === null || payload.targetPricePerKg === undefined
      ? null
      : Number(payload.targetPricePerKg);

  if (targetPricePerKg !== null && (!Number.isFinite(targetPricePerKg) || targetPricePerKg <= 0)) {
    return json(400, {
      ok: false,
      error: "VALIDATION_ERROR",
      field: "targetPricePerKg",
      message: "targetPricePerKg must be a positive number or null.",
    });
  }

  const regionPreference = payload.regionPreference ? String(payload.regionPreference).trim() : null;
  const notes = payload.notes ? String(payload.notes).trim() : null;

  const { data: row, error } = await supabaseAdmin
    .from("rfqs")
    .insert({
      buyer_id: buyerId,
      cooperative_id: cooperativeId,
      lot_id: lotId,
      product_name: productName,
      quantity_kg: quantityKg,
      target_price_per_kg: targetPricePerKg,
      region_preference: regionPreference,
      status: "draft",
      notes,
    })
    .select("*")
    .single();

  if (error || !row) {
    console.error("rfqs-create: supabase error", error);
    return json(500, { ok: false, error: "DB_ERROR", message: error?.message ?? "Failed to create RFQ." });
  }

  return json(201, {
    ok: true,
    rfq: {
      id: row.id,
      created_at: row.created_at,
      status: row.status as RFQStatus,
      buyer_id: row.buyer_id,
      cooperative_id: row.cooperative_id,
      lot_id: row.lot_id,
      product_name: row.product_name,
      quantity_kg: row.quantity_kg,
      target_price_per_kg: row.target_price_per_kg,
      region_preference: row.region_preference,
      notes: row.notes,
    },
  });
};
