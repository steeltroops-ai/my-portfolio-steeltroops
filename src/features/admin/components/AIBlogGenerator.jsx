import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiCpu,
  FiCheck,
  FiLoader,
  FiEdit3,
  FiCopy,
  FiSave,
  FiCalendar,
  FiClock,
  FiChevronUp,
  FiChevronDown,
  FiZap, // Added FiZap
} from "react-icons/fi";
import { useAIGenerator, GENERATION_STATUS } from "../hooks/useAIGenerator";
import { useCreatePost } from "@/features/blog/hooks/useBlogQueries";
import { generateSlug } from "@/lib/neon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import AICreatorInput from "./Creation/AICreatorInput";

// Real-time progress indicator
const AIBlogGenerator = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const bottomRef = useRef(null);

  const createPostMutation = useCreatePost();

  const { status, progress, currentStep, result, isGenerating, generate } =
    useAIGenerator();

  const handleAIInputSubmit = async (inputData) => {
    if (!inputData.prompt.trim()) return;

    const params = {
      topic: inputData.prompt,
      style: inputData.style.toLowerCase(),
      length: inputData.length.toLowerCase(),
      tags: inputData.includeCode ? ["technical", "code"] : [],
    };

    await generate(params);
  };

  const handleSavePost = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const postData = {
        title: result.title,
        slug: generateSlug(result.title),
        content: result.content,
        excerpt: result.excerpt,
        tags: result.tags || [],
        published: false,
        author: "Admin",
      };

      if (createPostMutation && createPostMutation.mutateAsync) {
        await createPostMutation.mutateAsync(postData);
        result.saved = true;
      } else {
        console.warn("Create post mutation not available");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    if (result) {
      sessionStorage.setItem("ai_generated_content", JSON.stringify(result));
      navigate("/admin/post/new");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-0 gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white tracking-tight">
            <FiZap size={24} className="text-white" />{" "}
            {/* Updated icon and size */}
            AI Generator
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Create high-quality technical content powered by Llama 3.3.
          </p>
        </div>
      </div>

      {/* Main Scrollable Content Area */}
      <div className="flex-1 w-full pb-8 flex flex-col items-center justify-start">
        {/* Empty State / Welcome Screen */}
        {!isGenerating && !result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-20 mb-12 max-w-2xl px-4"
          >
            <div className="inline-flex items-center justify-center p-4 mb-6 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-[2px]">
              {" "}
              {/* Updated backdrop-blur */}
              <FiZap size={32} className="text-white" /> {/* Updated icon */}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              What shall we create today?
            </h2>
            <p className="text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
              Describe your topic, choose a style, and let the AI draft a
              masterpiece for you.
            </p>
          </motion.div>
        )}

        {/* Progress View */}
        {(isGenerating || status !== GENERATION_STATUS.IDLE) && !result && (
          <ProgressIndicator
            status={status}
            progress={progress}
            currentStep={currentStep}
          />
        )}

        {/* Result View */}
        {result && (
          <BlogPreviewCard
            result={result}
            onSave={handleSavePost}
            onEdit={handleEdit}
            onCopy={() => {
              navigator.clipboard.writeText(result.content);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            copied={copied}
            isSaving={isSaving}
          />
        )}
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="sticky bottom-0 z-40 px-6 pb-6 pt-12 -mx-8 -mb-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
        <div className="max-w-4xl mx-auto w-full pointer-events-auto">
          <AICreatorInput
            onGenerate={handleAIInputSubmit}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

// Real-time progress indicator
const ProgressIndicator = ({ status, progress, currentStep }) => {
  const statusConfig = {
    [GENERATION_STATUS.IDLE]: { label: "Ready", color: "neutral" },
    [GENERATION_STATUS.PLANNING]: { label: "Planning", color: "white" },
    [GENERATION_STATUS.WRITING]: { label: "Writing", color: "white" },
    [GENERATION_STATUS.ENRICHING]: { label: "Enriching", color: "white" },
    [GENERATION_STATUS.COMPLETE]: { label: "Complete", color: "white" },
    [GENERATION_STATUS.ERROR]: { label: "Error", color: "red" },
  };

  const config = statusConfig[status] || statusConfig[GENERATION_STATUS.IDLE];

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 animate-fadeIn mt-8">
      <div className="relative h-2 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`absolute inset-y-0 left-0 bg-white`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="flex justify-between items-center text-sm">
        <span
          className={`text-${config.color === "red" ? "red-400" : "white"} font-medium flex items-center gap-2`}
        >
          {status === GENERATION_STATUS.PLANNING && (
            <FiLoader className="animate-spin" />
          )}
          {config.label}: {currentStep}
        </span>
        <span className="text-white/50">{progress}%</span>
      </div>
    </div>
  );
};

// Blog Preview Card
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
      className="w-full max-w-4xl mx-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden mb-12"
    >
      <div className="p-8 border-b border-white/10 bg-white/5">
        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
          {result.title}
        </h2>

        <div className="flex flex-wrap gap-4 text-sm text-neutral-400 mb-6">
          <span className="flex items-center gap-1">
            <FiCalendar /> {new Date().toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <FiClock /> {result.read_time || "5"} min read
          </span>
          <span className="bg-white/10 text-neutral-300 px-2 py-0.5 rounded text-xs border border-white/5">
            {result.total_words || "1200"} words
          </span>
        </div>

        {result.excerpt && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/5 italic text-neutral-300 mb-6">
            {result.excerpt}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            disabled={isSaving || result.saved}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${result.saved ? "bg-white/10 text-neutral-300 border border-white/10" : "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5"}`}
          >
            {isSaving ? (
              <FiLoader className="animate-spin" />
            ) : result.saved ? (
              <FiCheck />
            ) : (
              <FiSave />
            )}
            {result.saved ? "Saved" : "Save Draft"}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
          >
            <FiEdit3 /> Edit
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all"
          >
            {copied ? <FiCheck /> : <FiCopy />} {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Content Preview Toggle */}
      <div className="px-8 py-4 border-b border-white/10 flex justify-center">
        <button
          onClick={() => setShowFullContent(!showFullContent)}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          {showFullContent ? <FiChevronUp /> : <FiChevronDown />}
          {showFullContent ? "Hide Content" : "Show Full Content"}
        </button>
      </div>

      <AnimatePresence>
        {showFullContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/20"
          >
            <div className="p-8 prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {result.content}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AIBlogGenerator;
