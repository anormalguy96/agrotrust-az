import { FormEvent, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

type LoginResponse =
  | {
      user: {
        id: string;
        email: string;
        role: "cooperative" | "buyer" | "admin";
        firstName?: string;
        lastName?: string;
      };
    }
  | {
      error?: string;
      message?: string;
    };

async function readErrorMessage(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const data = (await res.json().catch(() => null)) as any;
    const msg =
      data?.error ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      null;

    return (
      msg ||
      `Request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ""}).`
    );
  }

  const text = (await res.text().catch(() => "")).trim();
  return (
    text ||
    `Request failed (${res.status}${res.statusText ? ` ${res.statusText}` : ""}).`
  );
}

export function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = useMemo(() => {
    const state = location.state as any;
    return state?.from?.pathname || ROUTES.DASHBOARD.OVERVIEW;
  }, [location.state]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/.netlify/functions/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });

      if (!res.ok) {
        setError(await readErrorMessage(res));
        return;
      }

      const data = (await res.json().catch(() => null)) as LoginResponse | null;

      if (!data || !("user" in data) || !data.user) {
        setError("Login succeeded but server did not return user data.");
        return;
      }

      const u = data.user;
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();

      setUser({
        id: u.id,
        email: u.email,
        role: u.role,
        name: fullName || u.email
      } as any);

      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
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
                disabled={submitting}
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
                disabled={submitting}
                onChange={(e) => setPassword(e.target- value)}
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
                marginTop: "0.75rem"
              }}
            >
              <button type="submit" className="btn btn--primary" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>

              {/* Important: this must only NAVIGATE, not submit anything */}
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
    </main>
  );
}
