import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";
import {
  SITE_META,
  PROJECTS,
  EXPERIENCES,
  PERSONAL,
  SOCIALS,
  IMAGES,
} from "@/constants";

const SEOHead = ({
  title,
  description = SITE_META.description,
  image = SITE_META.ogImage,
  url = window.location.href,
  type = "website",
  author = PERSONAL.name,
  publishedTime,
  modifiedTime,
  tags = [],
  canonical,
  noindex = false,
}) => {
  const siteTitle = SITE_META.title;
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const canonicalUrl = canonical || url;

  // Dynamic knowledge areas
  const knowsAbout = [
    ...new Set([
      "Software Engineering",
      "Robotics",
      "Machine Learning",
      "Full Stack Development",
      ...PROJECTS.flatMap((p) => p.technologies),
      ...EXPERIENCES.flatMap((e) => e.technologies),
    ]),
  ].slice(0, 20);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={SITE_META.keywords} />
      <meta name="author" content={author} />
      <meta
        name="google-site-verification"
        content="vycsFH0oxZh3hYxinQ1JGOghyPymDAt4tkDFdKk-V7M"
      />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="icon" type="image/png" href={IMAGES.favicon} />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

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
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow" />
          <meta name="googlebot" content="index, follow" />
        </>
      )}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />

      {/* Profile Page Schema (Excellent for "Search by Name") */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          mainEntity: {
            "@type": "Person",
            name: PERSONAL.name,
            alternateName: PERSONAL.username.replace("@", ""),
            description: description,
            image: SITE_META.ogImage,
            jobTitle: PERSONAL.role,
            url: SITE_META.siteUrl,
            email: "steeltroops.ai@gmail.com",
            address: {
              "@type": "PostalAddress",
              addressLocality: PERSONAL.location,
              addressCountry: "IN",
            },
            knowsAbout: knowsAbout,
            sameAs: Object.values(SOCIALS),
            alumniOf: {
              "@type": "CollegeOrUniversity",
              name: PERSONAL.university,
              url: "https://www.gla.ac.in/",
            },
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "professional",
              email: "steeltroops.ai@gmail.com",
              url: `${SITE_META.siteUrl}/#contact`,
            },
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Engineering Solutions",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Full Stack Development",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Robotics Systems (ROS2)",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "MLOps & AI Integration",
                  },
                },
              ],
            },
          },
        })}
      </script>

      {/* Project Catalog Schema (Dynamic) */}
      {type === "website" && !title && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${PERSONAL.name}'s Engineering Projects`,
            description: `Production-ready software, robotics, and ML systems developed by ${PERSONAL.name}.`,
            itemListElement: PROJECTS.slice(0, 10).map((project, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "SoftwareApplication",
                name: project.title,
                description: Array.isArray(project.description)
                  ? project.description[0]
                  : project.description,
                applicationCategory: "SoftwareDevelopment",
                operatingSystem: "Web",
                url: project.url || undefined,
              },
            })),
          })}
        </script>
      )}

      {/* Work Experience Schema (Dynamic) */}
      {type === "website" && !title && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `${PERSONAL.name}'s Professional Experience`,
            itemListElement: EXPERIENCES.map((exp, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "OrganizationRole",
                roleName: exp.role,
                startDate: exp.year.split(" - ")[0],
                endDate: exp.year.split(" - ")[1] || "Present",
                memberOf: {
                  "@type": "Organization",
                  name: exp.company,
                },
              },
            })),
          })}
        </script>
      )}

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
              url: SOCIALS.github,
            },
            publisher: {
              "@type": "Person",
              name: author,
              url: SOCIALS.github,
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
      {type === "website" && !title && (
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
              url: SOCIALS.github,
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
  noindex: PropTypes.bool,
};

export default SEOHead;
