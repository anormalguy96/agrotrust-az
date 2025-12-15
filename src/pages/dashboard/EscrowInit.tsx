// src/pages/dashboard/EscrowInit.tsx
// Real UI for:
// - creating an escrow (DB + Stripe Checkout redirect)
// - syncing after Stripe redirect
// - releasing/cancelling escrow after inspection (server does real Stripe capture/cancel)

import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type EscrowRow = {
  id: string;
  rfq_id: string;
  lot_id: string | null;
  buyer_id: string;
  cooperative_id: string;
  amount: number;
  currency: string;
  status:
    | "awaiting_payment"
    | "authorized"
    | "released"
    | "cancelled"
    | "refunded"
    | "failed";
  payment_provider: string;
  payment_intent_id: string | null;
  client_reference: string | null;
  created_at: string;
  updated_at: string;
};

type InitResponse = {
  ok: boolean;
  escrow: EscrowRow;
  checkout: { url: string; sessionId: string; paymentIntentId: string | null };
};

type SyncResponse = {
  ok: boolean;
  escrow: EscrowRow;
};

type ReleaseResponse = {
  ok: boolean;
  escrow: EscrowRow;
};

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getStoredUser(): any | null {
  // Your app has shown both keys in Local Storage screenshots
  const keys = ["agrotrust.auth.user", "agrotrust_user"];
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const parsed = safeJsonParse<any>(raw);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return null;
}

