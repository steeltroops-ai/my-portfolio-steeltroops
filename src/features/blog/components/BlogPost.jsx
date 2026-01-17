import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usePostBySlug } from "../hooks/useBlogQueries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { FiArrowLeft, FiCalendar, FiClock, FiGithub, FiInstagram, FiChevronRight } from "react-icons/fi";
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { 
  FloatingChatButton, 
  SEOHead, 
  OptimizedImage, 
  BlogImage,
  BlogReadingProgress,
  InlineSocialShare 
} from "@/shared";
import Comments from "./Comments/Comments";

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef(null);
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState("");

  // Use React Query to fetch the post
  const {
    data: post,
    isLoading: loading,
    error: queryError,
  } = usePostBySlug(slug);

  const error = queryError
    ? "Failed to load blog post"
    : !post && !loading
      ? "Post not found"
      : "";

  // Extract headings from markdown content for table of contents
  useEffect(() => {
    if (!post?.content) return;

    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const matches = [...post.content.matchAll(headingRegex)];

    const extractedHeadings = matches.map((match, index) => {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      return { id, text, level };
    });

    setHeadings(extractedHeadings);
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
      { rootMargin: '-100px 0px -80% 0px' }
    );

    const headingElements = document.querySelectorAll('h1[id], h2[id], h3[id]');
    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [post]);

  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading blog post...</p>
        </div>
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
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
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
        color="cyan"
        height={3}
      />

      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-3 sm:py-4 lg:py-6 mb-6 sm:mb-8 lg:mb-16">
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-lg sm:text-xl md:text-2xl font-semibold text-white transition-colors duration-200 hover:text-cyan-300"
            >
              <FiArrowLeft />
              Back
            </button>
          </div>
          <div className="flex justify-center gap-2.5 sm:gap-3 md:gap-4 -mr-2 sm:-mr-4 text-lg sm:text-xl md:text-2xl items-center">
            <a
              href="https://x.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
              aria-label="Twitter (opens in new tab)"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://github.com/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
              aria-label="GitHub (opens in new tab)"
            >
              <FiGithub />
            </a>
            <a
              href="https://instagram.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
              aria-label="Instagram (opens in new tab)"
            >
              <FiInstagram />
            </a>
            <a
              href="https://linkedin.com/in/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
              aria-label="LinkedIn (opens in new tab)"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://bento.me/steeltroops"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300 transition-colors duration-200"
              aria-label="Bento profile (opens in new tab)"
            >
              <AiOutlineLink />
            </a>
          </div>
        </nav>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-4 sm:mt-8 lg:mt-16">
          {/* Main Content - Left Side */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-9"
          >
            {/* Featured Image */}
            {post.featured_image_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-8 overflow-hidden rounded-xl aspect-video"
              >
                <OptimizedImage
                  src={post.featured_image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 80vw, 60vw"
                  lazy={false} // Don't lazy load featured images
                  webp={true}
                />
              </motion.div>
            )}

            {/* Article Header */}
            <motion.header
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-12"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                {post.title}
              </h1>
            </motion.header>

            {/* Article Content */}
            <motion.div
              ref={articleRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="prose prose-lg prose-invert prose-cyan max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-cyan-300 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  // Custom heading components with anchor links
                  h1: ({ children, ...props }) => {
                    const text = String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h1
                        id={id}
                        className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0 scroll-mt-24"
                        {...props}
                      >
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children, ...props }) => {
                    const text = String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h2
                        id={id}
                        className="text-2xl font-bold text-white mt-8 mb-4 scroll-mt-24"
                        {...props}
                      >
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children, ...props }) => {
                    const text = String(children);
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h3
                        id={id}
                        className="text-xl font-bold text-white mt-6 mb-3 scroll-mt-24"
                        {...props}
                      >
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children, ...props }) => (
                    <h4
                      className="text-lg font-bold text-white mt-6 mb-3"
                      {...props}
                    >
                      {children}
                    </h4>
                  ),
                  // Custom paragraph styling
                  p: ({ children, ...props }) => (
                    <p
                      className="text-lg leading-relaxed text-neutral-300 mb-6"
                      {...props}
                    >
                      {children}
                    </p>
                  ),
                  // Custom code block styling with language header
                  pre: ({ children, ...props }) => {
                    // Find the code element and extract language
                    const codeElement = children?.props;
                    const className = codeElement?.className || '';
                    const match = /language-(\w+)/.exec(className);
                    const language = match ? match[1] : 'code';
                    
                    // Format language names for display
                    const languageLabels = {
                      js: 'JavaScript',
                      jsx: 'JSX',
                      ts: 'TypeScript',
                      tsx: 'TSX',
                      py: 'Python',
                      python: 'Python',
                      css: 'CSS',
                      html: 'HTML',
                      json: 'JSON',
                      bash: 'Bash',
                      sh: 'Shell',
                      sql: 'SQL',
                      yaml: 'YAML',
                      yml: 'YAML',
                      md: 'Markdown',
                      go: 'Go',
                      rust: 'Rust',
                      java: 'Java',
                      cpp: 'C++',
                      c: 'C',
                    };
                    
                    const displayLanguage = languageLabels[language.toLowerCase()] || language.toUpperCase();
                    
                    return (
                      <div className="code-block-wrapper my-6">
                        <div className="code-block-header">
                          <span className="code-block-language">{displayLanguage}</span>
                        </div>
                        <pre {...props}>
                          {children}
                        </pre>
                      </div>
                    );
                  },
                  // Inline code styling
                  code: ({ node, inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    
                    // Inline code
                    if (inline || !match) {
                      return (
                        <code
                          className="bg-neutral-700/50 px-1.5 py-0.5 rounded text-sm text-cyan-300 font-mono"
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
                  // Custom blockquote styling
                  blockquote: ({ children, ...props }) => (
                    <blockquote
                      className="border-l-4 border-cyan-500 pl-6 py-2 my-6 italic text-neutral-300 bg-neutral-900/30 rounded-r-lg"
                      {...props}
                    >
                      {children}
                    </blockquote>
                  ),
                  // Custom list styling
                  ul: ({ children, ...props }) => (
                    <ul
                      className="list-disc list-inside space-y-2 text-neutral-300 mb-6"
                      {...props}
                    >
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol
                      className="list-decimal list-inside space-y-2 text-neutral-300 mb-6"
                      {...props}
                    >
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li className="text-lg leading-relaxed" {...props}>
                      {children}
                    </li>
                  ),
                  // Custom link styling
                  a: ({ children, href, ...props }) => (
                    <a
                      href={href}
                      className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
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
                    <div className="overflow-x-auto my-6">
                      <table
                        className="min-w-full border border-neutral-700 rounded-lg"
                        {...props}
                      >
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children, ...props }) => (
                    <th
                      className="border border-neutral-700 px-4 py-3 bg-neutral-800 text-left font-semibold text-white"
                      {...props}
                    >
                      {children}
                    </th>
                  ),
                  td: ({ children, ...props }) => (
                    <td
                      className="border border-neutral-700 px-4 py-3 text-neutral-300"
                      {...props}
                    >
                      {children}
                    </td>
                  ),
                  // Custom horizontal rule
                  hr: ({ ...props }) => (
                    <hr className="border-neutral-700 my-8" {...props} />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </motion.div>


          </motion.article>

          {/* Sidebar - Right Side */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Navigation & Table of Contents */}
              <div className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg">
                {/* Breadcrumb */}
                <div className="flex items-center text-xs text-neutral-400 mb-6">
                  <Link to="/" className="hover:text-cyan-400 transition-colors">
                    Home
                  </Link>
                  <FiChevronRight className="mx-1.5 text-neutral-600" />
                  <Link to="/blogs" className="hover:text-cyan-400 transition-colors">
                    Blog
                  </Link>
                  <FiChevronRight className="mx-1.5 text-neutral-600" />
                  <span className="text-neutral-500 truncate max-w-[150px]" title={post.title}>
                    {post.title}
                  </span>
                </div>

                {/* Table of Contents */}
                {headings.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-white mb-4">
                      Table of Contents
                    </h3>
                    <nav className="space-y-2.5">
                      {headings.map((heading) => (
                        <button
                          key={heading.id}
                          onClick={() => scrollToHeading(heading.id)}
                          className={`block w-full text-left text-sm transition-colors leading-relaxed ${activeId === heading.id
                            ? 'text-cyan-400 font-medium'
                            : 'text-neutral-400 hover:text-neutral-200'
                            } ${heading.level === 1 ? 'pl-0 font-medium' : heading.level === 2 ? 'pl-0' : 'pl-4'}`}
                        >
                          {heading.text}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}
              </div>

              {/* Post Info */}
              <div className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Post Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FiCalendar className="mt-1 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-neutral-400">Published</p>
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
                        <p className="text-neutral-400">Reading Time</p>
                        <p className="text-white">{post.read_time} min read</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-purple-400 flex-shrink-0">✍️</span>
                    <div>
                      <p className="text-neutral-400">Author</p>
                      <p className="text-white">{post.author}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="p-6 rounded-xl border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/20"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
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
          </motion.aside>
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
            className="inline-flex items-center justify-center px-8 py-3 text-sm font-medium rounded-lg border backdrop-blur-[2px] border-purple-400/30 bg-purple-500/20 text-purple-100 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
          >
            Read More Posts
          </Link>
        </motion.div>
      </div>

      <FloatingChatButton />
    </div >
  );
};

export default BlogPost;


