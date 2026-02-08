import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiCpu,
  FiFileText,
  FiCheck,
  FiLoader,
  FiAlertCircle,
  FiSettings,
  FiEdit3,
  FiBook,
  FiZap,
  FiUsers,
  FiHash,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
  FiExternalLink,
  FiX,
  FiSave,
  FiArrowLeft,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { useAIGenerator, GENERATION_STATUS } from "../hooks/useAIGenerator";
import { useCreatePost } from "@/features/blog/hooks/useBlogQueries";
import { generateSlug } from "@/lib/neon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// Constants
const STYLES = [
  {
    id: "technical",
    label: "Technical",
    icon: FiCpu,
    desc: "Precise, code examples, thorough explanations",
  },
  {
    id: "casual",
    label: "Casual",
    icon: FiEdit3,
    desc: "Friendly, conversational, relatable",
  },
  {
    id: "tutorial",
    label: "Tutorial",
    icon: FiBook,
    desc: "Step-by-step instructions, clear outcomes",
  },
  {
    id: "opinion",
    label: "Opinion",
    icon: FiZap,
    desc: "Persuasive, well-reasoned arguments",
  },
  {
    id: "storytelling",
    label: "Story",
    icon: FiFileText,
    desc: "Narrative, hooks, insights through story",
  },
];

const LENGTHS = [
  { id: "short", label: "Short", words: "600-900", time: "3-4 min" },
  { id: "medium", label: "Medium", words: "1200-1800", time: "6-8 min" },
  { id: "long", label: "Long", words: "2500-4000", time: "12-15 min" },
  {
    id: "comprehensive",
    label: "Comprehensive",
    words: "4000-6000",
    time: "20-25 min",
  },
];

const AUDIENCES = [
  { id: "beginners", label: "Beginners", desc: "New to the topic" },
  { id: "developers", label: "Developers", desc: "Technical professionals" },
  { id: "general", label: "General", desc: "Wide audience" },
  { id: "experts", label: "Experts", desc: "Deep technical knowledge" },
];

