import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageSquare, FiUser, FiClock } from 'react-icons/fi';
import { useComments } from '../../hooks/useCommentQueries';

const CommentItem = ({ comment, index }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-neutral-900/20 backdrop-blur-sm rounded-lg p-4 border border-neutral-800/30"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user_profiles?.avatar_url ? (
            <img
              src={comment.user_profiles.avatar_url}
              alt={comment.author_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-medium text-sm">
              {getInitials(comment.author_name)}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <h5 className="font-medium text-neutral-200 flex items-center gap-2">
              <FiUser className="text-cyan-400 text-sm" />
              {comment.user_profiles?.display_name || comment.author_name}
            </h5>
            <span className="text-neutral-500 text-sm flex items-center gap-1">
              <FiClock className="text-xs" />
              {formatDate(comment.created_at)}
            </span>
          </div>

          {/* Comment Text */}
          <div className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>

          {/* Actions (for future features like replies) */}
          <div className="mt-3 flex items-center gap-4">
            <button className="text-neutral-500 hover:text-cyan-400 text-xs transition-colors">
              Reply
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CommentList = ({ postId }) => {
  const { data: commentsData, isLoading, error } = useComments(postId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-neutral-900/20 backdrop-blur-sm rounded-lg p-4 border border-neutral-800/30 animate-pulse"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-neutral-700"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-700 rounded w-1/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-3/4"></div>
                <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 text-center">
        <p className="text-red-300 text-sm">Failed to load comments. Please try again later.</p>
      </div>
    );
  }

  const comments = commentsData?.data || [];

  if (comments.length === 0) {
    return (
      <div className="bg-neutral-900/20 backdrop-blur-sm rounded-lg p-8 border border-neutral-800/30 text-center">
        <FiMessageSquare className="text-neutral-500 text-4xl mx-auto mb-4" />
        <h4 className="text-neutral-400 font-medium mb-2">No comments yet</h4>
        <p className="text-neutral-500 text-sm">
          Be the first to share your thoughts on this post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <FiMessageSquare className="text-cyan-400" />
        <h4 className="text-xl font-semibold text-neutral-200">
          Comments ({comments.length})
        </h4>
      </div>

      <div className="space-y-4">
        {comments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            index={index}
          />
        ))}
      </div>

      {/* Load More Button (for future pagination) */}
      {comments.length >= 20 && (
        <div className="text-center pt-4">
          <button className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors">
            Load More Comments
          </button>
        </div>
      )}
    </div>
  );
};

export default CommentList;
