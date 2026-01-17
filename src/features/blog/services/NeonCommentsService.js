// Neon Comments Service - For blog comments
import { commentsApi } from '@/lib/neon';

/**
 * Get comments for a blog post
 */
export const getPostComments = async (postId) => {
  try {
    const result = await commentsApi.getPostComments(postId);
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error('Error fetching post comments:', error);
    return { data: [], error };
  }
};

/**
 * Get all comments (admin only)
 */
export const getAllComments = async (options = {}) => {
  try {
    const result = await commentsApi.getAllComments(options);
    return { data: result.data || [], count: result.count || 0, error: null };
  } catch (error) {
    console.error('Error fetching all comments:', error);
    return { data: [], count: 0, error };
  }
};

/**
 * Submit a comment
 */
export const submitComment = async (commentData) => {
  try {
    const result = await commentsApi.createComment(commentData);
    return { data: result.data, success: true, message: result.message, error: null };
  } catch (error) {
    console.error('Error submitting comment:', error);
    return { data: null, success: false, error };
  }
};

/**
 * Approve a comment (admin only)
 */
export const approveComment = async (id) => {
  try {
    const result = await commentsApi.approveComment(id);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error approving comment:', error);
    return { data: null, error };
  }
};

/**
 * Reject a comment (admin only)
 */
export const rejectComment = async (id) => {
  try {
    const result = await commentsApi.rejectComment(id);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error rejecting comment:', error);
    return { data: null, error };
  }
};

/**
 * Mark comment as spam (admin only)
 */
export const markCommentAsSpam = async (id) => {
  try {
    const result = await commentsApi.markAsSpam(id);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Error marking comment as spam:', error);
    return { data: null, error };
  }
};

/**
 * Delete a comment (admin only)
 */
export const deleteComment = async (id) => {
  try {
    await commentsApi.deleteComment(id);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error };
  }
};
