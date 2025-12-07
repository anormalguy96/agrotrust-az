// agrotrust-az/src/pages/dashboard/Lots.tsx

import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES, lotDetailsPath } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Lots (Dashboard)
 *
 * Hackathon MVP implementation:
 * - Loads sample lots from /public/mock/sample-lots.json
 * - Uses React Query for clean async state
 * - Provides light filtering/search
 * - Keeps types local to avoid coupling before features/* is finalised
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

async function fetchSampleLots(): Promise<Lot[]> {
  const res = await fetch("/mock/sample-lots.json", {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    throw new Error("Failed to load sample lots.");
  }

  const data = (await res.json()) as unknown;

  if (!Array.isArray(data)) return [];

  // soft-validate shape for MVP
  return data.filter(Boolean) as Lot[];
}

export function Lots() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [productFilter, setProductFilter] = useState("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lots", "sample"],
    queryFn: fetchSampleLots,
    enabled: env.enableMocks
  });

  const lots = useMemo(() => data ?? [], [data]);

  const products = useMemo(() => {
    const set = new Set<string>();
    for (const l of lots) {
      if (l.product) set.add(l.product);
    }
    return ["all", ...Array.from(set).sort()];
  }, [lots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return lots.filter((l) => {
      const matchesProduct =
        productFilter === "all" ||
        (l.product ?? "").toLowerCase() === productFilter.toLowerCase();

      if (!q) return matchesProduct;

      const hay = [
        l.id,
        l.product,
        l.variety,
        l.coopName,
        l.region,
        l.qualityGrade,
        ...(l.certifications ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesProduct && hay.includes(q);
    });
  }, [lots, query, productFilter]);

  const canCreateLots = user?.role !== "buyer";

  return (
    <div className="lots-page">
      <header className="lots-head">
        <div>
          <p className="dash-kicker">Traceability</p>
          <h1 className="dash-title">Product lots</h1>
          <p className="muted lots-subtitle">
            Browse batch-level records and open a lot to preview or generate a
            Digital Product Passport.
          </p>
        </div>

        <div className="lots-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>

          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCreateLots}
            title={
              canCreateLots
                ? "Lot creation will be added in the next MVP iteration."
                : "Buyers cannot create lots."
            }
            onClick={() => {
              // Hackathon placeholder: we keep creation out of scope
              // without breaking the UX.
              // eslint-disable-next-line no-alert
              alert("Lot creation UI is planned for the next iteration.");
            }}
          >
            Create lot (MVP)
          </button>
        </div>
      </header>

      <section className="lots-filters card card--soft">
        <div className="lots-filters__row">
          <label className="lots-label">
            Search
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ID, product, cooperative, region..."
            />
          </label>

          <label className="lots-label">
            Product
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
            >
              {products.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "All products" : p}
                </option>
              ))}
            </select>
          </label>

          <div className="lots-meta">
            <div className="lots-meta__item">
              <span className="lots-meta__label">Source</span>
              <span className="lots-meta__value">
                {env.enableMocks ? "Mock dataset" : "API"}
              </span>
            </div>
            <div className="lots-meta__item">
              <span className="lots-meta__label">Total</span>
              <span className="lots-meta__value">{lots.length}</span>
            </div>
            <div className="lots-meta__item">
              <span className="lots-meta__label">Filtered</span>
              <span className="lots-meta__value">{filtered.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="lots-table card">
        {isLoading && (
          <div className="lots-state">
            <p>Loading lots…</p>
          </div>
        )}

        {isError && (
          <div className="lots-state">
            <p className="muted">
              {(error as Error)?.message ?? "Something went wrong."}
            </p>
            <button type="button" className="btn btn--ghost" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="lots-state">
            <p className="muted">No lots match your filters.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Lot ID</th>
                <th>Product</th>
                <th>Cooperative</th>
                <th>Region</th>
                <th>Harvest</th>
                <th>Quantity</th>
                <th>Grade</th>
                <th>Passport</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((lot) => (
                <tr key={lot.id}>
                  <td>
                    <code className="lots-code">{lot.id}</code>
                  </td>
                  <td>
                    <div className="lots-product">
                      <span className="lots-product__name">{lot.product}</span>
                      {lot.variety && (
                        <span className="muted lots-product__variety">
                          {lot.variety}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{lot.coopName ?? "—"}</td>
                  <td>{lot.region ?? "—"}</td>
                  <td>{lot.harvestDate ?? "—"}</td>
                  <td>
                    {typeof lot.quantityKg === "number"
                      ? `${lot.quantityKg} kg`
                      : "—"}
                  </td>
                  <td>{lot.qualityGrade ?? "—"}</td>
                  <td>
                    {lot.passportId ? (
                      <span className="lots-pill lots-pill--ok">
                        Linked
                      </span>
                    ) : (
                      <span className="lots-pill">
                        Not created
                      </span>
                    )}
                  </td>
                  <td className="lots-actions-cell">
                    <NavLink
                      to={lotDetailsPath(lot.id)}
                      className="btn btn--ghost lots-open-btn"
                    >
                      Open
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="lots-foot card card--soft">
        <div className="lots-foot__inner">
          <div>
            <div className="lots-foot__label">Next story beat</div>
            <div className="lots-foot__title">
              Open a lot to generate the Passport and show QR verification.
            </div>
            <div className="muted">
              This is the fastest way to demonstrate the cooperative → buyer
              trust loop in the hackathon judging flow.
            </div>
          </div>
          <div className="lots-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Escrow demo
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .lots-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .lots-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .lots-subtitle{
            margin: 0;
          }

          .lots-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .lots-filters__row{
            display:grid;
            grid-template-columns: 1.2fr 0.6fr 1fr;
            gap: var(--space-4);
            align-items: end;
          }

          .lots-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .lots-meta{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-2);
          }

          .lots-meta__item{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .lots-meta__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .lots-meta__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .lots-table{
            padding: 0;
          }

          .lots-state{
            padding: var(--space-5);
            display:flex;
            align-items: center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .lots-code{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .lots-product{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .lots-product__name{
            font-weight: var(--fw-medium);
          }

          .lots-product__variety{
            font-size: var(--fs-1);
          }

          .lots-pill{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .lots-pill--ok{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-success) 30%, transparent);
            color: var(--color-text);
          }

          .lots-actions-cell{
            width: 1%;
            white-space: nowrap;
          }

          .lots-open-btn{
            height: 32px;
            padding: 0 10px;
          }

          .lots-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .lots-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .lots-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .lots-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1100px){
            .lots-filters__row{
              grid-template-columns: 1fr;
            }
            .lots-meta{
              grid-template-columns: repeat(3, minmax(0, 1fr));
            }
          }

          @media (max-width: 620px){
            .lots-meta{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}