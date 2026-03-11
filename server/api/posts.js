// Vercel API Route: /api/posts
import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth } from "./utils.js";
import { emitToAdmins } from "../services/realtime/broadcaster.js";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

// O(1) Performance: In-memory aggregate cache
let statsCache = {
  data: null,
  timestamp: 0,
  TTL: 10000, // 10 second memoization
};

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id, slug, all, limit = 10, offset = 0, search, tags } = req.query;

  try {
    // GET - Fetch posts
    if (req.method == "GET") {
      // Fast-path: return only the latest updated_at for change-detection polling.
      // useSmartSync calls this every 30s; no auth or count query needed.
      if (req.query.version_check === "true") {
        const [row] =
          await sql`SELECT MAX(updated_at) AS latest FROM blog_posts WHERE published = true`;
        return res
          .status(200)
          .json({ posts: [{ updated_at: row?.latest ?? null }] });
      }

      // Get by ID (admin)
      if (id) {
        const session = await verifyAuth(req, sql);
        if (!session || session.role !== "admin") {
          return errorResponse(res, "Unauthorized", 401);
        }

        const posts = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
        if (posts.length === 0) {
          return errorResponse(res, "Post not found", 404);
        }
        return jsonResponse(res, { success: true, data: posts[0] });
      }

      // Get by slug
      if (slug) {
        let posts;
        if (all === "true") {
          const session = await verifyAuth(req, sql);
          if (!session || session.role !== "admin") {
            // If requesting all (unpublished) by slug, must be admin
            return errorResponse(res, "Unauthorized", 401);
          }
          posts = await sql`SELECT * FROM blog_posts WHERE slug = ${slug}`;
        } else {
          posts =
            await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true`;
        }

        if (posts.length === 0) {
          return errorResponse(res, "Post not found", 404);
        }
        return jsonResponse(res, { success: true, data: posts[0] });
      }

      // Get list of posts
      const limitNum = parseInt(limit) || 10;
      const offsetNum = parseInt(offset) || 0;
      const isAdmin = all === "true";

      if (isAdmin) {
        const session = await verifyAuth(req, sql);
        if (!session || session.role !== "admin") {
          return errorResponse(res, "Unauthorized", 401);
        }
      }

      // Build Query Conditions
      const searchPattern = search ? `%${search}%` : null;
      const tagArray =
        tags && tags.length > 0
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t !== "")
          : null;
      const hasTags = tagArray && tagArray.length > 0;

      let posts;
      let countResult;

      if (isAdmin) {
        if (search && hasTags) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[]`;
        } else if (search) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})`;
        } else if (hasTags) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE tags && ${tagArray}::text[]`;
        } else {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult = await sql`SELECT COUNT(*) as count FROM blog_posts`;
        }
      } else {
        if (search && hasTags) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[]`;
        } else if (search) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})`;
        } else if (hasTags) {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE published = true AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND tags && ${tagArray}::text[]`;
        } else {
          posts =
            await sql`SELECT id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at FROM blog_posts WHERE published = true ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true`;
        }
      }

      let liveCount;
      let draftCount;

      if (isAdmin) {
        const now = Date.now();
        if (statsCache.data && now - statsCache.timestamp < statsCache.TTL) {
          ({ liveCount, draftCount } = statsCache.data);
        } else {
          const [liveResult, draftResult] = await Promise.all([
            sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true`,
            sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = false OR published IS NULL`,
          ]);
          liveCount = parseInt(liveResult[0].count);
          draftCount = parseInt(draftResult[0].count);
          statsCache = {
            data: { liveCount, draftCount },
            timestamp: now,
            TTL: statsCache.TTL,
          };
        }
      }

      return jsonResponse(res, {
        success: true,
        data: posts,
        count: parseInt(countResult[0]?.count || 0),
        liveCount: liveCount || 0,
        draftCount: draftCount || 0,
      });
    }

    // POST - Create post
    if (req.method === "POST") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      const {
        title,
        slug: postSlug,
        content,
        excerpt,
        tags: postTags,
        featured_image_url,
        meta_description,
        published,
        author,
        read_time,
      } = req.body;

      if (!title || !content) {
        return errorResponse(res, "Title and content required", 400);
      }

      // Invalidate stats cache on write
      statsCache.data = null;

      const posts = await sql`
        INSERT INTO blog_posts (title, slug, content, excerpt, tags, featured_image_url, meta_description, published, author, read_time)
        VALUES (${title}, ${postSlug}, ${content}, ${excerpt || ""}, ${postTags || []}, ${featured_image_url || null}, ${meta_description || ""}, ${published || false}, ${author || "Admin"}, ${read_time || 5})
        RETURNING *
      `;

      // Real-time broadcast for admin
      try {
        emitToAdmins("ADMIN:POSTS_CHANGED", {
          action: "create",
          postId: posts[0].id,
          title: posts[0].title,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}

      return jsonResponse(res, { success: true, data: posts[0] }, 201);
    }

    // PUT - Update post
    if (req.method === "PUT") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Post ID required", 400);
      }

      const updates = req.body;

      // Invalidate stats cache on write
      statsCache.data = null;

      const posts = await sql`
        UPDATE blog_posts SET
          title = COALESCE(${updates.title}, title),
          slug = COALESCE(${updates.slug}, slug),
          content = COALESCE(${updates.content}, content),
          excerpt = COALESCE(${updates.excerpt}, excerpt),
          tags = COALESCE(${updates.tags}, tags),
          featured_image_url = COALESCE(${updates.featured_image_url}, featured_image_url),
          meta_description = COALESCE(${updates.meta_description}, meta_description),
          published = COALESCE(${updates.published}, published),
          author = COALESCE(${updates.author}, author),
          read_time = COALESCE(${updates.read_time}, read_time),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (posts.length === 0) {
        return errorResponse(res, "Post not found", 404);
      }

      // Real-time broadcast for admin
      try {
        emitToAdmins("ADMIN:POSTS_CHANGED", {
          action: "update",
          postId: id,
          title: posts[0].title,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}

      return jsonResponse(res, { success: true, data: posts[0] });
    }

    // DELETE - Delete post
    if (req.method === "DELETE") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Post ID required", 400);
      }

      // Invalidate stats cache on write
      statsCache.data = null;

      await sql`DELETE FROM blog_posts WHERE id = ${id}`;
      // Real-time broadcast for admin
      try {
        emitToAdmins("ADMIN:POSTS_CHANGED", {
          action: "delete",
          postId: id,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}

      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error("Posts API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
