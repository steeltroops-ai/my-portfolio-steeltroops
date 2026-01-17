/**
 * Hybrid Blog Service
 * Uses Neon database as primary source, falls back to static content seamlessly
 */

import {
  getPublishedPosts as getNeonPosts,
  getAllPosts as getNeonAllPosts,
  getPostBySlug as getNeonPostBySlug,
  getPostById as getNeonPostById,
  getAllTags as getNeonTags,
  createPost as neonCreatePost,
  updatePost as neonUpdatePost,
  deletePost as neonDeletePost,
  togglePostPublished as neonTogglePostPublished,
} from "./NeonBlogService";
import staticBlogPosts from "@/data/staticBlogPosts.json";

// Cache for Neon availability check
let neonAvailabilityCache = null;
let neonAvailabilityTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Check if Neon API is available (with caching)
const isNeonAvailable = async () => {
  const now = Date.now();
  
  // Use cached result if still valid
  if (neonAvailabilityCache !== null && now - neonAvailabilityTimestamp < CACHE_DURATION) {
    return neonAvailabilityCache;
  }
  
  try {
    const result = await getNeonPosts({ limit: 1 });
    neonAvailabilityCache = !result.error;
    neonAvailabilityTimestamp = now;
    return neonAvailabilityCache;
  } catch (error) {
    // Silently fallback to static - this is expected in local dev
    neonAvailabilityCache = false;
    neonAvailabilityTimestamp = now;
    return false;
  }
};

// Transform static posts to match database format
const transformStaticPost = (post) => ({
  ...post,
  created_at: post.created_at,
  updated_at: post.updated_at,
  featured_image_url: post.featured_image_url || null,
  meta_description: post.meta_description || post.excerpt,
});

// Filter and search static posts
const filterStaticPosts = (posts, options = {}) => {
  let filteredPosts = [...posts];

  // Filter by published status
  filteredPosts = filteredPosts.filter((post) => post.published);

  // Filter by tags
  if (options.tags && options.tags.length > 0) {
    filteredPosts = filteredPosts.filter(
      (post) => post.tags && post.tags.some((tag) => options.tags.includes(tag))
    );
  }

  // Search functionality
  if (options.search) {
    const searchTerm = options.search.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTerm) ||
        post.excerpt.toLowerCase().includes(searchTerm) ||
        (post.content && post.content.toLowerCase().includes(searchTerm))
    );
  }

  // Sort by creation date (newest first)
  filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Apply pagination
  const total = filteredPosts.length;
  if (options.offset || options.limit) {
    const start = options.offset || 0;
    const end = options.limit ? start + options.limit : filteredPosts.length;
    filteredPosts = filteredPosts.slice(start, end);
  }

  return {
    data: filteredPosts.map(transformStaticPost),
    count: total,
    error: null,
  };
};

// Extract unique tags from static posts
const getStaticTags = () => {
  const allTags = staticBlogPosts
    .filter((post) => post.published && post.tags)
    .flatMap((post) => post.tags);

  const uniqueTags = [...new Set(allTags)];

  return {
    data: uniqueTags,
    error: null,
  };
};

/**
 * Get published posts - tries Neon first, falls back to static seamlessly
 */
export const getPublishedPosts = async (options = {}) => {
  try {
    if (await isNeonAvailable()) {
      const result = await getNeonPosts(options);
      if (!result.error && result.data && result.data.length > 0) {
        return result;
      }
    }
    // Fallback to static content without indicating "offline"
    return filterStaticPosts(staticBlogPosts, options);
  } catch (error) {
    console.error("Error in hybrid getPublishedPosts:", error);
    return filterStaticPosts(staticBlogPosts, options);
  }
};

/**
 * Get a post by slug - tries Neon first, falls back to static seamlessly
 */
export const getPostBySlug = async (slug, includeUnpublished = false) => {
  try {
    if (await isNeonAvailable()) {
      const result = await getNeonPostBySlug(slug, includeUnpublished);
      if (!result.error && result.data) {
        return result;
      }
    }

    // Fallback to static content
    const post = staticBlogPosts.find((p) => p.slug === slug);

    if (!post) {
      return { data: null, error: { message: "Post not found" } };
    }

    if (!includeUnpublished && !post.published) {
      return { data: null, error: { message: "Post not published" } };
    }

    return { data: transformStaticPost(post), error: null };
  } catch (error) {
    console.error("Error in hybrid getPostBySlug:", error);
    const post = staticBlogPosts.find((p) => p.slug === slug);
    return post
      ? { data: transformStaticPost(post), error: null }
      : { data: null, error: { message: "Post not found" } };
  }
};

/**
 * Get all tags - tries Neon first, falls back to static seamlessly
 */
export const getAllTags = async () => {
  try {
    if (await isNeonAvailable()) {
      const result = await getNeonTags();
      if (!result.error && result.data && result.data.length > 0) {
        return result;
      }
    }
    return getStaticTags();
  } catch (error) {
    console.error("Error in hybrid getAllTags:", error);
    return getStaticTags();
  }
};

/**
 * Get all posts (admin) - tries Neon first, shows warning for static
 */
export const getAllPosts = async (options = {}) => {
  try {
    if (await isNeonAvailable()) {
      return await getNeonAllPosts(options);
    }

    // For admin functions, show static posts but indicate read-only
    const allPosts = staticBlogPosts.map(transformStaticPost);
    return {
      data: allPosts,
      count: allPosts.length,
      error: {
        message: "Database unavailable - showing static content only",
        type: "warning",
      },
    };
  } catch (error) {
    return {
      data: [],
      count: 0,
      error: { message: "Admin features unavailable", type: "error" },
    };
  }
};

/**
 * Get post by ID (admin)
 */
export const getPostById = async (id) => {
  try {
    if (await isNeonAvailable()) {
      return await getNeonPostById(id);
    }

    const post = staticBlogPosts.find((p) => p.id === id);
    return post
      ? {
          data: transformStaticPost(post),
          error: { message: "Read-only mode", type: "warning" },
        }
      : { data: null, error: { message: "Post not found" } };
  } catch (error) {
    return { data: null, error: { message: "Admin features unavailable" } };
  }
};

/**
 * Get data source information
 */
export const getDataSourceInfo = async () => {
  const neonAvailable = await isNeonAvailable();
  return {
    neonAvailable,
    staticPostsCount: staticBlogPosts.length,
    dataSource: neonAvailable ? "neon" : "static",
  };
};

// Admin write operations - require Neon
export const createPost = async (postData) => {
  if (!(await isNeonAvailable())) {
    return { data: null, error: { message: "Database not available for write operations" } };
  }
  return neonCreatePost(postData);
};

export const updatePost = async (id, postData) => {
  if (!(await isNeonAvailable())) {
    return { data: null, error: { message: "Database not available for write operations" } };
  }
  return neonUpdatePost(id, postData);
};

export const deletePost = async (id) => {
  if (!(await isNeonAvailable())) {
    return { success: false, error: { message: "Database not available for write operations" } };
  }
  return neonDeletePost(id);
};

export const togglePostPublished = async (id, published) => {
  if (!(await isNeonAvailable())) {
    return { data: null, error: { message: "Database not available for write operations" } };
  }
  return neonTogglePostPublished(id, published);
};
