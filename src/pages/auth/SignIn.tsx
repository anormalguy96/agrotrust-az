// src/pages/auth/SignIn.tsx

import { FormEvent, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { supabase } from "@/lib/supabaseClient";

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => {
    return (location.state as any)?.from?.pathname || ROUTES.DASHBOARD.OVERVIEW;
  }, [location.state]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      if (!cleanEmail || !cleanPassword) {
        setError("Email and password are required.");
        return;
      }

      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (signErr) {
        setError(signErr.message);
        return;
      }

      // Optional: verify profile exists (helps catch RLS issues early)
      const userId = data.user?.id;
      if (!userId) {
        setError("Sign-in succeeded but session user is missing.");
        return;
      }

      const { error: profErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (profErr) {
        console.error("Profile load failed:", profErr);
        setError("Signed in, but profile could not be loaded (RLS/policy issue).");
        return;
      }

      // Important: DO NOT set local mock auth user here.
      // AuthProvider should react to Supabase session changes.

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

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                marginTop: "0.75rem",
              }}
            >
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