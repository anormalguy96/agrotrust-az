import { Outlet, NavLink } from "react-router-dom";

import { ROUTES } from "@/app/config/routes";
import { BRAND } from "@/app/config/constants";
import { useI18n } from "@/i18n/I18nProvider";

export function MarketingLayout() {
  return (
    <div className="layout-shell">
      <MarketingNav />
      <main className="layout-main">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}

function MarketingNav() {
  const { t, language, setLanguage } = useI18n();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link${isActive ? " active" : ""}`;

  return (
    <header className="nav-shell">
      <div className="container nav">
        <NavLink to={ROUTES.HOME} className="nav-brand">
          <span className="nav-brand-title">{BRAND.productName}</span>
          <span className="nav-brand-tagline">{BRAND.tagline}</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink to={ROUTES.HOME} end className={linkClass}>
            {t("nav.home")}
          </NavLink>
          <NavLink to={ROUTES.HOW_IT_WORKS} className={linkClass}>
            {t("nav.howItWorks")}
          </NavLink>
          <NavLink to={ROUTES.STANDARDS} className={linkClass}>
            {t("nav.standards")}
          </NavLink>
          <NavLink to={ROUTES.FOR_FARMERS} className={linkClass}>
            {t("nav.forFarmers")}
          </NavLink>
          <NavLink to={ROUTES.FOR_BUYERS} className={linkClass}>
            {t("nav.forBuyers")}
          </NavLink>
          <NavLink to={ROUTES.CONTACT} className={linkClass}>
            {t("nav.contact")}
          </NavLink>
        </nav>

        <div className="nav-actions">
          {/* Language toggle */}
          <div className="nav-lang-toggle" aria-label="Language selector">
            <button
              type="button"
              className={`nav-lang-btn${
                language === "az" ? " is-active" : ""
              }`}
              onClick={() => setLanguage("az")}
            >
              AZ
            </button>
            <button
              type="button"
              className={`nav-lang-btn${
                language === "en" ? " is-active" : ""
              }`}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
          </div>

          <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
            {t("nav.signIn")}
          </NavLink>
          <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
            {t("nav.signUp")}
          </NavLink>
        </div>
      </div>

      <style>
        {`
          .nav-shell{
            border-bottom: 1px solid var(--color-border);
            background: var(--color-surface);
          }

          .nav{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap: var(--space-4);
            padding-block: var(--space-3);
          }

          .nav-brand{
            display:flex;
            flex-direction:column;
            gap: 2px;
            text-decoration:none;
          }

          .nav-brand-title{
            font-weight: var(--fw-semibold);
            font-size: var(--fs-4);
          }

          .nav-brand-tagline{
            font-size: var(--fs-1);
            color: var(--color-text-soft);
          }

          .nav-links{
            display:flex;
            align-items:center;
            gap: var(--space-3);
            flex:1;
            justify-content:center;
          }

          .nav-link{
            font-size: var(--fs-2);
            color: var(--color-text-soft);
            text-decoration:none;
          }

          .nav-link.active{
            color: var(--color-text);
            font-weight: var(--fw-medium);
          }

          .nav-actions{
            display:flex;
            align-items:center;
            gap: var(--space-2);
          }

          .nav-lang-toggle{
            display:flex;
            border-radius: 999px;
            border: var(--border-1);
            overflow:hidden;
          }

          .nav-lang-btn{
            padding: 4px 8px;
            font-size: var(--fs-1);
            border:none;
            background: transparent;
            cursor:pointer;
          }

          .nav-lang-btn.is-active{
            background: var(--color-elevated);
            font-weight: var(--fw-medium);
          }

          @media (max-width: 960px){
            .nav{
              flex-wrap:wrap;
              align-items:flex-start;
            }

            .nav-links{
              order: 3;
              flex-wrap:wrap;
              justify-content:flex-start;
              width:100%;
            }
          }
        `}
      </style>
    </header>
  );
}

function MarketingFooter() {
  const { t } = useI18n();

  return (
    <footer className="marketing-footer">
      <div className="container marketing-footer-inner">
        <div className="marketing-footer-main">
          <div className="marketing-footer-title">{BRAND.productName}</div>
          <div className="marketing-footer-tagline">
            {t("footer.tagline")}
          </div>
          <div className="marketing-footer-copy">
            © {new Date().getFullYear()} {BRAND.productName}.{" "}
            {t("footer.copyright")}
          </div>
        </div>

        <nav className="marketing-footer-links">
          <NavLink to={ROUTES.HOW_IT_WORKS} className="nav-link">
            {t("footer.howItWorks")}
          </NavLink>
          <NavLink to={ROUTES.STANDARDS} className="nav-link">
            {t("footer.standards")}
          </NavLink>
          <NavLink to={ROUTES.CONTACT} className="nav-link">
            {t("footer.contact")}
          </NavLink>
        </nav>
      </div>

      <style>
        {`
          .marketing-footer{
            border-top: 1px solid var(--color-border);
            margin-top: var(--space-6);
            padding-block: var(--space-4);
            background: var(--color-surface-subtle);
          }

          .marketing-footer-inner{
            display:flex;
            justify-content:space-between;
            gap: var(--space-4);
            align-items:flex-start;
          }

          .marketing-footer-title{
            font-weight: var(--fw-semibold);
            font-size: var(--fs-3);
          }

          .marketing-footer-tagline{
            margin-top: 4px;
            font-size: var(--fs-2);
            color: var(--color-text-soft);
          }

          .marketing-footer-copy{
            margin-top: 8px;
            font-size: var(--fs-1);
            color: var(--color-text-muted);
          }

          .marketing-footer-links{
            display:flex;
            flex-direction:column;
            gap: var(--space-2);
          }

          @media (max-width: 780px){
            .marketing-footer-inner{
              flex-direction:column;
              align-items:flex-start;
            }
          }
        `}
      </style>
    </footer>
  );
}
