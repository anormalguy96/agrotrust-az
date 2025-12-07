// agrotrust-az/src/pages/errors/Forbidden.tsx

import { NavLink } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * Forbidden
 *
 * Simple 403-style page.
 * Used when a user is authenticated but lacks the required role
 * for a protected area.
 */
export function Forbidden() {
  const { user, signOut, getRoleLabel } = useAuth();

  return (
    <div className="container">
      <section className="error-shell">
        <div className="error-card card">
          <p className="error-kicker">403</p>
          <h1 className="error-title">Access restricted</h1>
          <p className="muted error-subtitle">
            Your current role does not have permission to view this area.
            This guard exists to support a clean B2B narrative in the MVP.
          </p>

          <div className="forbidden-panel card card--soft">
            <div className="forbidden-row">
              <span className="forbidden-label">Signed in as</span>
              <span className="forbidden-value">{user?.name ?? "User"}</span>
            </div>
            <div className="forbidden-row">
              <span className="forbidden-label">Role</span>
              <span className="forbidden-value">
                {getRoleLabel(user?.role)}
              </span>
            </div>
          </div>

          <div className="error-actions">
            <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--primary">
              Back to dashboard
            </NavLink>
            <NavLink to={ROUTES.HOME} className="btn btn--ghost">
              Public homepage
            </NavLink>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>

          <div className="error-foot muted">
            {BRAND.productName} • Role-based guard
          </div>
        </div>

        <div className="error-aside">
          <div className="card card--soft">
            <div className="aside-label">Why this exists</div>
            <p className="muted">
              In a full release, different stakeholder roles will have
              different permissions:
            </p>
            <ul className="forbidden-list">
              <li>Cooperatives manage lots and evidence.</li>
              <li>Buyers focus on verification and RFQs.</li>
              <li>Admins oversee standards and dispute flows.</li>
            </ul>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Demo suggestion</div>
            <p className="muted">
              If you want to present the alternative perspective to judges,
              sign in again and choose a different role.
            </p>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--soft">
              Sign in with another role
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

          .forbidden-panel{
            padding: var(--space-4);
            margin-bottom: var(--space-4);
          }

          .forbidden-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: var(--space-2) 0;
            border-bottom: 1px solid var(--color-border);
          }
          .forbidden-row:last-child{
            border-bottom: none;
          }

          .forbidden-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .forbidden-value{
            font-size: var(--fs-2);
            font-weight: var(--fw-medium);
          }

          .forbidden-list{
            margin: 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
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