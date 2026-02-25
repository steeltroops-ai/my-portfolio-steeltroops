import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth } from "../utils.js";

const sql = neon(process.env.DATABASE_URL || "");

export default async function handler(req, res) {
  // CORS
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const session = await verifyAuth(req, sql);
    if (!session || session.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized access detected" });
    }

    // 1. Handle Visitor Detail Drill-down (Separate logic to keep parallel stats clean)
    if (req.query.action === "visitor_detail") {
      const { visitorId } = req.query;
      if (!visitorId)
        return res.status(400).json({ error: "visitorId required" });

      const profile = await sql`
        SELECT p.*, k.real_name, k.email, k.role, k.linkedin_url
        FROM visitor_profiles p
        LEFT JOIN known_entities k ON p.likely_entity_id = k.entity_id
        WHERE p.id = ${visitorId}
      `;

      if (profile.length === 0)
        return res.status(404).json({ error: "Visitor not found" });

      const [sessions, events, historicalIps, fingerprintMatches] =
        await Promise.all([
          sql`SELECT s.*, (SELECT COUNT(*) FROM visitor_events WHERE session_uuid = s.id) as event_count FROM visitor_sessions s WHERE visitor_uuid = ${profile[0].id} ORDER BY start_time DESC`,
          sql`SELECT e.* FROM visitor_events e JOIN visitor_sessions s ON e.session_uuid = s.id WHERE s.visitor_uuid = ${profile[0].id} ORDER BY timestamp DESC LIMIT 100`,
          sql`SELECT DISTINCT ip_address FROM visitor_sessions WHERE visitor_uuid = ${profile[0].id} UNION SELECT ip_address FROM visitor_profiles WHERE id = ${profile[0].id}`,
          sql`SELECT visitor_id, ip_address, device_model, city, last_seen, 'hardware' as match_type FROM visitor_profiles WHERE fingerprint = ${profile[0].fingerprint} AND id != ${profile[0].id} AND fingerprint IS NOT NULL`,
        ]);

      const uniqueIps = historicalIps.map((r) => r.ip_address).filter(Boolean);
      let ipMatches = [];
      if (uniqueIps.length > 0) {
        ipMatches = await sql`
          SELECT visitor_id, ip_address, device_model, city, last_seen, 'network' as match_type
          FROM visitor_profiles 
          WHERE ip_address = ANY(${uniqueIps})
          AND id != ${profile[0].id}
          AND (fingerprint != ${profile[0].fingerprint} OR fingerprint IS NULL)
          LIMIT 5
        `;
      }

      return res.status(200).json({
        success: true,
        profile: profile[0],
        sessions,
        events,
        ips: uniqueIps,
        fingerprintMatches,
        ipMatches,
        matches: [...fingerprintMatches, ...ipMatches],
      });
    }

    // 2. Parallel Core Dashboard Aggregation (High Speed Mode - Split into two batches for stability)
    console.log(
      "[Stats] Starting localized aggregation for session:",
      session.userId
    );

    try {
      // BATCH 1: Lightweight Counts
      const [
        liveNowResult,
        uniqueVisitorsResult,
        totalSessionsResult,
        pageViews7dResult,
        botSessionsResult,
        deviceBreakdown,
        browserBreakdown,
      ] = await Promise.all([
        sql`SELECT COUNT(DISTINCT visitor_id) as count FROM visitor_profiles WHERE last_seen > NOW() - INTERVAL '2 minutes' AND is_owner = FALSE`,
        sql`SELECT COUNT(DISTINCT ip_address) as count FROM visitor_profiles WHERE is_owner = FALSE`,
        sql`SELECT COUNT(*) as count FROM visitor_sessions`,
        sql`SELECT COUNT(*) as count FROM visitor_events WHERE event_type = 'page_view' AND timestamp > NOW() - INTERVAL '7 days'`,
        sql`SELECT COUNT(*) as count FROM visitor_sessions s JOIN visitor_profiles v ON s.visitor_uuid = v.id WHERE v.is_bot = TRUE`,
        sql`SELECT COALESCE(device_model, device_type) as device_type, COUNT(*) as count FROM visitor_profiles WHERE is_owner = FALSE GROUP BY COALESCE(device_model, device_type) ORDER BY count DESC LIMIT 8`,
        sql`SELECT browser, COUNT(*) as count FROM visitor_profiles WHERE is_owner = FALSE GROUP BY browser LIMIT 12`,
      ]);

      // BATCH 2: Heavy Lifting (Lists & Maps)
      const [
        topLocations,
        topReferrers,
        topUTMs,
        topPages,
        recentVisitors,
        recentActions,
        mapNodes,
      ] = await Promise.all([
        sql`SELECT country, city, region, MAX(latitude) as lat, MAX(longitude) as lon, COUNT(*) as count, MAX(last_seen) as last_active FROM visitor_profiles WHERE is_owner = FALSE GROUP BY country, city, region ORDER BY count DESC LIMIT 50`,
        sql`SELECT referrer, COUNT(*) as count FROM visitor_sessions WHERE referrer IS NOT NULL AND referrer != '' AND referrer NOT LIKE '%localhost%' GROUP BY referrer ORDER BY count DESC LIMIT 10`,
        sql`SELECT utm_source, COUNT(*) as count FROM visitor_sessions WHERE utm_source IS NOT NULL AND utm_source != '' GROUP BY utm_source ORDER BY count DESC LIMIT 10`,
        sql`SELECT path, COUNT(*) as count FROM visitor_events WHERE event_type = 'page_view' GROUP BY path ORDER BY count DESC LIMIT 15`,
        // Recent Visitors (Complex Join)
        sql`
          WITH visitor_stats AS (
            SELECT
              s.visitor_uuid,
              COUNT(CASE WHEN e.event_type = 'click' THEN 1 END) as total_clicks,
              COUNT(CASE WHEN e.event_type = 'page_view' THEN 1 END) as total_pageviews,
              (ARRAY_AGG(s.referrer ORDER BY s.last_heartbeat DESC) FILTER (WHERE s.referrer IS NOT NULL AND s.referrer != ''))[1] as last_referrer,
              (ARRAY_AGG(e.path ORDER BY e.timestamp DESC))[1] as last_path,
              EXTRACT(EPOCH FROM (MAX(e.timestamp) - MIN(e.timestamp))) as duration_seconds
            FROM visitor_sessions s
            LEFT JOIN visitor_events e ON e.session_uuid = s.id
            GROUP BY s.visitor_uuid
          )
          SELECT 
            p.id, 
            p.visitor_id, 
            p.ip_address, 
            p.browser, 
            p.os, 
            p.device_type, 
            p.country, 
            p.city, 
            p.region, 
            p.isp, 
            p.last_seen, 
            p.visit_count, 
            p.screen_size, 
            p.fingerprint, 
            p.device_model, 
            p.is_bot, 
            k.real_name, 
            k.email,
            k.role,
            COALESCE(vs.total_clicks, 0) as total_clicks,
            COALESCE(vs.total_pageviews, 0) as total_pageviews,
            COALESCE(vs.last_referrer, 'Direct') as last_referrer,
            COALESCE(vs.last_path, '/') as last_path,
            COALESCE(vs.duration_seconds, 0) as duration_seconds
          FROM visitor_profiles p
          LEFT JOIN known_entities k ON p.likely_entity_id = k.entity_id
          LEFT JOIN visitor_stats vs ON vs.visitor_uuid = p.id
          WHERE p.is_owner = FALSE
          ORDER BY p.last_seen DESC
          LIMIT 100`,
        // Recent Actions
        sql`
          SELECT e.timestamp, e.event_type, e.event_label, e.path, v.city, v.country, v.os, v.browser, v.ip_address, v.is_bot
          FROM visitor_events e 
          JOIN visitor_sessions s ON e.session_uuid = s.id 
          JOIN visitor_profiles v ON s.visitor_uuid = v.id 
          WHERE v.is_owner = FALSE 
          ORDER BY e.timestamp DESC LIMIT 100`,
        // Map Nodes
        sql`SELECT id, city, country, latitude as lat, longitude as lon, last_seen as last_active, visit_count as count, is_bot, is_owner FROM visitor_profiles WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND (latitude != 0 OR longitude != 0) ORDER BY last_seen DESC LIMIT 1000`,
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          liveNow: parseInt(liveNowResult[0]?.count) || 0,
          totalVisitors: parseInt(uniqueVisitorsResult[0]?.count) || 0,
          totalSessions: parseInt(totalSessionsResult[0]?.count) || 0,
          pageViews7d: parseInt(pageViews7dResult[0]?.count) || 0,
          botSessions: parseInt(botSessionsResult[0]?.count) || 0,
        },
        deviceBreakdown,
        browserBreakdown,
        topLocations,
        mapNodes,
        topReferrers,
        topUTMs,
        topPages,
        recentVisitors,
        recentActions,
      });
    } catch (batchError) {
      console.error("[Stats] Batch Query Failed:", batchError);
      throw batchError; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("[Stats] API Aggregate Error (Final Catch):", error);
    return res.status(500).json({
      success: false,
      error: "Data Aggregation Failed",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
}
