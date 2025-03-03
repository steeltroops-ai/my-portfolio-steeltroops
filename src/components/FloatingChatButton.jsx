import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const FloatingChatButton = () => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed right-0 bottom-8 z-50"
    >
      <Link
        to={window.location.pathname === "/blog" ? "/" : "/blog"}
        className="flex justify-center items-center px-1 py-4 text-sm font-medium text-purple-700 rounded-l-lg border-l shadow-lg transition-all duration-300 bg-neutral-900/80 hover:bg-neutral-800 border-purple-700/20"
      >
        <span className="font-inter tracking-wider [writing-mode:vertical-lr] rotate-180">
          {window.location.pathname === "/blog" ? "Home" : "Blogs"}
        </span>
      </Link>
    </motion.div>
  );
};

export default FloatingChatButton;
