import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";
import crypto from "crypto";
import { z } from "zod";
import { setCorsHeaders, checkRateLimit } from "../utils.js";

const sql = neon(process.env.DATABASE_URL || "");

// --- Zod Validation Schemas ---
const initSchema = z.object({
  visitorId: z.string().min(5).max(100),
  sessionId: z.string().min(5).max(100),
  userAgent: z.string().max(500).optional(),
  screenResolution: z.string().max(50).optional(),
  referrer: z.string().max(500).optional(),
  path: z.string().max(300).optional(),
  utm: z
    .object({
      source: z.string().max(100).nullable().optional(),
      medium: z.string().max(100).nullable().optional(),
      campaign: z.string().max(100).nullable().optional(),
    })
    .optional(),
  forensics: z.record(z.any()).optional(), // Since forensics extracts variable hardware specs
});

const eventSchema = z.object({
  sessionId: z.string().min(5).max(100),
  type: z.string().max(100),
  label: z.string().max(255).optional(),
  value: z.string().max(255).optional(),
  path: z.string().max(300).optional(),
});

const heartbeatSchema = z.object({
  sessionId: z.string().min(5).max(100).optional(),
  visitorId: z.string().min(5).max(100).optional(),
  biometrics: z
    .object({
      mouse_velocity: z.number().optional(),
      typing_cadence_ms: z.number().optional(),
      entropy_score: z.number().optional(),
    })
    .optional(),
});

const pageviewSchema = z.object({
  sessionId: z.string().min(5).max(100),
  path: z.string().max(300).optional(),
});

