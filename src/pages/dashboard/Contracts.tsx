// agrotrust-az/src/pages/dashboard/Contracts.tsx

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES, lotDetailsPath } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";


type Lot = {
  id: string;
  product: string;
  variety?: string;
  coopId?: string;
  cooperativeId?: string;
  coopName?: string;
  region?: string;
  harvestDate?: string;
  quantityKg?: number;
  qualityGrade?: string;
  certifications?: string[];
  passportId?: string | null;
  status?: "draft" | "ready" | "exported";
};
type Buyer = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  type?: "wholesaler" | "retailer" | "processor" | "importer" | "other";
  preferredCertifications?: string[];
  minOrderKg?: number;
  riskProfile?: "low" | "medium" | "high";
};

type EscrowStatus =
  | "initiated"
  | "funded"
  | "inspection_pending"
  | "released"
  | "rejected"
  | "refunded";

type EscrowOutcome = "pass" | "fail";

type EscrowContract = {
  escrowId: string;
  createdAt: string;
  updatedAt?: string;
  cooperativeId?: string;

  lotId: string;
  lotProduct?: string;
  coopName?: string;

  buyerId: string;
  buyerName?: string;

  amountUsd: number;

  status: EscrowStatus;

  lastOutcome?: EscrowOutcome;
  notes?: string;
};

type EscrowInitResponse = Partial<EscrowContract> & {
  escrowId?: string;
};

type EscrowReleaseResponse = Partial<EscrowContract> & {
  escrowId?: string;
  status?: EscrowStatus;
};

const LS_KEY = "agrotrust_escrow_contracts_v1";

async function fetchSampleLots(): Promise<Lot[]> {
  const res = await fetch("/mock/sample-lots.json", {
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to load sample lots.");
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as Lot[]) : [];
}

async function fetchSampleBuyers(): Promise<Buyer[]> {
  const res = await fetch("/mock/sample-buyers.json", {
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to load sample buyers.");
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as Buyer[]) : [];
}

function loadContracts(): EscrowContract[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as EscrowContract[];
  } catch {
    return [];
  }
}

function saveContracts(items: EscrowContract[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore for MVP
  }
}

function seedContracts(): EscrowContract[] {
  const now = Date.now();
  const d1 = new Date(now - 1000 * 60 * 60 * 24 * 4).toISOString();
  const d2 = new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString();

  return [
    {
      escrowId: "ESC-0001",
      createdAt: d1,
      lotId: "LOT-001",
      lotProduct: "Tomatoes",
      coopName: "Aran Harvest Cooperative",
      buyerId: "BUY-001",
      buyerName: "Gulf Fresh Procurement",
      amountUsd: 15000,
      status: "inspection_pending",
      notes:
        "Initial pilot shipment. Funds held until border inspection confirms grade and freshness."
    },
    {
      escrowId: "ESC-0002",
      createdAt: d2,
      lotId: "LOT-004",
      lotProduct: "Hazelnuts",
      coopName: "Shaki-Nut Union",
      buyerId: "BUY-002",
      buyerName: "Caspian Retail Partners",
      amountUsd: 22000,
      status: "funded",
      notes:
        "Buyer deposit received. Awaiting inspection scheduling for release."
    }
  ];
}

function statusLabel(s: EscrowStatus) {
  switch (s) {
    case "initiated":
      return "Initiated";
    case "funded":
      return "Funded";
    case "inspection_pending":
      return "Inspection pending";
    case "released":
      return "Released";
    case "rejected":
      return "Rejected";
    case "refunded":
      return "Refunded";
    default:
      return s;
  }
}

function statusToneClass(s: EscrowStatus) {
  if (s === "released") return "ok";
  if (s === "rejected" || s === "refunded") return "warn";
  if (s === "inspection_pending") return "info";
  return "neutral";
}

async function escrowInit(payload: {
  lotId: string;
  buyerId: string;
  cooperativeId: string;
  amountUsd: number;
}): Promise<EscrowInitResponse> {
  const res = await fetch("/.netlify/functions/escrow-init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to initiate escrow.");
  }

  return (await res.json()) as EscrowInitResponse;
}

async function escrowRelease(payload: {
  escrowId: string;
  outcome: EscrowOutcome;
}): Promise<EscrowReleaseResponse> {
  const res = await fetch("/.netlify/functions/escrow-release", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to update escrow status.");
  }

  return (await res.json()) as EscrowReleaseResponse;
}

