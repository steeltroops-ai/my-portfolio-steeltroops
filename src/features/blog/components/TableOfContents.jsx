import React from "react";
import PropTypes from "prop-types";

const TableOfContents = ({
  headings,
  activeId,
  onHeadingClick,
  variant = "pc",
}) => {
  if (!headings || headings.length === 0) return null;

  if (variant === "mobile") {
    return (
      <nav className="flex flex-col gap-4 py-4">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => onHeadingClick(heading.id)}
            className={`block w-full text-left transition-all duration-300 group ${
              activeId === heading.id
                ? "text-purple-300 font-semibold transform translate-x-1.5"
                : "text-neutral-100 hover:text-white font-light hover:translate-x-1"
            }`}
            style={{
              paddingLeft:
                heading.level === 1
                  ? "0"
                  : heading.level === 2
                    ? "0"
                    : "1.25rem",
              fontSize: heading.level <= 2 ? "14px" : "13px",
            }}
          >
            <div className="flex items-start gap-3">
              {activeId === heading.id && (
                <div className="mt-2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
              )}
              <span className="leading-snug">{heading.text}</span>
            </div>
          </button>
        ))}
      </nav>
    );
  }

  // PC Variant
  return (
    <nav className="space-y-2.5">
      {headings.map((heading) => (
        <button
          key={heading.id}
          onClick={() => onHeadingClick(heading.id)}
          className={`block w-full text-left text-sm transition-colors leading-relaxed ${
            activeId === heading.id
              ? "text-purple-400 font-medium"
              : "text-neutral-300 hover:text-white"
          } ${
            heading.level === 1
              ? "pl-0 font-medium"
              : heading.level === 2
                ? "pl-0"
                : "pl-4"
          }`}
        >
          {heading.text}
        </button>
      ))}
    </nav>
  );
};

TableOfContents.propTypes = {
  headings: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
      level: PropTypes.number.isRequired,
    })
  ).isRequired,
  activeId: PropTypes.string,
  onHeadingClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(["pc", "mobile"]),
};

// Memoize component to prevent re-renders when parent updates unrelated state
export default React.memo(TableOfContents);
