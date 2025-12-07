// agrotrust-az/src/pages/auth/SignUp.tsx

import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/app/providers/AuthProvider";

/**
 * SignUp (MVP)
 *
 * Mock sign-up for hackathon demo.
 * No password required.
 * We capture basic identity + role so the dashboard narrative is strong.
 */
export function SignUp() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();

  const [role, setRole] = useState<UserRole>("coop");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const canSubmit =
    name.trim().length > 0 && email.trim().length > 0 && !busy;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim();
    const cleanedName = name.trim();

    if (!cleanedName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanedEmail) {
      setError("Please enter your email.");
      return;
    }

    setBusy(true);
    try {
      await signIn({
        email: cleanedEmail,
        name: cleanedName,
        role
      });

      // For a hackathon MVP we skip real email verification.
      // We keep a dedicated page for narrative completeness.
      navigate(ROUTES.AUTH.VERIFY_EMAIL, {
        replace: true,
        state: {
          email: cleanedEmail,
          organisation: organisation.trim() || undefined,
          role
        }
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sign-up failed. Please try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <section className="auth-shell">
        <div className="auth-card card">
          <p className="auth-kicker">Create your account</p>
          <h1 className="auth-title">Join {BRAND.productName}</h1>
          <p className="muted auth-subtitle">
            This is a hackathon MVP sign-up. You can create a cooperative or
            buyer profile and access the demo dashboard immediately.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
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

            <label className="auth-label">
              Your name
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name and surname"
                autoComplete="name"
              />
            </label>

            <label className="auth-label">
              Organisation (optional)
              <input
                className="input"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                placeholder={
                  role === "buyer"
                    ? "Company / procurement team"
                    : "Cooperative name"
                }
                autoComplete="organization"
              />
            </label>

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

            {error && (
              <div className="auth-alert auth-alert--error">
                {error}
              </div>
            )}

            <div className="auth-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
                I already have an account
              </NavLink>
            </div>

            <div className="auth-foot muted">
              For the demo, any email works. No password is required.
            </div>
          </form>
        </div>

        <div className="auth-aside">
          <div className="card card--soft">
            <div className="aside-label">What you get in the MVP</div>
            <ul className="auth-list">
              <li>Access to sample cooperatives and product lots</li>
              <li>Digital Product Passport creation and QR payload</li>
              <li>Buyer-style verification view</li>
              <li>Inspection-gated escrow simulation</li>
            </ul>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Presentation tip</div>
            <p className="muted">
              During judging, you can sign up twice with different roles to show
              the two-sided B2B value in under two minutes.
            </p>
            <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--soft">
              How it works
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