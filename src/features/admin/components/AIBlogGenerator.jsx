import { useState, useCallback, useRef, useEffect } from "react";
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
  FiFileText,
  FiX,
  FiHash,
  FiMenu,
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { useAIGenerator, GENERATION_STATUS } from "../hooks/useAIGenerator";
import { useMarkdownComponents } from "@/shared/components/markdown/MarkdownComponents";
import { useCreatePost } from "@/features/blog/hooks/useBlogQueries";
import { generateSlug } from "@/lib/neon";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import AICreatorInput from "./Creation/AICreatorInput";

const AIBlogGenerator = () => {
  const { setIsSidebarCollapsed } = useAdmin();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const contentRef = useRef(null);

  const createPostMutation = useCreatePost();

  const {
    status,
    progress,
    currentStep,
    result,
    error,
    isGenerating,
    outline,
    sections,
    streamedContent,
    currentSectionIndex,
    metadata,
    generate,
    cancel,
    reset,
  } = useAIGenerator();

  // Reset saved indicator when generation resets
  useEffect(() => {
    if (!result) setIsSaved(false);
  }, [result]);

  // Auto-scroll to bottom as content streams in
  useEffect(() => {
    if (streamedContent && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [streamedContent]);

  const handleAIInputSubmit = async (inputData) => {
    if (!inputData.prompt.trim()) return;

    const params = {
      topic: inputData.prompt,
      globalTone: inputData.style?.toLowerCase() || "professional",
      toneModifier: inputData.toneModifier,
      audience: inputData.audience?.toLowerCase() || "general",
      length: inputData.length?.toLowerCase() || "medium",
      tags: inputData.includeCode ? ["technical", "code"] : [],
      codeLanguage: inputData.codeLanguage || "python",
      // Blueprint can be passed from a future BlueprintBuilder component
      blueprint: inputData.blueprint || undefined,
    };

    try {
      await generate(params);
    } catch (err) {
      // Error is already captured in the hook state
      console.error("[AIBlogGenerator] Generation failed:", err.message);
    }
  };

  const handleSavePost = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const postData = {
        title: result.title,
        slug: generateSlug(result.title),
        content: result.content,
        excerpt: result.excerpt || outline?.description || "",
        tags: metadata?.tags || result.tags || [],
        published: false,
        author: "Admin",
      };

      if (createPostMutation && createPostMutation.mutateAsync) {
        await createPostMutation.mutateAsync(postData);
        setIsSaved(true);
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

  const handleNewGeneration = () => {
    reset();
  };

  // Check if we're in a "streaming" state (content arriving)
  const isStreaming =
    status === GENERATION_STATUS.WRITING ||
    status === GENERATION_STATUS.ENRICHING;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-4 sm:p-6 lg:p-8 pb-0">
        <div className="flex justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="xl:hidden p-1 -ml-1 text-neutral-400 hover:text-white transition-colors"
              >
                <FiMenu size={20} />
              </button>
              AI Generator
            </h1>
            <p className="hidden xs:block text-neutral-400 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
              Create high-quality technical content.
            </p>
          </div>

          {/* Cancel / New buttons */}
          <div className="flex gap-2 sm:gap-3">
            {isGenerating && (
              <button
                onClick={cancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-sm font-medium"
              >
                <FiX size={14} />
                Cancel
              </button>
            )}
            {(result || status === GENERATION_STATUS.ERROR) && (
              <button
                onClick={handleNewGeneration}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all text-sm font-medium"
              >
                <FiFileText size={14} />
                New Generation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto scrollbar-none"
        data-lenis-prevent
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Empty State / Welcome Screen */}
          {!isGenerating && !result && status === GENERATION_STATUS.IDLE && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mt-10 sm:mt-20 mb-8 sm:mb-12 max-w-2xl mx-auto px-4"
            >
              <div className="inline-flex items-center justify-center p-3 sm:p-4 mb-4 sm:mb-6 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-[2px]">
                <FiFileText size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                What shall we create today?
              </h2>
              <p className="text-sm sm:text-lg text-neutral-400 max-w-lg mx-auto leading-relaxed">
                Describe your topic, choose a style, and let the AI draft a
                masterpiece for you.
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {status === GENERATION_STATUS.ERROR && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto mb-8 mt-8"
            >
              <div className="p-6 rounded-xl border border-red-500/20 bg-red-500/5">
                <p className="text-red-400 font-medium mb-2">
                  Generation Failed
                </p>
                <p className="text-red-300/70 text-sm">{error}</p>
                {streamedContent && (
                  <p className="text-neutral-400 text-sm mt-3">
                    Partial content was captured. Click "New Generation" to try
                    again, or check admin dashboard for saved partial drafts.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Progress + Live Streaming View */}
          {isGenerating && (
            <div className="w-full max-w-4xl mx-auto mt-4">
              {/* Progress Bar */}
              <ProgressIndicator
                status={status}
                progress={progress}
                currentStep={currentStep}
                outline={outline}
                sections={sections}
                currentSectionIndex={currentSectionIndex}
              />

              {/* Live Streaming Content Preview */}
              {streamedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
                >
                  <div className="px-5 py-3 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm text-neutral-300 font-medium">
                        Live Preview
                      </span>
                    </div>
                    <span className="text-xs text-neutral-500">
                      {streamedContent.split(/\s+/).length} words
                    </span>
                  </div>
                  <div className="p-6 prose prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-code:text-purple-300 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {streamedContent}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Result View */}
          {result && (
            <BlogPreviewCard
              result={result}
              outline={outline}
              metadata={metadata}
              sections={sections}
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
      </div>

      {/* Floating Input Area */}
      <div className="flex-none p-4 sm:p-6 lg:p-8 pt-2 sm:pt-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <AICreatorInput
            onGenerate={handleAIInputSubmit}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// PROGRESS INDICATOR (Real progress, not fake)
// =========================================================================

const ProgressIndicator = ({
  status,
  progress,
  currentStep,
  outline,
  sections,
  currentSectionIndex,
}) => {
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
    <div className="w-full max-w-4xl mx-auto mb-4">
      {/* Main progress bar */}
      <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          className="absolute inset-y-0 left-0 bg-white rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="flex justify-between items-center text-sm mb-4">
        <span
          className={`${config.color === "red" ? "text-red-400" : "text-white"} font-medium flex items-center gap-2`}
        >
          {(status === GENERATION_STATUS.PLANNING ||
            status === GENERATION_STATUS.WRITING ||
            status === GENERATION_STATUS.ENRICHING) && (
            <FiLoader className="animate-spin" size={14} />
          )}
          {config.label}: {currentStep}
        </span>
        <span className="text-white/50 tabular-nums">{progress}%</span>
      </div>

      {/* Section Progress Map */}
      {outline && outline.sections && (
        <div className="space-y-1.5">
          {outline.sections.map((section, idx) => {
            const completed = sections.some((s) => s.index === idx);
            const isCurrent = idx === currentSectionIndex;
            const completedSection = sections.find((s) => s.index === idx);

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isCurrent
                    ? "bg-white/10 border border-white/10"
                    : completed
                      ? "bg-white/[0.03]"
                      : "opacity-40"
                }`}
              >
                {/* Status icon */}
                <div className="flex-none">
                  {completed ? (
                    <FiCheck className="text-green-400" size={14} />
                  ) : isCurrent ? (
                    <FiLoader className="text-white animate-spin" size={14} />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
                  )}
                </div>

                {/* Section info */}
                <div className="flex-1 min-w-0">
                  <span
                    className={`${completed ? "text-neutral-300" : isCurrent ? "text-white" : "text-neutral-500"} truncate block`}
                  >
                    {section.heading}
                  </span>
                </div>

                {/* Type badge */}
                <span className="flex-none text-xs px-1.5 py-0.5 rounded bg-white/5 text-neutral-500">
                  {section.type || "prose"}
                </span>

                {/* Word count */}
                {completedSection && (
                  <span className="flex-none text-xs text-neutral-500 tabular-nums">
                    {completedSection.wordCount}w
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// BLOG PREVIEW CARD (Result view)
// =========================================================================

const BlogPreviewCard = ({
  result,
  outline,
  metadata,
  sections,
  onEdit,
  onSave,
  onCopy,
  copied,
  isSaving,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const tags = metadata?.tags || result.tags || [];
  const totalWords =
    result.totalWords ||
    result.total_words ||
    result.content?.split(/\s+/).length ||
    0;
  const readTime =
    result.readTime || result.read_time || Math.ceil(totalWords / 200) || 5;

  const markdownComponents = useMarkdownComponents({ title: result.title });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden mb-12"
    >
      <div className="p-4 sm:p-8 border-b border-white/10 bg-white/5">
        <h2 className="text-xl sm:text-3xl font-bold text-white mb-3 sm:mb-4 leading-tight">
          {result.title}
        </h2>

        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-400 mb-4">
          <span className="flex items-center gap-1">
            <FiCalendar size={12} className="sm:w-3.5 sm:h-3.5" />{" "}
            {new Date().toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={12} className="sm:w-3.5 sm:h-3.5" /> {readTime} min
            read
          </span>
          <span className="flex items-center gap-1 bg-white/10 text-neutral-300 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs border border-white/5">
            {totalWords} words
          </span>
          {result.generation_time_ms && (
            <span className="flex items-center gap-1 bg-white/10 text-neutral-300 px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs border border-white/5">
              <FiCpu size={10} className="sm:w-3 sm:h-3" />{" "}
              {Math.round(result.generation_time_ms / 1000)}s
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.slice(0, 5).map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Excerpt */}
        {(result.excerpt || outline?.description) && (
          <div className="p-4 bg-white/5 rounded-lg border border-white/5 italic text-neutral-300 mb-6 text-sm leading-relaxed">
            {result.excerpt || outline?.description}
          </div>
        )}

        {/* Section summary */}
        {sections && sections.length > 0 && (
          <div className="mb-6">
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
              Structure ({sections.length} sections)
            </p>
            <div className="flex flex-wrap gap-2">
              {sections.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-neutral-400"
                >
                  {s.heading} ({s.wordCount}w)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isSaved
                ? "bg-white/10 text-neutral-300 border border-white/10"
                : "bg-white text-black hover:bg-neutral-200 shadow-lg shadow-white/5"
            }`}
          >
            {isSaving ? (
              <FiLoader className="animate-spin" size={12} />
            ) : isSaved ? (
              <FiCheck size={12} />
            ) : (
              <FiSave size={12} />
            )}
            {isSaved ? "Saved" : "Save Draft"}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm transition-all"
          >
            <FiEdit3 size={12} /> Edit
          </button>
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm transition-all"
          >
            {copied ? <FiCheck size={12} /> : <FiCopy size={12} />}{" "}
            {copied ? "Copied" : "Copy"}
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
            <div className="p-4 sm:p-8 prose prose-invert max-w-none prose-headings:text-white prose-p:text-neutral-300 prose-strong:text-white prose-code:text-purple-300">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={markdownComponents}
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