const identifySchema = z.object({
  visitorId: z.string().min(5).max(100).optional(),
  sessionId: z.string().min(5).max(100).optional(),
  email: z.string().email().max(255),
  name: z.string().max(255).nullable().optional(),
  source: z.enum(["autofill", "form_submit", "manual"]).optional(),
});
// -----------------------------

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
    return {
      city: "Localhost",
      country: "Dev",
      region: "Local",
      lat: 28.6139, // Default to New Delhi for visual testing
      lon: 77.209,
      isp: "Loopback",
    };
  }
  try {
    // Timeout for fetch to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    // Note: IP Geolocation is accurate to the City/ISP level (approx 5-50km radius).
    // It is NOT GPS-precise. This is the most accurate silent method available.
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city,lat,lon,isp,org,mobile,proxy,hosting`,
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
  // CORS & Security
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") return res.status(200).end();

  // Governance: Rate Limiting
  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: "System Busy" });
  }

  const { action } = req.query;
  const ip = getClientIp(req);

  try {
    if (action === "init") {
      const parsed = initSchema.safeParse(req.body);
      if (!parsed.success) {
        console.warn("[Analytics] Zod Validation Failed:", parsed.error.issues);
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const {
        visitorId,
        sessionId,
        userAgent,
        screenResolution,
        referrer,
        utm,
        path,
        forensics,
      } = parsed.data;

      console.log(`[Analytics] Processing init for session ${sessionId}...`);

      const parser = new UAParser(userAgent || "");
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();
      const loc = await getLocation(ip);

      // Bot Detection Logic
      const botPatterns = [
        "bot",
        "crawler",
        "spider",
        "headless",
        "googlebot",
        "bingbot",
        "yandex",
        "baiduspider",
        "facebookexternalhit",
        "slurp",
        "ia_archiver",
        "vercel",
        "lighthouse",
        "pingdom",
        "uptime",
        "monitor",
        "python",
        "curl",
        "wget",
        "postman",
        "insomnia",
        "cypress",
        "selenium",
        "puppeteer",
        "playwright",
      ];
      const isBot = userAgent
        ? botPatterns.some((pattern) =>
            userAgent.toLowerCase().includes(pattern)
          )
        : true;

      // 1. Immutable Hardware DNA (The "God Mode" Anchor)
      // We store the raw device fingerprint separately to track devices across different "visitors" (incognito/cleared cookies)
      if (forensics?.fingerprint) {
        await sql`
          INSERT INTO fingerprint_dna (
            hash_id, gpu_renderer, canvas_hash, audio_context_hash, 
            cpu_cores, memory_gb, screen_resolution, last_seen
          )
          VALUES (
            ${forensics.fingerprint}, 
            ${forensics.gpu_renderer || "Unknown"}, 
            ${forensics.canvas_hash || null}, 
            ${forensics.audio_hash || null},
            ${forensics.cpu_cores || 0}, 
            ${forensics.memory_estimate || 0}, 
            ${screenResolution || "Unknown"},
            NOW()
          )
          ON CONFLICT (hash_id) DO UPDATE SET
            last_seen = NOW(),
            gpu_renderer = COALESCE(EXCLUDED.gpu_renderer, fingerprint_dna.gpu_renderer),
            canvas_hash = COALESCE(EXCLUDED.canvas_hash, fingerprint_dna.canvas_hash)
        `;
      }

      // 2. Update/Create Profile with Forensic Device DNA Linkage
      await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, browser, os, device_type, screen_size,
          country, city, region, isp, org, latitude, longitude,
          first_seen, last_seen, visit_count, is_owner, is_bot,
          fingerprint, gpu_vendor, gpu_renderer, cpu_cores, memory_estimate, 
          max_touch_points, timezone_offset, device_model,
          timezone_name, languages, platform, network_downlink,
          hardware_hash
        )
        VALUES (
          ${visitorId}, ${ip}, ${browser.name || "Unknown"}, ${os.name || "Unknown"}, 
          ${device.type || "desktop"}, ${screenResolution || "Unknown"},
          ${loc.country}, ${loc.city}, ${loc.region || "Unknown"}, ${loc.isp || "Unknown"}, ${loc.org || "Unknown"},
          ${loc.lat || 0}, ${loc.lon || 0},
          NOW(), NOW(), 1, FALSE, ${isBot},
          ${forensics?.fingerprint || null}, ${forensics?.gpu_vendor || null}, ${forensics?.gpu_renderer || null},
          ${forensics?.cpu_cores || null}, ${forensics?.memory_estimate || null}, ${forensics?.max_touch_points || null},
          ${forensics?.timezone_offset || null}, ${forensics?.device_model || device.model || null},
          ${forensics?.timezone_name || null}, ${forensics?.languages || null}, ${forensics?.platform || null}, ${forensics?.network_downlink || null},
          ${forensics?.fingerprint || null}
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen = NOW(),
          visit_count = visitor_profiles.visit_count + 1,
          ip_address = EXCLUDED.ip_address,
          city = EXCLUDED.city,
          country = EXCLUDED.country,
          region = EXCLUDED.region,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          browser = EXCLUDED.browser,
          os = EXCLUDED.os,
          is_bot = EXCLUDED.is_bot,
          fingerprint = COALESCE(EXCLUDED.fingerprint, visitor_profiles.fingerprint),
          gpu_vendor = COALESCE(EXCLUDED.gpu_vendor, visitor_profiles.gpu_vendor),
          gpu_renderer = COALESCE(EXCLUDED.gpu_renderer, visitor_profiles.gpu_renderer),
          device_model = COALESCE(EXCLUDED.device_model, visitor_profiles.device_model),
          timezone_name = COALESCE(EXCLUDED.timezone_name, visitor_profiles.timezone_name),
          languages = COALESCE(EXCLUDED.languages, visitor_profiles.languages),
          platform = COALESCE(EXCLUDED.platform, visitor_profiles.platform),
          network_downlink = COALESCE(EXCLUDED.network_downlink, visitor_profiles.network_downlink),
          hardware_hash = COALESCE(EXCLUDED.hardware_hash, visitor_profiles.hardware_hash)
      `;

      // 2. Log Session with Network Forensics
      await sql`
        INSERT INTO visitor_sessions (
          visitor_uuid, session_id, ip_address, start_time, last_heartbeat, 
          referrer, utm_source, utm_medium, utm_campaign, entry_page, network_type
        )
        SELECT id, ${sessionId}, ${ip}, NOW(), NOW(), ${referrer || ""}, 
          ${utm?.source || ""}, ${utm?.medium || ""}, ${utm?.campaign || ""}, 
          ${path || "/"}, ${forensics?.network_type || "unknown"}
        FROM visitor_profiles WHERE visitor_id = ${visitorId}
        ON CONFLICT (session_id) DO UPDATE SET 
          last_heartbeat = NOW(), 
          ip_address = EXCLUDED.ip_address,
          network_type = EXCLUDED.network_type
      `;

      // Store local IPs from WebRTC if present
      if (forensics?.local_ips && forensics.local_ips.length > 0) {
        // Here we could store them to a specific network_reputation table, but for now we log it.
        console.log(
          `[Forensics] Local IPs detected for ${visitorId}: ${forensics.local_ips.join(", ")}`
        );
      }

      // 3. Log Initial Page View
      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, path, timestamp
        )
        SELECT id, 'page_view', ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      console.log(`[Analytics] Success init for ${sessionId}`);

      // Real-time broadcast for admin dashboards
      try {
        const { emitToAdmins } =
          await import("../../services/realtime/broadcaster.js");
        emitToAdmins("ANALYTICS:SIGNAL", {
          type: "VISITOR_INIT",
          visitorId,
          sessionId,
          city: loc.city,
          country: loc.country,
          device: device.type || "desktop",
          os: os.name,
          browser: browser.name,
          path: path || "/",
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Broadcast failed, ignore
      }

      return res.status(200).json({ success: true });
    }

    if (action === "event") {
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const { sessionId, type, label, value, path } = parsed.data;

      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, event_label, event_value, path, timestamp
        )
        SELECT id, ${type}, ${label || ""}, ${value || ""}, ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      // Real-time broadcast for admin dashboards
      try {
        const { emitToAdmins } =
          await import("../../services/realtime/broadcaster.js");
        emitToAdmins("ANALYTICS:SIGNAL", {
          type: "EVENT",
          sessionId,
          eventType: type,
          label,
          value,
          path,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Broadcast failed
      }

      return res.status(200).json({ success: true });
    }

    if (action === "heartbeat") {
      const parsed = heartbeatSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const { sessionId, visitorId, biometrics } = parsed.data;

      if (sessionId) {
        await sql`
          UPDATE visitor_sessions 
          SET last_heartbeat = NOW() 
          WHERE session_id = ${sessionId}
        `;

        // Log deep biometric behavior if provided
        if (biometrics) {
          const is_bot_suspect = biometrics.entropy_score < 0.2;

          await sql`
            INSERT INTO behavioral_biometrics (
              session_id, session_uuid, avg_mouse_velocity, typing_cadence_ms, entropy_score, is_bot_verified
            )
            SELECT
              ${sessionId},
              id,
              ${biometrics.mouse_velocity || 0},
              ${biometrics.typing_cadence_ms || 0},
              ${biometrics.entropy_score || 0},
              ${is_bot_suspect}
            FROM visitor_sessions WHERE session_id = ${sessionId}
          `;
        }
      }

      if (visitorId) {
        await sql`
          UPDATE visitor_profiles
          SET last_seen = NOW()
          WHERE visitor_id = ${visitorId}
        `;
      }

      // Real-time broadcast for admin dashboards
      try {
        const { emitToAdmins } =
          await import("../../services/realtime/broadcaster.js");
        emitToAdmins("ANALYTICS:SIGNAL", {
          type: "HEARTBEAT",
          sessionId,
          visitorId,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Broadcast failed
      }

      return res.status(200).json({ success: true });
    }

    if (action === "pageview") {
      const parsed = pageviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const { sessionId, path } = parsed.data;

      await sql`
        INSERT INTO visitor_events (
          session_uuid, event_type, path, timestamp
        )
        SELECT id, 'page_view', ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      // Real-time broadcast for admin dashboards
      try {
        const { emitToAdmins } =
          await import("../../services/realtime/broadcaster.js");
        emitToAdmins("ANALYTICS:SIGNAL", {
          type: "PAGE_VIEW",
          sessionId,
          path,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Broadcast failed
      }

      return res.status(200).json({ success: true });
    }

    if (action === "identify") {
      const parsed = identifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid identify payload" });
      }

      const { visitorId, sessionId, email, name, source } = parsed.data;

      // A. Upsert known_entities - passive identity resolution
      const entities = await sql`
        INSERT INTO known_entities (real_name, email, role, notes)
        VALUES (
          ${name || "Unknown"},
          ${email.toLowerCase()},
          'Contact Candidate',
          ${`Auto-resolved via ${source || "autofill"} at ${new Date().toISOString()}`}
        )
        ON CONFLICT (email) DO UPDATE SET
          real_name = CASE
            WHEN known_entities.real_name = 'Unknown' THEN EXCLUDED.real_name
            ELSE known_entities.real_name
          END,
          updated_at = NOW()
        RETURNING entity_id
      `;

      if (entities.length > 0 && visitorId) {
        const entityId = entities[0].entity_id;

        // B. Link current visitor profile
        await sql`
          UPDATE visitor_profiles
          SET likely_entity_id = ${entityId}
          WHERE visitor_id = ${visitorId}
            AND likely_entity_id IS NULL
        `;

        // C. Retroactive God Mode sweep
        const hardwareRows = await sql`
          SELECT hardware_hash FROM visitor_profiles
          WHERE visitor_id = ${visitorId}
            AND hardware_hash IS NOT NULL
          LIMIT 1
        `;

        if (hardwareRows.length > 0 && hardwareRows[0].hardware_hash) {
          const retroUpdate = await sql`
            UPDATE visitor_profiles
            SET likely_entity_id = ${entityId}
            WHERE hardware_hash = ${hardwareRows[0].hardware_hash}
              AND likely_entity_id IS NULL
            RETURNING visitor_id
          `;

          if (retroUpdate.length > 0) {
            console.log(
              `[Identity] AUTOFILL GOD MODE: Retroactively linked ${retroUpdate.length} anonymous profile(s) to ${email}`
            );
          }
        }

        // D. Compute & persist confidence score
        // Signals: autofill=0.3, form_submit=0.5, hardware_match=0.15, ip_match=0.05
        const BASE_WEIGHTS = { autofill: 0.3, form_submit: 0.5, manual: 0.4 };
        const baseWeight = BASE_WEIGHTS[source || "autofill"] || 0.3;

        // Count corroborating device + IP signals for this entity
        const correlationStats = await sql`
          SELECT
            COUNT(DISTINCT hardware_hash) FILTER (WHERE hardware_hash IS NOT NULL) as device_count,
            COUNT(DISTINCT ip_address) FILTER (WHERE ip_address IS NOT NULL) as ip_count
          FROM visitor_profiles
          WHERE likely_entity_id = ${entityId}
        `;

        const deviceBonus = Math.min(
          (correlationStats[0]?.device_count || 0) * 0.15,
          0.3
        );
        const ipBonus = Math.min(
          (correlationStats[0]?.ip_count || 0) * 0.05,
          0.1
        );
        const newConfidence = Math.min(baseWeight + deviceBonus + ipBonus, 1.0);

        // Log signal to audit trail
        await sql`
          INSERT INTO identity_signals (entity_id, visitor_id, signal_type, signal_weight, signal_value)
          VALUES (
            ${entityId},
            ${visitorId || null},
            ${source || "autofill"},
            ${baseWeight},
            ${email.toLowerCase()}
          )
        `.catch(() => {});

        // Update entity: confidence, timestamps, resolution_sources
        await sql`
          UPDATE known_entities SET
            confidence_score = GREATEST(confidence_score, ${newConfidence}),
            last_seen = NOW(),
            total_visits = (
              SELECT COALESCE(SUM(visit_count), 0)
              FROM visitor_profiles WHERE likely_entity_id = ${entityId}
            ),
            resolution_sources = (
              SELECT ARRAY(
                SELECT DISTINCT unnest(array_append(resolution_sources, ${source || "autofill"}))
              )
              FROM known_entities WHERE entity_id = ${entityId}
            )
          WHERE entity_id = ${entityId}
        `.catch(() => {});

        // Upsert identity_clusters for cross-device linking
        if (hardwareRows.length > 0 && hardwareRows[0].hardware_hash) {
          await sql`
            INSERT INTO identity_clusters (fingerprint_hash, primary_entity_id, confidence_score)
            VALUES (${hardwareRows[0].hardware_hash}, ${entityId}, ${newConfidence})
            ON CONFLICT (fingerprint_hash) DO UPDATE SET
              primary_entity_id = EXCLUDED.primary_entity_id,
              confidence_score = GREATEST(identity_clusters.confidence_score, EXCLUDED.confidence_score)
          `.catch(() => {});
        }

        // E. Log the identity resolution event
        if (sessionId) {
          await sql`
            INSERT INTO visitor_events (
              session_uuid, event_type, event_label, event_value, path, timestamp
            )
            SELECT id,
              'identity_resolved',
              ${`autofill:${source || "autofill"}`},
              ${email.toLowerCase()},
              '/contact',
              NOW()
            FROM visitor_sessions WHERE session_id = ${sessionId}
            ON CONFLICT DO NOTHING
          `.catch(() => {}); // Non-blocking
        }

        // F. Real-time admin broadcast
        try {
          const { emitToAdmins } =
            await import("../../services/realtime/broadcaster.js");
          emitToAdmins("ANALYTICS:SIGNAL", {
            type: "IDENTITY_RESOLVED",
            method: source || "autofill",
            email,
            name: name || null,
            entityId,
            visitorId,
            confidence: newConfidence,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          // Broadcast failed, ignore
        }

        console.log(
          `[Identity] Resolved: ${email} -> entity ${entityId} | confidence: ${newConfidence.toFixed(2)}`
        );
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
