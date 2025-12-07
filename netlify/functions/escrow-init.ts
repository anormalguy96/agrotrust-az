// agrotrust-az/netlify/functions/escrow-init.ts
// Hackathon-friendly mock escrow initialisation.
// This function simulates an escrow "funds held" step for a given export lot.

import { randomUUID } from "node:crypto";

type EscrowInitRequest = {
  buyerId: string;
  cooperativeId: string;
  lotId: string;
  amount: number | string;
  currency?: string; // e.g., "USD", "EUR", "AZN"
  expectedInspectionAt?: string; // ISO string (optional)
  notes?: string;
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
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ""
    };
  }

  if (method !== "POST") {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to initialise escrow."
    });
  }

  if (!event.body) {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Missing request body."
    });
  }

  let payload: EscrowInitRequest;

  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Invalid JSON body."
    });
  }

  const { buyerId, cooperativeId, lotId, currency, expectedInspectionAt, notes } = payload;

  const parsedAmount =
    typeof payload.amount === "string" ? Number(payload.amount) : payload.amount;

  if (!isNonEmptyString(buyerId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "buyerId",
      message: "buyerId is required."
    });
  }

  if (!isNonEmptyString(cooperativeId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "cooperativeId",
      message: "cooperativeId is required."
    });
  }

  if (!isNonEmptyString(lotId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "lotId",
      message: "lotId is required."
    });
  }

  if (typeof parsedAmount !== "number" || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "amount",
      message: "amount must be a positive number."
    });
  }

  const escrowId = randomUUID();
  const now = new Date().toISOString();

  // In a real system, this is where you would:
  // - create a payment intent
  // - lock funds with a PSP
  // - persist escrow + inspection rules in a database
  // For the hackathon MVP, we simply return a credible escrow object.

  const escrow = {
    escrowId,
    status: "FUNDS_HELD_PENDING_INSPECTION",
    amount: Number(parsedAmount.toFixed(2)),
    currency: isNonEmptyString(currency) ? currency.trim().toUpperCase() : "USD",
    buyerId: buyerId.trim(),
    cooperativeId: cooperativeId.trim(),
    lotId: lotId.trim(),
    createdAt: now,
    expectedInspectionAt: isNonEmptyString(expectedInspectionAt)
      ? expectedInspectionAt
      : null,
    notes: isNonEmptyString(notes) ? notes.trim() : null,
    inspectionPolicy: {
      trigger: "BORDER_INSPECTION",
      releaseOn: "PASS",
      holdOn: "FAIL"
    },
    demo: true,
    next: {
      releaseEndpoint: "/api/escrow/release"
    }
  };

  return jsonResponse(200, {
    ok: true,
    escrow
  });
};