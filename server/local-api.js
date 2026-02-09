/**
 * Local API Development Server
 *
 * This runs the Vercel serverless functions locally using Express.
 * It mirrors the same API behavior as production.
 *
 * Usage: node server/local-api.js
 */

import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock Vercel request/response wrapper
// Express 5 makes req.query a getter-only property, so we create a proxy object
function wrapHandler(handler) {
  return async (expressReq, res) => {
    try {
      // Parse query params from URL
      const url = new URL(expressReq.url, `http://localhost:${PORT}`);
      const queryParams = Object.fromEntries(url.searchParams);

      // Create a Vercel-compatible request object
      // We proxy most properties but provide our own query and body
      const req = {
        ...expressReq,
        method: expressReq.method,
        url: expressReq.url,
        headers: expressReq.headers,
        query: { ...expressReq.query, ...queryParams },
        body: expressReq.body || {},
        cookies: expressReq.cookies,
      };

      await handler(req, res);
    } catch (error) {
      console.error("API Error:", error);
      res.status(500).json({ error: error.message });
    }
  };
}

// Dynamic import of API handlers
async function loadHandlers() {
  try {
    // Auth routes
    const authHandler = (await import("../api/auth.js")).default;
    app.all("/api/auth", wrapHandler(authHandler));

    // Posts routes
    const postsHandler = (await import("../api/posts.js")).default;
    app.all("/api/posts", wrapHandler(postsHandler));

    // Contact routes
    const contactHandler = (await import("../api/contact.js")).default;
    app.all("/api/contact", wrapHandler(contactHandler));

    // Contact Reply route (New)
    const replyContactHandler = (await import("../api/contact_reply.js"))
      .default;
    app.all("/api/contact/reply", wrapHandler(replyContactHandler));

    // Comments routes
    const commentsHandler = (await import("../api/comments.js")).default;
    app.all("/api/comments", wrapHandler(commentsHandler));

    // Categories routes
    const categoriesHandler = (await import("../api/categories.js")).default;
    app.all("/api/categories", wrapHandler(categoriesHandler));

    // Tags routes
    const tagsHandler = (await import("../api/tags.js")).default;
    app.all("/api/tags", wrapHandler(tagsHandler));

    // AI routes - Legacy monolithic endpoint
    const aiGenerateHandler = (await import("../api/ai/generate-blog.js"))
      .default;
    app.all("/api/ai/generate-blog", wrapHandler(aiGenerateHandler));

    // AI routes - New client-orchestrated pipeline
    const aiOutlineHandler = (await import("../api/ai/generate-outline.js"))
      .default;
    app.all("/api/ai/generate-outline", wrapHandler(aiOutlineHandler));

    const aiSectionHandler = (await import("../api/ai/generate-section.js"))
      .default;
    app.all("/api/ai/generate-section", wrapHandler(aiSectionHandler));

    const aiEnrichHandler = (await import("../api/ai/enrich.js")).default;
    app.all("/api/ai/enrich", wrapHandler(aiEnrichHandler));

    // Analytics routes
    const analyticsTrackHandler = (await import("../api/analytics/track.js"))
      .default;
    app.all("/api/analytics/track", wrapHandler(analyticsTrackHandler));

    const analyticsStatsHandler = (await import("../api/analytics/stats.js"))
      .default;
    app.all("/api/analytics/stats", wrapHandler(analyticsStatsHandler));

    console.log("  API handlers loaded successfully");
  } catch (error) {
    console.error("  Error loading API handlers:", error);
    process.exit(1);
  }
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Start server with port retry
async function start() {
  await loadHandlers();

  const tryListen = (port, maxRetries = 5) => {
    const server = app.listen(port, () => {
      console.log("");
      console.log("  Local API Server");
      console.log("  =================");
      console.log("");
      console.log(`  API running at: http://localhost:${port}`);
      console.log("");
      console.log("  Available endpoints:");
      console.log("    POST /api/auth?action=login");
      console.log("    GET  /api/auth?action=verify");
      console.log("    GET  /api/posts");
      console.log("    GET  /api/contact");
      console.log("    POST /api/ai/generate-blog");
      console.log("    POST /api/ai/generate-outline");
      console.log("    POST /api/ai/generate-section");
      console.log("    POST /api/ai/enrich");
      console.log("    POST /api/analytics/track");
      console.log("    GET  /api/analytics/stats");
      console.log("");
      console.log("  Press Ctrl+C to stop");
      console.log("");
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE" && maxRetries > 0) {
        console.log(`  Port ${port} in use, trying ${port + 1}...`);
        server.close();
        tryListen(port + 1, maxRetries - 1);
      } else {
        console.error("  Failed to start server:", err.message);
        process.exit(1);
      }
    });
  };

  tryListen(PORT);
}

start();
