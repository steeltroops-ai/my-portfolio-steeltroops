import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AiOutlineLink } from "react-icons/ai";
import { FaXTwitter, FaLinkedinIn } from "react-icons/fa6";
import { FiGithub, FiInstagram } from "react-icons/fi";
import { getAllPosts } from "../services/BlogService";
import FloatingChatButton from "./FloatingChatButton";

const Blog = () => {
  return (
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      <div className="fixed top-0 w-full h-full -z-10">
        <div className="relative w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
        </div>
      </div>
      <div className="container px-8 mx-auto">
        <nav className="flex justify-between items-center py-6 mb-16">
          <div className="flex flex-shrink-0 items-center">
            <h2 className="text-2xl font-bold text-white">Blogs</h2>
          </div>
          <div className="flex gap-4 justify-center -mr-4 text-2xl ems-center">
            <a
              href="https://x.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FaXTwitter />
            </a>
            <a
              href="https://github.com/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FiGithub />
            </a>
            <a
              href="https://instagram.com/steeltroops_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FiInstagram />
            </a>
            <a
              href="https://linkedin.com/in/steeltroops-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <FaLinkedinIn />
            </a>
            <a
              href="https://bento.me/steeltroops"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-cyan-300"
            >
              <AiOutlineLink />
            </a>
          </div>
        </nav>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container px-8 mx-auto mt-0"
      >
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {getAllPosts().map((post) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 * post.id }}
              className="relative p-8 rounded-xl border backdrop-blur-sm transition-all duration-300 border-neutral-800 bg-neutral-900/30 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1 group"
            >
              <Link to={`/blog/${post.id}`} className="block space-y-4">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent rounded-xl transition-colors to-cyan-950/10 group-hover:to-cyan-950/20"></div>
                <div className="overflow-hidden relative mb-4 w-full rounded-lg aspect-video">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h2 className="relative text-2xl font-semibold text-white transition-colors group-hover:text-cyan-300">
                  {post.title}
                </h2>
                <p className="relative transition-colors text-neutral-400 group-hover:text-neutral-300 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex relative items-center text-sm transition-colors text-neutral-500 group-hover:text-neutral-400">
                  <span className="inline-block mr-2 w-2 h-2 bg-cyan-500 rounded-full"></span>
                  Posted on {post.date}
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </motion.div>
      <FloatingChatButton />
    </div>
  );
};

export default Blog;
