/**
 * AI Blog Generation - Step 3: Enrich
 *
 * Generates SEO metadata, excerpt, and cover image suggestions.
 * Final step in the client-orchestrated pipeline.
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { setCorsHeaders, verifyAuth } from "../utils.js";

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

  const { title, content, tags = [] } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const client = new Cerebras({ apiKey });
  const startTime = Date.now();

  try {
    console.log(`[AI:Enrich] Generating metadata for "${title}"`);

    // Calculate basic stats
    const wordCount = content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    // Generate SEO data and suggestions
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are an SEO expert. Analyze this blog post and generate optimized metadata.

Blog Title: ${title}
Word Count: ${wordCount}
Current Tags: ${tags.join(", ") || "none"}

Content Preview (first 2000 chars):
${content.substring(0, 2000)}

Return ONLY a valid JSON object with this exact structure:
{
  "meta_title": "SEO-optimized title (max 60 chars)",
  "meta_description": "Compelling meta description (max 155 chars)",
  "excerpt": "2-3 sentence excerpt for cards/previews (max 300 chars)",
  "optimized_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "cover_image_queries": ["search query 1", "search query 2", "search query 3"],
  "seo_score": 85,
  "suggestions": ["suggestion 1 to improve", "suggestion 2"]
}

The cover_image_queries should be descriptive photo search terms for Unsplash.`,
        },
        { role: "user", content: "Generate the SEO metadata now." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_completion_tokens: 1024,
    });

    const metadata = JSON.parse(response.choices[0].message.content);
    const generationTime = Date.now() - startTime;

    console.log(`[AI:Enrich] Generated metadata in ${generationTime}ms`);

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    return res.status(200).json({
      success: true,
      data: {
        meta_title: metadata.meta_title || title.substring(0, 60),
        meta_description:
          metadata.meta_description || content.substring(0, 155),
        excerpt: metadata.excerpt || content.substring(0, 300),
        tags: metadata.optimized_tags || tags,
        slug,
        read_time: readTime,
        word_count: wordCount,
        cover_image_queries: metadata.cover_image_queries || [],
        seo_score: metadata.seo_score || 0,
        suggestions: metadata.suggestions || [],
      },
      meta: {
        generation_time_ms: generationTime,
        model: "llama-3.3-70b",
        step: "enrich",
      },
    });
  } catch (error) {
    console.error("[AI:Enrich] Error:", error);

    // Return basic metadata on error (graceful degradation)
    const wordCount = content.split(/\s+/).length;
    return res.status(200).json({
      success: true,
      data: {
        meta_title: title.substring(0, 60),
        meta_description: content.substring(0, 155).replace(/\n/g, " ") + "...",
        excerpt: content.substring(0, 300).replace(/\n/g, " ") + "...",
        tags: tags.length > 0 ? tags : ["blog"],
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
        read_time: Math.ceil(wordCount / 200),
        word_count: wordCount,
        cover_image_queries: [],
        seo_score: 50,
        suggestions: ["AI enrichment failed - using fallback metadata"],
      },
      meta: {
        fallback: true,
        error: error.message,
      },
    });
  }
}
