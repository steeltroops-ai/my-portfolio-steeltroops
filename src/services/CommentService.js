import { supabase } from '../lib/supabase.js';

export class CommentService {
  /**
   * Get comments for a specific blog post
   * @param {string} postId - Blog post ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Comments with user info
   */
  static async getComments(postId, options = {}) {
    try {
      const { limit = 20, offset = 0, orderBy = 'created_at', ascending = false } = options;

      let query = supabase
        .from('comments')
        .select(`
          *,
          user_profiles (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .eq('status', 'approved')
        .order(orderBy, { ascending });

      if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching comments:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        count: count || 0,
        error: null
      };

    } catch (error) {
      console.error('CommentService.getComments error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message || 'Failed to fetch comments'
      };
    }
  }

  /**
   * Add a new comment
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} Result object
   */
  static async addComment(commentData) {
    try {
      const { post_id, content, author_name, author_email, parent_id = null } = commentData;

      // Validate required fields
      if (!post_id || !content || !author_name || !author_email) {
        throw new Error('All fields are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(author_email)) {
        throw new Error('Please enter a valid email address');
      }

      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      const commentPayload = {
        post_id,
        content: content.trim(),
        author_name: author_name.trim(),
        author_email: author_email.trim().toLowerCase(),
        parent_id,
        user_id: user?.id || null,
        status: 'pending', // Comments need approval by default
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('comments')
        .insert([commentPayload])
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      return {
        success: true,
        data,
        message: 'Comment submitted successfully! It will appear after moderation.'
      };

    } catch (error) {
      console.error('CommentService.addComment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to add comment',
        data: null
      };
    }
  }

  /**
   * Update comment status (admin only)
   * @param {string} commentId - Comment ID
   * @param {string} status - New status (pending, approved, rejected)
   * @returns {Promise<Object>} Result object
   */
  static async updateCommentStatus(commentId, status) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        console.error('Error updating comment status:', error);
        throw error;
      }

      return {
        success: true,
        data,
        message: `Comment ${status} successfully`
      };

    } catch (error) {
      console.error('CommentService.updateCommentStatus error:', error);
      return {
        success: false,
        error: error.message || 'Failed to update comment status',
        data: null
      };
    }
  }

  /**
   * Delete a comment (admin only)
   * @param {string} commentId - Comment ID
   * @returns {Promise<Object>} Result object
   */
  static async deleteComment(commentId) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        throw error;
      }

      return {
        success: true,
        message: 'Comment deleted successfully'
      };

    } catch (error) {
      console.error('CommentService.deleteComment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete comment'
      };
    }
  }

  /**
   * Get pending comments for moderation (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Pending comments
   */
  static async getPendingComments(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      let query = supabase
        .from('comments')
        .select(`
          *,
          blog_posts (
            title,
            slug
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (limit > 0) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching pending comments:', error);
        throw error;
      }

      return {
        success: true,
        data: data || [],
        count: count || 0,
        error: null
      };

    } catch (error) {
      console.error('CommentService.getPendingComments error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        error: error.message || 'Failed to fetch pending comments'
      };
    }
  }

  /**
   * Get comment statistics
   * @returns {Promise<Object>} Comment statistics
   */
  static async getCommentStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_comment_stats');

      if (error) {
        console.error('Error fetching comment stats:', error);
        throw error;
      }

      return {
        success: true,
        data: data || {},
        error: null
      };

    } catch (error) {
      console.error('CommentService.getCommentStats error:', error);
      return {
        success: false,
        data: {},
        error: error.message || 'Failed to fetch comment statistics'
      };
    }
  }

  /**
   * Validate comment data
   * @param {Object} commentData - Comment data to validate
   * @returns {Object} Validation result
   */
  static validateComment(commentData) {
    const errors = {};
    const { content, author_name, author_email } = commentData;

    // Content validation
    if (!content || content.trim().length < 10) {
      errors.content = 'Comment must be at least 10 characters long';
    } else if (content.trim().length > 1000) {
      errors.content = 'Comment must be less than 1000 characters';
    }

    // Author name validation
    if (!author_name || author_name.trim().length < 2) {
      errors.author_name = 'Name must be at least 2 characters long';
    } else if (author_name.trim().length > 100) {
      errors.author_name = 'Name must be less than 100 characters';
    }

    // Email validation
    if (!author_email || author_email.trim().length === 0) {
      errors.author_email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(author_email.trim())) {
        errors.author_email = 'Please enter a valid email address';
      } else if (author_email.trim().length > 255) {
        errors.author_email = 'Email must be less than 255 characters';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
