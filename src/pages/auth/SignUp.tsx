import { FormEvent, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "cooperative" | "buyer" | "admin";

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

  // Keep phone optional here; full country/city selection lives in Settings (CSC UI)
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
      password.trim().length >= 6 &&
      !busy
    );
  }, [name, email, password, busy]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanedEmail = email.trim();
    const cleanedName = name.trim();
    const cleanedPassword = password.trim();

    if (!cleanedName) return setError("Please enter your name.");
    if (!cleanedEmail) return setError("Please enter your email.");
    if (cleanedPassword.length < 6) return setError("Password must be at least 6 characters.");

    const [firstName, ...rest] = cleanedName.split(" ").filter(Boolean);
    const lastName = rest.join(" ") || firstName;

    setBusy(true);
    try {
      // 1) Supabase Auth signUp
      const { data, error: signErr } = await supabase.auth.signUp({
        email: cleanedEmail,
        password: cleanedPassword,
        options: {
          // Keep metadata light. Profile fields go to `profiles` via Netlify Function.
          data: {
            first_name: firstName,
            last_name: lastName,
            role,
          },
        },
      });

      if (signErr) throw new Error(signErr.message);

      // Supabase returns a user id even when email confirmation is required.
      const appUserId = String(data.user?.id ?? "").trim();

      // 2) Initialize / upsert profile row (server-side, service role)
      // IMPORTANT: We write by `app_user_id` (text), NOT by `profiles.id` (uuid).
      // This works for both UUID ids and demo ids like "user-xxxx".
      if (appUserId) {
        const calling = digitsOnly(phoneCountry);
        const national = digitsOnly(phoneNumber);

        const res = await fetch("/.netlify/functions/profile-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            userId: appUserId, // <-- becomes profiles.app_user_id
            fullName: cleanedName,
            companyName: organisation.trim() || null,
            phoneCountryCallingCode: calling || null,
            phoneNational: national || null,
          }),
        });

        // Don’t block account creation if profile init fails; Settings can still work.
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          let msg = "Profile initialization failed.";
          try {
            const j = JSON.parse(text || "{}");
            msg = j?.details || j?.error || msg;
          } catch {
            if (text) msg = text;
          }
          // For MVP, show a warning but still send user to sign-in.
          console.warn("profile-update failed:", msg);
        }
      }

      // 3) Send user to Sign In (email confirmation may be required)
      navigate(ROUTES.AUTH.SIGN_IN, {
        replace: true,
        state: {
          from: { pathname: ROUTES.DASHBOARD.OVERVIEW },
          justSignedUp: true,
          email: cleanedEmail,
        },
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
            Sign-up uses Supabase authentication. You may need to confirm your email before signing in.
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
              After sign-up, set your country/city/phone precisely in Settings.
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
