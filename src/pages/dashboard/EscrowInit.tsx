// src/pages/dashboard/Contracts.tsx
// Non-mock contracts page:
// - No demo rfq ids
// - Requires real UUID rfqId
// - Calls real endpoint POST /api/escrow/init and redirects to Stripe Checkout

import { FormEvent, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type EscrowStatus =
  | "awaiting_payment"
  | "authorized"
  | "released"
  | "cancelled"
  | "refunded"
  | "failed";

type EscrowRow = {
  id: string;
  rfq_id: string;
  lot_id: string | null;
  buyer_id: string;
  cooperative_id: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  payment_provider: string;
  payment_intent_id: string | null;
  client_reference: string | null;
  created_at: string;
  updated_at: string;
};

type InitResponse = {
  ok: boolean;
  escrow: EscrowRow;
  checkout?: {
    url: string;
    sessionId?: string;
    paymentIntentId?: string | null;
  };
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(v: string) {
  return UUID_RE.test((v || "").trim());
}

function safeJson<T>(text: string): T | null {
  try {
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function truncate(t: string, n = 500) {
  const s = (t || "").trim();
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => "");
  const maybe = safeJson<{ error?: string; message?: string }>(text);
  return (
    maybe?.error ||
    maybe?.message ||
    truncate(text) ||
    `Request failed (${res.status})`
  );
}

function getEscrowInitRoute(): string {
  return ((ROUTES as any)?.DASHBOARD?.ESCROW_INIT as string) || "/dashboard/escrow-init";
}

export default function Contracts() {
  const auth = useAuth() as any;
  const user = auth?.user;

  const buyerId = useMemo(() => (user?.id ? String(user.id).trim() : ""), [user?.id]);

  const [rfqId, setRfqId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("usd");
  const [msg, setMsg] = useState<string | null>(null);
  const [lastEscrow, setLastEscrow] = useState<EscrowRow | null>(null);

  const canCreate =
    isUuid(rfqId) &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    currency.trim().length > 0;

  const initMutation = useMutation<InitResponse, Error>({
    mutationFn: async () => {
      setMsg(null);

      const cleanedRfqId = rfqId.trim();
      if (!isUuid(cleanedRfqId)) {
        throw new Error("rfqId must be a UUID (copy the real RFQ id from your database).");
      }

      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        throw new Error("Amount must be a positive number.");
      }

      const res = await fetch("/api/escrow/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          rfqId: cleanedRfqId,
          amount: amt,
          currency: (currency.trim() || "usd").toLowerCase(),
        }),
      });

      if (!res.ok) {
        throw new Error(await readErrorMessage(res));
      }

      const text = await res.text().catch(() => "");
      const data = safeJson<InitResponse>(text);

      if (!data?.ok || !data.escrow) {
        throw new Error(truncate(text) || "Escrow init returned invalid JSON.");
      }

      return data;
    },
    onSuccess: (data) => {
      setLastEscrow(data.escrow);

      const checkoutUrl = data.checkout?.url;
      if (checkoutUrl) {
        setMsg("Redirecting to Stripe Checkout…");
        window.location.assign(checkoutUrl);
        return;
      }

      setMsg(
        "Escrow created, but backend did not return checkout.url. " +
          "Your escrow-init function must return { ok:true, escrow, checkout:{url} }."
      );
    },
    onError: (e) => setMsg(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!isUuid(rfqId)) {
      setMsg("RFQ ID must be a valid UUID. Do not use demo IDs like RFQ-001.");
      return;
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setMsg("Amount must be a positive number.");
      return;
    }
    initMutation.mutate();
  }

  return (
    <div className="stack stack--lg">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="dash-title">Contracts</h1>
          <p className="muted">
            This page is now <strong>non-mock</strong>: it creates escrow using real RFQ UUIDs.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <NavLink to={getEscrowInitRoute()} className="btn btn--ghost">
            Open Escrow Init
          </NavLink>
        </div>
      </div>

      {!buyerId && (
        <div className="rfq-alert rfq-alert--error">
          You appear signed out. If your escrow-init function requires auth cookies, sign in first.
          <div style={{ marginTop: 10 }}>
            <NavLink to={(ROUTES as any)?.AUTH?.SIGN_IN || "/sign-in"} className="btn btn--primary">
              Sign in
            </NavLink>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Create escrow (real)</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          The error you saw (<code>rfqId must be a UUID</code>) happens when the frontend sends a fake/demo RFQ id.
          Here we validate before sending.
        </p>

        <form onSubmit={onSubmit} className="stack stack--md" style={{ marginTop: 14 }}>
          <label className="form-label">
            RFQ ID (UUID)
            <input
              className="input"
              value={rfqId}
              onChange={(e) => setRfqId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
            {!rfqId.trim() ? null : isUuid(rfqId) ? null : (
              <div className="muted" style={{ marginTop: 6 }}>
                Not a UUID. Copy the RFQ <code>id</code> from your database (table <code>rfqs</code>).
              </div>
            )}
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 0.6fr", gap: 12 }}>
            <label className="form-label">
              Amount
              <input
                className="input"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
              />
            </label>

            <label className="form-label">
              Currency
              <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </label>
          </div>

          <button className="btn btn--primary" type="submit" disabled={!canCreate || initMutation.isPending}>
            {initMutation.isPending ? "Creating…" : "Create escrow & go to Stripe Checkout"}
          </button>
        </form>

        {msg && <div className="rfq-alert" style={{ marginTop: 14 }}>{msg}</div>}
      </div>

      <div className="card card--soft">
        <div className="aside-label">Last created escrow</div>
        {!lastEscrow ? (
          <p className="muted" style={{ marginTop: 8 }}>
            None yet.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <div><strong>Escrow ID:</strong> <code>{lastEscrow.id}</code></div>
            <div><strong>RFQ ID:</strong> <code>{lastEscrow.rfq_id}</code></div>
            <div><strong>Status:</strong> <code>{lastEscrow.status}</code></div>
            <div><strong>Amount:</strong> {lastEscrow.amount} {lastEscrow.currency.toUpperCase()}</div>
            <div><strong>PaymentIntent:</strong> <code>{lastEscrow.payment_intent_id ?? "—"}</code></div>
          </div>
        )}
      </div>
    </div>
  );
}
