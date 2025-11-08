import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FloatingChatButton = () => {
  return (
    <motion.div
      initial={{ x: 60, opacity: 0, rotateY: 90 }}
      animate={{ x: 0, opacity: 1, rotateY: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.5
      }}
      className="fixed right-0 bottom-6 sm:bottom-8 z-50"
    >
      <motion.div
        whileHover={{ x: -4, rotateY: -5 }}
        whileTap={{ scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Link
          to={window.location.pathname === "/blog" ? "/" : "/blog"}
          className="group relative flex justify-center items-center px-2.5 py-5 text-sm font-semibold text-purple-300 rounded-l-xl border border-r-0 border-purple-400/50 transition-all duration-300 bg-purple-500/20 hover:bg-purple-500/30 hover:border-purple-400/70 backdrop-blur-[2px] shadow-lg focus:outline-none focus:ring-1 focus:ring-purple-400/50 overflow-hidden"
          aria-label={window.location.pathname === "/blog" ? "Go to Home" : "Go to Blogs"}
        >
          {/* Subtle glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/8 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-300/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Text */}
          <span className="relative tracking-[0.18em] [writing-mode:vertical-lr] rotate-180">
            {window.location.pathname === "/blog" ? "Home" : "Blogs"}
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default FloatingChatButton;
