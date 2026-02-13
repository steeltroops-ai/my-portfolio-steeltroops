import { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePostBySlug } from "../hooks/useBlogQueries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import {
  FiChevronLeft,
  FiCalendar,
  FiClock,
  FiUser,
  FiChevronRight,
} from "react-icons/fi";
import {
  FloatingChatButton,
  SEOHead,
  OptimizedImage,
  BlogImage,
  BlogReadingProgress,
  InlineSocialShare,
  SocialLinks,
} from "@/shared";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";
import Comments from "./Comments/Comments";
import TableOfContents from "./TableOfContents";
import CodeBlock from "./CodeBlock";

// Helper to extract plain text from React children
const flattenText = (children) => {
  if (!children) return "";
  if (typeof children === "string" || typeof children === "number")
    return children.toString();
  if (Array.isArray(children)) return children.map(flattenText).join("");
  if (children.props && children.props.children)
    return flattenText(children.props.children);
  return "";
};

// Helper to generate consistent IDs from text
const generateId = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special chars except whitespace & hyphens
    .trim()
    .replace(/\s+/g, "-"); // Replace spaces with hyphens
};

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef(null);
  const [activeId, setActiveId] = useState("");

  // Use React Query to fetch the post
  const {
    data: postWrapper,
    isLoading: loading,
    error: queryError,
  } = usePostBySlug(slug);

  const post = postWrapper?.data;
  const apiError = postWrapper?.error;

  const error = queryError
    ? "Failed to load blog post"
    : apiError
      ? typeof apiError === "string"
        ? apiError
        : apiError.message || "Failed to load blog post"
      : !post && !loading
        ? "Post not found"
        : "";

  // Memoize headings extraction for Table Of Contents
  const headings = useMemo(() => {
    if (!post?.content) return [];

    // Remove code blocks before extracting headings to avoid false positives
    const contentWithoutCode = post.content.replace(/```[\s\S]*?```/g, "");

    // Only extract H2 and H3 for a cleaner, more structured Table of Contents
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const matches = [...contentWithoutCode.matchAll(headingRegex)];

    return matches
      .map((match) => {
        const level = match[1].length;
        const text = match[2].trim();

        // Skip headings that are too short or just symbols
        if (text.length < 2) return null;

        const plainText = text.replace(/[*_~`]/g, "");
        const id = generateId(plainText);

        return { id, text: plainText, level };
      })
      .filter((h) => h !== null);
  }, [post?.content]);

  // Track active heading on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -35% 0px" } // Optimized for reading flow
    );

    // Initial check + observe
    const headingElements =
      articleRef.current?.querySelectorAll("h2[id], h3[id]") || [];

    // Add a small delay to ensure DOM is ready if content is loading fast
    setTimeout(() => {
      headingElements.forEach((element) => observer.observe(element));
    }, 100);

    return () => observer.disconnect();
  }, [headings]); // DEPEND ON HEADINGS, NOT POST

  // Bidirectional sticky sidebar:
  // Scroll DOWN -> sidebar slides up, stops when TOP hits top padding
  // Scroll UP   -> sidebar slides down, stops when BOTTOM hits bottom padding
  // Hovering over sidebar + scrolling -> page scrolls, sidebar traverses viewport
  const sidebarRef = useRef(null);
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const mql = window.matchMedia("(min-width: 1024px)");
    const TOP_GAP = 24; // px from viewport top
    const BOTTOM_GAP = 24; // px from viewport bottom

    let lastScrollY = window.scrollY;
    let currentTop = TOP_GAP;
    sidebar.style.top = `${currentTop}px`;

    const onScroll = () => {
      if (!mql.matches) return;

      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY;
      const sidebarHeight = sidebar.offsetHeight;
      const viewportHeight = window.innerHeight;

      if (sidebarHeight + TOP_GAP + BOTTOM_GAP <= viewportHeight) {
        // Sidebar fits in viewport -- just stick to top
        currentTop = TOP_GAP;
      } else {
        // Sidebar taller than viewport: bidirectional traverse
        // minTop positions sidebar bottom at viewport bottom - padding
        const minTop = viewportHeight - sidebarHeight - BOTTOM_GAP;
        currentTop = Math.min(TOP_GAP, Math.max(minTop, currentTop - delta));
      }

      sidebar.style.top = `${currentTop}px`;
      lastScrollY = scrollY;
    };

    const onResize = () => {
      if (!mql.matches) {
        sidebar.style.top = "";
      } else {
        onScroll();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    mql.addEventListener("change", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mql.removeEventListener("change", onResize);
      sidebar.style.top = "";
    };
  }, [headings, post]);

  // Memoize scroll handler to prevent recreation on every render
  const scrollToHeading = useCallback((id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }, []);

  // Memoize markdown components to prevent unnecessary re-renders
  // CRITICAL: This MUST be before any conditional returns to comply with Rules of Hooks
  const markdownComponents = useMemo(
    () => ({
      // Custom heading components with anchor links
      h1: ({ children, ...props }) => {
        const text = flattenText(children);
        if (post?.title && text.toLowerCase() === post.title.toLowerCase())
          return null;
        const id = generateId(text);
        return (
          <h1
            id={id}
            className="group relative text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mt-12 mb-8 first:mt-0 scroll-mt-24"
            {...props}
          >
            <span className="relative z-10">{children}</span>
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-purple-500/40 to-transparent rounded-full group-hover:w-full transition-all duration-700 ease-out" />
          </h1>
        );
      },
      h2: ({ children, ...props }) => {
        const id = generateId(flattenText(children));
        return (
          <h2
            id={id}
            className="group relative text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight mt-16 mb-6 scroll-mt-24 flex items-center gap-3"
            {...props}
          >
            <div className="h-4 w-1 bg-purple-500/60 rounded-full group-hover:h-6 group-hover:bg-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
            <span>{children}</span>
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const id = generateId(flattenText(children));
        return (
          <h3
            id={id}
            className="group relative text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight mt-12 mb-4 scroll-mt-24 flex items-center gap-2.5"
            {...props}
          >
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <span className="group-hover:text-purple-100 transition-colors">
              {children}
            </span>
          </h3>
        );
      },
      h4: ({ children, ...props }) => (
        <h4
          className="group text-base sm:text-lg font-bold text-neutral-100 tracking-tight mt-8 mb-4 flex items-center gap-2"
          {...props}
        >
          <span className="text-purple-500/50 font-mono group-hover:text-purple-400 transition-colors">
            /
          </span>
          <span className="group-hover:text-white transition-colors border-b border-transparent group-hover:border-purple-500/30">
            {children}
          </span>
        </h4>
      ),
      // New H5 - Technical Kicker / Label
      h5: ({ children, ...props }) => (
        <h5
          className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mt-10 mb-3 flex items-center gap-2"
          {...props}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          {children}
        </h5>
      ),
      // New H6 - Caption / Note Header
      h6: ({ children, ...props }) => (
        <h6
          className="text-sm font-medium text-neutral-500 italic mt-6 mb-2 flex items-center gap-3 border-l-2 border-neutral-800 pl-4"
          {...props}
        >
          {children}
        </h6>
      ),
      // Advanced List Item Handling (Differentiates Ordered vs Unordered)
      li: ({ children, ordered, index, ...props }) => {
        // 1. Process List Item (Ordered)
        if (ordered) {
          return (
            <li
              className="relative pl-2 text-base sm:text-[17px] leading-[1.8] text-neutral-300 font-light my-2 marker:text-cyan-500 marker:font-mono marker:font-bold"
              {...props}
            >
              <span className="relative z-10">{children}</span>
            </li>
          );
        }

        // 2. Interactive Bullet Point (Unordered)
        return (
          <li
            className="flex gap-3 group/item mb-3 last:mb-0 scroll-mt-24"
            {...props}
          >
            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-purple-500/40 group-hover/item:bg-purple-400 group-hover/item:scale-150 transition-all duration-300 shrink-0 shadow-[0_0_5px_rgba(168,85,247,0.2)] group-hover/item:shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            <div className="flex-1 text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.7] text-neutral-300 font-light">
              {children}
            </div>
          </li>
        );
      },
      // Custom paragraph styling - Medium Readability Calibrated
      p: ({ children, ...props }) => (
        <p
          className="text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.6] text-neutral-300 font-light tracking-normal mb-6 sm:mb-8"
          {...props}
        >
          {children}
        </p>
      ),
      // Custom code block styling with language header
      pre: CodeBlock,
      // Inline code styling
      code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");

        // Inline code
        if (inline || !match) {
          return (
            <code
              className="bg-white/5 px-1.5 py-0.5 rounded text-sm text-neutral-100 font-mono border border-white/10"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Code block - let highlight.js handle it
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // Smart Blockquote & Callout System
      blockquote: ({ children, ...props }) => {
        // Safety check for children content
        let text = "";
        try {
          if (typeof children === "string") text = children;
          else if (Array.isArray(children)) {
            children.forEach((child) => {
              if (typeof child === "string") text += child;
              else if (child?.props?.children) text += child.props.children;
            });
          } else if (children?.props?.children) {
            text = children.props.children;
          }
        } catch (e) {
          text = "";
        }

        // Check for Callout Patterns
        const isNote = /^(Note|Info):/i.test(text);
        const isTip = /^(Tip|Pro-Tip):/i.test(text);
        const isWarning = /^(Warning|Caution|Alert):/i.test(text);
        const isAI = /^(AI Insight|Summary|Key Takeaway):/i.test(text);

        // 1. AI Insight / Summary Block
        if (isAI) {
          return (
            <div className="my-10 relative overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 sm:p-8">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <FiUser className="text-4xl text-purple-400" />
              </div>
              <h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-purple-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                AI Insight
              </h5>
              <div className="relative z-10 text-lg text-purple-100/90 font-light leading-relaxed">
                {children}
              </div>
            </div>
          );
        }

        // 2. Info / Note Block
        if (isNote) {
          return (
            <div className="my-8 flex gap-4 p-5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-100/90 font-light leading-relaxed">
              <div className="shrink-0 w-1 h-full bg-blue-500/50 rounded-full" />
              <div>{children}</div>
            </div>
          );
        }

        // 3. Warning Block
        if (isWarning) {
          return (
            <div className="my-8 flex gap-4 p-5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-100/90 font-light leading-relaxed">
              <div className="shrink-0 w-1 h-full bg-red-500/50 rounded-full" />
              <div>{children}</div>
            </div>
          );
        }

        // 4. Default: Elegant Pull Quote
        return (
          <blockquote className="relative my-12 pl-6 sm:pl-10 py-2 border-l-4 border-white/20">
            <div className="absolute left-6 top-0 text-6xl text-white/5 font-serif -translate-y-4 -translate-x-4">
              "
            </div>
            <p className="text-xl sm:text-2xl font-serif italic text-white/90 leading-relaxed">
              {children}
            </p>
          </blockquote>
        );
      },
      // Custom list styling
      ul: ({ children, ...props }) => (
        <ul
          className="list-none ml-2 space-y-4 text-neutral-300 font-light tracking-wide mb-8"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="list-decimal list-outside ml-6 space-y-4 text-neutral-300 font-light tracking-wide mb-8 marker:text-cyan-500 marker:font-mono marker:font-semibold"
          {...props}
        >
          {children}
        </ol>
      ),
      // Custom link styling
      a: ({ children, href, ...props }) => (
        <a
          href={href}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-400 transition-all font-medium"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),
      // Custom image styling with optimization
      img: ({ src, alt, ...props }) => (
        <BlogImage src={src} alt={alt} caption={alt} {...props} />
      ),
      // Custom table styling
      table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg bg-white/[0.02] table-scrollbar pb-2">
          <table className="min-w-full divide-y divide-white/10" {...props}>
            {children}
          </table>
        </div>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider bg-white/5"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 border-t border-white/5"
          {...props}
        >
          {children}
        </td>
      ),
      // Custom strong/emphasis styling
      strong: ({ children, ...props }) => (
        <strong
          className="text-white font-bold tracking-tight bg-gradient-to-r from-purple-200 to-white bg-clip-text text-transparent"
          {...props}
        >
          {children}
        </strong>
      ),
      em: ({ children, ...props }) => (
        <em
          className="text-purple-200 font-serif italic text-[1.1em]"
          {...props}
        >
          {children}
        </em>
      ),
      // Custom horizontal rule - Neon Nodes Separator
      hr: ({ ...props }) => (
        <div className="my-16 flex items-center justify-center gap-6 opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
          <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.8)] animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
        </div>
      ),
    }),
    [post?.title]
  );

  // Sharing functionality - currently unused but kept for future use
  // const sharePost = (platform) => {
  //   const url = window.location.href;
  //   const title = post?.title || "";

  //   const shareUrls = {
  //     twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
  //       title
  //     )}&url=${encodeURIComponent(url)}`,
  //     linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
  //       url
  //     )}`,
  //   };

  //   if (shareUrls[platform]) {
  //     window.open(shareUrls[platform], "_blank", "width=600,height=400");
  //   }
  // };

  // const copyToClipboard = () => {
  //   navigator.clipboard.writeText(window.location.href);
  //   // You could add a toast notification here
  // };

  if (loading) {
    return (
      <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
        {/* Keep original background */}
        <div className="fixed top-0 w-full h-full -z-10">
          <div className="relative w-full h-full bg-black">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
          </div>
        </div>

        <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
          {/* Navigation - Show immediately */}
          <nav className="relative flex items-center justify-between min-h-[5rem] mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
            <div className="flex items-center flex-shrink-0">
              <button
                onClick={() => navigate("/blogs")}
                className="group flex items-center gap-2 text-white transition-all duration-300 hover:text-purple-300"
              >
                <FiChevronLeft className="text-2xl transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="text-xl font-light tracking-tight">Back</span>
              </button>
            </div>

            {/* Title placeholder */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-full max-w-[40%] sm:max-w-[60%] text-center">
              <h1 className="text-xl sm:text-2xl font-light text-white tracking-tight uppercase truncate px-4">
                Loading...
              </h1>
            </div>

            <SocialLinks onlyLastOnMobile />
          </nav>

          {/* Loading spinner in content area */}
          <LoadingSpinner fullScreen={false} message="Loading blog post..." />
        </div>

        <FloatingChatButton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Oops!</h1>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Link
            to="/blogs"
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      {/* SEO Meta Tags */}
      <SEOHead
        title={post.title}
        description={post.meta_description || post.excerpt}
        image={post.featured_image_url}
        url={window.location.href}
        type="article"
        author={post.author}
        publishedTime={post.created_at}
        modifiedTime={post.updated_at}
        tags={post.tags || []}
        canonical={`${window.location.origin}/blogs/${post.slug}`}
      />

      <div className="fixed top-0 w-full h-full -z-10">
        <div className="relative w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
        </div>
      </div>

      {/* Reading Progress Indicator */}
      <BlogReadingProgress
        articleRef={articleRef}
        showStats={true}
        position="top"
        color="purple"
        height={2}
        headings={headings}
        activeId={activeId}
        postTitle={post.title}
      />

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Navigation */}
        <nav className="relative flex items-center justify-between min-h-[5rem] mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate("/blogs")}
              className="group flex items-center gap-2 text-white transition-all duration-300 hover:text-purple-300"
            >
              <FiChevronLeft className="text-2xl transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="text-xl font-light tracking-tight">Back</span>
            </button>
          </div>

          <SocialLinks onlyLastOnMobile />
        </nav>

        {/* Two Column Layout - items-start keeps article from stretching,
            aside uses self-stretch to fill row height (required for sticky to work) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-start gap-6 lg:gap-8 mt-0">
          {/* Main Content - Left Side */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-9 p-6 sm:p-8 md:p-10 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg"
          >
            <header className="mb-8 border-b border-white/10 pb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-6">
                {post.title}
              </h1>

              {/* Excerpt/Subtitle - Medium Style Intro */}
              {post.excerpt && (
                <p className="text-lg sm:text-xl lg:text-2xl text-neutral-400 font-light leading-snug mb-8 border-l-4 border-purple-500/20 pl-6 sm:pl-8 py-1">
                  {post.excerpt}
                </p>
              )}

              {/* Minimalist Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-medium">
                <div className="flex items-center gap-2">
                  <FiCalendar className="text-purple-400/70" />
                  <span>
                    {new Date(post.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiClock className="text-purple-400/70" />
                  <span>{post.read_time} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiUser className="text-purple-400/70" />
                  <span>{post.author}</span>
                </div>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-12 overflow-hidden rounded-xl border border-white/10 shadow-2xl aspect-video"
              >
                <OptimizedImage
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                  lazy={false}
                  priority={true}
                  webp={true}
                />
              </motion.div>
            )}

            {/* Article Content - Performance Optimized */}
            <motion.div
              ref={articleRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="prose prose-neutral prose-invert max-w-none 
                prose-p:font-light prose-p:text-[16px] sm:prose-p:text-[18px] lg:prose-p:text-[20px] prose-p:leading-[1.7] prose-p:text-neutral-300 prose-p:tracking-normal
                prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight
                prose-h2:text-xl sm:prose-h2:text-2xl lg:prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-6
                prose-h3:text-lg sm:prose-h3:text-xl lg:prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-5
                prose-a:text-cyan-400 prose-a:font-normal prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-bold
                prose-blockquote:border-l-4 prose-blockquote:border-purple-500/40 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-neutral-200 prose-blockquote:text-lg lg:prose-blockquote:text-xl
                prose-li:font-light prose-li:text-[16px] sm:prose-li:text-[18px] lg:prose-li:text-[20px] prose-li:text-neutral-300 prose-li:leading-[1.7] 
                hyphens-auto text-left"
              style={{ contentVisibility: "auto" }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
              >
                {post.content}
              </ReactMarkdown>

              {/* Article Footer Refinement */}
              <div className="mt-16 pt-8 border-t border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex flex-wrap gap-2">
                    {post.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full bg-white/5 text-neutral-400 border border-white/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-neutral-500">
                    <span className="text-[11px] uppercase tracking-[0.2em] font-light">
                      End of Article
                    </span>
                    <div className="w-12 h-px bg-gradient-to-r from-cyan-500/40 to-transparent" />
                  </div>
                </div>

                <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5">
                  <p className="text-neutral-400 font-light mb-4 italic">
                    "Thanks for reading. If you enjoyed this piece, feel free to
                    share it or leave a comment."
                  </p>
                  <div className="flex justify-center gap-6">
                    <InlineSocialShare
                      url={window.location.href}
                      title={post.title}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.article>

          {/* Sidebar - Right Side */}
          {/* self-stretch overrides grid's items-start for the aside only,
              making it fill the full row height. This is ESSENTIAL for position:sticky
              to work -- sticky only sticks when the parent is taller than the child. */}
          <aside className="lg:col-span-3 lg:self-stretch">
            <div ref={sidebarRef} className="lg:sticky space-y-4">
              {/* Navigation & Table of Contents */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg"
              >
                {/* Breadcrumb */}
                <div className="flex items-center text-xs text-neutral-300 mb-6">
                  <Link
                    to="/"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Home
                  </Link>
                  <FiChevronRight className="mx-1.5 text-neutral-600" />
                  <Link
                    to="/blogs"
                    className="hover:text-cyan-400 transition-colors"
                  >
                    Blog
                  </Link>
                  <FiChevronRight className="mx-1.5 text-neutral-600" />
                  <span
                    className="text-neutral-500 truncate max-w-[150px]"
                    title={post.title}
                  >
                    {post.title}
                  </span>
                </div>

                {/* Table of Contents - Independently Scrollable */}
                {headings.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                      Table of Contents
                    </h3>
                    {/* TOC items */}
                    <div className="pr-2">
                      <TableOfContents
                        headings={headings}
                        activeId={activeId}
                        onHeadingClick={scrollToHeading}
                        variant="pc"
                      />
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Post Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg"
              >
                <h3 className="text-lg font-semibold text-white mb-4">
                  Post Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FiCalendar className="mt-1 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-300 font-medium">Published</p>
                      <p className="text-white">
                        {new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {post.read_time && (
                    <div className="flex items-start gap-3">
                      <FiClock className="mt-1 text-purple-400 flex-shrink-0" />
                      <div>
                        <p className="text-neutral-300 font-medium">
                          Reading Time
                        </p>
                        <p className="text-white">{post.read_time} min read</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <FiUser className="mt-1 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-300 font-medium">Author</p>
                      <p className="text-white">{post.author}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-400/50 ring-1 ring-white/5"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Share */}
              <div className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Share</h3>
                <InlineSocialShare
                  url={window.location.href}
                  title={post.title}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Comments Section - Full Width */}
        <div className="mt-12">
          <Comments postId={post.id} postTitle={post.title} />
        </div>

        {/* Read More Posts CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-16 mb-8"
        >
          <Link
            to="/blogs"
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-light tracking-wide rounded-full border border-purple-400/50 bg-purple-500/10 text-purple-100 ring-1 ring-white/10 hover:bg-purple-500/20 hover:border-purple-400/70 transition-all duration-300 shadow-none"
          >
            Read More Posts
          </Link>
        </motion.div>
      </div>

      <FloatingChatButton />
    </div>
  );
};

// Memoize the entire component to prevent unnecessary re-renders
// when parent components update unrelated state
export default memo(BlogPost);
