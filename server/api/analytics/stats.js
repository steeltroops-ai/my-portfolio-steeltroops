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

    // Fast-path: lightweight version check — only return totalSessions for change detection.
    // useSmartSync polls this every 30s; without this guard the full dashboard query runs on every poll.
    if (req.query.version_check === "true") {
      const [row] =
        await sql`SELECT COUNT(*)::int AS total FROM visitor_sessions`;
      return res
        .status(200)
        .json({ success: true, stats: { totalSessions: row.total } });
    }

    // 1. Handle Visitor Detail Drill-down (Separate logic to keep parallel stats clean)
    if (req.query.action === "visitor_detail") {
      const { visitorId } = req.query;
      if (!visitorId)
        return res.status(400).json({ error: "visitorId required" });

      // BUG-04 fix: visitorId query param is the visitor_id string, not the UUID pk
      const profile = await sql`
        SELECT p.*, k.real_name, k.email, k.role, k.linkedin_url
        FROM visitor_profiles p
        LEFT JOIN known_entities k ON p.likely_entity_id = k.entity_id
        WHERE p.visitor_id = ${visitorId}
      `;

      if (profile.length === 0)
        return res.status(404).json({ error: "Visitor not found" });

      const [sessions, events, historicalIps, fingerprintMatches] =
        await Promise.all([
          sql`SELECT s.*, (SELECT COUNT(*) FROM visitor_events WHERE session_uuid = s.id) as event_count FROM visitor_sessions s WHERE visitor_uuid = ${profile[0].id} ORDER BY start_time DESC`,
          sql`SELECT e.* FROM visitor_events e JOIN visitor_sessions s ON e.session_uuid = s.id WHERE s.visitor_uuid = ${profile[0].id} ORDER BY timestamp DESC LIMIT 100`,
          sql`SELECT DISTINCT ip_address FROM visitor_sessions WHERE visitor_uuid = ${profile[0].id} UNION SELECT ip_address FROM visitor_profiles WHERE visitor_id = ${visitorId}`,
          sql`SELECT visitor_id, ip_address, device_model, city, last_seen, 'hardware' as match_type FROM visitor_profiles WHERE fingerprint = ${profile[0].fingerprint} AND visitor_id != ${visitorId} AND fingerprint IS NOT NULL`,
        ]);

      const uniqueIps = historicalIps.map((r) => r.ip_address).filter(Boolean);
      let ipMatches = [];
      if (uniqueIps.length > 0) {
        ipMatches = await sql`
          SELECT visitor_id, ip_address, device_model, city, last_seen, 'network' as match_type
          FROM visitor_profiles
          WHERE ip_address = ANY(${uniqueIps})
          AND visitor_id != ${visitorId}
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

    // 2. Entities God View - Full correlation CTE
    if (req.query.action === "entities") {
      const entities = await sql`
        WITH entity_profile AS (
          SELECT
            ke.entity_id,
            ke.real_name,
            ke.email,
            ke.role,
            ke.notes,
            ke.confidence_score,
            ke.resolution_sources,
            ke.total_visits,
            ke.first_seen,
            ke.last_seen,
            COUNT(DISTINCT vp.id) as linked_device_count,
            COUNT(DISTINCT vs.id) as total_sessions,
            ARRAY_AGG(DISTINCT vp.ip_address) FILTER (WHERE vp.ip_address IS NOT NULL) as known_ips,
            ARRAY_AGG(DISTINCT vp.hardware_hash) FILTER (WHERE vp.hardware_hash IS NOT NULL) as known_devices,
            ARRAY_AGG(DISTINCT (vp.city || ', ' || vp.country)) FILTER (WHERE vp.city IS NOT NULL) as known_locations,
            ARRAY_AGG(DISTINCT vp.browser) FILTER (WHERE vp.browser IS NOT NULL) as browsers_used,
            ARRAY_AGG(DISTINCT vp.os) FILTER (WHERE vp.os IS NOT NULL) as os_used,
            MAX(vp.last_seen) as truly_last_seen
          FROM known_entities ke
          LEFT JOIN visitor_profiles vp ON vp.likely_entity_id = ke.entity_id
          LEFT JOIN visitor_sessions vs ON vs.visitor_uuid = vp.id
          GROUP BY ke.entity_id, ke.real_name, ke.email, ke.role, ke.notes,
                   ke.confidence_score, ke.resolution_sources, ke.total_visits,
                   ke.first_seen, ke.last_seen
        )
        SELECT * FROM entity_profile
        ORDER BY confidence_score DESC, truly_last_seen DESC
        LIMIT 200
      `;

      const signals = await sql`
        SELECT entity_id, signal_type, signal_weight, signal_value, created_at
        FROM identity_signals
        ORDER BY created_at DESC
        LIMIT 500
      `;

      return res.status(200).json({
        success: true,
        entities,
        signals,
      });
    }

    // 3. Content Behaviour Profile - what a specific visitor/entity actually read
    if (req.query.action === "content_profile") {
      const { visitorId, entityId } = req.query;
      if (!visitorId && !entityId) {
        return res
          .status(400)
          .json({ error: "visitorId or entityId required" });
      }

      const blogEvents = entityId
        ? await sql`
            SELECT e.event_type, e.event_label, e.event_value, e.path, e.timestamp,
              v.city, v.country, v.device_type, v.browser, k.real_name, k.email
            FROM visitor_events e
            JOIN visitor_sessions s ON e.session_uuid = s.id
            JOIN visitor_profiles v ON s.visitor_uuid = v.id
            LEFT JOIN known_entities k ON v.likely_entity_id = k.entity_id
            WHERE v.likely_entity_id = ${entityId}
              AND e.event_type IN (
                'blog_open','blog_finish','blog_bounce',
                'read_depth_25pct','read_depth_50pct','read_depth_75pct','read_depth_100pct',
                'section_view','blog_card_click','contact'
              )
            ORDER BY e.timestamp DESC LIMIT 500
          `
        : await sql`
            SELECT e.event_type, e.event_label, e.event_value, e.path, e.timestamp,
              v.city, v.country, v.device_type, v.browser, k.real_name, k.email
            FROM visitor_events e
            JOIN visitor_sessions s ON e.session_uuid = s.id
            JOIN visitor_profiles v ON s.visitor_uuid = v.id
            LEFT JOIN known_entities k ON v.likely_entity_id = k.entity_id
            WHERE v.visitor_id = ${visitorId}
              AND e.event_type IN (
                'blog_open','blog_finish','blog_bounce',
                'read_depth_25pct','read_depth_50pct','read_depth_75pct','read_depth_100pct',
                'section_view','blog_card_click','contact'
              )
            ORDER BY e.timestamp DESC LIMIT 500
          `;

      // Aggregate per post slug
      const postSummary = blogEvents.reduce((acc, ev) => {
        const slug =
          ev.event_value?.split("|")[0] || ev.event_label || "unknown";
        if (!acc[slug])
          acc[slug] = {
            slug,
            opened: false,
            finished: false,
            bounced: false,
            max_depth: 0,
            sections_read: [],
            time_spent: null,
          };
        if (ev.event_type === "blog_open") acc[slug].opened = true;
        if (ev.event_type === "blog_finish") {
          acc[slug].finished = true;
          const p = (ev.event_value || "").split("|");
          acc[slug].time_spent = p[1] || null;
          acc[slug].max_depth = parseInt(p[2]) || 100;
        }
        if (ev.event_type === "blog_bounce") {
          acc[slug].bounced = true;
          const p = (ev.event_value || "").split("|");
          acc[slug].time_spent = p[1] || null;
          acc[slug].max_depth = parseInt(p[2]) || 0;
        }
        if (ev.event_type.startsWith("read_depth_")) {
          const d =
            parseInt(
              ev.event_type.replace("read_depth_", "").replace("pct", "")
            ) || 0;
          if (d > acc[slug].max_depth) acc[slug].max_depth = d;
        }
        if (ev.event_type === "section_view") {
          const s = (ev.event_value || "").split("|")[1] || "";
          if (s && !acc[slug].sections_read.includes(s))
            acc[slug].sections_read.push(s);
        }
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        raw_events: blogEvents,
        post_summary: Object.values(postSummary),
        identity: blogEvents[0]
          ? { real_name: blogEvents[0].real_name, email: blogEvents[0].email }
          : null,
      });
    }

    // 4. Behavioral Biometric Radar: scatter plot data for bot vs human detection
    if (req.query.action === "biometric_radar") {
      try {
        const rows = await sql`
          SELECT
            bb.entropy_score,
            bb.avg_mouse_velocity,
            bb.typing_cadence_ms,
            bb.is_bot_verified,
            s.session_id,
            v.city,
            v.country,
            v.is_bot,
            k.real_name,
            v.visitor_id
          FROM behavioral_biometrics bb
          JOIN visitor_sessions s ON bb.session_uuid = s.id
          JOIN visitor_profiles v ON s.visitor_uuid = v.id
          LEFT JOIN known_entities k ON v.likely_entity_id = k.entity_id
          WHERE v.is_owner = FALSE
          ORDER BY bb.recorded_at DESC
          LIMIT 500
        `;
        const map = new Map();
        for (const r of rows) {
          if (!map.has(r.session_id)) map.set(r.session_id, r);
        }
        return res
          .status(200)
          .json({ success: true, points: Array.from(map.values()) });
      } catch (e) {
        return res.status(200).json({ success: true, points: [] });
      }
    }

    // 5. Content Read Funnel: global scroll-depth drop-off
    if (req.query.action === "read_funnel") {
      try {
        const raw = await sql`
          SELECT e.event_type, COUNT(DISTINCT s.visitor_uuid) as unique_visitors,
            COALESCE(e.event_label, 'all') as post_slug
          FROM visitor_events e
          JOIN visitor_sessions s ON e.session_uuid = s.id
          JOIN visitor_profiles v ON s.visitor_uuid = v.id
          WHERE v.is_owner = FALSE
            AND e.event_type IN ('blog_open','read_depth_25pct','read_depth_50pct','read_depth_75pct','read_depth_100pct','blog_finish','blog_bounce')
          GROUP BY e.event_type, COALESCE(e.event_label, 'all')
          ORDER BY unique_visitors DESC
        `;
        const STAGES = [
          { key: "blog_open", label: "OPENED" },
          { key: "read_depth_25pct", label: "25% READ" },
          { key: "read_depth_50pct", label: "50% READ" },
          { key: "read_depth_75pct", label: "75% READ" },
          { key: "read_depth_100pct", label: "100% READ" },
          { key: "blog_finish", label: "FINISHED" },
          { key: "blog_bounce", label: "BOUNCED" },
        ];
        const globalFunnel = STAGES.map((stage) => ({
          ...stage,
          count: raw
            .filter((r) => r.event_type === stage.key)
            .reduce((s, r) => s + parseInt(r.unique_visitors), 0),
        }));
        const perPost = raw.reduce((acc, r) => {
          if (!acc[r.post_slug])
            acc[r.post_slug] = { slug: r.post_slug, stages: {} };
          acc[r.post_slug].stages[r.event_type] = parseInt(r.unique_visitors);
          return acc;
        }, {});
        return res.status(200).json({
          success: true,
          global_funnel: globalFunnel,
          per_post: Object.values(perPost)
            .sort(
              (a, b) =>
                (b.stages["blog_open"] || 0) - (a.stages["blog_open"] || 0)
            )
            .slice(0, 10),
        });
      } catch (e) {
        return res
          .status(200)
          .json({ success: true, global_funnel: [], per_post: [] });
      }
    }

    // 6. Entity Graph: cross-device identity linking data for spiderweb
    if (req.query.action === "entity_graph") {
      try {
        const [entities, deviceNodes] = await Promise.all([
          sql`
            SELECT ke.entity_id, ke.real_name, ke.email, ke.confidence_score, ke.total_visits, ke.last_seen, ke.resolution_sources, ke.aliases,
              COUNT(DISTINCT vp.id) as device_count
            FROM known_entities ke
            LEFT JOIN visitor_profiles vp ON vp.likely_entity_id = ke.entity_id
            GROUP BY ke.entity_id, ke.real_name, ke.email, ke.confidence_score, ke.total_visits, ke.last_seen, ke.resolution_sources, ke.aliases
            ORDER BY ke.confidence_score DESC LIMIT 50
          `,
          sql`
            SELECT vp.id as device_id, vp.visitor_id, vp.device_type, vp.browser, vp.os,
              vp.city, vp.country, vp.is_bot, vp.last_seen, vp.visit_count, vp.likely_entity_id as entity_id,
              vp.ip_address, vp.fingerprint
            FROM visitor_profiles vp
            WHERE vp.likely_entity_id IS NOT NULL AND vp.is_owner = FALSE
            ORDER BY vp.last_seen DESC LIMIT 200
          `,
        ]);
        return res
          .status(200)
          .json({ success: true, entities, device_nodes: deviceNodes });
      } catch (e) {
        return res
          .status(200)
          .json({ success: true, entities: [], device_nodes: [] });
      }
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
        sql`SELECT COUNT(*) as count FROM visitor_profiles WHERE is_owner = FALSE`,
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
        sql`SELECT country, city, region, AVG(latitude) as lat, AVG(longitude) as lon, COUNT(*) as count, MAX(last_seen) as last_active FROM visitor_profiles WHERE is_owner = FALSE GROUP BY country, city, region ORDER BY count DESC LIMIT 50`,
        sql`SELECT referrer, COUNT(*) as count FROM visitor_sessions WHERE referrer IS NOT NULL AND referrer != '' AND referrer NOT LIKE '%localhost%' GROUP BY referrer ORDER BY count DESC LIMIT 10`,
        sql`SELECT utm_source, COUNT(*) as count FROM visitor_sessions WHERE utm_source IS NOT NULL AND utm_source != '' GROUP BY utm_source ORDER BY count DESC LIMIT 10`,
        sql`SELECT path, COUNT(*) as count FROM visitor_events WHERE event_type = 'page_view' GROUP BY path ORDER BY count DESC LIMIT 15`,
        // Recent Visitors (Complex Join)
        sql`
          -- Deduplicated session stats per visitor
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
        ),
        -- Last 10 visit sessions per visitor
        visit_log AS (
          SELECT
            s.visitor_uuid,
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'session_id', s.session_id,
                'start_time', s.start_time,
                'last_heartbeat', s.last_heartbeat,
                'duration_seconds', EXTRACT(EPOCH FROM (s.last_heartbeat - s.start_time)),
                'page_views', (SELECT COUNT(*) FROM visitor_events ve WHERE ve.session_uuid = s.id AND ve.event_type = 'page_view'),
                'referrer', COALESCE(s.referrer, ''),
                'entry_path', COALESCE(s.entry_page, '/')
              ) ORDER BY s.start_time DESC
            ) as sessions
          FROM (
            SELECT * FROM visitor_sessions
            ORDER BY start_time DESC
          ) s
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
          p.first_seen,
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
          COALESCE(vs.duration_seconds, 0) as duration_seconds,
          COALESCE(vl.sessions, '[]'::json) as visit_log
        FROM visitor_profiles p
        LEFT JOIN known_entities k ON p.likely_entity_id = k.entity_id
        LEFT JOIN visitor_stats vs ON vs.visitor_uuid = p.id
        LEFT JOIN visit_log vl ON vl.visitor_uuid = p.id
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
    });
  }
}
