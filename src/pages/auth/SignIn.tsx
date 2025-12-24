import { FormEvent, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type UiUser = {
  id: string;
  email: string;
  role: "cooperative" | "buyer" | "admin";
  firstName?: string;
  lastName?: string;
};

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any;

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
      // 1) Sign in with Supabase Auth (REAL session)
      const { data, error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signErr) {
        setError(signErr.message);
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Sign-in failed: missing user.");
        return;
      }

      // 2) Load profile (role/name) for UI
      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, role")
        .eq("id", user.id)
        .single();

      // If profiles table is not ready / RLS blocks select, still allow sign-in
      // but UI role/name might be unknown.
      let uiUser: UiUser = {
        id: user.id,
        email: user.email ?? email.trim(),
        role: "cooperative",
      };

      if (!profErr && profile) {
        uiUser = {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name ?? undefined,
          lastName: profile.last_name ?? undefined,
          role:
            profile.role === "admin"
              ? "admin"
              : profile.role === "buyer"
              ? "buyer"
              : "cooperative",
        };
      }

      // 3) Keep your existing UI auth hook working
      if (typeof auth?.setUser === "function") auth.setUser(uiUser);
      else if (typeof auth?.signIn === "function") auth.signIn(uiUser);

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
            This uses real Supabase authentication.
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
