import React, { useState } from "react";
import { CONTACT } from "../constants";
import { motion } from "framer-motion";
import {
  FiSend,
  FiCheck,
  FiAlertCircle,
  FiUser,
  FiMessageSquare,
  FiMail,
} from "react-icons/fi";
import {
  useSubmitContactMessage,
  useContactFormValidation,
} from "../hooks/useContactQueries";

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

    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
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
          // Handle fallback case (database not set up)
          if (result.fallback) {
            setErrors({
              submit: result.error,
              fallback: true,
            });
          } else {
            setErrors({ submit: result.error });
          }
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
    <div className="pt-0 pb-6 border-b border-neutral-900">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="my-10 text-4xl text-center"
      >
        Get In Touch
      </motion.h1>

      <div className="max-w-4xl mx-auto px-4">
        {/* Contact Form - Integrated Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900/30 backdrop-blur-sm rounded-xl p-6 border border-neutral-800/50"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-neutral-200 mb-2">
              Send a Message
            </h3>
            <p className="text-neutral-400 text-sm">
              {CONTACT.phoneNo} • {CONTACT.email}
            </p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 mb-6 border rounded-lg bg-green-900/20 border-green-700/30"
            >
              <FiCheck className="flex-shrink-0 text-xl text-green-400" />
              <p className="text-sm text-green-300">
                Thank you for your message! I'll get back to you soon.
              </p>
            </motion.div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                errors.fallback
                  ? "bg-yellow-900/20 border border-yellow-700/30"
                  : "bg-red-900/20 border border-red-700/30"
              }`}
            >
              <FiAlertCircle
                className={`text-xl flex-shrink-0 mt-0.5 ${
                  errors.fallback ? "text-yellow-400" : "text-red-400"
                }`}
              />
              <div>
                <p
                  className={`text-sm ${
                    errors.fallback ? "text-yellow-300" : "text-red-300"
                  }`}
                >
                  {errors.submit}
                </p>
                {errors.fallback && (
                  <div className="mt-2">
                    <a
                      href="mailto:steeltroops.ai@gmail.com?subject=Contact from Portfolio"
                      className="inline-flex items-center gap-2 text-sm font-medium transition-colors text-cyan-400 hover:text-cyan-300"
                    >
                      <FiMail className="text-sm" />
                      Send Email Directly
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              {/* Left Column - Name, Email, Subject */}
              <div className="space-y-4">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-neutral-300"
                  >
                    <FiUser className="inline mr-2" />
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                      errors.name ? "border-red-500" : "border-neutral-700"
                    }`}
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-neutral-300"
                  >
                    <FiMail className="inline mr-2" />
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                      errors.email ? "border-red-500" : "border-neutral-700"
                    }`}
                    placeholder="your.email@example.com"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block mb-2 text-sm font-medium text-neutral-300"
                  >
                    <FiMessageSquare className="inline mr-2" />
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all ${
                      errors.subject ? "border-red-500" : "border-neutral-700"
                    }`}
                    placeholder="What would you like to discuss?"
                    disabled={isLoading}
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.subject}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Message Field */}
              <div className="space-y-4">
                {/* Message Field */}
                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2 text-sm font-medium text-neutral-300"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    className={`w-full px-4 py-3 bg-neutral-800 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all resize-vertical ${
                      errors.message ? "border-red-500" : "border-neutral-700"
                    }`}
                    placeholder="Tell me about your project, question, or just say hello..."
                    disabled={isLoading}
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-neutral-500">
                    {formData.message.length}/2000 characters
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  isLoading
                    ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-700 text-white"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 rounded-full border-neutral-400 border-t-transparent animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Send Message
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
