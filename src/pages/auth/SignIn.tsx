// agrotrust-az/src/pages/auth/SignIn.tsx

import { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { BRAND } from "@/app/config/constants";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/app/providers/AuthProvider";

/**
 * SignIn (MVP)
 *
 * Mock sign-in for hackathon demo.
 * Allows choosing a role so you can present different B2B perspectives.
 */

type LocationState = {
  from?: string;
};

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("coop");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const redirectTo = useMemo(() => {
    const state = location.state as LocationState | null;
    if (state?.from && typeof state.from === "string") return state.from;
    return ROUTES.DASHBOARD.OVERVIEW;
  }, [location.state]);

  // If already signed in, do not keep them here
  if (isAuthenticated) {
    // A small, safe redirect without side effects
    // Rendering Navigate directly is also fine, but this is simple and reliable.
    setTimeout(() => navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true }), 0);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError("Please enter your email.");
      return;
    }

    setBusy(true);
    try {
      await signIn({
        email: cleanedEmail,
        name: name.trim() || undefined,
        role
      });

      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sign-in failed. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <section className="auth-shell">
        <div className="auth-card card">
          <p className="auth-kicker">Account access</p>
          <h1 className="auth-title">Sign in to {BRAND.productName}</h1>
          <p className="muted auth-subtitle">
            This is a hackathon MVP sign-in. Choose a role to test the buyer
            and cooperative perspectives in the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoComplete="email"
              />
            </label>

            <label className="auth-label">
              Display name (optional)
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            <label className="auth-label">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="coop">Cooperative / Farmer</option>
                <option value="buyer">Buyer / Importer</option>
                <option value="admin">Admin (demo)</option>
              </select>
            </label>

            {error && (
              <div className="auth-alert auth-alert--error">
                {error}
              </div>
            )}

            <div className="auth-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={busy}
              >
                {busy ? "Signing in…" : "Sign in"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--ghost">
                Create account
              </NavLink>
            </div>

            <div className="auth-foot muted">
              For the demo, any email works. No password is required.
            </div>
          </form>
        </div>

        <div className="auth-aside">
          <div className="card card--soft">
            <div className="aside-label">Why role choice matters</div>
            <ul className="auth-list">
              <li>
                Cooperatives focus on lot creation, passports, and export
                readiness.
              </li>
              <li>
                Buyers focus on verification signals and risk-aware trade.
              </li>
              <li>
                Admin view is included only to support judge-friendly
                storytelling.
              </li>
            </ul>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Next step</div>
            <p className="muted">
              After signing in, open Product lots to see the sample data and
              generate a Digital Product Passport.
            </p>
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Go to lots
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .auth-shell{
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: var(--space-5);
            align-items: start;
          }

          .auth-card{
            padding: var(--space-5);
          }

          .auth-kicker{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-1);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .auth-title{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-6);
            line-height: var(--lh-tight);
          }

          .auth-subtitle{
            margin: 0 0 var(--space-4);
            font-size: var(--fs-3);
          }

          .auth-form{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .auth-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .auth-alert{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            font-size: var(--fs-2);
          }

          .auth-alert--error{
            background: color-mix(in oklab, var(--color-danger) 10%, transparent);
          }

          .auth-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-2);
          }

          .auth-foot{
            margin-top: var(--space-2);
            font-size: var(--fs-1);
          }

          .auth-aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .auth-list{
            margin: 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          @media (max-width: 980px){
            .auth-shell{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}