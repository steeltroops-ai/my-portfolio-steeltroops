import { useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import {
  FiSend,
  FiUser,
  FiMail,
  FiMessageSquare,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import {
  useAddComment,
  useCommentValidation,
} from "../../hooks/useCommentQueries";

const CommentForm = ({ postId, onSuccess }) => {
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const { mutate: addComment, isLoading } = useAddComment();

  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (errors.content) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!content.trim()) {
      setErrors({ content: "Comment cannot be empty" });
      return;
    }

    if (content.length > 1000) {
      setErrors({ content: "Comment is too long (max 1000 characters)" });
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Submit the comment with anonymous author
    addComment(
      {
        content: content.trim(),
        post_id: postId,
        author_name: "Anonymous",
        author_email: "anonymous@example.com"
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowSuccess(true);
            setContent("");
            setIsFocused(false);

            // Hide success message after 3 seconds
            setTimeout(() => {
              setShowSuccess(false);
            }, 3000);

            if (onSuccess) onSuccess(result);
          } else {
            setErrors({ submit: result.error });
          }
        },
        onError: (error) => {
          setErrors({
            submit:
              error.message || "Failed to submit comment. Please try again.",
          });
        },
      }
    );
  };

  const handleCancel = () => {
    setContent("");
    setIsFocused(false);
    setErrors({});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 bg-green-900/20 border border-green-700/30 rounded-lg flex items-center gap-2"
        >
          <FiCheck className="text-green-400 text-xs flex-shrink-0" />
          <p className="text-green-300 text-xs">
            Comment posted!
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 p-2 bg-red-900/20 border border-red-700/30 rounded-lg flex items-center gap-2"
        >
          <FiAlertCircle className="text-red-400 text-xs flex-shrink-0" />
          <p className="text-red-300 text-xs">{errors.submit}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={`flex gap-3 transition-all duration-300 ease-in-out ${isFocused ? "items-start" : "items-center"
          }`}>
          {/* Avatar with user icon */}
          <div className="flex-shrink-0">
            <motion.div
              animate={{
                scale: isFocused ? 1 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-10 h-10 rounded-full border backdrop-blur-[2px] border-white/10 bg-white/5 flex items-center justify-center shadow-lg"
            >
              <FiUser className="text-neutral-400 text-sm" />
            </motion.div>
          </div>

          {/* Comment input area */}
          <div className="flex-1">
            <motion.div
              animate={{
                borderRadius: isFocused ? "0.5rem" : "9999px",
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`border backdrop-blur-[2px] shadow-lg ${errors.content
                ? "border-red-500/50 bg-red-500/5"
                : isFocused
                  ? "border-white/20 bg-white/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
            >
              <textarea
                value={content}
                onChange={handleContentChange}
                onFocus={() => setIsFocused(true)}
                rows={isFocused ? 3 : 1}
                className={`w-full text-sm bg-transparent focus:outline-none transition-all duration-300 ease-in-out resize-none text-white placeholder:text-neutral-500 ${isFocused
                  ? "px-3 py-2"
                  : "px-4 py-2 h-10 leading-6"
                  }`}
                placeholder="Add a comment..."
                disabled={isLoading}
              />

              {/* Action buttons - only show when focused */}
              {isFocused && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-between items-center px-3 pb-2 border-t border-white/10 pt-2"
                >
                  <p className="text-[10px] text-neutral-500">
                    {content.length}/1000
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs text-neutral-300 rounded-lg border backdrop-blur-[2px] border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={isLoading || !content.trim()}
                      whileHover={{ scale: isLoading || !content.trim() ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading || !content.trim() ? 1 : 0.98 }}
                      className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-all border backdrop-blur-[2px] ${isLoading || !content.trim()
                        ? "border-white/10 bg-white/5 text-neutral-500 cursor-not-allowed"
                        : "border-cyan-400/30 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                        }`}
                    >
                      {isLoading ? "Posting..." : "Comment"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {errors.content && (
              <p className="mt-1.5 text-xs text-red-400">{errors.content}</p>
            )}
          </div>
        </div>
      </form>
    </motion.div >
  );
};

CommentForm.propTypes = {
  postId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

export default CommentForm;

