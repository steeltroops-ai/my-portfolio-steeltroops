import express from "express";
import cors from "cors";

// Import route handlers
import authHandler from "./api/auth.js";
import postsHandler from "./api/posts.js";
import contactHandler from "./api/contact.js";
import contactReplyHandler from "./api/contact_reply.js";
import commentsHandler from "./api/comments.js";
import categoriesHandler from "./api/categories.js";
import tagsHandler from "./api/tags.js";
import aiGenerateHandler from "./api/ai/generate-blog.js";
import aiGenerateStreamHandler from "./api/ai/generate-blog-stream.js";
import analyticsTrackHandler from "./api/analytics/track.js";
import analyticsStatsHandler from "./api/analytics/stats.js";
import sseStreamHandler from "./api/realtime/stream.js";

const app = express();

// Middleware
app.use(cors());
// IMPORTANT: Vercel functions parse body automatically if content-type is JSON,
// but for express app we should include json parser explicitly just in case
// it's not handled by the adapter or for local dev uniformity.
app.use(express.json());

// Routes
// We must match the paths used in client requests: /api/...
app.all("/api/auth", authHandler);
app.all("/api/posts", postsHandler);
app.all("/api/contact", contactHandler);
app.all("/api/contact/reply", contactReplyHandler);
app.all("/api/comments", commentsHandler);
app.all("/api/categories", categoriesHandler);
app.all("/api/tags", tagsHandler);
app.all("/api/ai/generate-blog", aiGenerateHandler);
app.all("/api/ai/generate-blog-stream", aiGenerateStreamHandler);
app.all("/api/analytics/track", analyticsTrackHandler);
app.all("/api/analytics/stats", analyticsStatsHandler);
// SSE endpoint: must be GET only — long-lived connection, not buffered
app.get("/api/realtime/stream", sseStreamHandler);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
