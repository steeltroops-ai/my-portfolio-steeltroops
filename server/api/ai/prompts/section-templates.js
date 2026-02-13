/**
 * Section Templates -- Per-type prompt builders
 *
 * Each section "type" (prose, technical, comparison_table, etc.) maps to
 * a specific prompt template that instructs the AI on structure and formatting.
 *
 * These templates are composed with identity + structural rules + context
 * to form the complete prompt for each section.
 */

// =========================================================================
// SECTION TYPE TEMPLATES
// =========================================================================

const SECTION_TEMPLATES = {
  prose: {
    label: "Standard Prose",
    description: "Clean paragraphs with clear argument flow.",
    prompt: (section) => `
SECTION TYPE: STANDARD PROSE

Write flowing, well-structured paragraphs for this section.

STRUCTURE:
- Start with ## ${section.heading || "[generate an appropriate heading]"}
- Use clear topic sentences.
- Each paragraph should advance the argument.
${section.subsections > 0 ? `- Include ${section.subsections} subsections using ### H3 headings.` : "- No subsections needed for this section."}

ALLOWED ELEMENTS:
- Paragraphs (primary)
- **Bold** for key terms
- *Italic* for emphasis
- Bullet points for short lists
- Blockquotes for pull quotes or callouts
${section.includeElements?.includes("callout_note") ? "- Include a > Note: callout with an important detail." : ""}
${section.includeElements?.includes("callout_warning") ? "- Include a > Warning: callout about a common pitfall." : ""}
`,
  },

  technical: {
    label: "Technical Deep-Dive",
    description:
      "Technical analysis with code examples and precise terminology.",
    prompt: (section, opts = {}) => `
SECTION TYPE: TECHNICAL DEEP-DIVE

Write a technically rigorous section with code examples and precise analysis.

STRUCTURE:
- Start with ## ${section.heading || "[generate an appropriate heading]"}
${section.subsections > 0 ? `- Include ${section.subsections} subsections using ### H3 headings.` : ""}

REQUIRED ELEMENTS:
- At least ONE code block with a language tag (\`\`\`${opts.codeLanguage || "python"}).
- Use \`inline code\` for function names, variables, and technical identifiers.
- Code blocks should be 5-25 lines -- focused and purposeful.
${section.includeElements?.includes("bullet_points") ? "- Include a bulleted list summarizing key points." : ""}
${section.includeElements?.includes("table") ? "- Include a comparison or reference table." : ""}
${section.includeElements?.includes("callout_note") ? "- Include a > Note: callout for an important technical detail." : ""}
${section.includeElements?.includes("callout_warning") ? "- Include a > Warning: callout about a common mistake." : ""}

TECHNICAL WRITING RULES:
- Define specialized terms on first use.
- Prefer concrete examples over abstract descriptions.
- When referencing a concept, explain the "why" not just the "what".
- Code should be production-quality, not toy examples.
`,
  },

  comparison_table: {
    label: "Comparison Table",
    description:
      "Structured comparison with a markdown table as the centerpiece.",
    prompt: (section) => `
SECTION TYPE: COMPARISON TABLE

Write a section centered around a structured comparison.

STRUCTURE:
- Start with ## ${section.heading || "[generate an appropriate heading]"}
- 1-2 paragraphs introducing what's being compared and why.
- A markdown table with:
  - Header row with clear column names
  - At least 3 data rows (ideally 4-6)
  - Aligned and readable columns
- 1-2 paragraphs analyzing the comparison and drawing conclusions.
${section.subsections > 0 ? `- ${section.subsections} subsections (### H3) for deeper analysis of specific rows.` : ""}

TABLE FORMAT RULES:
- Use standard markdown pipe + dash syntax.
- Keep cell content concise (2-5 words per cell ideally).
- Include a "Verdict" or "Best For" column if comparing tools/approaches.
- Bold the winning/recommended option if applicable.
${section.includeElements?.includes("bullet_points") ? "- Follow the table with bullet points summarizing key takeaways." : ""}
`,
  },

  code_walkthrough: {
    label: "Code Walkthrough",
    description: "Step-by-step code explanation with full examples.",
    prompt: (section, opts = {}) => `
SECTION TYPE: CODE WALKTHROUGH

Write a step-by-step walkthrough of a code implementation.

STRUCTURE:
- Start with ## ${section.heading || "[generate an appropriate heading]"}
- Brief intro explaining what the code achieves (1-2 paragraphs).
- The complete code example in a \`\`\`${opts.codeLanguage || "python"} block.
- Line-by-line or block-by-block explanation using numbered list.
${section.subsections > 0 ? `- ${section.subsections} subsections (### H3) for different aspects of the code.` : ""}

CODE WALKTHROUGH RULES:
- Show the COMPLETE code first, then explain.
- Use ordered lists (1. 2. 3.) for sequential explanation.
- Reference specific line numbers or function names with \`inline code\`.
- If showing a refactoring, use "Before" and "After" code blocks.
- Code should be 10-30 lines -- complex enough to be interesting, simple enough to follow.
${section.includeElements?.includes("callout_tip") ? "- Include a > Tip: callout with a pro-tip about the code." : ""}
${section.includeElements?.includes("callout_warning") ? "- Include a > Warning: callout about edge cases or gotchas." : ""}
`,
  },

  case_study: {
    label: "Case Study",
    description:
      "Real-world scenario with problem, investigation, solution, outcome.",
    prompt: (section) => `
SECTION TYPE: CASE STUDY

Write a narrative-driven case study following real-world problem-solving.

STRUCTURE:
- Start with ## ${section.heading || "[generate an appropriate heading]"}
- Follow this structure (using ### H3 for each stage):
  1. ### The Problem — What went wrong? What was the symptom?
  2. ### Investigation — How was the root cause identified?
  3. ### The Solution — What was implemented? Why this approach?
  4. ### Outcome — Quantified results. What improved?

CASE STUDY RULES:
- Use specific, concrete details (even if hypothetical, make them realistic).
- Include quantified results: "Latency dropped from 340ms to 45ms."
- Include a > AI Insight: callout with the key takeaway.
- Keep the narrative arc clear: tension -> investigation -> resolution.
${section.includeElements?.includes("code_block") ? "- Include a code block showing the fix or key implementation." : ""}
${section.includeElements?.includes("table") ? "- Include a before/after metrics table." : ""}
`,
  },
};

// =========================================================================
// OUTLINE PROMPT BUILDER
// =========================================================================

/**
 * Build the prompt for generating the initial blog outline.
 *
 * @param {Object} params
 * @param {string} params.topic - Blog topic
 * @param {Object[]} params.blueprintSections - User-defined section specs (optional)
 * @param {string} params.lengthConfig - { words, instruction } from length selection
 * @param {boolean} params.includeCode - Whether code examples are desired
 * @param {string} params.identity - The system identity prompt
 * @returns {string} The outline generation prompt
 */
export function buildOutlinePrompt({
  topic,
  blueprintSections,
  lengthConfig,
  includeCode,
  identity,
}) {
  const hasBlueprintSections =
    blueprintSections && blueprintSections.length > 0;

  let sectionGuidance = "";
  if (hasBlueprintSections) {
    sectionGuidance = `
THE USER HAS PROVIDED A BLUEPRINT. You MUST follow it.
Generate EXACTLY ${blueprintSections.length} sections matching these specifications:

${blueprintSections
  .map(
    (s, i) => `
Section ${i + 1}:
  - Heading: ${s.heading || "(YOU decide an appropriate heading)"}
  - Type: ${s.type || "prose"}
  - Target Words: ~${s.targetWords || 300}
  - Subsections: ${s.subsections || 0}
  - Required Elements: ${(s.includeElements || []).join(", ") || "none"}
`
  )
  .join("")}

In your outline, keep these specs exactly. You may refine the headings for clarity
but do NOT change the section count, types, or element requirements.
`;
  } else {
    sectionGuidance = `
Design an optimal section structure for this topic.
Plan 4-7 sections depending on complexity.
Each section should have a clear purpose and build on the previous one.
`;
  }

  return `
${identity}

TASK: Create a DETAILED CONTENT PLAN for a blog post about: "${topic}".
Target Length: ${lengthConfig?.words || "1500"} words total.

${sectionGuidance}

USER CONSTRAINTS:
- Include Code Examples: ${includeCode ? "YES (Required in at least 2 sections)" : "NO (Strictly Forbidden)"}

PLANNING RULES:
- Every section must have a clear content_strategy explaining WHAT argument or concept it develops.
- The flow must be LOGICAL and BUILD UPON itself.
- The description should work as a compelling subtitle/excerpt for the blog.

Return ONLY a JSON object with this exact shape:
{
  "title": "Clear, specific 6-12 word title",
  "description": "Professional 2-3 line abstract/subtitle",
  "sections": [
    {
      "heading": "Section Heading (Clear & Descriptive)",
      "type": "${hasBlueprintSections ? "match the blueprint spec" : "prose | technical | comparison_table | code_walkthrough | case_study"}",
      "content_strategy": "What specific argument or concept this section develops",
      "targetWords": ${hasBlueprintSections ? "match the blueprint spec" : "300-500"},
      "subsections": ${hasBlueprintSections ? "match the blueprint spec" : "0-3"},
      "includeElements": ${hasBlueprintSections ? "match the blueprint spec" : '["bullet_points"] or ["code_block", "table"] etc.'},
      "needs_code": ${includeCode ? "true (only in appropriate sections)" : "false"}
    }
  ]
}
`;
}

// =========================================================================
// SECTION PROMPT BUILDER
// =========================================================================

/**
 * Build the prompt for generating a single section's content.
 *
 * @param {Object} params
 * @param {Object} params.section - The section spec from the outline
 * @param {string} params.identity - System identity prompt
 * @param {string} params.context - Context window (from structural-rules.js)
 * @param {string} params.densityRules - Density rules for this word target
 * @param {Object} params.opts - Additional options (codeLanguage, etc.)
 * @returns {string} The section generation prompt
 */
export function buildSectionPrompt({
  section,
  identity,
  context,
  densityRules,
  opts = {},
}) {
  const template = SECTION_TEMPLATES[section.type] || SECTION_TEMPLATES.prose;
  const typePrompt = template.prompt(section, opts);

  return `
${identity}

${context}

${typePrompt}

TARGET WORD COUNT: ~${section.targetWords || 400} words for this section.
(This is a target, not a hard limit. +/- 20% is acceptable.)

${densityRules}

CRITICAL REMINDERS:
- Output Markdown only.
- Start with ## ${section.heading || "[generate heading]"}.
- NEVER use \`\`\`mermaid, LaTeX, or raw HTML.
- NEVER repeat content from previous sections.
- Smooth transition from the previous section's topic.
- End the section cleanly -- do NOT add a summary or sign-off for individual sections.
`;
}

// =========================================================================
// METADATA PROMPT BUILDER
// =========================================================================

/**
 * Build the prompt for generating post metadata (SEO, tags, etc.)
 *
 * @param {Object} params
 * @param {string} params.title - The generated title
 * @param {string} params.excerpt - The generated excerpt/description
 * @param {string} params.contentPreview - First 500 chars of content
 * @returns {string} The metadata generation prompt
 */
export function buildMetadataPrompt({ title, excerpt, contentPreview }) {
  return `
You are an SEO and content strategy specialist.

Given a blog post with the following details:
TITLE: "${title}"
EXCERPT: "${excerpt}"
CONTENT PREVIEW: "${contentPreview}"

Generate metadata for this post. Return ONLY a JSON object with this shape:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaDescription": "A compelling 140-155 character SEO meta description. Different from the excerpt. Optimized for search.",
  "imageSearchQuery": "A 3-5 word search query for finding a relevant hero image on Unsplash"
}

RULES:
- Tags: 3-5 single-word tags. Example: "Robotics", "Engineering", "Architecture".
- metaDescription: MUST be different from the excerpt. Max 155 characters. Include the primary keyword.
- imageSearchQuery: Descriptive enough to find a relevant, professional image. No brand names.
`;
}

// =========================================================================
// EXPORTS
// =========================================================================

export const AVAILABLE_SECTION_TYPES = Object.keys(SECTION_TEMPLATES);

export function getSectionTypeInfo(type) {
  const template = SECTION_TEMPLATES[type];
  if (!template) return null;
  return { type, label: template.label, description: template.description };
}

export function getAllSectionTypeInfos() {
  return Object.entries(SECTION_TEMPLATES).map(([type, template]) => ({
    type,
    label: template.label,
    description: template.description,
  }));
}
