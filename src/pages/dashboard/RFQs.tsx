// agrotrust-az/src/pages/dashboard/RFQs.tsx

import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES, lotDetailsPath } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * RFQs (Dashboard)
 *
 * Hackathon MVP:
 * - Uses mock lots + buyers when env.enableMocks is true
 * - Provides a lightweight RFQ creation panel (client-side only)
 * - Persists RFQs in localStorage for a smooth demo
 *
 * This page is intentionally self-contained until features/rfq is implemented.
 */

type Lot = {
  id: string;
  product: string;
  variety?: string;
  coopId?: string;
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
  procurementFocus?: string[];
  preferredCertifications?: string[];
  minOrderKg?: number;
  riskProfile?: "low" | "medium" | "high";
};

type RFQStatus = "draft" | "sent" | "answered" | "closed";

type RFQ = {
  id: string;
  createdAt: string;
  status: RFQStatus;

  buyerId?: string;
  buyerName?: string;

  product: string;
  quantityKg: number;

  targetPricePerKg?: number;
  preferredCertifications?: string[];
  regionPreference?: string;

  // Optional linkage to an existing lot for the demo narrative
  lotId?: string;

  notes?: string;
};

const LS_KEY = "agrotrust_rfqs_v1";

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

function seedRfqs(): RFQ[] {
  const now = new Date();
  const d1 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5);
  const d2 = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2);

  return [
    {
      id: "RFQ-0001",
      createdAt: d1.toISOString(),
      status: "sent",
      buyerId: "BUY-001",
      buyerName: "Gulf Fresh Procurement",
      product: "Tomatoes",
      quantityKg: 12000,
      targetPricePerKg: 1.35,
      preferredCertifications: ["GlobalG.A.P"],
      regionPreference: "Aran",
      notes:
        "First-season trial lots. Preference for consistent harvest windows and passport availability."
    },
    {
      id: "RFQ-0002",
      createdAt: d2.toISOString(),
      status: "draft",
      buyerId: "BUY-002",
      buyerName: "Caspian Retail Partners",
      product: "Hazelnuts",
      quantityKg: 8000,
      targetPricePerKg: 4.1,
      preferredCertifications: ["Organic (claimed)"],
      regionPreference: "Ganja-Gazakh",
      notes:
        "Looking for mid-volume supply with clear input declarations and cooperative-level readiness."
    }
  ];
}

function loadFromStorage(): RFQ[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as RFQ[];
  } catch {
    return [];
  }
}

function saveToStorage(items: RFQ[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {
    // ignore in MVP
  }
}

function nextRfqId(existing: RFQ[]) {
  // Simple incremental ID based on existing max
  const nums = existing
    .map((r) => Number(String(r.id).replace(/[^\d]/g, "")))
    .filter((n) => Number.isFinite(n));

  const max = nums.length ? Math.max(...nums) : 0;
  const next = max + 1;
  return `RFQ-${String(next).padStart(4, "0")}`;
}

function statusLabel(s: RFQStatus) {
  switch (s) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "answered":
      return "Answered";
    case "closed":
      return "Closed";
  }
}

