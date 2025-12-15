// netlify/functions/passport-create.ts
import type { Handler } from "@netlify/functions";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseClient";

type ProductPayload = {
  name?: string;
  variety?: string;
  quantity?: number;
  unit?: string;
};

type HarvestPayload = {
  region?: string;
  harvestDate?: string;
};

type RequestBody = {
  lotId: string;
  cooperativeId?: string;
  product?: ProductPayload;
  harvest?: HarvestPayload;
  certifications?: string[];
  forceNew?: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(statusCode: number, data: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(data),
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string").map((x) => x.trim()).filter(Boolean);
}

function toISODateOrNull(v: unknown): string | null {
  if (!isNonEmptyString(v)) return null;
  
  const s = v.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

type LotRow = {
  id: string;
  cooperative_id: string | null;
  product_name: string;
  variety: string | null;
  quantity_kg: number | null;
  region: string | null;
  harvest_date: string | null;
  certifications: string[] | null;
  passport_id: string | null;
};

type PassportRow = {
  id: string;
  lot_id: string;
  cooperative_id: string | null;
  product_name: string;
  product_variety: string | null;
  quantity_kg: number | null;
  unit: string | null;
  region: string | null;
  harvest_date: string | null;
  certifications: string[] | null;
  qr_payload: string;
  created_at: string | null;
};

export const handler: Handler = async (event) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (method !== "POST") {
    return json(405, { error: "METHOD_NOT_ALLOWED", message: "Use POST." });
  }

  if (!event.body) {
    return json(400, { error: "BAD_REQUEST", message: "Missing request body." });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body);
  } catch {
    return json(400, { error: "BAD_REQUEST", message: "Invalid JSON body." });
  }

  const lotId = (body.lotId || "").trim();
  if (!lotId) {
    return json(400, { error: "VALIDATION_ERROR", field: "lotId", message: "lotId is required." });
  }

  const forceFromQuery = (event.queryStringParameters?.force || "").trim();
  const forceNew = Boolean(body.forceNew) || forceFromQuery === "1" || forceFromQuery.toLowerCase() === "true";

  const { data: lot, error: lotErr } = await supabaseAdmin
    .from("lots")
    .select(
      "id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id"
    )
    .eq("id", lotId)
    .single<LotRow>();

  if (lotErr || !lot) {
    return json(404, { error: "NOT_FOUND", message: "Lot not found." });
  }

  if (lot.passport_id && !forceNew) {
    const { data: existing, error: pErr } = await supabaseAdmin
      .from("passports")
      .select("id, lot_id, qr_payload, created_at")
      .eq("id", lot.passport_id)
      .single<Pick<PassportRow, "id" | "lot_id" | "qr_payload" | "created_at">>();

    if (!pErr && existing) {
      return json(200, {
        passportId: existing.id,
        lotId: existing.lot_id,
        qrPayload: existing.qr_payload,
        createdAt: existing.created_at,
        status: "linked",
      });
    }
  }

  const productName = (body.product?.name ?? lot.product_name ?? "").trim();
  if (!productName) {
    return json(400, {
      error: "VALIDATION_ERROR",
      field: "product.name",
      message: "Product name is missing (from payload and lot).",
    });
  }

  const variety = (body.product?.variety ?? lot.variety ?? "").trim() || null;

  const quantityKg =
    typeof body.product?.quantity === "number" && Number.isFinite(body.product.quantity)
      ? body.product.quantity
      : lot.quantity_kg ?? null;

  const unit = (body.product?.unit ?? "kg").trim() || "kg";

  const region = (body.harvest?.region ?? lot.region ?? "").trim() || null;
  const harvestDate = toISODateOrNull(body.harvest?.harvestDate) ?? lot.harvest_date ?? null;

  const certs =
    body.certifications != null
      ? asStringArray(body.certifications)
      : Array.isArray(lot.certifications)
      ? lot.certifications
      : [];

  const coopId =
    (lot.cooperative_id && lot.cooperative_id.trim()) ||
    (body.cooperativeId && body.cooperativeId.trim()) ||
    null;

  const passportId = crypto.randomUUID();

  const qrPayloadObject = {
    passportId,
    lotId: lot.id,
    cooperativeId: coopId,
    product: {
      name: productName,
      variety,
      quantityKg,
      unit,
    },
    harvest: {
      region,
      harvestDate,
    },
    certifications: certs,
    createdAt: new Date().toISOString(),
    source: "db",
  };

  const qrPayload = JSON.stringify(qrPayloadObject);

  const { error: insertErr } = await supabaseAdmin.from("passports").insert({
    id: passportId,
    lot_id: lot.id,
    cooperative_id: coopId,
    product_name: productName,
    product_variety: variety,
    quantity_kg: quantityKg,
    unit,
    region,
    harvest_date: harvestDate,
    certifications: certs,
    qr_payload: qrPayload,
  });

  if (insertErr) {
    return json(500, { error: "DB_ERROR", message: insertErr.message });
  }

  const { error: updErr } = await supabaseAdmin
    .from("lots")
    .update({ passport_id: passportId })
    .eq("id", lot.id);

  if (updErr) {
    return json(200, {
      passportId,
      lotId: lot.id,
      qrPayload,
      createdAt: qrPayloadObject.createdAt,
      status: "created_but_lot_not_linked",
      warning: updErr.message,
    });
  }

  return json(201, {
    passportId,
    lotId: lot.id,
    qrPayload,
    createdAt: qrPayloadObject.createdAt,
    status: "created",
  });
};
