/**
 * AI Blog Generation API -- SSE Streaming Architecture
 *
 * Replaces the monolithic generate-blog.js with a streaming endpoint
 * that sends real-time progress events as each section is generated.
 *
 * Protocol: Server-Sent Events (SSE) over POST
 * Model: Cerebras Llama 3.3 70B
 *
 * Event types:
 *   generation_started  -> { totalSections, estimatedTime }
 *   outline_complete    -> { title, description, sections }
 *   section_started     -> { index, heading, type }
 *   section_chunk       -> { index, chunk }
 *   section_complete    -> { index, wordCount, heading }
 *   metadata_complete   -> { tags, excerpt, metaDescription, readTime, imageSearchQuery }
 *   generation_complete -> { postId, slug, totalWords, timeMs }
 *   error               -> { stage, index?, message, partialSaved }
 */

import { neon } from "@neondatabase/serverless";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { setCorsHeaders, verifyAuth } from "../utils.js";
import { emitToAdmins } from "../../services/realtime/broadcaster.js";

import { buildIdentity } from "./prompts/system-identities.js";
import {
  GLOBAL_RULES,
  CONTENT_GUARDRAILS,
  getDensityRules,
  buildContextWindow,
} from "./prompts/structural-rules.js";
import {
  buildOutlinePrompt,
  buildSectionPrompt,
  buildMetadataPrompt,
} from "./prompts/section-templates.js";

// =========================================================================
// LENGTH CONFIG
// =========================================================================

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
    words: "2500-3500",
    instruction: "Comprehensive architectural choices and trade-offs.",
  },
  comprehensive: {
    words: "4000+",
    instruction: "Exhaustive systems analysis with edge cases.",
  },
};

// =========================================================================
// SSE HELPERS
// =========================================================================

function sendSSE(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  // Flush for Vercel/Express streaming
  if (res.flush) res.flush();
}

function sendError(res, stage, message, index = null, partialSaved = false) {
  sendSSE(res, "error", { stage, index, message, partialSaved });
}

// =========================================================================
// MAIN HANDLER
// =========================================================================

