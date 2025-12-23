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
  const { user } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link${isActive ? " active" : ""}`;

  return (
    <nav className="sidebar-nav">
      {/* ...existing sections... */}

      {user?.role === "admin" && (
        <div className="sidebar-section">
          <div className="sidebar-section__title">Administration</div>
          <NavLink to={ROUTES.DASHBOARD.ADMIN_USERS} className={linkClass}>
            Users
          </NavLink>
          <NavLink to={ROUTES.DASHBOARD.ADMIN_ANALYTICS} className={linkClass}>
            Analytics
          </NavLink>
        </div>
      )}
    </nav>
  );
}
