import { useState, useRef, useEffect } from "react";
import { FiSend, FiCode, FiUser, FiAlignLeft, FiFeather } from "react-icons/fi";

const OptionPill = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm text-neutral-300 hover:text-white"
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
  const [style, setStyle] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [audience, setAudience] = useState("General");
  const [includeCode, setIncludeCode] = useState(false);
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

    onGenerate({
      prompt,
      style,
      length,
      audience,
      includeCode,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="w-full">
      {/* Main Input Container */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl transition-all hover:border-white/20">
        {/* Text Input Area */}
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to create..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-base resize-none focus:outline-none max-h-48 custom-scrollbar leading-relaxed"
            rows={1}
            style={{ minHeight: "24px" }}
          />
        </div>

        {/* Bottom Bar with Options and Generate Button */}
        <div className="flex items-center justify-between px-5 pb-4 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <OptionPill
              label="Style"
              value={style}
              options={[
                "Professional",
                "Casual",
                "Technical",
                "Storytelling",
                "Contrarian",
              ]}
              onChange={setStyle}
              icon={FiFeather}
            />
            <OptionPill
              label="Length"
              value={length}
              options={["Short", "Medium", "Long", "Deep Dive"]}
              onChange={setLength}
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
