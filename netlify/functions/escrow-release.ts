// agrotrust-az/netlify/functions/escrow-release.ts
// Hackathon-friendly mock escrow release.
// Simulates border inspection result and conditionally releases funds.

type EscrowReleaseRequest = {
  escrowId: string;
  inspectionResult?: "PASS" | "FAIL";
  inspectorId?: string;
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

// Deterministic demo outcome so the same escrowId tends to produce the same result
function deterministicOutcome(escrowId: string): "PASS" | "FAIL" {
  let score = 0;
  for (let i = 0; i < escrowId.length; i++) {
    score = (score + escrowId.charCodeAt(i) * (i + 1)) % 97;
  }
  return score % 2 === 0 ? "PASS" : "FAIL";
}

export const handler = async (event: {
  httpMethod?: string;
  body?: string;
  queryStringParameters?: Record<string, string | undefined>;
}) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (method !== "POST") {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to release escrow."
    });
  }

  if (!event.body) {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Missing request body."
    });
  }

  let payload: EscrowReleaseRequest;

  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Invalid JSON body."
    });
  }

  const { escrowId, inspectorId, notes } = payload;

  if (!isNonEmptyString(escrowId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "escrowId",
      message: "escrowId is required."
    });
  }

  // Allow an easy demo override:
  // /api/escrow/release?force=pass  OR  ?force=fail
  const force = event.queryStringParameters?.force?.toLowerCase();
  const forcedOutcome =
    force === "pass" ? "PASS" : force === "fail" ? "FAIL" : null;

  const inspectionResult =
    payload.inspectionResult ?? forcedOutcome ?? deterministicOutcome(escrowId.trim());

  const now = new Date().toISOString();

  const released = inspectionResult === "PASS";

  const escrowUpdate = {
    escrowId: escrowId.trim(),
    inspection: {
      result: inspectionResult,
      inspectedAt: now,
      inspectorId: isNonEmptyString(inspectorId) ? inspectorId.trim() : null,
      notes: isNonEmptyString(notes) ? notes.trim() : null
    },
    status: released ? "RELEASED_TO_FARMER" : "HELD_AFTER_FAILED_INSPECTION",
    releasedAt: released ? now : null,
    demo: true
  };

  return jsonResponse(200, {
    ok: true,
    escrow: escrowUpdate
  });
};