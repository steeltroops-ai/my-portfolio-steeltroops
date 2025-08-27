import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const ReadingProgress = ({
  target = null, // Target element to track (defaults to document body)
  className = "",
  showPercentage = false,
  position = "top", // 'top' | 'bottom' | 'side'
  color = "cyan",
  height = 3,
  zIndex = 40,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const progressRef = useRef(null);

  // Use Framer Motion's useScroll for smooth progress tracking
  const { scrollYProgress } = useScroll({
    target: target || undefined,
    offset: target ? ["start end", "end start"] : ["start start", "end end"],
  });

  // Add spring animation for smoother progress
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Calculate estimated reading time
  useEffect(() => {
    const calculateReadingTime = () => {
      const content = target || document.body;
      const text = content.textContent || content.innerText || "";
      const wordsPerMinute = 200; // Average reading speed
      const words = text.trim().split(/\s+/).length;
      const time = Math.ceil(words / wordsPerMinute);
      setReadingTime(time);
    };

    calculateReadingTime();
  }, [target]);

  // Show/hide progress bar based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const threshold = 100; // Show after scrolling 100px
      setIsVisible(scrolled > threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Color variants
  const colorClasses = {
    cyan: "bg-cyan-400",
    blue: "bg-blue-400",
    green: "bg-green-400",
    purple: "bg-purple-400",
    pink: "bg-pink-400",
    orange: "bg-orange-400",
  };

  // Position variants
  const positionClasses = {
    top: "fixed top-0 left-0 right-0",
    bottom: "fixed bottom-0 left-0 right-0",
    side: "fixed top-1/2 left-4 -translate-y-1/2 w-1 h-32",
  };

  const progressBarClasses =
    position === "side" ? "w-full h-full rounded-full" : "h-full w-full";

  return (
    <>
      {/* Progress Bar */}
      <motion.div
        ref={progressRef}
        className={`${positionClasses[position]} ${className}`}
        style={{ zIndex }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isVisible ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`
          ${position === "side" ? "bg-neutral-800" : "bg-neutral-900/50"}
          ${position === "side" ? "rounded-full" : ""}
          w-full h-full backdrop-blur-sm
        `}
        >
          <motion.div
            className={`${colorClasses[color]} ${progressBarClasses} shadow-lg`}
            style={{
              scaleX: position === "side" ? 1 : scaleX,
              scaleY: position === "side" ? scaleX : 1,
              transformOrigin: position === "side" ? "bottom" : "left",
              height: position === "side" ? "100%" : `${height}px`,
            }}
          />
        </div>
      </motion.div>

      {/* Reading Time Indicator (optional) */}
      {showPercentage && isVisible && (
        <motion.div
          className="fixed top-4 right-4 bg-neutral-900/90 backdrop-blur-sm text-neutral-200 px-3 py-2 rounded-full text-sm font-medium shadow-lg border border-neutral-700"
          style={{ zIndex: zIndex + 1 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{readingTime} min read</span>
            </div>
            <div className="w-px h-4 bg-neutral-600" />
            <motion.span
              className="tabular-nums"
              animate={{
                scale: [1, 1.1, 1],
                color: ["#e5e7eb", "#22d3ee", "#e5e7eb"],
              }}
              transition={{ duration: 0.3 }}
            >
              {Math.round(scrollYProgress.get() * 100)}%
            </motion.span>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default ReadingProgress;

// Utility hook for reading progress
export const useReadingProgress = (target = null) => {
  const [progress, setProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = target || document.documentElement;
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      setProgress(Math.min(100, Math.max(0, progress)));
      setIsReading(progress > 5 && progress < 95); // Consider "reading" between 5% and 95%
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener("scroll", handleScroll);
  }, [target]);

  return { progress, isReading };
};

// Specialized component for blog posts
export const BlogReadingProgress = ({
  articleRef,
  showStats = true,
  position = "top",
  ...props
}) => {
  const [wordCount, setWordCount] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    if (articleRef?.current) {
      const text = articleRef.current.textContent || "";
      const words = text.trim().split(/\s+/).length;
      const time = Math.ceil(words / 200); // 200 WPM average

      setWordCount(words);
      setEstimatedTime(time);
    }
  }, [articleRef]);

  return (
    <ReadingProgress
      target={articleRef}
      showPercentage={showStats}
      position={position}
      readingTime={estimatedTime}
      {...props}
    />
  );
};