export function Contracts() {
  const { user } = useAuth();

  const lotsQuery = useQuery({
    queryKey: ["lots", "sample", "contracts"],
    queryFn: fetchSampleLots,
    enabled: env.enableMocks
  });

  const buyersQuery = useQuery({
    queryKey: ["buyers", "sample", "contracts"],
    queryFn: fetchSampleBuyers,
    enabled: env.enableMocks
  });

  const lots = lotsQuery.data ?? [];
  const buyers = buyersQuery.data ?? [];

  const [contracts, setContracts] = useState<EscrowContract[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  // Create form state (MVP)
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>("");
  const [amountUsd, setAmountUsd] = useState<string>("15000");
  const [showCreate, setShowCreate] = useState(false);

  const canCreate =
    user?.role === "buyer" || user?.role === "admin" || user?.role === "cooperative"|| user?.role === "cooperative";

  useEffect(() => {
    // Merge seeds + stored, de-duplicate by escrowId
    const stored = loadContracts();
    const merged = [...seedContracts(), ...stored];

    const map = new Map<string, EscrowContract>();
    for (const c of merged) {
      if (c?.escrowId) map.set(c.escrowId, c);
    }

    const list = Array.from(map.values()).sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );

    setContracts(list);
  }, []);

  useEffect(() => {
    if (contracts.length) saveContracts(contracts);
  }, [contracts]);

  // Default selections when form opens
  useEffect(() => {
    if (!showCreate) return;
    if (!selectedLotId && lots.length) setSelectedLotId(lots[0].id);
    if (!selectedBuyerId && buyers.length) setSelectedBuyerId(buyers[0].id);

    if (!selectedBuyerId && buyers.length === 0) {
      setSelectedBuyerId("BUY-001");
    }

    if (!selectedLotId && lots.length === 0) {
      setSelectedLotId("LOT-001");
    }
  }, [showCreate, selectedLotId, selectedBuyerId, lots, buyers]);

  const lotOptions = useMemo(() => {
    if (lots.length === 0) {
      return [
        { id: "LOT-001", label: "LOT-001 • Tomatoes • Aran Harvest Cooperative" },
        { id: "LOT-004", label: "LOT-004 • Hazelnuts • Shaki-Nut Union" }
      ];
    }
    return lots.map((l) => ({
      id: l.id,
      label: `${l.id} • ${l.product} • ${l.coopName ?? "Cooperative"}`
    }));
  }, [lots]);

  const buyerOptions = useMemo(() => {
    if (buyers.length === 0) {
      return [
        { id: "BUY-001", name: "Gulf Fresh Procurement" },
        { id: "BUY-002", name: "Caspian Retail Partners" }
      ];
    }
    return buyers.map((b) => ({ id: b.id, name: b.name }));
  }, [buyers]);

  const initMutation = useMutation({
    mutationFn: () => {
    const lot = lots.find((l) => l.id === selectedLotId);

    const cooperativeId =
      lot?.cooperativeId ||
      lot?.coopId ||
      (user?.role === "cooperative" ? user.id : undefined);

    if (!cooperativeId) {
      throw new Error("Cannot initiate escrow: cooperativeId is missing. Select a real lot from DB.");
    }

    const buyerId = user?.role === "buyer" ? user.id : selectedBuyerId;

    if (!buyerId) {
      throw new Error("Cannot initiate escrow: buyerId is missing.");
    }

    return escrowInit({
      lotId: selectedLotId,
      buyerId,
      cooperativeId,
      amountUsd: Number(amountUsd) || 0
    });
  },
    onSuccess: (data) => {
      const lot = lots.find((l) => l.id === selectedLotId);
      const buyer = buyers.find((b) => b.id === selectedBuyerId);

      const escrowId =
        data.escrowId ||
        `ESC-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;

      const newItem: EscrowContract = {
        escrowId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt,
        lotId: selectedLotId,
        lotProduct: lot?.product ?? data.lotProduct,
        coopName: lot?.coopName ?? data.coopName,
        buyerId: selectedBuyerId,
        buyerName: buyer?.name ?? data.buyerName,
        amountUsd:
          typeof data.amountUsd === "number"
            ? data.amountUsd
            : Number(amountUsd) || 15000,
        status: (data.status as EscrowStatus) || "initiated",
        notes: data.notes
      };

      setContracts((prev) => [newItem, ...prev]);
      setNotice("Escrow initiated for the demo.");
      setShowCreate(false);
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Failed to initiate escrow.";
      setNotice(msg);
    }
  });

  const releaseMutation = useMutation({
    mutationFn: (payload: {
      escrowId: string;
      outcome: EscrowOutcome
    }) =>
      escrowRelease(payload),
    onSuccess: (data, vars) => {
      setContracts((prev) =>
        prev.map((c) => {
          if (c.escrowId !== vars.escrowId) return c;

          const nextStatus =
            (data.status as EscrowStatus) ||
            (vars.outcome === "pass" ? "released" : "refunded");

          return {
            ...c,
            status: nextStatus,
            lastOutcome: vars.outcome,
            updatedAt: data.updatedAt || new Date().toISOString()
          };
        })
      );

      setNotice(
        vars.outcome === "pass"
          ? "Inspection passed. Funds released for the demo."
          : "Inspection failed. Funds refunded for the demo."
      );
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Failed to update escrow.";
      setNotice(msg);
    }
  });

  function handleCreate() {
    setNotice(null);

    const amt = Number(amountUsd);
    if (!selectedLotId || !selectedBuyerId) {
      setNotice("Please select both a lot and a buyer.");
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setNotice("Please enter a valid amount in USD.");
      return;
    }

    initMutation.mutate();
  }

  function canRunInspection(status: EscrowStatus) {
    return status === "initiated" || status === "funded" || status === "inspection_pending";
  }

  return (
    <div className="contracts-page">
      <header className="contracts-head">
        <div>
          <p className="dash-kicker">Trust & payments</p>
          <h1 className="dash-title">Contracts & escrow</h1>
          <p className="muted contracts-subtitle">
            A simplified, inspection-gated escrow storyline that demonstrates
            how verified traceability can reduce first-deal risk for exporters
            and foreign buyers.
          </p>
        </div>

        <div className="contracts-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCreate}
            onClick={() => setShowCreate((s) => !s)}
            title={
              canCreate
                ? "Initiate a new demo escrow."
                : "You do not have permission to create contracts."
            }
          >
            {showCreate ? "Close form" : "Initiate escrow"}
          </button>
        </div>
      </header>

      {showCreate && (
        <section className="contracts-create card card--soft">
          <div className="contracts-create__head">
            <div>
              <div className="contracts-create__label">New escrow (MVP)</div>
              <div className="contracts-create__title">
                Tie payment release to inspection outcomes
              </div>
              <div className="muted">
                This form triggers a Netlify Function in the hackathon build.
                When mocks are enabled, it pairs naturally with sample lots and
                buyer profiles.
              </div>
            </div>

            <div className="contracts-create__meta">
              <div className="meta-box">
                <span className="meta-box__label">Data mode</span>
                <span className="meta-box__value">
                  {env.enableMocks ? "Mock-backed" : "API-first"}
                </span>
              </div>
              <div className="meta-box">
                <span className="meta-box__label">Default status</span>
                <span className="meta-box__value">Initiated</span>
              </div>
            </div>
          </div>

          <div className="contracts-form">
            <label className="contracts-label">
              Lot
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
              >
                {lotOptions.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="contracts-label">
              Buyer
              <select
                value={selectedBuyerId}
                onChange={(e) => setSelectedBuyerId(e.target.value)}
              >
                {buyerOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="contracts-label">
              Amount (USD)
              <input
                className="input"
                inputMode="numeric"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="e.g., 15000"
              />
            </label>

            <div className="contracts-form__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreate}
                disabled={initMutation.isPending}
              >
                {initMutation.isPending ? "Initiating…" : "Create escrow"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowCreate(false)}
                disabled={initMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      {notice && (
        <section className="card">
          <div className="contracts-notice">{notice}</div>
        </section>
      )}

      <section className="contracts-table card">
        {(lotsQuery.isLoading || buyersQuery.isLoading) && env.enableMocks && (
          <div className="contracts-state">
            <p>Loading supporting data…</p>
          </div>
        )}

        {(lotsQuery.isError || buyersQuery.isError) && env.enableMocks && (
          <div className="contracts-state">
            <p className="muted">
              {((lotsQuery.error || buyersQuery.error) as Error)?.message ??
                "Failed to load supporting data."}
            </p>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                lotsQuery.refetch();
                buyersQuery.refetch();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {contracts.length === 0 && (
          <div className="contracts-state">
            <p className="muted">
              No contracts yet. Initiate an escrow to demonstrate the payment
              trust flow.
            </p>
          </div>
        )}

        {contracts.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Escrow ID</th>
                <th>Lot</th>
                <th>Product</th>
                <th>Cooperative</th>
                <th>Buyer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.escrowId}>
                  <td>
                    <code className="contracts-code">{c.escrowId}</code>
                  </td>
                  <td>
                    <NavLink to={lotDetailsPath(c.lotId)} className="contracts-lot-link">
                      {c.lotId}
                    </NavLink>
                  </td>
                  <td>{c.lotProduct ?? "—"}</td>
                  <td>{c.coopName ?? "—"}</td>
                  <td>{c.buyerName ?? c.buyerId}</td>
                  <td>{`${c.amountUsd.toLocaleString()} USD`}</td>
                  <td>
                    <span
                      className={`contracts-pill contracts-pill--${statusToneClass(
                        c.status
                      )}`}
                      title={c.lastOutcome ? `Last outcome: ${c.lastOutcome}` : undefined}
                    >
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="contracts-actions-cell">
                    <div className="contracts-row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost contracts-mini-btn"
                        disabled={!canRunInspection(c.status) || releaseMutation.isPending}
                        onClick={() =>
                          releaseMutation.mutate({
                            escrowId: c.escrowId,
                            outcome: "pass"
                          })
                        }
                        title="Simulate a successful inspection and release funds"
                      >
                        Pass
                      </button>

                      <button
                        type="button"
                        className="btn btn--ghost contracts-mini-btn"
                        disabled={!canRunInspection(c.status) || releaseMutation.isPending}
                        onClick={() =>
                          releaseMutation.mutate({
                            escrowId: c.escrowId,
                            outcome: "fail"
                          })
                        }
                        title="Simulate a failed inspection and refund funds"
                      >
                        Fail
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="contracts-foot card card--soft">
        <div className="contracts-foot__inner">
          <div>
            <div className="contracts-foot__label">Judge-ready sequence</div>
            <div className="contracts-foot__title">
              Lots → Passport → RFQ → Escrow release
            </div>
            <div className="muted">
              This page completes the trust story by showing how structured
              evidence can control when funds move, reducing risk for both sides.
            </div>
          </div>

          <div className="contracts-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Lots & Passports
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.RFQS} className="btn btn--soft">
              RFQs
            </NavLink>
          </div>
        </div>
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

          .contracts-subtitle{
            margin: 0;
          }

          .contracts-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .contracts-create{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .contracts-create__head{
            display:flex;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .contracts-create__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .contracts-create__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .contracts-create__meta{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            align-items: start;
          }

          .meta-box{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
            min-width: 160px;
          }

          .meta-box__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .meta-box__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .contracts-form{
            display:grid;
            grid-template-columns: 1fr 1fr 0.6fr;
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
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            grid-column: 1 / -1;
          }

          .contracts-notice{
            font-size: var(--fs-2);
          }

          .contracts-table{
            padding: 0;
          }

          .contracts-state{
            padding: var(--space-5);
            display:flex;
            align-items:center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .contracts-code{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .contracts-lot-link{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .contracts-pill{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            font-weight: var(--fw-medium);
            white-space: nowrap;
          }

          .contracts-pill--ok{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-success) 28%, transparent);
          }

          .contracts-pill--info{
            background: color-mix(in oklab, var(--color-info) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-info) 28%, transparent);
          }

          .contracts-pill--warn{
            background: color-mix(in oklab, var(--color-warning) 12%, transparent);
            border-color: color-mix(in oklab, var(--color-warning) 30%, transparent);
          }

          .contracts-pill--neutral{
            opacity: 0.9;
          }

          .contracts-actions-cell{
            width: 1%;
            white-space: nowrap;
          }

          .contracts-row-actions{
            display:flex;
            gap: 6px;
          }

          .contracts-mini-btn{
            height: 28px;
            padding: 0 8px;
          }

          .contracts-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .contracts-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .contracts-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .contracts-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1200px){
            .contracts-form{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 980px){
            .contracts-form{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}