export default async function handler(req, res) {
  // --- CORS ---
  setCorsHeaders(res, req);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // --- AUTH ---
  const sql = neon(process.env.DATABASE_URL);
  const session = await verifyAuth(req, sql);
  if (!session || session.role !== "admin") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // --- API KEY ---
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "Server Configuration Error: Missing CEREBRAS_API_KEY" });
  }

  // --- PARSE REQUEST ---
  const {
    topic,
    audience = "general",
    blueprint,
    globalTone = "professional",
    toneModifier,
    codeLanguage = "python",
    length = "medium",
    tags: userTags = [],
    generateMetaSeparately = true,
    saveAsDraft = true,
  } = req.body;

  if (!topic) return res.status(400).json({ error: "Topic is required" });

  // --- SETUP SSE ---
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Nginx unbuffering
  res.status(200);

  const client = new Cerebras({ apiKey });
  const startTime = Date.now();
  const completedSections = [];
  let fullContent = "";
  let outline = null;

  // Detect if user wants code
  const includeCode =
    userTags.includes("code") ||
    userTags.includes("technical") ||
    blueprint?.sections?.some(
      (s) =>
        s.type === "technical" ||
        s.type === "code_walkthrough" ||
        s.includeElements?.includes("code_block")
    );

  try {
    // STAGE 0: INITIALIZATION NOTIFY
    // =====================================================================
    emitToAdmins("AI:GENERATION_STARTED", {
      topic,
      timestamp: new Date().toISOString(),
    });

    // =====================================================================
    // STAGE 1: OUTLINE GENERATION
    // =====================================================================
    console.log(`[AI Stream] Stage 1: Generating outline for "${topic}"`);

    const identity = buildIdentity({
      tone: globalTone,
      modifier: toneModifier,
      audience,
    });

    const lengthConfig = LENGTH_CONFIG[length] || LENGTH_CONFIG.medium;

    const outlinePrompt = buildOutlinePrompt({
      topic,
      blueprintSections: blueprint?.sections,
      lengthConfig,
      includeCode,
      identity,
    });

    const totalSections =
      blueprint?.totalSections || blueprint?.sections?.length || null;

    sendSSE(res, "generation_started", {
      totalSections: totalSections || "auto",
      estimatedTime: totalSections ? (totalSections + 2) * 5 : 40,
    });

    const outlineResponse = await client.chat.completions.create({
      model: "llama3.1-8b",
      messages: [{ role: "system", content: outlinePrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    outline = JSON.parse(outlineResponse.choices[0].message.content);

    emitToAdmins("AI:STAGE_COMPLETE", {
      stage: "outline",
      topic: outline.title || topic,
      totalSections: outline.sections?.length || 0,
    });
    console.log(
      `[AI Stream] Outline: "${outline.title}" -- ${outline.sections.length} sections`
    );

    sendSSE(res, "outline_complete", {
      title: outline.title,
      description: outline.description,
      sections: outline.sections.map((s) => ({
        heading: s.heading,
        type: s.type || "prose",
        targetWords: s.targetWords,
        subsections: s.subsections || 0,
      })),
    });

    // =====================================================================
    // STAGE 2: SECTION-BY-SECTION GENERATION
    // =====================================================================
    console.log(
      `[AI Stream] Stage 2: Generating ${outline.sections.length} sections`
    );

    fullContent += `# ${outline.title}\n\n`;

    for (const [index, section] of outline.sections.entries()) {
      try {
        // Merge blueprint overrides if they exist
        const blueprintSection = blueprint?.sections?.[index];
        const mergedSection = {
          ...section,
          ...(blueprintSection && {
            tone: blueprintSection.tone || globalTone,
            targetWords:
              blueprintSection.targetWords || section.targetWords || 400,
            type: blueprintSection.type || section.type || "prose",
            subsections:
              blueprintSection.subsections ?? section.subsections ?? 0,
            includeElements:
              blueprintSection.includeElements || section.includeElements || [],
          }),
        };

        // Default targetWords if still missing
        if (!mergedSection.targetWords) {
          mergedSection.targetWords = 400;
        }

        console.log(
          `[AI Stream] Section ${index + 1}/${outline.sections.length}: "${mergedSection.heading}" (${mergedSection.type}, ~${mergedSection.targetWords}w)`
        );

        sendSSE(res, "section_started", {
          index,
          heading: mergedSection.heading,
          type: mergedSection.type || "prose",
        });

        // Build per-section identity (allows per-section tone override)
        const sectionIdentity = buildIdentity({
          tone: mergedSection.tone || globalTone,
          modifier: toneModifier,
          audience,
        });

        // Build context window
        const context = buildContextWindow({
          outline,
          previousSections: completedSections,
          currentIndex: index,
        });

        // Build density rules
        const densityRules = getDensityRules(mergedSection.targetWords);

        // Build the full section prompt
        const sectionPrompt = buildSectionPrompt({
          section: mergedSection,
          identity: sectionIdentity,
          context,
          densityRules: `${densityRules}\n\n${GLOBAL_RULES}\n\n${CONTENT_GUARDRAILS}`,
          opts: { codeLanguage },
        });

        // Generate with streaming
        const sectionStream = await client.chat.completions.create({
          model: "llama3.1-8b",
          messages: [{ role: "user", content: sectionPrompt }],
          temperature: 0.55,
          max_completion_tokens: Math.min(
            4000,
            Math.max(1500, mergedSection.targetWords * 3)
          ),
          stream: true,
        });

        let sectionContent = "";

        for await (const chunk of sectionStream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            sectionContent += delta;
            sendSSE(res, "section_chunk", { index, chunk: delta });
          }
        }

        const wordCount = sectionContent.split(/\s+/).length;
        completedSections.push(sectionContent);
        fullContent += sectionContent + "\n\n";

        sendSSE(res, "section_complete", {
          index,
          wordCount,
          heading: mergedSection.heading,
        });

        console.log(
          `[AI Stream] Section ${index + 1} complete: ${wordCount} words`
        );

        // Update generation_status in DB if we have a partial save
        // (We'll do the full save at the end)
      } catch (sectionError) {
        console.error(
          `[AI Stream] Section ${index + 1} failed:`,
          sectionError.message
        );

        // Partial save: save what we have so far as a draft
        let partialSaved = false;
        if (completedSections.length > 0) {
          try {
            await savePost({
              sql,
              outline,
              content: fullContent,
              tags: userTags,
              saveAsDraft: true,
              generationStatus: "error",
            });
            partialSaved = true;
            console.log(
              `[AI Stream] Partial save: ${completedSections.length} sections saved as draft`
            );
          } catch (saveErr) {
            console.error("[AI Stream] Partial save failed:", saveErr.message);
          }
        }

        sendError(res, "section", sectionError.message, index, partialSaved);
        res.end();
        return;
      }
    }

    // =====================================================================
    // STAGE 3: METADATA GENERATION
    // =====================================================================
    console.log("[AI Stream] Stage 3: Generating metadata");

    let finalTags = userTags;
    let metaDescription = outline.description;
    let imageSearchQuery = "";

    if (generateMetaSeparately) {
      try {
        const metaPrompt = buildMetadataPrompt({
          title: outline.title,
          excerpt: outline.description,
          contentPreview: fullContent.substring(0, 500),
        });

        const metaResponse = await client.chat.completions.create({
          model: "llama3.1-8b",
          messages: [{ role: "user", content: metaPrompt }],
          response_format: { type: "json_object" },
          temperature: 0.5,
        });

        const metadata = JSON.parse(metaResponse.choices[0].message.content);

        if (
          metadata.tags &&
          metadata.tags.length > 0 &&
          (!userTags || userTags.length === 0)
        ) {
          finalTags = metadata.tags.slice(0, 5);
        }
        if (metadata.metaDescription) {
          metaDescription = metadata.metaDescription.substring(0, 155);
        }
        if (metadata.imageSearchQuery) {
          imageSearchQuery = metadata.imageSearchQuery;
        }
      } catch (metaErr) {
        console.warn(
          "[AI Stream] Metadata generation failed, using defaults:",
          metaErr.message
        );
        // Non-fatal: continue with defaults
      }
    }

    const totalWords = fullContent.split(/\s+/).length;
    const readTime = Math.ceil(totalWords / 200);

    sendSSE(res, "metadata_complete", {
      tags: finalTags,
      excerpt: outline.description,
      metaDescription,
      readTime,
      imageSearchQuery,
      totalWords,
    });

    // =====================================================================
    // STAGE 4: DATABASE SAVE
    // =====================================================================
    console.log("[AI Stream] Stage 4: Saving to database");

    const savedPost = await savePost({
      sql,
      outline,
      content: fullContent,
      tags: finalTags,
      metaDescription,
      imageSearchQuery,
      readTime,
      saveAsDraft,
      generationStatus: "complete",
    });

    const generationTime = Date.now() - startTime;

    sendSSE(res, "generation_complete", {
      postId: savedPost.id,
      slug: savedPost.slug,
      title: savedPost.title,
      totalWords,
      timeMs: generationTime,
      readTime,
    });

    emitToAdmins("AI:GENERATION_FINISHED", {
      postId: savedPost.id,
      title: savedPost.title,
      slug: savedPost.slug,
      totalWords,
    });

    console.log(
      `[AI Stream] Complete in ${generationTime}ms. Post saved: ${savedPost.slug}`
    );

    res.end();
  } catch (error) {
    console.error("[AI Stream] Critical failure:", error);

    // Try partial save
    let partialSaved = false;
    if (completedSections.length > 0 && outline) {
      try {
        await savePost({
          sql,
          outline,
          content: fullContent,
          tags: userTags,
          saveAsDraft: true,
          generationStatus: "error",
        });
        partialSaved = true;
      } catch (_) {
        // ignore save failure
      }
    }

    sendError(res, "critical", error.message, null, partialSaved);
    res.end();
  }
}

// =========================================================================
// SAVE POST HELPER
// =========================================================================

async function savePost({
  sql,
  outline,
  content,
  tags = [],
  metaDescription,
  imageSearchQuery,
  readTime,
  saveAsDraft = true,
  generationStatus = "complete",
}) {
  // Generate slug with collision avoidance
  let baseSlug = outline.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  // Check for collision
  let slug = baseSlug + "-" + Math.random().toString(36).substring(2, 6);
  const existing =
    await sql`SELECT 1 FROM blog_posts WHERE slug = ${slug} LIMIT 1`;
  if (existing.length > 0) {
    slug = baseSlug + "-" + Math.random().toString(36).substring(2, 8);
  }

  const calculatedReadTime =
    readTime || Math.ceil(content.split(/\s+/).length / 200);

  // Note: source.unsplash.com is deprecated (returns 404).
  // Featured image can be added manually when editing the post.
  const featuredImageUrl = null;

  const result = await sql`
    INSERT INTO blog_posts (
      title, slug, content, excerpt, tags, 
      featured_image_url, meta_description, 
      published, author, read_time, 
      created_at, updated_at
    )
    VALUES (
      ${outline.title},
      ${slug},
      ${content},
      ${outline.description},
      ${tags},
      ${featuredImageUrl},
      ${metaDescription || outline.description},
      ${!saveAsDraft},
      'Mayank',
      ${calculatedReadTime},
      NOW(),
      NOW()
    )
    RETURNING id, slug, title
  `;

  return result[0];
}
