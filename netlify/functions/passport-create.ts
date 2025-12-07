// agrotrust-az/netlify/functions/passport-create.ts
// Hackathon-friendly mock Digital Product Passport creation.
// Generates a passport object and QR payload for a product lot.

import { randomUUID } from "node:crypto";

type PassportCreateRequest = {
  cooperativeId: string;
  lotId?: string;

  product: {
    name: string;           // e.g., "Tomatoes", "Hazelnuts"
    variety?: string;       // optional
    quantity?: number;      // optional
    unit?: string;          // e.g., "kg", "ton"
  };

  harvest: {
    harvestDate: string;    // ISO or YYYY-MM-DD
    region?: string;        // e.g., "Masalli", "Ganja"
    farmName?: string;
  };

  inputs?: {
    fertilisers?: string[];
    pesticides?: string[];
    irrigationType?: string;
  };

  media?: {
    photos?: string[];      // URLs or base64 placeholders for MVP
  };

  certifications?: {
    claimed?: string[];     // e.g., ["GlobalG.A.P", "Organic"]
  };
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(statusCode: number, data: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    },
    body: JSON.stringify(data)
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export const handler = async (event: { httpMethod?: string; body?: string }) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (method !== "POST") {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to create a passport."
    });
  }

  if (!event.body) {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Missing request body."
    });
  }

  let payload: PassportCreateRequest;

  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Invalid JSON body."
    });
  }

  if (!isNonEmptyString(payload.cooperativeId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "cooperativeId",
      message: "cooperativeId is required."
    });
  }

  if (!payload.product || !isNonEmptyString(payload.product.name)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "product.name",
      message: "product.name is required."
    });
  }

  if (!payload.harvest || !isNonEmptyString(payload.harvest.harvestDate)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "harvest.harvestDate",
      message: "harvest.harvestDate is required."
    });
  }

  const passportId = randomUUID();
  const lotId = isNonEmptyString(payload.lotId) ? payload.lotId.trim() : randomUUID();
  const createdAt = new Date().toISOString();

  // QR payload for the MVP.
  // In production, you'd likely point this to a public verification page on your domain.
  const qrPayload = JSON.stringify({
    scheme: "agrotrust-passport",
    passportId,
    lotId,
    cooperativeId: payload.cooperativeId.trim()
  });

  const passport = {
    passportId,
    lotId,
    cooperativeId: payload.cooperativeId.trim(),
    product: {
      name: payload.product.name.trim(),
      variety: isNonEmptyString(payload.product.variety) ? payload.product.variety.trim() : null,
      quantity:
        typeof payload.product.quantity === "number" && payload.product.quantity > 0
          ? payload.product.quantity
          : null,
      unit: isNonEmptyString(payload.product.unit) ? payload.product.unit.trim() : null
    },
    harvest: {
      harvestDate: payload.harvest.harvestDate,
      region: isNonEmptyString(payload.harvest.region) ? payload.harvest.region.trim() : "Azerbaijan",
      farmName: isNonEmptyString(payload.harvest.farmName) ? payload.harvest.farmName.trim() : null
    },
    inputs: {
      fertilisers: payload.inputs?.fertilisers ?? [],
      pesticides: payload.inputs?.pesticides ?? [],
      irrigationType: isNonEmptyString(payload.inputs?.irrigationType)
        ? payload.inputs?.irrigationType!.trim()
        : null
    },
    media: {
      photos: payload.media?.photos ?? []
    },
    certifications: {
      claimed: payload.certifications?.claimed ?? [],
      verified: [] as string[]
    },
    integrity: {
      ledger: "mock",
      signature: "demo-only"
    },
    qr: {
      payload: qrPayload
    },
    createdAt,
    demo: true
  };

  return jsonResponse(200, {
    ok: true,
    passport
  });
};
