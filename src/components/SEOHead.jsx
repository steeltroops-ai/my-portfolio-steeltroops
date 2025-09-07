import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

const SEOHead = ({
  title = "Mayank's Portfolio",
  description = "Full-stack developer specializing in modern web technologies",
  image = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1200&auto=format&fit=crop",
  url = window.location.href,
  type = "website",
  author = "Mayank",
  publishedTime,
  modifiedTime,
  tags = [],
  canonical,
}) => {
  const siteTitle = "Mayank's Portfolio";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  const canonicalUrl = canonical || url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content="@steeltroops_ai" />
      <meta name="twitter:site" content="@steeltroops_ai" />

      {/* Article specific meta tags */}
      {type === "article" && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {modifiedTime && (
            <meta property="article:modified_time" content={modifiedTime} />
          )}
          {tags.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />

      {/* Structured Data for Blog Posts */}
      {type === "article" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: title,
            description: description,
            image: image,
            author: {
              "@type": "Person",
              name: author,
              url: "https://github.com/steeltroops-ai",
            },
            publisher: {
              "@type": "Person",
              name: author,
              url: "https://github.com/steeltroops-ai",
            },
            datePublished: publishedTime,
            dateModified: modifiedTime || publishedTime,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": url,
            },
            keywords: tags.join(", "),
          })}
        </script>
      )}

      {/* Structured Data for Website */}
      {type === "website" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteTitle,
            description: description,
            url: url,
            author: {
              "@type": "Person",
              name: author,
              url: "https://github.com/steeltroops-ai",
            },
          })}
        </script>
      )}
    </Helmet>
  );
};

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.string,
  author: PropTypes.string,
  publishedTime: PropTypes.string,
  modifiedTime: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  canonical: PropTypes.string,
};

export default SEOHead;
