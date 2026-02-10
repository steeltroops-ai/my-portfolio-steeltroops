import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

const SEOHead = ({
  title,
  description = "Full-stack developer specializing in modern web technologies",
  image = "/profiletop.png",
  url = window.location.href,
  type = "website",
  author = "Mayank Pratap Singh",
  publishedTime,
  modifiedTime,
  tags = [],
  canonical,
  noindex = false,
}) => {
  const siteTitle = "Mayank Pratap Singh";
  const tagline = "Full Stack & ML Engineer";
  const fullTitle = title
    ? `${title} | ${siteTitle}`
    : `${siteTitle} | ${tagline}`;
  const canonicalUrl = canonical || url;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="author" content={author} />
      <meta
        name="google-site-verification"
        content="WtqIeJ3OPzTXWudVsHyl_IAlSC7EwGhyw1Arv3Fx-8o"
      />
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
            name: "Mayank Pratap Singh",
            alternateName: "steeltroops",
            description: description,
            image: "https://steeltroops.vercel.app/profiletop.png",
            jobTitle: "Full Stack & Machine Learning Engineer",
            url: "https://steeltroops.vercel.app",
            knowsAbout: [
              "React",
              "Node.js",
              "Next.js",
              "TypeScript",
              "Python",
              "Machine Learning",
              "Robotics",
              "ROS2",
              "SLAM",
              "C++",
              "Computer Vision",
              "Unreal Engine 5",
              "WebGL",
            ],
            sameAs: [
              "https://github.com/steeltroops-ai",
              "https://linkedin.com/in/steeltroops-ai",
              "https://x.com/steeltroops_ai",
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Software Engineering Services",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Full Stack Web Development",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Robotics & ROS2 Integration",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Machine Learning Solutions",
                  },
                },
              ],
            },
          },
        })}
      </script>

      {/* Project Catalog Schema (Rich Snippets for Projects) */}
      {type === "website" && !title && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Mayank Pratap Singh's Portfolio Projects",
            description:
              "A collection of software engineering, robotics, and machine learning projects.",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                item: {
                  "@type": "CreativeWork",
                  name: "MediLens Clinical Intelligence Platform",
                  description:
                    "Distributed clinical research platform integrating medical imaging and speech biomarkers.",
                },
              },
              {
                "@type": "ListItem",
                position: 2,
                item: {
                  "@type": "CreativeWork",
                  name: "RAG LLM Fact Checker",
                  description:
                    "Production retrieval-augmented generation system indexing research papers with semantic search.",
                },
              },
              {
                "@type": "ListItem",
                position: 3,
                item: {
                  "@type": "CreativeWork",
                  name: "Black Hole Simulation",
                  description:
                    "Real-time, interactive WebGL simulation of Schwarzschild/Kerr black holes.",
                },
              },
              {
                "@type": "ListItem",
                position: 4,
                item: {
                  "@type": "CreativeWork",
                  name: "Robotics Telemetry Intelligence",
                  description:
                    "Scalable services to analyze real-time surgical robotics telemetry.",
                },
              },
            ],
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
  noindex: PropTypes.bool,
};

export default SEOHead;
