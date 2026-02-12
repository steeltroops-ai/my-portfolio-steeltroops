// Vercel API Route: /api/categories
import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth } from "./utils.js";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // GET - Fetch all categories (public)
    if (req.method === "GET") {
      const categories = await sql`
        SELECT * FROM blog_categories ORDER BY name ASC
      `;
      return jsonResponse(res, { success: true, data: categories });
    }

    // POST - Create category (admin only)
    if (req.method === "POST") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      const { name, slug, description, color } = req.body;

      if (!name || !slug) {
        return errorResponse(res, "Name and slug required", 400);
      }

      const categories = await sql`
        INSERT INTO blog_categories (name, slug, description, color)
        VALUES (${name}, ${slug}, ${description || ""}, ${color || "#6366f1"})
        RETURNING *
      `;

      return jsonResponse(res, { success: true, data: categories[0] }, 201);
    }

    // DELETE - Delete category (admin only)
    if (req.method === "DELETE") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Category ID required", 400);
      }

      await sql`DELETE FROM blog_categories WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error("Categories API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
