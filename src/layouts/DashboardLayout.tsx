// agrotrust-az/src/layouts/DashboardLayout.tsx

import { Outlet, NavLink, useNavigate } from "react-router-dom";

import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useAuth } from "@/hooks/useAuth";

/**
 * DashboardLayout
 *
 * Authenticated shell for cooperative/buyer/admin users.
 * For the hackathon MVP, we keep the sidebar + topbar inline
 * to avoid dependency on yet-to-be-created navigation components.
 *
 * Later you can replace these with:
 * - /components/navigation/Sidebar
 * - /components/navigation/Navbar (dashboard variant)
 */
export function DashboardLayout() {
  const navigate = useNavigate();
  const { user, signOut, getRoleLabel } = useAuth();

  const handleSignOut = () => {
    signOut();
    navigate(ROUTES.HOME, { replace: true });
  };

  return (
    <div className="app-shell dashboard-shell">
      <header className="dashboard-topbar">
        <div className="container dashboard-topbar__inner">
          <div className="brand brand--compact">
            <span className="brand__name">{BRAND.productName}</span>
            <span className="brand__tagline">Dashboard</span>
          </div>

          <div className="dashboard-topbar__user">
            <div className="user-pill">
              <span className="user-pill__name">
                {user?.name ?? "User"}
              </span>
              <span className="user-pill__role">
                {getRoleLabel(user?.role)}
              </span>
            </div>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <SidebarNav />
        </aside>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? " active" : ""}`;

  return (
    <nav className="sidebar-nav">
      <div className="sidebar-section">
        <div className="sidebar-section__title">Overview</div>
        <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className={linkClass} end>
          Dashboard home
        </NavLink>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section__title">Traceability</div>
        <NavLink to={ROUTES.DASHBOARD.LOTS} className={linkClass}>
          Product lots
        </NavLink>
        <NavLink to={ROUTES.DASHBOARD.COOPERATIVES} className={linkClass}>
          Cooperatives
        </NavLink>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section__title">Marketplace</div>
        <NavLink to={ROUTES.DASHBOARD.BUYERS} className={linkClass}>
          Buyers
        </NavLink>
        <NavLink to={ROUTES.DASHBOARD.RFQS} className={linkClass}>
          RFQs
        </NavLink>
        <NavLink to={ROUTES.DASHBOARD.CONTRACTS} className={linkClass}>
          Contracts
        </NavLink>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section__title">Account</div>
        <NavLink to={ROUTES.DASHBOARD.SETTINGS} className={linkClass}>
          Settings
        </NavLink>
      </div>
    </nav>
  );
}