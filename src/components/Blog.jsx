import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FiGithub, FiInstagram, FiSearch, FiFilter } from "react-icons/fi";
import { getPublishedPosts, getAllTags } from "../services/SupabaseBlogService";
import FloatingChatButton from "./FloatingChatButton";
import SEOHead from "./SEOHead";

const Blog = () => {
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const postsPerPage = 6;

  useEffect(() => {
    loadPosts();
    loadTags();
  }, [currentPage, searchTerm, selectedTags]);

  const loadPosts = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, count, error } = await getPublishedPosts({
        limit: postsPerPage,
        offset: (currentPage - 1) * postsPerPage,
        search: searchTerm,
        tags: selectedTags
      });

      if (error) throw error;

      setPosts(data || []);
      setTotalPosts(count || 0);
    } catch (err) {
      console.error('Error loading posts:', err);
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await getAllTags();
      if (error) throw error;
      setTags(data || []);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
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
      <div className="container px-8 mx-auto">
        {/* Navigation */}
        <nav className="flex justify-between items-center py-6 mb-8">
          <div className="flex flex-shrink-0 items-center">
            <Link to="/" className="text-2xl font-bold text-white hover:text-cyan-300 transition-colors">
              ← Back to Portfolio
            </Link>
          </div>
          <div className="flex gap-4 justify-center -mr-4 text-2xl items-center">
            <a
              href="https://x.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://github.com/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FiGithub />
            </a>
            <a
              href="https://instagram.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FiInstagram />
            </a>
            <a
              href="https://linkedin.com/in/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://bento.me/steeltroops"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <AiOutlineLink />
            </a>
          </div>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-4"
          >
            Blog
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-400 max-w-2xl mx-auto"
          >
            Thoughts, tutorials, and insights about web development, technology, and more.
          </motion.p>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </form>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors"
            >
              <FiFilter />
              Filters
              {selectedTags.length > 0 && (
                <span className="bg-cyan-600 text-white text-xs px-2 py-1 rounded-full">
                  {selectedTags.length}
                </span>
              )}
            </button>
          </div>

          {/* Tag Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800"
            >
              <h3 className="text-sm font-medium text-neutral-300 mb-3">Filter by tags:</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-cyan-600 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
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
                  className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={loadPosts}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded transition-colors"
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
              <div className="text-center py-20">
                <p className="text-neutral-400 text-lg">No blog posts found.</p>
                {(searchTerm || selectedTags.length > 0) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
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
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 border-neutral-800 bg-neutral-900/30 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1 group"
                    >
                      <Link to={`/blog/${post.slug}`} className="block space-y-4">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent rounded-xl transition-colors to-cyan-950/10 group-hover:to-cyan-950/20"></div>

                        {/* Featured Image */}
                        {post.featured_image_url && (
                          <div className="overflow-hidden relative mb-4 w-full rounded-lg aspect-video">
                            <img
                              src={post.featured_image_url}
                              alt={post.title}
                              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="relative space-y-3">
                          <h2 className="text-xl font-semibold text-white transition-colors group-hover:text-cyan-300 line-clamp-2">
                            {post.title}
                          </h2>

                          <p className="transition-colors text-neutral-400 group-hover:text-neutral-300 line-clamp-3">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="text-xs px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="flex items-center justify-between text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
                            <div className="flex items-center">
                              <span className="inline-block mr-2 w-2 h-2 bg-cyan-500 rounded-full"></span>
                              {new Date(post.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
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
                  <div className="flex justify-center items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                    >
                      Previous
                    </button>

                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded transition-colors ${
                            currentPage === page
                              ? 'bg-cyan-600 text-white'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
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
