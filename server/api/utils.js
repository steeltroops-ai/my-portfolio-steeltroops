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
  if (options.maxAge != null) str += `; Max-Age=${options.maxAge}`;
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

// Rate Limiting Store (In-memory, per-instance)
const RATE_LIMIT_STORE = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute

/**
 * Perform IP-based Rate Limiting
 * @returns {boolean} true if allowed, false if limited
 */
export function checkRateLimit(req) {
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  if (!RATE_LIMIT_STORE.has(ip)) {
    RATE_LIMIT_STORE.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  const data = RATE_LIMIT_STORE.get(ip);
  if (now > data.resetAt) {
    RATE_LIMIT_STORE.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  data.count++;
  return data.count <= MAX_REQUESTS;
}

// Global CORS & Security Headers
export function setCorsHeaders(res, req) {
  // 1. CORS Strategy
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
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

  // 2. High-Governance Security Headers (Standard 1.4)
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.vercel.app https://*.neon.tech;"
  );
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
}

// Shared Auth Verification
export async function verifyAuth(req, sql) {
  // 1. Validate via strict HttpOnly Cookie
  const cookies = parseCookies(req);
  const token = cookies.auth_token;

  if (!token) return null;

  const sessions = await sql`
    SELECT s.*, a.role, a.email, a.display_name 
    FROM sessions s
    JOIN admin_profiles a ON s.user_id = a.id
    WHERE s.token = ${token} AND s.expires_at > NOW()
  `;

  return sessions.length > 0 ? sessions[0] : null;
}
