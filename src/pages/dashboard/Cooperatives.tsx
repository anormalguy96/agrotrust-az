// agrotrust-az/src/pages/dashboard/Cooperatives.tsx

import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Cooperatives (Dashboard)
 *
 * Hackathon MVP:
 * - Loads sample cooperatives from /public/mock/sample-coops.json
 * - Light search and filtering
 * - Role-aware "Create cooperative" placeholder
 *
 * This is deliberately simple and decoupled from features/*
 * until the coop feature module is implemented.
 */

type Cooperative = {
  id: string;
  name: string;
  region?: string;
  description?: string;
  products?: string[];
  certifications?: string[];
  farmsCount?: number;
  establishedYear?: number;
  exportReadiness?: "low" | "medium" | "high";
  targetMarkets?: string[];
  contactEmail?: string;
};

async function fetchSampleCoops(): Promise<Cooperative[]> {
  const res = await fetch("/mock/sample-coops.json", {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    throw new Error("Failed to load sample cooperatives.");
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];

  return data.filter(Boolean) as Cooperative[];
}

export function Cooperatives() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["cooperatives", "sample"],
    queryFn: fetchSampleCoops,
    enabled: env.enableMocks
  });

  const coops = useMemo(() => data ?? [], [data]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const c of coops) {
      if (c.region) set.add(c.region);
    }
    return ["all", ...Array.from(set).sort()];
  }, [coops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return coops.filter((c) => {
      const matchesRegion =
        regionFilter === "all" ||
        (c.region ?? "").toLowerCase() === regionFilter.toLowerCase();

      const matchesReadiness =
        readinessFilter === "all" ||
        (c.exportReadiness ?? "medium") === readinessFilter;

      if (!q) return matchesRegion && matchesReadiness;

      const hay = [
        c.id,
        c.name,
        c.region,
        c.description,
        ...(c.products ?? []),
        ...(c.certifications ?? []),
        ...(c.targetMarkets ?? [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesRegion && matchesReadiness && hay.includes(q);
    });
  }, [coops, query, regionFilter, readinessFilter]);

  const canCreate = user?.role !== "buyer";

  return (
    <div className="coops-page">
      <header className="coops-head">
        <div>
          <p className="dash-kicker">Traceability</p>
          <h1 className="dash-title">Cooperatives</h1>
          <p className="muted coops-subtitle">
            Explore supplier profiles, product coverage, and claimed standards
            designed for an export-ready narrative.
          </p>
        </div>

        <div className="coops-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>

          <button
            type="button"
            className="btn btn--primary"
            disabled={!canCreate}
            title={
              canCreate
                ? "Cooperative creation UI is planned for the next iteration."
                : "Buyers cannot create cooperatives."
            }
            onClick={() => {
              // eslint-disable-next-line no-alert
              alert("Cooperative creation UI is planned for the next iteration.");
            }}
          >
            Create cooperative (MVP)
          </button>
        </div>
      </header>

      <section className="coops-filters card card--soft">
        <div className="coops-filters__row">
          <label className="coops-label">
            Search
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, region, products, markets…"
            />
          </label>

          <label className="coops-label">
            Region
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "All regions" : r}
                </option>
              ))}
            </select>
          </label>

          <label className="coops-label">
            Export readiness
            <select
              value={readinessFilter}
              onChange={(e) => setReadinessFilter(e.target.value)}
            >
              <option value="all">All levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="coops-meta">
            <div className="coops-meta__item">
              <span className="coops-meta__label">Source</span>
              <span className="coops-meta__value">
                {env.enableMocks ? "Mock dataset" : "API"}
              </span>
            </div>
            <div className="coops-meta__item">
              <span className="coops-meta__label">Total</span>
              <span className="coops-meta__value">{coops.length}</span>
            </div>
            <div className="coops-meta__item">
              <span className="coops-meta__label">Filtered</span>
              <span className="coops-meta__value">{filtered.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="coops-table card">
        {isLoading && (
          <div className="coops-state">
            <p>Loading cooperatives…</p>
          </div>
        )}

        {isError && (
          <div className="coops-state">
            <p className="muted">
              {(error as Error)?.message ?? "Something went wrong."}
            </p>
            <button type="button" className="btn btn--ghost" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="coops-state">
            <p className="muted">No cooperatives match your filters.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Coop ID</th>
                <th>Cooperative</th>
                <th>Region</th>
                <th>Products</th>
                <th>Claimed standards</th>
                <th>Farms</th>
                <th>Readiness</th>
                <th>Target markets</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <code className="coops-code">{c.id}</code>
                  </td>
                  <td>
                    <div className="coops-name">
                      <span className="coops-name__primary">{c.name}</span>
                      {c.establishedYear && (
                        <span className="muted coops-name__secondary">
                          Est. {c.establishedYear}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{c.region ?? "—"}</td>
                  <td>
                    {c.products && c.products.length > 0 ? (
                      <div className="coops-chips">
                        {c.products.slice(0, 4).map((p) => (
                          <span key={`${c.id}-${p}`} className="coops-chip">
                            {p}
                          </span>
                        ))}
                        {c.products.length > 4 && (
                          <span className="coops-chip coops-chip--muted">
                            +{c.products.length - 4}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {c.certifications && c.certifications.length > 0 ? (
                      <div className="coops-chips">
                        {c.certifications.slice(0, 3).map((s) => (
                          <span key={`${c.id}-${s}`} className="coops-chip">
                            {s}
                          </span>
                        ))}
                        {c.certifications.length > 3 && (
                          <span className="coops-chip coops-chip--muted">
                            +{c.certifications.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{typeof c.farmsCount === "number" ? c.farmsCount : "—"}</td>
                  <td>
                    <span className={`coops-pill coops-pill--${c.exportReadiness ?? "medium"}`}>
                      {(c.exportReadiness ?? "medium").toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {c.targetMarkets && c.targetMarkets.length > 0 ? (
                      <span className="muted">
                        {c.targetMarkets.slice(0, 3).join(", ")}
                        {c.targetMarkets.length > 3 ? "…" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="coops-actions-cell">
                    <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--ghost coops-open-btn">
                      View lots
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="coops-foot card card--soft">
        <div className="coops-foot__inner">
          <div>
            <div className="coops-foot__label">Trust narrative</div>
            <div className="coops-foot__title">
              Use cooperative profiles to justify why a buyer can trust the lots.
            </div>
            <div className="muted">
              This page pairs naturally with the Passport and escrow flows for a
              complete export storyline.
            </div>
          </div>

          <div className="coops-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.BUYERS} className="btn btn--soft">
              Buyer profiles
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Escrow demo
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .coops-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .coops-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .coops-subtitle{
            margin: 0;
          }

          .coops-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .coops-filters__row{
            display:grid;
            grid-template-columns: 1.1fr 0.6fr 0.6fr 1fr;
            gap: var(--space-4);
            align-items: end;
          }

          .coops-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .coops-meta{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-2);
          }

          .coops-meta__item{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .coops-meta__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .coops-meta__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .coops-table{
            padding: 0;
          }

          .coops-state{
            padding: var(--space-5);
            display:flex;
            align-items: center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .coops-code{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .coops-name{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .coops-name__primary{
            font-weight: var(--fw-medium);
          }

          .coops-name__secondary{
            font-size: var(--fs-1);
          }

          .coops-chips{
            display:flex;
            flex-wrap: wrap;
            gap: var(--space-2);
          }

          .coops-chip{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .coops-chip--muted{
            opacity: 0.8;
          }

          .coops-pill{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            font-weight: var(--fw-semibold);
            letter-spacing: 0.03em;
          }

          .coops-pill--low{
            background: color-mix(in oklab, var(--color-warning) 12%, transparent);
            border-color: color-mix(in oklab, var(--color-warning) 30%, transparent);
          }

          .coops-pill--medium{
            background: color-mix(in oklab, var(--color-info) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-info) 28%, transparent);
          }

          .coops-pill--high{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-success) 28%, transparent);
          }

          .coops-actions-cell{
            width: 1%;
            white-space: nowrap;
          }

          .coops-open-btn{
            height: 32px;
            padding: 0 10px;
          }

          .coops-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .coops-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .coops-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .coops-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1200px){
            .coops-filters__row{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 980px){
            .coops-filters__row{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .coops-meta{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}