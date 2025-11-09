import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FiGithub, FiInstagram, FiSearch, FiFilter, FiArrowLeft, FiGrid, FiList } from "react-icons/fi";
import {
  usePublishedPosts,
  useTags,
  useDataSourceInfo,
} from "../hooks/useBlogQueries";
import FloatingChatButton from "./FloatingChatButton";
import SEOHead from "./SEOHead";

const Blog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [layoutView, setLayoutView] = useState("grid"); // "grid" or "list"
  const postsPerPage = 6;

  // Use React Query hooks for data fetching
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = usePublishedPosts({
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
    search: searchTerm,
    tags: selectedTags,
  });

  const { data: tagsData, isLoading: tagsLoading } = useTags();

  const { data: dataSourceInfo } = useDataSourceInfo();

  // Extract data from React Query results
  const posts = postsData?.posts || [];
  const totalPosts = postsData?.count || 0;
  const tags = tagsData || [];
  const loading = postsLoading || tagsLoading;
  const error = postsError ? "Failed to load blog posts" : "";
  const isStatic = postsData?.isStatic || false;

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Search is handled automatically by React Query when searchTerm changes
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Blog"
        description="Thoughts, tutorials, and insights about web development, technology, and more from Mayank's personal blog."
        url={window.location.href}
        type="website"
      />

      <div className="fixed top-0 w-full h-full -z-10">
        <div className="relative w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
        </div>
      </div>
      <div className="container px-4 sm:px-6 lg:px-8 mx-auto max-w-7xl">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-3 sm:py-4 lg:py-6 mb-4 sm:mb-6 lg:mb-8">
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

        {/* Header */}
        <div className="mb-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1 text-4xl font-bold text-white md:text-5xl"
          >
            Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-400"
          >
            Thoughts, tutorials, and insights about web development, technology,
            and more.
          </motion.p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute transform -translate-y-1/2 left-3 top-1/2 text-purple-300/70 z-10 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full py-2 pl-10 pr-4 text-white border rounded-lg bg-purple-500/5 border-purple-400/20 backdrop-blur-sm shadow-lg focus:outline-none focus:border-purple-400/40 focus:bg-purple-500/10 transition-all duration-300 placeholder:text-purple-100/40"
                />
              </div>
            </form>

            <div className="flex items-stretch gap-2">
              {/* Layout Toggle */}
              <div className="flex items-stretch border rounded-lg bg-purple-500/5 border-purple-400/20 backdrop-blur-sm shadow-lg">
                <button
                  onClick={() => setLayoutView("grid")}
                  className={`px-3 py-2 flex items-center justify-center transition-all duration-300 rounded-l-lg ${layoutView === "grid"
                    ? "bg-purple-500/20 text-purple-100"
                    : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-500/10"
                    }`}
                  aria-label="Grid view"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <div className="w-px bg-purple-400/20"></div>
                <button
                  onClick={() => setLayoutView("list")}
                  className={`px-3 py-2 flex items-center justify-center transition-all duration-300 rounded-r-lg ${layoutView === "list"
                    ? "bg-purple-500/20 text-purple-100"
                    : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-500/10"
                    }`}
                  aria-label="List view"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 transition-all duration-300 border rounded-lg bg-purple-500/5 border-purple-400/20 backdrop-blur-sm shadow-lg hover:bg-purple-500/10 hover:border-purple-400/30 text-purple-100 font-medium"
              >
                <FiFilter />
                Filters
                {selectedTags.length > 0 && (
                  <span className="px-2 py-1 text-xs text-white rounded-full bg-purple-500/30">
                    {selectedTags.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tag Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-4 mt-4 border rounded-lg bg-purple-500/5 border-purple-400/20 backdrop-blur-sm shadow-lg"
            >
              <h3 className="mb-3 text-sm font-medium text-purple-100">
                Filter by tags:
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${selectedTags.includes(tag)
                      ? "bg-purple-500/20 text-purple-100 border border-purple-400/40 font-medium"
                      : "bg-purple-500/5 text-purple-300/70 border border-purple-400/20 hover:bg-purple-500/10 hover:border-purple-400/30 hover:text-purple-100"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setCurrentPage(1);
                  }}
                  className="mt-3 text-sm text-purple-300/70 hover:text-purple-100 transition-colors duration-300"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Data Source Indicator */}
        {isStatic && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 mb-6 border rounded-lg bg-amber-900/20 border-amber-700/30"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-sm font-medium">
                Viewing offline content - Some features may be limited
              </span>
              <button
                onClick={() => refetchPosts()}
                className="ml-auto text-xs underline text-amber-300 hover:text-amber-200"
              >
                Try reconnecting
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-cyan-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-20 text-center">
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={loadPosts}
              className="px-4 py-2 transition-colors rounded bg-cyan-600 hover:bg-cyan-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Blog Posts Grid */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {posts.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-lg text-neutral-400">No blog posts found.</p>
                {(searchTerm || selectedTags.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedTags([]);
                      setCurrentPage(1);
                    }}
                    className="mt-4 text-cyan-400 hover:text-cyan-300"
                  >
                    Clear filters to see all posts
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`mb-12 ${layoutView === "grid"
                  ? "grid gap-8 md:grid-cols-2 lg:grid-cols-3"
                  : "flex flex-col gap-6"
                  }`}>
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`relative transition-all duration-300 border rounded-xl backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 hover:border-white/20 group ${layoutView === "grid"
                        ? "p-6 hover:-translate-y-1"
                        : "p-6"
                        }`}
                    >
                      <Link
                        to={`/blogs/${post.slug}`}
                        className={`block ${layoutView === "grid" ? "space-y-4" : "flex gap-6"}`}
                      >

                        {/* Featured Image */}
                        {post.featured_image_url && (
                          <div className={`relative overflow-hidden rounded-lg ${layoutView === "grid"
                            ? "w-full mb-4 aspect-video"
                            : "w-64 h-40 flex-shrink-0"
                            }`}>
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className={`relative ${layoutView === "grid" ? "space-y-3" : "flex-1 space-y-2"}`}>
                          <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-white line-clamp-2">
                            {post.title}
                          </h2>

                          <p className="transition-colors text-neutral-300/80 group-hover:text-neutral-200 line-clamp-3">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/20"
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/20">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-sm transition-colors text-purple-300/50 group-hover:text-purple-300/70">
                            <div className="flex items-center">
                              <span className="inline-block w-2 h-2 mr-2 rounded-full bg-purple-400"></span>
                              {new Date(post.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </div>
                            {post.read_time && (
                              <span>{post.read_time} min read</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-4 py-2 transition-colors rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded transition-colors ${currentPage === page
                              ? "bg-cyan-600 text-white"
                              : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                              }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 transition-colors rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default Blog;