export function EscrowInit() {
  const [sp] = useSearchParams();
  const auth = useAuth() as any;

  const user = auth?.user ?? getStoredUser();

  const escrowIdFromUrl = sp.get("escrowId") || "";
  const resultFromUrl = (sp.get("result") || "").toLowerCase(); // success | cancel

  const rfqIdFromUrl = sp.get("rfqId") || "";
  const lotIdFromUrl = sp.get("lotId") || "";
  const coopIdFromUrl = sp.get("cooperativeId") || "";
  const amountFromUrl = sp.get("amount") || "";
  const currencyFromUrl = (sp.get("currency") || "usd").toLowerCase();

  const [rfqId, setRfqId] = useState(rfqIdFromUrl);
  const [lotId, setLotId] = useState(lotIdFromUrl);
  const [cooperativeId, setCooperativeId] = useState(coopIdFromUrl);
  const [amount, setAmount] = useState(amountFromUrl);
  const [currency, setCurrency] = useState(currencyFromUrl);

  const [escrow, setEscrow] = useState<EscrowRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const buyerId = useMemo(() => {
    return user?.id || "";
  }, [user?.id]);

  const canCreate =
    Boolean(buyerId) &&
    rfqId.trim().length > 0 &&
    cooperativeId.trim().length > 0 &&
    Number(amount) > 0;

  // Sync after Stripe redirects back to this page
  useEffect(() => {
    if (!escrowIdFromUrl) return;

    const shouldSync = resultFromUrl === "success" || resultFromUrl === "cancel";
    if (!shouldSync) return;

    (async () => {
      setMsg("Syncing escrow status…");
      try {
        const res = await fetch(
          `/api/escrow/init?escrowId=${encodeURIComponent(escrowIdFromUrl)}&sync=1&result=${encodeURIComponent(
            resultFromUrl
          )}`
        );
        const text = await res.text().catch(() => "");
        const data = safeJsonParse<SyncResponse>(text);

        if (!res.ok || !data?.ok) {
          throw new Error(text || "Failed to sync escrow.");
        }

        setEscrow(data.escrow);

        if (resultFromUrl === "success") {
          setMsg("Payment completed. Escrow should now be authorized (requires_capture).");
        } else if (resultFromUrl === "cancel") {
          setMsg("Payment was cancelled.");
        } else {
          setMsg(null);
        }
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Failed to sync escrow.");
      }
    })();
  }, [escrowIdFromUrl, resultFromUrl]);

  const initMutation = useMutation<InitResponse, Error>({
    mutationFn: async () => {
      setMsg(null);

      const payload = {
        rfqId: rfqId.trim(),
        lotId: lotId.trim() || undefined,
        buyerId: buyerId.trim(),
        cooperativeId: cooperativeId.trim(),
        amount: Number(amount),
        currency: currency.trim() || "usd",
        memo: "Escrow initialized via dashboard UI",
      };

      const res = await fetch("/api/escrow/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<InitResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(text || "Escrow init failed.");
      }

      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);
      setMsg("Redirecting to Stripe Checkout…");
      window.location.href = data.checkout.url; // real redirect
    },
    onError: (e) => {
      setMsg(e.message);
    },
  });

  const [inspectionResult, setInspectionResult] = useState<"PASS" | "FAIL">("PASS");
  const [notes, setNotes] = useState("");

  const releaseMutation = useMutation<ReleaseResponse, Error>({
    mutationFn: async () => {
      if (!escrow?.id) throw new Error("No escrow loaded.");

      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escrowId: escrow.id,
          inspectionResult,
          // inspectorId optional: if you have an inspector/admin user id, pass it here
          notes: notes.trim() || undefined,
        }),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<ReleaseResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(text || "Escrow release failed.");
      }

      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);
      setMsg(
        data.escrow.status === "released"
          ? "Funds captured and released to cooperative (Stripe capture succeeded)."
          : "Escrow cancelled after failed inspection (Stripe authorization cancelled)."
      );
    },
    onError: (e) => setMsg(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!buyerId) {
      setMsg("You must be signed in (buyerId missing).");
      return;
    }
    if (!rfqId.trim()) return setMsg("RFQ ID is required.");
    if (!cooperativeId.trim()) return setMsg("Cooperative ID is required.");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return setMsg("Amount must be a positive number.");
    }

    initMutation.mutate();
  }

  return (
    <div className="card" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="dash-title">Escrow initialization</h1>
          <p className="muted">
            Real flow: create escrow → pay on Stripe Checkout (manual capture) → sync status → PASS captures / FAIL cancels.
          </p>
        </div>

        <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--ghost">
          Back
        </NavLink>
      </div>

      {!buyerId && (
        <div className="rfq-alert rfq-alert--error" style={{ marginTop: 16 }}>
          You must be signed in. (Your UI shows a user, but this page didn’t receive a user object.)
          <div style={{ marginTop: 10 }}>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--primary">Sign in</NavLink>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="stack stack--md" style={{ marginTop: 16 }}>
        <label className="form-label">
          Buyer ID (from your login)
          <input className="input" value={buyerId} readOnly />
        </label>

        <label className="form-label">
          RFQ ID (UUID)
          <input className="input" value={rfqId} onChange={(e) => setRfqId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </label>

        <label className="form-label">
          Lot ID (optional)
          <input className="input" value={lotId} onChange={(e) => setLotId(e.target.value)} placeholder="lot-abcdef12" />
        </label>

        <label className="form-label">
          Cooperative ID (UUID)
          <input className="input" value={cooperativeId} onChange={(e) => setCooperativeId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.6fr", gap: 12 }}>
          <label className="form-label">
            Amount
            <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000" />
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
          {initMutation.isPending ? "Creating…" : "Start payment (Stripe Checkout)"}
        </button>
      </form>

      {msg && <div className="rfq-alert" style={{ marginTop: 14 }}>{msg}</div>}

      <div style={{ marginTop: 18 }}>
        <div className="aside-label">Current escrow</div>
        {!escrow && (
          <p className="muted">
            No escrow loaded yet. After payment, you’ll return here and the page will auto-sync using the escrowId in the URL.
          </p>
        )}

        {escrow && (
          <div className="card card--soft" style={{ marginTop: 10 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div><strong>Escrow ID:</strong> <code>{escrow.id}</code></div>
              <div><strong>Status:</strong> <code>{escrow.status}</code></div>
              <div><strong>Amount:</strong> {escrow.amount} {escrow.currency.toUpperCase()}</div>
              <div><strong>PaymentIntent:</strong> <code>{escrow.payment_intent_id ?? "—"}</code></div>
              <div><strong>Checkout session:</strong> <code>{escrow.client_reference ?? "—"}</code></div>
            </div>

            <hr style={{ margin: "14px 0", opacity: 0.4 }} />

            <div className="aside-label">Inspection outcome (real capture/cancel)</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Only do this after the escrow is <code>authorized</code> (Stripe PaymentIntent should be <code>requires_capture</code>).
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" checked={inspectionResult === "PASS"} onChange={() => setInspectionResult("PASS")} />
                PASS (capture funds)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" checked={inspectionResult === "FAIL"} onChange={() => setInspectionResult("FAIL")} />
                FAIL (cancel authorization)
              </label>
            </div>

            <label className="form-label" style={{ marginTop: 10 }}>
              Notes (optional)
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspector notes…" />
            </label>

            <button
              className="btn btn--primary"
              style={{ marginTop: 10 }}
              disabled={!escrow || releaseMutation.isPending}
              onClick={() => releaseMutation.mutate()}
              type="button"
            >
              {releaseMutation.isPending ? "Submitting…" : "Submit inspection & release/cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
