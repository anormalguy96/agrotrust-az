// agrotrust-az/src/pages/dashboard/Analytics.tsx

import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { env } from "@/app/config/env";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type UserRole = "buyer" | "cooperative" | "admin" | string;

type UserAnalytics = {
  userId: string;
  email?: string;
  name?: string;
  role?: UserRole;

  totalLots?: number;
  totalPassports?: number;
  totalRFQs?: number;
  openContracts?: number;
  closedContracts?: number;

  lastActiveAt?: string | null;
};

type AnalyticsSummary = {
  totalUsers: number;
  totalCooperatives: number;
  totalBuyers: number;
  totalAdmins: number;

  totalLots: number;
  totalPassports: number;
  totalRFQs: number;
  totalContracts: number;
};

type AnalyticsApiResponse =
  | {
      summary?: Partial<AnalyticsSummary>;
      users?: UserAnalytics[];
    }
  | UserAnalytics[];

// ---- Backend fetch ----

async function fetchAnalytics(): Promise<{
  summary: AnalyticsSummary;
  users: UserAnalytics[];
}> {
  const res = await fetch("/.netlify/functions/analytics", {
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Failed to load analytics.");
  }

  const raw = (await res.json()) as AnalyticsApiResponse;

  const users: UserAnalytics[] = Array.isArray(raw)
    ? raw
    : raw.users ?? [];

  // Compute fallback summary from users
  const computed: AnalyticsSummary = users.reduce<AnalyticsSummary>(
    (acc, u) => {
      acc.totalUsers += 1;

      const role = (u.role ?? "").toLowerCase();
      if (role === "cooperative" || role === "farmer") {
        acc.totalCooperatives += 1;
      } else if (role === "buyer") {
        acc.totalBuyers += 1;
      } else if (role === "admin") {
        acc.totalAdmins += 1;
      }

      acc.totalLots += u.totalLots ?? 0;
      acc.totalPassports += u.totalPassports ?? 0;
      acc.totalRFQs += u.totalRFQs ?? 0;

      const open = u.openContracts ?? 0;
      const closed = u.closedContracts ?? 0;
      acc.totalContracts += open + closed;

      return acc;
    },
    {
      totalUsers: 0,
      totalCooperatives: 0,
      totalBuyers: 0,
      totalAdmins: 0,
      totalLots: 0,
      totalPassports: 0,
      totalRFQs: 0,
      totalContracts: 0
    }
  );

  // If backend also provides a summary, merge it over the computed one
  if (!Array.isArray(raw) && raw.summary) {
    const s = raw.summary;
    return {
      summary: {
        ...computed,
        ...s,
        totalUsers: s.totalUsers ?? computed.totalUsers,
        totalCooperatives: s.totalCooperatives ?? computed.totalCooperatives,
        totalBuyers: s.totalBuyers ?? computed.totalBuyers,
        totalAdmins: s.totalAdmins ?? computed.totalAdmins,
        totalLots: s.totalLots ?? computed.totalLots,
        totalPassports: s.totalPassports ?? computed.totalPassports,
        totalRFQs: s.totalRFQs ?? computed.totalRFQs,
        totalContracts: s.totalContracts ?? computed.totalContracts
      },
      users
    };
  }

  return { summary: computed, users };
}

// ---- Helpers ----

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatRole(role?: UserRole): string {
  if (!role) return "Unknown";
  const r = role.toLowerCase();
  if (r === "cooperative" || r === "farmer") return "Cooperative";
  if (r === "buyer") return "Buyer";
  if (r === "admin") return "Admin";
  return role;
}

// ---- Component ----

export function Analytics() {
  const { user, getRoleLabel } = useAuth();

  const [roleFilter, setRoleFilter] = useState<"all" | "buyer" | "cooperative" | "admin">("all");
  const [query, setQuery] = useState("");

  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics
  });

  const users = analyticsQuery.data?.users ?? [];
  const summary = analyticsQuery.data?.summary;

  const maxActivity = useMemo(() => {
    let max = 0;
    for (const u of users) {
      const score =
        (u.totalLots ?? 0) +
        (u.totalRFQs ?? 0) +
        (u.totalPassports ?? 0) +
        (u.openContracts ?? 0) +
        (u.closedContracts ?? 0);
      if (score > max) max = score;
    }
    return max || 1;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((u) => {
      if (roleFilter !== "all") {
        const role = (u.role ?? "").toLowerCase();
        if (roleFilter === "cooperative") {
          if (!(role === "cooperative" || role === "farmer")) return false;
        } else if (role !== roleFilter) {
          return false;
        }
      }

      if (!q) return true;

      const hay = [
        u.name,
        u.email,
        u.role,
        String(u.userId)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [users, roleFilter, query]);

  return (
    <div className="analytics-page">
      <header className="analytics-head">
        <div>
          <p className="dash-kicker">Insights</p>
          <h1 className="dash-title">Platform analytics</h1>
          <p className="muted analytics-subtitle">
            Activity across cooperatives, buyers, and admins – lots, passports, RFQs and contracts,
            per account.
          </p>
          <p className="muted analytics-subtitle">
            Signed in as <strong>{getRoleLabel(user?.role)}</strong>
            {user?.email ? <> • {user.email}</> : null}.
          </p>
        </div>

        <div className="analytics-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
        </div>
      </header>

      <section className="analytics-summary card card--soft">
        {analyticsQuery.isLoading && (
          <div className="analytics-state">
            <p>Loading analytics…</p>
          </div>
        )}

        {analyticsQuery.isError && (
          <div className="analytics-state">
            <p className="muted">
              {(analyticsQuery.error as Error)?.message ?? "Failed to load analytics."}
            </p>
          </div>
        )}

        {!analyticsQuery.isLoading && !analyticsQuery.isError && summary && (
          <div className="analytics-summary-grid">
            <SummaryCard
              label="Total users"
              value={summary.totalUsers}
              hint={`${summary.totalCooperatives} coops • ${summary.totalBuyers} buyers • ${summary.totalAdmins} admins`}
            />
            <SummaryCard
              label="Lots & passports"
              value={summary.totalLots}
              hint={`${summary.totalPassports} passports`}
            />
            <SummaryCard
              label="RFQs"
              value={summary.totalRFQs}
              hint="Requests for quotation created"
            />
            <SummaryCard
              label="Contracts"
              value={summary.totalContracts}
              hint="Open + closed escrow contracts"
            />
          </div>
        )}
      </section>

      <section className="analytics-filters card card--soft">
        <div className="analytics-filters__row">
          <label className="analytics-label">
            Search users
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, email, role…"
            />
          </label>

          <label className="analytics-label">
            Role
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | "buyer" | "cooperative" | "admin")
              }
            >
              <option value="all">All roles</option>
              <option value="cooperative">Cooperatives</option>
              <option value="buyer">Buyers</option>
              <option value="admin">Admins</option>
            </select>
          </label>

          <div className="analytics-meta">
            <div className="analytics-meta__item">
              <span className="analytics-meta__label">Users</span>
              <span className="analytics-meta__value">{users.length}</span>
            </div>
            <div className="analytics-meta__item">
              <span className="analytics-meta__label">Filtered</span>
              <span className="analytics-meta__value">{filteredUsers.length}</span>
            </div>
            <div className="analytics-meta__item">
              <span className="analytics-meta__label">Env</span>
              <span className="analytics-meta__value">
                {env.enableMocks ? "Mocks on" : "Live"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-table card">
        {analyticsQuery.isLoading && (
          <div className="analytics-state">
            <p>Loading users…</p>
          </div>
        )}

        {!analyticsQuery.isLoading && filteredUsers.length === 0 && (
          <div className="analytics-state">
            <p className="muted">No users match your filters.</p>
          </div>
        )}

        {!analyticsQuery.isLoading && filteredUsers.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Lots</th>
                <th>Passports</th>
                <th>RFQs</th>
                <th>Contracts</th>
                <th>Last active</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const lots = u.totalLots ?? 0;
                const passports = u.totalPassports ?? 0;
                const rfqs = u.totalRFQs ?? 0;
                const open = u.openContracts ?? 0;
                const closed = u.closedContracts ?? 0;
                const contractsTotal = open + closed;

                const activityScore =
                  lots + passports + rfqs + open + closed;
                const pct = Math.min(
                  100,
                  Math.round((activityScore / maxActivity) * 100)
                );

                return (
                  <tr key={u.userId}>
                    <td>
                      <div className="analytics-user-cell">
                        <div className="analytics-user-name">
                          {u.name || u.email || u.userId}
                        </div>
                        {u.email && (
                          <div className="analytics-user-email muted">
                            {u.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{formatRole(u.role)}</td>
                    <td>{lots}</td>
                    <td>{passports}</td>
                    <td>{rfqs}</td>
                    <td>
                      {contractsTotal}
                      {open ? (
                        <span className="muted"> ({open} open)</span>
                      ) : null}
                    </td>
                    <td className="muted">{formatDate(u.lastActiveAt)}</td>
                    <td>
                      <div className="analytics-activity-bar">
                        <div
                          className="analytics-activity-bar__fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="analytics-foot card card--soft">
        <div className="analytics-foot__inner">
          <div>
            <div className="analytics-foot__label">How to use this view</div>
            <div className="analytics-foot__title">
              See who is actually using AgroTrust – and how.
            </div>
            <div className="muted">
              Combine this with RFQs, contracts, and passports to tell a clear story:
              active cooperatives, serious buyers, and where admin attention is needed.
            </div>
          </div>

          <div className="analytics-foot__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Lots & Passports
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.RFQS ?? ROUTES.DASHBOARD.OVERVIEW} className="btn btn--soft">
              RFQs
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Contracts
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .analytics-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
            animation: analytics-fade-in 0.3s var(--ease-1);
          }

          .analytics-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .analytics-subtitle{
            margin: 0;
          }

          .analytics-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .analytics-state{
            padding: var(--space-5);
            display:flex;
            align-items:center;
            gap: var(--space-3);
            flex-wrap: wrap;
          }

          .analytics-summary-grid{
            display:grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: var(--space-3);
          }

          .analytics-summary-card{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            background: var(--color-elevated);
            border: var(--border-1);
          }

          .analytics-summary-card__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .analytics-summary-card__value{
            font-size: var(--fs-6);
            font-weight: var(--fw-semibold);
          }

          .analytics-summary-card__hint{
            font-size: var(--fs-1);
            margin-top: 2px;
            color: var(--color-text-muted);
          }

          .analytics-filters__row{
            display:grid;
            grid-template-columns: 1.2fr 0.5fr 1fr;
            gap: var(--space-4);
            align-items: end;
          }

          .analytics-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .analytics-meta{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-2);
          }

          .analytics-meta__item{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .analytics-meta__label{
            display:block;
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .analytics-meta__value{
            font-size: var(--fs-3);
            font-weight: var(--fw-semibold);
          }

          .analytics-user-cell{
            display:flex;
            flex-direction: column;
            gap: 2px;
          }

          .analytics-user-name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .analytics-user-email{
            font-size: var(--fs-1);
          }

          .analytics-activity-bar{
            position: relative;
            height: 8px;
            border-radius: 999px;
            background: var(--color-surface);
            overflow: hidden;
          }

          .analytics-activity-bar__fill{
            position:absolute;
            inset: 0;
            border-radius: inherit;
            transform-origin: left center;
            background: linear-gradient(
              90deg,
              color-mix(in oklab, var(--color-primary) 85%, transparent),
              color-mix(in oklab, var(--color-success) 75%, transparent)
            );
            transition: width 220ms var(--ease-1);
          }

          .analytics-foot__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .analytics-foot__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .analytics-foot__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .analytics-foot__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @keyframes analytics-fade-in{
            from{
              opacity: 0;
              transform: translateY(4px);
            }
            to{
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 1200px){
            .analytics-summary-grid{
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .analytics-filters__row{
              grid-template-columns: 1fr 1fr;
            }
          }

          @media (max-width: 980px){
            .analytics-summary-grid{
              grid-template-columns: 1fr 1fr;
            }
            .analytics-filters__row{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .analytics-summary-grid{
              grid-template-columns: 1fr;
            }
            .analytics-meta{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  hint?: string;
};

function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div className="analytics-summary-card">
      <div className="analytics-summary-card__label">{label}</div>
      <div className="analytics-summary-card__value">{value}</div>
      {hint && <div className="analytics-summary-card__hint">{hint}</div>}
    </div>
  );
}