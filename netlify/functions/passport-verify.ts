import type { Handler } from "@netlify/functions";
import { supabaseAdmin } from "./supabaseClient";

type PassportVerifyRequest = {
  passportId: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

function looksLikeUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

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

type LotRow = {
  id: string;
  cooperative_id: string | null;
  product_name: string;
  variety: string | null;
  quantity_kg: number | null;
  unit: string | null;
  region: string | null;
  harvest_date: string | null;
  certifications: string[] | null;
  passport_id: string | null;
  created_at: string | null;
};

function toNumberOrNull(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export const handler: Handler = async (event) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  let passportId: string | undefined;

  if (method === "GET") {
    passportId = event.queryStringParameters?.passportId;
  } else if (method === "POST") {
    if (!event.body) {
      return json(400, { error: "BAD_REQUEST", message: "Missing request body." });
    }
    let payload: PassportVerifyRequest;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return json(400, { error: "BAD_REQUEST", message: "Invalid JSON body." });
    }
    passportId = payload.passportId;
  } else {
    return json(405, { error: "METHOD_NOT_ALLOWED", message: "Use GET or POST." });
  }

  if (!isNonEmptyString(passportId)) {
    return json(400, { error: "VALIDATION_ERROR", field: "passportId", message: "passportId is required." });
  }

  const id = passportId.trim();
  const checkedAt = new Date().toISOString();

  if (!looksLikeUUID(id)) {
    return json(404, {
      ok: false,
      verified: false,
      passportId: id,
      message: "Passport not found.",
      checkedAt,
    });
  }

  const { data: passport, error: pErr } = await supabaseAdmin
    .from("passports")
    .select(
      "id, lot_id, cooperative_id, product_name, product_variety, quantity_kg, unit, region, harvest_date, certifications, qr_payload, created_at"
    )
    .eq("id", id)
    .single<PassportRow>();

  if (pErr || !passport) {
    return json(404, {
      ok: false,
      verified: false,
      passportId: id,
      message: "Passport not found.",
      checkedAt,
    });
  }

  let lot: LotRow | null = null;
  if (passport.lot_id) {
    const { data: lotRow } = await supabaseAdmin
      .from("lots")
      .select(
        "id, cooperative_id, product_name, variety, quantity_kg, region, harvest_date, certifications, passport_id, created_at"
      )
      .eq("id", passport.lot_id)
      .maybeSingle<LotRow>();
    lot = lotRow ?? null;
  }

  const certs = Array.isArray(passport.certifications) ? passport.certifications : [];
  const hasPassportLinkedToLot = lot ? lot.passport_id === passport.id : false;

  const completenessScore =
    (passport.product_name ? 1 : 0) +
    (passport.lot_id ? 1 : 0) +
    (passport.region ? 1 : 0) +
    (passport.harvest_date ? 1 : 0) +
    (passport.qr_payload ? 1 : 0);

  const confidence = Math.min(0.99, 0.7 + completenessScore * 0.05 + (hasPassportLinkedToLot ? 0.05 : 0));

  const checks = [
    { name: "Passport exists in database", status: "PASS" as const },
    { name: "ID format", status: "PASS" as const },
    {
      name: "Lot link",
      status: passport.lot_id ? (hasPassportLinkedToLot ? ("PASS" as const) : ("WARN" as const)) : ("WARN" as const),
      detail: passport.lot_id
        ? hasPassportLinkedToLot
          ? "Lot.passport_id matches this passport."
          : "Lot exists but is not linked to this passport (Lot.passport_id differs or is null)."
        : "No lot_id on passport.",
    },
    {
      name: "Traceability completeness",
      status: completenessScore >= 4 ? ("PASS" as const) : ("WARN" as const),
    },
    {
      name: "Certification evidence",
      status: certs.length > 0 ? ("WARN" as const) : ("WARN" as const),
      detail: certs.length > 0 ? "Claims present (verification workflow not implemented in MVP)." : "No certifications listed.",
    },
  ];

  const summary = {
    originCountry: "Azerbaijan", // static for MVP (you can derive later)
    product: passport.product_name,
    variety: passport.product_variety ?? undefined,
    region: passport.region ?? undefined,
    harvestDate: passport.harvest_date ?? undefined,
    quantityKg: toNumberOrNull(passport.quantity_kg) ?? undefined,
    unit: passport.unit ?? "kg",
    certificationStatus:
      certs.length > 0 ? "Claims present (verification pending in MVP)" : "No certifications claimed",
  };

  return json(200, {
    ok: true,
    verified: true,
    passportId: passport.id,
    lotId: passport.lot_id,
    confidence,
    summary,
    checks,
    data: {
      passport: {
        id: passport.id,
        lotId: passport.lot_id,
        cooperativeId: passport.cooperative_id,
        createdAt: passport.created_at,
      },
      qrPayload: passport.qr_payload,
    },
    checkedAt,
    demo: false,
  });
};
