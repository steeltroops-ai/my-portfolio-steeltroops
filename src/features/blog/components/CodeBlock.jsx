import { useState, useCallback, memo } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

const CodeBlock = ({ children, ...props }) => {
  const [copied, setCopied] = useState(false);

  // Find the code element and extract language
  const codeElement = children?.props;
  const className = codeElement?.className || "";
  const match = /language-(\w+)/.exec(className);
  const language = match ? match[1] : "code";

  // Format language names for display
  const languageLabels = {
    js: "JavaScript",
    jsx: "JSX",
    ts: "TypeScript",
    tsx: "TSX",
    py: "Python",
    python: "Python",
    css: "CSS",
    html: "HTML",
    json: "JSON",
    bash: "Bash",
    sh: "Shell",
    sql: "SQL",
    yaml: "YAML",
    yml: "YAML",
    md: "Markdown",
    go: "Go",
    rust: "Rust",
    java: "Java",
    cpp: "C++",
    c: "C",
  };

  const displayLanguage =
    languageLabels[language.toLowerCase()] || language.toUpperCase();

  // Recursive function to extract text from React children
  const extractText = (node) => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!node) return "";
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (node.props?.children) return extractText(node.props.children);
    return "";
  };

  // Memoize copy handler to prevent recreation on every render
  const handleCopy = useCallback(() => {
    // Extract text recursively to handle nested syntax highlighting spans
    const text = extractText(codeElement?.children);

    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeElement?.children]);

  return (
    <div className="relative my-10 group/code font-mono text-sm max-w-[95vw] -mx-4 sm:mx-0 sm:max-w-none">
      <div className="relative rounded-xl border border-white/10 bg-[#0d1117]/80 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/5 transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        {/* Top Line Neutral Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Code Header - Mac Terminal Style */}
        <div className="flex items-center justify-between px-5 py-3 bg-white/[0.03] border-b border-white/5 select-none">
          {/* Left: Traffic Lights & Language */}
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#ff5f56]/50 shadow-[0_0_8px_rgba(255,95,86,0.3)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#ffbd2e]/50 shadow-[0_0_8px_rgba(255,189,46,0.3)]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#27c93f]/50 shadow-[0_0_8px_rgba(39,201,63,0.3)]" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold border-l border-white/10 pl-4">
              {displayLanguage}
            </span>
          </div>

          {/* Right: Copy Action */}
          <button
            onClick={handleCopy}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider transition-all duration-200
              ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10"
              }
            `}
          >
            {copied ? (
              <>
                <FiCheck className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <FiCopy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Content - Wide & Clean */}
        <div className="relative">
          <pre
            {...props}
            className="!bg-transparent !m-0 !p-6 sm:!p-8 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent font-mono text-[13px] sm:text-[14px] leading-relaxed"
          >
            {children}
          </pre>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent re-renders when parent updates
export default memo(CodeBlock);
