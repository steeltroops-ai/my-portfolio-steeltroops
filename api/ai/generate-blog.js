/**
 * AI Blog Generation API
 * Uses Google Gemini API to generate blog posts
 * 
 * POST /api/ai/generate-blog
 * Body: { topic, style, length, tags }
 */

import { neon } from "@neondatabase/serverless";

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// Generate blog content using Gemini
async function generateWithGemini(prompt) {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
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

// Create blog prompt based on parameters
function createBlogPrompt({ topic, style = "technical", length = "medium", tags = [] }) {
  const lengthGuide = {
    short: "around 500-800 words",
    medium: "around 1000-1500 words",
    long: "around 2000-3000 words",
  };

  const styleGuide = {
    technical: "technical and informative, with code examples where relevant",
    casual: "conversational and engaging, easy to read",
    tutorial: "step-by-step tutorial format with clear instructions",
    opinion: "thought-provoking opinion piece with personal insights",
  };

  return `Write a blog post about: "${topic}"

Style: ${styleGuide[style] || styleGuide.technical}
Length: ${lengthGuide[length] || lengthGuide.medium}
${tags.length > 0 ? `Related topics to cover: ${tags.join(", ")}` : ""}

Requirements:
1. Use markdown formatting
2. Include a compelling introduction
3. Use headers (##, ###) to organize content
4. Include code blocks with syntax highlighting if relevant
5. Add a conclusion with key takeaways
6. Make it engaging and informative

Write the blog post now:`;
}

// Generate slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Calculate read time
function calculateReadTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

// Extract title from generated content
function extractTitle(content) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1];
  
  const firstLine = content.split("\n")[0];
  return firstLine.replace(/^#+\s*/, "").trim() || "Untitled Post";
}

// Extract excerpt from content
function extractExcerpt(content, maxLength = 160) {
  // Remove markdown headers and get first paragraph
  const cleanContent = content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/\n+/g, " ")
    .trim();
  
  if (cleanContent.length <= maxLength) return cleanContent;
  return cleanContent.substring(0, maxLength).trim() + "...";
}

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

  try {
    // Check for API key
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "Gemini API key not configured",
        hint: "Add GEMINI_API_KEY to your environment variables"
      });
    }

    const { topic, style, length, tags, saveAsDraft = true } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }

    // Generate blog content
    const prompt = createBlogPrompt({ topic, style, length, tags });
    const generatedContent = await generateWithGemini(prompt);

    if (!generatedContent) {
      return res.status(500).json({ error: "Failed to generate content" });
    }

    // Extract metadata
    const title = extractTitle(generatedContent);
    const excerpt = extractExcerpt(generatedContent);
    const slug = generateSlug(title);
    const readTime = calculateReadTime(generatedContent);

    // Prepare blog post data
    const blogPost = {
      title,
      slug,
      content: generatedContent,
      excerpt,
      tags: tags || [],
      read_time: readTime,
      published: !saveAsDraft,
      ai_generated: true,
      created_at: new Date().toISOString(),
    };

    // Optionally save to database
    if (process.env.DATABASE_URL && saveAsDraft !== false) {
      try {
        const sql = neon(process.env.DATABASE_URL);
        
        const result = await sql`
          INSERT INTO blog_posts (title, slug, content, excerpt, tags, read_time, published, created_at, updated_at)
          VALUES (
            ${blogPost.title},
            ${blogPost.slug},
            ${blogPost.content},
            ${blogPost.excerpt},
            ${blogPost.tags},
            ${blogPost.read_time},
            ${blogPost.published},
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
        blogPost.saveError = "Failed to save to database";
      }
    }

    return res.status(200).json({
      success: true,
      data: blogPost,
      message: blogPost.saved 
        ? `Blog post "${title}" saved as ${saveAsDraft ? "draft" : "published"}` 
        : "Blog post generated (not saved)",
    });

  } catch (error) {
    console.error("AI generation error:", error);
    return res.status(500).json({
      error: "Failed to generate blog post",
      details: error.message,
    });
  }
}
