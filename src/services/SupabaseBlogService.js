import {
  supabase,
  generateSlug,
  estimateReadingTime,
  extractExcerpt,
} from "../lib/supabase";
import { sanitizeBlogContent, sanitizeUserInput } from "../utils/sanitize";

// Blog Post CRUD Operations

/**
 * Get all published blog posts for public viewing
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of posts to fetch
 * @param {number} options.offset - Number of posts to skip
 * @param {string[]} options.tags - Filter by tags
 * @param {string} options.search - Search term
 * @returns {Promise<{data: Array, count: number, error: any}>}
 */
export const getPublishedPosts = async (options = {}) => {
  try {
    // Select only needed fields for blog listing
    const selectFields = `
      id,
      title,
      slug,
      excerpt,
      created_at,
      updated_at,
      read_time,
      tags,
      featured_image_url,
      author
    `;

    let query = supabase
      .from("blog_posts")
      .select(selectFields, { count: "exact" })
      .eq("published", true)
      .order("created_at", { ascending: false });

    // Apply filters
    if (options.tags && options.tags.length > 0) {
      query = query.overlaps("tags", options.tags);
    }

    if (options.search) {
      query = query.or(
        `title.ilike.%${options.search}%,excerpt.ilike.%${options.search}%,content.ilike.%${options.search}%`
      );
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count, error: null };
  } catch (error) {
    console.error("Error fetching published posts:", error);
    return { data: [], count: 0, error };
  }
};

/**
 * Get all blog posts (for admin)
 * @param {Object} options - Query options
 * @returns {Promise<{data: Array, count: number, error: any}>}
 */
export const getAllPosts = async (options = {}) => {
  try {
    // Select fields needed for admin dashboard
    const selectFields = `
      id,
      title,
      slug,
      excerpt,
      created_at,
      updated_at,
      published,
      read_time,
      tags,
      featured_image_url,
      author
    `;

    let query = supabase
      .from("blog_posts")
      .select(selectFields, { count: "exact" })
      .order("created_at", { ascending: false });

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    if (options.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count, error: null };
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return { data: [], count: 0, error };
  }
};

/**
 * Get a single blog post by slug
 * @param {string} slug - Post slug
 * @param {boolean} includeUnpublished - Include unpublished posts (for admin)
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const getPostBySlug = async (slug, includeUnpublished = false) => {
  try {
    let query = supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!includeUnpublished) {
      query = query.eq("published", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching post by slug:", error);
    return { data: null, error };
  }
};

/**
 * Get a single blog post by ID
 * @param {string} id - Post ID
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const getPostById = async (id) => {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return { data: null, error };
  }
};

/**
 * Create a new blog post
 * @param {Object} postData - Post data
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const createPost = async (postData) => {
  try {
    // Sanitize input data
    const sanitizedData = {
      ...postData,
      title: sanitizeUserInput(postData.title),
      content: sanitizeBlogContent(postData.content),
      excerpt: postData.excerpt ? sanitizeUserInput(postData.excerpt) : null,
      meta_description: postData.meta_description
        ? sanitizeUserInput(postData.meta_description)
        : null,
    };

    // Generate slug if not provided
    const slug = sanitizedData.slug || generateSlug(sanitizedData.title);

    // Generate excerpt if not provided
    const excerpt =
      sanitizedData.excerpt || extractExcerpt(sanitizedData.content);

    // Estimate reading time
    const readTime = estimateReadingTime(sanitizedData.content);

    const { data, error } = await supabase
      .from("blog_posts")
      .insert([
        {
          ...sanitizedData,
          slug,
          excerpt,
          read_time: readTime,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error creating post:", error);
    return { data: null, error };
  }
};

/**
 * Update a blog post
 * @param {string} id - Post ID
 * @param {Object} postData - Updated post data
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const updatePost = async (id, postData) => {
  try {
    // Sanitize input data
    const sanitizedData = {
      ...postData,
      title: postData.title ? sanitizeUserInput(postData.title) : undefined,
      content: postData.content
        ? sanitizeBlogContent(postData.content)
        : undefined,
      excerpt: postData.excerpt
        ? sanitizeUserInput(postData.excerpt)
        : undefined,
      meta_description: postData.meta_description
        ? sanitizeUserInput(postData.meta_description)
        : undefined,
    };

    // Update slug if title changed
    if (sanitizedData.title && !sanitizedData.slug) {
      sanitizedData.slug = generateSlug(sanitizedData.title);
    }

    // Update excerpt if content changed
    if (sanitizedData.content && !sanitizedData.excerpt) {
      sanitizedData.excerpt = extractExcerpt(sanitizedData.content);
    }

    // Update reading time if content changed
    if (sanitizedData.content) {
      sanitizedData.read_time = estimateReadingTime(sanitizedData.content);
    }

    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error updating post:", error);
    return { data: null, error };
  }
};

/**
 * Delete a blog post
 * @param {string} id - Post ID
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const deletePost = async (id) => {
  try {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error };
  }
};

/**
 * Toggle post published status
 * @param {string} id - Post ID
 * @param {boolean} published - Published status
 * @returns {Promise<{data: Object|null, error: any}>}
 */
export const togglePostPublished = async (id, published) => {
  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error toggling post published status:", error);
    return { data: null, error };
  }
};

/**
 * Get all unique tags from published posts
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getAllTags = async () => {
  try {
    // Use a more efficient query to get unique tags
    // This could be optimized further with a database function
    const { data, error } = await supabase
      .from("blog_posts")
      .select("tags")
      .eq("published", true)
      .not("tags", "is", null);

    if (error) throw error;

    // Extract and flatten all tags with better performance
    const tagSet = new Set();
    data.forEach((post) => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((tag) => {
          if (tag && tag.trim()) {
            tagSet.add(tag.trim());
          }
        });
      }
    });

    // Convert to sorted array
    const uniqueTags = Array.from(tagSet).sort();

    return { data: uniqueTags, error: null };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return { data: [], error };
  }
};
