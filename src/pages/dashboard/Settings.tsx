// agrotrust-az/src/pages/dashboard/Settings.tsx

import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { env } from "@/app/config/env";
import { useAuth } from "@/hooks/useAuth";

/**
 * Settings (Dashboard)
 *
 * Hackathon MVP:
 * - Display account + role info
 * - Provide safe role-change flow by routing back to Sign In
 * - Offer lightweight local UI preferences stored in localStorage
 *
 * We intentionally do not mutate env flags at runtime; instead we
 * surface them as read-only to avoid confusing behaviour.
 */

type UiPrefs = {
  denseTables: boolean;
  showDemoHints: boolean;
};

const LS_KEY = "agrotrust_ui_prefs_v1";

function loadPrefs(): UiPrefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return { denseTables: false, showDemoHints: true };
    }
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      denseTables: Boolean(parsed.denseTables),
      showDemoHints: parsed.showDemoHints !== false
    };
  } catch {
    return { denseTables: false, showDemoHints: true };
  }
}

function savePrefs(p: UiPrefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    // ignore for MVP
  }
}

export function Settings() {
  const navigate = useNavigate();
  const { user, signOut, getRoleLabel } = useAuth();

  const [prefs, setPrefs] = useState<UiPrefs>(() => loadPrefs());
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const roleLabel = useMemo(() => getRoleLabel(user?.role), [user?.role, getRoleLabel]);

  function toggle<K extends keyof UiPrefs>(key: K) {
    setSavedMsg(null);
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSavePrefs() {
    savePrefs(prefs);
    setSavedMsg("Preferences saved for this browser.");
  }

  function handleChangeRole() {
    // For the MVP, we keep role switching simple and robust:
    // sign out and route to sign-in where the user can pick a role again.
    signOut();
    navigate(ROUTES.AUTH.SIGN_IN, { replace: true });
  }

  return (
    <div className="settings-page">
      <header className="settings-head">
        <div>
          <p className="dash-kicker">Preferences</p>
          <h1 className="dash-title">Settings</h1>
          <p className="muted settings-subtitle">
            Manage your demo account context and lightweight interface options.
          </p>
        </div>

        <div className="settings-head__actions">
          <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--ghost">
            Back to overview
          </NavLink>
        </div>
      </header>

      <section className="settings-grid">
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
              <span className="settings-kv__label">Name</span>
              <span className="settings-kv__value">{user?.name ?? "Demo user"}</span>
            </div>
            <div className="settings-kv__row">
              <span className="settings-kv__label">Email</span>
              <span className="settings-kv__value">{user?.email ?? "demo@agrotrust.az"}</span>
            </div>
            <div className="settings-kv__row">
              <span className="settings-kv__label">Role</span>
              <span className="settings-kv__value">{roleLabel}</span>
            </div>
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleChangeRole}
              title="Sign out and choose another role for the demo."
            >
              Change role (re-sign in)
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={signOut}
            >
              Sign out
            </button>
          </div>

          <p className="muted settings-note">
            In a production build, role changes would require admin approval and
            verified organisational links.
          </p>
        </div>

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
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSavePrefs}
            >
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
              <span className="settings-kv__value">
                {env.apiBase || "Not configured"}
              </span>
            </div>
          </div>

          <p className="muted settings-note">
            These values come from your build-time environment and are shown here
            for quick debugging during demos.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="settings-present">
          <div>
            <div className="settings-card__label">Presentation tip</div>
            <div className="settings-present__title">
              Keep role switching simple and intentional.
            </div>
            <p className="muted">
              For judging, a clean narrative is usually best: show a cooperative
              creating a lot and Passport, then re-sign in as a buyer to verify,
              and end with escrow release.
            </p>
          </div>

          <div className="settings-present__actions">
            <NavLink to={ROUTES.DASHBOARD.LOTS} className="btn btn--soft">
              Lots & Passports
            </NavLink>
            <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className="btn btn--soft">
              Escrow demo
            </NavLink>
          </div>
        </div>
      </section>

      <style>
        {`
          .settings-page{
            display:flex;
            flex-direction: column;
            gap: var(--space-5);
          }

          .settings-head{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .settings-subtitle{
            margin: 0;
          }

          .settings-head__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          .settings-grid{
            display:grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: var(--space-4);
            align-items: start;
          }

          .settings-card__head{
            display:flex;
            align-items: start;
            justify-content: space-between;
            gap: var(--space-3);
            margin-bottom: var(--space-3);
          }

          .settings-card__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
            margin-bottom: 2px;
          }

          .settings-card__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
          }

          .settings-pill{
            display:inline-flex;
            align-items:center;
            padding: 4px 10px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-1);
            font-weight: var(--fw-medium);
            white-space: nowrap;
          }

          .settings-kv{
            display:flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .settings-kv__row{
            display:flex;
            justify-content: space-between;
            gap: var(--space-3);
            padding: var(--space-2) 0;
            border-bottom: 1px solid var(--color-border);
          }
          .settings-kv__row:last-child{
            border-bottom: none;
          }

          .settings-kv__label{
            font-size: var(--fs-1);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .settings-kv__value{
            font-size: var(--fs-2);
            font-weight: var(--fw-medium);
            text-align: right;
          }

          .settings-actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
            margin-top: var(--space-3);
          }

          .settings-note{
            margin-top: var(--space-3);
            font-size: var(--fs-1);
          }

          .settings-toggle-list{
            display:flex;
            flex-direction: column;
            gap: var(--space-3);
          }

          .settings-toggle{
            display:flex;
            align-items: flex-start;
            gap: var(--space-3);
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
          }

          .settings-toggle input{
            margin-top: 4px;
          }

          .settings-toggle__title{
            display:block;
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
            margin-bottom: 2px;
          }

          .settings-toggle__desc{
            display:block;
            font-size: var(--fs-1);
          }

          .settings-alert{
            margin-top: var(--space-3);
            padding: var(--space-3);
            border-radius: var(--radius-1);
            border: var(--border-1);
            background: var(--color-surface);
            font-size: var(--fs-2);
          }

          .settings-present{
            display:flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: var(--space-4);
            flex-wrap: wrap;
          }

          .settings-present__title{
            font-size: var(--fs-5);
            font-weight: var(--fw-semibold);
            margin-bottom: var(--space-1);
          }

          .settings-present__actions{
            display:flex;
            gap: var(--space-2);
            flex-wrap: wrap;
          }

          @media (max-width: 1200px){
            .settings-grid{
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 760px){
            .settings-grid{
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
    </div>
  );
}
