// Vercel API Route: /api/posts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL || '');

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const sessions = await sql`
    SELECT s.*, a.role FROM sessions s
    JOIN admin_profiles a ON s.user_id = a.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `;

  return sessions.length > 0 ? sessions[0] : null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, slug, all, limit = 10, offset = 0, search, tags } = req.query;

  try {
    // GET - Fetch posts
    if (req.method === 'GET') {
      // Get by ID (admin)
      if (id) {
        const session = await verifyAuth(req);
        if (!session || session.role !== 'admin') {
          return errorResponse(res, 'Unauthorized', 401);
        }

        const posts = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;
        if (posts.length === 0) {
          return errorResponse(res, 'Post not found', 404);
        }
        return jsonResponse(res, { success: true, data: posts[0] });
      }

      // Get by slug
      if (slug) {
        let posts;
        if (all === 'true') {
          posts = await sql`SELECT * FROM blog_posts WHERE slug = ${slug}`;
        } else {
          posts = await sql`SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true`;
        }
        if (posts.length === 0) {
          return errorResponse(res, 'Post not found', 404);
        }
        return jsonResponse(res, { success: true, data: posts[0] });
      }

      // Get all posts
      let posts;
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      if (all === 'true') {
        const session = await verifyAuth(req);
        if (!session || session.role !== 'admin') {
          return errorResponse(res, 'Unauthorized', 401);
        }
        posts = await sql`
          SELECT * FROM blog_posts 
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      } else {
        posts = await sql`
          SELECT * FROM blog_posts 
          WHERE published = true 
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      }

      const countResult = await sql`SELECT COUNT(*) as count FROM blog_posts WHERE published = true`;

      return jsonResponse(res, {
        success: true,
        data: posts,
        count: parseInt(countResult[0].count),
      });
    }

    // POST - Create post
    if (req.method === 'POST') {
      const session = await verifyAuth(req);
      if (!session || session.role !== 'admin') {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const { title, slug: postSlug, content, excerpt, tags: postTags, featured_image_url, meta_description, published, author, read_time } = req.body;

      if (!title || !content) {
        return errorResponse(res, 'Title and content required', 400);
      }

      const posts = await sql`
        INSERT INTO blog_posts (title, slug, content, excerpt, tags, featured_image_url, meta_description, published, author, read_time)
        VALUES (${title}, ${postSlug}, ${content}, ${excerpt || ''}, ${postTags || []}, ${featured_image_url || null}, ${meta_description || ''}, ${published || false}, ${author || 'Admin'}, ${read_time || 5})
        RETURNING *
      `;

      return jsonResponse(res, { success: true, data: posts[0] }, 201);
    }

    // PUT - Update post
    if (req.method === 'PUT') {
      const session = await verifyAuth(req);
      if (!session || session.role !== 'admin') {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!id) {
        return errorResponse(res, 'Post ID required', 400);
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
        return errorResponse(res, 'Post not found', 404);
      }

      return jsonResponse(res, { success: true, data: posts[0] });
    }

    // DELETE - Delete post
    if (req.method === 'DELETE') {
      const session = await verifyAuth(req);
      if (!session || session.role !== 'admin') {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!id) {
        return errorResponse(res, 'Post ID required', 400);
      }

      await sql`DELETE FROM blog_posts WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('Posts API error:', error);
    return errorResponse(res, error.message || 'Internal server error', 500);
  }
}
