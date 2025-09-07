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
  const [formData, setFormData] = useState({
    content: "",
    author_name: "",
    author_email: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { mutate: addComment, isLoading } = useAddComment();
  const { validateComment } = useCommentValidation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateComment(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Submit the comment
    addComment(
      { ...formData, post_id: postId },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowSuccess(true);
            setFormData({ content: "", author_name: "", author_email: "" });

            // Hide success message after 5 seconds
            setTimeout(() => {
              setShowSuccess(false);
            }, 5000);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-neutral-900/30 backdrop-blur-sm rounded-xl p-6 border border-neutral-800/50"
    >
      <h4 className="text-xl font-semibold text-neutral-200 mb-4 flex items-center gap-2">
        <FiMessageSquare className="text-cyan-400" />
        Leave a Comment
      </h4>

      {/* Success Message */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-900/20 border border-green-700/30 rounded-lg flex items-center gap-3"
        >
          <FiCheck className="text-green-400 text-xl flex-shrink-0" />
          <p className="text-green-300 text-sm">
            Comment submitted successfully! It will appear after moderation.
          </p>
        </motion.div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-900/20 border border-red-700/30 rounded-lg flex items-center gap-3"
        >
          <FiAlertCircle className="text-red-400 text-xl flex-shrink-0" />
          <p className="text-red-300 text-sm">{errors.submit}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Comment Content */}
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-neutral-300 mb-2"
          >
            Comment *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={4}
            className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all resize-vertical ${
              errors.content ? "border-red-500" : "border-neutral-700"
            }`}
            placeholder="Share your thoughts..."
            disabled={isLoading}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-400">{errors.content}</p>
          )}
          <p className="mt-1 text-xs text-neutral-500">
            {formData.content.length}/1000 characters
          </p>
        </div>

        {/* Author Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name Field */}
          <div>
            <label
              htmlFor="author_name"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              <FiUser className="inline mr-2" />
              Name *
            </label>
            <input
              type="text"
              id="author_name"
              name="author_name"
              value={formData.author_name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                errors.author_name ? "border-red-500" : "border-neutral-700"
              }`}
              placeholder="Your name"
              disabled={isLoading}
            />
            {errors.author_name && (
              <p className="mt-1 text-sm text-red-400">{errors.author_name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="author_email"
              className="block text-sm font-medium text-neutral-300 mb-2"
            >
              <FiMail className="inline mr-2" />
              Email *
            </label>
            <input
              type="email"
              id="author_email"
              name="author_email"
              value={formData.author_email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                errors.author_email ? "border-red-500" : "border-neutral-700"
              }`}
              placeholder="your.email@example.com"
              disabled={isLoading}
            />
            {errors.author_email && (
              <p className="mt-1 text-sm text-red-400">{errors.author_email}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                : "bg-cyan-600 hover:bg-cyan-700 text-white"
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 rounded-full border-neutral-400 border-t-transparent animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FiSend />
                Post Comment
              </>
            )}
          </motion.button>
        </div>
      </form>

      <p className="mt-4 text-xs text-neutral-500">
        Your email will not be published. All comments are moderated before
        appearing.
      </p>
    </motion.div>
  );
};

CommentForm.propTypes = {
  postId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

export default CommentForm;
