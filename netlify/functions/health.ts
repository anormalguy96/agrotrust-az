// agrotrust-az/netlify/functions/health.ts
// Simple health check for Netlify Functions.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
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

export const handler = async (event: { httpMethod?: string }) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (method !== "GET") {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use GET for health check."
    });
  }

  return jsonResponse(200, {
    ok: true,
    service: "agrotrust-az",
    functions: "healthy",
    timestamp: new Date().toISOString()
  });
};