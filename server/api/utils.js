/**
 * Shared API Utilities for Cookie-Based Auth & CORS
 */

// Format cookie string for Set-Cookie header
export function serializeCookie(name, value, options = {}) {
  let str = `${name}=${encodeURIComponent(value)}`;
  if (options.httpOnly) str += "; HttpOnly";
  if (options.secure) str += "; Secure";
  if (options.sameSite) str += `; SameSite=${options.sameSite}`;
  if (options.path) str += `; Path=${options.path || "/"}`;
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`;
  return str;
}

// Parse cookies from request header
export function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;

  rc &&
    rc.split(";").forEach((cookie) => {
      const parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURIComponent(parts.join("="));
    });

  return list;
}

// Global CORS Handler
export function setCorsHeaders(res, req) {
  // Allow requests from the exact origin to support credentials (cookies)
  const origin = req.headers.origin;

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    // Fallback for non-browser clients (like curl, or same-origin)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
}

// Shared Auth Verification
export async function verifyAuth(req, sql) {
  // 1. Try Cookie First (Preferred)
  const cookies = parseCookies(req);
  let token = cookies.auth_token;

  // 2. Fallback to Bearer Header (Legacy/Dev)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  const sessions = await sql`
    SELECT s.*, a.role, a.email, a.display_name 
    FROM sessions s
    JOIN admin_profiles a ON s.user_id = a.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `;

  return sessions.length > 0 ? sessions[0] : null;
}
