import { useState, useEffect, useRef } from "react";
import { scrollToElement } from "@/shared/utils/scrollHelper";
import {
  FiMenu,
  FiX,
  FiCheck,
  FiCalendar,
  FiClock,
  FiUser,
  FiChevronRight,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { motion, useSpring, useScroll, AnimatePresence } from "framer-motion";
import TableOfContents from "@/features/blog/components/TableOfContents";

const ReadingProgress = ({
  target = null, // Target element to track (defaults to document body)
  className = "",
  showPercentage = false,
  position = "top", // 'top' | 'bottom' | 'side'
  color = "cyan",
  height = 3,
  zIndex = 40,
  headings = [],
  activeId = "",
  postTitle = "",
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [readingTime, setReadingTime] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const progressRef = useRef(null);

  // Use Framer Motion's built-in useScroll hook for optimized performance
  const { scrollYProgress, scrollY } = useScroll({
    target: target || undefined,
    offset: ["start start", "end end"],
  });

  // Add spring animation for smoother progress bar
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Sync percentage and visibility state
  useEffect(() => {
    const unsubscribeProgress = scrollYProgress.on("change", (latest) => {
      setPercentage(Math.round(latest * 100));
    });

    const unsubscribeScroll = scrollY.on("change", (latest) => {
      const visible = latest > 100;
      setIsVisible(visible);

      // Strictly close the menu when it's no longer visible at the top
      if (!visible) {
        setIsMenuOpen(false);
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeScroll();
    };
  }, [scrollYProgress, scrollY, isMenuOpen]);

  // Lock body scroll when TOC is open to ensure scroll priority
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  // Calculate estimated reading time
  useEffect(() => {
    const calculateReadingTime = () => {
      const content = target?.current || document.body;
      const text = content.textContent || "";
      const wordsPerMinute = 200; // Average reading speed
      const words = text.trim().split(/\s+/).length;
      const time = Math.ceil(words / wordsPerMinute);
      setReadingTime(time);
    };

    calculateReadingTime();
  }, [target]);

  // Color variants
  const colorClasses = {
    cyan: "bg-cyan-500/60 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.7)]",
    blue: "bg-blue-500/60 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.7)]",
    green:
      "bg-green-500/60 backdrop-blur-md shadow-[0_0_20px_rgba(34,197,94,0.7)]",
    purple:
      "bg-purple-700/80 backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.7)]",
    pink: "bg-pink-500/60 backdrop-blur-md shadow-[0_0_20px_rgba(236,72,153,0.7)]",
    orange:
      "bg-orange-500/60 backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.7)]",
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
          ${position === "side" ? "bg-white/[0.05] border border-white/10" : "bg-white/[0.02] border-b border-white/5"}
          ${position === "side" ? "rounded-full" : ""}
          w-full h-full backdrop-blur-md relative overflow-hidden
        `}
        >
          {/* Liquid Glass Highlight Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          <motion.div
            className={`${colorClasses[color]} ${progressBarClasses} border-r border-white/20 relative`}
            style={{
              scaleX: position === "side" ? 1 : scaleX,
              scaleY: position === "side" ? scaleX : 1,
              transformOrigin: position === "side" ? "bottom" : "left",
              height: position === "side" ? "100%" : `${height}px`,
            }}
          >
            {/* Hyper-Saturated Lead Edge (The 'Liquid' front) */}
            <div
              className={`absolute right-0 top-0 h-full w-3 ${color.includes("purple") ? "bg-purple-400" : "bg-cyan-400"} blur-[4px] opacity-100 shadow-[0_0_10px_currentColor]`}
            />

            {/* Reflection Shine for that high-end glass feel */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-white/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-30" />
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile Table of Content Menu Button (Left Side) */}
      {headings && headings.length > 0 && isVisible && (
        <motion.div
          className="lg:hidden fixed top-4 left-4 sm:left-6 z-[41]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative bg-white/[0.02] backdrop-blur-md rounded-full overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 px-3 py-2">
            {/* Liquid Highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="relative z-10 flex items-center gap-2 transition-colors group"
              aria-label="Toggle table of contents"
            >
              <FiMenu
                className={`text-purple-400 text-lg transition-transform duration-300 ${isMenuOpen ? "rotate-90" : ""}`}
              />
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 group-hover:text-white transition-colors">
                TOC
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Reading Time Indicator (Right Side) */}
      {showPercentage && isVisible && (
        <motion.div
          className="fixed top-4 right-4 sm:right-6 z-[41]"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative bg-white/[0.02] backdrop-blur-md rounded-full overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-white/20 px-3 py-2">
            {/* Liquid Highlight */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="relative z-10 flex items-center gap-3 text-neutral-200">
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-purple-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">{readingTime} min</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <span className="tabular-nums text-neutral-200 font-medium tracking-tight min-w-[3ch] text-right text-sm">
                {percentage}%
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Mobile Table of Contents Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 z-[45] bg-black/5"
            />

            <motion.div
              initial={{ opacity: 0, x: "-110%", backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, x: 0, backdropFilter: "blur(12px)" }}
              exit={{ opacity: 0, x: "-110%", backdropFilter: "blur(0px)" }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1,
                backdropFilter: { duration: 0.6, ease: "easeOut" },
                opacity: { duration: 0.4 },
              }}
              style={{ pointerEvents: "auto" }}
              className="lg:hidden fixed top-20 bottom-6 left-4 sm:left-6 w-72 z-[100] flex flex-col"
            >
              {/* Drawer Container - Synchronized Liquid Glass Style */}
              <div className="relative h-full min-h-0 flex flex-col p-6 rounded-2xl border border-white/20 bg-white/[0.02] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden">
                <div className="flex items-center justify-between mb-6 flex-shrink-0 relative z-10">
                  {/* Breadcrumb - Clean & Readable */}
                  <div className="flex items-center text-[10px] uppercase tracking-widest text-neutral-400 font-medium">
                    <Link
                      to="/"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Home
                    </Link>
                    <FiChevronRight className="mx-2 text-white/20" />
                    <Link
                      to="/blogs"
                      className="hover:text-purple-300 transition-colors"
                    >
                      Blog
                    </Link>
                  </div>

                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-all text-white/40 hover:text-white hover:scale-110 active:scale-90"
                    aria-label="Close menu"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>

                {/* Header */}
                <h3 className="relative z-10 text-sm font-bold text-white mb-5 tracking-tight flex items-center gap-2 flex-shrink-0">
                  <div className="w-1 h-4 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                  Table of Contents
                </h3>

                {/* Scrollable Area - Restored Scrollbar */}
                <div
                  className="relative z-[70] flex-1 overflow-y-auto pr-2 overscroll-contain pointer-events-auto custom-toc-scrollbar"
                  onWheel={(e) => e.stopPropagation()}
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <style>
                    {`
                      .custom-toc-scrollbar::-webkit-scrollbar {
                        width: 3px;
                      }
                      .custom-toc-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      .custom-toc-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                      }
                      .custom-toc-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.25);
                      }
                    `}
                  </style>
                  <TableOfContents
                    headings={headings}
                    activeId={activeId}
                    onHeadingClick={(id) => {
                      scrollToElement(id, { offset: 100 });
                      setIsMenuOpen(false);
                    }}
                    variant="mobile"
                  />
                </div>

                {/* Bottom Specular Highlight */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent pointer-events-none z-20" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

ReadingProgress.propTypes = {
  target: PropTypes.object,
  className: PropTypes.string,
  showPercentage: PropTypes.bool,
  position: PropTypes.oneOf(["top", "bottom", "side"]),
  color: PropTypes.string,
  height: PropTypes.number,
  zIndex: PropTypes.number,
  headings: PropTypes.array,
  activeId: PropTypes.string,
  postTitle: PropTypes.string,
};

export default ReadingProgress;

// Utility hook for reading progress
export const useReadingProgress = (target = null) => {
  const [progress, setProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const { scrollYProgress } = useScroll({
    target: target || undefined,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setProgress(latest * 100);
      setIsReading(latest > 0.05 && latest < 0.95);
    });
  }, [scrollYProgress]);

  return { progress, isReading };
};

// Specialized component for blog posts
export const BlogReadingProgress = ({
  articleRef,
  showStats = true,
  position = "top",
  ...props
}) => {
  const [_wordCount, setWordCount] = useState(0);
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
      headings={props.headings}
      activeId={props.activeId}
      postTitle={props.postTitle}
      {...props}
    />
  );
};

BlogReadingProgress.propTypes = {
  articleRef: PropTypes.shape({
    current: PropTypes.object,
  }).isRequired,
  showStats: PropTypes.bool,
  position: PropTypes.oneOf(["top", "bottom", "side"]),
};
