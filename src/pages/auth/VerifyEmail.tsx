// agrotrust-az/src/pages/auth/VerifyEmail.tsx

import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/app/providers/AuthProvider";

/**
 * VerifyEmail (MVP)
 *
 * Hackathon-friendly verification screen.
 * No real email is sent.
 * This page exists to make the auth journey feel complete and credible.
 */

type LocationState = {
  email?: string;
  organisation?: string;
  role?: UserRole;
};

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<"idle" | "verifying" | "verified">("idle");

  const state = (location.state ?? null) as LocationState | null;

  const displayEmail = useMemo(() => {
    return state?.email?.trim() || user?.email || "your email";
  }, [state?.email, user?.email]);

  const displayOrg = useMemo(() => {
    return state?.organisation?.trim() || undefined;
  }, [state?.organisation]);

  const displayRole = useMemo(() => {
    return state?.role || user?.role;
  }, [state?.role, user?.role]);

  useEffect(() => {
    // If someone lands here without being "signed in" in the MVP,
    // route them to sign up for a smoother demo flow.
    if (!isAuthenticated) return;
  }, [isAuthenticated]);

  function handleSimulateVerify() {
    if (status === "verifying") return;

    setStatus("verifying");

    // MVP simulation: brief client-side state change
    window.setTimeout(() => {
      setStatus("verified");
    }, 350);
  }

  function handleContinue() {
    navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
  }

  return (
    <div className="container">
      <section className="verify-shell">
        <div className="verify-card card">
          <p className="verify-kicker">Email verification</p>
          <h1 className="verify-title">Confirm your account</h1>

          <p className="muted verify-subtitle">
            In a production release, {BRAND.productName} would send a secure
            verification link to protect buyer and cooperative identities.
            For this MVP, we simulate the step to keep the demo fast.
          </p>

          <div className="verify-panel card card--soft">
            <div className="verify-row">
              <span className="verify-label">Email</span>
              <span className="verify-value">{displayEmail}</span>
            </div>

            {displayOrg && (
              <div className="verify-row">
                <span className="verify-label">Organisation</span>
                <span className="verify-value">{displayOrg}</span>
              </div>
            )}

            {displayRole && (
              <div className="verify-row">
                <span className="verify-label">Role</span>
                <span className="verify-value">
                  {displayRole === "buyer"
                    ? "Buyer / Importer"
                    : displayRole === "admin"
                    ? "Admin (demo)"
                    : "Cooperative / Farmer"}
                </span>
              </div>
            )}
          </div>

          <div className="verify-status">
            {status === "idle" && (
              <div className="verify-hint muted">
                Click the button below to simulate verification.
              </div>
            )}

            {status === "verifying" && (
              <div className="verify-hint muted">
                Verifying your email…
              </div>
            )}

            {status === "verified" && (
              <div className="verify-success">
                Email verified for the demo. You can now access the dashboard.
              </div>
            )}
          </div>

          <div className="verify-actions">
            {status !== "verified" ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSimulateVerify}
                disabled={status === "verifying"}
              >
                {status === "verifying" ? "Verifying…" : "Simulate verification"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleContinue}
              >
                Continue to dashboard
              </button>
            )}

            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
              Back to sign in
            </NavLink>
          </div>

          <div className="verify-foot muted">
            This is a hackathon flow. Real verification can be enabled later.
          </div>
        </div>

        <div className="verify-aside">
          <div className="card card--soft">
            <div className="aside-label">Why this matters in B2B</div>
            <ul className="verify-list">
              <li>Reduces identity risk in cross-border procurement.</li>
              <li>Supports compliance-minded buyers.</li>
              <li>Strengthens platform credibility for auditors and judges.</li>
            </ul>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Next demo step</div>
            <p className="muted">
              Open Product lots to generate a Digital Product Passport and show
              QR verification in action.
            </p>
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Go to lots
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .verify-shell{
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: var(--space-5);
            align-items: start;
          }

          .verify-card{
            padding: var(--space-5);
          }

          .verify-kicker{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-1);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .verify-title{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-6);
            line-height: var(--lh-tight);
          }

          .verify-subtitle{
            margin: 0 0 var(--space-4);
            font-size: var(--fs-3);
          }

          .verify-panel{
            padding: var(--space-4);
          }

          .verify-row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: var(--space-2) 0;
            border-bottom: 1px solid var(--color-border);
          }
          .verify-row:last-child{
            border-bottom: none;
          }

          .verify-label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .verify-value{
            font-size: var(--fs-2);
            font-weight: var(--fw-medium);
          }

          .verify-status{
            margin-top: var(--space-3);
          }

          .verify-hint{
            font-size: var(--fs-2);
          }

          .verify-success{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: color-mix(in oklab, var(--color-success) 10%, transparent);
            font-size: var(--fs-2);
          }

          .verify-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-4);
          }

          .verify-foot{
            margin-top: var(--space-2);
            font-size: var(--fs-1);
          }

          .verify-aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .verify-list{
            margin: 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          @media (max-width: 980px){
            .verify-shell{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}