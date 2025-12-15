import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ROUTES, lotDetailsPath } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

// ---------- RFQ types & backend mapping ----------

export type RFQStatus = "draft" | "sent" | "answered" | "closed";

export type RFQ = {
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

  lotId?: string;
  notes?: string;
};

type RfqListRow = {
  id?: string;
  created_at?: string;
  createdAt?: string;
  status?: RFQStatus;

  buyer_id?: string | null;
  buyerId?: string | null;
  buyer_name?: string | null;
  buyerName?: string | null;

  product?: string;
  product_name?: string;

  quantity_kg?: number;
  quantityKg?: number;

  target_price_per_kg?: number | null;
  targetPricePerKg?: number | null;

  region_preference?: string | null;
  regionPreference?: string | null;

  lot_id?: string | null;
  lotId?: string | null;

  preferred_certifications?: string[] | null;
  preferredCertifications?: string[] | null;

  notes?: string | null;
};

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

function mapRfqRow(row: RfqListRow): RFQ {
  return {
    id: row.id ?? "",
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    status: (row.status ?? "draft") as RFQStatus,

    buyerId: row.buyer_id ?? row.buyerId ?? undefined,
    buyerName: row.buyer_name ?? row.buyerName ?? undefined,

    product: (row.product ?? row.product_name ?? "").trim(),
    quantityKg: row.quantity_kg ?? row.quantityKg ?? 0,

    targetPricePerKg: row.target_price_per_kg ?? row.targetPricePerKg ?? undefined,
    regionPreference: row.region_preference ?? row.regionPreference ?? undefined,
    lotId: row.lot_id ?? row.lotId ?? undefined,

    preferredCertifications: row.preferred_certifications ?? row.preferredCertifications ?? undefined,
    notes: row.notes ?? undefined,
  };
}

// ---------- Backend calls ----------

const FN_BASE = "/.netlify/functions";
const RFQ_LIST = `${FN_BASE}/rfq-list`;
const RFQ_CREATE = `${FN_BASE}/rfq-create`;
const RFQ_UPDATE_STATUS = `${FN_BASE}/rfq-update-status`;

async function fetchRfqs(): Promise<RFQ[]> {
  const res = await fetch(RFQ_LIST, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(shortText(text) || "Failed to load RFQs.");

  const data = safeJsonParse<unknown>(text);
  if (!Array.isArray(data)) return [];
  return (data as RfqListRow[]).map(mapRfqRow);
}

type CreateRfqInput = {
  buyerId?: string;
  buyerName?: string;

  product: string;
  quantityKg: number;

  targetPricePerKg?: number;
  regionPreference?: string;

  lotId?: string;
  preferredCertifications?: string[];
  notes?: string;
};

async function createRfq(input: CreateRfqInput): Promise<RFQ> {
  const res = await fetch(RFQ_CREATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      buyerId: input.buyerId ?? null,
      buyerName: input.buyerName ?? null,
      product: input.product,
      quantityKg: input.quantityKg,
      targetPricePerKg: input.targetPricePerKg ?? null,
      regionPreference: input.regionPreference ?? null,
      lotId: input.lotId ?? null,
      preferredCertifications: input.preferredCertifications ?? [],
      notes: input.notes ?? null,
    }),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(shortText(text) || "Failed to create RFQ.");

  const row = safeJsonParse<RfqListRow>(text);
  return mapRfqRow(row ?? {});
}

type UpdateRfqStatusInput = { id: string; status: RFQStatus };

