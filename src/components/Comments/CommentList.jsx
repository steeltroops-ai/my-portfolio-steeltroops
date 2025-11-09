import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { FiMessageSquare, FiUser, FiClock } from "react-icons/fi";
import { useComments } from "../../hooks/useCommentQueries";

const CommentItem = ({ comment, index }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="rounded-lg p-3 border backdrop-blur-[2px] border-white/10 bg-white/5 shadow-lg"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user_profiles?.avatar_url ? (
            <img
              src={comment.user_profiles.avatar_url}
              alt={comment.author_name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-medium text-xs">
              {getInitials(comment.author_name)}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1.5">
            <h5 className="font-medium text-white text-xs flex items-center gap-1.5">
              <FiUser className="text-cyan-400 text-[10px]" />
              {comment.user_profiles?.display_name || comment.author_name}
            </h5>
            <span className="text-neutral-500 text-[10px] flex items-center gap-1">
              <FiClock className="text-[8px]" />
              {formatDate(comment.created_at)}
            </span>
          </div>

          {/* Comment Text */}
          <div className="text-neutral-300 text-xs leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

CommentItem.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string,
    author_name: PropTypes.string,
    author_email: PropTypes.string,
    created_at: PropTypes.string,
    user_profiles: PropTypes.shape({
      avatar_url: PropTypes.string,
      display_name: PropTypes.string,
    }),
  }).isRequired,
  index: PropTypes.number.isRequired,
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
        <p className="text-red-300 text-sm">
          Failed to load comments. Please try again later.
        </p>
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
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <FiMessageSquare className="text-cyan-400 text-sm" />
        <h4 className="text-sm font-semibold text-white">
          Comments ({comments.length})
        </h4>
      </div>

      <div className="space-y-3">
        {comments.map((comment, index) => (
          <CommentItem key={comment.id} comment={comment} index={index} />
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

CommentList.propTypes = {
  postId: PropTypes.string.isRequired,
};

export default CommentList;

