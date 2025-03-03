import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import Navbar from "./Navbar";
import FloatingChatButton from "./FloatingChatButton";

const BlogPost = () => {
  const { id } = useParams();

  // Mock blog post data - In a real app, this would come from an API or database
  const blogPost = {
    id: 1,
    title: "Welcome to My Blog",
    content: [
      { type: "text", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
      { type: "image", src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop", alt: "Featured Image" },
      { type: "text", content: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
      { type: "image", src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1000&auto=format&fit=crop", alt: "Technology Image" },
      { type: "text", content: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo." }
    ],
    date: "March 21, 2024",
    author: "Mayank",
    featuredImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000&auto=format&fit=crop"
  };

  return (
    <div className="overflow-x-hidden antialiased text-neutral-300 selection:bg-cyan-300 selection:text-cyan-900">
      <div className="fixed top-0 w-full h-full -z-10">
        <div className="relative w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
        </div>
      </div>
      <div className="container px-8 mx-auto">
        <Navbar />
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto my-16"
        >
          <h1 className="mb-6 text-4xl font-bold text-cyan-300">{blogPost.title}</h1>
          <div className="mb-8 text-sm text-neutral-500">
            <span>{blogPost.date}</span>
            <span className="mx-2">•</span>
            <span>{blogPost.author}</span>
          </div>
          {blogPost.featuredImage && (
            <div className="mb-8 overflow-hidden rounded-xl">
              <img
                src={blogPost.featuredImage}
                alt={blogPost.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          <div className="prose prose-invert prose-cyan max-w-none">
            {blogPost.content.map((block, index) => (
              block.type === "text" ? (
                <p key={index} className="mb-4 text-lg leading-relaxed text-neutral-300">
                  {block.content}
                </p>
              ) : (
                <div key={index} className="my-8 overflow-hidden rounded-xl">
                  <img
                    src={block.src}
                    alt={block.alt}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )
            ))}
          </div>
        </motion.article>
      </div>
      <FloatingChatButton />
    </div>
  );
};

export default BlogPost;