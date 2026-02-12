// Vercel API Route: /api/auth
import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL || "");

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, "sha512")
    .toString("hex");
  return hash === verifyHash;
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

import { setCorsHeaders, serializeCookie, verifyAuth } from "./utils.js";

export default async function handler(req, res) {
  // Use shared CORS logic
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // Handle login
    if (action === "login" && req.method === "POST") {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, "Email and password required", 400);
      }

      const users = await sql`
        SELECT * FROM admin_profiles WHERE email = ${email.toLowerCase()}
      `;

      if (users.length === 0) {
        return errorResponse(res, "Invalid credentials", 401);
      }

      const user = users[0];

      if (!verifyPassword(password, user.password_hash)) {
        return errorResponse(res, "Invalid credentials", 401);
      }

      // Create session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
      `;

      // Set Secure, HttpOnly Cookie
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      };

      res.setHeader(
        "Set-Cookie",
        serializeCookie("auth_token", token, cookieOptions)
      );

      return jsonResponse(res, {
        success: true,
        // No token returned in body, force cookie usage
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
        },
      });
    }

    // Handle logout
    if (action === "logout" && req.method === "POST") {
      // Clear session from DB if possible (optional, but good security)
      const session = await verifyAuth(req, sql);
      if (session) {
        await sql`DELETE FROM sessions WHERE token = ${session.token}`;
      }

      // Clear Browser Cookie
      res.setHeader(
        "Set-Cookie",
        serializeCookie("auth_token", "", {
          httpOnly: true,
          path: "/",
          maxAge: 0, // Expire immediately
        })
      );

      return jsonResponse(res, { success: true });
    }

    // Handle verify token (Session Check)
    if (action === "verify" && req.method === "GET") {
      const session = await verifyAuth(req, sql);

      if (!session) {
        return jsonResponse(res, { authenticated: false });
      }

      return jsonResponse(res, {
        authenticated: true,
        isAdmin: session.role === "admin",
        user: {
          email: session.email,
          displayName: session.display_name, // Fixed: use display_name from joined session
          role: session.role,
        },
      });
    }

    // Handle get current user
    if (action === "me" && req.method === "GET") {
      const session = await verifyAuth(req, sql);

      if (!session) {
        return errorResponse(res, "Unauthorized", 401);
      }

      return jsonResponse(res, {
        success: true,
        user: {
          id: session.user_id, // Fixed: session.user_id from joined table
          email: session.email,
          displayName: session.display_name,
          role: session.role,
        },
      });
    }

    return errorResponse(res, "Invalid action", 400);
  } catch (error) {
    console.error("Auth API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
