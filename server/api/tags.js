// Vercel API Route: /api/tags
import { neon } from "@neondatabase/serverless";
import { setCorsHeaders } from "./utils.js";

const sql = neon(process.env.DATABASE_URL || "");

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const posts = await sql`
      SELECT tags FROM blog_posts WHERE published = true AND tags IS NOT NULL
    `;

    const allTags = posts.flatMap((post) => post.tags || []);
    const uniqueTags = [...new Set(allTags)].sort();

    return res.status(200).json({ success: true, data: uniqueTags });
  } catch (error) {
    console.error("Tags API error:", error);
    return res
      .status(500)
      .json({
        success: false,
        error: error.message || "Internal server error",
      });
  }
}
