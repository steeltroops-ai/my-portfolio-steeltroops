// Vercel API Route: /api/comments
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

  const { id, post_id, action, all, status, limit = 20, offset = 0 } = req.query;

  try {
    // GET - Fetch comments
    if (req.method === 'GET') {
      // Get all comments (admin)
      if (all === 'true') {
        const session = await verifyAuth(req);
        if (!session || session.role !== 'admin') {
          return errorResponse(res, 'Unauthorized', 401);
        }

        const limitNum = parseInt(limit);
        const offsetNum = parseInt(offset);

        let comments;
        if (status) {
          comments = await sql`
            SELECT * FROM comments 
            WHERE status = ${status}
            ORDER BY created_at DESC 
            LIMIT ${limitNum} OFFSET ${offsetNum}
          `;
        } else {
          comments = await sql`
            SELECT * FROM comments 
            ORDER BY created_at DESC 
            LIMIT ${limitNum} OFFSET ${offsetNum}
          `;
        }

        return jsonResponse(res, { success: true, data: comments });
      }

      // Get comments for a post (public - only approved)
      if (post_id) {
        const comments = await sql`
          SELECT * FROM comments 
          WHERE post_id = ${post_id} AND status = 'approved'
          ORDER BY created_at DESC
        `;
        return jsonResponse(res, { success: true, data: comments });
      }

      return errorResponse(res, 'Post ID required', 400);
    }

    // POST - Submit comment (public)
    if (req.method === 'POST') {
      const { post_id: postId, content, author_name, author_email, parent_id } = req.body;

      if (!postId || !content || !author_name || !author_email) {
        return errorResponse(res, 'All fields are required', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(author_email)) {
        return errorResponse(res, 'Invalid email format', 400);
      }

      const comments = await sql`
        INSERT INTO comments (post_id, content, author_name, author_email, parent_id, status)
        VALUES (${postId}, ${content.trim()}, ${author_name.trim()}, ${author_email.trim().toLowerCase()}, ${parent_id || null}, 'pending')
        RETURNING *
      `;

      return jsonResponse(res, {
        success: true,
        data: comments[0],
        message: 'Comment submitted! It will appear after moderation.',
      }, 201);
    }

    // PUT - Update comment status (admin only)
    if (req.method === 'PUT') {
      const session = await verifyAuth(req);
      if (!session || session.role !== 'admin') {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!id) {
        return errorResponse(res, 'Comment ID required', 400);
      }

      let newStatus = action;
      if (action === 'approve') newStatus = 'approved';
      else if (action === 'reject') newStatus = 'rejected';
      else if (action === 'spam') newStatus = 'spam';

      const comments = await sql`
        UPDATE comments SET
          status = ${newStatus},
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (comments.length === 0) {
        return errorResponse(res, 'Comment not found', 404);
      }

      return jsonResponse(res, { success: true, data: comments[0] });
    }

    // DELETE - Delete comment (admin only)
    if (req.method === 'DELETE') {
      const session = await verifyAuth(req);
      if (!session || session.role !== 'admin') {
        return errorResponse(res, 'Unauthorized', 401);
      }

      if (!id) {
        return errorResponse(res, 'Comment ID required', 400);
      }

      await sql`DELETE FROM comments WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, 'Method not allowed', 405);
  } catch (error) {
    console.error('Comments API error:', error);
    return errorResponse(res, error.message || 'Internal server error', 500);
  }
}
