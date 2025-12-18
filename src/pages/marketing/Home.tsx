import { Seo } from "@/components/Seo";
import { NavLink } from "react-router-dom";
import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useI18n } from "@/i18n/I18nProvider";


function Home() {
  const { t } = useI18n();
  
  const tt = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const title = tt(
    "marketing.home.seoTitle",
    `${BRAND.productName} — Traceability & Export Marketplace`
  );

  const description = tt(
    "marketing.home.seoDescription",
    "AgroTrust AZ helps Azerbaijani cooperatives export with confidence through digital traceability, QR product passports, and inspection-gated escrow."
  );

  return (
    <>
      <Seo title={title} description={description} path="/" image="/og-image.png" />

      <div className="container">
        <section className="home-hero">
          <div className="home-hero__content">
            <p className="home-hero__eyebrow">
              {tt("marketing.home.eyebrow", "Agritech • B2B Export Trust")}
            </p>

            <h1 className="home-hero__title">{BRAND.productName}</h1>

            <p className="home-hero__subtitle">
              {tt("marketing.home.subtitlePrefix", BRAND.tagline)}
              {". "}
              {tt(
                "marketing.home.subtitleBody",
                "Empowering Azerbaijani cooperatives to export with confidence through digital traceability and inspection-gated escrow."
              )}
            </p>

            <div className="home-hero__actions">
              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
                {tt("marketing.home.ctaPrimary", "Create account")}
              </NavLink>

              <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
                {tt("marketing.home.ctaSecondary", "See how it works")}
              </NavLink>
            </div>

            <div className="home-hero__meta">
              <span className="home-pill">
                {tt("marketing.home.pills.passport", "Digital Product Passport")}
              </span>
              <span className="home-pill">
                {tt("marketing.home.pills.qr", "QR Verification")}
              </span>
              <span className="home-pill">
                {tt("marketing.home.pills.escrow", "Escrow Demo")}
              </span>
              <span className="home-pill">
                {tt("marketing.home.pills.coopFirst", "Cooperative-first")}
              </span>
            </div>
          </div>

          <div className="home-hero__card card card--soft">
            <h3 className="home-card__title">
              {tt("marketing.home.solveTitle", "What we solve")}
            </h3>

            <ul className="home-list">
              <li>
                {tt(
                  "marketing.home.solveItems.0",
                  "Small farmers struggle to prove origin, input usage, and harvest freshness to sophisticated buyers."
                )}
              </li>
              <li>
                {tt(
                  "marketing.home.solveItems.1",
                  "Export opportunities are often lost to intermediaries with high margins."
                )}
              </li>
              <li>
                {tt(
                  "marketing.home.solveItems.2",
                  "Trust gaps slow down procurement decisions and payments."
                )}
              </li>
            </ul>

            <div className="home-divider" />

            <h3 className="home-card__title">
              {tt("marketing.home.approachTitle", "Our approach")}
            </h3>

            <ol className="home-list">
              <li>
                {tt(
                  "marketing.home.approachItems.0",
                  "Standardised lot records for cooperatives."
                )}
              </li>
              <li>
                {tt(
                  "marketing.home.approachItems.1",
                  "QR-based Digital Product Passport for buyers."
                )}
              </li>
              <li>
                {tt(
                  "marketing.home.approachItems.2",
                  "Escrow funds held and released after border inspection (MVP simulation)."
                )}
              </li>
            </ol>
          </div>
        </section>

        <section className="home-section">
          <header className="home-section__header">
            <h2 className="home-section__title">
              {tt("marketing.home.sectionExportTitle", "Built for export readiness")}
            </h2>
            <p className="home-section__subtitle muted">
              {tt(
                "marketing.home.sectionExportSubtitle",
                "A simple system that demonstrates a future-ready standard for traceability and compliance without overwhelming smaller producers."
              )}
            </p>
          </header>

          <div className="home-grid">
            <div className="card">
              <h3>{tt("marketing.home.cards.0.title", "Traceability by default")}</h3>
              <p className="muted">
                {tt(
                  "marketing.home.cards.0.body",
                  "Capture harvest dates, fertiliser declarations, and evidence photos in a consistent lot model. The goal is clarity for buyers and confidence for border inspection."
                )}
              </p>
            </div>

            <div className="card">
              <h3>{tt("marketing.home.cards.1.title", "Digital Product Passport")}</h3>
              <p className="muted">
                {tt(
                  "marketing.home.cards.1.body",
                  "Each lot can generate a QR payload that a buyer can verify instantly. In the hackathon MVP, verification is powered by Netlify Functions."
                )}
              </p>
            </div>

            <div className="card">
              <h3>{tt("marketing.home.cards.2.title", "Trust-centric payments")}</h3>
              <p className="muted">
                {tt(
                  "marketing.home.cards.2.body",
                  "Escrow reduces risk for both sides. Buyers know funds are only released on inspection pass; farmers gain a credible path to direct export."
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="card home-highlight">
            <div className="home-highlight__content">
              <h2>{tt("marketing.home.pathsTitle", "Two paths, one marketplace")}</h2>
              <p className="muted">
                {tt(
                  "marketing.home.pathsBody",
                  "AgroTrust AZ is designed to scale across cooperatives and foreign procurement teams with a shared language of quality evidence and batch-level accountability."
                )}
              </p>

              <div className="home-highlight__actions">
                <NavLink to={ROUTES.FOR_FARMERS} className="btn btn--soft">
                  {tt("marketing.home.pathsCtas.farmers", "For farmers")}
                </NavLink>
                <NavLink to={ROUTES.FOR_BUYERS} className="btn btn--soft">
                  {tt("marketing.home.pathsCtas.buyers", "For buyers")}
                </NavLink>
                <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--primary">
                  {tt("marketing.home.pathsCtas.dashboard", "Open demo dashboard")}
                </NavLink>
              </div>
            </div>

            <div className="home-highlight__aside">
              <div className="home-stat card card--soft">
                <div className="home-stat__label">
                  {tt("marketing.home.stats.0.label", "MVP focus")}
                </div>
                <div className="home-stat__value">
                  {tt("marketing.home.stats.0.value", "Tomatoes • Hazelnuts • Persimmons")}
                </div>
                <div className="muted">
                  {tt(
                    "marketing.home.stats.0.body",
                    "High-visibility products aligned with non-oil export priorities."
                  )}
                </div>
              </div>

              <div className="home-stat card card--soft">
                <div className="home-stat__label">
                  {tt("marketing.home.stats.1.label", "Trust layer")}
                </div>
                <div className="home-stat__value">
                  {tt("marketing.home.stats.1.value", "Inspection-gated escrow")}
                </div>
                <div className="muted">
                  {tt(
                    "marketing.home.stats.1.body",
                    "Demonstrated via simulated release rules in the hackathon build."
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-cta">
          <h2>{tt("marketing.home.ctaBlockTitle", "Ready to demo a passport?")}</h2>
          <p className="muted">
            {tt(
              "marketing.home.ctaBlockBody",
              "Create a cooperative account, explore sample lots, and generate a Digital Product Passport in minutes."
            )}
          </p>

          <div className="home-cta__actions">
            <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
              {tt("marketing.home.ctaBlockPrimary", "Start as a cooperative")}
            </NavLink>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
              {tt("marketing.home.ctaBlockSecondary", "Sign in")}
            </NavLink>
          </div>
        </section>

        <style>
          {`
            .home-hero{
              display:grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: var(--space-6);
              align-items:start;
            }
            .home-hero__eyebrow{
              font-size: var(--fs-1);
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--color-text-soft);
              margin: 0 0 var(--space-2);
            }
            .home-hero__title{
              font-size: var(--fs-8);
              line-height: var(--lh-tight);
              margin: 0 0 var(--space-2);
            }
            .home-hero__subtitle{
              font-size: var(--fs-4);
              color: var(--color-text-muted);
              margin: 0 0 var(--space-4);
            }
            .home-hero__actions{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
              margin-bottom: var(--space-4);
            }
            .home-hero__meta{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
            }
            .home-pill{
              display:inline-flex;
              align-items:center;
              padding: 4px 10px;
              border-radius: var(--radius-pill);
              background: var(--color-surface);
              border: var(--border-1);
              font-size: var(--fs-1);
              color: var(--color-text-muted);
            }
            .home-card__title{
              margin: 0 0 var(--space-2);
              font-size: var(--fs-3);
            }
            .home-list{
              margin: 0;
              padding-left: 1.1rem;
              display:flex;
              flex-direction: column;
              gap: var(--space-2);
              color: var(--color-text-muted);
              font-size: var(--fs-2);
            }
            .home-divider{
              height: 1px;
              background: var(--color-border);
              margin: var(--space-4) 0;
            }
            .home-section{
              margin-top: var(--space-7);
            }
            .home-section__header{
              margin-bottom: var(--space-4);
            }
            .home-section__title{
              margin: 0 0 var(--space-2);
              font-size: var(--fs-6);
            }
            .home-section__subtitle{
              margin: 0;
            }
            .home-grid{
              display:grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: var(--space-4);
            }
            .home-highlight{
              display:grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: var(--space-5);
            }
            .home-highlight__actions{
              display:flex;
              gap: var(--space-2);
              flex-wrap: wrap;
              margin-top: var(--space-3);
            }
            .home-highlight__aside{
              display:flex;
              flex-direction: column;
              gap: var(--space-3);
            }
            .home-stat__label{
              font-size: var(--fs-1);
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: var(--color-text-soft);
            }
            .home-stat__value{
              font-size: var(--fs-4);
              font-weight: var(--fw-semibold);
              margin: var(--space-1) 0 var(--space-2);
            }
            .home-cta{
              text-align: center;
              padding: var(--space-7) 0 var(--space-6);
            }
            .home-cta__actions{
              display:flex;
              gap: var(--space-2);
              justify-content: center;
              flex-wrap: wrap;
              margin-top: var(--space-3);
            }

            @media (max-width: 980px){
              .home-hero{
                grid-template-columns: 1fr;
              }
              .home-grid{
                grid-template-columns: 1fr;
              }
              .home-highlight{
                grid-template-columns: 1fr;
              }
            }
          `}
        </style>
      </div>
    </>
  );
}

export { Home };
export default Home;
