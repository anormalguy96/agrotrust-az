import type { Handler } from "@netlify/functions";
import { stripe } from "./_lib/stripe";
import { supabaseAdmin } from "./_lib/supabaseAdmin";

export const handler: Handler = async (event) => {
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  if (!sig) return { statusCode: 400, body: "Missing stripe-signature." };

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const payload = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, sig as string, webhookSecret);
  } catch (err: any) {
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type.startsWith("payment_intent.")) {
    const pi = stripeEvent.data.object as any;
    const escrowId = pi.metadata?.escrow_id;

    if (escrowId) {
      const statusMap: Record<string, string | null> = {
        "payment_intent.amount_capturable_updated": "authorized",
        "payment_intent.payment_failed": "failed",
        "payment_intent.canceled": "cancelled",
        "payment_intent.succeeded": null,
      };

      const newStatus = statusMap[stripeEvent.type];

      if (newStatus) {
        await supabaseAdmin.from("escrows").update({ status: newStatus }).eq("id", escrowId);
        await supabaseAdmin.from("escrow_events").insert({
          escrow_id: escrowId,
          actor_id: null,
          type: stripeEvent.type,
          payload: { payment_intent_id: pi.id, stripe_status: pi.status },
        });
      } else {
        await supabaseAdmin.from("escrow_events").insert({
          escrow_id: escrowId,
          actor_id: null,
          type: stripeEvent.type,
          payload: { payment_intent_id: pi.id, stripe_status: pi.status },
        });
      }
    }
  }

  return { statusCode: 200, body: "ok" };
};
