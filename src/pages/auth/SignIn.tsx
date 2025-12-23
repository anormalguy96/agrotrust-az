import { FormEvent, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => {
    const s = location.state as any;
    const f = s?.from;

    if (typeof f === "string") return f;
    if (f?.pathname) return f.pathname as string;

    return ROUTES.DASHBOARD.OVERVIEW;
  }, [location.state]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        setError("Email and password are required.");
        return;
      }

      await signIn({ email: cleanEmail, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="marketing-main">
      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="dash-title">Sign in to AgroTrust AZ</h1>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Sign in with your email and password.
          </p>

          <form onSubmit={handleSubmit} className="stack stack--md" noValidate>
            <label className="form-label">
              Email
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="form-label">
              Password
              <input
                className="input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div className="rfq-alert rfq-alert--error" style={{ marginTop: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.75rem" }}>
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--ghost">
                Create account
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}