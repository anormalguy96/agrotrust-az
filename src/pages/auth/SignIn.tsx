import { FormEvent, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
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
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth() as any; // keeps this resilient if your hook shape changes
  const setUser: ((u: any) => void) | undefined = auth?.setUser;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from =
    (location.state as any)?.from?.pathname || ROUTES.DASHBOARD.OVERVIEW;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password
        }),
        signal: controller.signal
      });

      const raw = await res.text().catch(() => "");
      const data = raw ? safeJsonParse<LoginResponse>(raw) : null;

      if (!res.ok) {
        // Show the server’s real message (JSON error or plain text), not a generic one.
        const msg =
          data?.error ||
          raw ||
          `Login failed (HTTP ${res.status}). Check your Netlify function logs.`;
        setError(msg);
        return;
      }

      if (!data?.user) {
        setError(data?.error || "Login succeeded but no user was returned.");
        return;
      }

      if (typeof setUser === "function") {
        setUser(data.user);
      } else {
        // last-resort so you at least don’t crash if setUser is missing
        localStorage.setItem("agrotrust_user", JSON.stringify(data.user));
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError("Login request timed out. Please try again.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      window.clearTimeout(timeoutId);
      setSubmitting(false);
    }
  }

  return (
    <main className="marketing-main">
      <div className="container">
        <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
          <h1 className="dash-title">Sign in to AgroTrust AZ</h1>
          <p className="muted" style={{ marginBottom: "1.5rem" }}>
            Use your registered email and password. Admins can access extra controls
            in the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="stack stack--md">
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
                {submitting ? (
                  <>
                    <span className="spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--ghost">
                Create account
              </NavLink>
            </div>
          </form>

          <p className="muted" style={{ marginTop: "1.25rem", fontSize: "0.8rem" }}>
            For admin access, use <strong>agrotrust.az@gmail.com</strong> with your
            configured admin password.
          </p>
        </div>
      </div>

      <style>{`
        .btn.btn--primary{
          display:inline-flex;
          align-items:center;
          gap: 10px;
        }
        .spin{
          width: 14px;
          height: 14px;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}
