import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiCode,
  FiUser,
  FiAlignLeft,
  FiFeather,
  FiCpu,
  FiLayers,
  FiSettings,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import ToneSelector from "./ToneSelector";
import BlueprintBuilder from "./BlueprintBuilder";

const OptionPill = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-neutral-300 hover:text-white"
        title={label}
      >
        {Icon && <Icon size={14} />}
        <span className="font-medium">{value}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 min-w-[160px] bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                  value === opt
                    ? "text-white bg-white/10"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AICreatorInput = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("General");
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Quick Mode State
  const [quickStyle, setQuickStyle] = useState("Professional");
  const [quickLength, setQuickLength] = useState("Medium");
  const [includeCode, setIncludeCode] = useState(false);

  // Advanced Mode State
  const [selectedTone, setSelectedTone] = useState("professional");
  const [selectedModifier, setSelectedModifier] = useState(null);
  const [sections, setSections] = useState([]);
  const [codeLanguage, setCodeLanguage] = useState("python");

  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  const handleGenerate = () => {
    if (!prompt.trim() || isGenerating) return;

    if (isAdvanced) {
      // Advanced Payload
      onGenerate({
        prompt,
        audience,
        style: selectedTone, // mapped to globalTone in parent
        toneModifier: selectedModifier,
        blueprint: {
          totalSections: sections.length,
          sections: sections,
        },
        includeCode: false, // blueprint handles this
        codeLanguage,
        length: "medium", // blueprint determines real length
      });
    } else {
      // Quick Payload
      onGenerate({
        prompt,
        style: quickStyle,
        length: quickLength,
        audience,
        includeCode,
        blueprint: null,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full transition-all duration-300 ease-in-out">
      {/* Main Input Container */}
      <div
        className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl transition-all hover:border-white/20 ${isAdvanced ? "bg-neutral-900/80" : ""}`}
      >
        {/* Advanced Toggle Header */}
        <div className="flex justify-end px-4 pt-3 pb-0">
          <button
            onClick={() => setIsAdvanced(!isAdvanced)}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${isAdvanced ? "text-purple-300 bg-purple-500/10" : "text-neutral-500 hover:text-white"}`}
          >
            <FiSettings size={12} />
            {isAdvanced ? "Advanced Mode Active" : "Advanced Mode"}
          </button>
        </div>

        {/* Text Input Area */}
        <div className="p-5 pt-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAdvanced
                ? "Enter your blog topic..."
                : "Describe what you want to create..."
            }
            className={`w-full bg-transparent text-white placeholder-neutral-500 resize-none focus:outline-none custom-scrollbar leading-relaxed transition-all ${isAdvanced ? "text-xl font-medium mb-4" : "text-base max-h-48"}`}
            rows={1}
            style={{ minHeight: "24px" }}
          />
        </div>

        {/* ADVANCED MODE CONTENT */}
        <AnimatePresence>
          {isAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-5 pb-5 border-t border-white/5"
            >
              <div className="space-y-6 pt-5">
                {/* 1. Tone Selector */}
                <div>
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FiFeather /> AI Persona
                  </h3>
                  <ToneSelector
                    selectedTone={selectedTone}
                    onToneChange={setSelectedTone}
                    selectedModifier={selectedModifier}
                    onModifierChange={setSelectedModifier}
                    compact
                  />
                </div>

                {/* 2. Global Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FiUser /> Target Audience
                    </h3>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                    >
                      {[
                        "General",
                        "Developers",
                        "Executives",
                        "Beginners",
                        "Engineers",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FiCode /> Code Language
                    </h3>
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20"
                    >
                      {[
                        "python",
                        "javascript",
                        "typescript",
                        "go",
                        "rust",
                        "java",
                        "cpp",
                        "sql",
                      ].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Structure Blueprint */}
                <div>
                  <BlueprintBuilder
                    sections={sections}
                    onSectionsChange={setSections}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Bar (Quick Mode vs Advanced Footer) */}
        {!isAdvanced && (
          <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-white/5 mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <OptionPill
                label="Style"
                value={quickStyle}
                options={[
                  "Professional",
                  "Casual",
                  "Technical",
                  "Storytelling",
                  "Contrarian",
                ]}
                onChange={setQuickStyle}
                icon={FiFeather}
              />
              <OptionPill
                label="Length"
                value={quickLength}
                options={["Short", "Medium", "Long", "Deep Dive"]}
                onChange={setQuickLength}
                icon={FiAlignLeft}
              />
              <OptionPill
                label="Audience"
                value={audience}
                options={["General", "Developers", "Executives", "Beginners"]}
                onChange={setAudience}
                icon={FiUser}
              />

              <button
                onClick={() => setIncludeCode(!includeCode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm ${
                  includeCode
                    ? "bg-purple-500/20 border-purple-500/30 text-purple-200"
                    : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <FiCode size={14} />
                <span className="font-medium">Code</span>
              </button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`ml-3 px-5 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium text-sm ${
                prompt.trim() && !isGenerating
                  ? "bg-white text-black hover:bg-neutral-200 hover:scale-105 shadow-lg"
                  : "bg-white/10 text-neutral-600 cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-600 border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <FiSend size={14} />
                </>
              )}
            </button>
          </div>
        )}

        {/* Advanced Mode Generate Button (Bottom full width) */}
        {isAdvanced && (
          <div className="p-5 border-t border-white/10 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full md:w-auto px-8 py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 font-bold text-sm ${
                prompt.trim() && !isGenerating
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-400 hover:to-blue-400 shadow-lg shadow-purple-500/20"
                  : "bg-white/10 text-neutral-500 cursor-not-allowed"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
                  <span>Configuring & Generating...</span>
                </>
              ) : (
                <>
                  <FiSend size={16} />
                  <span>Generate Custom Blog</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Helper Text */}
      <p className="text-center mt-3 text-xs text-neutral-600">
        Press{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
          Enter
        </kbd>{" "}
        to generate •{" "}
        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
          Shift + Enter
        </kbd>{" "}
        for new line
      </p>
    </div>
  );
};

export default AICreatorInput;
