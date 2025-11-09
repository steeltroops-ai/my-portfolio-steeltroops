import { motion } from "framer-motion";
import PropTypes from "prop-types";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

const Comments = ({ postId, postTitle }) => {
  const handleCommentSuccess = (result) => {
    // Optional: Show toast notification or other success handling
    console.log("Comment submitted successfully:", result);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mt-12 space-y-6"
    >
      {/* Comments Section Header */}
      <div className="border-t border-white/10 pt-8">
        <h3 className="text-xl font-bold text-white mb-1">Discussion</h3>
        <p className="text-neutral-400 text-xs">
          Share your thoughts about &ldquo;{postTitle}&rdquo;
        </p>
      </div>

      {/* Comment Form */}
      <CommentForm postId={postId} onSuccess={handleCommentSuccess} />

      {/* Comments List */}
      <CommentList postId={postId} />
    </motion.section>
  );
};

Comments.propTypes = {
  postId: PropTypes.string.isRequired,
  postTitle: PropTypes.string.isRequired,
};

export default Comments;
