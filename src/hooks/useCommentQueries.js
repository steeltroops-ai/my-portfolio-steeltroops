import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CommentService } from "../services/CommentService";

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
    queryFn: () => CommentService.getComments(postId, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!postId,
    select: (data) =>
      data.success ? data : { data: [], count: 0, error: data.error },
  });
};

/**
 * Hook to add a new comment
 */
export const useAddComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CommentService.addComment,
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
    mutationFn: ({ commentId, status }) =>
      CommentService.updateCommentStatus(commentId, status),
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
    mutationFn: CommentService.deleteComment,
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
    queryFn: () => CommentService.getPendingComments(options),
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 3 * 60 * 1000, // 3 minutes
    enabled: true, // Only enable if user is admin
    select: (data) =>
      data.success ? data : { data: [], count: 0, error: data.error },
  });
};

/**
 * Hook to get comment statistics (admin only)
 */
export const useCommentStats = () => {
  return useQuery({
    queryKey: commentQueryKeys.stats(),
    queryFn: CommentService.getCommentStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: true, // Only enable if user is admin
    select: (data) => (data.success ? data.data : {}),
  });
};

/**
 * Hook for comment form validation
 */
export const useCommentValidation = () => {
  return {
    validateComment: CommentService.validateComment,
  };
};
