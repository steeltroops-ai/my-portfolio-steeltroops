import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL || "");

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. Core Summary Stats
    const liveNowCount = await sql`
      SELECT COUNT(DISTINCT visitor_id) as count 
      FROM visitor_profiles 
      WHERE last_seen > NOW() - INTERVAL '2 minutes' 
      AND is_owner = FALSE
    `;

    // Unique Visitors by IP (More accurate than cookie ID)
    const uniqueVisitorsCount = await sql`
      SELECT COUNT(DISTINCT ip_address) as count 
      FROM visitor_profiles 
      WHERE is_owner = FALSE
    `;

    const totalSessionsCount = await sql`
      SELECT COUNT(*) as count FROM visitor_sessions
    `;

    const pageViews7dCount = await sql`
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
      LIMIT 10
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

    // Traffic Origins
    const topReferrers = await sql`
      SELECT referrer, COUNT(*) as count 
      FROM visitor_sessions 
      WHERE referrer IS NOT NULL AND referrer != '' AND referrer NOT LIKE '%localhost%'
      GROUP BY referrer 
      ORDER BY count DESC 
      LIMIT 5
    `;

    const topUTMs = await sql`
      SELECT utm_source, COUNT(*) as count 
      FROM visitor_sessions 
      WHERE utm_source IS NOT NULL AND utm_source != ''
      GROUP BY utm_source 
      ORDER BY count DESC 
      LIMIT 5
    `;

    // Content Performance
    const topPages = await sql`
      SELECT path, COUNT(*) as count 
      FROM visitor_events 
      WHERE event_type = 'page_view'
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 10
    `;

    // Subject Logs (Visitor Forensics)
    const recentVisitors = await sql`
      SELECT 
        id, visitor_id, ip_address, browser, os, device_type, country, city, last_seen, visit_count, screen_size
      FROM visitor_profiles
      WHERE is_owner = FALSE
      ORDER BY last_seen DESC
      LIMIT 20
    `;

    // Behavioral Stream
    const recentActions = await sql`
      SELECT 
        e.timestamp, e.event_type, e.event_label, e.path, v.city, v.country, v.os, v.browser, v.ip_address
      FROM visitor_events e
      JOIN visitor_sessions s ON e.session_uuid = s.id
      JOIN visitor_profiles v ON s.visitor_uuid = v.id
      WHERE v.is_owner = FALSE
      ORDER BY e.timestamp DESC
      LIMIT 30
    `;

    return res.status(200).json({
      success: true,
      stats: {
        liveNow: parseInt(liveNowCount[0].count),
        totalVisitors: parseInt(uniqueVisitorsCount[0].count), // Use IP uniqueness
        totalSessions: parseInt(totalSessionsCount[0].count),
        pageViews7d: parseInt(pageViews7dCount[0].count),
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
    console.error("Analytics Stats API error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
