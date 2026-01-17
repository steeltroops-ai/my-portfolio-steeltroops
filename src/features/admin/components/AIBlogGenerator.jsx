import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FiCpu,
  FiFileText,
  FiSend,
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
} from "react-icons/fi";

// Constants
const STYLES = [
  { id: "technical", label: "Technical", icon: FiCpu, desc: "Precise, code examples, thorough explanations" },
  { id: "casual", label: "Casual", icon: FiEdit3, desc: "Friendly, conversational, relatable" },
  { id: "tutorial", label: "Tutorial", icon: FiBook, desc: "Step-by-step instructions, clear outcomes" },
  { id: "opinion", label: "Opinion", icon: FiZap, desc: "Persuasive, well-reasoned arguments" },
  { id: "storytelling", label: "Story", icon: FiFileText, desc: "Narrative, hooks, insights through story" },
];

const LENGTHS = [
  { id: "short", label: "Short", words: "600-900", time: "3-4 min" },
  { id: "medium", label: "Medium", words: "1200-1800", time: "6-8 min" },
  { id: "long", label: "Long", words: "2500-4000", time: "12-15 min" },
  { id: "comprehensive", label: "Comprehensive", words: "4000-6000", time: "20-25 min" },
];

const AUDIENCES = [
  { id: "beginners", label: "Beginners", desc: "New to the topic" },
  { id: "developers", label: "Developers", desc: "Technical professionals" },
  { id: "general", label: "General", desc: "Wide audience" },
  { id: "experts", label: "Experts", desc: "Deep technical knowledge" },
];