async function updateRfqStatus(input: UpdateRfqStatusInput): Promise<RFQ> {
  const res = await fetch(RFQ_UPDATE_STATUS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(shortText(text) || "Failed to update RFQ status.");

  const row = safeJsonParse<RfqListRow>(text);
  return mapRfqRow(row ?? {});
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

// ---------- Component ----------

export function RFQs() {
  const { user, getRoleLabel } = useAuth() as any;
  const queryClient = useQueryClient();

  const role = (user?.role || "").toLowerCase();
  const isBuyer = role === "buyer";
  const isAdmin = role === "admin";

  const canCreate = isBuyer || isAdmin;
  const canUpdateStatus = isAdmin;

  const rfqsQuery = useQuery({
    queryKey: ["rfqs"],
    queryFn: fetchRfqs,
  });

  const rfqs = rfqsQuery.data ?? [];

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rfqs) if (r.product) set.add(r.product);
    return Array.from(set).sort();
  }, [rfqs]);

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rfqs) if (r.regionPreference) set.add(r.regionPreference);
    return Array.from(set).sort();
  }, [rfqs]);

  const [showCreate, setShowCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RFQStatus | "all">("all");
  const [productFilter, setProductFilter] = useState<string>("all");

  const [buyerId, setBuyerId] = useState<string>("");
  const [buyerName, setBuyerName] = useState<string>("");

  const [product, setProduct] = useState<string>("");
  const [quantityKg, setQuantityKg] = useState<string>("5000");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [regionPreference, setRegionPreference] = useState<string>("");
  const [lotId, setLotId] = useState<string>("");
  const [preferredCertifications, setPreferredCertifications] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: createRfq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      resetForm();
      setShowCreate(false);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : "Failed to create RFQ.");
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateRfqStatus,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rfqs"] }),
  });

  useEffect(() => {
    if (!showCreate) return;

    if (!buyerId) setBuyerId((user?.id || "").trim());
    if (!buyerName) {
      setBuyerName((user?.name || user?.fullName || user?.email || "").trim());
    }
  }, [showCreate, buyerId, buyerName, user?.id, user?.name, user?.fullName, user?.email]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rfqs.filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesProduct =
        productFilter === "all" || r.product.toLowerCase() === productFilter.toLowerCase();

      if (!q) return matchesStatus && matchesProduct;

      const hay = [
        r.id,
        r.buyerName,
        r.buyerId,
        r.product,
        r.regionPreference,
        r.lotId,
        r.notes,
        ...(r.preferredCertifications ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesProduct && hay.includes(q);
    });
  }, [rfqs, query, statusFilter, productFilter]);

  function resetForm() {
    setBuyerId((user?.id || "").trim());
    setBuyerName((user?.name || user?.fullName || user?.email || "").trim());

    setProduct("");
    setQuantityKg("5000");
    setTargetPrice("");
    setRegionPreference("");
    setLotId("");
    setPreferredCertifications("");
    setNotes("");
    setFormError(null);
  }

  function handleCreateRfq() {
    setFormError(null);

    if (!canCreate) {
      setFormError("Only buyer or admin roles can create RFQs.");
      return;
    }

    const qty = Number(quantityKg);
    const price = targetPrice.trim() ? Number(targetPrice) : undefined;

    if (!product.trim()) return setFormError("Product is required.");
    if (!Number.isFinite(qty) || qty <= 0) return setFormError("Quantity must be a positive number.");
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      return setFormError("Target price must be a positive number (or leave it empty).");
    }

    const certs = preferredCertifications
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const effectiveBuyerId = isBuyer ? (user?.id || "").trim() : buyerId.trim();
    const effectiveBuyerName = buyerName.trim() || undefined;

    if (!effectiveBuyerId && !isAdmin) {
      setFormError("You must be signed in as a buyer to create an RFQ.");
      return;
    }

    createMutation.mutate({
      buyerId: effectiveBuyerId || undefined,
      buyerName: effectiveBuyerName,
      product: product.trim(),
      quantityKg: qty,
      targetPricePerKg: price,
      regionPreference: regionPreference.trim() || undefined,
      lotId: lotId.trim() || undefined,
      preferredCertifications: certs.length ? certs : undefined,
      notes: notes.trim() || undefined,
    });
  }

  function updateStatus(id: string, status: RFQStatus) {
    if (!canUpdateStatus) return;
    updateStatusMutation.mutate({ id, status });
  }

  return (
    <div className="rfq-page">
      <header className="rfq-head">
        <div>
          <p className="dash-kicker">Market access</p>
          <h1 className="dash-title">RFQs</h1>
          <p className="muted rfq-subtitle">
            Buyer intent → RFQ → (optional) link to lot → escrow initiation using rfqId.
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
            title={canCreate ? "Create a server-backed RFQ." : "Only buyer/admin can create RFQs."}
          >
            {showCreate ? "Close form" : "Create RFQ"}
          </button>
        </div>
      </header>

      {showCreate && (
        <section className="rfq-create card card--soft">
          <div className="rfq-create__head">
            <div>
              <div className="rfq-create__label">New RFQ</div>
              <div className="rfq-create__title">Create a real RFQ record</div>
              <div className="muted">
                This is persisted in the backend (no demo/mock data). Use the returned RFQ ID later in Contracts/Escrow.
              </div>
            </div>
            <div className="rfq-create__meta">
              <div className="rfq-meta-box">
                <span className="rfq-meta-box__label">Default status</span>
                <span className="rfq-meta-box__value">Draft</span>
              </div>
              <div className="rfq-meta-box">
                <span className="rfq-meta-box__label">Status updates</span>
                <span className="rfq-meta-box__value">{canUpdateStatus ? "Admin" : "Read-only"}</span>
              </div>
            </div>
          </div>

          <div className="rfq-form">
            {isAdmin ? (
              <>
                <label className="rfq-label">
                  Buyer ID (admin override)
                  <input
                    className="input"
                    value={buyerId}
                    onChange={(e) => setBuyerId(e.target.value)}
                    placeholder="buyer UUID"
                  />
                </label>

                <label className="rfq-label">
                  Buyer name (optional)
                  <input
                    className="input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Buyer name"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="rfq-label">
                  Buyer ID (from login)
                  <input className="input" value={(user?.id || "").trim()} readOnly />
                </label>

                <label className="rfq-label">
                  Buyer name (optional)
                  <input
                    className="input"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your name (optional)"
                  />
                </label>
              </>
            )}

            <label className="rfq-label">
              Product
              <input
                className="input"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g., Tomatoes"
                list="rfq-products"
              />
              <datalist id="rfq-products">
                {productOptions.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
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
              <input
                className="input"
                value={regionPreference}
                onChange={(e) => setRegionPreference(e.target.value)}
                placeholder="e.g., Ganja"
                list="rfq-regions"
              />
              <datalist id="rfq-regions">
                {regionOptions.map((r) => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </label>

            <label className="rfq-label">
              Link lotId (optional)
              <input
                className="input"
                value={lotId}
                onChange={(e) => setLotId(e.target.value)}
                placeholder="lot UUID / id"
              />
            </label>

            <label className="rfq-label rfq-label--full">
              Preferred certifications (optional, comma-separated)
              <input
                className="input"
                value={preferredCertifications}
                onChange={(e) => setPreferredCertifications(e.target.value)}
                placeholder="e.g., GLOBALG.A.P, Organic, ISO22000"
              />
            </label>

            <label className="rfq-label rfq-label--full">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Buyer expectations, delivery windows, inspection requirements…"
              />
            </label>

            {formError && <div className="rfq-alert rfq-alert--error">{formError}</div>}

            <div className="rfq-form__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleCreateRfq}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving…" : "Save RFQ"}
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
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RFQStatus | "all")}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="answered">Answered</option>
              <option value="closed">Closed</option>
            </select>
          </label>

          <label className="rfq-label">
            Product
            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
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
              <span className="rfq-meta__value">{rfqsQuery.isLoading ? "…" : rfqs.length}</span>
            </div>
            <div className="rfq-meta__item">
              <span className="rfq-meta__label">Filtered</span>
              <span className="rfq-meta__value">{filtered.length}</span>
            </div>
            <div className="rfq-meta__item">
              <span className="rfq-meta__label">Backend</span>
              <span className="rfq-meta__value">On</span>
            </div>
          </div>
        </div>
      </section>

      <section className="rfq-table card">
        {rfqsQuery.isLoading && (
          <div className="rfq-state">
            <p>Loading RFQs…</p>
          </div>
        )}

        {rfqsQuery.isError && (
          <div className="rfq-state">
            <p className="muted">{(rfqsQuery.error as Error)?.message ?? "Failed to load RFQs from backend."}</p>
          </div>
        )}

        {!rfqsQuery.isLoading && !rfqsQuery.isError && filtered.length === 0 && (
          <div className="rfq-state">
            <p className="muted">No RFQs match your filters.</p>
          </div>
        )}

        {!rfqsQuery.isLoading && !rfqsQuery.isError && filtered.length > 0 && (
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
                  <td>{r.buyerName ?? r.buyerId ?? "—"}</td>
                  <td>{r.product || "—"}</td>
                  <td>{r.quantityKg} kg</td>
                  <td>{typeof r.targetPricePerKg === "number" ? r.targetPricePerKg.toFixed(2) : "—"}</td>
                  <td>{r.regionPreference ?? "—"}</td>
                  <td>
                    {r.lotId ? (
                      <NavLink to={lotDetailsPath(r.lotId)} className="rfq-lot-link" title="Open linked lot">
                        {r.lotId}
                      </NavLink>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`rfq-pill rfq-pill--${r.status}`}>{statusLabel(r.status)}</span>
                  </td>
                  <td className="muted">{new Date(r.createdAt).toLocaleDateString()}</td>

                  <td className="rfq-actions-cell">
                    <div className="rfq-row-actions">
                      <NavLink
                        className="btn btn--ghost rfq-mini-btn"
                        to={`${ROUTES.DASHBOARD.CONTRACTS}?rfqId=${encodeURIComponent(r.id)}`}
                        title="Open Contracts and start escrow using this RFQ ID"
                      >
                        Start escrow
                      </NavLink>

                      {canUpdateStatus && (
                        <>
                          <button
                            type="button"
                            className="btn btn--ghost rfq-mini-btn"
                            onClick={() => updateStatus(r.id, "sent")}
                            disabled={r.status !== "draft" || updateStatusMutation.isPending}
                            title="Mark as sent"
                          >
                            Send
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost rfq-mini-btn"
                            onClick={() => updateStatus(r.id, "answered")}
                            disabled={r.status !== "sent" || updateStatusMutation.isPending}
                            title="Mark as answered"
                          >
                            Answer
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost rfq-mini-btn"
                            onClick={() => updateStatus(r.id, "closed")}
                            disabled={r.status === "closed" || updateStatusMutation.isPending}
                            title="Close RFQ"
                          >
                            Close
                          </button>
                        </>
                      )}
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
            <div className="rfq-foot__label">Real flow</div>
            <div className="rfq-foot__title">RFQ → Contracts/Escrow</div>
            <div className="muted">
              Create an RFQ, then use its UUID to initiate escrow. This prevents the “rfqId must be a UUID” error.
            </div>
          </div>

          <div className="rfq-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Contracts & escrow
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

export default RFQs;
