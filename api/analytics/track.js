import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return errorResponse(res, "Method not allowed", 405);
  }

  const { action } = req.query;
  const data = req.body;

  try {
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    // Mask IP for privacy (hash it)
    const maskedIp = crypto
      .createHash("md5")
      .update(ip + (process.env.IP_SALT || "salt"))
      .digest("hex");

    // Action: Initialize Visit
    if (action === "init") {
      const {
        visitorId,
        sessionId,
        userAgent,
        screenResolution,
        referrer,
        utm,
        path,
      } = data;

      const parser = new UAParser(userAgent);
      const ua = parser.getResult();

      // Get Vercel Geolocation Headers
      const country = req.headers["x-vercel-ip-country"] || "Unknown";
      const region = req.headers["x-vercel-ip-country-region"] || "Unknown";
      const city = req.headers["x-vercel-ip-city"] || "Unknown";
      const continent = req.headers["x-vercel-ip-continent"] || "Unknown";
      const lat = req.headers["x-vercel-ip-latitude"] || null;
      const lon = req.headers["x-vercel-ip-longitude"] || null;

      // Upsert Visitor Profile
      const visitors = await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, browser, os, device_brand, device_type, screen_size,
          country, region, city, continent, lat, lon, last_seen
        ) VALUES (
          ${visitorId}, ${maskedIp}, ${ua.browser.name}, ${ua.os.name}, 
          ${ua.device.vendor || "Generic"}, ${ua.device.type || "desktop"}, ${screenResolution},
          ${country}, ${region}, ${city}, ${continent}, ${lat}, ${lon}, NOW()
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen = NOW(),
          visit_count = visitor_profiles.visit_count + 1
        RETURNING id
      `;

      const visitorUuid = visitors[0].id;

      // Create Session
      await sql`
        INSERT INTO visitor_sessions (
          visitor_uuid, session_id, referrer, utm_source, utm_medium, utm_campaign, entry_page
        ) VALUES (
          ${visitorUuid}, ${sessionId}, ${referrer}, ${utm?.source}, ${utm?.medium}, ${utm?.campaign}, ${path}
        )
        ON CONFLICT (session_id) DO NOTHING
      `;

      return jsonResponse(res, { success: true, visitorUuid });
    }

    // Action: Heartbeat (Live Now Tracking)
    if (action === "heartbeat") {
      const { visitorId, sessionId } = data;

      await sql`
        UPDATE visitor_profiles SET last_seen = NOW() WHERE visitor_id = ${visitorId}
      `;

      await sql`
        UPDATE visitor_sessions SET last_heartbeat = NOW() WHERE session_id = ${sessionId}
      `;

      return jsonResponse(res, { success: true });
    }

    // Action: Log Event
    if (action === "event") {
      const { sessionId, type, label, value, path } = data;

      const sessions =
        await sql`SELECT id FROM visitor_sessions WHERE session_id = ${sessionId}`;
      if (sessions.length > 0) {
        await sql`
          INSERT INTO visitor_events (session_uuid, event_type, event_label, event_value, path)
          VALUES (${sessions[0].id}, ${type}, ${label}, ${value}, ${path})
        `;
      }

      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Invalid action", 400);
  } catch (error) {
    console.error("Analytics API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
