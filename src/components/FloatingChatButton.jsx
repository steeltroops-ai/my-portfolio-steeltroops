import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FloatingChatButton = () => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-8 right-0 z-50"
    >
      <Link
        to={window.location.pathname === "/blog" ? "/" : "/blog"}
        className="flex items-center justify-center px-2 py-4 text-sm font-medium text-purple-700 rounded-l-lg bg-neutral-900/80 hover:bg-neutral-800 transition-all duration-300 shadow-lg border-l border-purple-700/20"
      >
        <span className="font-inter tracking-wider [writing-mode:vertical-lr] rotate-180">
          {window.location.pathname === "/blog" ? "Home" : "Blog"}
        </span>
      </Link>
    </motion.div>
  );
};

export default FloatingChatButton;