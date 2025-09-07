import { useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import ReactQuill from "react-quill";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import "react-quill/dist/quill.snow.css";
// Syntax highlighting styles are handled globally in index.css

const MarkdownEditor = ({
  value = "",
  onChange,
  placeholder = "Write your blog post content...",
  height = "400px",
  showPreview = true,
}) => {
  const [activeTab, setActiveTab] = useState("write");
  const [content, setContent] = useState(value);

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ script: "sub" }, { script: "super" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ direction: "rtl" }],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
    "video",
    "color",
    "background",
    "align",
    "script",
    "code-block",
  ];

  const handleContentChange = useCallback(
    (newContent) => {
      setContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    },
    [onChange]
  );

  // Convert HTML to Markdown (basic conversion)
  const htmlToMarkdown = (html) => {
    return html
      .replace(
        /<h([1-6])>/g,
        (match, level) => "#".repeat(parseInt(level)) + " "
      )
      .replace(/<\/h[1-6]>/g, "\n\n")
      .replace(/<strong>/g, "**")
      .replace(/<\/strong>/g, "**")
      .replace(/<em>/g, "*")
      .replace(/<\/em>/g, "*")
      .replace(/<blockquote>/g, "> ")
      .replace(/<\/blockquote>/g, "\n\n")
      .replace(/<code>/g, "`")
      .replace(/<\/code>/g, "`")
      .replace(/<pre><code>/g, "```\n")
      .replace(/<\/code><\/pre>/g, "\n```\n\n")
      .replace(/<ul>/g, "")
      .replace(/<\/ul>/g, "\n")
      .replace(/<ol>/g, "")
      .replace(/<\/ol>/g, "\n")
      .replace(/<li>/g, "- ")
      .replace(/<\/li>/g, "\n")
      .replace(/<a href="([^"]*)"[^>]*>/g, "[")
      .replace(/<\/a>/g, "]($1)")
      .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g, "![$2]($1)")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n\n")
      .replace(/<[^>]*>/g, "") // Remove any remaining HTML tags
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
      .trim();
  };

  const getMarkdownContent = () => {
    if (activeTab === "markdown") {
      return content;
    }
    return htmlToMarkdown(content);
  };

  return (
    <div className="markdown-editor border border-neutral-700 rounded-lg overflow-hidden bg-neutral-900">
      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-700 bg-neutral-800">
        <button
          onClick={() => setActiveTab("write")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "write"
              ? "text-cyan-400 border-b-2 border-cyan-400 bg-neutral-900"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Write
        </button>
        <button
          onClick={() => setActiveTab("markdown")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "markdown"
              ? "text-cyan-400 border-b-2 border-cyan-400 bg-neutral-900"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          Markdown
        </button>
        {showPreview && (
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "text-cyan-400 border-b-2 border-cyan-400 bg-neutral-900"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Preview
          </button>
        )}
      </div>

      {/* Editor Content */}
      <div style={{ height }}>
        {activeTab === "write" && (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            modules={modules}
            formats={formats}
            style={{
              height: `calc(${height} - 42px)`,
              backgroundColor: "#171717",
            }}
            className="quill-dark-theme"
          />
        )}

        {activeTab === "markdown" && (
          <textarea
            value={getMarkdownContent()}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your content in Markdown..."
            className="w-full h-full p-4 bg-neutral-900 text-neutral-200 border-none outline-none resize-none font-mono text-sm"
            style={{ height: `calc(${height} - 42px)` }}
          />
        )}

        {activeTab === "preview" && (
          <div
            className="h-full overflow-y-auto p-4 bg-neutral-900"
            style={{ height: `calc(${height} - 42px)` }}
          >
            <div className="prose prose-invert prose-cyan max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <pre className="bg-neutral-800 rounded-lg p-4 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code
                        className="bg-neutral-800 px-1 py-0.5 rounded text-sm"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  blockquote({ children }) {
                    return (
                      <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-neutral-300">
                        {children}
                      </blockquote>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border border-neutral-700">
                          {children}
                        </table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return (
                      <th className="border border-neutral-700 px-4 py-2 bg-neutral-800 text-left">
                        {children}
                      </th>
                    );
                  },
                  td({ children }) {
                    return (
                      <td className="border border-neutral-700 px-4 py-2">
                        {children}
                      </td>
                    );
                  },
                }}
              >
                {getMarkdownContent()}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles for Quill Dark Theme */}
      <style>{`
        .quill-dark-theme .ql-toolbar {
          background-color: #262626;
          border-bottom: 1px solid #404040;
        }

        .quill-dark-theme .ql-toolbar .ql-stroke {
          fill: none;
          stroke: #a3a3a3;
        }

        .quill-dark-theme .ql-toolbar .ql-fill {
          fill: #a3a3a3;
          stroke: none;
        }

        .quill-dark-theme .ql-toolbar .ql-picker-label {
          color: #a3a3a3;
        }

        .quill-dark-theme .ql-container {
          background-color: #171717;
          color: #e5e5e5;
          border: none;
        }

        .quill-dark-theme .ql-editor {
          color: #e5e5e5;
        }

        .quill-dark-theme .ql-editor.ql-blank::before {
          color: #737373;
        }

        .quill-dark-theme .ql-tooltip {
          background-color: #262626;
          border: 1px solid #404040;
          color: #e5e5e5;
        }

        .quill-dark-theme .ql-tooltip input {
          background-color: #171717;
          border: 1px solid #404040;
          color: #e5e5e5;
        }
      `}</style>
    </div>
  );
};

MarkdownEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  height: PropTypes.string,
  showPreview: PropTypes.bool,
};

export default MarkdownEditor;
