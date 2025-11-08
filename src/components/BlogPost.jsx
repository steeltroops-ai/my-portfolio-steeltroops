import { useRef } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { usePostBySlug } from "../hooks/useBlogQueries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import { FiArrowLeft, FiCalendar, FiClock } from "react-icons/fi";
import Navbar from "./Navbar";
import FloatingChatButton from "./FloatingChatButton";
import SEOHead from "./SEOHead";
import { InlineSocialShare } from "./SocialShare";
import OptimizedImage, { BlogImage } from "./OptimizedImage";
import Comments from "./Comments/Comments";
import { BlogReadingProgress } from "./ReadingProgress";
// Syntax highlighting styles are handled by rehype-highlight

const BlogPost = () => {
  const { slug } = useParams();
  const articleRef = useRef(null);

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
            to="/blog"
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
        canonical={`${window.location.origin}/blog/${post.slug}`}
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

      <div className="container px-8 mx-auto">
        <Navbar />

        {/* Back to Blog Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-8 mb-6"
        >
          <Link
            to="/blog"
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Back to Blog
          </Link>
        </motion.div>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
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
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-400 mb-6">
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>

              {post.read_time && (
                <div className="flex items-center">
                  <FiClock className="mr-2" />
                  {post.read_time} min read
                </div>
              )}

              <div className="flex items-center">
                <span className="mr-2">By</span>
                <span className="text-cyan-400">{post.author}</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-xs bg-neutral-800 text-neutral-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-neutral-800">
              <span className="text-sm text-neutral-500">Share:</span>
              <InlineSocialShare
                url={window.location.href}
                title={post.title}
              />
            </div>
          </motion.header>

          {/* Article Content */}
          <motion.div
            ref={articleRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="prose prose-invert prose-cyan max-w-none"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom heading components with anchor links
                h1: ({ children, ...props }) => (
                  <h1
                    className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0"
                    {...props}
                  >
                    {children}
                  </h1>
                ),
                h2: ({ children, ...props }) => (
                  <h2
                    className="text-2xl font-bold text-white mt-8 mb-4"
                    {...props}
                  >
                    {children}
                  </h2>
                ),
                h3: ({ children, ...props }) => (
                  <h3
                    className="text-xl font-bold text-white mt-6 mb-3"
                    {...props}
                  >
                    {children}
                  </h3>
                ),
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
                // Custom code block styling
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <div className="my-6">
                      <div className="bg-neutral-900 rounded-t-lg px-4 py-2 text-sm text-neutral-400 border-b border-neutral-700">
                        {match[1]}
                      </div>
                      <pre className="bg-neutral-800 rounded-b-lg p-4 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    </div>
                  ) : (
                    <code
                      className="bg-neutral-800 px-2 py-1 rounded text-sm text-cyan-300"
                      {...props}
                    >
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

          {/* Article Footer */}
          <motion.footer
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-neutral-800"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <p className="text-neutral-400 mb-2">
                  Published on{" "}
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                {post.updated_at !== post.created_at && (
                  <p className="text-sm text-neutral-500">
                    Last updated on{" "}
                    {new Date(post.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-neutral-500">
                  Share this post:
                </span>
                <InlineSocialShare
                  url={window.location.href}
                  title={post.title}
                />
              </div>
            </div>
          </motion.footer>
        </motion.article>

        {/* Comments Section */}
        <Comments postId={post.id} postTitle={post.title} />

        {/* Back to Blog CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16 mb-8"
        >
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Read More Posts
          </Link>
        </motion.div>
      </div>

      <FloatingChatButton />
    </div>
  );
};

export default BlogPost;
