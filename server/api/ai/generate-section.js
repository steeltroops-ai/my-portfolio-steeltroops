/**
 * AI Blog Generation - Step 2: Generate Section
 *
 * Generates content for a single section of the blog post.
 * Called iteratively by the frontend for each section.
 * Allows for real-time progress tracking and autosave.
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { setCorsHeaders, verifyAuth } from "../utils.js";

const STYLE_PROMPTS = {
  technical:
    "Write in a precise, technical manner. Include code blocks where relevant. Focus on best practices and architecture.",
  casual:
    "Write in a friendly, conversational tone. Use analogies and keep it engaging.",
  tutorial:
    "Write as a step-by-step guide. Use clear instructions and numbered lists.",
  opinion: "Write a persuasive piece with strong arguments and a clear stance.",
  storytelling:
    "Frame the technical concepts within a narrative or case study.",
};

export default async function handler(req, res) {
  // CORS
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sql = neon(process.env.DATABASE_URL);

  // Authenticate Admin
  const session = await verifyAuth(req, sql);
  if (!session || session.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized access detected" });
  }

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server Configuration Error",
      details: "Missing CEREBRAS_API_KEY",
    });
  }

  const {
    title,
    topic,
    style = "technical",
    section, // { id, heading, key_points, estimated_words }
    previous_content, // Content of previous sections for context
    section_index, // Current section index (0-based)
    total_sections, // Total number of sections
  } = req.body;

  if (!section || !section.heading) {
    return res.status(400).json({ error: "Section is required" });
  }

  const client = new Cerebras({ apiKey });
  const startTime = Date.now();

  try {
    const isIntro = section_index === 0;
    const isConclusion = section_index === total_sections - 1;

    console.log(
      `[AI:Section] Generating section ${section_index + 1}/${total_sections}: "${section.heading}"`
    );

    // Build context from previous content
    let contextInfo = `Blog Title: ${title || topic}
Topic: ${topic}
Writing Style: ${STYLE_PROMPTS[style] || STYLE_PROMPTS.technical}
Current Section: ${section_index + 1} of ${total_sections}`;

    if (previous_content && previous_content.length > 0) {
      // Include a summary of previous content for coherence
      const truncatedPrevious = previous_content.slice(-2000); // Last 2000 chars for context
      contextInfo += `\n\nPrevious content (for context):\n${truncatedPrevious}`;
    }

    const sectionPrompt = isIntro
      ? `Write an engaging introduction section that hooks the reader and previews what they'll learn.`
      : isConclusion
        ? `Write a strong conclusion that summarizes key takeaways and includes a call to action.`
        : `Write comprehensive content covering all the key points thoroughly.`;

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are writing section ${section_index + 1} of a ${total_sections}-part blog post.

${contextInfo}

Section Details:
- Heading: ${section.heading}
- Key Points to Cover: ${(section.key_points || []).join(", ")}
- Target Words: ${section.estimated_words || 300}

Instructions:
1. Start with "## ${section.heading}" as the header
2. ${sectionPrompt}
3. Use Markdown formatting (bold, lists, code blocks where relevant)
4. Maintain consistency with previous sections
5. Do NOT include the blog title, only this section's content`,
        },
        { role: "user", content: "Write this section now." },
      ],
      temperature: 0.7,
      max_completion_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const wordCount = content.split(/\s+/).length;
    const generationTime = Date.now() - startTime;

    console.log(
      `[AI:Section] Generated "${section.heading}" in ${generationTime}ms (${wordCount} words)`
    );

    return res.status(200).json({
      success: true,
      data: {
        section_id: section.id,
        heading: section.heading,
        content,
        word_count: wordCount,
        section_index,
      },
      meta: {
        generation_time_ms: generationTime,
        model: "llama-3.3-70b",
        step: "section",
      },
    });
  } catch (error) {
    console.error("[AI:Section] Error:", error);
    return res.status(500).json({
      error: "Section Generation Failed",
      details: error.message,
      section_id: section.id,
    });
  }
}
