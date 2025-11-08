import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FloatingChatButton = () => {
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 0.3
      }}
      className="fixed right-0 bottom-6 sm:bottom-8 z-50"
    >
      <motion.div
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.97 }}
      >
        <Link
          to={window.location.pathname === "/blog" ? "/" : "/blog"}
          className="group relative flex justify-center items-center px-1.5 sm:px-2 py-4 sm:py-5 text-xs sm:text-sm font-semibold text-purple-100 rounded-l-xl border-l-2 border-t border-b shadow-xl shadow-purple-500/25 transition-all duration-300 bg-neutral-900/40 hover:bg-neutral-900/60 border-purple-400/60 hover:border-purple-300/80 backdrop-blur-xl hover:shadow-2xl hover:shadow-purple-400/35 focus:outline-none focus:ring-2 focus:ring-purple-300/60 focus:ring-offset-1 focus:ring-offset-black overflow-hidden"
          aria-label={window.location.pathname === "/blog" ? "Go to Home" : "Go to Blogs"}
        >
          {/* Enhanced glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-purple-600/10 opacity-100 group-hover:opacity-0 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-300/15 via-transparent to-purple-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Text with better contrast */}
          <span className="relative font-inter tracking-[0.15em] [writing-mode:vertical-lr] rotate-180 drop-shadow-lg">
            {window.location.pathname === "/blog" ? "Home" : "Blogs"}
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default FloatingChatButton;
