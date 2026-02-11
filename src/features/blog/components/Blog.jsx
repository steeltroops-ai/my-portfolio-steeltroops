import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiGrid,
  FiList,
} from "react-icons/fi";
import { usePublishedPosts, useTags } from "../hooks/useBlogQueries";
import {
  FloatingChatButton,
  SocialLinks,
  SEOHead,
  OptimizedImage,
} from "@/shared";

const Blog = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [layoutView, setLayoutView] = useState("list"); // "grid" or "list"
  const postsPerPage = 6;

  // Use React Query hooks for data fetching
  const {
    data: postsData,
    isLoading: postsLoading,
    error: postsError,
  } = usePublishedPosts({
    limit: postsPerPage,
    offset: (currentPage - 1) * postsPerPage,
    search: searchTerm,
    tags: selectedTags,
  });

  const { data: tagsData, isLoading: tagsLoading } = useTags();

  // Extract data from React Query results
  const posts = postsData?.posts || [];
  const totalPosts = postsData?.count || 0;
  const tags = tagsData || [];
  const loading = postsLoading || tagsLoading;
  const error = postsError ? "Failed to load blog posts" : "";

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
        <nav className="relative flex items-center justify-between min-h-[5rem] mb-4 sm:mb-6 lg:mb-8 px-2 sm:px-0">
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="group flex items-center gap-2 text-white transition-all duration-300 hover:text-purple-300"
            >
              <FiChevronLeft className="text-2xl transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="text-xl font-light tracking-tight">Back</span>
            </button>
          </div>

          {/* Absolute Centered Title */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <h1 className="text-xl sm:text-2xl font-light text-white tracking-tight uppercase">
              Blogs
            </h1>
          </div>

          <SocialLinks onlyLastOnMobile />
        </nav>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            {/* Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="relative group flex-1 max-w-md"
            >
              {/* Enhanced Liquid Glass Outlines */}
              <div className="absolute inset-0 rounded-lg border border-white/30 pointer-events-none z-30"></div>
              <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] border border-white/10 pointer-events-none z-30"></div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-40"></div>

              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none rounded-lg"></div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-40 pointer-events-none"></div>
              <div className="relative">
                <FiSearch className="absolute transform -translate-y-1/2 left-4 top-1/2 text-white/50 group-focus-within:text-white transition-colors z-10 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="relative z-0 w-full py-2 pl-10 pr-4 text-white border-0 rounded-lg bg-transparent backdrop-blur-[2px] shadow-sm focus:outline-none transition-all duration-300 placeholder:text-purple-200/40"
                />
                <div className="absolute inset-0 bg-purple-500/[0.0375] group-focus-within:bg-purple-500/[0.15] rounded-lg transition-colors duration-300 pointer-events-none -z-10" />
              </div>
            </form>

            <div className="flex items-stretch gap-2">
              {/* Layout Toggle */}
              <div className="relative group flex items-stretch border-0 rounded-lg bg-transparent backdrop-blur-[2px] shadow-sm overflow-hidden">
                {/* Liquid Glass Outlines - Matching Projects.jsx */}
                <div className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none z-30"></div>
                <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] border border-white/5 pointer-events-none z-30"></div>

                <div className="absolute inset-0 bg-purple-500/[0.0375] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-40"></div>
                <button
                  onClick={() => setLayoutView("grid")}
                  className={`relative z-20 px-3 py-2 flex items-center justify-center transition-all duration-300 ${
                    layoutView === "grid"
                      ? "bg-purple-500/[0.15] text-purple-100"
                      : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-500/[0.075]"
                  }`}
                  aria-label="Grid view"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <div className="w-px bg-white/10 z-20"></div>
                <button
                  onClick={() => setLayoutView("list")}
                  className={`relative z-20 px-3 py-2 flex items-center justify-center transition-all duration-300 ${
                    layoutView === "list"
                      ? "bg-purple-500/[0.15] text-purple-100"
                      : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-500/[0.075]"
                  }`}
                  aria-label="List view"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="relative group flex items-center gap-2 px-4 py-2 transition-all duration-300 border-0 rounded-lg bg-transparent backdrop-blur-[2px] shadow-sm text-purple-100 font-medium overflow-hidden"
              >
                {/* Liquid Glass Outlines - Matching Projects.jsx */}
                <div className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none z-30"></div>
                <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] border border-white/5 pointer-events-none z-30"></div>

                <div
                  className={`absolute inset-0 transition-colors duration-300 pointer-events-none ${showFilters ? "bg-purple-500/[0.15]" : "bg-purple-500/[0.0375] group-hover:bg-purple-500/[0.15]"}`}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-40 pointer-events-none"></div>
                <FiFilter className="relative z-40" />
                <span className="relative z-40">Filters</span>
                {selectedTags.length > 0 && (
                  <span className="relative z-40 px-2 py-1 text-xs text-white rounded-full bg-purple-500/30">
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
              className="relative group p-4 mt-4 border-0 rounded-lg bg-transparent backdrop-blur-[2px] shadow-sm overflow-hidden"
            >
              {/* Liquid Glass Outlines - Matching Projects.jsx */}
              <div className="absolute inset-0 rounded-lg border border-white/20 pointer-events-none z-30"></div>
              <div className="absolute inset-[1px] rounded-[calc(0.5rem-1px)] border border-white/5 pointer-events-none z-30"></div>

              <div className="absolute inset-0 bg-purple-500/[0.0375] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-40 pointer-events-none"></div>
              <div className="relative z-20">
                <h3 className="mb-3 text-sm font-medium text-purple-100">
                  Filter by tags:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                        selectedTags.includes(tag)
                          ? "bg-purple-500/[0.15] text-white border border-purple-400/40 font-medium shadow-[inset_0_0_12px_rgba(168,85,247,0.2)]"
                          : "bg-purple-500/[0.075] text-white/70 border border-purple-400/20 hover:bg-purple-500/[0.15] hover:text-white"
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
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-b-2 rounded-full animate-spin border-purple-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="py-20 text-center">
            <p className="mb-4 text-red-400">{error}</p>
            <button
              onClick={() => refetchPosts()}
              className="relative group px-6 py-2 transition-all duration-300 border rounded-lg bg-white/5 border-white/10 backdrop-blur-sm shadow-lg hover:bg-red-500/10 hover:border-red-500/30 text-white font-medium overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.03] via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-10 pointer-events-none"></div>
              <span className="relative z-20">Try Again</span>
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
                    className="mt-4 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Clear filters to see all posts
                  </button>
                )}
              </div>
            ) : (
              <>
                <div
                  className={`mb-12 ${
                    layoutView === "grid"
                      ? "grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "flex flex-col gap-6"
                  }`}
                >
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`relative group overflow-hidden transition-all duration-300 border rounded-xl backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg hover:shadow-[4px_8px_20px_rgba(168,85,247,0.2)] hover:border-white/20 ${
                        layoutView === "grid"
                          ? "h-full flex flex-col hover:-translate-y-1"
                          : "flex flex-col sm:flex-row"
                      }`}
                    >
                      {/* Premium Purple Fade & Liquid Accents */}
                      {layoutView === "grid" && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none z-0"></div>
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-30 group-hover:opacity-70 transition-opacity z-10"></div>
                        </>
                      )}

                      <Link
                        to={`/blogs/${post.slug}`}
                        className={`relative z-10 flex flex-1 overflow-hidden ${
                          layoutView === "list"
                            ? "flex-row h-[120px] sm:h-[154px]"
                            : "flex-col h-full"
                        }`}
                      >
                        {/* Featured Image - Reverted to Original Grid Proportions */}
                        {post.featured_image_url && (
                          <div
                            className={`relative overflow-hidden flex-shrink-0 ${
                              layoutView === "grid"
                                ? "w-full aspect-[2/1]"
                                : "w-28 sm:w-56 lg:w-64 h-full"
                            }`}
                            style={
                              layoutView === "grid"
                                ? {
                                    maskImage:
                                      "linear-gradient(to bottom, black 90%, transparent 100%)",
                                    WebkitMaskImage:
                                      "linear-gradient(to bottom, black 90%, transparent 100%)",
                                  }
                                : {}
                            }
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

                            {/* Purple Fade Bridge Overlay */}
                            {layoutView === "grid" && (
                              <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 via-transparent to-transparent pointer-events-none z-10" />
                            )}

                            <OptimizedImage
                              src={post.featured_image_url}
                              alt={post.title}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}

                        {/* Content Container - Restored Original Grid Spacing */}
                        <div
                          className={`relative flex flex-col flex-1 min-w-0 ${
                            layoutView === "list"
                              ? "p-3 sm:p-5 justify-center"
                              : "p-5 sm:p-6 justify-between"
                          }`}
                        >
                          {/* Inner Purple Ambient Fade */}
                          {layoutView === "grid" && (
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.05] via-transparent to-transparent pointer-events-none" />
                          )}

                          <div className="relative z-10 min-w-0">
                            {/* Title - Synchronized with Project Cards (font-medium) */}
                            <h2
                              className={`title-font font-medium tracking-tight text-white leading-tight transition-colors group-hover:text-purple-300 line-clamp-2 ${
                                layoutView === "grid"
                                  ? "text-xl mb-3"
                                  : "text-sm sm:text-xl mb-1.5 sm:mb-2"
                              }`}
                            >
                              {post.title}
                            </h2>

                            {/* Excerpt - Synchronized with Project Cards (font-light) */}
                            <p
                              className={`text-neutral-400 font-light leading-relaxed transition-colors ${
                                layoutView === "grid"
                                  ? "text-sm line-clamp-3 mb-4"
                                  : "hidden xs:line-clamp-1 sm:line-clamp-2 text-[10px] sm:text-sm mb-2 sm:mb-4"
                              }`}
                            >
                              {post.excerpt}
                            </p>
                          </div>

                          {/* Meta Info */}
                          <div
                            className={`flex items-center justify-between text-purple-200/60 mt-auto ${
                              layoutView === "grid"
                                ? "text-xs"
                                : "text-[10px] sm:text-xs"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {post.read_time && (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                  <span>{post.read_time} min read</span>
                                </span>
                              )}
                            </div>

                            <time
                              dateTime={post.created_at}
                              className="font-medium"
                            >
                              {new Date(post.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )}
                            </time>
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>

                {/* Pagination - Liquid Glass Button Group */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-12 mb-8">
                    <div className="relative group flex items-stretch border-0 rounded-xl bg-transparent backdrop-blur-[2px] shadow-sm overflow-hidden">
                      {/* Liquid Glass Outlines */}
                      <div className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none z-30"></div>
                      <div className="absolute inset-[1px] rounded-[calc(0.75rem-1px)] border border-white/5 pointer-events-none z-30"></div>

                      <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.03] via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-30 group-hover:opacity-60 transition-opacity z-40"></div>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentPage === 1}
                        className="relative z-20 px-4 py-2 text-sm font-medium transition-all duration-300 text-purple-100 hover:bg-purple-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        Prev
                      </button>

                      <div className="flex z-20">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <React.Fragment key={page}>
                            <div className="w-px bg-white/10" />
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                                currentPage === page
                                  ? "bg-purple-500/20 text-white shadow-[inset_0_0_12px_rgba(168,85,247,0.2)]"
                                  : "text-purple-300/70 hover:text-purple-100 hover:bg-purple-500/10"
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>

                      <div className="w-px bg-white/10 z-20" />
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className="relative z-20 px-4 py-2 text-sm font-medium transition-all duration-300 text-purple-100 hover:bg-purple-500/10 disabled:opacity-30 disabled:hover:bg-transparent"
                      >
                        Next
                      </button>
                    </div>
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
