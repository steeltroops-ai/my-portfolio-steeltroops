/**
 * AI Blog Generation API - Advanced Version
 * Uses Google Gemini API with chain-of-thought reasoning
 * 
 * POST /api/ai/generate-blog
 */

import { neon } from "@neondatabase/serverless";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Generate content using Gemini
async function generateWithGemini(prompt, config = {}) {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature || 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: config.maxTokens || 8192,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Chain of Thought: Research and outline phase
async function researchPhase(topic, style, audience) {
  const prompt = `You are an expert content researcher. Analyze this blog topic and create a comprehensive research brief.

TOPIC: "${topic}"
STYLE: ${style}
TARGET AUDIENCE: ${audience}

Provide your analysis in this exact format:

## KEY POINTS TO COVER
- [List 5-8 main points that must be covered]

## UNIQUE ANGLES
- [3-4 unique perspectives or angles to make this content stand out]

## QUESTIONS TO ANSWER
- [5-7 questions readers likely have about this topic]

## RECOMMENDED STRUCTURE
- [Outline with main sections and subsections]

## KEYWORDS AND PHRASES
- [10-15 relevant keywords for SEO]

## EXPERT INSIGHTS
- [2-3 expert-level insights or lesser-known facts]

Be thorough and specific. This research will guide the full article.`;

  return generateWithGemini(prompt, { temperature: 0.5, maxTokens: 2048 });
}

// Chain of Thought: Writing phase with research context
async function writingPhase(topic, research, config) {
  const lengthGuide = {
    short: { words: "600-900", sections: "3-4" },
    medium: { words: "1200-1800", sections: "5-6" },
    long: { words: "2500-4000", sections: "7-10" },
    comprehensive: { words: "4000-6000", sections: "10-15" },
  };

  const styleGuide = {
    technical: "Use precise technical language, include code examples where relevant, explain concepts thoroughly with examples",
    casual: "Write in a friendly, conversational tone. Use personal anecdotes and relatable examples",
    tutorial: "Step-by-step format with clear numbered instructions. Include prerequisites and expected outcomes",
    opinion: "Express strong, well-reasoned opinions. Use persuasive writing with evidence-based arguments",
    storytelling: "Use narrative techniques, start with a hook, build tension, and deliver insights through story",
    academic: "Formal tone, cite sources, use structured arguments with thesis statements and supporting evidence",
  };

  const length = lengthGuide[config.length] || lengthGuide.medium;
  const style = styleGuide[config.style] || styleGuide.technical;

  const prompt = `You are an expert blog writer creating a premium, publication-ready article.

TOPIC: "${topic}"
TARGET LENGTH: ${length.words} words (${length.sections} sections)
WRITING STYLE: ${style}
AUDIENCE: ${config.audience || "developers and tech enthusiasts"}

RESEARCH BRIEF:
${research}

FORMATTING REQUIREMENTS:
1. Start with a compelling headline (# Title)
2. Begin with a hook that grabs attention in the first paragraph
3. Use ## for main sections, ### for subsections
4. Include relevant code blocks with \`\`\`language syntax when applicable
5. Add bullet points and numbered lists for clarity
6. Include blockquotes for important callouts using >
7. Bold **key terms** and concepts
8. Add a TL;DR summary at the start if article is long
9. End with a clear conclusion and call-to-action
10. Include "Key Takeaways" section before conclusion

CONTENT REQUIREMENTS:
- Every claim should be supported with reasoning or examples
- Include practical, actionable advice
- Add real-world use cases or scenarios
- Anticipate and address reader questions
- Make complex topics accessible without oversimplifying

PROHIBITED:
- No fluff or filler content
- No generic statements without substance
- No clickbait or misleading information
- No placeholder text like "[insert here]"

Write the complete blog post now. Make it exceptional.`;

  return generateWithGemini(prompt, { 
    temperature: config.creativity || 0.7, 
    maxTokens: 8192 
  });
}

// Chain of Thought: Enhancement phase
async function enhancementPhase(content, config) {
  if (!config.enhance) return content;

  const prompt = `You are an expert editor. Enhance this blog post while preserving its structure and meaning.

CURRENT CONTENT:
${content}

ENHANCEMENT TASKS:
1. Improve the headline to be more compelling
2. Strengthen the opening hook
3. Add transition sentences between sections
4. Enhance code examples with comments if present
5. Add a few more specific examples or data points
6. Improve the conclusion to be more memorable
7. Ensure consistent tone throughout

Return the enhanced version in full. Maintain all markdown formatting.`;

  return generateWithGemini(prompt, { temperature: 0.5, maxTokens: 8192 });
}

// Utility functions
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function calculateReadTime(content) {
  const words = content.split(/\s+/).length;
  return Math.ceil(words / 200);
}

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled Post";
}

