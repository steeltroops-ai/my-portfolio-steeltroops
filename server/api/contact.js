// Vercel API Route: /api/contact
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

  const { id, action, status, limit = 20, offset = 0 } = req.query;

  try {
    // POST - Submit contact message (public)
    if (req.method === "POST") {
      const { name, email, subject, message, visitorId } = req.body;

      if (!name || !email || !subject || !message) {
        return errorResponse(res, "All fields are required", 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, "Invalid email format", 400);
      }

      // 1. Save the message (Primary Action)
      const messages = await sql`
        INSERT INTO contact_messages (name, email, subject, message, status)
        VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${subject.trim()}, ${message.trim()}, 'unread')
        RETURNING *
      `;

      // 2. Identity Resolution (Side Effect)
      // Link this anonymous visitor to a real identity based on email
      if (visitorId) {
        try {
          // A. Create/Update Master Identity
          const identities = await sql`
            INSERT INTO master_identities (real_name, email, first_reveal_timestamp, last_active_timestamp)
            VALUES (${name.trim()}, ${email.trim().toLowerCase()}, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET
              real_name = EXCLUDED.real_name,
              last_active_timestamp = NOW()
            RETURNING id
          `;

          if (identities.length > 0) {
            const identityId = identities[0].id;

            // B. Link Visitor Profile to Identity
            await sql`
              UPDATE visitor_profiles
              SET identity_id = ${identityId}
              WHERE visitor_id = ${visitorId}
            `;
            console.log(
              `[Identity] Linked visitor ${visitorId} to identity ${identityId} (${email})`
            );
          }
        } catch (identityError) {
          console.error("[Identity] Resolution failed:", identityError);
          // Don't fail the request, just log it
        }
      }

      return jsonResponse(
        res,
        {
          success: true,
          data: messages[0],
          message: "Message sent successfully!",
        },
        201
      );
    }

    // GET - Get messages (admin only)
    if (req.method === "GET") {
      const session = await verifyAuth(req);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      let messages;
      if (status && status !== "all") {
        messages = await sql`
          SELECT * FROM contact_messages 
          WHERE status = ${status}
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      } else {
        messages = await sql`
          SELECT * FROM contact_messages 
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      }

      const countResult =
        await sql`SELECT COUNT(*) as count FROM contact_messages`;

      return jsonResponse(res, {
        success: true,
        data: messages,
        count: parseInt(countResult[0].count),
      });
    }

    // PUT - Update message status (admin only)
    if (req.method === "PUT") {
      const session = await verifyAuth(req);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Message ID required", 400);
      }

      let newStatus = action;
      if (action === "read") newStatus = "read";
      else if (action === "replied") newStatus = "replied";
      else if (action === "archive") newStatus = "archived";

      const { notes } = req.body || {};

      const messages = await sql`
        UPDATE contact_messages SET
          status = ${newStatus},
          admin_notes = COALESCE(${notes}, admin_notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (messages.length === 0) {
        return errorResponse(res, "Message not found", 404);
      }

      return jsonResponse(res, { success: true, data: messages[0] });
    }

    // DELETE - Delete message (admin only)
    if (req.method === "DELETE") {
      const session = await verifyAuth(req);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Message ID required", 400);
      }

      await sql`DELETE FROM contact_messages WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error("Contact API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
