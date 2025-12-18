import { Seo } from "@/components/Seo";
import { NavLink } from "react-router-dom";
import { BRAND } from "@/app/config/constants";
import { ROUTES } from "@/app/config/routes";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Home (Marketing)
 *
 * Public landing page for AgroTrust AZ.
 * Focus: trust, traceability, export enablement for SMEs/cooperatives.
 */
function Home() {
  const { t, language, setLanguage } = useI18n();

  const title =
    t("marketing.home.seoTitle") ||
    `${BRAND.productName} — Traceability & Export Marketplace`;

  const description =
    t("marketing.home.seoDescription") ||
    "AgroTrust AZ helps Azerbaijani cooperatives export with confidence through digital traceability, QR product passports, and inspection-gated escrow.";

  const toggleLanguage = () => setLanguage(language === "en" ? "az" : "en");

  return (
    <>
      <Seo title={title} description={description} path="/" image="/og-image.png" />

      <div className="container">
        <section className="home-hero">
          <div className="home-hero__content">
            <div className="home-topbar">
              <p className="home-hero__eyebrow">{t("marketing.home.eyebrow")}</p>

              <button
                type="button"
                className="btn btn--ghost home-lang"
                onClick={toggleLanguage}
                aria-label="Switch language"
                title="Switch language"
              >
                {language === "en" ? "AZ" : "EN"}
              </button>
            </div>

            <h1 className="home-hero__title">{BRAND.productName}</h1>

            <p className="home-hero__subtitle">
              {t("marketing.home.subtitlePrefix")} {BRAND.productName}{" "}
              {t("marketing.home.subtitleBody")}
            </p>

            <div className="home-hero__actions">
              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
                {t("marketing.home.ctaPrimary")}
              </NavLink>
              <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
                {t("marketing.home.ctaSecondary")}
              </NavLink>
            </div>

            <div className="home-hero__meta">
              <span className="home-pill">{t("marketing.home.pills.passport")}</span>
              <span className="home-pill">{t("marketing.home.pills.qr")}</span>
              <span className="home-pill">{t("marketing.home.pills.escrow")}</span>
              <span className="home-pill">{t("marketing.home.pills.coopFirst")}</span>
            </div>
          </div>

          <div className="home-hero__card card card--soft">
            <h3 className="home-card__title">{t("marketing.home.solveTitle")}</h3>
            <ul className="home-list">
              <li>{t("marketing.home.solveItems.0")}</li>
              <li>{t("marketing.home.solveItems.1")}</li>
              <li>{t("marketing.home.solveItems.2")}</li>
            </ul>

            <div className="home-divider" />

            <h3 className="home-card__title">{t("marketing.home.approachTitle")}</h3>
            <ol className="home-list">
              <li>{t("marketing.home.approachItems.0")}</li>
              <li>{t("marketing.home.approachItems.1")}</li>
              <li>{t("marketing.home.approachItems.2")}</li>
            </ol>
          </div>
        </section>

        <section className="home-section">
          <header className="home-section__header">
            <h2 className="home-section__title">{t("marketing.home.sectionExportTitle")}</h2>
            <p className="home-section__subtitle muted">{t("marketing.home.sectionExportSubtitle")}</p>
          </header>

          <div className="home-grid">
            <div className="card">
              <h3>{t("marketing.home.cards.0.title")}</h3>
              <p className="muted">{t("marketing.home.cards.0.body")}</p>
            </div>

            <div className="card">
              <h3>{t("marketing.home.cards.1.title")}</h3>
              <p className="muted">{t("marketing.home.cards.1.body")}</p>
            </div>

            <div className="card">
              <h3>{t("marketing.home.cards.2.title")}</h3>
              <p className="muted">{t("marketing.home.cards.2.body")}</p>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="card home-highlight">
            <div className="home-highlight__content">
              <h2>{t("marketing.home.pathsTitle")}</h2>
              <p className="muted">{t("marketing.home.pathsBody")}</p>

              <div className="home-highlight__actions">
                <NavLink to={ROUTES.FOR_FARMERS} className="btn btn--soft">
                  {t("marketing.home.pathsCtas.farmers")}
                </NavLink>
                <NavLink to={ROUTES.FOR_BUYERS} className="btn btn--soft">
                  {t("marketing.home.pathsCtas.buyers")}
                </NavLink>
                <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--primary">
                  {t("marketing.home.pathsCtas.dashboard")}
                </NavLink>
              </div>
            </div>

            <div className="home-highlight__aside">
              <div className="home-stat card card--soft">
                <div className="home-stat__label">{t("marketing.home.stats.0.label")}</div>
                <div className="home-stat__value">{t("marketing.home.stats.0.value")}</div>
                <div className="muted">{t("marketing.home.stats.0.body")}</div>
              </div>

              <div className="home-stat card card--soft">
                <div className="home-stat__label">{t("marketing.home.stats.1.label")}</div>
                <div className="home-stat__value">{t("marketing.home.stats.1.value")}</div>
                <div className="muted">{t("marketing.home.stats.1.body")}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-cta">
          <h2>{t("marketing.home.ctaBlockTitle")}</h2>
          <p className="muted">{t("marketing.home.ctaBlockBody")}</p>
          <div className="home-cta__actions">
            <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
              {t("marketing.home.ctaBlockPrimary")}
            </NavLink>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
              {t("marketing.home.ctaBlockSecondary")}
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

            .home-topbar{
              display:flex;
              align-items:center;
              justify-content: space-between;
              gap: var(--space-2);
              margin: 0 0 var(--space-2);
            }

            .home-lang{
              height: 30px;
              padding: 0 10px;
              border-radius: var(--radius-pill);
              font-size: var(--fs-1);
              white-space: nowrap;
            }

            .home-hero__eyebrow{
              font-size: var(--fs-1);
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: var(--color-text-soft);
              margin: 0;
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
