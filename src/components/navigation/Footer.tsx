// agrotrust-az/src/components/navigation/Footer.tsx

import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * Footer
 *
 * Marketing-first footer used in MarketingLayout.
 * Keeps the hackathon MVP narrative clear:
 * - Traceability
 * - Standards
 * - Export trust
 *
 * Relies on global utility classes from globals.css where available.
 */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Footer() {
  const year = new Date().getFullYear();

  const nav = [
    { label: "Home", to: ROUTES.HOME },
    { label: "How it works", to: ROUTES.HOW_IT_WORKS },
    { label: "Standards", to: ROUTES.STANDARDS },
    { label: "For farmers", to: ROUTES.FOR_FARMERS },
    { label: "For buyers", to: ROUTES.FOR_BUYERS },
    { label: "Contact", to: ROUTES.CONTACT }
  ];

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <div className="footer__brand-mark" aria-hidden="true">
            AT
          </div>
          <div className="footer__brand-text">
            <div className="footer__brand-name">{BRAND.productName}</div>
            <div className="muted footer__brand-sub">
              B2B traceability, certification and escrow for export-ready trust.
            </div>
          </div>
        </div>

        <div className="footer__cols">
          <div className="footer__col">
            <div className="footer__col-title">Platform</div>
            <div className="footer__links">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cx("footer__link", isActive && "footer__link--active")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="footer__col">
            <div className="footer__col-title">Export standards</div>
            <div className="footer__text muted">
              This MVP highlights the path from cooperative-level data capture
              to buyer-grade evidence. Real certification flows would integrate
              accredited auditors and official registries.
            </div>
          </div>

          <div className="footer__col">
            <div className="footer__col-title">Trust & payments</div>
            <div className="footer__text muted">
              Escrow logic in this demo is simulated via serverless functions.
              The production model would combine inspection APIs, logistics
              milestones and regulated financial partners.
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="muted footer__legal">
            © {year} {BRAND.productName}. Hackathon MVP concept.
          </div>
          <div className="footer__bottom-links">
            <span className="muted">Privacy (demo)</span>
            <span className="footer__dot" aria-hidden="true">•</span>
            <span className="muted">Terms (demo)</span>
          </div>
        </div>
      </div>

      <style>
        {`
          .footer{
            margin-top: var(--space-6);
            border-top: 1px solid var(--color-border);
            background: var(--color-surface);
          }

          .footer__inner{
            max-width: 1200px;
            margin: 0 auto;
            padding: clamp(22px, 3vw, 36px) var(--space-4);
            display: flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .footer__brand{
            display: flex;
            align-items: flex-start;
            gap: var(--space-3);
          }

          .footer__brand-mark{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 40px;
            width: 40px;
            border-radius: 12px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-weight: var(--fw-semibold);
            font-size: var(--fs-3);
            letter-spacing: 0.02em;
          }

          .footer__brand-name{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .footer__brand-sub{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .footer__cols{
            display: grid;
            grid-template-columns: 1fr 1.2fr 1.2fr;
            gap: var(--space-5);
            align-items: start;
          }

          .footer__col-title{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: var(--space-2);
          }

          .footer__links{
            display: grid;
            gap: 6px;
          }

          .footer__link{
            text-decoration: none;
            color: var(--color-text-muted);
            font-size: var(--fs-2);
            padding: 4px 0;
          }

          .footer__link:hover{
            color: var(--color-text);
          }

          .footer__link--active{
            color: var(--color-text);
          }

          .footer__text{
            font-size: var(--fs-2);
            line-height: 1.5;
          }

          .footer__bottom{
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-3);
            flex-wrap: wrap;
            padding-top: var(--space-3);
            border-top: 1px solid var(--color-border);
          }

          .footer__legal{
            font-size: var(--fs-1);
          }

          .footer__bottom-links{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: var(--fs-1);
          }

          .footer__dot{
            opacity: 0.6;
          }

          @media (max-width: 980px){
            .footer__cols{
              grid-template-columns: 1fr;
            }
          }

          @media (max-width: 520px){
            .footer__inner{
              padding-left: var(--space-3);
              padding-right: var(--space-3);
            }
          }
        `}
      </style>
    </footer>
  );
}