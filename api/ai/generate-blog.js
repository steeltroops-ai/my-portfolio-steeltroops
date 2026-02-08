/**
 * AI Blog Generation API - Multi-Stage Generation
 * Uses Cerebras Llama 3.3 70B for ultra-fast chain-of-thought generation
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

// Length in words (approx)
const LENGTH_CONFIG = {
  short: { words: "600-800", tokens: 1000 },
  medium: { words: "1200-1500", tokens: 2000 },
  long: { words: "2000-3000", tokens: 4000 },
  comprehensive: { words: "4000+", tokens: 6000 },
};

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Server Configuration Error: Missing API Key" });
  }

  const {
    topic,
    style = "technical",
    length = "medium",
    tags = [],
    saveAsDraft = true,
  } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  const client = new Cerebras({ apiKey });
  const sql = neon(process.env.DATABASE_URL);

  const startTime = Date.now();
  let fullContent = "";

  try {
    // --- STEP 1: GENERATE OUTLINE (JSON) ---
    console.log(`[AI] Step 1: Generating outline for "${topic}"`);
    const outlineResponse = await client.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are an expert technical writer. Create a blog post outline in JSON format.
                    Topic: ${topic}
                    Style: ${style}
                    Target Length: ${length}
                    
                    Return ONLY a JSON object with this shape:
                    {
                      "title": "Catchy SEO Title",
                      "sections": [
                        { "heading": "Introduction", "key_points": ["hook", "thesis"] },
                        { "heading": "Main Point 1", "key_points": ["details", "examples"] },
                        ...
                        { "heading": "Conclusion", "key_points": ["summary", "cta"] }
                      ]
                    }`,
        },
        { role: "user", content: "Generate the outline." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_completion_tokens: 1024,
    });

    const outline = JSON.parse(outlineResponse.choices[0].message.content);
    console.log(
      `[AI] Outline generated with ${outline.sections.length} sections.`
    );

    // --- STEP 2: GENERATE SECTIONS (Iterative) ---
    console.log(`[AI] Step 2: Generating sections...`);

    // Generate Introduction
    fullContent += `# ${outline.title}\n\n`;

    // We will generate sections iteratively to maintain context
    let currentContext = `Title: ${outline.title}\nDescription: ${topic}\nStyle: ${STYLE_PROMPTS[style]}\n\nOutline:\n${JSON.stringify(outline.sections)}`;

    // Limit concurrency to avoid complexity, Cerebras is fast enough for serial
    for (const section of outline.sections) {
      console.log(`[AI] Generating section: ${section.heading}`);
      const sectionResponse = await client.chat.completions.create({
        model: "llama-3.3-70b",
        messages: [
          {
            role: "system",
            content: `You are writing a section for a blog post.
                          Context: ${currentContext}
                          
                          Write the content for the section: "${section.heading}".
                          Include the heading as "## ${section.heading}".
                          Cover these points: ${section.key_points.join(", ")}.
                          Write in Markdown. Do not include the title of the blog post, only the section content.`,
          },
          { role: "user", content: "Write this section." },
        ],
        temperature: 0.7,
        max_completion_tokens: 2000,
      });

      const sectionContent = sectionResponse.choices[0].message.content;
      fullContent += sectionContent + "\n\n";

      // Update context slightly (optional, but good for coherence)
      currentContext += `\n\nCompleted Section: ${section.heading}`;
    }

    // --- STEP 3: METADATA & TAGS ---
    console.log(`[AI] Step 3: Generating metadata...`);
    // Already have title, let's generate tags if missing
    let finalTags = tags;
    if (!tags || tags.length === 0) {
      const tagResponse = await client.chat.completions.create({
        model: "llama-3.3-70b",
        messages: [
          {
            role: "user",
            content: `Generate 5 SEO tags for a blog post about "${topic}". Return only a comma-separated list.`,
          },
        ],
        max_completion_tokens: 100,
      });
      finalTags = tagResponse.choices[0].message.content
        .split(",")
        .map((t) => t.trim());
    }

    const slug = outline.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const readTime = Math.ceil(fullContent.split(/\s+/).length / 200);

    // --- STEP 4: SAVE TO DB ---
    const generationTime = Date.now() - startTime;
    console.log(`[AI] Finished in ${generationTime}ms. Saving to DB...`);

    const result = await sql`
      INSERT INTO posts (
        title, slug, content, excerpt, tags, read_time, published, author, created_at, updated_at
      )
      VALUES (
        ${outline.title},
        ${slug},
        ${fullContent},
        ${fullContent.substring(0, 150) + "..."},
        ${finalTags},
        ${readTime},
        ${!saveAsDraft},
        'Admin',
        NOW(),
        NOW()
      )
      RETURNING id, slug, title
    `;

    return res.status(200).json({
      success: true,
      data: {
        id: result[0].id,
        title: result[0].title,
        slug: result[0].slug,
        content: fullContent,
        tags: finalTags,
        read_time: readTime,
        saved: true,
        published: !saveAsDraft,
      },
      meta: {
        generation_time_ms: generationTime,
        steps: outline.sections.length,
      },
    });
  } catch (error) {
    console.error(`[AI] Error during generation:`, error);
    return res.status(500).json({
      error: "Generation Failed",
      details: error.message,
    });
  }
}
