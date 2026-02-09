import { useState, useRef, useEffect } from "react";
import {
  FiSend,
  FiCode,
  FiUser,
  FiMaximize2,
  FiCpu,
  FiPaperclip,
} from "react-icons/fi";

const OptionPill = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-medium text-neutral-400 hover:text-white"
      >
        {Icon && <Icon size={12} />}
        <span>
          {label}: <span className="text-white">{value}</span>
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 w-40 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                  value === opt ? "text-white bg-white/10" : "text-neutral-400"
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Input Container */}
      <div className="relative group bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl transition-all hover:border-white/20">
        {/* Top Options Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5">
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
            icon={FiCpu}
          />
          <OptionPill
            label="Length"
            value={length}
            options={["Short", "Medium", "Long", "Deep Dive"]}
            onChange={setLength}
            icon={FiMaximize2}
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-xs font-medium ${
              includeCode
                ? "bg-white/10 border-white/20 text-white"
                : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
            }`}
          >
            <FiCode size={12} />
            <span>Code Examples</span>
          </button>
        </div>

        {/* Text Input Area */}
        <div className="relative p-4">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to generate a post..."
            className="w-full bg-transparent text-white placeholder-neutral-500 text-lg resize-none focus:outline-none max-h-60 custom-scrollbar"
            rows={1}
            style={{ minHeight: "60px" }}
          />

          <div className="flex justify-between items-center mt-2">
            <button className="p-2 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <FiPaperclip size={20} />
            </button>

            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={`p-3 rounded-xl transition-all duration-300 flex items-center gap-2 ${
                prompt.trim() && !isGenerating
                  ? "bg-white text-black shadow-lg shadow-white/5 hover:scale-105 hover:bg-neutral-200"
                  : "bg-white/5 text-neutral-600 cursor-not-allowed"
              }`}
            >
              <span className="font-semibold text-sm">Generate</span>
              <FiSend size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="text-center mt-3 text-xs text-neutral-500">
        AI can make mistakes. Please review generated content.
      </div>
    </div>
  );
};

export default AICreatorInput;
