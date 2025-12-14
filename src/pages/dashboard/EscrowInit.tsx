import React, { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabaseClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

type InitResponse = {
  escrowId: string;
  paymentIntentId: string;
  clientSecret: string;
};

function PayBox({
  clientSecret,
  escrowId,
}: {
  clientSecret: string;
  escrowId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onConfirm() {
    setMessage(null);
    if (!stripe || !elements) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setBusy(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const email = session.session?.user?.email ?? undefined;

      const res = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: { email },
        },
      });

      if (res.error) {
        setMessage(res.error.message || "Payment authorization failed. Please try again.");
        return;
      }

      setMessage(
        "✅ Funds authorized (held). Next: an admin/inspector must approve the deal, then the platform will release the escrow."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: "1px solid #333", borderRadius: 12 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Step 2 — Authorize Payment</h3>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        Your payment will be <b>authorized</b> and held. It will only be captured when the escrow is released.
      </p>

      <div style={{ padding: 12, border: "1px solid #444", borderRadius: 10 }}>
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      <button
        onClick={onConfirm}
        disabled={!stripe || busy}
        style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
      >
        {busy ? "Authorizing..." : "Authorize funds"}
      </button>

      <div style={{ marginTop: 10, opacity: 0.9 }}>
        <small>Escrow ID: {escrowId}</small>
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #2a6" }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default function EscrowInit() {
  const [rfqId, setRfqId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("usd");

  const [init, setInit] = useState<InitResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const elementsOptions = useMemo(() => {
    if (!init?.clientSecret) return undefined;
    return { clientSecret: init.clientSecret };
  }, [init?.clientSecret]);

  async function onInitEscrow() {
    setError(null);
    setInit(null);

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("You must be signed in to initialize escrow.");
      return;
    }

    if (!rfqId.trim()) {
      setError("Please enter a valid RFQ ID.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/escrow-init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rfqId: rfqId.trim(), amount, currency }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json?.error || "Failed to initialize escrow.");
        return;
      }

      setInit(json as InitResponse);
    } catch {
      setError("Network error while initializing escrow.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 820 }}>
      <h1 style={{ marginTop: 0 }}>Initialize Escrow</h1>
      <p style={{ opacity: 0.85 }}>
        This is a real escrow-like flow: the buyer authorizes funds, then an admin releases the payment after verification.
      </p>

      <div style={{ padding: 16, border: "1px solid #333", borderRadius: 12 }}>
        <h3 style={{ margin: 0, marginBottom: 8 }}>Step 1 — Create Escrow Hold</h3>

        <label style={{ display: "block", marginTop: 10 }}>RFQ ID</label>
        <input
          value={rfqId}
          onChange={(e) => setRfqId(e.target.value)}
          placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #444" }}
        />

        <label style={{ display: "block", marginTop: 10 }}>Amount (total)</label>
        <input
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="e.g. 2500"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #444" }}
        />

        <label style={{ display: "block", marginTop: 10 }}>Currency</label>
        <input
          value={currency}
          onChange={(e) => setCurrency(e.target.value.toLowerCase())}
          placeholder="usd"
          style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #444" }}
        />

        <button
          onClick={onInitEscrow}
          disabled={busy}
          style={{ marginTop: 14, padding: "10px 14px", borderRadius: 10, cursor: "pointer" }}
        >
          {busy ? "Initializing..." : "Initialize escrow"}
        </button>

        {error && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #a33" }}>
            {error}
          </div>
        )}
      </div>

      {init && elementsOptions && (
        <Elements stripe={stripePromise} options={elementsOptions}>
          <PayBox clientSecret={init.clientSecret} escrowId={init.escrowId} />
        </Elements>
      )}

      <div style={{ marginTop: 18, opacity: 0.8 }}>
        <small>
          Tip: after authorization, the escrow status is updated by Stripe webhook to <b>authorized</b>. Then an admin can
          call <code>/.netlify/functions/escrow-release</code> to capture and release funds.
        </small>
      </div>
    </div>
  );
}
