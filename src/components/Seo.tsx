import { Helmet } from "react-helmet-async";

type SeoProps = {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
};

const SITE_URL = "https://agrotrust-az.netlify.app";

export function Seo({
  title,
  description,
  path = "/",
  image = "/og-image.png",
  noindex = false,
}: SeoProps) {
  const url = `${SITE_URL}${path}`;
  const imgUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{title}</title>

      {description ? <meta name="description" content={description} /> : null}
      <link rel="canonical" href={url} />

      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}

      {/* Open graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="AgroTrust AZ" />
      <meta property="og:title" content={title} />
      {description ? <meta property="og:description" content={description} /> : null}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imgUrl} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description ? <meta name="twitter:description" content={description} /> : null}
      <meta name="twitter:image" content={imgUrl} />
    </Helmet>
  );
}