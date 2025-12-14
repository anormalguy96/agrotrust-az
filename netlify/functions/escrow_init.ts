import type { Handler } from "@netlify/functions";
import { requireUser } from "./_lib/auth";
import { supabaseAdmin } from "./_lib/supabaseAdmin";
import { stripe } from "./_lib/stripe";
import { toMinorUnits } from "./_lib/money";

type Body = {
  rfqId: string;
  amount: number;
  currency?: string;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const auth = await requireUser(event);
  if (!auth.ok) return { statusCode: auth.status, body: JSON.stringify({ error: auth.error }) };

  let body: Body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }

  const rfqId = body.rfqId?.trim();
  const amount = Number(body.amount);
  const currency = (body.currency || "usd").toLowerCase();

  if (!rfqId) return { statusCode: 400, body: JSON.stringify({ error: "rfqId is required." }) };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "amount must be a positive number." }) };
  }

  const { data: rfq, error: rfqErr } = await supabaseAdmin
    .from("rfqs")
    .select("id, buyer_id, cooperative_id, lot_id, product_name, quantity_kg, target_price_per_kg, status")
    .eq("id", rfqId)
    .single();

  if (rfqErr || !rfq) {
    return { statusCode: 404, body: JSON.stringify({ error: "RFQ not found." }) };
  }

  const isAdmin = auth.profile.role === "admin";
  if (!isAdmin && rfq.buyer_id !== auth.profile.id) {
    return { statusCode: 403, body: JSON.stringify({ error: "You cannot escrow an RFQ that is not yours." }) };
  }

  if (!rfq.cooperative_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "RFQ has no cooperative_id." }) };
  }

  const { data: escrow, error: escErr } = await supabaseAdmin
    .from("escrows")
    .insert({
      rfq_id: rfq.id,
      lot_id: rfq.lot_id,
      buyer_id: rfq.buyer_id,
      cooperative_id: rfq.cooperative_id,
      amount,
      currency,
      status: "awaiting_payment",
      payment_provider: "stripe",
      client_reference: `RFQ-${rfq.id}`,
    })
    .select("id")
    .single();

  if (escErr || !escrow) {
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to create escrow record." }) };
  }

  const pi = await stripe.paymentIntents.create({
    amount: toMinorUnits(amount),
    currency,
    capture_method: "manual",
    automatic_payment_methods: { enabled: true },
    metadata: {
      escrow_id: escrow.id,
      rfq_id: rfq.id,
      buyer_id: rfq.buyer_id,
      cooperative_id: rfq.cooperative_id,
    },
    description: `AgroTrust Escrow for ${rfq.product_name} (${rfq.quantity_kg ?? "?"} kg)`,
  });

  await supabaseAdmin
    .from("escrows")
    .update({ payment_intent_id: pi.id })
    .eq("id", escrow.id);

  await supabaseAdmin.from("escrow_events").insert({
    escrow_id: escrow.id,
    actor_id: auth.profile.id,
    type: "escrow_initialized",
    payload: { payment_intent_id: pi.id, amount, currency },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      escrowId: escrow.id,
      paymentIntentId: pi.id,
      clientSecret: pi.client_secret,
    }),
  };
};
