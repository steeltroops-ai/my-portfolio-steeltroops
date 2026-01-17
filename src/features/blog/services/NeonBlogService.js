// Neon Blog Service - Replaces SupabaseBlogService
import { postsApi, tagsApi, generateSlug, estimateReadingTime, extractExcerpt } from '@/lib/neon';
import { sanitizeBlogContent, sanitizeUserInput } from '@/utils/sanitize';

/**
 * Get all published blog posts for public viewing
 */
export const getPublishedPosts = async (options = {}) => {
  try {
    const result = await postsApi.getPublishedPosts(options);
    return { data: result.data || [], count: result.count || 0, error: null };
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Get all blog posts (for admin)
 */
export const getAllPosts = async (options = {}) => {
  try {
    const result = await postsApi.getAllPosts(options);
    return { data: result.data || [], count: result.count || 0, error: null };
  } catch (error) {
    console.error('Error fetching all posts:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Get a single blog post by slug
 */
export const getPostBySlug = async (slug, includeUnpublished = false) => {
  try {
    const result = await postsApi.getPostBySlug(slug, includeUnpublished);
    return { data: result.data || null, error: null };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return { data: null, error };
  }
};

/**
 * Get a single blog post by ID
 */
export const getPostById = async (id) => {
  try {
    const result = await postsApi.getPostById(id);
    return { data: result.data || null, error: null };
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    return { data: null, error };
  }
};

/**
 * Create a new blog post
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
    const excerpt = sanitizedData.excerpt || extractExcerpt(sanitizedData.content);

    // Estimate reading time
    const readTime = estimateReadingTime(sanitizedData.content);

    const result = await postsApi.createPost({
      ...sanitizedData,
      slug,
      excerpt,
      read_time: readTime,
    });

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error creating post:', error);
    return { data: null, error };
  }
};

/**
 * Update a blog post
 */
export const updatePost = async (id, postData) => {
  try {
    // Sanitize input data
    const sanitizedData = {
      ...postData,
      title: postData.title ? sanitizeUserInput(postData.title) : undefined,
      content: postData.content ? sanitizeBlogContent(postData.content) : undefined,
      excerpt: postData.excerpt ? sanitizeUserInput(postData.excerpt) : undefined,
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

    const result = await postsApi.updatePost(id, sanitizedData);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error updating post:', error);
    return { data: null, error };
  }
};

/**
 * Delete a blog post
 */
export const deletePost = async (id) => {
  try {
    await postsApi.deletePost(id);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting post:', error);
    return { success: false, error };
  }
};

/**
 * Toggle post published status
 */
export const togglePostPublished = async (id, published) => {
  try {
    const result = await postsApi.togglePostPublished(id, published);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error toggling post published status:', error);
    return { data: null, error };
  }
};

/**
 * Get all unique tags from published posts
 */
export const getAllTags = async () => {
  try {
    const result = await tagsApi.getAllTags();
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { data: [], error };
  }
};
