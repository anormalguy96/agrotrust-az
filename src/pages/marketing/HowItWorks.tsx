// agrotrust-az/src/pages/marketing/HowItWorks.tsx
import { Seo } from "@/components/Seo";
import { NavLink } from "react-router-dom";
import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * HowItWorks (Marketing)
 *
 * Explains the end-to-end value chain for the MVP:
 * 1) Lot creation
 * 2) Digital Product Passport / QR
 * 3) Buyer verification
 * 4) Escrow with inspection-gated release (demo)
 */
export function HowItWorks() {
  return (
    <>
      <Seo
        title={`How ${BRAND.productName} works`}
        description="A practical, cooperative-first pathway that turns farm-level records into export-grade trust. Built to be simple for producers and reassuring for foreign buyers."
        path="/how-it-works"
      />
      <div className="container">
        <header className="marketing-page-head">
          <p className="marketing-kicker">Process overview</p>
          <h1 className="marketing-title">How {BRAND.productName} works</h1>
          <p className="marketing-subtitle muted">
            A practical, cooperative-first pathway that turns farm-level records
            into export-grade trust. Built to be simple for producers and
            reassuring for foreign buyers.
          </p>
        </header>

        <section className="how-steps">
          <div className="card">
            <div className="how-step__badge">1</div>
            <h3 className="how-step__title">Create a product lot</h3>
            <p className="muted">
              A cooperative logs a harvest batch with essential evidence: harvest
              date, region, declared inputs, and photos. The platform structures
              this data into a consistent export-friendly format.
            </p>
            <ul className="how-list">
              <li>Harvest date and location</li>
              <li>Fertiliser and pesticide declarations</li>
              <li>Basic quality notes and media evidence</li>
            </ul>
          </div>

          <div className="card">
            <div className="how-step__badge">2</div>
            <h3 className="how-step__title">Generate a Digital Product Passport</h3>
            <p className="muted">
              The lot becomes a Digital Product Passport with a QR payload. This
              creates a standard way for buyers to verify origin and freshness
              without relying on informal trust or intermediaries.
            </p>
            <ul className="how-list">
              <li>Passport ID linked to a lot</li>
              <li>QR payload for quick checks</li>
              <li>Clear, readable traceability summary</li>
            </ul>
          </div>

          <div className="card">
            <div className="how-step__badge">3</div>
            <h3 className="how-step__title">Buyer verifies and opens RFQ</h3>
            <p className="muted">
              A foreign procurement manager scans or enters the passport ID to
              confirm traceability completeness. If aligned with requirements,
              they can proceed to request pricing, volume, and delivery terms.
            </p>
            <ul className="how-list">
              <li>Instant QR verification view</li>
              <li>Export-readiness signals</li>
              <li>Foundation for RFQs and contracts</li>
            </ul>
          </div>

          <div className="card">
            <div className="how-step__badge">4</div>
            <h3 className="how-step__title">Escrow protects both sides</h3>
            <p className="muted">
              The buyer deposits funds into escrow. In the MVP, funds are released
              after a simulated border inspection outcome. This demonstrates how
              trust can be engineered in a low-trust environment.
            </p>
            <ul className="how-list">
              <li>Funds held pending inspection</li>
              <li>Release on pass, hold on fail</li>
              <li>Transparent status timeline</li>
            </ul>
          </div>
        </section>

        <section className="how-demo card card--soft">
          <div className="how-demo__content">
            <h2>Try the demo flow</h2>
            <p className="muted">
              Use the dashboard to explore sample lots and experience the Digital
              Product Passport and escrow simulation. This is designed to be
              hackathon-ready, fast to understand, and easy to present.
            </p>
            <div className="how-demo__actions">
              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
                Create a cooperative account
              </NavLink>
              <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
                Open demo dashboard
              </NavLink>
            </div>
          </div>

          <div className="how-demo__aside">
            <div className="how-mini">
              <div className="how-mini__label">MVP emphasis</div>
              <div className="how-mini__value">Traceability realism</div>
              <div className="muted">
                Enough structure to feel credible to judges without overbuilding.
              </div>
            </div>
            <div className="how-mini">
              <div className="how-mini__label">Buyer trust</div>
              <div className="how-mini__value">QR + inspection logic</div>
              <div className="muted">
                Clear logic that supports direct export and reduces risk.
              </div>
            </div>
          </div>
        </section>

        {/* Page-scoped styles for speed */}
        <style>
          {`
            .marketing-page-head{
              max-width: 820px;
              margin-bottom: var(--space-6);
            }
            .marketing-kicker{
              margin: 0 0 var(--space-2);
              font-size: var(--fs-1);
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--color-text-soft);
            }
            .marketing-title{
              margin: 0 0 var(--space-2);
              font-size: var(--fs-7);
              line-height: var(--lh-tight);
            }
            .marketing-subtitle{
              margin: 0;
              font-size: var(--fs-4);
            }

            .how-steps{
              display:grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: var(--space-4);
            }
            .how-step__badge{
              width: 28px;
              height: 28px;
              border-radius: var(--radius-pill);
              display:inline-flex;
              align-items:center;
              justify-content:center;
              font-size: var(--fs-1);
              font-weight: var(--fw-semibold);
              background: color-mix(in oklab, var(--color-primary) 14%, transparent);
              color: var(--color-primary);
              border: 1px solid color-mix(in oklab, var(--color-primary) 30%, transparent);
              margin-bottom: var(--space-2);
            }
            .how-step__title{
              margin: 0 0 var(--space-2);
            }
            .how-list{
              margin: 0;
              padding-left: 1.1rem;
              display:flex;
              flex-direction: column;
              gap: var(--space-2);
              font-size: var(--fs-2);
              color: var(--color-text-muted);
            }

            .how-demo{
              margin-top: var(--space-7);
              display:grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: var(--space-5);
              align-items: start;
            }
            .how-demo__actions{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
              margin-top: var(--space-3);
            }
            .how-demo__aside{
              display:flex;
              flex-direction: column;
              gap: var(--space-3);
            }
            .how-mini{
              background: var(--color-elevated);
              border: var(--border-1);
              border-radius: var(--radius-2);
              padding: var(--space-4);
              box-shadow: var(--shadow-1);
            }
            .how-mini__label{
              font-size: var(--fs-1);
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--color-text-soft);
            }
            .how-mini__value{
              font-size: var(--fs-4);
              font-weight: var(--fw-semibold);
              margin: var(--space-1) 0 var(--space-2);
            }

            @media (max-width: 980px){
              .how-steps{
                grid-template-columns: 1fr;
              }
              .how-demo{
                grid-template-columns: 1fr;
              }
            }
          `}
        </style>
      </div>
    </>
  );
}
