import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as NeonCommentsService from "../services/NeonCommentsService";

// Query keys for consistent caching
export const commentQueryKeys = {
  all: ["comments"],
  byPost: (postId) => [...commentQueryKeys.all, "post", postId],
  pending: () => [...commentQueryKeys.all, "pending"],
  stats: () => [...commentQueryKeys.all, "stats"],
};

/**
 * Hook to get comments for a specific blog post
 */
export const useComments = (postId, options = {}) => {
  return useQuery({
    queryKey: commentQueryKeys.byPost(postId),
    queryFn: () => NeonCommentsService.getPostComments(postId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!postId,
    select: (data) =>
      !data.error ? data : { data: [], count: 0, error: data.error },
  });
};

/**
 * Hook to add a new comment
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NeonCommentsService.submitComment,
    onSuccess: (data, variables) => {
      // Invalidate comments for the specific post
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.byPost(variables.post_id),
      });

      // Invalidate pending comments for admin
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.pending(),
      });

      // Invalidate comment stats
      queryClient.invalidateQueries({
        queryKey: commentQueryKeys.stats(),
      });
    },
    onError: (error) => {
      console.error("Failed to add comment:", error);
    },
  });
};

/**
 * Hook to update comment status (admin only)
 */
export const useUpdateCommentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, status }) => {
      if (status === 'approved') return NeonCommentsService.approveComment(commentId);
      if (status === 'rejected') return NeonCommentsService.rejectComment(commentId);
      if (status === 'spam') return NeonCommentsService.markCommentAsSpam(commentId);
      throw new Error(`Unknown status: ${status}`);
    },
    onSuccess: (_data, _variables) => {
      // Invalidate all comment-related queries
      queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
    },
    onError: (error) => {
      console.error("Failed to update comment status:", error);
    },
  });
};

/**
 * Hook to delete a comment (admin only)
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: NeonCommentsService.deleteComment,
    onSuccess: () => {
      // Invalidate all comment-related queries
      queryClient.invalidateQueries({ queryKey: commentQueryKeys.all });
    },
    onError: (error) => {
      console.error("Failed to delete comment:", error);
    },
  });
};

/**
 * Hook to get pending comments for moderation (admin only)
 */
export const usePendingComments = (options = {}) => {
  return useQuery({
    queryKey: commentQueryKeys.pending(),
    queryFn: () => NeonCommentsService.getAllComments({ ...options, status: 'pending' }),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    enabled: true,
    select: (data) =>
      !data.error ? data : { data: [], count: 0, error: data.error },
  });
};

/**
 * Validate comment data
 */
const validateComment = (commentData) => {
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
};

/**
 * Hook for comment form validation
 */
export const useCommentValidation = () => {
  return {
    validateComment,
  };
};
