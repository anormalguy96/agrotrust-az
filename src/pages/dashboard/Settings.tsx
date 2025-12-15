// agrotrust-az/src/pages/dashboard/Settings.tsx

import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { env } from "@/app/config/env";
import { useAuth } from "@/hooks/useAuth";

type UiPrefs = {
  denseTables: boolean;
  showDemoHints: boolean;
};

const LS_KEY = "agrotrust_ui_prefs_v1";

function loadPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { denseTables: false, showDemoHints: true };
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      denseTables: Boolean(parsed.denseTables),
      showDemoHints: parsed.showDemoHints !== false,
    };
  } catch {
    return { denseTables: false, showDemoHints: true };
  }
}

function savePrefs(p: UiPrefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

type Profile = {
  id: string;
  email?: string | null;
  role?: string | null;

  // editable
  fullName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
};

function safeJsonParse<T>(text: string): T | null {
  try {
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function shortText(text: string, max = 450) {
  const t = (text || "").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

const FN_BASE = "/.netlify/functions";
const PROFILE_ME = `${FN_BASE}/profile-me`;
const PROFILE_UPDATE = `${FN_BASE}/profile-update`;

async function fetchProfile(userId: string): Promise<Profile> {
  const url = `${PROFILE_ME}?userId=${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(shortText(text) || "Failed to load profile.");

  const data = safeJsonParse<any>(text);
  // support { profile } or profile directly
  const p = data?.profile ?? data ?? {};
  return {
    id: String(p.id ?? userId),
    email: p.email ?? null,
    role: p.role ?? null,
    fullName: p.full_name ?? p.fullName ?? p.name ?? null,
    phone: p.phone ?? null,
    companyName: p.company_name ?? p.companyName ?? null,
    country: p.country ?? null,
    city: p.city ?? null,
  };
}

type UpdateProfileInput = {
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
};

async function updateProfile(input: UpdateProfileInput): Promise<Profile> {
  const res = await fetch(PROFILE_UPDATE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(input),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(shortText(text) || "Failed to update profile.");

  const data = safeJsonParse<any>(text);
  const p = data?.profile ?? data ?? {};
  return {
    id: String(p.id ?? input.userId),
    email: p.email ?? null,
    role: p.role ?? null,
    fullName: p.full_name ?? p.fullName ?? p.name ?? input.fullName ?? null,
    phone: p.phone ?? input.phone ?? null,
    companyName: p.company_name ?? p.companyName ?? input.companyName ?? null,
    country: p.country ?? input.country ?? null,
    city: p.city ?? input.city ?? null,
  };
}

export function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut, getRoleLabel } = useAuth() as any;

  const userId = (user?.id || "").trim();
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role, getRoleLabel]);

  const [prefs, setPrefs] = useState<UiPrefs>(() => loadPrefs());
  const [prefsMsg, setPrefsMsg] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId),
    enabled: Boolean(userId),
  });

  const profile = profileQuery.data;

  // editable form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  useEffect(() => {
    // hydrate form once profile loads
    if (!profile) return;
    setFullName((profile.fullName ?? user?.name ?? "").toString());
    setPhone((profile.phone ?? "").toString());
    setCompanyName((profile.companyName ?? "").toString());
    setCountry((profile.country ?? "").toString());
    setCity((profile.city ?? "").toString());
  }, [profile, user?.name]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setProfileErr(null);
      setProfileMsg("Profile updated.");
    },
    onError: (err: unknown) => {
      setProfileMsg(null);
      setProfileErr(err instanceof Error ? err.message : "Failed to update profile.");
    },
  });

  function toggle<K extends keyof UiPrefs>(key: K) {
    setPrefsMsg(null);
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSavePrefs() {
    savePrefs(prefs);
    setPrefsMsg("Preferences saved for this browser.");
  }

  function handleSignOut() {
    signOut();
    navigate(ROUTES.AUTH.SIGN_IN, { replace: true });
  }

  function handleSaveProfile() {
    setProfileMsg(null);
    setProfileErr(null);

    if (!userId) {
      setProfileErr("You must be signed in to edit your profile.");
      return;
    }

    const payload: UpdateProfileInput = {
      userId,
      fullName: fullName.trim() || null,
      phone: phone.trim() || null,
      companyName: companyName.trim() || null,
      country: country.trim() || null,
      city: city.trim() || null,
    };

    updateProfileMutation.mutate(payload);
  }

  const email = profile?.email ?? user?.email ?? null;

  return (
    <div className="settings-page">
      <header className="settings-head">
        <div>
          <p className="dash-kicker">Account</p>
          <h1 className="dash-title">Settings</h1>
          <p className="muted settings-subtitle">Edit your profile and local interface preferences.</p>
        </div>

        <div className="settings-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
        </div>
      </header>

      <section className="settings-grid">
        {/* Profile */}
        <div className="card">
          <div className="settings-card__head">
            <div>
              <div className="settings-card__label">Profile</div>
              <div className="settings-card__title">Your details</div>
            </div>
            <span className="settings-pill">{roleLabel}</span>
          </div>

          {!userId && (
            <div className="settings-alert settings-alert--error">
              You are not signed in. Please sign in to edit your profile.
            </div>
          )}

          {profileQuery.isLoading && userId && (
            <div className="muted">Loading profile…</div>
          )}

          {profileQuery.isError && (
            <div className="settings-alert settings-alert--error">
              {(profileQuery.error as Error)?.message ?? "Failed to load profile."}
            </div>
          )}

          <div className="settings-form">
            <label className="settings-field">
              Full name
              <input
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={!userId}
              />
            </label>

            <label className="settings-field">
              Email (read-only)
              <input className="input" value={email ?? ""} readOnly />
            </label>

            <label className="settings-field">
              Phone (optional)
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+994 ..."
                disabled={!userId}
              />
            </label>

            <label className="settings-field">
              Company (optional)
              <input
                className="input"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company / Cooperative / Buyer org"
                disabled={!userId}
              />
            </label>

            <label className="settings-field">
              Country (optional)
              <input
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Azerbaijan"
                disabled={!userId}
              />
            </label>

            <label className="settings-field">
              City (optional)
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Baku"
                disabled={!userId}
              />
            </label>
          </div>

          {profileErr && <div className="settings-alert settings-alert--error">{profileErr}</div>}
          {profileMsg && <div className="settings-alert">{profileMsg}</div>}

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSaveProfile}
              disabled={!userId || updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? "Saving…" : "Save profile"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>

          <p className="muted settings-note">
            Profile updates are stored in the backend (Supabase) so they persist across sessions.
          </p>
        </div>

        {/* Preferences */}
        <div className="card">
          <div className="settings-card__head">
            <div>
              <div className="settings-card__label">Interface</div>
              <div className="settings-card__title">Local UI preferences</div>
            </div>
          </div>

          <div className="settings-toggle-list">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={prefs.showDemoHints}
                onChange={() => toggle("showDemoHints")}
              />
              <span>
                <span className="settings-toggle__title">Show hints</span>
                <span className="muted settings-toggle__desc">
                  Show small helper hints across dashboard pages.
                </span>
              </span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={prefs.denseTables}
                onChange={() => toggle("denseTables")}
              />
              <span>
                <span className="settings-toggle__title">Dense tables</span>
                <span className="muted settings-toggle__desc">
                  Compact layout for data-heavy views.
                </span>
              </span>
            </label>
          </div>

          {prefsMsg && <div className="settings-alert">{prefsMsg}</div>}

          <div className="settings-actions">
            <button type="button" className="btn btn--primary" onClick={handleSavePrefs}>
              Save preferences
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                const reset = { denseTables: false, showDemoHints: true };
                setPrefs(reset);
                savePrefs(reset);
                setPrefsMsg("Preferences reset.");
              }}
            >
              Reset
            </button>
          </div>

          <p className="muted settings-note">Stored only in your browser.</p>
        </div>

        {/* Environment */}
        <div className="card card--soft">
          <div className="settings-card__head">
            <div>
              <div className="settings-card__label">Environment</div>
              <div className="settings-card__title">Build flags</div>
            </div>
          </div>

          <div className="settings-kv">
            <div className="settings-kv__row">
              <span className="settings-kv__label">Product</span>
              <span className="settings-kv__value">{BRAND.productName}</span>
            </div>
            <div className="settings-kv__row">
              <span className="settings-kv__label">Mocks enabled</span>
              <span className="settings-kv__value">{env.enableMocks ? "Yes" : "No"}</span>
            </div>
            <div className="settings-kv__row">
              <span className="settings-kv__label">API base</span>
              <span className="settings-kv__value">{env.apiBase || "Not configured"}</span>
            </div>
          </div>

          <p className="muted settings-note">Read-only values from build-time env.</p>
        </div>
      </section>

      <style>{`
        .settings-page{ display:flex; flex-direction: column; gap: var(--space-5); }

        .settings-head{ display:flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
        .settings-subtitle{ margin: 0; }
        .settings-head__actions{ display:flex; gap: var(--space-2); flex-wrap: wrap; }

        .settings-grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-4);
          align-items: start;
        }

        .settings-card__head{ display:flex; align-items: start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }
        .settings-card__label{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); margin-bottom: 2px; }
        .settings-card__title{ font-size: var(--fs-5); font-weight: var(--fw-semibold); }

        .settings-pill{
          display:inline-flex; align-items:center;
          padding: 4px 10px; border-radius: var(--radius-pill);
          border: var(--border-1); background: var(--color-surface);
          font-size: var(--fs-1); font-weight: var(--fw-medium); white-space: nowrap;
        }

        .settings-kv{ display:flex; flex-direction: column; gap: var(--space-2); }
        .settings-kv__row{ display:flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
        .settings-kv__row:last-child{ border-bottom: none; }
        .settings-kv__label{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); }
        .settings-kv__value{ font-size: var(--fs-2); font-weight: var(--fw-medium); text-align: right; }

        .settings-form{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
          align-items: end;
        }

        .settings-field{
          display:flex;
          flex-direction: column;
          gap: var(--space-2);
          font-size: var(--fs-2);
        }

        .settings-actions{ display:flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }
        .settings-note{ margin-top: var(--space-3); font-size: var(--fs-1); }

        .settings-toggle-list{ display:flex; flex-direction: column; gap: var(--space-3); }
        .settings-toggle{
          display:flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-3); border-radius: var(--radius-1);
          border: var(--border-1); background: var(--color-surface);
        }
        .settings-toggle input{ margin-top: 4px; }
        .settings-toggle__title{ display:block; font-size: var(--fs-3); font-weight: var(--fw-medium); margin-bottom: 2px; }
        .settings-toggle__desc{ display:block; font-size: var(--fs-1); }

        .settings-alert{
          margin-top: var(--space-3);
          padding: var(--space-3);
          border-radius: var(--radius-1);
          border: var(--border-1);
          background: var(--color-surface);
          font-size: var(--fs-2);
        }
        .settings-alert--error{
          background: color-mix(in oklab, var(--color-danger) 10%, transparent);
        }

        @media (max-width: 1200px){
          .settings-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .settings-form{ grid-template-columns: 1fr; }
        }
        @media (max-width: 760px){
          .settings-grid{ grid-template-columns: 1fr; }
          .settings-form{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

export default Settings;