// Real-time progress indicator component with glassmorphism design
const ProgressIndicator = ({ status, progress, currentStep }) => {
  const statusConfig = {
    [GENERATION_STATUS.IDLE]: { label: "Ready", color: "neutral", glow: "" },
    [GENERATION_STATUS.PLANNING]: {
      label: "Planning",
      color: "cyan",
      glow: "shadow-cyan-500/20",
    },
    [GENERATION_STATUS.WRITING]: {
      label: "Writing",
      color: "purple",
      glow: "shadow-purple-500/20",
    },
    [GENERATION_STATUS.ENRICHING]: {
      label: "Enriching",
      color: "green",
      glow: "shadow-green-500/20",
    },
    [GENERATION_STATUS.COMPLETE]: {
      label: "Complete",
      color: "green",
      glow: "shadow-green-500/20",
    },
    [GENERATION_STATUS.ERROR]: {
      label: "Error",
      color: "red",
      glow: "shadow-red-500/20",
    },
  };

  const config = statusConfig[status] || statusConfig[GENERATION_STATUS.IDLE];

  return (
    <div className="space-y-4">
      {/* Progress Bar with glassmorphism */}
      <div className="relative h-3 bg-white/5 border border-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 background-animate"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* Status Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg bg-${config.color}-500/20 border border-${config.color}-400/30 ${config.glow} shadow-lg`}
          >
            {status !== GENERATION_STATUS.IDLE &&
              status !== GENERATION_STATUS.COMPLETE &&
              status !== GENERATION_STATUS.ERROR && (
                <FiLoader className="w-4 h-4 animate-spin text-cyan-400" />
              )}
            {status === GENERATION_STATUS.COMPLETE && (
              <FiCheck className="w-4 h-4 text-green-400" />
            )}
            {status === GENERATION_STATUS.ERROR && (
              <FiAlertCircle className="w-4 h-4 text-red-400" />
            )}
          </div>
          <div>
            <span className="text-white font-medium">{config.label}</span>
            {currentStep && (
              <p className="text-sm text-white/50">{currentStep}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
};

// Tag input component with glassmorphism
const TagInput = ({ tags, setTags }) => {
  const [input, setInput] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      if (!tags.includes(input.trim().toLowerCase())) {
        setTags([...tags, input.trim().toLowerCase()]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm focus-within:border-purple-400/50 focus-within:ring-2 focus-within:ring-purple-400/20 transition-all">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-400/30"
        >
          <FiHash className="w-3 h-3" />
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 hover:text-white transition-colors"
          >
            &times;
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-white placeholder:text-white/30"
      />
    </div>
  );
};

// Blog Preview Card Component - matches Blog.jsx design
const BlogPreviewCard = ({
  result,
  onEdit,
  onSave,
  onCopy,
  copied,
  isSaving,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl overflow-hidden"
    >
      {/* Preview Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-cyan-500/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3">
              {result.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <FiCalendar className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiClock className="w-4 h-4" />
                <span>{result.read_time || 5} min read</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FiFileText className="w-4 h-4" />
                <span>
                  {result.word_count ||
                    Math.round(result.content?.split(/\s+/).length)}{" "}
                  words
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {result.tags && result.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {result.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Excerpt */}
        {result.excerpt && (
          <p className="mt-4 text-white/60 leading-relaxed">{result.excerpt}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-b border-white/10 bg-white/5 flex flex-wrap items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving || result.saved}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            result.saved
              ? "bg-green-500/20 text-green-400 border border-green-400/30"
              : "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/30 hover:to-purple-500/30 border border-purple-400/30 text-white"
          }`}
        >
          {isSaving ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : result.saved ? (
            <FiCheck className="w-4 h-4" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {isSaving
            ? "Saving..."
            : result.saved
              ? "Saved as Draft"
              : "Save as Draft"}
        </button>

        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-400/30 bg-cyan-500/20 hover:bg-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 font-medium transition-all"
        >
          <FiEdit3 className="w-4 h-4" />
          Edit Post
        </button>

        <button
          onClick={onCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
        >
          {copied ? (
            <FiCheck className="w-4 h-4 text-green-400" />
          ) : (
            <FiCopy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy Markdown"}
        </button>

        {result.saved && result.slug && (
          <a
            href={`/blogs/${result.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            <FiExternalLink className="w-4 h-4" />
            Preview
          </a>
        )}
      </div>

      {/* Content Preview Toggle */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
        >
          {showFullContent ? <FiChevronUp /> : <FiChevronDown />}
          {showFullContent ? "Hide Content Preview" : "Show Content Preview"}
        </button>
      </div>

      {/* Content Preview - Rendered Markdown matching BlogPost style */}
      <AnimatePresence>
        {showFullContent && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 max-h-[600px] overflow-y-auto">
              <div className="prose prose-lg prose-invert prose-cyan max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:text-neutral-300 prose-p:leading-relaxed prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:text-cyan-300 prose-pre:bg-neutral-900 prose-pre:border prose-pre:border-neutral-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={{
                    h1: ({ children, ...props }) => (
                      <h1
                        className="text-3xl font-bold text-white mt-8 mb-4 first:mt-0"
                        {...props}
                      >
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2
                        className="text-2xl font-bold text-white mt-8 mb-4"
                        {...props}
                      >
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3
                        className="text-xl font-bold text-white mt-6 mb-3"
                        {...props}
                      >
                        {children}
                      </h3>
                    ),
                    p: ({ children, ...props }) => (
                      <p
                        className="text-lg leading-relaxed text-neutral-300 mb-6"
                        {...props}
                      >
                        {children}
                      </p>
                    ),
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <div className="my-6">
                          <div className="bg-neutral-900 rounded-t-lg px-4 py-2 text-sm text-neutral-400 border-b border-neutral-700">
                            {match[1]}
                          </div>
                          <pre className="bg-neutral-800 rounded-b-lg p-4 overflow-x-auto">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code
                          className="bg-neutral-800 px-2 py-1 rounded text-sm text-cyan-300"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children, ...props }) => (
                      <blockquote
                        className="border-l-4 border-cyan-500 pl-6 py-2 my-6 italic text-neutral-300 bg-neutral-900/30 rounded-r-lg"
                        {...props}
                      >
                        {children}
                      </blockquote>
                    ),
                    ul: ({ children, ...props }) => (
                      <ul
                        className="list-disc list-inside space-y-2 text-neutral-300 mb-6"
                        {...props}
                      >
                        {children}
                      </ul>
                    ),
                    ol: ({ children, ...props }) => (
                      <ol
                        className="list-decimal list-inside space-y-2 text-neutral-300 mb-6"
                        {...props}
                      >
                        {children}
                      </ol>
                    ),
                    li: ({ children, ...props }) => (
                      <li className="text-lg leading-relaxed" {...props}>
                        {children}
                      </li>
                    ),
                    a: ({ children, href, ...props }) => (
                      <a
                        href={href}
                        className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    img: ({ src, alt, ...props }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="rounded-lg my-6 w-full"
                        {...props}
                      />
                    ),
                  }}
                >
                  {result.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const AIBlogGenerator = () => {
  const navigate = useNavigate();

  // Form state
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("technical");
  const [length, setLength] = useState("medium");
  const [audience, setAudience] = useState("developers");
  const [tags, setTags] = useState([]);
  const [includeCodeExamples, setIncludeCodeExamples] = useState(true);
  const [saveAsDraft, setSaveAsDraft] = useState(true);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create post mutation
  const createPostMutation = useCreatePost();

  // AI Generator Hook
  const {
    status,
    progress,
    currentStep,
    error: generatorError,
    result,
    isGenerating,
    isComplete,
    generate,
    cancel,
    reset,
  } = useAIGenerator({
    onProgress: (info) => {
      console.log("[AI Progress]", info);
    },
    onSectionComplete: (section) => {
      console.log("[AI Section Complete]", section.heading);
    },
  });

  const error = localError || generatorError;

  // Save generated post to database
  const handleSavePost = async () => {
    if (!result) return;

    setIsSaving(true);
    try {
      const postData = {
        title: result.title,
        slug: generateSlug(result.title),
        content: result.content,
        excerpt: result.excerpt || result.content.slice(0, 200) + "...",
        tags: result.tags || tags,
        meta_description: result.meta_description || result.excerpt,
        published: false,
        author: "Admin",
        read_time:
          result.read_time ||
          Math.ceil(result.content.split(/\s+/).length / 200),
      };

      const savedPost = await createPostMutation.mutateAsync(postData);

      // Update result with saved data
      if (savedPost?.data) {
        result.saved = true;
        result.id = savedPost.data.id;
        result.slug = savedPost.data.slug;
      }
    } catch (err) {
      console.error("Error saving post:", err);
      setLocalError("Failed to save post: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate blog
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setLocalError("Please enter a topic");
      return;
    }

    setLocalError(null);

    try {
      const generatedResult = await generate({
        topic: topic.trim(),
        style,
        length,
        tags,
      });

      // Auto-save if option is enabled
      if (saveAsDraft && generatedResult) {
        setTimeout(() => handleSavePost(), 500);
      }
    } catch (err) {
      console.error("Generation error:", err);
    }
  }, [topic, style, length, tags, generate, saveAsDraft]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Edit in editor
  const handleEdit = () => {
    if (result?.id) {
      navigate(`/admin/post/edit/${result.id}`);
    } else if (result?.content) {
      // Store in sessionStorage and navigate to new post
      sessionStorage.setItem(
        "ai_generated_content",
        JSON.stringify({
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          tags: result.tags || tags,
          meta_description: result.meta_description,
          read_time: result.read_time,
        })
      );
      navigate("/admin/post/new");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed top-0 w-full h-full -z-10">
        <div className="relative w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)]"></div>
        </div>
      </div>

      <div className="relative container mx-auto max-w-4xl px-4 py-8">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl border border-purple-400/30 shadow-lg shadow-purple-500/10">
              <FiCpu className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                AI Blog Generator
              </h1>
              <p className="text-white/50">
                Powered by Llama 3.3 70B with Cerebras inference
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Form with glassmorphism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-6 shadow-xl"
        >
          {/* Topic Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Blog Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to build a REST API with Node.js and Express..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 transition-all resize-none backdrop-blur-sm"
              disabled={isGenerating}
            />
            <p className="mt-2 text-xs text-white/40">
              Be specific about what you want the article to cover. More detail
              = better results.
            </p>
          </div>

          {/* Style Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-3">
              Writing Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  disabled={isGenerating}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    style === s.id
                      ? "bg-purple-500/20 border-purple-400/50 text-purple-300 shadow-lg shadow-purple-500/10"
                      : "bg-white/5 border-white/10 text-white/60 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <s.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Length Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-3">
              Article Length
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LENGTHS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLength(l.id)}
                  disabled={isGenerating}
                  className={`flex flex-col items-start p-3 rounded-lg border transition-all ${
                    length === l.id
                      ? "bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10"
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${length === l.id ? "text-purple-300" : "text-white"}`}
                  >
                    {l.label}
                  </span>
                  <span className="text-xs text-white/50">{l.words} words</span>
                  <span className="text-xs text-white/30">{l.time} read</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-3">
              <FiUsers className="inline-block w-4 h-4 mr-1.5" /> Target
              Audience
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAudience(a.id)}
                  disabled={isGenerating}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    audience === a.id
                      ? "bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/10"
                      : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${audience === a.id ? "text-purple-300" : "text-white"}`}
                  >
                    {a.label}
                  </span>
                  <p className="text-xs text-white/40 mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Tags (optional)
            </label>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          {/* Advanced Options */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <FiSettings className="w-4 h-4" />
              Advanced Options
              {showAdvanced ? (
                <FiChevronUp className="w-4 h-4" />
              ) : (
                <FiChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/5">
                    <input
                      type="checkbox"
                      checked={includeCodeExamples}
                      onChange={(e) => setIncludeCodeExamples(e.target.checked)}
                      disabled={isGenerating}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm text-white">
                        Include Code Examples
                      </span>
                      <p className="text-xs text-white/40">
                        Add practical code snippets to your post
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-white/5">
                    <input
                      type="checkbox"
                      checked={saveAsDraft}
                      onChange={(e) => setSaveAsDraft(e.target.checked)}
                      disabled={isGenerating}
                      className="w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-sm text-white">
                        Auto-save as Draft
                      </span>
                      <p className="text-xs text-white/40">
                        Automatically save to database when generated
                      </p>
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-4 rounded-lg border border-red-500/30 bg-red-500/10 flex items-start gap-3"
              >
                <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">
                    Generation Failed
                  </p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all ${
                isGenerating
                  ? "bg-white/10 text-white/50 cursor-not-allowed"
                  : topic.trim()
                    ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90 shadow-lg shadow-purple-500/20"
                    : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiZap className="w-5 h-5" />
                  <span>Generate Blog Post</span>
                </>
              )}
            </button>
            {isGenerating && (
              <button
                type="button"
                onClick={cancel}
                className="px-6 py-4 rounded-lg border border-red-500/30 bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all"
                title="Cancel generation"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Generation Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 mb-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Generation Progress
              </h3>
              <ProgressIndicator
                status={status}
                progress={progress}
                currentStep={currentStep}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Display */}
        <AnimatePresence>
          {result && (
            <BlogPreviewCard
              result={result}
              onEdit={handleEdit}
              onSave={handleSavePost}
              onCopy={handleCopy}
              copied={copied}
              isSaving={isSaving}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIBlogGenerator;
