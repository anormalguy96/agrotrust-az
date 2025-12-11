import { NavLink } from "react-router-dom";
import { ROUTES } from "@/app/config/routes";
import { BRAND } from "@/app/config/constants";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";

type SideItem = {
  label: string;
  to: string;
  end?: boolean;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Sidebar() {
  const { user, signOut, getRoleLabel } = useAuth();

  const items: SideItem[] = [
    { label: "Overview", to: ROUTES.DASHBOARD.OVERVIEW, end: true },
    { label: "Lots", to: ROUTES.DASHBOARD.LOTS },
    { label: "Cooperatives", to: ROUTES.DASHBOARD.COOPERATIVES },
    { label: "Buyers", to: ROUTES.DASHBOARD.BUYERS },
    { label: "RFQs", to: ROUTES.DASHBOARD.RFQS },
    { label: "Contracts", to: ROUTES.DASHBOARD.CONTRACTS },
    { label: "Settings", to: ROUTES.DASHBOARD.SETTINGS }
  ];

  const roleLabel =
    typeof getRoleLabel === "function" ? getRoleLabel(user?.role) : user?.role;

  const isAdmin = user?.role === "admin";

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-mark" aria-hidden="true">
          AT
        </div>
        <div className="sidebar__brand-text">
          <div className="sidebar__brand-name">{BRAND.productName}</div>
          <div className="muted sidebar__brand-sub">Dashboard</div>
        </div>
      </div>

      <div className="sidebar__account">
        <div className="sidebar__account-pill">
          <div className="sidebar__account-name">
            {user?.name ?? "Demo user"}
          </div>
          <div className="muted sidebar__account-role">
            {roleLabel ?? "Guest"}
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="sidebar__nav" aria-label="Dashboard">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx("sidebar__link", isActive && "sidebar__link--active")
            }
          >
            <span className="sidebar__link-dot" aria-hidden="true" />
            <span className="sidebar__link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Admin-only section */}
      {isAdmin && (
        <div className="sidebar__admin-section">
          <div className="sidebar__section-title">Admin</div>

          <NavLink
            to={ROUTES.DASHBOARD.ADMIN_USERS}
            className={({ isActive }) =>
              cx("sidebar__link", isActive && "sidebar__link--active")
            }
          >
            <span className="sidebar__link-dot" aria-hidden="true" />
            <span className="sidebar__link-label">Users</span>
          </NavLink>

          <NavLink
            to={ROUTES.DASHBOARD.ADMIN_ANALYTICS}
            className={({ isActive }) =>
              cx("sidebar__link", isActive && "sidebar__link--active")
            }
          >
            <span className="sidebar__link-dot" aria-hidden="true" />
            <span className="sidebar__link-label">Analytics</span>
          </NavLink>
        </div>
      )}

      <div className="sidebar__spacer" />

      <div className="sidebar__actions">
        <Button
          variant="ghost"
          size="sm"
          to={ROUTES.HOME}
          title="Return to marketing site"
        >
          Back to site
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          title="Sign out of the demo session"
        >
          Sign out
        </Button>
      </div>

      <style>
        {`
          .sidebar{
            position: sticky;
            top: 0;
            height: 100dvh;
            min-width: 260px;
            max-width: 260px;
            padding: var(--space-4);
            border-right: 1px solid var(--color-border);
            background: var(--color-surface);
            display: flex;
            flex-direction: column;
            gap: var(--space-4);
          }

          .sidebar__brand{
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding-bottom: var(--space-3);
            border-bottom: 1px solid var(--color-border);
          }

          .sidebar__brand-mark{
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            width: 36px;
            border-radius: 10px;
            border: var(--border-1);
            background: var(--color-elevated);
            font-weight: var(--fw-semibold);
            font-size: var(--fs-2);
            letter-spacing: 0.02em;
          }

          .sidebar__brand-name{
            font-size: var(--fs-4);
            font-weight: var(--fw-semibold);
            line-height: 1.1;
          }

          .sidebar__brand-sub{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .sidebar__account-pill{
            border: var(--border-1);
            background: var(--color-elevated);
            border-radius: var(--radius-1);
            padding: var(--space-3);
          }

          .sidebar__account-name{
            font-size: var(--fs-3);
            font-weight: var(--fw-medium);
          }

          .sidebar__account-role{
            font-size: var(--fs-1);
            margin-top: 2px;
          }

          .sidebar__nav{
            display: grid;
            gap: 6px;
          }

          /* Admin section reuses same link styles but has a small title and separator */
          .sidebar__admin-section{
            margin-top: var(--space-3);
            padding-top: var(--space-3);
            border-top: 1px solid var(--color-border);
            display: grid;
            gap: 6px;
          }

          .sidebar__section-title{
            font-size: var(--fs-1);
            font-weight: var(--fw-semibold);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--color-text-soft);
          }

          .sidebar__link{
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 10px 10px;
            border-radius: 10px;
            text-decoration: none;
            color: var(--color-text-muted);
            border: 1px solid transparent;
            transition: color 120ms ease, background 120ms ease, border-color 120ms ease;
          }

          .sidebar__link:hover{
            color: var(--color-text);
            background: var(--color-elevated);
          }

          .sidebar__link--active{
            color: var(--color-text);
            background: color-mix(in oklab, var(--color-primary) 10%, transparent);
            border-color: color-mix(in oklab, var(--color-primary) 28%, transparent);
          }

          .sidebar__link-dot{
            height: 8px;
            width: 8px;
            border-radius: 999px;
            background: currentColor;
            opacity: 0.25;
          }

          .sidebar__link--active .sidebar__link-dot{
            opacity: 0.9;
          }

          .sidebar__actions{
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }

          .sidebar__spacer{
            flex: 1;
          }

          @media (max-width: 1080px){
            .sidebar{
              min-width: 220px;
              max-width: 220px;
            }
          }

          @media (max-width: 880px){
            .sidebar{
              position: static;
              height: auto;
              min-width: 100%;
              max-width: 100%;
              border-right: 0;
              border-bottom: 1px solid var(--color-border);
              flex-direction: row;
              align-items: center;
              flex-wrap: wrap;
            }

            .sidebar__brand{
              border-bottom: 0;
              padding-bottom: 0;
            }

            .sidebar__account{
              display: none;
            }

            .sidebar__nav{
              grid-auto-flow: column;
              grid-auto-columns: max-content;
              overflow-x: auto;
              gap: 8px;
              padding: 4px 0;
            }

            .sidebar__admin-section{
              border-top: 0;
            }

            .sidebar__spacer{
              display: none;
            }

            .sidebar__actions{
              flex-direction: row;
            }
          }
        `}
      </style>
    </aside>
  );
}
