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

  const FALLBACK = {
    en: {
      seoTitle: `${BRAND.productName} — Traceability & Export Marketplace`,
      seoDescription:
        "AgroTrust AZ helps Azerbaijani cooperatives export with confidence through digital traceability, QR product passports, and inspection-gated escrow.",

      eyebrow: "Agritech • B2B Export Trust",
      subtitlePrefix: BRAND.tagline,
      subtitleBody:
        "Empowering Azerbaijani cooperatives to export with confidence through digital traceability and inspection-gated escrow.",

      ctaPrimary: "Create account",
      ctaSecondary: "See how it works",

      pills: {
        passport: "Digital Product Passport",
        qr: "QR Verification",
        escrow: "Escrow Demo",
        coopFirst: "Cooperative-first",
      },

      solveTitle: "What we solve",
      solveItems: [
        "Small farmers struggle to prove origin, input usage, and harvest freshness to sophisticated buyers.",
        "Export opportunities are often lost to intermediaries with high margins.",
        "Trust gaps slow down procurement decisions and payments.",
      ],

      approachTitle: "Our approach",
      approachItems: [
        "Standardised lot records for cooperatives.",
        "QR-based Digital Product Passport for buyers.",
        "Escrow funds held and released after border inspection (MVP simulation).",
      ],

      sectionExportTitle: "Built for export readiness",
      sectionExportSubtitle:
        "A simple system that demonstrates a future-ready standard for traceability and compliance without overwhelming smaller producers.",

      cards: [
        {
          title: "Traceability by default",
          body: "Capture harvest dates, fertiliser declarations, and evidence photos in a consistent lot model. The goal is clarity for buyers and confidence for border inspection.",
        },
        {
          title: "Digital Product Passport",
          body: "Each lot can generate a QR payload that a buyer can verify instantly. In the hackathon MVP, verification is powered by Netlify Functions.",
        },
        {
          title: "Trust-centric payments",
          body: "Escrow reduces risk for both sides. Buyers know funds are only released on inspection pass; farmers gain a credible path to direct export.",
        },
      ],

      pathsTitle: "Two paths, one marketplace",
      pathsBody:
        "AgroTrust AZ is designed to scale across cooperatives and foreign procurement teams with a shared language of quality evidence and batch-level accountability.",
      pathsCtas: {
        farmers: "For farmers",
        buyers: "For buyers",
        dashboard: "Open demo dashboard",
      },

      stats: [
        {
          label: "MVP focus",
          value: "Tomatoes • Hazelnuts • Persimmons",
          body: "High-visibility products aligned with non-oil export priorities.",
        },
        {
          label: "Trust layer",
          value: "Inspection-gated escrow",
          body: "Demonstrated via simulated release rules in the hackathon build.",
        },
      ],

      ctaBlockTitle: "Ready to demo a passport?",
      ctaBlockBody:
        "Create a cooperative account, explore sample lots, and generate a Digital Product Passport in minutes.",
      ctaBlockPrimary: "Start as a cooperative",
      ctaBlockSecondary: "Sign in",
    },

    az: {
      seoTitle: `${BRAND.productName} — İzlənə bilənlik və İxrac Bazarı`,
      seoDescription:
        "AgroTrust AZ Azərbaycan kooperativlərinə rəqəmsal izlənə bilənlik, QR məhsul pasportları və yoxlama-şərtli escrow ilə ixracda etibar qazandırır.",

      eyebrow: "Aqritek • B2B İxrac Etibarı",
      subtitlePrefix: "İzlənə bilənlik • Keyfiyyət • İxrac etibarı",
      subtitleBody:
        "Azərbaycan kooperativlərinin rəqəmsal izlənə bilənlik və yoxlama-şərtli escrow ilə inamla ixrac etməsinə kömək edirik.",

      ctaPrimary: "Hesab yarat",
      ctaSecondary: "Necə işləyir",

      pills: {
        passport: "Rəqəmsal Məhsul Pasportu",
        qr: "QR Yoxlama",
        escrow: "Escrow Demo",
        coopFirst: "Kooperativ-yönümlü",
      },

      solveTitle: "Həll etdiyimiz problemlər",
      solveItems: [
        "Kiçik fermerlər mənşəyi, istifadə olunan inputları və məhsul təravətini alıcılara sübut etməkdə çətinlik çəkir.",
        "İxrac imkanları çox vaxt yüksək marjalı vasitəçilərə görə itirilir.",
        "Etibar boşluğu qərarları və ödənişləri ləngidir.",
      ],

      approachTitle: "Yanaşmamız",
      approachItems: [
        "Kooperativlər üçün standartlaşdırılmış partiya (lot) qeydləri.",
        "Alıcılar üçün QR əsaslı Məhsul Pasportu.",
        "Sərhəd yoxlamasından sonra buraxılan escrow (MVP simulyasiyası).",
      ],

      sectionExportTitle: "İxrac üçün hazırlandı",
      sectionExportSubtitle:
        "Kiçik istehsalçıları yormadan izlənə bilənlik və uyğunluq üçün gələcəyə hazır standartı nümayiş etdirən sadə sistem.",

      cards: [
        {
          title: "Default izlənə bilənlik",
          body: "Yığım tarixləri, gübrə bəyanları və sübut fotolarını vahid lot modelində toplayın. Məqsəd alıcı üçün aydınlıq, yoxlama üçün inamdır.",
        },
        {
          title: "Rəqəmsal Məhsul Pasportu",
          body: "Hər lot üçün alıcının dərhal yoxlaya biləcəyi QR məlumatı yaradılır. MVP-də yoxlama Netlify Functions ilə edilir.",
        },
        {
          title: "Etibarlı ödəniş modeli",
          body: "Escrow hər iki tərəf üçün riski azaldır: alıcı yalnız yoxlamadan sonra buraxılan ödənişə əmin olur, fermer isə birbaşa ixraca yol qazanır.",
        },
      ],

      pathsTitle: "İki tərəf, bir bazar",
      pathsBody:
        "AgroTrust AZ kooperativlər və xarici alıcı komandaları üçün keyfiyyət sübutu və partiya məsuliyyəti üzərində qurulmuş ortaq dil yaratmaq üçün dizayn edilib.",
      pathsCtas: {
        farmers: "Fermerlər üçün",
        buyers: "Alıcılar üçün",
        dashboard: "Demo paneli aç",
      },

      stats: [
        {
          label: "MVP fokus",
          value: "Pomidor • Fındıq • Xurma",
          body: "Qeyri-neft ixrac prioritetlərinə uyğun yüksək görünən məhsullar.",
        },
        {
          label: "Etibar qatı",
          value: "Yoxlamadan sonra escrow",
          body: "Hakaton quruluşunda simulyasiya edilmiş buraxılış qaydaları ilə göstərilir.",
        },
      ],

      ctaBlockTitle: "Pasport demoya hazırsınız?",
      ctaBlockBody:
        "Kooperativ hesabı yaradın, nümunə lotları yoxlayın və bir neçə dəqiqəyə Rəqəmsal Məhsul Pasportu hazırlayın.",
      ctaBlockPrimary: "Kooperativ kimi başla",
      ctaBlockSecondary: "Daxil ol",
    },
  } as const;

  const fb = language === "az" ? FALLBACK.az : FALLBACK.en;

  // If translation is missing, your i18n returns the key itself.
  const tr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const title = tr("marketing.home.seoTitle", fb.seoTitle);
  const description = tr("marketing.home.seoDescription", fb.seoDescription);

  const toggleLanguage = () => setLanguage(language === "en" ? "az" : "en");

  return (
    <>
      <Seo title={title} description={description} path="/" image="/og-image.png" />

      <div className="container">
        <section className="home-hero">
          <div className="home-hero__content">
            <div className="home-topbar">
              <p className="home-hero__eyebrow">
                {tr("marketing.home.eyebrow", fb.eyebrow)}
              </p>

              <button>{language === "en" ? "AZ" : "EN"}</button>
            </div>

            <h1 className="home-hero__title">{BRAND.productName}</h1>

            <p className="home-hero__subtitle">
              {tr("marketing.home.subtitlePrefix", fb.subtitlePrefix)}.{" "}
              {tr("marketing.home.subtitleBody", fb.subtitleBody)}
            </p>

            <div className="home-hero__actions">
              <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
                {tr("marketing.home.ctaPrimary", fb.ctaPrimary)}
              </NavLink>
              <NavLink to={ROUTES.HOW_IT_WORKS} className="btn btn--ghost">
                {tr("marketing.home.ctaSecondary", fb.ctaSecondary)}
              </NavLink>
            </div>

            <div className="home-hero__meta">
              <span className="home-pill">
                {tr("marketing.home.pills.passport", fb.pills.passport)}
              </span>
              <span className="home-pill">
                {tr("marketing.home.pills.qr", fb.pills.qr)}
              </span>
              <span className="home-pill">
                {tr("marketing.home.pills.escrow", fb.pills.escrow)}
              </span>
              <span className="home-pill">
                {tr("marketing.home.pills.coopFirst", fb.pills.coopFirst)}
              </span>
            </div>
          </div>

          <div className="home-hero__card card card--soft">
            <h3 className="home-card__title">
              {tr("marketing.home.solveTitle", fb.solveTitle)}
            </h3>

            <ul className="home-list">
              <li>{tr("marketing.home.solveItems.0", fb.solveItems[0])}</li>
              <li>{tr("marketing.home.solveItems.1", fb.solveItems[1])}</li>
              <li>{tr("marketing.home.solveItems.2", fb.solveItems[2])}</li>
            </ul>

            <div className="home-divider" />

            <h3 className="home-card__title">
              {tr("marketing.home.approachTitle", fb.approachTitle)}
            </h3>

            <ol className="home-list">
              <li>{tr("marketing.home.approachItems.0", fb.approachItems[0])}</li>
              <li>{tr("marketing.home.approachItems.1", fb.approachItems[1])}</li>
              <li>{tr("marketing.home.approachItems.2", fb.approachItems[2])}</li>
            </ol>
          </div>
        </section>

        <section className="home-section">
          <header className="home-section__header">
            <h2 className="home-section__title">
              {tr("marketing.home.sectionExportTitle", fb.sectionExportTitle)}
            </h2>
            <p className="home-section__subtitle muted">
              {tr("marketing.home.sectionExportSubtitle", fb.sectionExportSubtitle)}
            </p>
          </header>

          <div className="home-grid">
            <div className="card">
              <h3>{tr("marketing.home.cards.0.title", fb.cards[0].title)}</h3>
              <p className="muted">{tr("marketing.home.cards.0.body", fb.cards[0].body)}</p>
            </div>

            <div className="card">
              <h3>{tr("marketing.home.cards.1.title", fb.cards[1].title)}</h3>
              <p className="muted">{tr("marketing.home.cards.1.body", fb.cards[1].body)}</p>
            </div>

            <div className="card">
              <h3>{tr("marketing.home.cards.2.title", fb.cards[2].title)}</h3>
              <p className="muted">{tr("marketing.home.cards.2.body", fb.cards[2].body)}</p>
            </div>
          </div>
        </section>

        <section className="home-section">
          <div className="card home-highlight">
            <div className="home-highlight__content">
              <h2>{tr("marketing.home.pathsTitle", fb.pathsTitle)}</h2>
              <p className="muted">{tr("marketing.home.pathsBody", fb.pathsBody)}</p>

              <div className="home-highlight__actions">
                <NavLink to={ROUTES.FOR_FARMERS} className="btn btn--soft">
                  {tr("marketing.home.pathsCtas.farmers", fb.pathsCtas.farmers)}
                </NavLink>
                <NavLink to={ROUTES.FOR_BUYERS} className="btn btn--soft">
                  {tr("marketing.home.pathsCtas.buyers", fb.pathsCtas.buyers)}
                </NavLink>
                <NavLink to={ROUTES.DASHBOARD.OVERVIEW} className="btn btn--primary">
                  {tr("marketing.home.pathsCtas.dashboard", fb.pathsCtas.dashboard)}
                </NavLink>
              </div>
            </div>

            <div className="home-highlight__aside">
              <div className="home-stat card card--soft">
                <div className="home-stat__label">
                  {tr("marketing.home.stats.0.label", fb.stats[0].label)}
                </div>
                <div className="home-stat__value">
                  {tr("marketing.home.stats.0.value", fb.stats[0].value)}
                </div>
                <div className="muted">
                  {tr("marketing.home.stats.0.body", fb.stats[0].body)}
                </div>
              </div>

              <div className="home-stat card card--soft">
                <div className="home-stat__label">
                  {tr("marketing.home.stats.1.label", fb.stats[1].label)}
                </div>
                <div className="home-stat__value">
                  {tr("marketing.home.stats.1.value", fb.stats[1].value)}
                </div>
                <div className="muted">
                  {tr("marketing.home.stats.1.body", fb.stats[1].body)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section home-cta">
          <h2>{tr("marketing.home.ctaBlockTitle", fb.ctaBlockTitle)}</h2>
          <p className="muted">{tr("marketing.home.ctaBlockBody", fb.ctaBlockBody)}</p>

          <div className="home-cta__actions">
            <NavLink to={ROUTES.AUTH.SIGN_UP} className="btn btn--primary">
              {tr("marketing.home.ctaBlockPrimary", fb.ctaBlockPrimary)}
            </NavLink>
            <NavLink to={ROUTES.AUTH.SIGN_IN} className="btn btn--ghost">
              {tr("marketing.home.ctaBlockSecondary", fb.ctaBlockSecondary)}
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
