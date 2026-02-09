import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL || "");

// Helper to anonymize IP but keep it unique per day
// Modified: User requested raw IP visibility for debugging/tracking
// We will store a consistent hash that maps 1:1 to an IP for uniqueness
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    "127.0.0.1"
  );
};

const getLocationFromIp = async (ip) => {
  if (ip === "127.0.0.1" || ip === "::1")
    return { city: "Localhost", country: "Dev" };
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await res.json();
    return {
      city: data.city ? decodeURIComponent(data.city) : "Unknown",
      country: data.countryCode || "Unknown",
      region: data.regionName ? decodeURIComponent(data.regionName) : "",
      lat: data.lat || 0,
      lon: data.lon || 0,
      isp: data.isp || "",
      org: data.org || "",
    };
  } catch (e) {
    return { city: "Unknown", country: "Unknown" };
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.query;
  const ip = getClientIp(req);

  try {
    // 1. INIT SESSION & VISITOR
    if (action === "init") {
      const {
        visitorId,
        sessionId,
        userAgent,
        screenResolution,
        referrer,
        utm,
        path,
      } = req.body;

      const parser = new UAParser(userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();
      const loc = await getLocationFromIp(ip);

      // Upsert Visitor Profile
      // We use IP as a secondary check for uniqueness if visitorId is missing or cleared
      await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, browser, os, device_type, screen_size,
          country, city, region, isp, org, first_seen, last_seen, visit_count, is_owner
        )
        VALUES (
          ${visitorId}, ${ip}, ${browser.name}, ${os.name}, ${device.type || "desktop"}, ${screenResolution},
          ${loc.country}, ${loc.city}, ${loc.region}, ${loc.isp}, ${loc.org},
          NOW(), NOW(), 1, FALSE
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen = NOW(),
          visit_count = visitor_profiles.visit_count + 1,
          ip_address = EXCLUDED.ip_address,
          city = EXCLUDED.city,
          country = EXCLUDED.country
      `;

      // Log Session
      await sql`
        INSERT INTO visitor_sessions (
          visitor_uuid, session_id, start_time, last_heartbeat, 
          referrer, utm_source, utm_medium, utm_campaign, entry_page
        )
        SELECT id, ${sessionId}, NOW(), NOW(), ${referrer}, ${utm?.source}, ${utm?.medium}, ${utm?.campaign}, ${path}
        FROM visitor_profiles WHERE visitor_id = ${visitorId}
        ON CONFLICT (session_id) DO UPDATE SET last_heartbeat = NOW()
      `;

      // Log Initial Page View
      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, path, timestamp
        )
        SELECT id, 'page_view', ${path}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      return res.status(200).json({ success: true });
    }

    // 2. TRACK EVENT
    if (action === "event") {
      const { sessionId, type, label, value, path } = req.body;

      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, event_label, event_value, path, timestamp
        )
        SELECT id, ${type}, ${label}, ${value}, ${path}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      return res.status(200).json({ success: true });
    }

    // 3. HEARTBEAT
    if (action === "heartbeat") {
      const { sessionId } = req.body;
      await sql`
        UPDATE visitor_sessions 
        SET last_heartbeat = NOW() 
        WHERE session_id = ${sessionId}
      `;
      // Also update profile last_seen
      await sql`
        UPDATE visitor_profiles
        SET last_seen = NOW()
        FROM visitor_sessions
        WHERE visitor_profiles.id = visitor_sessions.visitor_uuid
        AND visitor_sessions.session_id = ${sessionId}
      `;
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("Analytics Error:", error);
    return res.status(500).json({ error: "Tracking failed" });
  }
}
