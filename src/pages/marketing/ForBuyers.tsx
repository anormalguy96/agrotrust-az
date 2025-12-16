// agrotrust-az/src/pages/marketing/ForBuyers.tsx
import { Seo } from "@/components/Seo";
import { NavLink } from "react-router-dom";
import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * ForBuyers (Marketing)
 *
 * Buyer-facing value proposition.
 * Focus: risk reduction, speed of verification, consistent lot evidence.
 */
export function ForBuyers() {
  return (
    <>
      <Seo
        title={`For buyers & importers | ${BRAND.productName}`}
        description={`${BRAND.productName} helps foreign wholesalers, processors, and supermarket procurement teams evaluate Azerbaijani produce with clearer evidence. The MVP demonstrates digital traceability and an inspection-gated escrow principle for lower-risk trade.`}
        path="/for-buyers"
      />
      <div className="container">
        <header className="marketing-page-head">
          <p className="marketing-kicker">Procurement confidence</p>
          <h1 className="marketing-title">For buyers & importers</h1>
          <p className="marketing-subtitle muted">
            {BRAND.productName} helps foreign wholesalers, processors, and
            supermarket procurement teams evaluate Azerbaijani produce with
            clearer evidence. The MVP demonstrates digital traceability and an
            inspection-gated escrow principle for lower-risk trade.
          </p>
        </header>

        <section className="buyers-hero card card--soft">
          <div className="buyers-hero__content">
            <h2>Verify origin and freshness quickly</h2>
            <p className="muted">
              Instead of relying on informal assurances, you can review lot-based
              records structured into a Digital Product Passport. This approach
              is designed to make first-time supplier decisions faster and more
              defensible.
            </p>

            <div className="buyers-hero__actions">
              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
                Create buyer account
              </NavLink>
              <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
                See the full flow
              </NavLink>
            </div>

            <div className="buyers-pill-row">
              <span className="buyers-pill">QR verification</span>
              <span className="buyers-pill">Lot evidence</span>
              <span className="buyers-pill">Export-readiness signals</span>
              <span className="buyers-pill">Escrow trust model</span>
            </div>
          </div>

          <div className="buyers-hero__aside">
            <div className="buyers-stat">
              <div className="buyers-stat__label">What you see first</div>
              <div className="buyers-stat__value">Passport summary</div>
              <div className="muted">
                Origin, harvest window, declared inputs, and claim visibility in
                one clean view.
              </div>
            </div>

            <div className="buyers-stat">
              <div className="buyers-stat__label">What we reduce</div>
              <div className="buyers-stat__value">Supplier uncertainty</div>
              <div className="muted">
                Clearer batch-level documentation reduces the need for costly
                back-and-forth checks early on.
              </div>
            </div>
          </div>
        </section>

        <section className="buyers-grid">
          <div className="card">
            <h3>Consistent supplier language</h3>
            <p className="muted">
              Cooperatives record data using a standard template. This gives your
              team a familiar structure across different regions and product
              categories.
            </p>
            <ul className="buyers-list">
              <li>Lot identity and harvest clarity</li>
              <li>Input declarations attached to batches</li>
              <li>Readable, comparable supplier profiles</li>
            </ul>
          </div>

          <div className="card">
            <h3>Faster screening and shortlisting</h3>
            <p className="muted">
              The Passport helps you filter suppliers before deep audits. The MVP
              keeps the process honest by separating claimed from verified items.
            </p>
            <ul className="buyers-list">
              <li>Clear trust signals without overpromising</li>
              <li>Evidence-ready path for formal audits</li>
              <li>Reduced procurement friction</li>
            </ul>
          </div>

          <div className="card">
            <h3>Escrow principle for safer trade</h3>
            <p className="muted">
              The hackathon build simulates a simple rule: you deposit funds and
              they are released only when border inspection passes. This is a
              credible model of how trust can be engineered.
            </p>
            <ul className="buyers-list">
              <li>Alignment with inspection outcomes</li>
              <li>Lower first-deal risk</li>
              <li>Improved supplier accountability</li>
            </ul>
          </div>
        </section>

        <section className="buyers-steps">
          <h2 className="buyers-steps__title">A practical procurement path</h2>
          <div className="buyers-steps__grid">
            <div className="card card--soft">
              <div className="step-badge">1</div>
              <h4>Scan or open a Passport</h4>
              <p className="muted">
                Review origin, harvest timing, and lot evidence in a single
                format that supports quick internal approvals.
              </p>
            </div>
            <div className="card card--soft">
              <div className="step-badge">2</div>
              <h4>Check claim clarity</h4>
              <p className="muted">
                The model distinguishes declared claims from verified status,
                reducing misunderstanding in early negotiations.
              </p>
            </div>
            <div className="card card--soft">
              <div className="step-badge">3</div>
              <h4>Open an RFQ</h4>
              <p className="muted">
                Request volume, pricing, and delivery terms for the lots that meet
                your internal thresholds.
              </p>
            </div>
            <div className="card card--soft">
              <div className="step-badge">4</div>
              <h4>Use escrow for first deals</h4>
              <p className="muted">
                The MVP shows how inspection-gated release can be a fair starting
                condition when building new supplier relationships.
              </p>
            </div>
          </div>
        </section>

        <section className="buyers-cta">
          <div className="card">
            <h2>Explore supplier lots in the demo</h2>
            <p className="muted">
              The dashboard includes sample cooperatives and lots to demonstrate
              the Passport and escrow logic with a realistic B2B narrative.
            </p>
            <div className="buyers-cta__actions">
              <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--primary">
                Open demo dashboard
              </NavLink>
              <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
                Sign in
              </NavLink>
            </div>
          </div>
        </section>

        <style>
          {`
            .marketing-page-head{
              max-width: 860px;
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

            .buyers-hero{
              display:grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: var(--space-5);
              align-items: start;
              margin-bottom: var(--space-7);
            }
            .buyers-hero__actions{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
              margin-top: var(--space-3);
              margin-bottom: var(--space-3);
            }
            .buyers-pill-row{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
            }
            .buyers-pill{
              display:inline-flex;
              align-items:center;
              padding: 4px 10px;
              border-radius: var(--radius-pill);
              background: var(--color-surface);
              border: var(--border-1);
              font-size: var(--fs-1);
              color: var(--color-text-muted);
            }

            .buyers-hero__aside{
              display:flex;
              flex-direction: column;
              gap: var(--space-3);
            }
            .buyers-stat{
              background: var(--color-elevated);
              border: var(--border-1);
              border-radius: var(--radius-2);
              padding: var(--space-4);
              box-shadow: var(--shadow-1);
            }
            .buyers-stat__label{
              font-size: var(--fs-1);
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--color-text-soft);
            }
            .buyers-stat__value{
              font-size: var(--fs-4);
              font-weight: var(--fw-semibold);
              margin: var(--space-1) 0 var(--space-2);
            }

            .buyers-grid{
              display:grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: var(--space-4);
            }
            .buyers-list{
              margin: var(--space-3) 0 0;
              padding-left: 1.1rem;
              display:flex;
              flex-direction: column;
              gap: var(--space-2);
              font-size: var(--fs-2);
              color: var(--color-text-muted);
            }

            .buyers-steps{
              margin-top: var(--space-7);
            }
            .buyers-steps__title{
              margin: 0 0 var(--space-4);
              font-size: var(--fs-6);
            }
            .buyers-steps__grid{
              display:grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: var(--space-3);
            }
            .step-badge{
              width: 26px;
              height: 26px;
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

            .buyers-cta{
              margin-top: var(--space-7);
            }
            .buyers-cta__actions{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
              margin-top: var(--space-3);
            }

            @media (max-width: 1100px){
              .buyers-steps__grid{
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }

            @media (max-width: 980px){
              .buyers-hero{
                grid-template-columns: 1fr;
              }
              .buyers-grid{
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 520px){
              .buyers-steps__grid{
                grid-template-columns: 1fr;
              }
            }
          `}
        </style>
      </div>
    </>
  );
}