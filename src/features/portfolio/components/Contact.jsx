import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiSend, FiCheck } from "react-icons/fi";
import { useSubmitContactMessage, useContactFormValidation } from "@/shared/hooks/useContactQueries";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    _hp: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const formStartRef = useRef(Date.now());

  const { mutate: submitMessage, isLoading } = useSubmitContactMessage();
  const { validateForm } = useContactFormValidation();

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

    // Anti-abuse checks: honeypot and minimum time on page
    const submissionDurationMs = Date.now() - formStartRef.current;
    if (formData._hp && formData._hp.trim() !== "") {
      setErrors({ submit: "Spam detected. Please try again." });
      return;
    }
    if (submissionDurationMs < 2000) {
      setErrors({
        submit: "Please take a moment to complete the form before submitting.",
      });
      return;
    }

    // Check if all required fields are filled
    const { name, email, subject, message } = formData;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrors({
        submit: "Please fill in all required fields before sending.",
      });

      return;
    }

    // Validate form
    const validation = validateForm(formData);
    if (Object.keys(validation.errors).length > 0) {
      setErrors({ submit: "Please check your input and try again." });
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Submit the message
    submitMessage(
      { ...formData, submissionDurationMs },
      {
        onSuccess: (result) => {
          if (result.success) {
            setShowSuccess(true);
            setFormData({
              name: "",
              email: "",
              subject: "",
              message: "",
              _hp: "",
            });

            // Hide success message after 5 seconds
            setTimeout(() => {
              setShowSuccess(false);
            }, 5000);
          } else {
            setErrors({ submit: result.error });
          }
        },
        onError: (error) => {
          setErrors({
            submit:
              error.message || "Failed to send message. Please try again.",
          });
        },
      }
    );
  };

  return (
    <div id="contact" className="pb-8 lg:pb-12 border-b border-neutral-800 scroll-mt-20">
      {/* Section Header - Responsive & Sleek */}
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-10 sm:my-12 lg:my-20 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-thin tracking-tight text-center px-4"
      >
        Let's <span className="text-neutral-500">Connect</span>
      </motion.h2>

      {/* Responsive Contact Form Container */}
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 50 }}
        transition={{ duration: 1 }}
        className="max-w-3xl mx-auto mb-8 px-4 sm:px-6 lg:px-8"
      >
        {/* Success Message - Responsive Liquid Glass */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center p-3 sm:p-4 mb-6 space-x-2 border border-green-400/50 rounded-full bg-green-500/20 backdrop-blur-md shadow-lg shadow-green-500/10"
          >
            <FiCheck className="text-base sm:text-lg text-green-400" />
            <p className="text-xs sm:text-sm text-green-400 font-medium">Message sent successfully!</p>
          </motion.div>
        )}

        {/* Honeypot field for spam bots - should remain empty */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="_hp">Leave this field empty</label>
          <input
            type="text"
            id="_hp"
            name="_hp"
            value={formData._hp}
            onChange={handleInputChange}
            autoComplete="off"
            tabIndex="-1"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Responsive Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Name Field - Responsive Liquid Glass */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-white transition-all duration-300 border rounded-lg backdrop-blur-md bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:border-purple-400/50 focus:bg-purple-500/10 focus:shadow-lg focus:shadow-purple-500/10 placeholder-neutral-500 text-sm sm:text-base"
                placeholder="Your name"
                disabled={isLoading}
                required
                aria-required="true"
              />
            </motion.div>

            {/* Email Field - Responsive Liquid Glass */}
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-white transition-all duration-300 border rounded-lg backdrop-blur-md bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:border-purple-400/50 focus:bg-purple-500/10 focus:shadow-lg focus:shadow-purple-500/10 placeholder-neutral-500 text-sm sm:text-base"
                placeholder="your@email.com"
                disabled={isLoading}
                required
                aria-required="true"
              />
            </motion.div>
          </div>

          {/* Subject Field - Responsive Liquid Glass */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <label htmlFor="subject" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-white transition-all duration-300 border rounded-lg backdrop-blur-md bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:border-purple-400/50 focus:bg-purple-500/10 focus:shadow-lg focus:shadow-purple-500/10 placeholder-neutral-500 text-sm sm:text-base"
              placeholder="What's this about?"
              disabled={isLoading}
              required
              aria-required="true"
            />
          </motion.div>

          {/* Message Field - Responsive Liquid Glass */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <label htmlFor="message" className="block text-sm font-medium text-neutral-300 mb-1.5">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              className="w-full min-h-[160px] sm:min-h-[180px] px-3 sm:px-4 py-2.5 sm:py-3 pb-8 transition-all duration-300 border rounded-lg backdrop-blur-md bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:border-purple-400/50 focus:bg-purple-500/10 focus:shadow-lg focus:shadow-purple-500/10 text-white placeholder-neutral-500 resize-none text-sm sm:text-base"
              placeholder="Write your message here..."
              disabled={isLoading}
              required
              aria-required="true"
              maxLength={2000}
              aria-describedby="message-counter"
            />
            <span id="message-counter" className="absolute bottom-2.5 sm:bottom-3 right-3 sm:right-4 text-xs text-neutral-500">
              {formData.message.length}/2000
            </span>
          </motion.div>

          {/* Centered Send Button - Responsive Liquid Glass */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center pt-3 sm:pt-4 space-y-2 sm:space-y-3"
          >
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.05 }}
              whileTap={{ scale: isLoading ? 1 : 0.95 }}
              className={`inline-flex items-center justify-center px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-all duration-300 backdrop-blur-md shadow-lg ${isLoading
                ? "bg-neutral-800/50 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
                : "bg-purple-500/20 text-purple-300 border border-purple-400/50 hover:bg-purple-500/30 hover:border-purple-400/70 hover:shadow-xl hover:shadow-purple-500/20"
                }`}
            >
              <span className="flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-transparent rounded-full border-t-neutral-400 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <FiSend className="text-sm sm:text-base" />
                  </>
                )}
              </span>
            </motion.button>

            {/* Error Messages - Responsive */}
            {errors.submit && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs sm:text-sm text-neutral-400 text-center max-w-sm px-4"
              >
                {errors.submit}
              </motion.p>
            )}
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

// Contact component doesn't currently accept props

export default Contact;
