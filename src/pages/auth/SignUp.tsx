import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/app/providers/AuthProvider";

export function SignUp() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); // we don't sign in here, only after OTP verify

  const [role, setRole] = useState<UserRole>("cooperative");
  const [name, setName] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // NEW: phone fields
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

    if (!cleanedName) {
      setError("Please enter your name.");
      return;
    }

    if (!cleanedEmail) {
      setError("Please enter your email.");
      return;
    }

    if (cleanedPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const [firstName, ...rest] = cleanedName.split(" ");
    const lastName = rest.join(" ") || firstName;

    setBusy(true);
    try {
      const res = await fetch("/.netlify/functions/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          role,
          email: cleanedEmail,
          password: cleanedPassword,
          phoneCountry,
          phoneNumber,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Sign-up failed. Please try again.");
      }

      navigate(ROUTES.AUTH.VERIFY_EMAIL, {
        replace: true,
        state: {
          email: cleanedEmail,
          organisation: organisation.trim() || undefined,
          role,
        },
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Sign-up failed. Please try again.";
      setError(msg);
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
            This MVP now uses real registration with email verification. Create a
            cooperative or buyer profile and access the demo dashboard after
            confirming your email.
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            <label className="auth-label">
              Role
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                <option value="cooperative">Cooperative / Farmer</option>
                <option value="buyer">Buyer / Importer</option>
                {/* Admin must be seeded manually; we don't expose it here */}
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
                placeholder={
                  role === "buyer"
                    ? "Company / procurement team"
                    : "Cooperative name"
                }
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

            {/* NEW: phone country + number */}
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
                  <option value="+7">🇷🇺 +7 (RU)</option>
                  <option value="+995">🇬🇪 +995 (GE)</option>
                  <option value="+48">🇵🇱 +48 (PL)</option>
                  <option value="+44">🇬🇧 +44 (UK)</option>
                  <option value="+49">🇩🇪 +49 (DE)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+33">🇫🇷 +33 (FR)</option>
                  <option value="+39">🇮🇹 +39 (IT)</option>
                  <option value="+971">🇦🇪 +971 (AE)</option>
                  <option value="+998">🇺🇿 +998 (UZ)</option>
                  <option value="+380">🇺🇦 +380 (UA)</option>
                  <option value="+251">🇪🇹 +251 (ET)</option>
                  <option value="+254">🇰🇪 +254 (KE)</option>
                  <option value="+27">🇿🇦 +27 (ZA)</option>
                  <option value="+55">🇧🇷 +55 (BR)</option>
                  <option value="+52">🇲🇽 +52 (MX)</option>
                  <option value="+91">🇮🇳 +91 (IN)</option>
                  <option value="+86">🇨🇳 +86 (CN)</option>
                  <option value="+82">🇰🇷 +82 (KR)</option>
                  <option value="+66">🇹🇭 +66 (TH)</option>
                  <option value="+84">🇻🇳 +84 (VN)</option> 
                  <option value="+65">🇸🇬 +65 (SG)</option>
                  <option value="+61">🇦🇺 +61 (AU)</option>
                  <option value="+1">🇨🇦 +1 (CA)</option>
                  <option value="+1">🇬🇧 +1 (US)</option>
                  <option value="+1">🇪🇨 +1 (CA)</option>
                  <option value="+1">🇦🇷 +1 (US)</option>
                  <option value="+1">🇧🇷 +1 (US)</option>
                  <option value="+1">🇨🇦 +1 (CA)</option>
                  <option value="+1">🇨🇱 +1 (US)</option>
                  <option value="+1">🇨🇴 +1 (US)</option>
                  <option value="+1">🇵🇪 +1 (US)</option>
                  <option value="+1">🇹🇼 +1 (US)</option>
                  <option value="+1">🇺🇸 +1 (US)</option>
                  <option value="+1">🇻🇦 +1 (US)</option>
                  <option value="+1">🇻🇪 +1 (US)</option>
                  <option value="+1">🇻🇳 +1 (US)</option>
                  <option value="+1">🇼🇸 +1 (US)</option>
                  <option value="+1">🇾🇪 +1 (US)</option>
                  <option value="+1">🇾🇹 +1 (US)</option>
                  <option value="+1">🇿🇼 +1 (US)</option>
                  <option value="+1">🇿🇦 +1 (US)</option>
                  <option value="+1">🇿🇲 +1 (US)</option>
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

            {error && (
              <div className="auth-alert auth-alert--error">
                {error}
              </div>
            )}

            <div className="auth-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={!canSubmit}
              >
                {busy ? "Creating account…" : "Create account"}
              </button>

              <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
                I already have an account
              </NavLink>
            </div>

            <div className="auth-foot muted">
              You’ll receive a one-time verification code at this email.
            </div>
          </form>
        </div>

        <div className="auth-aside">
          <div className="card card--soft">
            <div className="aside-label">What you get in the MVP</div>
            <ul className="auth-list">
              <li>Access to sample cooperatives and product lots</li>
              <li>Digital Product Passport creation and QR payload</li>
              <li>Buyer-style verification view</li>
              <li>Inspection-gated escrow simulation</li>
            </ul>
          </div>

          <div className="card card--soft">
            <div className="aside-label">Presentation tip</div>
            <p className="muted">
              During judging, you can sign up twice with different roles to show
              the two-sided B2B value in under two minutes.
            </p>
            <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--soft">
              How it works
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .auth-shell{
            display:grid;
            grid-template-columns: 1.1fr 0.9fr;
            gap: var(--space-5);
            align-items: start;
          }

          .auth-card{
            padding: var(--space-5);
          }

          .auth-kicker{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-1);
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--color-text-soft);
          }

          .auth-title{
            margin: 0 0 var(--space-2);
            font-size: var(--fs-6);
            line-height: var(--lh-tight);
          }

          .auth-subtitle{
            margin: 0 0 var(--space-4);
            font-size: var(--fs-3);
          }

          .auth-form{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .auth-label{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
          }

          .auth-alert{
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            font-size: var(--fs-2);
          }

          .auth-alert--error{
            background: color-mix(in oklab, var(--color-danger) 10%, transparent);
          }

          .auth-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-2);
          }

          .auth-foot{
            margin-top: var(--space-2);
            font-size: var(--fs-1);
          }

          .auth-aside{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .auth-list{
            margin: 0;
            padding-left: 1.1rem;
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
            font-size: var(--fs-2);
            color: var(--color-text-muted);
          }

          @media (max-width: 980px){
            .auth-shell{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}