// Phase indicator component
const PhaseIndicator = ({ phases, currentPhase }) => {
  const allPhases = ["research", "writing", "enhancement"];
  
  return (
    <div className="flex items-center gap-2 mb-6">
      {allPhases.map((phase, idx) => {
        const phaseData = phases.find(p => p.phase === phase);
        const isActive = currentPhase === phase;
        const isComplete = phaseData?.status === "complete";
        const isPending = !phaseData;
        
        return (
          <div key={phase} className="flex items-center">
            <motion.div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isComplete
                  ? "bg-green-500/20 text-green-400"
                  : isActive
                  ? "bg-cyan-500/20 text-cyan-400"
                  : isPending
                  ? "bg-neutral-800 text-neutral-500"
                  : "bg-neutral-800 text-neutral-400"
              }`}
              animate={isActive ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: isActive ? Infinity : 0, duration: 1.5 }}
            >
              {isComplete ? (
                <FiCheck className="w-3 h-3" />
              ) : isActive ? (
                <FiLoader className="w-3 h-3 animate-spin" />
              ) : (
                <span className="w-3 h-3 rounded-full bg-current opacity-30" />
              )}
              <span className="capitalize">{phase}</span>
            </motion.div>
            {idx < allPhases.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isComplete ? "bg-green-500/50" : "bg-neutral-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Tag input component
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
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-900/50 border border-neutral-700 rounded-lg focus-within:border-cyan-500/50 transition-colors">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs"
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
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-neutral-300 placeholder:text-neutral-500"
      />
    </div>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phases, setPhases] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generate blog
  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setPhases([]);

    // Simulate phase progression - simple two-phase now
    const phaseOrder = ["research", "writing"];

    try {
      // Start phase simulation
      for (const phase of phaseOrder) {
        setCurrentPhase(phase);
        setPhases(prev => [...prev, { phase, status: "in_progress" }]);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const response = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          style,
          length,
          audience,
          tags,
          includeCodeExamples,
          saveAsDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setPhases(phaseOrder.map(p => ({ phase: p, status: "complete" })));
      setCurrentPhase(null);
      setResult(data.data);

    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message);
      setCurrentPhase(null);
    } finally {
      setIsGenerating(false);
    }
  }, [topic, style, length, audience, tags, includeCodeExamples, saveAsDraft]);

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
      sessionStorage.setItem("ai_generated_content", JSON.stringify(result));
      navigate("/admin/post/new");
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
              <FiCpu className="w-6 h-6 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">AI Blog Generator</h1>
          </div>
          <p className="text-neutral-400">
            Generate high-quality blog posts using Llama 3.3 70B with ultra-fast Cerebras inference.
          </p>
        </motion.div>

        {/* Main Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6"
        >
          {/* Topic Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Blog Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to build a REST API with Node.js and Express..."
              rows={3}
              className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
              disabled={isGenerating}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Be specific about what you want the article to cover. More detail = better results.
            </p>
          </div>

          {/* Style Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              Writing Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  disabled={isGenerating}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                    style === s.id
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400"
                      : "bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600"
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
            <label className="block text-sm font-medium text-neutral-300 mb-3">
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
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  <span className={`text-sm font-medium ${length === l.id ? "text-cyan-400" : "text-white"}`}>
                    {l.label}
                  </span>
                  <span className="text-xs text-neutral-500">{l.words} words</span>
                  <span className="text-xs text-neutral-600">{l.time} read</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-3">
              <FiUsers className="inline-block w-4 h-4 mr-1" /> Target Audience
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
                      ? "bg-cyan-500/10 border-cyan-500/50"
                      : "bg-neutral-800/50 border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  <span className={`text-sm font-medium ${audience === a.id ? "text-cyan-400" : "text-white"}`}>
                    {a.label}
                  </span>
                  <p className="text-xs text-neutral-500 mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Tags (optional)
            </label>
            <TagInput tags={tags} setTags={setTags} />
          </div>

          {/* Advanced Options */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <FiSettings className="w-4 h-4" />
              Advanced Options
              {showAdvanced ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4 overflow-hidden"
                >
                  {/* Code Examples Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCodeExamples}
                      onChange={(e) => setIncludeCodeExamples(e.target.checked)}
                      disabled={isGenerating}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-sm text-neutral-300">Include Code Examples</span>
                      <p className="text-xs text-neutral-500">Add practical code snippets</p>
                    </div>
                  </label>

                  {/* Save as Draft Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAsDraft}
                      onChange={(e) => setSaveAsDraft(e.target.checked)}
                      disabled={isGenerating}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-800 text-cyan-500 focus:ring-cyan-500"
                    />
                    <div>
                      <span className="text-sm text-neutral-300">Save as Draft</span>
                      <p className="text-xs text-neutral-500">Save to database when generated</p>
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
                className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
              >
                <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-medium">Generation Failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-medium transition-all ${
              isGenerating
                ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                : topic.trim()
                ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:opacity-90"
                : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
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
        </motion.div>

        {/* Generation Progress */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 mb-6"
            >
              <h3 className="text-sm font-medium text-white mb-4">Generation Progress</h3>
              <PhaseIndicator phases={phases} currentPhase={currentPhase} />
              <div className="text-xs text-neutral-500">
                {currentPhase === "research" && "Researching topic, analyzing key points, and creating outline..."}
                {currentPhase === "writing" && "Writing the full article with proper formatting..."}
                {currentPhase === "enhancement" && "Enhancing content, improving transitions, and polishing..."}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Display */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-hidden"
            >
              {/* Result Header */}
              <div className="p-6 border-b border-neutral-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">{result.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                      <span>{result.word_count} words</span>
                      <span className="w-1 h-1 bg-neutral-600 rounded-full" />
                      <span>{result.read_time} min read</span>
                      {result.saved && (
                        <>
                          <span className="w-1 h-1 bg-neutral-600 rounded-full" />
                          <span className="text-green-400">Saved as {result.published ? "published" : "draft"}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                    >
                      {copied ? <FiCheck className="w-3.5 h-3.5 text-green-400" /> : <FiCopy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg text-xs transition-colors"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {result.saved && result.slug && (
                      <a
                        href={`/blogs/${result.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs text-neutral-300 transition-colors"
                      >
                        <FiExternalLink className="w-3.5 h-3.5" />
                        View
                      </a>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {result.tags && result.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {result.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-neutral-800 text-neutral-400 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Preview */}
              <div className="p-6 max-h-[600px] overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-neutral-300 font-mono bg-neutral-950 p-4 rounded-lg overflow-x-auto">
                    {result.content}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="text-sm text-neutral-400 hover:text-white transition-colors"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIBlogGenerator;
