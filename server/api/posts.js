// Vercel API Route: /api/posts
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const sessions = await sql`
    SELECT s.*, a.role FROM sessions s
    JOIN admin_profiles a ON s.user_id = a.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `;

  return sessions.length > 0 ? sessions[0] : null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id, slug, all, limit = 10, offset = 0, search, tags } = req.query;

  try {
    // GET - Fetch posts
    if (req.method == "GET") {
      // Get by ID (admin)
      if (id) {
        const session = await verifyAuth(req);
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
          const session = await verifyAuth(req);
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
        const session = await verifyAuth(req);
        if (!session || session.role !== "admin") {
          return errorResponse(res, "Unauthorized", 401);
        }
      }

      // Build Query Conditions
      let conditions = [];
      if (!isAdmin) conditions.push("published = true");

      if (search) {
        conditions.push(
          `(title ILIKE ${"%" + search + "%"} OR content ILIKE ${"%" + search + "%"} OR excerpt ILIKE ${"%" + search + "%"})`
        );
      }

      if (tags) {
        const tagList = tags.split(",");
        conditions.push(
          `tags && ARRAY[${tagList.map((t) => `'${t}'`).join(",")}]::text[]`
        );
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // We need to use unsafe for dynamic queries in Neon, but since we are using
      // template literal parameters for values, it's safer.
      // However, Neon's template literal doesn't support dynamic WHERE clauses easily.
      // We will perform the search using a slightly more manual approach for conditions
      // while keeping values parameterized where possible.

      let posts;
      let countResult;

      // Columns to select for list view (excludes heavy 'content')
      const listColumns = sql`id, title, slug, excerpt, tags, featured_image_url, meta_description, published, author, read_time, created_at, updated_at`;

      // For simplicity and safety with the Neon driver, we'll handle the most common cases:
      if (!search && !tags) {
        if (isAdmin) {
          posts =
            await sql`SELECT ${listColumns} FROM blog_posts ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult = await sql`SELECT COUNT(*) as count FROM blog_posts`;
        } else {
          posts =
            await sql`SELECT ${listColumns} FROM blog_posts WHERE published = true ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
          countResult =
            await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true`;
        }
      } else {
        // Dynamic search/tag query
        // Note: We use string interpolation for condition structure but MUST parameterize values.
        // Neon driver doesn't support dynamic query building well, so we use a more verbose approach.
        const searchPattern = search ? `%${search}%` : null;
        const tagArray =
          tags && tags.length > 0
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter((t) => t !== "")
            : null;

        // If after filtering tagArray is empty, treat as null
        const hasTags = tagArray && tagArray.length > 0;

        if (isAdmin) {
          if (search && hasTags) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[]`;
          } else if (search) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})`;
          } else if (hasTags) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE tags && ${tagArray}::text[]`;
          } else {
            // Fallback for edge cases where code enters here but params are empty after cleaning
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult = await sql`SELECT COUNT(*) as count FROM blog_posts`;
          }
        } else {
          if (search && hasTags) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) AND tags && ${tagArray}::text[]`;
          } else if (search) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern}) ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND (title ILIKE ${searchPattern} OR content ILIKE ${searchPattern} OR excerpt ILIKE ${searchPattern})`;
          } else if (hasTags) {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE published = true AND tags && ${tagArray}::text[] ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true AND tags && ${tagArray}::text[]`;
          } else {
            posts =
              await sql`SELECT ${listColumns} FROM blog_posts WHERE published = true ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
            countResult =
              await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true`;
          }
        }
      }

      return jsonResponse(res, {
        success: true,
        data: posts,
        count: parseInt(countResult[0]?.count || 0),
      });
    }

    // POST - Create post
    if (req.method === "POST") {
      const session = await verifyAuth(req);
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

      const posts = await sql`
        INSERT INTO blog_posts (title, slug, content, excerpt, tags, featured_image_url, meta_description, published, author, read_time)
        VALUES (${title}, ${postSlug}, ${content}, ${excerpt || ""}, ${postTags || []}, ${featured_image_url || null}, ${meta_description || ""}, ${published || false}, ${author || "Admin"}, ${read_time || 5})
        RETURNING *
      `;

      return jsonResponse(res, { success: true, data: posts[0] }, 201);
    }

    // PUT - Update post
    if (req.method === "PUT") {
      const session = await verifyAuth(req);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Post ID required", 400);
      }

      const updates = req.body;

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
          read_time = COALESCE(${updates.read_time}, read_time),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (posts.length === 0) {
        return errorResponse(res, "Post not found", 404);
      }

      return jsonResponse(res, { success: true, data: posts[0] });
    }

    // DELETE - Delete post
    if (req.method === "DELETE") {
      const session = await verifyAuth(req);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Post ID required", 400);
      }

      await sql`DELETE FROM blog_posts WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error("Posts API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
