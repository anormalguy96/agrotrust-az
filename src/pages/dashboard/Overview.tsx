// agrotrust-az/src/pages/dashboard/Overview.tsx

import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Overview (Dashboard)
 *
 * A role-aware landing page for authenticated users.
 * Keeps dependencies minimal for the hackathon MVP.
 */
export function Overview() {
  const { user, getRoleLabel } = useAuth();

  const role = user?.role ?? "coop";
  const roleLabel = getRoleLabel(role);

  const roleHeadline =
    role === "buyer"
      ? "Verify lots fast and reduce first-deal risk."
      : role === "admin"
      ? "Monitor quality narratives and trust flows."
      : "Create lots, generate passports, and prove export readiness.";

  const roleFocus =
    role === "buyer"
      ? [
          "Scan or open a Digital Product Passport",
          "Shortlist suppliers using consistent lot evidence",
          "Use escrow logic to align payment with inspection outcomes"
        ]
      : role === "admin"
      ? [
          "Review claimed vs verified structures",
          "Observe mock escrow event timelines",
          "Support a judge-friendly compliance narrative"
        ]
      : [
          "Register harvest lots with clean evidence",
          "Generate QR-based Digital Product Passports",
          "Prepare for direct export conversations"
        ];

  return (
    <div className="dashboard-page">
      <header className="dash-head">
        <div>
          <p className="dash-kicker">Dashboard</p>
          <h1 className="dash-title">{BRAND.productName}</h1>
          <p className="muted dash-subtitle">
            Signed in as <strong>{roleLabel}</strong>
            {user?.name ? ` • ${user.name}` : ""}.
          </p>
        </div>

        <div className="dash-head__actions">
          <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--primary">
            Open product lots
          </NavLink>
          <NavLink to={ROUTES.STANDARDS} className="btn btn--ghost">
            Standards model
          </NavLink>
        </div>
      </header>

      <section className="dash-hero card card--soft">
        <div className="dash-hero__content">
          <h2>{roleHeadline}</h2>
          <p className="muted">
            This MVP is structured to show how Azerbaijan’s non-oil export
            ecosystem can strengthen trust through traceability, readable
            certification claims, and inspection-gated escrow principles.
          </p>

          <ul className="dash-list">
            {roleFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <div className="dash-hero__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--primary">
              Lots & passports
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.BUYERS} className="btn btn--ghost">
              Buyer view
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--ghost">
              Escrow demo
            </NavLink>
          </div>
        </div>

        <div className="dash-hero__aside">
          <div className="dash-mini">
            <div className="dash-mini__label">MVP scope</div>
            <div className="dash-mini__value">Traceability + escrow</div>
            <div className="muted">
              Focused on a believable, end-to-end export narrative.
            </div>
          </div>

          <div className="dash-mini">
            <div className="dash-mini__label">Sample data</div>
            <div className="dash-mini__value">Coops • Lots • Buyers</div>
            <div className="muted">
              Pre-filled records to support a fast, confident demo.
            </div>
          </div>
        </div>
      </section>

      <section className="dash-grid">
        <NavCard
          title="Product lots"
          subtitle="Create, browse and inspect batch-level records."
          to={ROUTES.DASHBOARD.LOTS}
        />
        <NavCard
          title="Cooperatives"
          subtitle="View supplier capacity and claimed standards."
          to={ROUTES.DASHBOARD.COOPERATIVES}
        />
        <NavCard
          title="Buyers"
          subtitle="Explore procurement profiles and requirements."
          to={ROUTES.DASHBOARD.BUYERS}
        />
        <NavCard
          title="RFQs"
          subtitle="Prototype the request and negotiation pipeline."
          to={ROUTES.DASHBOARD.RFQS}
        />
        <NavCard
          title="Contracts"
          subtitle="See the inspection-gated escrow storyline."
          to={ROUTES.DASHBOARD.CONTRACTS}
        />
        <NavCard
          title="Settings"
          subtitle="Role, preferences, and future integrations."
          to={ROUTES.DASHBOARD.SETTINGS}
        />
      </section>

      <section className="dash-note card">
        <div className="dash-note__inner">
          <div>
            <div className="dash-note__label">Presentation hint</div>
            <div className="dash-note__title">
              Show the two-sided value in under two minutes.
            </div>
            <div className="muted">
              Start with a cooperative lot, generate a Passport, then switch to
              a buyer role and verify it. Finish with the escrow status view.
            </div>
          </div>

          <div className="dash-note__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Start with lots
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Open escrow view
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .dashboard-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .dash-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .dash-kicker{
            margin: 0 0 var(--space-1);
            font-size: var(--fs-1);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .dash-title{
            margin: 0 0 var(--space-1);
            font-size: var(--fs-6);
            line-height: var(--lh-tight);
          }

          .dash-subtitle{
            margin: 0;
            font-size: var(--fs-2);
          }

          .dash-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .dash-hero{
            display:grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: var(--space-5);
            align-items: start;
          }

          .dash-list{
            margin: var(--space-3) 0 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .dash-hero__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-4);
          }

          .dash-hero__aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .dash-mini{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-2);
            padding: var(--space-4);
            box-shadow: var(--shadow-1);
          }

          .dash-mini__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .dash-mini__value{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
            margin: var(--space-1) 0 var(--space-2);
          }

          .dash-grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-4);
          }

          .nav-card{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            transition: border-color var(--duration-2) var(--ease-1),
                        transform var(--duration-1) var(--ease-1);
          }

          .nav-card:hover{
            transform: translateY(-1px);
            border-color: var(--color-border-strong);
            text-decoration: none;
          }

          .nav-card__title{
            margin: 0;
            font-size: var(--fs-4);
          }

          .nav-card__subtitle{
            margin: 0;
          }

          .nav-card__cta{
            margin-top: auto;
            font-size: var(--fs-2);
            font-weight: var(--fw-medium);
            color: var(--color-primary);
          }

          .dash-note__inner{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .dash-note__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: var(--space-1);
          }

          .dash-note__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .dash-note__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1100px){
            .dash-grid{
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 980px){
            .dash-hero{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 620px){
            .dash-grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}

type NavCardProps = {
  title: string;
  subtitle: string;
  to: string;
};

function NavCard({ title, subtitle, to }: NavCardProps) {
  return (
    <NavLink to={to} className="card nav-card">
      <h3 className="nav-card__title">{title}</h3>
      <p className="muted nav-card__subtitle">{subtitle}</p>
      <span className="nav-card__cta">Open</span>
    </NavLink>
  );
}