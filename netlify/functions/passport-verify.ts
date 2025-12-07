// agrotrust-az/netlify/functions/passport-verify.ts
// Hackathon-friendly mock Digital Product Passport verification.
// Accepts GET with ?passportId= or POST with { passportId }.
// Returns a plausible verification response.

type PassportVerifyRequest = {
  passportId: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
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

// Very lightweight "validity" heuristic for MVP
function looksLikeUUID(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
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

  let passportId: string | undefined;

  if (method === "GET") {
    passportId = event.queryStringParameters?.passportId;
  } else if (method === "POST") {
    if (!event.body) {
      return jsonResponse(400, {
        error: "BAD_REQUEST",
        message: "Missing request body."
      });
    }

    let payload: PassportVerifyRequest;
    try {
      payload = JSON.parse(event.body);
    } catch {
      return jsonResponse(400, {
        error: "BAD_REQUEST",
        message: "Invalid JSON body."
      });
    }
    passportId = payload.passportId;
  } else {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use GET or POST to verify a passport."
    });
  }

  if (!isNonEmptyString(passportId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "passportId",
      message: "passportId is required."
    });
  }

  const id = passportId.trim();
  const now = new Date().toISOString();

  if (!looksLikeUUID(id)) {
    return jsonResponse(404, {
      ok: false,
      verified: false,
      passportId: id,
      message: "Passport not found (demo validation).",
      checkedAt: now
    });
  }

  // Mock verified response.
  // The UI can display this as the buyer-facing trust view.
  const result = {
    ok: true,
    verified: true,
    passportId: id,
    confidence: 0.92,
    summary: {
      originCountry: "Azerbaijan",
      product: "Agricultural lot",
      freshnessStatus: "Within declared harvest window",
      certificationStatus: "Claims present (verification pending in MVP)"
    },
    checks: [
      { name: "ID format", status: "PASS" },
      { name: "Ledger signature", status: "PASS", provider: "mock" },
      { name: "Traceability completeness", status: "PASS" },
      { name: "Certification evidence", status: "WARN" }
    ],
    checkedAt: now,
    demo: true
  };

  return jsonResponse(200, result);
};