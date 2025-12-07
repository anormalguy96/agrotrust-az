// agrotrust-az/src/pages/marketing/ForFarmers.tsx

import { NavLink } from "react-router-dom";
import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * ForFarmers (Marketing)
 *
 * Cooperative / producer-facing value proposition.
 * Keeps language credible and MVP-appropriate.
 */
export function ForFarmers() {
  return (
    <div className="container">
      <header className="marketing-page-head">
        <p className="marketing-kicker">Cooperative-first</p>
        <h1 className="marketing-title">For farmers & cooperatives</h1>
        <p className="marketing-subtitle muted">
          {BRAND.productName} helps you present your produce with export-level
          clarity. The goal is to reduce dependence on middlemen by providing
          a clean traceability story and a trustful payment pathway.
        </p>
      </header>

      <section className="farmers-hero card card--soft">
        <div className="farmers-hero__content">
          <h2>Turn harvest data into export trust</h2>
          <p className="muted">
            You already keep records in some form. We structure the essentials
            into a lot-based model that buyers can understand quickly, with a
            Digital Product Passport that backs your claims with evidence.
          </p>

          <div className="farmers-hero__actions">
            <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
              Create cooperative account
            </NavLink>
            <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
              View the full flow
            </NavLink>
          </div>

          <div className="farmers-pill-row">
            <span className="farmers-pill">Lot-level traceability</span>
            <span className="farmers-pill">QR product passport</span>
            <span className="farmers-pill">Export readiness signals</span>
            <span className="farmers-pill">Escrow trust layer</span>
          </div>
        </div>

        <div className="farmers-hero__aside">
          <div className="farmers-stat">
            <div className="farmers-stat__label">MVP products</div>
            <div className="farmers-stat__value">
              Tomatoes • Hazelnuts • Persimmons
            </div>
            <div className="muted">
              High-visibility categories for rapid proof of value.
            </div>
          </div>

          <div className="farmers-stat">
            <div className="farmers-stat__label">Buyer expectation</div>
            <div className="farmers-stat__value">Traceability evidence</div>
            <div className="muted">
              Presented in a consistent format that reduces negotiation friction.
            </div>
          </div>
        </div>
      </section>

      <section className="farmers-grid">
        <div className="card">
          <h3>Simple lot creation</h3>
          <p className="muted">
            Record harvest date, region, declared inputs, and photos. The MVP is
            deliberately lightweight so smaller cooperatives can adopt it quickly.
          </p>
          <ul className="farmers-list">
            <li>Standardised fields for export lots</li>
            <li>Easy evidence attachment</li>
            <li>Clear “claimed vs verified” distinction</li>
          </ul>
        </div>

        <div className="card">
          <h3>Digital Product Passport</h3>
          <p className="muted">
            Your lot generates a QR payload that explains origin, freshness
            window, and quality claims without back-and-forth messaging.
          </p>
          <ul className="farmers-list">
            <li>Buyer-friendly summary</li>
            <li>Faster trust-building</li>
            <li>Foundation for scalable certification</li>
          </ul>
        </div>

        <div className="card">
          <h3>Fairer route to payment</h3>
          <p className="muted">
            The escrow demonstration shows a clean principle: funds are released
            when the cargo passes inspection. This can reduce risk for both sides.
          </p>
          <ul className="farmers-list">
            <li>Reduced payment uncertainty</li>
            <li>Stronger bargaining position</li>
            <li>Less reliance on intermediaries</li>
          </ul>
        </div>
      </section>

      <section className="farmers-steps">
        <h2 className="farmers-steps__title">A practical adoption path</h2>
        <div className="farmers-steps__grid">
          <div className="card card--soft">
            <div className="step-badge">1</div>
            <h4>Start with one export lot</h4>
            <p className="muted">
              Choose a high-demand product and capture the minimum evidence set
              to demonstrate consistency.
            </p>
          </div>
          <div className="card card--soft">
            <div className="step-badge">2</div>
            <h4>Generate your passport</h4>
            <p className="muted">
              Share QR verification with prospective buyers to reduce trust
              barriers early.
            </p>
          </div>
          <div className="card card--soft">
            <div className="step-badge">3</div>
            <h4>Scale your cooperative profile</h4>
            <p className="muted">
              Add more farms and seasonal lots once your documentation pattern
              is stable.
            </p>
          </div>
          <div className="card card--soft">
            <div className="step-badge">4</div>
            <h4>Upgrade certifications</h4>
            <p className="muted">
              The platform structure is designed to support future third-party
              verification without rewriting your records.
            </p>
          </div>
        </div>
      </section>

      <section className="farmers-cta">
        <div className="card">
          <h2>Demonstrate export readiness today</h2>
          <p className="muted">
            Use the demo dashboard to explore sample lots and see how the
            Passport and escrow flow can represent your cooperative to
            international buyers.
          </p>
          <div className="farmers-cta__actions">
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

          .farmers-hero{
            display:grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: var(--space-5);
            align-items: start;
            margin-bottom: var(--space-7);
          }
          .farmers-hero__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-3);
            margin-bottom: var(--space-3);
          }
          .farmers-pill-row{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }
          .farmers-pill{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            background: var(--color-surface);
            border: var(--border-1);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .farmers-hero__aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }
          .farmers-stat{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-2);
            padding: var(--space-4);
            box-shadow: var(--shadow-1);
          }
          .farmers-stat__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }
          .farmers-stat__value{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
            margin: var(--space-1) 0 var(--space-2);
          }

          .farmers-grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-4);
          }
          .farmers-list{
            margin: var(--space-3) 0 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .farmers-steps{
            margin-top: var(--space-7);
          }
          .farmers-steps__title{
            margin: 0 0 var(--space-4);
            font-size: var(--fs-6);
          }
          .farmers-steps__grid{
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

          .farmers-cta{
            margin-top: var(--space-7);
          }
          .farmers-cta__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-3);
          }

          @media (max-width: 1100px){
            .farmers-steps__grid{
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 980px){
            .farmers-hero{
              grid-template-columns: 1fr;
            }
            .farmers-grid{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 520px){
            .farmers-steps__grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}