export function RFQs() {
  const { user, getRoleLabel } = useAuth();

  const canCreate = user?.role === "buyer" || user?.role === "admin";

  const lotsQuery = useQuery({
    queryKey: ["lots", "sample", "rfq"],
    queryFn: fetchSampleLots,
    enabled: env.enableMocks
  });

  const buyersQuery = useQuery({
    queryKey: ["buyers", "sample", "rfq"],
    queryFn: fetchSampleBuyers,
    enabled: env.enableMocks
  });

  const lots = lotsQuery.data ?? [];
  const buyers = buyersQuery.data ?? [];

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of lots) if (l.product) set.add(l.product);
    // Fallback list for when mocks are off or empty
    const base = Array.from(set);
    if (base.length === 0) {
      base.push("Tomatoes", "Hazelnuts", "Persimmons");
    }
    return base.sort();
  }, [lots]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of lots) if (l.region) set.add(l.region);
    const list = Array.from(set).sort();
    if (list.length === 0) {
      list.push("Aran", "Ganja-Gazakh", "Lankaran-Astara", "Shaki-Zagatala");
    }
    return list;
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

  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RFQStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const [rfqs, setRfqs] = useState<RFQ[]>([]);

  // Create form state
  const [buyerId, setBuyerId] = useState<string>("");
  const [product, setProduct] = useState<string>("");
  const [quantityKg, setQuantityKg] = useState<string>("5000");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [regionPreference, setRegionPreference] = useState<string>("");
  const [lotId, setLotId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadFromStorage();
    const merged = [...seedRfqs(), ...stored];

    // De-duplicate by id
    const map = new Map<string, RFQ>();
    for (const r of merged) map.set(r.id, r);

    const list = Array.from(map.values()).sort(
      (a, b) => (a.createdAt < b.createdAt ? 1 : -1)
    );

    setRfqs(list);
  }, []);

  useEffect(() => {
    // Save only non-seed items? For simplicity, save everything currently in state.
    // This keeps the demo deterministic across refresh.
    if (rfqs.length) saveToStorage(rfqs);
  }, [rfqs]);

  useEffect(() => {
    // Default selections when opening create panel
    if (!showCreate) return;

    if (!buyerId && user?.role === "buyer") {
      // If a buyer is signed in without a known ID, select first option
      setBuyerId(buyerOptions[0]?.id ?? "");
    } else if (!buyerId) {
      setBuyerId(buyerOptions[0]?.id ?? "");
    }

    if (!product) setProduct(productOptions[0] ?? "");
    if (!regionPreference) setRegionPreference(regionOptions[0] ?? "");
  }, [
    showCreate,
    buyerId,
    product,
    regionPreference,
    buyerOptions,
    productOptions,
    regionOptions,
    user?.role
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rfqs.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesProduct =
        productFilter === "all" ||
        r.product.toLowerCase() === productFilter.toLowerCase();

      if (!q) return matchesStatus && matchesProduct;

      const hay = [
        r.id,
        r.buyerName,
        r.product,
        r.regionPreference,
        r.notes,
        ...(r.preferredCertifications ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesProduct && hay.includes(q);
    });
  }, [rfqs, query, statusFilter, productFilter]);

  function resetForm() {
    setBuyerId(buyerOptions[0]?.id ?? "");
    setProduct(productOptions[0] ?? "");
    setQuantityKg("5000");
    setTargetPrice("");
    setRegionPreference(regionOptions[0] ?? "");
    setLotId("");
    setNotes("");
    setFormError(null);
  }

  function handleCreateRfq() {
    setFormError(null);

    const qty = Number(quantityKg);
    const price = targetPrice.trim() ? Number(targetPrice) : undefined;

    if (!product.trim()) {
      setFormError("Please select a product.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setFormError("Please enter a valid quantity in kg.");
      return;
    }
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      setFormError("Please enter a valid target price or leave it empty.");
      return;
    }

    const buyerRecord = buyerOptions.find((b) => b.id === buyerId);
    const selectedLot = lots.find((l) => l.id === lotId);

    const newRfq: RFQ = {
      id: nextRfqId(rfqs),
      createdAt: new Date().toISOString(),
      status: "draft",
      buyerId: buyerRecord?.id,
      buyerName: buyerRecord?.name,
      product: product.trim(),
      quantityKg: qty,
      targetPricePerKg: price,
      regionPreference: regionPreference.trim() || undefined,
      lotId: selectedLot?.id || undefined,
      preferredCertifications:
        selectedLot?.certifications?.length ? selectedLot.certifications : undefined,
      notes: notes.trim() || undefined
    };

    setRfqs((prev) => [newRfq, ...prev]);
    resetForm();
    setShowCreate(false);
  }

  function updateStatus(id: string, status: RFQStatus) {
    setRfqs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  const lotOptionsForProduct = useMemo(() => {
    if (!product) return lots;
    return lots.filter((l) => l.product?.toLowerCase() === product.toLowerCase());
  }, [lots, product]);

  return (
    <div className="rfq-page">
      <header className="rfq-head">
        <div>
          <p className="dash-kicker">Market access</p>
          <h1 className="dash-title">RFQs</h1>
          <p className="muted rfq-subtitle">
            Prototype request-for-quotation flows that link buyer expectations
            to cooperative lots, Passports, and the escrow narrative.
          </p>
          <p className="muted rfq-subtitle">
            Signed in as <strong>{getRoleLabel(user?.role)}</strong>.
          </p>
        </div>

        <div className="rfq-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCreate}
            onClick={() => {
              if (!canCreate) return;
              setShowCreate((s) => !s);
            }}
            title={
              canCreate
                ? "Create a client-side RFQ for the demo."
                : "Only buyer or admin roles can create RFQs."
            }
          >
            {showCreate ? "Close form" : "Create RFQ"}
          </button>
        </div>
      </header>

      {showCreate && (
        <section className="rfq-create card card--soft">
          <div className="rfq-create__head">
            <div>
              <div className="rfq-create__label">New RFQ (MVP)</div>
              <div className="rfq-create__title">
                Capture buyer intent in a structured, export-ready format
              </div>
              <div className="muted">
                This form is client-side only. It is designed to support your
                judging narrative rather than provide a full procurement engine.
              </div>
            </div>
            <div className="rfq-create__meta">
              <div className="rfq-meta-box">
                <span className="rfq-meta-box__label">Data source</span>
                <span className="rfq-meta-box__value">
                  {env.enableMocks ? "Mock lots + buyers" : "Local input"}
                </span>
              </div>
              <div className="rfq-meta-box">
                <span className="rfq-meta-box__label">Default status</span>
                <span className="rfq-meta-box__value">Draft</span>
              </div>
            </div>
          </div>

          <div className="rfq-form">
            <label className="rfq-label">
              Buyer
              <select
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
              >
                {buyerOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="rfq-label">
              Product
              <select
                value={product}
                onChange={(e) => {
                  setProduct(e.target.value);
                  setLotId("");
                }}
              >
                {productOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="rfq-label">
              Quantity (kg)
              <input
                className="input"
                inputMode="numeric"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                placeholder="e.g., 5000"
              />
            </label>

            <label className="rfq-label">
              Target price per kg (optional)
              <input
                className="input"
                inputMode="decimal"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g., 1.50"
              />
            </label>

            <label className="rfq-label">
              Region preference (optional)
              <select
                value={regionPreference}
                onChange={(e) => setRegionPreference(e.target.value)}
              >
                <option value="">No preference</option>
                {regionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="rfq-label">
              Link to an existing lot (optional)
              <select
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
              >
                <option value="">No linked lot</option>
                {lotOptionsForProduct.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} • {l.coopName ?? "Coop"} • {l.region ?? "Region"}
                  </option>
                ))}
              </select>
            </label>

            <label className="rfq-label rfq-label--full">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Buyer expectations, certification preferences, delivery windows…"
              />
            </label>

            {formError && (
              <div className="rfq-alert rfq-alert--error">
                {formError}
              </div>
            )}

            <div className="rfq-form__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateRfq}
              >
                Save RFQ
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  resetForm();
                  setShowCreate(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rfq-filters card card--soft">
        <div className="rfq-filters__row">
          <label className="rfq-label">
            Search
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="RFQ ID, buyer, product, region…"
            />
          </label>

          <label className="rfq-label">
            Status
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RFQStatus | "all")}
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="rfq-label">
            Product
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              <option value="all">All products</option>
              {productOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <div className="rfq-meta">
            <div className="rfq-meta__item">
              <span className="rfq-meta__label">Total</span>
              <span className="rfq-meta__value">{rfqs.length}</span>
            </div>
            <div className="rfq-meta__item">
              <span className="rfq-meta__label">Filtered</span>
              <span className="rfq-meta__value">{filtered.length}</span>
            </div>
            <div className="rfq-meta__item">
              <span className="rfq-meta__label">Mocks</span>
              <span className="rfq-meta__value">
                {env.enableMocks ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rfq-table card">
        {(lotsQuery.isLoading || buyersQuery.isLoading) && env.enableMocks && (
          <div className="rfq-state">
            <p>Loading supporting data…</p>
          </div>
        )}

        {(lotsQuery.isError || buyersQuery.isError) && env.enableMocks && (
          <div className="rfq-state">
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

        {filtered.length === 0 && (
          <div className="rfq-state">
            <p className="muted">No RFQs match your filters.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>RFQ ID</th>
                <th>Buyer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Target price</th>
                <th>Region</th>
                <th>Linked lot</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <code className="rfq-code">{r.id}</code>
                  </td>
                  <td>{r.buyerName ?? "—"}</td>
                  <td>{r.product}</td>
                  <td>{r.quantityKg} kg</td>
                  <td>
                    {typeof r.targetPricePerKg === "number"
                      ? `${r.targetPricePerKg.toFixed(2)}`
                      : "—"}
                  </td>
                  <td>{r.regionPreference ?? "—"}</td>
                  <td>
                    {r.lotId ? (
                      <NavLink
                        to={lotDetailsPath(r.lotId)}
                        className="rfq-lot-link"
                        title="Open linked lot"
                      >
                        {r.lotId}
                      </NavLink>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`rfq-pill rfq-pill--${r.status}`}>
                      {statusLabel(r.status)}
                    </span>
                  </td>
                  <td className="muted">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="rfq-actions-cell">
                    <div className="rfq-row-actions">
                      <button
                        type="button"
                        className="btn btn--ghost rfq-mini-btn"
                        onClick={() => updateStatus(r.id, "sent")}
                        disabled={r.status !== "draft"}
                        title="Mark as sent"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost rfq-mini-btn"
                        onClick={() => updateStatus(r.id, "answered")}
                        disabled={r.status !== "sent"}
                        title="Mark as answered"
                      >
                        Answer
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost rfq-mini-btn"
                        onClick={() => updateStatus(r.id, "closed")}
                        disabled={r.status === "closed"}
                        title="Close RFQ"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rfq-foot card card--soft">
        <div className="rfq-foot__inner">
          <div>
            <div className="rfq-foot__label">End-to-end demo path</div>
            <div className="rfq-foot__title">
              Link an RFQ to a lot, then show Passport verification and escrow.
            </div>
            <div className="muted">
              This sequence presents a coherent B2B story: buyer intent →
              traceable supply → inspection-gated payments.
            </div>
          </div>

          <div className="rfq-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Lots & Passports
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Escrow demo
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .rfq-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .rfq-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .rfq-subtitle{
            margin: 0;
          }

          .rfq-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .rfq-create{
            display:flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .rfq-create__head{
            display:flex;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .rfq-create__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-create__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .rfq-create__meta{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            align-items: start;
          }

          .rfq-meta-box{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
            min-width: 160px;
          }

          .rfq-meta-box__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-meta-box__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .rfq-form{
            display:grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: var(--space-3);
            align-items: end;
          }

          .rfq-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .rfq-label--full{
            grid-column: 1 / -1;
          }

          .rfq-label textarea{
            min-height: 110px;
          }

          .rfq-alert{
            grid-column: 1 / -1;
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            font-size: var(--fs-2);
          }

          .rfq-alert--error{
            background: color-mix(in oklab, var(--color-danger) 10%, transparent);
          }

          .rfq-form__actions{
            grid-column: 1 / -1;
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-1);
          }

          .rfq-filters__row{
            display:grid;
            grid-template-columns: 1.2fr 0.5fr 0.6fr 1fr;
            gap: var(--space-4);
            align-items: end;
          }

          .rfq-meta{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-2);
          }

          .rfq-meta__item{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .rfq-meta__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-meta__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .rfq-table{
            padding: 0;
          }

          .rfq-state{
            padding: var(--space-5);
            display:flex;
            align-items:center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .rfq-code{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .rfq-lot-link{
            font-size: var(--fs-1);
            font-family: var(--font-mono);
          }

          .rfq-pill{
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

          .rfq-pill--draft{
            background: color-mix(in oklab, var(--color-info) 8%, transparent);
            border-color: color-mix(in oklab, var(--color-info) 26%, transparent);
          }

          .rfq-pill--sent{
            background: color-mix(in oklab, var(--color-primary) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-primary) 28%, transparent);
          }

          .rfq-pill--answered{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-success) 28%, transparent);
          }

          .rfq-pill--closed{
            opacity: 0.75;
          }

          .rfq-actions-cell{
            width: 1%;
            white-space: nowrap;
          }

          .rfq-row-actions{
            display:flex;
            gap: 6px;
          }

          .rfq-mini-btn{
            height: 28px;
            padding: 0 8px;
          }

          .rfq-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .rfq-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .rfq-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .rfq-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1200px){
            .rfq-filters__row{
              grid-template-columns: 1fr 1fr;
            }
            .rfq-form{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 980px){
            .rfq-filters__row{
              grid-template-columns: 1fr;
            }
            .rfq-form{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .rfq-meta{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}