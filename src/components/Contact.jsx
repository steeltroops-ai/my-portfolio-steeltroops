import { useState } from "react";
import { motion } from "framer-motion";
import { FiSend, FiCheck } from "react-icons/fi";
import { useSubmitContactMessage } from "../hooks/useContactQueries";
import { ContactService } from "../services/ContactService";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { mutate: submitMessage, isLoading } = useSubmitContactMessage();

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

    // Check if all required fields are filled
    const { name, email, subject, message } = formData;
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setErrors({
        submit: "Please fill in all required fields before sending.",
      });
      return;
    }

    // Validate form
    const validation = ContactService.validateContactForm(formData);
    if (Object.keys(validation.errors).length > 0) {
      setErrors({ submit: "Please check your input and try again." });
      return;
    }

    // Clear any previous errors
    setErrors({});

    // Submit the message
    submitMessage(formData, {
      onSuccess: (result) => {
        if (result.success) {
          setShowSuccess(true);
          setFormData({ name: "", email: "", subject: "", message: "" });

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
          submit: error.message || "Failed to send message. Please try again.",
        });
      },
    });
  };

  return (
    <div className="pb-4 border-b border-neutral-900">
      {/* Section Header - matching other components */}
      <motion.h2
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: -100 }}
        transition={{ duration: 1.2 }}
        className="my-20 text-4xl text-center"
      >
        Get In <span className="text-neutral-500">Touch</span>
      </motion.h2>

      {/* Two-Column Contact Form */}
      <motion.div
        whileInView={{ opacity: 1, y: 0 }}
        initial={{ opacity: 0, y: 50 }}
        transition={{ duration: 1 }}
        className="max-w-5xl mx-auto mb-8"
      >
        {/* Success Message */}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center p-4 mb-8 space-x-3 border border-green-700 rounded-lg bg-green-900/20 backdrop-blur-sm"
          >
            <FiCheck className="text-xl text-green-400" />
            <p className="text-green-400">
              Your message has been sent successfully! I&apos;ll get back to you
              soon.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Two-Column Layout */}
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-2">
            {/* Left Column - Name, Email, Subject */}
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col justify-between space-y-6"
            >
              {/* Name Field */}
              <div className="flex-1">
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-neutral-400"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-white transition-all duration-300 border rounded-xl backdrop-blur-sm bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:ring-0 focus:border-neutral-700/50 focus:bg-neutral-900/50 focus:shadow-lg focus:shadow-cyan-500/10 placeholder-neutral-500"
                  placeholder="Your name"
                  disabled={isLoading}
                />
              </div>

              {/* Email Field */}
              <div className="flex-1">
                <label
                  htmlFor="email"
                  className="block mb-2 text-sm font-medium text-neutral-400"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-white transition-all duration-300 border rounded-xl backdrop-blur-sm bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:ring-0 focus:border-neutral-700/50 focus:bg-neutral-900/50 focus:shadow-lg focus:shadow-cyan-500/10 placeholder-neutral-500"
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* Subject Field */}
              <div className="flex-1">
                <label
                  htmlFor="subject"
                  className="block mb-2 text-sm font-medium text-neutral-400"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-white transition-all duration-300 border rounded-xl backdrop-blur-sm bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:ring-0 focus:border-neutral-700/50 focus:bg-neutral-900/50 focus:shadow-lg focus:shadow-cyan-500/10 placeholder-neutral-500"
                  placeholder="What's this about?"
                  disabled={isLoading}
                />
              </div>
            </motion.div>

            {/* Right Column - Message Field */}
            <motion.div
              whileInView={{ opacity: 1, x: 0 }}
              initial={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col"
            >
              {/* Message Field */}
              <div className="flex flex-col flex-1">
                <label
                  htmlFor="message"
                  className="block mb-2 text-sm font-medium text-neutral-400"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full flex-1 min-h-[300px] px-4 py-3 transition-all duration-300 border rounded-xl backdrop-blur-sm bg-neutral-900/30 border-neutral-700/50 focus:outline-none focus:ring-0 focus:border-neutral-700/50 focus:bg-neutral-900/50 focus:shadow-lg focus:shadow-cyan-500/10 text-white placeholder-neutral-500 resize-none"
                  placeholder="Tell me about your project or idea... Share your vision, requirements, timeline, or any questions you have. I'd love to hear from you!"
                  disabled={isLoading}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  {formData.message.length}/2000 characters
                </p>
              </div>
            </motion.div>
          </div>

          {/* Submit Button - Centered and styled like blog buttons */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col items-center mt-10 space-y-3"
          >
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className={`inline-flex items-center px-8 py-4 text-sm font-medium rounded-xl transition-all duration-300 backdrop-blur-sm border space-x-3 ${
                isLoading
                  ? "bg-neutral-800/50 text-neutral-500 cursor-not-allowed border-neutral-700/50"
                  : "bg-neutral-900/50 hover:bg-neutral-800/70 text-white border-neutral-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-transparent rounded-full border-t-neutral-400 animate-spin" />
                  <span>Sending Message...</span>
                </>
              ) : (
                <>
                  <FiSend className="text-base" />
                  <span>Send Message</span>
                </>
              )}
            </motion.button>

            {/* Subtle Error Messages Below Button */}
            {errors.submit && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md text-xs text-center text-neutral-500"
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
