// agrotrust-az/src/pages/errors/NotFound.tsx

import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";

/**
 * NotFound
 *
 * Friendly 404 page for both public and dashboard routes.
 * Keeps UX calm and clear for the hackathon demo.
 */
export function NotFound() {
  return (
    <div className="container">
      <section className="error-shell">
        <div className="error-card card">
          <p className="error-kicker">404</p>
          <h1 className="error-title">Page not found</h1>
          <p className="muted error-subtitle">
            The page you are looking for does not exist or may have been moved.
            You can return to the homepage or jump straight into the demo.
          </p>

          <div className="error-actions">
            <NavLink to={ROUTES.HOME} className="btn btn--primary">
              Back to home
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
              Open demo dashboard
            </NavLink>
            <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
              How it works
            </NavLink>
          </div>

          <div className="error-foot muted">
            {BRAND.productName} • Hackathon MVP
          </div>
        </div>

        <div className="error-aside">
          <div className="card card--soft">
            <div className="aside-label">Common routes</div>
            <div className="error-links">
              <NavLink to={ROUTES.HOME} className="error-link">
                Home
              </NavLink>
              <NavLink to={ROUTES.STANDARDS} className="error-link">
                Standards
              </NavLink>
              <NavLink to={ROUTES.FOR_FARMERS} className="error-link">
                For farmers
              </NavLink>
              <NavLink to={ROUTES.FOR_BUYERS} className="error-link">
                For buyers
              </NavLink>
              <NavLink to={ROUTES.CONTACT} className="error-link">
                Contact
              </NavLink>
            </div>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Demo tip</div>
            <p className="muted">
              If you reached this page from the dashboard, try signing in again
              or use the sidebar links to navigate to lots and passports.
            </p>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--soft">
              Sign in
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .error-shell{
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: var(--space-5);
            align-items: start;
          }

          .error-card{
            padding: var(--space-6);
          }

          .error-kicker{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-1);
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .error-title{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-7);
            line-height: var(--lh-tight);
          }

          .error-subtitle{
            margin: 0 0 var(--space-4);
            font-size: var(--fs-3);
          }

          .error-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .error-foot{
            margin-top: var(--space-4);
            font-size: var(--fs-1);
          }

          .error-aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .error-links{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .error-link{
            padding: 8px 10px;
            border-radius: var(--radius-1);
            background: var(--color-elevated);
            border: var(--border-1);
            font-size: var(--fs-2);
            color: var(--color-text);
          }

          .error-link:hover{
            text-decoration: none;
            border-color: var(--color-border-strong);
          }

          @media (max-width: 980px){
            .error-shell{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}