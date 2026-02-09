/**
 * AI Blog Generation API - "Mayank OS" Architecture
 * optimized for High-Insight, Systems-Thinking Content
 * Uses Cerebras Llama 3.3 70B for chain-of-thought generation
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

// --- MAYANK OS: CORE IDENTITY & INSTRUCTIONS ---

const SYSTEM_IDENTITY = `
You are a Senior Systems Engineer writing a professional long-form article.
Your pseudonym is "May OS".

VOICE:
- Clear, Structured, Analytical.
- Calm and confident.
- Technically grounded.

TONE:
- Professional but human.
- No slang (e.g., no "cracked", no "cooked").
- No hype.
- No motivational language.
- No excessive informality.

AUDIENCE:
- Engineers, Technical Founders, Researchers, Deep-tech professionals.

GOAL:
- Deliver insight with clarity and depth.
- Educate without sounding like a tutorial.
- Position the author as a serious systems thinker.
- Assume the reader is intelligent.

WHAT YOU AVOID (STRICTLY FORBIDDEN):
- Pattern-interrupt gimmicks.
- "Most people think..." (unless part of a deeper analysis).
- Rhetorical aggression.
- Exaggerated confidence.
- Hype (exclamation marks are banned unless visually necessary for code).
`;

const STRUCTURAL_RULES = `
Force this structure for every blog post:

1. THE TITLE:
   - 6-12 words.
   - Clear, specific, not cryptic (e.g., "Designing Reliable Autonomous Systems Under Latency Constraints").
   - No clever internet energy. Just clean intelligence.

2. THE DESCRIPTION (Subtitle):
   - 2-3 lines.
   - Explain the problem, why it matters, and the perspective being offered.

3. THE CONTENT PLAN:
   - **Introduction**: 3-5 paragraphs. Introduce problem, explain misunderstanding, establish thesis. No gimmicks.
   - **Core Sections**: Clean H2 headers. Logical flow. 3-6 paragraphs each.
   - **Technical Depth**: Include code blocks or architectural reasoning where needed.
   - **Broader Implications**: Zoom out calmly. Connect to physical/system limits.
   - **Conclusion**: Strong, composed ending. Restate thesis or offer forward-looking thought. NO SIGN-OFFS.
`;

const LENGTH_CONFIG = {
  short: {
    words: "800-1000",
    instruction: "Concise analysis of a single constraint.",
  },
  medium: {
    words: "1500-2000",
    instruction: "Deep dive into a specific system layer.",
  },
  long: {
    words: "2500+",
    instruction: "Comprehensive architectural choices and trade-offs.",
  },
  comprehensive: {
    words: "4000+",
    instruction: "Exhaustive systems analysis with edge cases.",
  },
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
    style = "professional",
    length = "medium",
    tags = [],
    saveAsDraft = true,
  } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  // CHECK USER INTENT
  const includeCode = tags.includes("code");
  const isTechnical =
    style === "technical" ||
    style === "professional" ||
    tags.includes("technical");
  const isCasual = style === "casual" || style === "storytelling";

  // DYNAMIC IDENTITY SELECTION
  let selectedIdentity = SYSTEM_IDENTITY; // Default to Professional Systems Engineer

  if (isCasual) {
    selectedIdentity = `
You are a Thoughtful Tech Writer and Storyteller.
Your pseudonym is "May".

VOICE:
- Engaging, Narrative, Relatable.
- Clear and accessible but not dumbed down.
- Human-centric.

TONE:
- Conversational but insightful.
- No corporate fluff.
- No hype.

GOAL:
- Explore ideas through stories and clear reasoning.
- Connect the topic to human experience.
- Assume the reader is curious but maybe not an expert.

WHAT YOU AVOID:
- Dense jargon without explanation.
- Robotic structure.
- Aggressive arguments.
    `;
  }

  const client = new Cerebras({ apiKey });
  const sql = neon(process.env.DATABASE_URL);

  const startTime = Date.now();
  let fullContent = "";

  try {
    // --- STAGE 1: THE MASTER PLAN (Architecting) ---
    console.log(
      `[May OS] Stage 1: Architecting Plan for "${topic}" (Style: ${style}, Code: ${includeCode})`
    );

    const outlinePrompt = `
      ${selectedIdentity}
      ${STRUCTURAL_RULES}
      
      TASK: Create a DETAILED CONTENT PLAN for a blog post about: "${topic}".
      Target Length: ${LENGTH_CONFIG[length] ? LENGTH_CONFIG[length].words : "1500 words"}.
      Style: ${style}.
      
      USER CONSTRAINTS:
      - Include Code Examples: ${includeCode ? "YES (Required)" : "NO (Strictly Forbidden)"}.
      - Target Audience: ${isTechnical ? "Engineers/Founders" : "General/Curious Readers"}.
      
      You must plan every section's content strategy before writing.
      Ensure the flow is LOGICAL and BUILD UPON itself.
      
      Return ONLY a JSON object with this shape:
      {
        "title": "Clear, specific 6-12 word title",
        "description": "Professional 2-3 line abstract/subtitle",
        "sections": [
          { 
            "heading": "Section Heading (Clear & Descriptive)", 
            "content_strategy": "What specific argument or concept goes here?",
            "needs_code": ${includeCode ? "true (only if relevant)" : "false"},
            "formatting_guide": "Likely H2. Use bullet points only if clarity demands it.",
            "tone_direction": "${isCasual ? "Engaging, narrative, smooth" : "Professional, analytical, grounded"}"
          }
        ]
      }
    `;

    const outlineResponse = await client.chat.completions.create({
      model: "llama-3.3-70b",
      messages: [{ role: "system", content: outlinePrompt }],
      response_format: { type: "json_object" },
      temperature: 0.75, // Lower variance for professional structure
    });

    const outline = JSON.parse(outlineResponse.choices[0].message.content);
    console.log(`[May OS] Blueprint created: "${outline.title}"`);
    console.log(`[May OS] Planned sections: ${outline.sections.length}`);

    // --- STAGE 2: THE BUILDER (Execution) ---
    console.log(`[May OS] Stage 2: Drafting content...`);

    fullContent += `# ${outline.title}\n\n`;

    // Context window strategy: Keep the plan visible
    const masterPlanContext = `
      Title: ${outline.title}
      Subtitle: ${outline.description}
      Structure: ${JSON.stringify(outline.sections.map((s, i) => `${i + 1}. ${s.heading}`))}`;

    for (const [index, section] of outline.sections.entries()) {
      console.log(
        `[May OS] Drafting section ${index + 1}/${outline.sections.length}: ${section.heading}`
      );

      const sectionPrompt = `
        ${selectedIdentity}
        
        MASTER PLAN:
        ${masterPlanContext}
        
        CURRENT STATUS:
        Drafting Section ${index + 1} of ${outline.sections.length}.
        
        CURRENT MISSION:
        Write the content for the section: "${section.heading}".
        
        STRATEGY FOR THIS SECTION:
        - Goal: ${section.content_strategy}
        - Needs Code: ${section.needs_code}
        - Formatting: ${section.formatting_guide}
        
        CRITICAL WRITING RULES:
        - Logical flow between paragraphs.
        - Clear thesis/argument.
        - Smooth transitions (avoid academic fluff like "Moreover").
        - Consistent capitalization and professional formatting.
        - No slang. No rhetorical aggression.
        - Output Markdown. Start with "## ${section.heading}".
      `;

      const sectionResponse = await client.chat.completions.create({
        model: "llama-3.3-70b",
        messages: [{ role: "user", content: sectionPrompt }],
        temperature: 0.6, // Low variance for high polish
        max_completion_tokens: 3000,
      });

      const sectionContent = sectionResponse.choices[0].message.content;
      fullContent += sectionContent + "\n\n";
    }

    // --- STAGE 3: THE "HUMAN DNA" POLISH (Optional/Fast Pass) ---
    // If we want to ensure specific "Mayank OS" quirks (like removing "Moreover"), we could do a pass.
    // However, prompts in Stage 2 should cover it. Let's do a quick metadata pass.

    // --- STAGE 4: METADATA & SAVING ---
    console.log(`[May OS] Stage 3: Finalizing metadata...`);

    let finalTags = tags;
    if (!tags || tags.length === 0) {
      const tagResponse = await client.chat.completions.create({
        model: "llama-3.3-70b",
        messages: [
          {
            role: "user",
            content: `Generate 3-5 Medium-style one-word tags for a post titled "${outline.title}". 
            Examples: "Robotics", "Engineering", "Architecture", "Systems", "Design".
            Return ONLY a comma-separated list of single words. No spaces in tags.`,
          },
        ],
      });
      finalTags = tagResponse.choices[0].message.content
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .slice(0, 5);
    }

    const slug =
      outline.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    const readTime = Math.ceil(fullContent.split(/\s+/).length / 200);
    const generationTime = Date.now() - startTime;

    console.log(`[May OS] Complete in ${generationTime}ms. Saving...`);

    const result = await sql`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, tags, read_time, published, author, created_at, updated_at, meta_description
      )
      VALUES (
        ${outline.title},
        ${slug},
        ${fullContent},
        ${outline.description},
        ${finalTags},
        ${readTime},
        ${!saveAsDraft},
        'Mayank',
        NOW(),
        NOW(),
        ${outline.description}
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
        excerpt: outline.description,
        tags: finalTags,
        read_time: readTime,
        saved: true,
        published: !saveAsDraft,
      },
      meta: {
        generation_time_ms: generationTime,
        steps: outline.sections.length,
        philosophy: "Mayank OS Systems Architecture",
      },
    });
  } catch (error) {
    console.error(`[Mayank OS] Critical Failure:`, error);
    return res.status(500).json({
      error: "Generation Failed",
      details: error.message,
    });
  }
}
