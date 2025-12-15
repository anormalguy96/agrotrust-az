// netlify/functions/escrow-release.ts
// Real escrow release:
// - PASS  => capture the Stripe PaymentIntent (funds released)
// - FAIL  => cancel the Stripe PaymentIntent (authorization released)
// Updates Supabase escrows + writes escrow_events.

import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReleaseBody = {
  escrowId: string;
  inspectionResult: "PASS" | "FAIL";
  inspectorId?: string; // uuid (profiles.id) optional
  notes?: string;
};

function json(statusCode: number, data: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...corsHeaders },
    body: JSON.stringify(data),
  };
}

function isUuid(v: unknown): v is string {
  return (
    typeof v === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)
  );
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function stripeRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: URLSearchParams,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY env var.");

  const res = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(extraHeaders ?? {}),
    },
    body: method === "POST" ? body?.toString() : undefined,
  });

  const text = await res.text();
  const data = safeJsonParse<any>(text);

  if (!res.ok) {
    const msg = data?.error?.message || text || `Stripe error (${res.status}).`;
    throw new Error(msg);
  }

  return (data ?? ({} as T)) as T;
}

type StripeCheckoutSession = {
  id: string;
  payment_intent?: string | null;
};

type StripePaymentIntent = {
  id: string;
  status: string;
};

async function logEvent(params: {
  escrowId: string;
  actorId?: string | null;
  type: string;
  payload?: any;
}) {
  const { escrowId, actorId, type, payload } = params;
  await supabase.from("escrow_events").insert({
    escrow_id: escrowId,
    actor_id: actorId ?? null,
    type,
    payload: payload ?? {},
  });
}

async function resolvePaymentIntentId(escrow: any): Promise<string> {
  if (escrow.payment_intent_id) return escrow.payment_intent_id;

  // If we stored checkout session id in client_reference, resolve it:
  const sessionId = escrow.client_reference;
  if (!sessionId || typeof sessionId !== "string") {
    throw new Error("Escrow has no payment_intent_id and no client_reference (checkout session id).");
  }

  const session = await stripeRequest<StripeCheckoutSession>(
    "GET",
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
  );

  const pi = session.payment_intent;
  if (!pi) throw new Error("Stripe session has no payment_intent yet (payment not completed).");

  // Persist it for future calls
  await supabase
    .from("escrows")
    .update({ payment_intent_id: pi, updated_at: new Date().toISOString() })
    .eq("id", escrow.id);

  return pi;
}

export const handler: Handler = async (event) => {
  try {
    const method = (event.httpMethod || "POST").toUpperCase();

    if (method === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    if (method !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
    if (!event.body) return json(400, { error: "Missing JSON body" });

    const body = safeJsonParse<ReleaseBody>(event.body) ?? ({} as any);

    if (!isUuid(body.escrowId)) return json(400, { error: "escrowId must be a UUID" });
    if (body.inspectionResult !== "PASS" && body.inspectionResult !== "FAIL") {
      return json(400, { error: 'inspectionResult must be "PASS" or "FAIL"' });
    }
    if (body.inspectorId && !isUuid(body.inspectorId)) {
      return json(400, { error: "inspectorId must be a UUID" });
    }

    const { data: escrow, error } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", body.escrowId)
      .single();

    if (error || !escrow) return json(404, { error: "Escrow not found" });

    // Must be authorized (requires_capture) before you can capture
    // (If your webhook/sync already moved it to 'authorized', good.)
    if (escrow.status !== "authorized" && escrow.status !== "awaiting_payment") {
      // allow idempotent calls
      return json(409, {
        error: "ESCROW_NOT_RELEASABLE",
        message: `Escrow status is "${escrow.status}"`,
      });
    }

    const paymentIntentId = await resolvePaymentIntentId(escrow);

    // Read PI status (helps produce clearer errors)
    const pi = await stripeRequest<StripePaymentIntent>(
      "GET",
      `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`
    );

    const now = new Date().toISOString();
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (body.inspectionResult === "PASS") {
      // Capture if possible
      if (pi.status === "requires_capture") {
        await stripeRequest<any>(
          "POST",
          `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/capture`,
          new URLSearchParams(),
          { "Idempotency-Key": `escrow-capture-${escrow.id}` }
        );
      }

      const { data: updated, error: updErr } = await supabase
        .from("escrows")
        .update({
          status: "released",
          updated_at: now,
          payment_intent_id: paymentIntentId,
        })
        .eq("id", escrow.id)
        .select("*")
        .single();

      if (updErr) return json(400, { error: updErr.message });

      await logEvent({
        escrowId: updated.id,
        actorId: body.inspectorId ?? null,
        type: "released",
        payload: {
          inspectionResult: "PASS",
          notes: notes || null,
          payment_intent_id: paymentIntentId,
        },
      });

      return json(200, { ok: true, escrow: updated });
    }

    // FAIL => cancel authorization (refund-like behavior for manual capture)
    if (pi.status === "requires_capture" || pi.status === "requires_payment_method" || pi.status === "requires_confirmation") {
      await stripeRequest<any>(
        "POST",
        `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}/cancel`,
        new URLSearchParams(),
        { "Idempotency-Key": `escrow-cancel-${escrow.id}` }
      );
    }

    const { data: updated, error: updErr } = await supabase
      .from("escrows")
      .update({
        status: "cancelled",
        updated_at: now,
        payment_intent_id: paymentIntentId,
      })
      .eq("id", escrow.id)
      .select("*")
      .single();

    if (updErr) return json(400, { error: updErr.message });

    await logEvent({
      escrowId: updated.id,
      actorId: body.inspectorId ?? null,
      type: "cancelled_after_failed_inspection",
      payload: {
        inspectionResult: "FAIL",
        notes: notes || null,
        payment_intent_id: paymentIntentId,
      },
    });

    return json(200, { ok: true, escrow: updated });
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : "Server error" });
  }
};
