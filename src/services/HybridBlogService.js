import {
  getPublishedPosts as getSupabasePosts,
  getPostBySlug as getSupabasePostBySlug,
  getAllTags as getSupabaseTags,
  getAllPosts as getSupabaseAllPosts,
  getPostById as getSupabasePostById,
} from "./SupabaseBlogService";
import staticBlogPosts from "../data/staticBlogPosts.json";

// Utility function to check if Supabase is available
const isSupabaseAvailable = async () => {
  try {
    // Try a simple query to test connectivity
    const result = await getSupabasePosts({ limit: 1 });
    return !result.error;
  } catch (error) {
    console.warn(
      "Supabase unavailable, falling back to static content:",
      error.message
    );
    return false;
  }
};

// Transform static posts to match Supabase format
const transformStaticPost = (post) => ({
  ...post,
  created_at: post.created_at,
  updated_at: post.updated_at,
  // Ensure all required fields are present
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
        post.content.toLowerCase().includes(searchTerm)
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
 * Hybrid function to get published posts
 * Tries Supabase first, falls back to static content
 */
export const getPublishedPosts = async (options = {}) => {
  try {
    // Try Supabase first
    if (await isSupabaseAvailable()) {
      console.log("Using Supabase for published posts");
      return await getSupabasePosts(options);
    }

    // Fall back to static content
    console.log("Using static content for published posts");
    return filterStaticPosts(staticBlogPosts, options);
  } catch (error) {
    console.error("Error in hybrid getPublishedPosts:", error);
    // Final fallback to static content
    return filterStaticPosts(staticBlogPosts, options);
  }
};

/**
 * Hybrid function to get a post by slug
 * Tries Supabase first, falls back to static content
 */
export const getPostBySlug = async (slug, includeUnpublished = false) => {
  try {
    // Try Supabase first
    if (await isSupabaseAvailable()) {
      console.log(`Using Supabase for post: ${slug}`);
      return await getSupabasePostBySlug(slug, includeUnpublished);
    }

    // Fall back to static content
    console.log(`Using static content for post: ${slug}`);
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
    // Final fallback
    const post = staticBlogPosts.find((p) => p.slug === slug);
    return post
      ? { data: transformStaticPost(post), error: null }
      : { data: null, error: { message: "Post not found" } };
  }
};

/**
 * Hybrid function to get all tags
 * Tries Supabase first, falls back to static content
 */
export const getAllTags = async () => {
  try {
    // Try Supabase first
    if (await isSupabaseAvailable()) {
      console.log("Using Supabase for tags");
      return await getSupabaseTags();
    }

    // Fall back to static content
    console.log("Using static content for tags");
    return getStaticTags();
  } catch (error) {
    console.error("Error in hybrid getAllTags:", error);
    // Final fallback
    return getStaticTags();
  }
};

/**
 * Admin functions - these will only work with Supabase
 * Return appropriate errors when Supabase is unavailable
 */
export const getAllPosts = async (options = {}) => {
  try {
    if (await isSupabaseAvailable()) {
      return await getSupabaseAllPosts(options);
    }

    // For admin functions, we can show static posts but indicate they're read-only
    const result = filterStaticPosts(staticBlogPosts, {
      ...options,
      includeUnpublished: true,
    });
    return {
      ...result,
      error: {
        message: "Admin features unavailable - showing static content only",
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

export const getPostById = async (id) => {
  try {
    if (await isSupabaseAvailable()) {
      return await getSupabasePostById(id);
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

// Export static content info for debugging
export const getDataSourceInfo = async () => {
  const supabaseAvailable = await isSupabaseAvailable();
  return {
    supabaseAvailable,
    staticPostsCount: staticBlogPosts.length,
    dataSource: supabaseAvailable ? "supabase" : "static",
  };
};

// Re-export admin functions that require Supabase (these will show appropriate errors)
export {
  createPost,
  updatePost,
  deletePost,
  togglePostPublished,
} from "./SupabaseBlogService";
