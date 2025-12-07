// agrotrust-az/src/pages/marketing/Standards.tsx

import { NavLink } from "react-router-dom";
import { BRAND, CERTIFICATION_CLAIMS } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * Standards (Marketing)
 *
 * A clear, judge-friendly explanation of the certification/traceability layer.
 * We keep claims careful for an MVP: "supports", "aligns with", "helps prepare".
 */
export function Standards() {
  return (
    <div className="container">
      <header className="marketing-page-head">
        <p className="marketing-kicker">Quality & compliance</p>
        <h1 className="marketing-title">Standards we support</h1>
        <p className="marketing-subtitle muted">
          {BRAND.productName} is designed to help cooperatives capture the right
          evidence early, using familiar quality practices while preparing for
          modern export expectations. The MVP demonstrates the structure; real
          verification can be layered in with accredited partners.
        </p>
      </header>

      <section className="standards-grid">
        <div className="card">
          <h3>GlobalG.A.P readiness</h3>
          <p className="muted">
            Many large retailers and Gulf-based importers expect consistent farm
            records. Our lot model encourages disciplined logging of harvest
            dates, input declarations, and batch-level evidence.
          </p>
          <ul className="standards-list">
            <li>Farm and lot identity</li>
            <li>Input usage declarations</li>
            <li>Traceability continuity</li>
          </ul>
        </div>

        <div className="card">
          <h3>Organic claims (structured)</h3>
          <p className="muted">
            The platform allows cooperatives to declare organic practices and
            attach supporting evidence. In the MVP, we separate{" "}
            <strong>claimed</strong> from <strong>verified</strong> to keep the
            trust model honest and transparent.
          </p>
          <ul className="standards-list">
            <li>Clear “claimed vs verified” distinction</li>
            <li>Evidence attachments per lot</li>
            <li>Audit-ready trail for upgrades</li>
          </ul>
        </div>

        <div className="card">
          <h3>Food safety alignment</h3>
          <p className="muted">
            Export buyers care about repeatable processes. We utilise a simple
            checklist-driven approach that can later be mapped to HACCP-adjacent
            documentation and third-party audits.
          </p>
          <ul className="standards-list">
            <li>Process consistency per cooperative</li>
            <li>Basic storage and handling notes</li>
            <li>Expandable to formal audits</li>
          </ul>
        </div>
      </section>

      <section className="standards-ledger card card--soft">
        <div className="standards-ledger__content">
          <h2>Digital Product Passport approach</h2>
          <p className="muted">
            The Passport is our practical bridge between traditional farm record
            keeping and contemporary buyer expectations. Each lot can generate a
            QR payload that presents origin, harvest window, declared inputs,
            and certification claims in a buyer-friendly format.
          </p>

          <div className="standards-ledger__bullets">
            <div className="standards-bullet">
              <div className="standards-bullet__title">Standardised fields</div>
              <div className="muted">
                A consistent template reduces confusion for foreign procurement
                teams.
              </div>
            </div>
            <div className="standards-bullet">
              <div className="standards-bullet__title">Audit-friendly trail</div>
              <div className="muted">
                Evidence is tied to lots rather than vague seasonal claims.
              </div>
            </div>
            <div className="standards-bullet">
              <div className="standards-bullet__title">Trust by design</div>
              <div className="muted">
                The escrow demo shows how documentation and payment confidence
                can advance together.
              </div>
            </div>
          </div>
        </div>

        <div className="standards-ledger__aside">
          <div className="card">
            <div className="aside-label">Supported claim types</div>
            <div className="claim-chips">
              {CERTIFICATION_CLAIMS.map((c) => (
                <span key={c} className="claim-chip">{c}</span>
              ))}
            </div>
            <p className="muted aside-note">
              These are modelled as <strong>claims</strong> in the MVP. Verified
              status is a future integration with accredited auditors and labs.
            </p>
          </div>
        </div>
      </section>

      <section className="standards-cta">
        <div className="card">
          <h2>Choose your path</h2>
          <p className="muted">
            Whether you represent a cooperative preparing lots or a buyer
            screening suppliers, the standards layer is built to be readable,
            practical, and fast to verify.
          </p>
          <div className="standards-cta__actions">
            <NavLink to={ROUTES.FOR_FARMERS} className="btn btn--soft">
              For farmers
            </NavLink>
            <NavLink to={ROUTES.FOR_BUYERS} className="btn btn--soft">
              For buyers
            </NavLink>
            <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
              Create account
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

          .standards-grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-4);
          }

          .standards-list{
            margin: var(--space-3) 0 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          .standards-ledger{
            margin-top: var(--space-7);
            display:grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: var(--space-5);
            align-items: start;
          }

          .standards-ledger__bullets{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-3);
            margin-top: var(--space-4);
          }

          .standards-bullet{
            background: var(--color-elevated);
            border: var(--border-1);
            border-radius: var(--radius-2);
            padding: var(--space-4);
            box-shadow: var(--shadow-1);
          }

          .standards-bullet__title{
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .aside-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: var(--space-2);
          }

          .claim-chips{
            display:flex;
            flex-wrap: wrap;
            gap: var(--space-2);
          }

          .claim-chip{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            background: var(--color-surface);
            border: var(--border-1);
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .aside-note{
            margin-top: var(--space-3);
          }

          .standards-cta{
            margin-top: var(--space-7);
          }

          .standards-cta__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-3);
          }

          @media (max-width: 980px){
            .standards-grid{
              grid-template-columns: 1fr;
            }
            .standards-ledger{
              grid-template-columns: 1fr;
            }
            .standards-ledger__bullets{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}
