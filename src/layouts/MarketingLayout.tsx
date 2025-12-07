// agrotrust-az/src/layouts/MarketingLayout.tsx

import { Outlet, NavLink } from "react-router-dom";
import { ROUTES } from "@/app/config/routes";
import { BRAND } from "@/app/config/constants";

/**
 * MarketingLayout
 *
 * A lightweight public-facing shell for the hackathon MVP.
 * We keep navbar/footer inline for now to avoid dependency on
 * yet-to-be-implemented navigation components.
 *
 * Later, you can replace <MarketingNav /> and <MarketingFooter />
 * with shared components from /components/navigation.
 */
export function MarketingLayout() {
  return (
    <div className="app-shell marketing-shell">
      <MarketingNav />
      <main className="marketing-main">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}

function MarketingNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="marketing-header">
      <div className="container marketing-header__inner">
        <div className="brand">
          <span className="brand__name">{BRAND.productName}</span>
          <span className="brand__tagline">{BRAND.tagline}</span>
        </div>

        <nav className="marketing-nav">
          <NavLink to={ROUTES.HOME} className={linkClass} end>
            Home
          </NavLink>
          <NavLink to={ROUTES.HOW_IT_WORKS} className={linkClass}>
            How it works
          </NavLink>
          <NavLink to={ROUTES.STANDARDS} className={linkClass}>
            Standards
          </NavLink>
          <NavLink to={ROUTES.FOR_FARMERS} className={linkClass}>
            For farmers
          </NavLink>
          <NavLink to={ROUTES.FOR_BUYERS} className={linkClass}>
            For buyers
          </NavLink>
          <NavLink to={ROUTES.CONTACT} className={linkClass}>
            Contact
          </NavLink>
        </nav>

        <div className="marketing-header__actions">
          <NavLink to={ROUTES.AUTH.SIGN_IN} className="nav-link">
            Sign in
          </NavLink>
          <NavLink to={ROUTES.AUTH.SIGN_UP} className="nav-link nav-link--cta">
            Create account
          </NavLink>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container marketing-footer__inner">
        <div>
          <strong>{BRAND.productName}</strong>
          <div className="muted">
            Traceability • Quality • Export trust
          </div>
        </div>

        <div className="marketing-footer__links">
          <NavLink to={ROUTES.HOW_IT_WORKS} className="footer-link">
            How it works
          </NavLink>
          <NavLink to={ROUTES.STANDARDS} className="footer-link">
            Standards
          </NavLink>
          <NavLink to={ROUTES.CONTACT} className="footer-link">
            Contact
          </NavLink>
        </div>

        <div className="muted">
          © {new Date().getFullYear()} {BRAND.productName}. Hackathon MVP.
        </div>
      </div>
    </footer>
  );
}
