import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "cooperative" | "buyer" | "admin";

const MIN_PASSWORD_LEN = 8;

function digitsOnly(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

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

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      password.trim().length >= MIN_PASSWORD_LEN &&
      !busy
    );
  }, [name, email, password, busy]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim().toLowerCase();
    const cleanedName = name.trim();
    const cleanedPassword = password.trim();

    if (!cleanedName) return setError("Please enter your name.");
    if (!cleanedEmail) return setError("Please enter your email.");
    if (cleanedPassword.length < MIN_PASSWORD_LEN) {
      return setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
    }

    const [firstName, ...rest] = cleanedName.split(" ").filter(Boolean);
    const lastName = rest.join(" ") || firstName;

    setBusy(true);
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: cleanedPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role, // stored in auth user_metadata
          },
        },
      });

      if (signErr) throw new Error(signErr.message);

      const appUserId = String(data.user?.id ?? "").trim();

      // Initialize profile (best-effort)
      if (appUserId) {
        const calling = digitsOnly(phoneCountry);
        const national = digitsOnly(phoneNumber);

        const res = await fetch("/.netlify/functions/profile-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            userId: appUserId,
            role, // ✅ persist role into profiles too
            fullName: cleanedName,
            companyName: organisation.trim() || null,
            phoneCountryCallingCode: calling || null,
            phoneNational: national || null,
          }),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.warn("profile-update failed:", text);
        }
      }

      // If email confirmation is required -> session is usually null
      const needsEmailConfirmation = !data.session;

      if (needsEmailConfirmation) {
        navigate(ROUTES.AUTH.VERIFY_EMAIL, {
          replace: true,
          state: {
            email: cleanedEmail,
            organisation: organisation.trim() || undefined,
            role,
            name: cleanedName,
          },
        });
        return;
      }

      // If confirmations are OFF -> session exists -> user is already signed in
      navigate(ROUTES.DASHBOARD.OVERVIEW, { replace: true });
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
            You may need to confirm your email before signing in.
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
                  inputMode="tel"
                  autoComplete="tel-national"
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
                placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
                autoComplete="new-password"
              />
              <div className="muted" style={{ fontSize: "var(--fs-1)", marginTop: 6 }}>
                Minimum length: {MIN_PASSWORD_LEN}.
              </div>
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
              After sign-up, set your country/city/phone precisely in Settings.
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}