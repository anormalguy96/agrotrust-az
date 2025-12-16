import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { City, Country } from "@countrystatecity/countries";

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
  } catch {}
}

function digitsOnly(v: string) {
  return (v || "").replace(/[^\d]/g, "");
}

const FN_BASE = "/.netlify/functions";
const PROFILE_ME = `${FN_BASE}/profile-me`;
const PROFILE_UPDATE = `${FN_BASE}/profile-update`;

type Profile = {
  id?: string;
  app_user_id?: string;

  full_name?: string | null;
  company_name?: string | null;

  country?: string | null;
  country_iso2?: string | null;
  city?: string | null;

  phone_country_calling_code?: string | null;
  phone_e164?: string | null;

  updated_at?: string | null;
};

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut, getRoleLabel } = useAuth() as any;

  const userId = String(user?.id ?? "").trim();
  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role, getRoleLabel]);

  const [prefs, setPrefs] = useState<UiPrefs>(() => loadPrefs());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  // --- profile state ---
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const countries = useMemo(() => {
    // returns { name, isoCode, phonecode, ... }
    const all = Country.getAllCountries();
    return all.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const [countryIso2, setCountryIso2] = useState<string>("");
  const selectedCountry = useMemo(
    () => countries.find((c) => c.isoCode === countryIso2) ?? null,
    [countries, countryIso2]
  );

  const callingCode = useMemo(() => {
    const pc = selectedCountry?.phonecode ? String(selectedCountry.phonecode) : "";
    return digitsOnly(pc);
  }, [selectedCountry]);

  const [phoneNational, setPhoneNational] = useState<string>("");

  const [cityQuery, setCityQuery] = useState<string>("");

  const cities = useMemo(() => {
    if (!countryIso2) return [];
    const list = City.getCitiesOfCountry(countryIso2) ?? [];
    // keep unique names (some datasets include duplicates)
    const set = new Set<string>();
    for (const c of list) set.add(c.name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [countryIso2]);

  const citySuggestions = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities.slice(0, 250);
    const out: string[] = [];
    for (const name of cities) {
      if (name.toLowerCase().includes(q)) out.push(name);
      if (out.length >= 250) break;
    }
    return out;
  }, [cities, cityQuery]);

  useEffect(() => {
    setCityQuery("");
  }, [countryIso2]);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) return;

      setProfileLoading(true);
      setProfileError(null);

      try {
        const res = await fetch(`${PROFILE_ME}?userId=${encodeURIComponent(userId)}`, {
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });

        const text = await res.text().catch(() => "");
        if (!res.ok) throw new Error(text || "Failed to load profile.");

        const json = JSON.parse(text) as { profile?: Profile };
        const p = (json.profile ?? {}) as Profile;

        setFullName(String(p.full_name ?? user?.name ?? "").trim());
        setCompanyName(String(p.company_name ?? "").trim());

        const iso2 = String(p.country_iso2 ?? "").toUpperCase().trim();
        if (iso2) setCountryIso2(iso2);

        const city = String(p.city ?? "").trim();
        setCityQuery(city);

        const e164 = String(p.phone_e164 ?? "").trim();
        const cc = digitsOnly(String(p.phone_country_calling_code ?? ""));
        if (e164 && cc && e164.startsWith(`+${cc}`)) {
          setPhoneNational(digitsOnly(e164.slice(1 + cc.length)));
        } else {
          setPhoneNational("");
        }
      } catch (e: any) {
        setProfileError(e?.message || "Failed to load profile.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
    
  }, [userId]);

  function toggle<K extends keyof UiPrefs>(key: K) {
    setSavedMsg(null);
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSavePrefs() {
    savePrefs(prefs);
    setSavedMsg("Preferences saved for this browser.");
  }

  function handleChangeRole() {
    signOut();
    navigate(ROUTES.AUTH.SIGN_IN, { replace: true });
  }

  async function handleSaveProfile() {
    if (!userId) {
      setProfileError("Missing userId (not signed in).");
      return;
    }

    setProfileSaving(true);
    setProfileError(null);

    try {
      const res = await fetch(PROFILE_UPDATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          userId,
          fullName: fullName.trim() || null,
          companyName: companyName.trim() || null,

          countryIso2: countryIso2 || null,
          country: selectedCountry?.name ?? null,
          city: cityQuery.trim() || null,

          phoneCountryCallingCode: callingCode || null,
          phoneNational: phoneNational.trim() ? digitsOnly(phoneNational) : null,
        }),
      });

      const text = await res.text().catch(() => "");
      if (!res.ok) {
        const msg = text ? (() => { try { return JSON.parse(text)?.details || JSON.parse(text)?.error || text; } catch { return text; } })() : "";
        throw new Error(msg || "Failed to update profile.");
      }

      setSavedMsg("Profile saved.");
    } catch (e: any) {
      setProfileError(e?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-head">
        <div>
          <p className="dash-kicker">Preferences</p>
          <h1 className="dash-title">Settings</h1>
          <p className="muted settings-subtitle">
            Manage your profile, account context, and interface options.
          </p>
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
              <div className="settings-card__title">Edit your details</div>
            </div>
            <span className="settings-pill">{roleLabel}</span>
          </div>

          {profileLoading ? (
            <div className="muted">Loading profile…</div>
          ) : (
            <div className="settings-form">
              <label className="settings-field">
                Full name
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>

              <label className="settings-field">
                Company name
                <input
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="settings-field">
                Country
                <select
                  value={countryIso2}
                  onChange={(e) => setCountryIso2(e.target.value)}
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="settings-field">
                Phone
                <div className="phone-row">
                  <input
                    className="input phone-prefix"
                    value={callingCode ? `+${callingCode}` : ""}
                    readOnly
                    placeholder="+"
                    title="Auto from country"
                  />
                  <input
                    className="input"
                    value={phoneNational}
                    onChange={(e) => setPhoneNational(e.target.value)}
                    placeholder="Local number"
                    inputMode="tel"
                    disabled={!countryIso2}
                  />
                </div>
                <div className="muted settings-hint">
                  Select a country first — prefix will auto-adapt.
                </div>
              </label>

              <label className="settings-field">
                City
                <input
                  className="input"
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder={countryIso2 ? "Type to search cities…" : "Select a country first"}
                  list="city-suggestions"
                  disabled={!countryIso2}
                />
                <datalist id="city-suggestions">
                  {citySuggestions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>

              {profileError && <div className="settings-alert">{profileError}</div>}

              <div className="settings-actions">
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  {profileSaving ? "Saving…" : "Save profile"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="card">
          <div className="settings-card__head">
            <div>
              <div className="settings-card__label">Account</div>
              <div className="settings-card__title">Demo identity</div>
            </div>
            <span className="settings-pill">{roleLabel}</span>
          </div>

          <div className="settings-kv">
            <div className="settings-kv__row">
              <span className="settings-kv__label">Email</span>
              <span className="settings-kv__value">{user?.email ?? "—"}</span>
            </div>
            <div className="settings-kv__row">
              <span className="settings-kv__label">Role</span>
              <span className="settings-kv__value">{roleLabel}</span>
            </div>
          </div>

          <div className="settings-actions">
            <button type="button" className="btn btn--primary" onClick={handleChangeRole}>
              Change role (re-sign in)
            </button>
            <button type="button" className="btn btn--ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>

        {/* Interface */}
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
                <span className="settings-toggle__title">Show demo hints</span>
                <span className="muted settings-toggle__desc">
                  Keeps small narrative prompts visible across dashboard pages.
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
                  A compact layout preference for data-heavy views.
                </span>
              </span>
            </label>
          </div>

          {savedMsg && <div className="settings-alert">{savedMsg}</div>}

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
                setSavedMsg("Preferences reset.");
              }}
            >
              Reset
            </button>
          </div>

          <p className="muted settings-note">
            These preferences are stored only in your browser for the hackathon MVP.
          </p>
        </div>

        {/* Environment */}
        <div className="card card--soft">
          <div className="settings-card__head">
            <div>
              <div className="settings-card__label">Environment</div>
              <div className="settings-card__title">Build flags (read-only)</div>
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
        </div>
      </section>

      <style>
        {`
          .settings-page{ display:flex; flex-direction: column; gap: var(--space-5); }
          .settings-head{ display:flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); flex-wrap: wrap; }
          .settings-subtitle{ margin: 0; }
          .settings-head__actions{ display:flex; gap: var(--space-2); flex-wrap: wrap; }

          .settings-grid{ display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); align-items: start; }
          .settings-card__head{ display:flex; align-items: start; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-3); }

          .settings-card__label{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); margin-bottom: 2px; }
          .settings-card__title{ font-size: var(--fs-5); font-weight: var(--fw-semibold); }

          .settings-pill{ display:inline-flex; align-items:center; padding: 4px 10px; border-radius: var(--radius-pill); border: var(--border-1); background: var(--color-surface); font-size: var(--fs-1); font-weight: var(--fw-medium); white-space: nowrap; }

          .settings-kv{ display:flex; flex-direction: column; gap: var(--space-2); }
          .settings-kv__row{ display:flex; justify-content: space-between; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }
          .settings-kv__row:last-child{ border-bottom: none; }
          .settings-kv__label{ font-size: var(--fs-1); text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-soft); }
          .settings-kv__value{ font-size: var(--fs-2); font-weight: var(--fw-medium); text-align: right; }

          .settings-actions{ display:flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3); }

          .settings-toggle-list{ display:flex; flex-direction: column; gap: var(--space-3); }
          .settings-toggle{ display:flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-1); border: var(--border-1); background: var(--color-surface); }
          .settings-toggle input{ margin-top: 4px; }
          .settings-toggle__title{ display:block; font-size: var(--fs-3); font-weight: var(--fw-medium); margin-bottom: 2px; }
          .settings-toggle__desc{ display:block; font-size: var(--fs-1); }

          .settings-alert{ margin-top: var(--space-3); padding: var(--space-3); border-radius: var(--radius-1); border: var(--border-1); background: var(--color-surface); font-size: var(--fs-2); }

          .settings-form{ display:flex; flex-direction: column; gap: var(--space-3); }
          .settings-field{ display:flex; flex-direction: column; gap: var(--space-2); }
          .settings-hint{ margin-top: 6px; font-size: var(--fs-1); }

          .phone-row{ display:grid; grid-template-columns: 90px 1fr; gap: var(--space-2); align-items: center; }
          .phone-prefix{ opacity: 0.9; }

          @media (max-width: 1200px){ .settings-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
          @media (max-width: 760px){ .settings-grid{ grid-template-columns: 1fr; } }
        `}
      </style>
    </div>
  );
}
