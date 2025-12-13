// agrotrust-az/src/pages/auth/VerifyEmail.tsx

import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/app/providers/AuthProvider";

/**
 * VerifyEmail (real OTP-backed version)
 *
 * - User lands here after SignUp
 * - Enters OTP received by email
 * - We call Netlify function `verify-email`
 * - On success, we sign the user in and redirect to dashboard
 */

type LocationState = {
  email?: string;
  organisation?: string;
  role?: UserRole;
  name?: string; // optional, in case we pass it later
};

export function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signIn } = useAuth();

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "verified">("idle");
  const [error, setError] = useState<string | null>(null);

  const state = (location.state ?? null) as LocationState | null;

  // The email we actually use to verify on backend
  const effectiveEmail = useMemo(() => {
    return state?.email?.trim() || user?.email || "";
  }, [state?.email, user?.email]);

  const displayEmail = effectiveEmail || "your email";

  const displayOrg = useMemo(() => {
    return state?.organisation?.trim() || undefined;
  }, [state?.organisation]);

  const displayRole = useMemo(() => {
    return state?.role || user?.role;
  }, [state?.role, user?.role]);

  useEffect(() => {
    // If user is already authenticated, we can redirect straight to dashboard
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const canSubmit = effectiveEmail && otp.trim().length > 0 && status !== "verifying";

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    setError(null);
    setStatus("verifying");

    try {
      const res = await fetch("/.netlify/functions/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: effectiveEmail,
          otp: otp.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Verification failed. Please try again.");
      }

      // Mark as verified in UI
      setStatus("verified");

      // Lightweight "session" for the MVP via AuthProvider
      // We don't have the original name here reliably, so we fall back gracefully
      const fallbackName =
        state?.name ||
        displayOrg ||
        effectiveEmail ||
        "AgroTrust user";

      const role: UserRole = displayRole || "cooperative";

      await signIn({
        email: effectiveEmail,
        name: fallbackName,
        role,
      });

      // Send them to the dashboard
      navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Verification failed. Please try again.";
      setError(msg);
      setStatus("idle");
    }
  }

  return (
    <div className="container">
      <section className="verify-shell">
        <div className="verify-card card">
          <p className="verify-kicker">Email verification</p>
          <h1 className="verify-title">Confirm your account</h1>

          <p className="muted verify-subtitle">
            We&apos;ve sent a one-time verification code to {displayEmail}. Enter
            it below to activate your {BRAND.productName} account.
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

          <form onSubmit={handleVerify} className="verify-form">
            <label className="verify-label">
              Verification code
              <input
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter the 6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>

            {error && (
              <div className="verify-alert auth-alert--error">
                {error}
              </div>
            )}

            <div className="verify-status">
              {status === "idle" && (
                <div className="verify-hint muted">
                  Check your inbox for a one-time code sent by AgroTrust AZ.
                </div>
              )}

              {status === "verifying" && (
                <div className="verify-hint muted">
                  Verifying your email…
                </div>
              )}

              {status === "verified" && (
                <div className="verify-success">
                  Email verified. Redirecting you to the dashboard…
                </div>
              )}
            </div>

            <div className="verify-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit}
              >
                {status === "verifying" ? "Verifying…" : "Verify email"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
                Back to sign in
              </NavLink>
            </div>
          </form>

          <div className="verify-foot muted">
            Didn&apos;t receive a code? Check spam or contact the AgroTrust team
            during the demo.
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
              After verification, open Product lots to generate a Digital Product
              Passport and show QR verification in action.
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

          .verify-form{
            margin-top: var(--space-4);
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .verify-alert{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            font-size: var(--fs-2);
            background: color-mix(in oklab, var(--color-danger) 10%, transparent);
          }

          .verify-status{
            margin-top: var(--space-2);
          }

          .verify-hint{
            font-size: var(--fs-2);
          }

          .verify-success{
            margin-top: var(--space-2);
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
