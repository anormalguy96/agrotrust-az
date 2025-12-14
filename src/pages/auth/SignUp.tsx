import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "cooperative" | "buyer" | "admin";

export function SignUp() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [role, setRole] = useState<UserRole>("cooperative");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phoneCountry, setPhoneCountry] = useState("+994");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length >= 6 &&
    !busy;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim();
    const cleanedName = name.trim();
    const cleanedPassword = password.trim();

    if (!cleanedName) return setError("Please enter your name.");
    if (!cleanedEmail) return setError("Please enter your email.");
    if (cleanedPassword.length < 6) return setError("Password must be at least 6 characters.");

    const [firstName, ...rest] = cleanedName.split(" ");
    const lastName = rest.join(" ") || firstName;

    setBusy(true);
    try {
      // 1) Supabase Auth signUp (REAL)
      const { data, error: signErr } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: cleanedPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role, // keep for reference
            organisation: organisation.trim() || null,
            phone_country: phoneCountry || null,
            phone_number: phoneNumber || null,
          },
        },
      });

      if (signErr) throw new Error(signErr.message);

      // 2) Ensure public.profiles row exists (server-side, service role)
      // We pass the userId if we have it; otherwise function will lookup by email.
      const userId = data.user?.id ?? null;

      const res = await fetch("/.netlify/functions/profiles-upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: cleanedEmail,
          firstName,
          lastName,
          role, // cooperative | buyer | admin
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Profile initialization failed.");

      // 3) If your Supabase project requires email confirmation,
      // the session will be null until the user clicks the email link.
      // Send them to Sign In with a friendly hint.
      navigate(ROUTES.AUTH.SIGN_IN, {
        replace: true,
        state: { from: { pathname: ROUTES.DASHBOARD.OVERVIEW } },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed. Please try again.");
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
            This uses real Supabase authentication. You may need to confirm your email before signing in.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Role
              <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                <option value="cooperative">Cooperative / Farmer</option>
                <option value="buyer">Buyer / Importer</option>
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
                placeholder={role === "buyer" ? "Company / procurement team" : "Cooperative name"}
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

            <label className="auth-label">
              Phone number (optional)
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  className="input"
                  style={{ maxWidth: "140px" }}
                  value={phoneCountry}
                  onChange={(e) => setPhoneCountry(e.target.value)}
                >
                  <option value="+994">🇦🇿 +994 (AZ)</option>
                  <option value="+90">🇹🇷 +90 (TR)</option>
                  <option value="+48">🇵🇱 +48 (PL)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                </select>
                <input
                  className="input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="50 123 45 67"
                />
              </div>
            </label>

            <label className="auth-label">
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a password"
                autoComplete="new-password"
              />
            </label>

            {error && <div className="auth-alert auth-alert--error">{error}</div>}

            <div className="auth-actions">
              <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
                {busy ? "Creating account…" : "Create account"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
                I already have an account
              </NavLink>
            </div>

            <div className="auth-foot muted">
              If email confirmation is enabled, check your inbox and confirm before signing in.
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
