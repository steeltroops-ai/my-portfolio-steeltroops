/**
 * AI Blog Generation API - Cerebras Llama 3.3 70B
 * POST /api/ai/generate-blog
 * 
 * Features:
 * - Ultra-fast inference with Cerebras
 * - Multiple writing styles
 * - Configurable length
 * - Auto-save to Neon database
 * - Proper markdown formatting
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

// Length configurations
const LENGTH_CONFIG = {
  short: { words: "600-900", maxTokens: 2048 },
  medium: { words: "1200-1800", maxTokens: 4096 },
  long: { words: "2500-4000", maxTokens: 6144 },
  comprehensive: { words: "4000-6000", maxTokens: 8192 },
};

// Style configurations with detailed prompts
const STYLE_CONFIG = {
  technical: {
    description: "Technical and detailed with code examples",
    tone: "Professional, precise, and informative. Use technical terminology appropriately.",
    includes: "Code examples, technical diagrams descriptions, best practices",
  },
  casual: {
    description: "Friendly and conversational",
    tone: "Warm, approachable, and engaging. Use personal anecdotes and humor.",
    includes: "Relatable examples, conversational phrases, personal insights",
  },
  tutorial: {
    description: "Step-by-step instructional format",
    tone: "Clear, patient, and encouraging. Guide the reader through each step.",
    includes: "Numbered steps, prerequisites, expected outcomes, common pitfalls",
  },
  opinion: {
    description: "Opinion piece with strong arguments",
    tone: "Persuasive, confident, and thought-provoking. Back opinions with evidence.",
    includes: "Strong thesis, supporting arguments, counterarguments addressed",
  },
  storytelling: {
    description: "Narrative style with engaging story elements",
    tone: "Engaging, dramatic, and immersive. Use narrative techniques.",
    includes: "Story arc, characters, tension and resolution, lessons learned",
  },
};

// Audience configurations
const AUDIENCE_CONFIG = {
  beginners: "New to the topic. Explain concepts simply, avoid jargon, provide context.",
  developers: "Technical professionals. Assume programming knowledge, include code.",
  general: "General audience. Balance accessibility with depth.",
  experts: "Advanced practitioners. Focus on nuances, advanced techniques, cutting-edge.",
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!CEREBRAS_API_KEY) {
    return res.status(500).json({ 
      error: "Cerebras API key not configured",
      hint: "Add CEREBRAS_API_KEY to environment variables"
    });
  }

  try {
    const { 
      topic, 
      style = "technical", 
      length = "medium", 
      audience = "developers",
      tags = [],
      saveAsDraft = true,
      author = "Mayank",
      includeCodeExamples = true,
      includeTOC = false,
    } = req.body || {};

    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({ error: "Topic is required (min 3 characters)" });
    }

    const lengthConfig = LENGTH_CONFIG[length] || LENGTH_CONFIG.medium;
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.technical;
    const audienceDesc = AUDIENCE_CONFIG[audience] || AUDIENCE_CONFIG.developers;

    console.log(`[AI] Generating: "${topic}" | Style: ${style} | Length: ${length}`);

    // Build comprehensive system prompt
    const systemPrompt = `You are an expert blog writer with deep knowledge across technology, programming, and software development.

Your writing style for this piece:
- ${styleConfig.description}
- Tone: ${styleConfig.tone}  
- Include: ${styleConfig.includes}

Target audience: ${audienceDesc}

You MUST format your response in proper Markdown with:
- A single # heading for the title
- ## headings for main sections
- ### headings for subsections
- **Bold** for key terms
- \`inline code\` for technical terms
- Triple backtick code blocks with language specified
- Bullet points and numbered lists where appropriate
- > Blockquotes for important callouts

Write comprehensive, valuable content that readers will want to share.`;

    // Build user prompt
    let userPrompt = `Write a ${lengthConfig.words} word blog post about: "${topic}"

Structure your post as follows:
1. # Title - Compelling, specific, SEO-friendly
2. Introduction - Hook the reader immediately
3. Main Content - 3-5 well-organized sections with ## headers
4. ${includeCodeExamples ? "Include practical code examples with explanations" : "Focus on concepts and explanations"}
5. Key Takeaways - Bullet list of main points
6. Conclusion - Summarize and include a call-to-action

${includeTOC ? "Include a Table of Contents after the introduction." : ""}

Keywords to naturally incorporate: ${tags.length > 0 ? tags.join(", ") : topic}

Begin writing the blog post now:`;

    // Initialize Cerebras
    const cerebras = new Cerebras({ apiKey: CEREBRAS_API_KEY });

    const startTime = Date.now();

    // Generate content
    const completion = await cerebras.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b",
      max_completion_tokens: lengthConfig.maxTokens,
      temperature: 0.7,
      top_p: 0.95,
    });

    const generationTime = Date.now() - startTime;
    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ 
        error: "No content generated",
        details: "AI returned empty response"
      });
    }

    console.log(`[AI] Generated ${content.length} chars in ${generationTime}ms`);

    // Extract and process metadata
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch 
      ? titleMatch[1].replace(/\*\*/g, "").trim() 
      : `Blog: ${topic}`;
    
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .substring(0, 100);

    // Extract excerpt from first paragraph after title
    const paragraphs = content.split(/\n\n+/);
    let excerpt = "";
    for (const p of paragraphs) {
      if (!p.startsWith("#") && !p.startsWith("```") && p.trim().length > 50) {
        excerpt = p.replace(/[*_`#]/g, "").trim().substring(0, 160);
        break;
      }
    }
    if (!excerpt) {
      excerpt = content.replace(/[#*_`]/g, " ").trim().substring(0, 160);
    }
    excerpt += "...";

    // Extract headings for TOC
    const headings = [];
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].replace(/\*\*/g, "").trim(),
      });
    }

    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    const blogPost = {
      title,
      slug,
      content,
      excerpt,
      tags: tags.length > 0 ? tags : [style, "ai-generated"],
      read_time: readTime,
      word_count: wordCount,
      headings,
      published: !saveAsDraft,
      author,
      ai_model: "llama-3.3-70b",
      generation_time_ms: generationTime,
      created_at: new Date().toISOString(),
      saved: false,
    };

    // Save to database
    if (DATABASE_URL) {
      try {
        const sql = neon(DATABASE_URL);
        
        const result = await sql`
          INSERT INTO blog_posts (
            title, slug, content, excerpt, tags, read_time, 
            published, author, created_at, updated_at
          )
          VALUES (
            ${blogPost.title},
            ${blogPost.slug},
            ${blogPost.content},
            ${blogPost.excerpt},
            ${blogPost.tags},
            ${blogPost.read_time},
            ${blogPost.published},
            ${blogPost.author},
            NOW(),
            NOW()
          )
          RETURNING id, slug
        `;

        blogPost.id = result[0]?.id;
        blogPost.saved = true;
        console.log(`[AI] Saved to DB with id: ${blogPost.id}`);
      } catch (dbError) {
        console.error("[AI] DB Error:", dbError.message);
        blogPost.saved = false;
        blogPost.saveError = dbError.message;
      }
    }

    return res.status(200).json({
      success: true,
      data: blogPost,
      meta: {
        model: "llama-3.3-70b",
        provider: "cerebras",
        generation_time_ms: generationTime,
        word_count: wordCount,
        read_time: readTime,
      },
      message: blogPost.saved 
        ? `"${title}" saved as ${saveAsDraft ? "draft" : "published"}` 
        : "Generated successfully",
    });

  } catch (error) {
    console.error("[AI] Error:", error);
    return res.status(500).json({
      error: "Failed to generate blog post",
      details: error.message,
    });
  }
}
