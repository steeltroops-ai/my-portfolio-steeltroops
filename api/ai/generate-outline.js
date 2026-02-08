/**
 * AI Blog Generation - Step 1: Generate Outline
 *
 * Generates a structured outline for the blog post.
 * This is the first step in the client-orchestrated pipeline.
 */

import Cerebras from "@cerebras/cerebras_cloud_sdk";

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
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "Server Configuration Error",
      details: "Missing CEREBRAS_API_KEY",
    });
  }

  const { topic, style = "technical", length = "medium" } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  const client = new Cerebras({ apiKey });
  const startTime = Date.now();

  try {
    console.log(`[AI:Outline] Generating outline for "${topic}"`);

    const outlineResponse = await client.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [
        {
          role: "system",
          content: `You are an expert technical writer creating a blog post outline.

Topic: ${topic}
Style: ${STYLE_PROMPTS[style] || STYLE_PROMPTS.technical}
Target Length: ${length}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Catchy SEO-Optimized Title",
  "description": "2-3 sentence overview of the post",
  "sections": [
    {
      "id": 1,
      "heading": "Introduction",
      "key_points": ["hook", "thesis", "overview"],
      "estimated_words": 150
    },
    {
      "id": 2,
      "heading": "Section Title",
      "key_points": ["point1", "point2"],
      "estimated_words": 300
    }
  ],
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}

Include 4-7 sections depending on length. Make section headings specific and engaging.`,
        },
        { role: "user", content: "Generate the outline now." },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_completion_tokens: 1024,
    });

    const outline = JSON.parse(outlineResponse.choices[0].message.content);
    const generationTime = Date.now() - startTime;

    console.log(
      `[AI:Outline] Generated in ${generationTime}ms with ${outline.sections?.length || 0} sections`
    );

    return res.status(200).json({
      success: true,
      data: {
        title: outline.title,
        description: outline.description,
        sections: outline.sections,
        suggested_tags: outline.suggested_tags || [],
        total_sections: outline.sections?.length || 0,
      },
      meta: {
        generation_time_ms: generationTime,
        model: "llama-3.3-70b",
        step: "outline",
      },
    });
  } catch (error) {
    console.error("[AI:Outline] Error:", error);
    return res.status(500).json({
      error: "Outline Generation Failed",
      details: error.message,
    });
  }
}
