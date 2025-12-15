// agrotrust-az/src/pages/dashboard/Contracts.tsx
// REAL Contracts & Escrow page (no mock JSON, no localStorage demo seeds)
//
// What this page does:
// 1) Create escrow by calling POST /api/escrow/init
//    - Requires rfqId (UUID) + amount (+ currency)
//    - Optionally sends buyerId/cooperativeId/lotId for compatibility with older function variants
// 2) Sync/Load escrow by ID via GET /api/escrow/init?escrowId=...&sync=1
// 3) Release/cancel escrow after inspection via POST /api/escrow/release (PASS captures / FAIL cancels)

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

type InitResponseCheckout = {
  ok: boolean;
  escrow: EscrowRow;
  checkout: { url: string; sessionId: string; paymentIntentId: string | null };
};

type InitResponsePI = {
  escrowId: string;
  paymentIntentId: string;
  clientSecret: string;
};

type SyncResponse = { ok: boolean; escrow: EscrowRow };
type ReleaseResponse = { ok: boolean; escrow: EscrowRow };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeJsonParse<T>(text: string): T | null {
  try {
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function shortText(text: string, max = 450) {
  const t = (text || "").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function toMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function normalizeRedirectResult(sp: URLSearchParams): "success" | "cancel" | "" {
  const result = (sp.get("result") || "").toLowerCase().trim();
  if (result === "success" || result === "ok") return "success";
  if (result === "cancel" || result === "canceled" || result === "cancelled") return "cancel";

  const success = (sp.get("success") || "").toLowerCase().trim();
  const canceled = (sp.get("canceled") || sp.get("cancelled") || "").toLowerCase().trim();

  if (success === "1" || success === "true") return "success";
  if (canceled === "1" || canceled === "true") return "cancel";

  return "";
}

export function Contracts() {
  const auth = useAuth() as any;
  const user = auth?.user;

  const [sp] = useSearchParams();
  const redirectResult = normalizeRedirectResult(sp);
  const escrowIdFromUrl = (sp.get("escrowId") || "").trim();

  // Create form
  const rfqIdFromUrl = (sp.get("rfqId") || "").trim();
  const coopIdFromUrl = (sp.get("cooperativeId") || "").trim();
  const lotIdFromUrl = (sp.get("lotId") || "").trim();
  const amountFromUrl = (sp.get("amount") || "").trim();
  const currencyFromUrl = (sp.get("currency") || "usd").toLowerCase().trim();

  const [rfqId, setRfqId] = useState(rfqIdFromUrl);
  const [cooperativeId, setCooperativeId] = useState(coopIdFromUrl);
  const [lotId, setLotId] = useState(lotIdFromUrl);
  const [amount, setAmount] = useState(amountFromUrl);
  const [currency, setCurrency] = useState(currencyFromUrl);

  // Loaded escrow
  const [escrowIdLookup, setEscrowIdLookup] = useState(escrowIdFromUrl);
  const [escrow, setEscrow] = useState<EscrowRow | null>(null);

  const [inspectionResult, setInspectionResult] = useState<"PASS" | "FAIL">("PASS");
  const [notes, setNotes] = useState("");

  const [notice, setNotice] = useState<string | null>(null);

  const buyerId = useMemo(() => {
    // Depending on your auth, user.id should be UUID for profiles/auth.users
    return (user?.id || "").trim();
  }, [user?.id]);

  const canCreate = useMemo(() => {
    // Allow buyer/admin. If your roles differ, adjust.
    const role = (user?.role || "").toLowerCase();
    return role === "buyer" || role === "admin";
  }, [user?.role]);

  const createEnabled =
    rfqId.trim().length > 0 &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0 &&
    currency.trim().length > 0;

  // Auto-sync after Stripe redirect if URL contains escrowId + result flags
  useEffect(() => {
    if (!escrowIdFromUrl) return;
    if (redirectResult !== "success" && redirectResult !== "cancel") return;

    (async () => {
      try {
        setNotice("Syncing escrow status after payment redirect…");

        const res = await fetch(
          `/api/escrow/init?escrowId=${encodeURIComponent(escrowIdFromUrl)}&sync=1&result=${encodeURIComponent(
            redirectResult
          )}`,
          { method: "GET", credentials: "same-origin" }
        );

        const text = await res.text().catch(() => "");
        const data = safeJsonParse<SyncResponse>(text);

        if (!res.ok || !data?.ok) {
          throw new Error(shortText(text) || `Failed to sync escrow (${res.status}).`);
        }

        setEscrow(data.escrow);
        setEscrowIdLookup(data.escrow.id);

        setNotice(
          redirectResult === "success"
            ? "Payment completed. Escrow should now be authorized (ready for capture)."
            : "Payment was cancelled on Checkout."
        );
      } catch (e) {
        setNotice(toMessage(e, "Failed to sync escrow."));
      }
    })();
  }, [escrowIdFromUrl, redirectResult]);

  const initMutation = useMutation<InitResponseCheckout | InitResponsePI, Error>({
    mutationFn: async () => {
      setNotice(null);

      const trimmedRfq = rfqId.trim();
      if (!UUID_RE.test(trimmedRfq)) {
        throw new Error("rfqId must be a UUID. Copy the RFQ id from your RFQs page.");
      }

      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) {
        throw new Error("amount must be a positive number.");
      }

      // Compatibility payload:
      // - Newer “real” functions usually need only rfqId+amount+currency (and derive buyer/coop from auth+rfq).
      // - Older variants require buyerId + cooperativeId too.
      const payload: any = {
        rfqId: trimmedRfq,
        amount: amt,
        currency: (currency.trim() || "usd").toLowerCase(),
      };

      if (lotId.trim()) payload.lotId = lotId.trim();
      if (cooperativeId.trim()) payload.cooperativeId = cooperativeId.trim();

      // If your backend still requires these explicitly, we send them (when available)
      if (buyerId) payload.buyerId = buyerId;

      const res = await fetch("/api/escrow/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");

      // Try both shapes
      const asCheckout = safeJsonParse<InitResponseCheckout>(text);
      if (res.ok && asCheckout?.ok && asCheckout.checkout?.url) return asCheckout;

      const asPI = safeJsonParse<InitResponsePI>(text);
      if (res.ok && asPI?.clientSecret && asPI?.escrowId) return asPI;

      throw new Error(shortText(text) || `Escrow init failed (${res.status}).`);
    },
    onSuccess: (data) => {
      // Checkout flow
      if ("ok" in data && data.ok && "checkout" in data) {
        setEscrow(data.escrow);
        setEscrowIdLookup(data.escrow.id);
        setNotice("Redirecting to Stripe Checkout…");
        window.location.assign(data.checkout.url);
        return;
      }

      // PaymentIntent clientSecret fallback
      if ("clientSecret" in data) {
        setEscrowIdLookup(data.escrowId);
        setNotice(
          "Escrow record created, but the backend returned a PaymentIntent clientSecret (not a Checkout URL). " +
            "If you want a redirect-based flow, update escrow-init to create a Stripe Checkout Session. " +
            "For now you can paste the escrowId into the lookup section and continue."
        );
        return;
      }

      setNotice("Escrow created.");
    },
    onError: (e) => setNotice(e.message),
  });

  const syncMutation = useMutation<SyncResponse, Error>({
    mutationFn: async () => {
      setNotice(null);

      const id = escrowIdLookup.trim();
      if (!id) throw new Error("escrowId is required.");
      if (!UUID_RE.test(id)) throw new Error("escrowId must be a UUID.");

      const res = await fetch(`/api/escrow/init?escrowId=${encodeURIComponent(id)}&sync=1`, {
        method: "GET",
        credentials: "same-origin",
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<SyncResponse>(text);

      if (!res.ok || !data?.ok) {
        throw new Error(shortText(text) || `Failed to load escrow (${res.status}).`);
      }

      return data;
    },
    onSuccess: (data) => {
      setEscrow(data.escrow);
      setNotice("Escrow loaded.");
    },
    onError: (e) => setNotice(e.message),
  });

  const releaseMutation = useMutation<ReleaseResponse, Error>({
    mutationFn: async () => {
      setNotice(null);

      if (!escrow?.id) throw new Error("No escrow loaded.");

      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          escrowId: escrow.id,
          inspectionResult, // PASS | FAIL
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
      setNotice(
        data.escrow.status === "released"
          ? "PASS: Funds captured and escrow released."
          : data.escrow.status === "cancelled"
            ? "FAIL: Authorization cancelled and escrow cancelled."
            : `Escrow updated: ${data.escrow.status}`
      );
    },
    onError: (e) => setNotice(e.message),
  });

  function onCreateSubmit(e: FormEvent) {
    e.preventDefault();
    setNotice(null);

    if (!canCreate) {
      setNotice("You do not have permission to create an escrow (buyer/admin only).");
      return;
    }

    if (!rfqId.trim()) return setNotice("RFQ ID is required.");
    if (!UUID_RE.test(rfqId.trim())) return setNotice("rfqId must be a UUID.");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return setNotice("Amount must be a positive number.");
    }
    if (!currency.trim()) return setNotice("Currency is required.");

    initMutation.mutate();
  }

  return (
    <div className="contracts-page">
      <header className="contracts-head">
        <div>
          <p className="dash-kicker">Trust & payments</p>
          <h1 className="dash-title">Contracts & escrow</h1>
          <p className="muted contracts-subtitle">
            Real flow: create escrow → pay via Stripe (manual capture) → sync escrow → PASS captures / FAIL cancels.
          </p>
        </div>

        <div className="contracts-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
          <NavLink to={ROUTES.DASHBOARD.RFQS} className="btn btn--ghost">
            Open RFQs
          </NavLink>
        </div>
      </header>

      {notice && (
        <section className="card">
          <div className="contracts-notice">{notice}</div>
        </section>
      )}

      <section className="card card--soft">
        <div className="section-head">
          <div>
            <div className="section-label">Create escrow</div>
            <div className="section-title">Start payment for an RFQ</div>
            <div className="muted">
              Paste a real <code>rfqId</code> (UUID) from your RFQs page. This calls <code>/api/escrow/init</code>.
            </div>
          </div>
          <div className="meta-box">
            <span className="meta-box__label">Signed in as</span>
            <span className="meta-box__value mono">{buyerId || "(not signed in)"}</span>
          </div>
        </div>

        {!canCreate && (
          <div className="rfq-alert rfq-alert--error" style={{ marginTop: 14 }}>
            Only buyers/admins can create an escrow on this page.
          </div>
        )}

        <form onSubmit={onCreateSubmit} className="contracts-form" style={{ marginTop: 14 }}>
          <label className="contracts-label">
            RFQ ID (UUID)
            <input
              className="input"
              value={rfqId}
              onChange={(e) => setRfqId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </label>

          <label className="contracts-label">
            Amount
            <input
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
            />
          </label>

          <label className="contracts-label">
            Currency
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="usd">USD</option>
              <option value="eur">EUR</option>
              <option value="gbp">GBP</option>
            </select>
          </label>

          <label className="contracts-label">
            Cooperative ID (optional)
            <input
              className="input"
              value={cooperativeId}
              onChange={(e) => setCooperativeId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </label>

          <label className="contracts-label">
            Lot ID (optional)
            <input
              className="input"
              value={lotId}
              onChange={(e) => setLotId(e.target.value)}
              placeholder="lot-abcdef12"
            />
          </label>

          <div className="contracts-form__actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!canCreate || !createEnabled || initMutation.isPending}
            >
              {initMutation.isPending ? "Creating…" : "Create escrow & pay"}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <div className="section-label">Lookup escrow</div>
            <div className="section-title">Sync status / release after inspection</div>
            <div className="muted">
              Load an escrow by its UUID (calls <code>/api/escrow/init?escrowId=…&sync=1</code>).
            </div>
          </div>
        </div>

        <div className="lookup-row" style={{ marginTop: 14 }}>
          <input
            className="input"
            value={escrowIdLookup}
            onChange={(e) => setEscrowIdLookup(e.target.value)}
            placeholder="escrowId (UUID)"
          />
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending ? "Loading…" : "Load escrow"}
          </button>
        </div>

        {!escrow && (
          <p className="muted" style={{ marginTop: 12 }}>
            No escrow loaded yet.
          </p>
        )}

        {escrow && (
          <div className="card card--soft" style={{ marginTop: 14 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Escrow ID:</strong> <code>{escrow.id}</code>
              </div>
              <div>
                <strong>Status:</strong> <code>{escrow.status}</code>
              </div>
              <div>
                <strong>RFQ:</strong> <code>{escrow.rfq_id}</code>
              </div>
              <div>
                <strong>Amount:</strong> {escrow.amount} {escrow.currency.toUpperCase()}
              </div>
              <div>
                <strong>PaymentIntent:</strong> <code>{escrow.payment_intent_id ?? "—"}</code>
              </div>
            </div>

            <hr style={{ margin: "14px 0", opacity: 0.4 }} />

            <div className="section-label">Inspection outcome</div>
            <p className="muted" style={{ marginTop: 6 }}>
              Use after escrow is <code>authorized</code>. PASS captures funds; FAIL cancels authorization.
            </p>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" checked={inspectionResult === "PASS"} onChange={() => setInspectionResult("PASS")} />
                PASS (capture)
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="radio" checked={inspectionResult === "FAIL"} onChange={() => setInspectionResult("FAIL")} />
                FAIL (cancel)
              </label>
            </div>

            <label className="contracts-label" style={{ marginTop: 10 }}>
              Notes (optional)
              <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Inspector notes…" />
            </label>

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => releaseMutation.mutate()}
                disabled={releaseMutation.isPending}
              >
                {releaseMutation.isPending ? "Submitting…" : "Submit inspection & update escrow"}
              </button>

              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                Refresh status
              </button>
            </div>
          </div>
        )}
      </section>

      <style>
        {`
          .contracts-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .contracts-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .contracts-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .contracts-subtitle{ margin: 0; }

          .contracts-notice{
            font-size: var(--fs-2);
          }

          .section-head{
            display:flex;
            align-items:flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .section-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .section-title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .meta-box{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
            min-width: 220px;
          }

          .meta-box__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 4px;
          }

          .meta-box__value{
            font-size: var(--fs-2);
            font-weight: var(--fw-semibold);
          }

          .mono{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .contracts-form{
            display:grid;
            grid-template-columns: 1.2fr 0.7fr 0.5fr;
            gap: var(--space-3);
            align-items: end;
          }

          .contracts-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .contracts-form__actions{
            grid-column: 1 / -1;
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lookup-row{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            align-items: center;
          }

          @media (max-width: 1100px){
            .contracts-form{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 780px){
            .contracts-form{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Contracts;
