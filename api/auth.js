// Vercel API Route: /api/auth
import { neon } from '@neondatabase/serverless';
import crypto from 'crypto';

const sql = neon(process.env.DATABASE_URL || '');

// Password hashing
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    // Handle login
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body;

      if (!email || !password) {
        return errorResponse(res, 'Email and password required', 400);
      }

      const users = await sql`
        SELECT * FROM admin_profiles WHERE email = ${email.toLowerCase()}
      `;

      if (users.length === 0) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      const user = users[0];

      if (!verifyPassword(password, user.password_hash)) {
        return errorResponse(res, 'Invalid credentials', 401);
      }

      // Create session
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await sql`
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (${user.id}, ${token}, ${expiresAt.toISOString()})
      `;

      return jsonResponse(res, {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
        },
      });
    }

    // Handle logout
    if (action === 'logout' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        await sql`DELETE FROM sessions WHERE token = ${token}`;
      }
      return jsonResponse(res, { success: true });
    }

    // Handle verify token
    if (action === 'verify' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return jsonResponse(res, { authenticated: false });
      }

      const token = authHeader.slice(7);
      const sessions = await sql`
        SELECT s.*, a.role, a.email, a.display_name
        FROM sessions s
        JOIN admin_profiles a ON s.user_id = a.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (sessions.length === 0) {
        return jsonResponse(res, { authenticated: false });
      }

      return jsonResponse(res, {
        authenticated: true,
        isAdmin: sessions[0].role === 'admin',
        user: {
          email: sessions[0].email,
          displayName: sessions[0].display_name,
          role: sessions[0].role,
        },
      });
    }

    // Handle get current user
    if (action === 'me' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      const token = authHeader.slice(7);
      const sessions = await sql`
        SELECT s.*, a.id, a.email, a.display_name, a.role
        FROM sessions s
        JOIN admin_profiles a ON s.user_id = a.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
      `;

      if (sessions.length === 0) {
        return errorResponse(res, 'Unauthorized', 401);
      }

      return jsonResponse(res, {
        success: true,
        user: {
          id: sessions[0].id,
          email: sessions[0].email,
          displayName: sessions[0].display_name,
          role: sessions[0].role,
        },
      });
    }

    return errorResponse(res, 'Invalid action', 400);
  } catch (error) {
    console.error('Auth API error:', error);
    return errorResponse(res, error.message || 'Internal server error', 500);
  }
}
