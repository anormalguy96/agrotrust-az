// agrotrust-az/src/components/navigation/Navbar.tsx

import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";

type NavItem = {
  label: string;
  to: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Navbar
 *
 * Hackathon MVP navigation for:
 * - Marketing pages
 * - Auth
 * - Dashboard entry
 *
 * Minimal responsive behaviour with a small mobile menu state.
 */
export function Navbar() {
  const { user, isAuthenticated, signOut, getRoleLabel } = useAuth();
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const marketingItems: NavItem[] = useMemo(
    () => [
      { label: "Home", to: ROUTES.HOME },
      { label: "How it works", to: ROUTES.HOW_IT_WORKS },
      { label: "Standards", to: ROUTES.STANDARDS },
      { label: "For farmers", to: ROUTES.FOR_FARMERS },
      { label: "For buyers", to: ROUTES.FOR_BUYERS },
      { label: "Contact", to: ROUTES.CONTACT }
    ],
    []
  );

  const onAnyNavigate = () => setOpen(false);

  const isOnAuth =
    location.pathname.startsWith("/auth");

  const roleLabel =
    typeof getRoleLabel === "function" ? getRoleLabel(user?.role) : user?.role;

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <div className="navbar__left">
          <NavLink to={ROUTES.HOME} className="navbar__brand" onClick={onAnyNavigate}>
            <span className="navbar__brand-mark" aria-hidden="true">
              AT
            </span>
            <span className="navbar__brand-text">
              {BRAND.productName}
            </span>
          </NavLink>

          <nav className="navbar__nav navbar__nav--desktop" aria-label="Primary">
            {marketingItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cx("navbar__link", isActive && "navbar__link--active")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="navbar__right">
          {isAuthenticated ? (
            <div className="navbar__account">
              <span className="navbar__account-pill" title={user?.email ?? undefined}>
                <span className="navbar__account-name">
                  {user?.name ?? "Demo user"}
                </span>
                {roleLabel ? (
                  <span className="navbar__account-role">
                    {roleLabel}
                  </span>
                ) : null}
              </span>

              <Button
                variant="ghost"
                size="sm"
                to={ROUTES.DASHBOARD.ROOT}
                onClick={onAnyNavigate}
              >
                Dashboard
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  onAnyNavigate();
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="navbar__auth">
              {!isOnAuth && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    to={ROUTES.AUTH.SIGN_IN}
                    onClick={onAnyNavigate}
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    to={ROUTES.AUTH.SIGN_UP}
                    onClick={onAnyNavigate}
                  >
                    Sign up
                  </Button>
                </>
              )}

              {isOnAuth && (
                <Button
                  variant="ghost"
                  size="sm"
                  to={ROUTES.HOME}
                  onClick={onAnyNavigate}
                >
                  Back to site
                </Button>
              )}
            </div>
          )}

          <button
            type="button"
            className="navbar__burger"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="navbar__mobile">
          <nav className="navbar__nav navbar__nav--mobile" aria-label="Mobile">
            {marketingItems.map((item) => (
              <NavLink
                key={`m-${item.to}`}
                to={item.to}
                onClick={onAnyNavigate}
                className={({ isActive }) =>
                  cx("navbar__link", "navbar__link--mobile", isActive && "navbar__link--active")
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="navbar__mobile-sep" />

            {isAuthenticated ? (
              <>
                <NavLink
                  to={ROUTES.DASHBOARD.ROOT}
                  onClick={onAnyNavigate}
                  className="navbar__link navbar__link--mobile"
                >
                  Dashboard
                </NavLink>
                <button
                  type="button"
                  className="navbar__link navbar__link--mobile navbar__link--button"
                  onClick={() => {
                    signOut();
                    onAnyNavigate();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to={ROUTES.AUTH.SIGN_IN}
                  onClick={onAnyNavigate}
                  className="navbar__link navbar__link--mobile"
                >
                  Sign in
                </NavLink>
                <NavLink
                  to={ROUTES.AUTH.SIGN_UP}
                  onClick={onAnyNavigate}
                  className="navbar__link navbar__link--mobile"
                >
                  Sign up
                </NavLink>
              </>
            )}
          </nav>
        </div>
      )}

      <style>
        {`
          .navbar{
            position: sticky;
            top: 0;
            z-index: 40;
            background: color-mix(in oklab, var(--color-surface) 92%, transparent);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--color-border);
          }

          .navbar__inner{
            max-width: 1200px;
            margin: 0 auto;
            padding: 14px var(--space-4);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--space-4);
          }

          .navbar__left{
            display: flex;
            align-items: center;
            gap: var(--space-4);
          }

          .navbar__brand{
            display: inline-flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
          }

          .navbar__brand-mark{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 32px;
            width: 32px;
            border-radius: 10px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-weight: var(--fw-semibold);
            font-size: var(--fs-2);
            letter-spacing: 0.02em;
          }

          .navbar__brand-text{
            font-weight: var(--fw-semibold);
            font-size: var(--fs-4);
            color: var(--color-text);
          }

          .navbar__nav{
            display: flex;
            align-items: center;
            gap: var(--space-2);
          }

          .navbar__link{
            text-decoration: none;
            color: var(--color-text-muted);
            font-size: var(--fs-2);
            padding: 6px 8px;
            border-radius: 8px;
            transition: color 120ms ease, background 120ms ease;
          }

          .navbar__link:hover{
            color: var(--color-text);
            background: var(--color-elevated);
          }

          .navbar__link--active{
            color: var(--color-text);
            background: color-mix(in oklab, var(--color-primary) 12%, transparent);
            border: 1px solid color-mix(in oklab, var(--color-primary) 28%, transparent);
          }

          .navbar__right{
            display: flex;
            align-items: center;
            gap: var(--space-2);
          }

          .navbar__account,
          .navbar__auth{
            display: flex;
            align-items: center;
            gap: var(--space-2);
          }

          .navbar__account-pill{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            border-radius: var(--radius-pill);
            border: var(--border-1);
            background: var(--color-elevated);
            font-size: var(--fs-1);
          }

          .navbar__account-name{
            font-weight: var(--fw-medium);
          }

          .navbar__account-role{
            opacity: 0.8;
            padding-left: 6px;
            border-left: 1px solid var(--color-border);
          }

          .navbar__burger{
            display: none;
            height: 36px;
            width: 38px;
            border-radius: 10px;
            border: var(--border-1);
            background: var(--color-elevated);
            cursor: pointer;
            padding: 0 9px;
            gap: 4px;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }

          .navbar__burger span{
            display: block;
            height: 2px;
            width: 100%;
            background: var(--color-text);
            opacity: 0.8;
            border-radius: 2px;
          }

          .navbar__mobile{
            border-top: 1px solid var(--color-border);
            background: var(--color-surface);
          }

          .navbar__nav--mobile{
            max-width: 1200px;
            margin: 0 auto;
            padding: 10px var(--space-4) 18px;
            display: grid;
            gap: 6px;
          }

          .navbar__link--mobile{
            padding: 10px 10px;
            border-radius: 10px;
          }

          .navbar__link--button{
            text-align: left;
            background: transparent;
            border: 0;
            color: var(--color-text-muted);
            font: inherit;
            cursor: pointer;
          }

          .navbar__link--button:hover{
            color: var(--color-text);
            background: var(--color-elevated);
          }

          .navbar__mobile-sep{
            height: 1px;
            background: var(--color-border);
            margin: 6px 0;
          }

          @media (max-width: 980px){
            .navbar__nav--desktop{
              display: none;
            }
            .navbar__burger{
              display: inline-flex;
            }
            .navbar__account-pill{
              display: none;
            }
          }

          @media (max-width: 520px){
            .navbar__inner{
              padding-left: var(--space-3);
              padding-right: var(--space-3);
            }
          }
        `}
      </style>
    </header>
  );
}