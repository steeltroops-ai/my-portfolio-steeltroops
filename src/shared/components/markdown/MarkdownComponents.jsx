import { useMemo } from "react";
import CodeBlock from "./CodeBlock";
import { BlogImage } from "../../index"; // Adjusted relative path to shared index
import { flattenText, generateId } from "@/lib/markdown";
import { FiUser } from "react-icons/fi";

export const useMarkdownComponents = (post) => {
  // Memoize markdown components to prevent unnecessary re-renders
  // CRITICAL: This MUST be before any conditional returns to comply with Rules of Hooks
  return useMemo(
    () => ({
      // Custom heading components with anchor links
      h1: ({ children, ...props }) => {
        const text = flattenText(children);
        if (post?.title && text.toLowerCase() === post.title.toLowerCase())
          return null;
        const id = generateId(text);
        return (
          <h1
            id={id}
            className="group relative text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight mt-12 mb-8 first:mt-0 scroll-mt-24"
            {...props}
          >
            <span className="relative z-10">{children}</span>
            <div className="absolute -bottom-1 left-0 w-12 h-1 bg-gradient-to-r from-purple-500/40 to-transparent rounded-full group-hover:w-full transition-all duration-700 ease-out" />
          </h1>
        );
      },
      h2: ({ children, ...props }) => {
        const id = generateId(flattenText(children));
        return (
          <h2
            id={id}
            className="group relative text-lg sm:text-xl lg:text-2xl font-bold text-white tracking-tight mt-16 mb-6 scroll-mt-24 flex items-center gap-3"
            {...props}
          >
            <div className="h-4 w-1 bg-purple-500/60 rounded-full group-hover:h-6 group-hover:bg-purple-400 transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
            <span>{children}</span>
          </h2>
        );
      },
      h3: ({ children, ...props }) => {
        const id = generateId(flattenText(children));
        return (
          <h3
            id={id}
            className="group relative text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight mt-12 mb-4 scroll-mt-24 flex items-center gap-2.5"
            {...props}
          >
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full group-hover:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            <span className="group-hover:text-purple-100 transition-colors">
              {children}
            </span>
          </h3>
        );
      },
      h4: ({ children, ...props }) => (
        <h4
          className="group text-base sm:text-lg font-bold text-neutral-100 tracking-tight mt-8 mb-4 flex items-center gap-2"
          {...props}
        >
          <span className="text-purple-500/50 font-mono group-hover:text-purple-400 transition-colors">
            /
          </span>
          <span className="group-hover:text-white transition-colors border-b border-transparent group-hover:border-purple-500/30">
            {children}
          </span>
        </h4>
      ),
      // New H5 - Technical Kicker / Label
      h5: ({ children, ...props }) => (
        <h5
          className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 mt-10 mb-3 flex items-center gap-2"
          {...props}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/60 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
          {children}
        </h5>
      ),
      // New H6 - Caption / Note Header
      h6: ({ children, ...props }) => (
        <h6
          className="text-sm font-medium text-neutral-500 italic mt-6 mb-2 flex items-center gap-3 border-l-2 border-neutral-800 pl-4"
          {...props}
        >
          {children}
        </h6>
      ),
      // Advanced List Item Handling (Differentiates Ordered vs Unordered)
      li: ({ children, ordered, index, ...props }) => {
        // 1. Process List Item (Ordered)
        if (ordered) {
          return (
            <li
              className="relative pl-2 text-base sm:text-[17px] leading-[1.8] text-neutral-300 font-light my-2 marker:text-cyan-500 marker:font-mono marker:font-bold"
              {...props}
            >
              <span className="relative z-10">{children}</span>
            </li>
          );
        }

        // 2. Interactive Bullet Point (Unordered)
        return (
          <li
            className="flex gap-3 group/item mb-3 last:mb-0 scroll-mt-24"
            {...props}
          >
            <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-purple-500/40 group-hover/item:bg-purple-400 group-hover/item:scale-150 transition-all duration-300 shrink-0 shadow-[0_0_5px_rgba(168,85,247,0.2)] group-hover/item:shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
            <div className="flex-1 text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.7] text-neutral-300 font-light">
              {children}
            </div>
          </li>
        );
      },
      // Custom paragraph styling - Medium Readability Calibrated
      p: ({ children, ...props }) => (
        <p
          className="text-[16px] sm:text-[18px] lg:text-[20px] leading-[1.6] text-neutral-300 font-light tracking-normal mb-6 sm:mb-8"
          {...props}
        >
          {children}
        </p>
      ),
      // Custom code block styling with language header
      pre: CodeBlock,
      // Inline code styling
      code: ({ node, inline, className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || "");

        // Inline code
        if (inline || !match) {
          return (
            <code
              className="bg-white/5 px-1.5 py-0.5 rounded text-sm text-neutral-100 font-mono border border-white/10"
              {...props}
            >
              {children}
            </code>
          );
        }

        // Code block - let highlight.js handle it
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // Smart Blockquote & Callout System
      blockquote: ({ children, ...props }) => {
        // Safety check for children content
        let text = "";
        try {
          if (typeof children === "string") text = children;
          else if (Array.isArray(children)) {
            children.forEach((child) => {
              if (typeof child === "string") text += child;
              else if (child?.props?.children) text += child.props.children;
            });
          } else if (children?.props?.children) {
            text = children.props.children;
          }
        } catch (e) {
          text = "";
        }

        // Check for Callout Patterns
        const isNote = /^(Note|Info):/i.test(text);
        const isTip = /^(Tip|Pro-Tip):/i.test(text);
        const isWarning = /^(Warning|Caution|Alert):/i.test(text);
        const isAI = /^(AI Insight|Summary|Key Takeaway):/i.test(text);

        // 1. AI Insight / Summary Block
        if (isAI) {
          return (
            <div className="my-10 relative overflow-hidden rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 sm:p-8">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <FiUser className="text-4xl text-purple-400" />
              </div>
              <h5 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-purple-300 mb-3">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                AI Insight
              </h5>
              <div className="relative z-10 text-lg text-purple-100/90 font-light leading-relaxed">
                {children}
              </div>
            </div>
          );
        }

        // 2. Info / Note Block
        if (isNote) {
          return (
            <div className="my-8 flex gap-4 p-5 rounded-lg border border-blue-500/20 bg-blue-500/5 text-blue-100/90 font-light leading-relaxed">
              <div className="shrink-0 w-1 h-full bg-blue-500/50 rounded-full" />
              <div>{children}</div>
            </div>
          );
        }

        // 3. Warning Block
        if (isWarning) {
          return (
            <div className="my-8 flex gap-4 p-5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-100/90 font-light leading-relaxed">
              <div className="shrink-0 w-1 h-full bg-red-500/50 rounded-full" />
              <div>{children}</div>
            </div>
          );
        }

        // 4. Tip / Pro-Tip Block
        if (isTip) {
          return (
            <div className="my-8 flex gap-4 p-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-100/90 font-light leading-relaxed">
              <div className="shrink-0 w-1 h-full bg-emerald-500/50 rounded-full" />
              <div>{children}</div>
            </div>
          );
        }

        // 5. Default: Elegant Pull Quote
        return (
          <blockquote className="relative my-12 pl-6 sm:pl-10 py-2 border-l-4 border-white/20">
            <div className="absolute left-6 top-0 text-6xl text-white/5 font-serif -translate-y-4 -translate-x-4">
              "
            </div>
            <p className="text-xl sm:text-2xl font-serif italic text-white/90 leading-relaxed">
              {children}
            </p>
          </blockquote>
        );
      },
      // Custom list styling
      ul: ({ children, ...props }) => (
        <ul
          className="list-none ml-2 space-y-4 text-neutral-300 font-light tracking-wide mb-8"
          {...props}
        >
          {children}
        </ul>
      ),
      ol: ({ children, ...props }) => (
        <ol
          className="list-decimal list-outside ml-6 space-y-4 text-neutral-300 font-light tracking-wide mb-8 marker:text-cyan-500 marker:font-mono marker:font-semibold"
          {...props}
        >
          {children}
        </ol>
      ),
      // Custom link styling
      a: ({ children, href, ...props }) => (
        <a
          href={href}
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 decoration-cyan-500/30 hover:decoration-cyan-400 transition-all font-medium"
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      ),
      // Custom image styling with optimization
      img: ({ src, alt, ...props }) => (
        <BlogImage src={src} alt={alt} caption={alt} {...props} />
      ),
      // Custom table styling
      table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-8 rounded-xl border border-white/10 shadow-lg bg-white/[0.02] table-scrollbar pb-2">
          <table className="min-w-full divide-y divide-white/10" {...props}>
            {children}
          </table>
        </div>
      ),
      th: ({ children, ...props }) => (
        <th
          className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider bg-white/5"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }) => (
        <td
          className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300 border-t border-white/5"
          {...props}
        >
          {children}
        </td>
      ),
    }),
    [post?.title]
  );
};
