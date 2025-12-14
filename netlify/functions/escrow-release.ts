import type { Handler } from "@netlify/functions";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

type EscrowReleaseRequest = {
  escrowId: string;
  inspectorId?: string;
  notes?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(statusCode: number, data: unknown) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
    body: JSON.stringify(data),
  };
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function getBearerToken(authHeader?: string | null) {
  if (!authHeader) return null;
  const h = authHeader.trim();
  if (!h.toLowerCase().startsWith("bearer ")) return null;
  return h.slice(7).trim();
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  
});

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const handler: Handler = async (event) => {
  const method = event.httpMethod?.toUpperCase();

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (method !== "POST") {
    return jsonResponse(405, {
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to release escrow.",
    });
  }

  const token = getBearerToken(
    (event.headers.authorization as string | undefined) ??
      (event.headers.Authorization as string | undefined) ??
      null
  );

  if (!token) {
    return jsonResponse(401, {
      error: "UNAUTHORIZED",
      message: "Missing Authorization: Bearer <token> header.",
    });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(
    token
  );

  if (userErr || !userData.user) {
    return jsonResponse(401, {
      error: "UNAUTHORIZED",
      message: "Invalid or expired session.",
    });
  }

  const actorId = userData.user.id;

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role, email")
    .eq("id", actorId)
    .single();

  if (profileErr || !profile) {
    return jsonResponse(403, {
      error: "FORBIDDEN",
      message: "Profile not found.",
    });
  }

  if (profile.role !== "admin") {
    return jsonResponse(403, {
      error: "FORBIDDEN",
      message: "Only admin can release escrow.",
    });
  }

  if (!event.body) {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Missing request body.",
    });
  }

  let payload: EscrowReleaseRequest;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return jsonResponse(400, {
      error: "BAD_REQUEST",
      message: "Invalid JSON body.",
    });
  }

  const escrowId = payload.escrowId?.trim();
  if (!isNonEmptyString(escrowId)) {
    return jsonResponse(400, {
      error: "VALIDATION_ERROR",
      field: "escrowId",
      message: "escrowId is required.",
    });
  }

  const { data: escrow, error: escrowErr } = await supabaseAdmin
    .from("escrows")
    .select(
      "id, status, payment_intent_id, amount, currency, rfq_id, lot_id, buyer_id, cooperative_id"
    )
    .eq("id", escrowId)
    .single();

  if (escrowErr || !escrow) {
    return jsonResponse(404, {
      error: "NOT_FOUND",
      message: "Escrow not found.",
    });
  }

  if (!isNonEmptyString(escrow.payment_intent_id)) {
    return jsonResponse(400, {
      error: "INVALID_STATE",
      message: "Escrow has no payment_intent_id. Initialize payment first.",
    });
  }

  const expectedStatuses = new Set(["authorized"]);
  const statusOk = expectedStatuses.has(String(escrow.status));

  let pi: Stripe.PaymentIntent;
  try {
    pi = await stripe.paymentIntents.retrieve(escrow.payment_intent_id);
  } catch (e: any) {
    return jsonResponse(502, {
      error: "STRIPE_ERROR",
      message: "Failed to retrieve Stripe PaymentIntent.",
      details: e?.message ?? String(e),
    });
  }

  const piCapturable = pi.status === "requires_capture";

  if (!statusOk && !piCapturable) {
    return jsonResponse(400, {
      error: "INVALID_STATE",
      message:
        "Escrow is not authorized/capturable yet. Wait for successful payment authorization.",
      escrowStatus: escrow.status,
      stripeStatus: pi.status,
    });
  }

  let captured: Stripe.PaymentIntent;
  try {
    captured = await stripe.paymentIntents.capture(pi.id);
  } catch (e: any) {
    
    await supabaseAdmin.from("escrow_events").insert({
      escrow_id: escrow.id,
      actor_id: actorId,
      type: "escrow_release_failed",
      payload: {
        payment_intent_id: pi.id,
        stripe_status: pi.status,
        error: e?.message ?? String(e),
        inspectorId: isNonEmptyString(payload.inspectorId)
          ? payload.inspectorId.trim()
          : null,
        notes: isNonEmptyString(payload.notes) ? payload.notes.trim() : null,
      },
    });

    return jsonResponse(502, {
      error: "STRIPE_CAPTURE_FAILED",
      message: "Stripe capture failed. Escrow not released.",
      details: e?.message ?? String(e),
    });
  }

  const now = new Date().toISOString();

  const { error: updErr } = await supabaseAdmin
    .from("escrows")
    .update({
      status: "released",
      
    })
    .eq("id", escrow.id);

  if (updErr) {
    await supabaseAdmin.from("escrow_events").insert({
      escrow_id: escrow.id,
      actor_id: actorId,
      type: "escrow_released_db_update_failed",
      payload: {
        payment_intent_id: captured.id,
        stripe_status: captured.status,
        db_error: updErr.message,
      },
    });

    return jsonResponse(500, {
      error: "DB_UPDATE_FAILED",
      message:
        "Payment was captured, but escrow status update failed. Check database.",
      paymentIntentId: captured.id,
      stripeStatus: captured.status,
    });
  }

  await supabaseAdmin.from("escrow_events").insert({
    escrow_id: escrow.id,
    actor_id: actorId,
    type: "escrow_released",
    payload: {
      released_at: now,
      payment_intent_id: captured.id,
      stripe_status: captured.status,
      inspectorId: isNonEmptyString(payload.inspectorId)
        ? payload.inspectorId.trim()
        : null,
      notes: isNonEmptyString(payload.notes) ? payload.notes.trim() : null,
    },
  });

  return jsonResponse(200, {
    ok: true,
    message: "Escrow released: payment captured.",
    escrow: {
      id: escrow.id,
      status: "released",
      releasedAt: now,
      rfqId: escrow.rfq_id,
      lotId: escrow.lot_id,
      buyerId: escrow.buyer_id,
      cooperativeId: escrow.cooperative_id,
      amount: escrow.amount,
      currency: escrow.currency,
      paymentIntentId: captured.id,
      stripeStatus: captured.status,
    },
  });
};
