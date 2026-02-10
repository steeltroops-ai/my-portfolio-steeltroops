import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL || "");

/**
 * Robust IP detection
 */
const getClientIp = (req) => {
  try {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
      return typeof forwarded === "string"
        ? forwarded.split(",")[0]
        : forwarded[0];
    }
    return req.headers["x-real-ip"] || req.socket?.remoteAddress || "127.0.0.1";
  } catch (e) {
    return "127.0.0.1";
  }
};

/**
 * Geo-location mapper (No-fail)
 */
const getLocation = async (ip) => {
  if (!ip || ip === "127.0.0.1" || ip.includes("::1")) {
    return { city: "Localhost", country: "Dev", region: "Local" };
  }
  try {
    // Timeout for fetch to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city,lat,lon,isp,org`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const data = await res.json();
    if (data.status === "fail")
      return { city: "Unknown", country: "Unknown", region: "Unknown" };

    return {
      city: data.city || "Unknown",
      country: data.countryCode || "Unknown",
      region: data.regionName || "Unknown",
      lat: data.lat || 0,
      lon: data.lon || 0,
      isp: data.isp || "Unknown",
      org: data.org || "Unknown",
    };
  } catch (e) {
    console.warn(
      "[Analytics] Geo Lookup failed, falling back to Unknown:",
      e.message
    );
    return { city: "Unknown", country: "Unknown", region: "Unknown" };
  }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { action } = req.query;
  const ip = getClientIp(req);

  try {
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

      if (!visitorId || !sessionId) {
        console.warn("[Analytics] Missing identity tokens in body:", req.body);
        return res.status(400).json({ error: "Missing identity tokens" });
      }

      console.log(`[Analytics] Processing init for session ${sessionId}...`);

      const parser = new UAParser(userAgent || "");
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();
      const loc = await getLocation(ip);

      // 1. Update/Create Profile
      await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, browser, os, device_type, screen_size,
          country, city, region, isp, org, first_seen, last_seen, visit_count, is_owner
        )
        VALUES (
          ${visitorId}, ${ip}, ${browser.name || "Unknown"}, ${os.name || "Unknown"}, 
          ${device.type || "desktop"}, ${screenResolution || "Unknown"},
          ${loc.country}, ${loc.city}, ${loc.region}, ${loc.isp || "Unknown"}, ${loc.org || "Unknown"},
          NOW(), NOW(), 1, FALSE
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen = NOW(),
          visit_count = visitor_profiles.visit_count + 1,
          ip_address = EXCLUDED.ip_address,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          browser = EXCLUDED.browser,
          os = EXCLUDED.os
      `;

      // 2. Log Session
      await sql`
        INSERT INTO visitor_sessions (
          visitor_uuid, session_id, start_time, last_heartbeat, 
          referrer, utm_source, utm_medium, utm_campaign, entry_page
        )
        SELECT id, ${sessionId}, NOW(), NOW(), ${referrer || ""}, ${utm?.source || ""}, ${utm?.medium || ""}, ${utm?.campaign || ""}, ${path || "/"}
        FROM visitor_profiles WHERE visitor_id = ${visitorId}
        ON CONFLICT (session_id) DO UPDATE SET last_heartbeat = NOW()
      `;

      // 3. Log Initial Page View
      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, path, timestamp
        )
        SELECT id, 'page_view', ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      console.log(`[Analytics] Success init for ${sessionId}`);
      return res.status(200).json({ success: true });
    }

    if (action === "event") {
      const { sessionId, type, label, value, path } = req.body;
      if (!sessionId)
        return res.status(400).json({ error: "Missing sessionId" });

      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, event_label, event_value, path, timestamp
        )
        SELECT id, ${type}, ${label || ""}, ${value || ""}, ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      return res.status(200).json({ success: true });
    }

    if (action === "heartbeat") {
      const { sessionId, visitorId } = req.body;

      if (sessionId) {
        await sql`
          UPDATE visitor_sessions 
          SET last_heartbeat = NOW() 
          WHERE session_id = ${sessionId}
        `;
      }

      if (visitorId) {
        await sql`
          UPDATE visitor_profiles
          SET last_seen = NOW()
          WHERE visitor_id = ${visitorId}
        `;
      }

      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("[Analytics] Tracker Error:", error.message);
    return res.status(500).json({
      error: "INTERNAL_TRACKER_ERROR",
      message: error.message,
    });
  }
}
