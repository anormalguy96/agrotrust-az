// netlify/functions/passport-create.ts
import type { Handler } from "@netlify/functions";
import crypto from "node:crypto";
import { supabaseAdmin } from "./supabaseClient";

type ProductPayload = {
  name: string;
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
};

function badRequest(message: string, field?: string) {
  return {
    statusCode: 400,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error: "VALIDATION_ERROR",
      field,
      message,
    }),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Allow": "POST" },
      body: "Method Not Allowed",
    };
  }

  if (!event.body) {
    return badRequest("Request body is required.");
  }

  let payload: RequestBody;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const {
    lotId,
    cooperativeId,
    product,
    harvest,
    certifications = [],
  } = payload;

  if (!lotId || typeof lotId !== "string") {
    return badRequest("lotId is required.", "lotId");
  }

  if (!product || typeof product !== "object") {
    return badRequest("product is required.", "product");
  }

  if (!product.name || !product.name.trim()) {
    return badRequest("product.name is required.", "product.name");
  }

  // Normalise data
  const coopId = cooperativeId || null;
  const quantity =
    typeof product.quantity === "number" ? product.quantity : null;
  const unit = product.unit || "kg";

  const region = harvest?.region ?? null;
  const harvestDate = harvest?.harvestDate ?? null;

  const certs = Array.isArray(certifications)
    ? certifications.filter((c) => typeof c === "string")
    : [];

  // Generate a stable passport ID + QR payload
  const passportId = crypto.randomUUID();

  const qrPayloadObject = {
    passportId,
    lotId,
    cooperativeId: coopId,
    product: {
      name: product.name,
      variety: product.variety ?? null,
      quantity,
      unit,
    },
    harvest: {
      region,
      harvestDate,
    },
    certifications: certs,
  };

  const qrPayload = JSON.stringify(qrPayloadObject);

  // Persist to Supabase
  const { error } = await supabaseAdmin.from("passports").insert({
    id: passportId,
    lot_id: lotId,
    cooperative_id: coopId,
    product_name: product.name,
    product_variety: product.variety ?? null,
    quantity_kg: quantity,
    unit,
    region,
    harvest_date: harvestDate,
    certifications: certs,
    qr_payload: qrPayload,
  });

  if (error) {
    console.error("Supabase insert error (passports):", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "DB_ERROR",
        message: error.message,
      }),
    };
  }

  const responseBody = {
    passportId,
    lotId,
    qrPayload,
    createdAt: new Date().toISOString(),
    status: "created" as const,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(responseBody),
  };
};
