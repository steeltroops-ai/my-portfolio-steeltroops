/**
 * Structural Rules -- Formatting constraints injected into every prompt.
 *
 * These rules ensure the AI generates ONLY markdown that BlogPost.jsx
 * can render beautifully. This is the "law" layer that overrides
 * creative freedom when formatting is concerned.
 */

// =========================================================================
// GLOBAL STRUCTURAL RULES (injected into EVERY section prompt)
// =========================================================================

export const GLOBAL_RULES = `
STRUCTURAL RULES -- MANDATORY FOR ALL SECTIONS:

1. THE TITLE (outline stage only):
   - 6-12 words.
   - Clear, specific, not cryptic.
   - No clever internet energy. Just clean intelligence.
   - Example: "Designing Reliable Autonomous Systems Under Latency Constraints"

2. THE DESCRIPTION (outline stage only):
   - 2-3 lines.
   - Explain the problem, why it matters, and the perspective being offered.
   - This becomes the "excerpt" shown on blog cards.

3. FORMATTING LAW -- STRICTLY ENFORCED:
   - NO paragraph longer than 5 sentences.
   - Code blocks MUST specify a language tag (e.g., \`\`\`python, \`\`\`javascript).
   - Tables MUST have a header row and at least 3 data rows.
   - NEVER use \`\`\`mermaid -- not supported by the renderer.
   - NEVER use LaTeX/math notation ($$ or $).
   - NEVER use raw HTML tags (<div>, <details>, <summary>, etc.).
   - NEVER use footnotes ([^1] style).
   - Bold (**text**) is for key terms, not entire sentences.
   - Italic (*text*) is for titles, foreign terms, or slight emphasis.

4. CALLOUT FORMAT -- USE THESE EXACT PREFIXES IN BLOCKQUOTES:
   - > Note: text here       (renders as blue info box)
   - > Warning: text here    (renders as red warning box)
   - > Tip: text here        (renders as green tip box)
   - > AI Insight: text here  (renders as purple insight panel)
   - > text without prefix   (renders as elegant pull quote)

5. TRANSITIONS -- WHAT TO AVOID:
   - "Moreover", "Furthermore", "In addition" -- banned.
   - "It's worth noting that" -- banned.
   - "As we can see" -- banned.
   - Prefer concrete transitions: "This leads to a deeper question:", "The consequence is direct:"

6. ENDINGS -- WHAT TO AVOID:
   - No sign-offs ("Thanks for reading", "Stay tuned", "Until next time").
   - No rhetorical questions as closing lines.
   - End with substance: a forward-looking thought, a restatement, or a call to action.
`;

// =========================================================================
// DENSITY RULES (injected based on section word target)
// =========================================================================

export function getDensityRules(targetWords) {
  if (targetWords < 200) {
    return `
DENSITY RULES (SHORT section, target: ~${targetWords} words):
- 2-3 paragraphs maximum.
- NO subsections (### H3) allowed.
- NO tables (too heavy for a short section).
- Keep it tight and focused on a single point.
`;
  }

  if (targetWords <= 400) {
    return `
DENSITY RULES (MEDIUM section, target: ~${targetWords} words):
- 3-5 paragraphs.
- 0-2 subsections (### H3) allowed.
- Maximum 1 formatting element (table OR code block, not both).
- Each paragraph should advance the argument.
`;
  }

  if (targetWords <= 700) {
    return `
DENSITY RULES (LONG section, target: ~${targetWords} words):
- 5-8 paragraphs.
- 2-4 subsections (### H3) expected.
- Must include at least 1 formatting element (list, table, code, or callout).
- If the section exceeds 600 words with no visual break, ADD a subheading or list.
- Use --- horizontal rules between major topic shifts.
`;
  }

  return `
DENSITY RULES (COMPREHENSIVE section, target: ~${targetWords} words):
- 8+ paragraphs.
- 3-5 subsections (### H3) REQUIRED.
- Must include 2+ formatting elements (lists, tables, code, callouts).
- Every ~300 words must have a visual break (heading, list, table, code, or callout).
- Use --- horizontal rules between major topic shifts.
`;
}

// =========================================================================
// CONTENT GUARDRAILS (anti-wall-of-text enforcement)
// =========================================================================

export const CONTENT_GUARDRAILS = `
CONTENT QUALITY ENFORCEMENT:

1. Every paragraph must earn its place. Ask: "Does this advance the argument?"
2. If you're about to write a 6th sentence in one paragraph, STOP and start a new one.
3. If a section has 3+ consecutive paragraphs with no visual break (list, code, table, heading),
   you MUST insert one before continuing.
4. Lists should have 3-7 items. Under 3 is pointless. Over 7 should be a table or split.
5. Code blocks should be 5-25 lines. Under 5 is trivial. Over 25 should be split with explanation.
6. Never repeat the section heading inside the section body.
7. The first sentence of a section should NOT be "In this section, we will discuss..."
`;

// =========================================================================
// CONTEXT INJECTION TEMPLATE
// =========================================================================

/**
 * Build the context window for a section being generated.
 * Includes the full outline and content of previous sections.
 *
 * @param {Object} params
 * @param {Object} params.outline - The generated outline { title, description, sections }
 * @param {string[]} params.previousSections - Content of already-generated sections
 * @param {number} params.currentIndex - Index of the section being generated
 * @returns {string} Context prompt
 */
export function buildContextWindow({
  outline,
  previousSections,
  currentIndex,
}) {
  const sectionList = outline.sections
    .map((s, i) => {
      const marker =
        i === currentIndex
          ? ">>> CURRENT >>>"
          : i < currentIndex
            ? "[DONE]"
            : "[PENDING]";
      return `  ${marker} ${i + 1}. ${s.heading} (${s.type || "prose"})`;
    })
    .join("\n");

  // Include content from last 2 completed sections for coherence
  const recentContent = previousSections
    .slice(-2)
    .map((content, i) => {
      const actualIndex = Math.max(0, currentIndex - 2) + i;
      return `--- Previously written: Section ${actualIndex + 1} ---\n${content.substring(0, 1500)}${content.length > 1500 ? "\n[...truncated for context]" : ""}`;
    })
    .join("\n\n");

  return `
ARTICLE CONTEXT:
================
Title: "${outline.title}"
Subtitle: "${outline.description}"
Total Sections: ${outline.sections.length}
Currently Writing: Section ${currentIndex + 1} of ${outline.sections.length}

SECTION MAP:
${sectionList}

${recentContent ? `\nPREVIOUS CONTENT (for coherence -- do NOT repeat this content):\n${recentContent}` : ""}
`;
}
