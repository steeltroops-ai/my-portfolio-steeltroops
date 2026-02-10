import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

/**
 * Authentication check for admin stats retrieval
 */
async function verifyAuth(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const sessions = await sql`
      SELECT s.*, a.role FROM sessions s
      JOIN admin_profiles a ON s.user_id = a.id
      WHERE s.token = ${token} AND s.expires_at > NOW()
    `;
    return sessions.length > 0 ? sessions[0] : null;
  } catch (e) {
    console.error("[Stats] Auth Verification failed:", e.message);
    return null;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const session = await verifyAuth(req);
    if (!session || session.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized access detected" });
    }

    // 1. Core Summary Stats (IP-based uniqueness for better accuracy)
    const liveNowCount = await sql`
      SELECT COUNT(DISTINCT visitor_id) as count 
      FROM visitor_profiles 
      WHERE last_seen > NOW() - INTERVAL '2 minutes' 
      AND is_owner = FALSE
    `;

    const uniqueByIp = await sql`
      SELECT COUNT(DISTINCT ip_address) as count 
      FROM visitor_profiles 
      WHERE is_owner = FALSE
    `;

    const totalSessionsCount = await sql`
      SELECT COUNT(*) as count FROM visitor_sessions
    `;

    const pageViews7d = await sql`
      SELECT COUNT(*) as count 
      FROM visitor_events 
      WHERE event_type = 'page_view' 
      AND timestamp > NOW() - INTERVAL '7 days'
    `;

    // 2. Breakdown Data
    const deviceBreakdown = await sql`
      SELECT device_type, COUNT(*) as count 
      FROM visitor_profiles 
      WHERE is_owner = FALSE
      GROUP BY device_type
    `;

    const browserBreakdown = await sql`
      SELECT browser, COUNT(*) as count 
      FROM visitor_profiles 
      WHERE is_owner = FALSE 
      GROUP BY browser 
      LIMIT 12
    `;

    // Top Locations (Grouped by City/Country)
    const topLocations = await sql`
      SELECT country, city, COUNT(*) as count 
      FROM visitor_profiles 
      WHERE is_owner = FALSE 
      GROUP BY country, city 
      ORDER BY count DESC 
      LIMIT 10
    `;

    // 3. Traffic Origins
    const topReferrers = await sql`
      SELECT referrer, COUNT(*) as count 
      FROM visitor_sessions 
      WHERE referrer IS NOT NULL AND referrer != '' AND referrer NOT LIKE '%localhost%'
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 10
    `;

    const topUTMs = await sql`
      SELECT utm_source, COUNT(*) as count 
      FROM visitor_sessions 
      WHERE utm_source IS NOT NULL AND utm_source != ''
      GROUP BY utm_source 
      ORDER BY count DESC 
      LIMIT 10
    `;

    // 4. Content Performance
    const topPages = await sql`
      SELECT path, COUNT(*) as count 
      FROM visitor_events 
      WHERE event_type = 'page_view'
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 15
    `;

    // 5. Subject Logs (Detailed visitor cluster forensics)
    const recentVisitors = await sql`
      SELECT 
        id, visitor_id, ip_address, browser, os, device_type, country, city, last_seen, visit_count, screen_size
      FROM visitor_profiles
      WHERE is_owner = FALSE
      ORDER BY last_seen DESC
      LIMIT 25
    `;

    // 6. Behavioral Stream (Action-by-action forensic feed)
    const recentActions = await sql`
      SELECT 
        e.timestamp, e.event_type, e.event_label, e.path, 
        v.city, v.country, v.os, v.browser, v.ip_address
      FROM visitor_events e
      JOIN visitor_sessions s ON e.session_uuid = s.id
      JOIN visitor_profiles v ON s.visitor_uuid = v.id
      WHERE v.is_owner = FALSE
      ORDER BY e.timestamp DESC
      LIMIT 40
    `;

    return res.status(200).json({
      success: true,
      stats: {
        liveNow: parseInt(liveNowCount[0].count) || 0,
        totalVisitors: parseInt(uniqueByIp[0].count) || 0,
        totalSessions: parseInt(totalSessionsCount[0].count) || 0,
        pageViews7d: parseInt(pageViews7d[0].count) || 0,
      },
      deviceBreakdown,
      browserBreakdown,
      topLocations,
      topReferrers,
      topUTMs,
      topPages,
      recentVisitors,
      recentActions,
    });
  } catch (error) {
    console.error("[Stats] API Aggregate Error:", error);
    return res.status(500).json({
      success: false,
      error: "Data Aggregation Failed",
      details: error.message,
    });
  }
}
