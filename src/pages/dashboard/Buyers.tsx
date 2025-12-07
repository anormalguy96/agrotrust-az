// agrotrust-az/src/pages/dashboard/Buyers.tsx

import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Buyers (Dashboard)
 *
 * Hackathon MVP:
 * - Loads sample buyers from /public/mock/sample-buyers.json
 * - Light search and filtering
 * - Role-aware CTA (buyers can view, not "create" in MVP)
 */

type Buyer = {
  id: string;
  name: string;
  country?: string;
  city?: string;
  type?: "wholesaler" | "retailer" | "processor" | "importer" | "other";
  procurementFocus?: string[];
  preferredCertifications?: string[];
  minOrderKg?: number;
  targetMarkets?: string[];
  notes?: string;
  contactEmail?: string;
  riskProfile?: "low" | "medium" | "high";
};

async function fetchSampleBuyers(): Promise<Buyer[]> {
  const res = await fetch("/mock/sample-buyers.json", {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    throw new Error("Failed to load sample buyers.");
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.filter(Boolean) as Buyer[];
}

function buyerTypeLabel(t?: Buyer["type"]) {
  switch (t) {
    case "wholesaler":
      return "Wholesaler";
    case "retailer":
      return "Retail chain";
    case "processor":
      return "Processor";
    case "importer":
      return "Importer";
    default:
      return "Other";
  }
}

export function Buyers() {
  const { user } = useAuth();

  const [query, setQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<Buyer["type"] | "all">("all");
  const [riskFilter, setRiskFilter] = useState<Buyer["riskProfile"] | "all">("all");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["buyers", "sample"],
    queryFn: fetchSampleBuyers,
    enabled: env.enableMocks
  });

  const buyers = useMemo(() => data ?? [], [data]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const b of buyers) {
      if (b.country) set.add(b.country);
    }
    return ["all", ...Array.from(set).sort()];
  }, [buyers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return buyers.filter((b) => {
      const matchesCountry =
        countryFilter === "all" ||
        (b.country ?? "").toLowerCase() === countryFilter.toLowerCase();

      const matchesType = typeFilter === "all" || (b.type ?? "other") === typeFilter;

      const matchesRisk =
        riskFilter === "all" || (b.riskProfile ?? "medium") === riskFilter;

      if (!q) return matchesCountry && matchesType && matchesRisk;

      const hay = [
        b.id,
        b.name,
        b.country,
        b.city,
        buyerTypeLabel(b.type),
        ...(b.procurementFocus ?? []),
        ...(b.preferredCertifications ?? []),
        ...(b.targetMarkets ?? []),
        b.notes
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCountry && matchesType && matchesRisk && hay.includes(q);
    });
  }, [buyers, query, countryFilter, typeFilter, riskFilter]);

  // In this MVP, we treat buyer creation as out-of-scope.
  // But we still provide a role-aware button.
  const canAttemptCreate = user?.role === "admin";

  return (
    <div className="buyers-page">
      <header className="buyers-head">
        <div>
          <p className="dash-kicker">Market access</p>
          <h1 className="dash-title">Buyer profiles</h1>
          <p className="muted buyers-subtitle">
            Review procurement expectations, preferred standards, and risk
            appetite to support a credible export matching narrative.
          </p>
        </div>

        <div className="buyers-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>

          <button
            type="button"
            className="btn btn--primary"
            disabled={!canAttemptCreate}
            title={
              canAttemptCreate
                ? "Buyer creation UI is planned for the next iteration."
                : "Only admins can add buyer profiles in the MVP."
            }
            onClick={() => {
              // eslint-disable-next-line no-alert
              alert("Buyer creation UI is planned for the next iteration.");
            }}
          >
            Add buyer (MVP)
          </button>
        </div>
      </header>

      <section className="buyers-filters card card--soft">
        <div className="buyers-filters__row">
          <label className="buyers-label">
            Search
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Company, country, products, standards…"
            />
          </label>

          <label className="buyers-label">
            Country
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All countries" : c}
                </option>
              ))}
            </select>
          </label>

          <label className="buyers-label">
            Buyer type
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as Buyer["type"] | "all")}
            >
              <option value="all">All types</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="retailer">Retail chain</option>
              <option value="processor">Processor</option>
              <option value="importer">Importer</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label className="buyers-label">
            Risk profile
            <select
              value={riskFilter}
              onChange={(e) =>
                setRiskFilter(e.target.value as Buyer["riskProfile"] | "all")
              }
            >
              <option value="all">All levels</option>
              <option value="low">Low risk tolerance</option>
              <option value="medium">Balanced</option>
              <option value="high">High risk tolerance</option>
            </select>
          </label>

          <div className="buyers-meta">
            <div className="buyers-meta__item">
              <span className="buyers-meta__label">Source</span>
              <span className="buyers-meta__value">
                {env.enableMocks ? "Mock dataset" : "API"}
              </span>
            </div>
            <div className="buyers-meta__item">
              <span className="buyers-meta__label">Total</span>
              <span className="buyers-meta__value">{buyers.length}</span>
            </div>
            <div className="buyers-meta__item">
              <span className="buyers-meta__label">Filtered</span>
              <span className="buyers-meta__value">{filtered.length}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="buyers-table card">
        {isLoading && (
          <div className="buyers-state">
            <p>Loading buyers…</p>
          </div>
        )}

        {isError && (
          <div className="buyers-state">
            <p className="muted">
              {(error as Error)?.message ?? "Something went wrong."}
            </p>
            <button type="button" className="btn btn--ghost" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="buyers-state">
            <p className="muted">No buyers match your filters.</p>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Buyer ID</th>
                <th>Company</th>
                <th>Country</th>
                <th>Type</th>
                <th>Procurement focus</th>
                <th>Preferred standards</th>
                <th>Min order</th>
                <th>Risk profile</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <code className="buyers-code">{b.id}</code>
                  </td>
                  <td>
                    <div className="buyers-name">
                      <span className="buyers-name__primary">{b.name}</span>
                      {(b.city || b.country) && (
                        <span className="muted buyers-name__secondary">
                          {[b.city, b.country].filter(Boolean).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{b.country ?? "—"}</td>
                  <td>{buyerTypeLabel(b.type)}</td>
                  <td>
                    {b.procurementFocus?.length ? (
                      <div className="buyers-chips">
                        {b.procurementFocus.slice(0, 3).map((p) => (
                          <span key={`${b.id}-${p}`} className="buyers-chip">
                            {p}
                          </span>
                        ))}
                        {b.procurementFocus.length > 3 && (
                          <span className="buyers-chip buyers-chip--muted">
                            +{b.procurementFocus.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {b.preferredCertifications?.length ? (
                      <div className="buyers-chips">
                        {b.preferredCertifications.slice(0, 3).map((s) => (
                          <span key={`${b.id}-${s}`} className="buyers-chip">
                            {s}
                          </span>
                        ))}
                        {b.preferredCertifications.length > 3 && (
                          <span className="buyers-chip buyers-chip--muted">
                            +{b.preferredCertifications.length - 3}
                          </span>
                        )}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {typeof b.minOrderKg === "number" ? `${b.minOrderKg} kg` : "—"}
                  </td>
                  <td>
                    <span className={`buyers-pill buyers-pill--${b.riskProfile ?? "medium"}`}>
                      {(b.riskProfile ?? "medium").toUpperCase()}
                    </span>
                  </td>
                  <td className="buyers-actions-cell">
                    <NavLink to={ROUTES.DASHBOARD.RFQS} className="btn btn--ghost buyers-open-btn">
                      Open RFQs
                    </NavLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="buyers-foot card card--soft">
        <div className="buyers-foot__inner">
          <div>
            <div className="buyers-foot__label">Matching storyline</div>
            <div className="buyers-foot__title">
              Bridge buyer expectations with cooperative Passports.
            </div>
            <div className="muted">
              Use this page to explain why structured lot evidence and escrow
              logic are valuable for first-time cross-border deals.
            </div>
          </div>

          <div className="buyers-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              View lots
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Escrow demo
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .buyers-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .buyers-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .buyers-subtitle{
            margin: 0;
          }

          .buyers-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .buyers-filters__row{
            display:grid;
            grid-template-columns: 1.1fr 0.6fr 0.6fr 0.6fr 1fr;
            gap: var(--space-4);
            align-items: end;
          }

          .buyers-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .buyers-meta{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-2);
          }

          .buyers-meta__item{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .buyers-meta__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .buyers-meta__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .buyers-table{
            padding: 0;
          }

          .buyers-state{
            padding: var(--space-5);
            display:flex;
            align-items: center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .buyers-code{
            font-family: var(--font-mono);
            font-size: var(--fs-1);
          }

          .buyers-name{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .buyers-name__primary{
            font-weight: var(--fw-medium);
          }

          .buyers-name__secondary{
            font-size: var(--fs-1);
          }

          .buyers-chips{
            display:flex;
            flex-wrap: wrap;
            gap: var(--space-2);
          }

          .buyers-chip{
            display:inline-flex;
            align-items:center;
            padding: 3px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .buyers-chip--muted{
            opacity: 0.8;
          }

          .buyers-pill{
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

          .buyers-pill--low{
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-success) 28%, transparent);
          }

          .buyers-pill--medium{
            background: color-mix(in oklab, var(--color-info) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-info) 28%, transparent);
          }

          .buyers-pill--high{
            background: color-mix(in oklab, var(--color-warning) 12%, transparent);
            border-color: color-mix(in oklab, var(--color-warning) 30%, transparent);
          }

          .buyers-actions-cell{
            width: 1%;
            white-space: nowrap;
          }

          .buyers-open-btn{
            height: 32px;
            padding: 0 10px;
          }

          .buyers-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .buyers-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .buyers-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .buyers-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1250px){
            .buyers-filters__row{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 980px){
            .buyers-filters__row{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .buyers-meta{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}