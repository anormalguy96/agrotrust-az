import { FormEvent, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type LoginResponse = {
  user?: {
    id: string;
    email: string;
    role: "cooperative" | "buyer" | "admin";
    firstName?: string;
    lastName?: string;
  };
  error?: string;
};

function safeJsonParse<T>(text: string): T | null {
  try {
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any; // keep flexible while your auth hook evolves

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
      const res = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // keep cookies if your backend sets any
        credentials: "same-origin",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const text = await res.text().catch(() => "");
      const data = safeJsonParse<LoginResponse>(text) ?? {};

      if (!res.ok || data.error || !data.user) {
        const msg =
          data.error ||
          (text && text.length < 300 ? text : "") ||
          `Login failed (${res.status}).`;
        setError(msg);
        return;
      }

      if (typeof auth?.setUser === "function") {
        auth.setUser(data.user);
      } else if (typeof auth?.signIn === "function") {
        auth.signIn(data.user);
      } else {
        // This is the “r is not a function” class of bug.
        throw new Error("Auth provider is missing setUser/signIn.");
      }

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
            Use your registered email and password.
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

          <p className="muted" style={{ marginTop: "1.25rem", fontSize: "0.8rem" }}>
            Admin email: <strong>agrotrust.az@gmail.com</strong>
          </p>
        </div>
      </div>
    </main>
  );
}
