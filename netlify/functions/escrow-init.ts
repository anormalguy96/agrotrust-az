import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type InitBody = {
  rfqId: string;
  lotId?: string;
  buyerId: string;
  cooperativeId: string;
  amount: number;
  currency?: string;
  memo?: string;
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

function getSiteUrl(event: any) {
  const proto = event.headers?.["x-forwarded-proto"] || "https";
  const host = event.headers?.["x-forwarded-host"] || event.headers?.host;
  if (host) return `${proto}://${host}`;

  return (
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "http://localhost:8888"
  );
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

type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_intent?: string | null;
  status?: string | null;
};

type StripePaymentIntent = {
  id: string;
  status: string;
  amount: number;
  currency: string;
};

async function syncEscrowWithStripe(escrow: any) {
  const sessionId = escrow.client_reference;
  if (!sessionId || typeof sessionId !== "string") {
    return escrow;
  }

  const session = await stripeRequest<StripeCheckoutSession>(
    "GET",
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`
  );

  const paymentIntentId = session.payment_intent || escrow.payment_intent_id || null;

  let nextStatus = escrow.status;

  if (paymentIntentId) {
    const pi = await stripeRequest<StripePaymentIntent>(
      "GET",
      `/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`
    );

    if (pi.status === "requires_capture") nextStatus = "authorized";
    if (pi.status === "succeeded") nextStatus = "released";
    if (pi.status === "canceled") nextStatus = "cancelled";
    if (pi.status === "requires_payment_method") nextStatus = "failed";
  }

  const shouldUpdate =
    (paymentIntentId && paymentIntentId !== escrow.payment_intent_id) ||
    nextStatus !== escrow.status;

  if (shouldUpdate) {
    const now = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from("escrows")
      .update({
        payment_intent_id: paymentIntentId,
        status: nextStatus,
        updated_at: now,
      })
      .eq("id", escrow.id)
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    await logEvent({
      escrowId: updated.id,
      actorId: null,
      type: "sync",
      payload: {
        from: escrow.status,
        to: nextStatus,
        payment_intent_id: paymentIntentId,
        checkout_session_id: sessionId,
      },
    });

    return updated;
  }

  return escrow;
}

export const handler: Handler = async (event) => {
  try {
    const method = (event.httpMethod || "GET").toUpperCase();

    if (method === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders, body: "" };
    }

    if (method === "GET") {
      const qs = event.queryStringParameters || {};
      const escrowId = qs.escrowId || qs.id;
      const sync = (qs.sync || "").toLowerCase() === "1" || (qs.sync || "").toLowerCase() === "true";
      const result = (qs.result || "").toLowerCase(); // "success" | "cancel" optional

      if (!escrowId || !isUuid(escrowId)) {
        return json(400, { error: "escrowId must be a UUID" });
      }

      const { data: escrow, error } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrowId)
        .single();

      if (error) {
        return json(404, { error: "Escrow not found", details: error.message });
      }

      if (result === "cancel" && escrow.status === "awaiting_payment") {
        const now = new Date().toISOString();
        const { data: updated, error: updErr } = await supabase
          .from("escrows")
          .update({ status: "cancelled", updated_at: now })
          .eq("id", escrow.id)
          .select("*")
          .single();

        if (updErr) return json(400, { error: updErr.message });

        await logEvent({
          escrowId: updated.id,
          actorId: escrow.buyer_id ?? null,
          type: "cancelled_by_buyer",
          payload: { reason: "checkout_cancel" },
        });

        return json(200, { ok: true, escrow: updated });
      }

      if (sync) {
        const updated = await syncEscrowWithStripe(escrow);
        return json(200, { ok: true, escrow: updated });
      }

      return json(200, { ok: true, escrow });
    }

    if (method === "POST") {
      if (!event.body) return json(400, { error: "Missing JSON body" });

      const body = safeJsonParse<InitBody>(event.body) ?? ({} as any);

      const currency = (body.currency || "usd").toLowerCase();
      const amount = Number(body.amount);

      if (!isUuid(body.rfqId)) return json(400, { error: "rfqId must be a UUID" });
      if (!isUuid(body.buyerId)) return json(400, { error: "buyerId must be a UUID" });
      if (!isUuid(body.cooperativeId)) return json(400, { error: "cooperativeId must be a UUID" });
      if (!Number.isFinite(amount) || amount <= 0) return json(400, { error: "amount must be a positive number" });

      const amountInMinor = Math.round(amount * 100);

      const { data: escrow, error: insErr } = await supabase
        .from("escrows")
        .insert({
          rfq_id: body.rfqId,
          lot_id: body.lotId ?? null,
          buyer_id: body.buyerId,
          cooperative_id: body.cooperativeId,
          amount,
          currency,
          status: "awaiting_payment",
          payment_provider: "stripe",
          payment_intent_id: null,
          client_reference: null,
        })
        .select("*")
        .single();

      if (insErr) return json(400, { error: insErr.message });

      await logEvent({
        escrowId: escrow.id,
        actorId: body.buyerId,
        type: "created",
        payload: {
          rfq_id: body.rfqId,
          lot_id: body.lotId ?? null,
          amount,
          currency,
          memo: body.memo ?? null,
        },
      });

      const siteUrl = getSiteUrl(event);
      const successUrl = `${siteUrl}/dashboard/escrow/init?escrowId=${escrow.id}&result=success`;
      const cancelUrl = `${siteUrl}/dashboard/escrow/init?escrowId=${escrow.id}&result=cancel`;

      const lotLabel = body.lotId ? `Lot ${body.lotId}` : "Lot (unspecified)";
      const title = `AgroTrust Escrow — ${lotLabel}`;

      const params = new URLSearchParams();
      params.set("mode", "payment");
      params.append("payment_method_types[]", "card");

      params.append("line_items[0][price_data][currency]", currency);
      params.append("line_items[0][price_data][unit_amount]", String(amountInMinor));
      params.append("line_items[0][price_data][product_data][name]", title);
      params.append("line_items[0][quantity]", "1");

      params.append("payment_intent_data[capture_method]", "manual");

      params.append("client_reference_id", escrow.id);
      params.append("metadata[escrow_id]", escrow.id);
      params.append("metadata[rfq_id]", body.rfqId);
      if (body.lotId) params.append("metadata[lot_id]", body.lotId);
      params.append("metadata[buyer_id]", body.buyerId);
      params.append("metadata[cooperative_id]", body.cooperativeId);

      params.append("success_url", successUrl);
      params.append("cancel_url", cancelUrl);

      const session = await stripeRequest<StripeCheckoutSession>(
        "POST",
        "/v1/checkout/sessions",
        params,
        { "Idempotency-Key": `escrow-init-${escrow.id}` }
      );

      if (!session.url) {
        await supabase
          .from("escrows")
          .update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", escrow.id);

        await logEvent({
          escrowId: escrow.id,
          actorId: body.buyerId,
          type: "failed",
          payload: { reason: "stripe_session_missing_url" },
        });

        return json(500, { error: "Stripe did not return a checkout URL." });
      }

      const now = new Date().toISOString();
      const { data: updated, error: updErr } = await supabase
        .from("escrows")
        .update({
          client_reference: session.id,
          payment_intent_id: session.payment_intent ?? null,
          updated_at: now,
        })
        .eq("id", escrow.id)
        .select("*")
        .single();

      if (updErr) return json(400, { error: updErr.message });

      await logEvent({
        escrowId: updated.id,
        actorId: body.buyerId,
        type: "checkout_session_created",
        payload: {
          checkout_session_id: session.id,
          payment_intent_id: session.payment_intent ?? null,
          success_url: successUrl,
          cancel_url: cancelUrl,
        },
      });

      return json(200, {
        ok: true,
        escrow: updated,
        checkout: {
          url: session.url,
          sessionId: session.id,
          paymentIntentId: session.payment_intent ?? null,
        },
      });
    }

    return json(405, { error: "METHOD_NOT_ALLOWED" });
  } catch (e) {
    return json(500, {
      error: e instanceof Error ? e.message : "Server error",
    });
  }
};