function extractExcerpt(content, maxLength = 160) {
  const clean = content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  
  return clean.length > maxLength 
    ? clean.substring(0, maxLength).trim() + "..." 
    : clean;
}

function extractHeadings(content) {
  const headings = [];
  const regex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }
  return headings;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Gemini API key not configured",
        hint: "Add GEMINI_API_KEY to environment variables"
      });
    }

    const { 
      topic, 
      style = "technical", 
      length = "medium", 
      audience = "developers",
      tags = [],
      enhance = true,
      creativity = 0.7,
      saveAsDraft = true,
      author = "Mayank"
    } = req.body;

    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({ error: "Topic is required (min 3 characters)" });
    }

    const config = { style, length, audience, enhance, creativity };
    const phases = [];

    // Phase 1: Research
    phases.push({ phase: "research", status: "in_progress" });
    const research = await researchPhase(topic, style, audience);
    phases[0].status = "complete";

    // Phase 2: Writing
    phases.push({ phase: "writing", status: "in_progress" });
    let content = await writingPhase(topic, research, config);
    phases[1].status = "complete";

    // Phase 3: Enhancement (optional)
    if (enhance) {
      phases.push({ phase: "enhancement", status: "in_progress" });
      content = await enhancementPhase(content, config);
      phases[2].status = "complete";
    }

    // Extract metadata
    const title = extractTitle(content);
    const excerpt = extractExcerpt(content);
    const slug = generateSlug(title);
    const readTime = calculateReadTime(content);
    const headings = extractHeadings(content);

    const blogPost = {
      title,
      slug,
      content,
      excerpt,
      tags: tags.length > 0 ? tags : extractDefaultTags(topic, style),
      read_time: readTime,
      published: !saveAsDraft,
      author,
      ai_generated: true,
      headings,
      word_count: content.split(/\s+/).length,
      created_at: new Date().toISOString(),
    };

    // Save to database if configured
    if (process.env.DATABASE_URL) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        
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
      } catch (dbError) {
        console.error("Database save error:", dbError);
        blogPost.saved = false;
        blogPost.saveError = dbError.message;
      }
    }

    return res.status(200).json({
      success: true,
      data: blogPost,
      phases,
      message: blogPost.saved 
        ? `Blog "${title}" saved as ${saveAsDraft ? "draft" : "published"}` 
        : "Blog generated successfully",
    });

  } catch (error) {
    console.error("AI generation error:", error);
    return res.status(500).json({
      error: "Failed to generate blog post",
      details: error.message,
    });
  }
}

// Extract default tags based on topic
function extractDefaultTags(topic, style) {
  const topicLower = topic.toLowerCase();
  const tags = [];
  
  const techKeywords = {
    "react": ["react", "frontend", "javascript"],
    "node": ["nodejs", "backend", "javascript"],
    "python": ["python", "programming"],
    "ai": ["artificial-intelligence", "machine-learning"],
    "ml": ["machine-learning", "ai"],
    "web": ["web-development", "frontend"],
    "api": ["api", "backend", "development"],
    "database": ["database", "backend"],
    "css": ["css", "frontend", "design"],
    "typescript": ["typescript", "javascript"],
  };

  for (const [keyword, relatedTags] of Object.entries(techKeywords)) {
    if (topicLower.includes(keyword)) {
      tags.push(...relatedTags);
    }
  }

  tags.push(style);
  
  return [...new Set(tags)].slice(0, 5);
}
