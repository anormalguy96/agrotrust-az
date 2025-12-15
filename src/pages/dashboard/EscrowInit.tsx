// src/pages/dashboard/EscrowInit.tsx
// Real UI for:
// - creating an escrow (DB + Stripe Checkout redirect)
// - syncing after Stripe redirect
// - releasing/cancelling escrow after inspection (server captures/cancels)

import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
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
  checkout?: { url: string; sessionId: string; paymentIntentId: string | null };
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
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;

  const keys = [
    "agrotrust.auth.user",
    "agrotrust_user",
    "agrotrust.user",
    "auth.user",
  ];

  for (const k of keys) {
    const raw = window.localStorage.getItem(k);
    if (!raw) continue;
    const parsed = safeJsonParse<any>(raw);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return null;
}

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function shortText(text: string, max = 400) {
  const t = (text || "").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function deriveResultFromSearchParams(sp: URLSearchParams): "success" | "cancel" | "" {
  const result = (sp.get("result") || "").toLowerCase().trim();
  if (result === "success" || result === "ok") return "success";
  if (result === "cancel" || result === "canceled") return "cancel";

  // Stripe Checkout commonly uses:
  // ?success=true or ?success=1 or ?canceled=1 etc. (depends on your configured URLs)
  const success = (sp.get("success") || "").toLowerCase();
  const canceled = (sp.get("canceled") || sp.get("cancelled") || "").toLowerCase();

  if (success === "1" || success === "true") return "success";
  if (canceled === "1" || canceled === "true") return "cancel";

  return "";
}

export function EscrowInit() {
  const [sp] = useSearchParams();
  const auth = useAuth() as any;

  const user = auth?.user ?? getStoredUser();

  const escrowIdFromUrl = (sp.get("escrowId") || "").trim();
  const rfqIdFromUrl = (sp.get("rfqId") || "").trim();
  const lotIdFromUrl = (sp.get("lotId") || "").trim();
  const coopIdFromUrl = (sp.get("cooperativeId") || "").trim();
  const amountFromUrl = (sp.get("amount") || "").trim();
  const currencyFromUrl = (sp.get("currency") || "usd").toLowerCase().trim();

  const redirectResult = deriveResultFromSearchParams(sp);

  const [rfqId, setRfqId] = useState(rfqIdFromUrl);
  const [lotId, setLotId] = useState(lotIdFromUrl);
  const [cooperativeId, setCooperativeId] = useState(coopIdFromUrl);
  const [amount, setAmount] = useState(amountFromUrl);
  const [currency, setCurrency] = useState(currencyFromUrl);

  const [escrow, setEscrow] = useState<EscrowRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const buyerId = useMemo(() => {
    // Your login function returns { user: { id, ... } }
    // so user.id should exist when signed in.
    return (user?.id || "").trim();
  }, [user?.id]);

  // We can’t know your server-side validation rules perfectly,
  // but escrow init typically needs: rfqId + amount (+ currency).
  const canCreate =
    rfqId.trim().length > 0 &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    currency.trim().length > 0;

  // Sync after redirect OR if URL contains escrowId
  useEffect(() => {
    if (!escrowIdFromUrl) return;

    // Only auto-sync when we came back from checkout
    // OR when user directly opens a URL with escrowId.
    const shouldAutoSync = redirectResult === "success" || redirectResult === "cancel";

    if (!shouldAutoSync) return;

    (async () => {
      try {
        setMsg("Syncing escrow status…");

        const res = await fetch(
          `/api/escrow/init?escrowId=${encodeURIComponent(escrowIdFromUrl)}&sync=1&result=${encodeURIComponent(
            redirectResult
          )}`,
          {
            method: "GET",
            credentials: "same-origin",
          }
        );

        const text = await res.text().catch(() => "");
        const data = safeJsonParse<SyncResponse>(text);

        if (!res.ok || !data?.ok) {
          throw new Error(shortText(text) || `Failed to sync escrow (${res.status}).`);
        }

        setEscrow(data.escrow);

        if (redirectResult === "success") {
          setMsg("Payment completed. Escrow should now be authorized (ready for capture).");
        } else if (redirectResult === "cancel") {
          setMsg("Payment was cancelled on Checkout.");
        } else {
          setMsg(null);
        }
      } catch (e) {
        setMsg(toMessage(e, "Failed to sync escrow."));
      }
    })();
  }, [escrowIdFromUrl, redirectResult]);

  const initMutation = useMutation<InitResponse, Error>({
    mutationFn: async () => {
      setMsg(null);

      // IMPORTANT:
      // Your server should ideally derive buyer/cooperative from the RFQ and/or auth.
      // We still send lotId/cooperativeId if provided (harmless if server ignores).
      const payload = {
        rfqId: rfqId.trim(),
        amount: Number(amount),
        currency: currency.trim() || "usd",
        lotId: lotId.trim() || undefined,
        cooperativeId: cooperativeId.trim() || undefined,
        memo: "Escrow initialized via dashboard UI",
      };

      const res = await fetch("/api/escrow/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<InitResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(shortText(text) || `Escrow init failed (${res.status}).`);
      }

      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);

      // Checkout Session redirect flow (recommended because it avoids stripe-js in frontend)
      const checkoutUrl = data.checkout?.url;
      if (checkoutUrl) {
        setMsg("Redirecting to Stripe Checkout…");
        window.location.assign(checkoutUrl);
        return;
      }

      // If your backend is still PaymentIntent clientSecret-based, we don't support it here.
      setMsg(
        "Escrow created, but no Checkout URL was returned. Your backend might be using PaymentIntent clientSecret flow. " +
          "Switch escrow-init to Checkout Session or update this page to use Stripe Elements."
      );
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
        credentials: "same-origin",
        body: JSON.stringify({
          escrowId: escrow.id,
          inspectionResult,
          notes: notes.trim() || undefined,
        }),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<ReleaseResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(shortText(text) || `Escrow release failed (${res.status}).`);
      }

      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);

      if (data.escrow.status === "released") {
        setMsg("PASS: Funds captured and escrow released to cooperative.");
      } else if (data.escrow.status === "cancelled") {
        setMsg("FAIL: Escrow cancelled after failed inspection.");
      } else {
        setMsg(`Updated escrow status: ${data.escrow.status}`);
      }
    },
    onError: (e) => setMsg(e.message),
  });

  const syncManual = useMutation<SyncResponse, Error, string>({
    mutationFn: async (escrowId: string) => {
      const res = await fetch(
        `/api/escrow/init?escrowId=${encodeURIComponent(escrowId)}&sync=1`,
        { method: "GET", credentials: "same-origin" }
      );

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<SyncResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(shortText(text) || `Failed to sync escrow (${res.status}).`);
      }
      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);
      setMsg("Escrow synced.");
    },
    onError: (e) => setMsg(e.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!rfqId.trim()) return setMsg("RFQ ID is required.");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return setMsg("Amount must be a positive number.");
    }
    if (!currency.trim()) return setMsg("Currency is required.");

    // buyerId is not required for the request payload (server should use auth),
    // but it’s a useful warning to the user.
    if (!buyerId) {
      setMsg("Warning: Buyer ID is missing. If your backend requires login cookies, please sign in first.");
      // still allow attempt; server will return 401/403 if required
    }

    initMutation.mutate();
  }

  return (
    <div className="card" style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <h1 className="dash-title">Escrow initialization</h1>
          <p className="muted">
            Real flow: create escrow → pay via Stripe Checkout (manual capture) → sync status → PASS captures / FAIL cancels.
          </p>
        </div>

        <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--ghost">
          Back
        </NavLink>
      </div>

      {!buyerId && (
        <div className="rfq-alert rfq-alert--error" style={{ marginTop: 16 }}>
          You appear to be signed out (buyerId missing). If escrow-init requires auth, sign in first.
          <div style={{ marginTop: 10 }}>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--primary">
              Sign in
            </NavLink>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="stack stack--md" style={{ marginTop: 16 }}>
        <label className="form-label">
          Buyer ID (from login)
          <input className="input" value={buyerId || ""} readOnly placeholder="(not signed in)" />
        </label>

        <label className="form-label">
          RFQ ID (UUID)
          <input
            className="input"
            value={rfqId}
            onChange={(e) => setRfqId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </label>

        <label className="form-label">
          Lot ID (optional)
          <input
            className="input"
            value={lotId}
            onChange={(e) => setLotId(e.target.value)}
            placeholder="lot-abcdef12"
          />
        </label>

        <label className="form-label">
          Cooperative ID (optional if server derives from RFQ)
          <input
            className="input"
            value={cooperativeId}
            onChange={(e) => setCooperativeId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
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
          {initMutation.isPending ? "Creating…" : "Start payment (Stripe Checkout)"}
        </button>
      </form>

      {msg && <div className="rfq-alert" style={{ marginTop: 14 }}>{msg}</div>}

      <div style={{ marginTop: 18 }}>
        <div className="aside-label">Current escrow</div>

        {!escrow && (
          <div style={{ marginTop: 10 }}>
            <p className="muted">
              No escrow loaded yet. After payment, you’ll return here and the page can auto-sync if the URL contains{" "}
              <code>escrowId</code>.
            </p>

            <button
              className="btn btn--ghost"
              type="button"
              disabled={!escrowIdFromUrl || syncManual.isPending}
              onClick={() => {
                setMsg(null);
                if (!escrowIdFromUrl) {
                  setMsg("No escrowId in URL to sync.");
                  return;
                }
                syncManual.mutate(escrowIdFromUrl);
              }}
            >
              {syncManual.isPending ? "Syncing…" : "Sync from URL escrowId"}
            </button>
          </div>
        )}

        {escrow && (
          <div className="card card--soft" style={{ marginTop: 10 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Escrow ID:</strong> <code>{escrow.id}</code>
              </div>
              <div>
                <strong>Status:</strong> <code>{escrow.status}</code>
              </div>
              <div>
                <strong>Amount:</strong> {escrow.amount} {escrow.currency.toUpperCase()}
              </div>
              <div>
                <strong>PaymentIntent:</strong> <code>{escrow.payment_intent_id ?? "—"}</code>
              </div>
              <div>
                <strong>Client reference:</strong> <code>{escrow.client_reference ?? "—"}</code>
              </div>
            </div>

            <hr style={{ margin: "14px 0", opacity: 0.4 }} />

            <div className="aside-label">Inspection outcome</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Use this after escrow is <code>authorized</code>. PASS captures funds; FAIL cancels authorization.
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  checked={inspectionResult === "PASS"}
                  onChange={() => setInspectionResult("PASS")}
                />
                PASS (capture funds)
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="radio"
                  checked={inspectionResult === "FAIL"}
                  onChange={() => setInspectionResult("FAIL")}
                />
                FAIL (cancel authorization)
              </label>
            </div>

            <label className="form-label" style={{ marginTop: 10 }}>
              Notes (optional)
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inspector notes…"
              />
            </label>

            <button
              className="btn btn--primary"
              style={{ marginTop: 10 }}
              disabled={releaseMutation.isPending}
              onClick={() => {
                setMsg(null);
                releaseMutation.mutate();
              }}
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

export default EscrowInit;
