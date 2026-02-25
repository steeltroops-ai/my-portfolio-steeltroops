import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { BiSend, BiCheck } from "react-icons/bi";
import {
  useSubmitContactMessage,
  useContactFormValidation,
} from "@/shared/hooks/useContactQueries";
import { useAnalytics } from "@/shared/analytics/useAnalytics";

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
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);

  const { mutate: submitMessage, isLoading } = useSubmitContactMessage();
  const { validateForm } = useContactFormValidation();
  const { trackEvent } = useAnalytics();

  // Sync browser autofill into React controlled state.
  // Browsers autofill inputs shortly after page load via the autoComplete tokens,
  // but React's controlled `value` prop overrides those injected values on re-render.
  // We poll the raw DOM values at multiple intervals to catch whichever timing
  // the current browser uses (Chrome ~100ms, Firefox/Safari ~500-1000ms).
  useEffect(() => {
    const syncAutofill = () => {
      const nameFilled = nameInputRef.current?.value;
      const emailFilled = emailInputRef.current?.value;
      if (nameFilled || emailFilled) {
        setFormData((prev) => {
          // Only sync if the field is still empty (don't overwrite user-typed data)
          const nameChanged = nameFilled && !prev.name;
          const emailChanged = emailFilled && !prev.email;

          if (!nameChanged && !emailChanged) return prev; // Nothing new

          // Fire identity capture to analytics - passive God Mode binding
          // at autofill detection time, before the user even hits Send.
          const resolvedName = nameChanged ? nameFilled : prev.name;
          const resolvedEmail = emailChanged ? emailFilled : prev.email;

          if (resolvedName || resolvedEmail) {
            const visitorId = localStorage.getItem("portfolio_visitor_id");
            const sessionId = sessionStorage.getItem("portfolio_session_id");

            // 1. Lightweight event log row
            trackEvent(
              "contact",
              "autofill_detected",
              JSON.stringify({ name: resolvedName, email: resolvedEmail })
            );

            // 2. Passive identity resolve - upsert known_entities + link visitor
            if (resolvedEmail) {
              fetch("/api/analytics/track?action=identify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  visitorId,
                  sessionId,
                  name: resolvedName || null,
                  email: resolvedEmail,
                  source: "autofill",
                }),
              }).catch(() => {}); // Silent fail - non-blocking
            }
          }

          return {
            ...prev,
            ...(nameChanged ? { name: nameFilled } : {}),
            ...(emailChanged ? { email: emailFilled } : {}),
          };
        });
      }
    };

    // Fire immediately, then at typical browser autofill delay windows
    syncAutofill();
    const t1 = setTimeout(syncAutofill, 100);
    const t2 = setTimeout(syncAutofill, 500);
    const t3 = setTimeout(syncAutofill, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [trackEvent]);

  // Programmatic autofill trigger:
  // When user clicks "Contact" in nav or "Hire Me" in hero, a custom event fires.
  // We respond by focusing the name input — this is what tells the browser to
  // fire its autofill engine for this form. We then poll for the injected values.
  useEffect(() => {
    const onTrigger = () => {
      const nameEl = nameInputRef.current;
      const emailEl = emailInputRef.current;
      if (!nameEl) return;

      // Focus name field → triggers browser autofill engine
      nameEl.focus();

      // Poll after typical autofill injection delay
      const poll = () => {
        const nameFilled = nameInputRef.current?.value;
        const emailFilled = emailInputRef.current?.value;

        if (nameFilled || emailFilled) {
          setFormData((prev) => {
            const nameChanged = nameFilled && !prev.name;
            const emailChanged = emailFilled && !prev.email;
            if (!nameChanged && !emailChanged) return prev;

            const resolvedName = nameChanged ? nameFilled : prev.name;
            const resolvedEmail = emailChanged ? emailFilled : prev.email;

            if (resolvedEmail) {
              const visitorId = localStorage.getItem("portfolio_visitor_id");
              const sessionId = sessionStorage.getItem("portfolio_session_id");

              trackEvent(
                "contact",
                "autofill_detected",
                JSON.stringify({
                  name: resolvedName,
                  email: resolvedEmail,
                  trigger: "nav_click",
                })
              );

              fetch("/api/analytics/track?action=identify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  visitorId,
                  sessionId,
                  name: resolvedName || null,
                  email: resolvedEmail,
                  source: "autofill_nav",
                }),
              }).catch(() => {});
            }

            return {
              ...prev,
              ...(nameChanged ? { name: nameFilled } : {}),
              ...(emailChanged ? { email: emailFilled } : {}),
            };
          });
        }

        // Blur after capture so it doesn't feel weird to the user
        nameEl.blur();
      };

      // Give browser time to inject autofill values
      setTimeout(poll, 150);
      setTimeout(poll, 400);
      setTimeout(poll, 800);
    };

    window.addEventListener("contact-autofill-trigger", onTrigger);
    return () =>
      window.removeEventListener("contact-autofill-trigger", onTrigger);
  }, [trackEvent]);

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

    // Get forensic data if available
    let forensicData = {};
    try {
      const { getForensicData, hashFingerprint } =
        await import("@/shared/analytics/forensics");
      forensicData = await getForensicData();
      forensicData.fingerprint = hashFingerprint(forensicData);
    } catch (e) {
      console.warn("Forensic data collection failed:", e);
    }

    // Submit the message
    submitMessage(
      {
        ...formData,
        submissionDurationMs,
        visitorId: localStorage.getItem("portfolio_visitor_id"),
        forensicData,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            trackEvent("contact", "submit_success");
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
    <section className="pb-8 lg:pb-12 border-b border-neutral-800 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
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
          className="mx-auto mb-8 max-w-full sm:max-w-xl md:max-w-2xl xl:max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-2xl group/card">
            {/* Liquid Glass Outline - Apple Style Refraction */}
            <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none z-30"></div>

            {/* Internal Glass Highlight (Specular) */}
            <div className="absolute inset-[1px] rounded-[calc(1rem-1.5px)] border border-white/5 pointer-events-none z-30"></div>

            {/* Pure Transparent Background - No Progressive Mask */}
            <div className="absolute inset-0 bg-white/[0.005] rounded-2xl pointer-events-none z-0" />

            {/* Premium Liquid Accents */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity z-40"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] pointer-events-none z-30"></div>

            <div className="p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8 relative z-10">
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

              <form
                onSubmit={handleSubmit}
                autoComplete="on"
                className="space-y-2.5 sm:space-y-3 md:space-y-3.5"
              >
                {/* Responsive Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-3.5">
                  {/* Name Field - Responsive Liquid Glass */}
                  <motion.div
                    whileInView={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <label
                      htmlFor="name"
                      className="block text-sm font-light text-neutral-400 mb-1"
                    >
                      Name
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      autoComplete="name"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-white transition-all duration-300 border rounded-lg bg-white/[0.02] border-white/10 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 focus:bg-white/[0.05] placeholder-neutral-600 text-sm sm:text-base"
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
                    <label
                      htmlFor="email"
                      className="block text-sm font-light text-neutral-400 mb-1"
                    >
                      Email
                    </label>
                    <input
                      ref={emailInputRef}
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      autoComplete="email"
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-white transition-all duration-300 border rounded-lg bg-white/[0.02] border-white/10 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 focus:bg-white/[0.05] placeholder-neutral-600 text-sm sm:text-base"
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
                  <label
                    htmlFor="subject"
                    className="block text-sm font-light text-neutral-400 mb-1"
                  >
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-white transition-all duration-300 border rounded-lg bg-white/[0.02] border-white/10 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 focus:bg-white/[0.05] placeholder-neutral-600 text-sm sm:text-base"
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
                  <label
                    htmlFor="message"
                    className="block text-sm font-light text-neutral-400 mb-1"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] px-3 sm:px-4 py-2.5 sm:py-3 pb-10 transition-all duration-300 border rounded-lg bg-white/[0.02] border-white/10 focus:outline-none focus:border-purple-400/50 focus:ring-1 focus:ring-purple-400/20 focus:bg-white/[0.05] text-white placeholder-neutral-600 resize-none text-sm sm:text-base"
                    placeholder={`Write your message here...
• Interested in working together on a project?
• Have questions about Robotics, AI/ML or Full Stack?
• Want to discuss a research idea or hire me for a role?
• Just want to have a technical discussion or say hi?

I will reply to you on your email as soon as possible!`}
                    disabled={isLoading}
                    required
                    aria-required="true"
                    maxLength={2000}
                    aria-describedby="message-counter"
                  />
                  <span
                    id="message-counter"
                    className="absolute bottom-2.5 sm:bottom-3 right-3 sm:right-4 text-xs text-neutral-500"
                  >
                    {formData.message.length}/2000
                  </span>
                </motion.div>
              </form>
            </div>
          </div>

          {/* Send Button - Outside Form Container */}
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col items-center pt-8 space-y-2 sm:space-y-3"
          >
            <motion.button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`inline-flex items-center justify-center px-6 py-2 text-sm font-light tracking-wide rounded-full transition-all duration-300 ${
                isLoading
                  ? "bg-neutral-800/50 text-neutral-500 cursor-not-allowed border border-neutral-700/50"
                  : showSuccess
                    ? "bg-white/[0.01] text-green-400 border border-green-500/30 shadow-none"
                    : "bg-purple-500/10 text-purple-100 border border-purple-400/50 ring-1 ring-white/10 hover:bg-purple-500/20 hover:border-purple-400/70 focus:outline-none shadow-none"
              }`}
            >
              <span className="flex items-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-transparent rounded-full border-t-neutral-400 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <span>Sent</span>
                    <BiCheck className="text-xl" />
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <BiSend className="text-lg" />
                  </>
                )}
              </span>
            </motion.button>

            {/* Error Messages - Responsive */}
            {errors.submit && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs sm:text-sm text-red-400 text-center max-w-sm px-4 mt-2"
                role="alert"
              >
                {errors.submit}
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Contact component doesn't currently accept props

export default Contact;
