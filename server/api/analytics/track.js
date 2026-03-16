import { neon } from "@neondatabase/serverless";
import { UAParser } from "ua-parser-js";
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
  forensics: z.object({}).passthrough().optional(),
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
      // entropy_score is 0-100 on client, normalized to 0.0-1.0 here server-side
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
  email: z.string().max(255).email(),
  name: z.string().max(255).nullable().optional(),
  source: z
    .enum(["autofill", "form_submit", "manual", "autofill_nav"])
    .optional(),
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
        ? forwarded.split(",")[0].trim()
        : forwarded[0];
    }
    return req.headers["x-real-ip"] || req.socket?.remoteAddress || "127.0.0.1";
  } catch (e) {
    return "127.0.0.1";
  }
};

/**
 * Geo-location mapper (No-fail, 3s timeout)
 */
const getLocation = async (ip) => {
  if (!ip || ip === "127.0.0.1" || ip.includes("::1")) {
    return {
      city: "Localhost",
      country: "Dev",
      region: "Local",
      lat: 28.6139,
      lon: 77.209,
      isp: "Loopback",
    };
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city,lat,lon,isp,org,mobile,proxy,hosting`,
      { signal: controller.signal }
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
    return { city: "Unknown", country: "Unknown", region: "Unknown" };
  }
};

/**
 * Non-blocking background runner.
 * Runs an async function after the response is sent.
 * Errors are swallowed — never affect the client response.
 */
const runBackground = (fn) => {
  setImmediate(async () => {
    try {
      await fn();
    } catch (e) {
      console.error("[Analytics] Background task error:", e.message);
    }
  });
};

/**
 * Safe broadcaster import + emit. Never throws.
 */
const broadcast = async (channel, data) => {
  try {
    const { emitToAdmins } = await import("../../services/realtime/broadcaster.js");
    emitToAdmins(channel, data);
  } catch (e) {
    // Broadcast infrastructure unavailable — not fatal
  }
};

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") return res.status(200).end();

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: "System Busy" });
  }

  const { action } = req.query;
  const ip = getClientIp(req);

  try {
    // =========================================================
    // ACTION: init
    // =========================================================
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
        "bot", "crawler", "spider", "headless", "googlebot", "bingbot",
        "yandex", "baiduspider", "facebookexternalhit", "slurp", "ia_archiver",
        "vercel", "lighthouse", "pingdom", "uptime", "monitor",
        "python", "curl", "wget", "postman", "insomnia",
        "cypress", "selenium", "puppeteer", "playwright",
      ];
      const isBot = userAgent
        ? botPatterns.some((p) => userAgent.toLowerCase().includes(p))
        : true;

      // 1. Immutable Hardware DNA — canvas_hash column now exists (migration_004 FIX 1)
      if (forensics?.fingerprint) {
        await sql`
          INSERT INTO fingerprint_dna (
            hash_id, gpu_vendor, gpu_renderer, canvas_hash, audio_context_hash,
            cpu_cores, memory_gb, screen_resolution, font_hash, media_device_hash, last_seen
          )
          VALUES (
            ${forensics.fingerprint},
            ${forensics.gpu_vendor || "Unknown"},
            ${forensics.gpu_renderer || "Unknown"},
            ${forensics.canvas_hash || null},
            ${forensics.audio_hash || null},
            ${forensics.cpu_cores || 0},
            ${forensics.memory_estimate || 0},
            ${screenResolution || "Unknown"},
            ${forensics.font_hash || null},
            ${forensics.media_device_hash || null},
            NOW()
          )
          ON CONFLICT (hash_id) DO UPDATE SET
            last_seen        = NOW(),
            gpu_vendor       = COALESCE(EXCLUDED.gpu_vendor, fingerprint_dna.gpu_vendor),
            gpu_renderer     = COALESCE(EXCLUDED.gpu_renderer, fingerprint_dna.gpu_renderer),
            canvas_hash      = COALESCE(EXCLUDED.canvas_hash, fingerprint_dna.canvas_hash),
            audio_context_hash = COALESCE(EXCLUDED.audio_context_hash, fingerprint_dna.audio_context_hash),
            font_hash        = COALESCE(EXCLUDED.font_hash, fingerprint_dna.font_hash),
            media_device_hash = COALESCE(EXCLUDED.media_device_hash, fingerprint_dna.media_device_hash)
        `;
      }

      // 2. Upsert visitor profile with full forensic payload
      await sql`
        INSERT INTO visitor_profiles (
          visitor_id, ip_address, browser, os, device_type, screen_size,
          country, city, region, isp, org, latitude, longitude,
          first_seen, last_seen, visit_count, is_owner, is_bot,
          fingerprint, gpu_vendor, gpu_renderer, cpu_cores, memory_estimate,
          max_touch_points, timezone_offset, device_model,
          timezone_name, languages, platform, network_downlink,
          hardware_hash, local_ips, font_hash, media_device_hash,
          battery_level, battery_charging, tab_visibility, network_rtt
        )
        VALUES (
          ${visitorId}, ${ip}, ${browser.name || "Unknown"}, ${os.name || "Unknown"},
          ${device.type || "desktop"}, ${screenResolution || "Unknown"},
          ${loc.country}, ${loc.city}, ${loc.region || "Unknown"}, ${loc.isp || "Unknown"}, ${loc.org || "Unknown"},
          ${loc.lat || 0}, ${loc.lon || 0},
          NOW(), NOW(), 1, FALSE, ${isBot},
          ${forensics?.fingerprint || null},
          ${forensics?.gpu_vendor || null},
          ${forensics?.gpu_renderer || null},
          ${forensics?.cpu_cores || null},
          ${forensics?.memory_estimate || null},
          ${forensics?.max_touch_points || null},
          ${forensics?.timezone_offset || null},
          ${forensics?.device_model || device.model || null},
          ${forensics?.timezone_name || null},
          ${forensics?.languages || null},
          ${forensics?.platform || null},
          ${forensics?.network_downlink || null},
          ${forensics?.fingerprint || null},
          ${forensics?.local_ips ? JSON.stringify(forensics.local_ips) : null},
          ${forensics?.font_hash || null},
          ${forensics?.media_device_hash || null},
          ${forensics?.battery_level ?? null},
          ${forensics?.battery_charging ?? null},
          ${forensics?.tab_visibility || null},
          ${forensics?.network_rtt || null}
        )
        ON CONFLICT (visitor_id) DO UPDATE SET
          last_seen         = NOW(),
          visit_count       = visitor_profiles.visit_count + 1,
          ip_address        = EXCLUDED.ip_address,
          city              = EXCLUDED.city,
          country           = EXCLUDED.country,
          region            = EXCLUDED.region,
          latitude          = EXCLUDED.latitude,
          longitude         = EXCLUDED.longitude,
          browser           = EXCLUDED.browser,
          os                = EXCLUDED.os,
          is_bot            = EXCLUDED.is_bot,
          fingerprint       = COALESCE(EXCLUDED.fingerprint, visitor_profiles.fingerprint),
          gpu_vendor        = COALESCE(EXCLUDED.gpu_vendor, visitor_profiles.gpu_vendor),
          gpu_renderer      = COALESCE(EXCLUDED.gpu_renderer, visitor_profiles.gpu_renderer),
          device_model      = COALESCE(EXCLUDED.device_model, visitor_profiles.device_model),
          timezone_name     = COALESCE(EXCLUDED.timezone_name, visitor_profiles.timezone_name),
          languages         = COALESCE(EXCLUDED.languages, visitor_profiles.languages),
          platform          = COALESCE(EXCLUDED.platform, visitor_profiles.platform),
          network_downlink  = COALESCE(EXCLUDED.network_downlink, visitor_profiles.network_downlink),
          hardware_hash     = COALESCE(EXCLUDED.hardware_hash, visitor_profiles.hardware_hash),
          local_ips         = COALESCE(EXCLUDED.local_ips, visitor_profiles.local_ips),
          font_hash         = COALESCE(EXCLUDED.font_hash, visitor_profiles.font_hash),
          media_device_hash = COALESCE(EXCLUDED.media_device_hash, visitor_profiles.media_device_hash),
          battery_level     = COALESCE(EXCLUDED.battery_level, visitor_profiles.battery_level),
          battery_charging  = COALESCE(EXCLUDED.battery_charging, visitor_profiles.battery_charging),
          tab_visibility    = COALESCE(EXCLUDED.tab_visibility, visitor_profiles.tab_visibility),
          network_rtt       = COALESCE(EXCLUDED.network_rtt, visitor_profiles.network_rtt)
      `;

      // 3. Log session
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
          ip_address     = EXCLUDED.ip_address,
          network_type   = EXCLUDED.network_type
      `;

      // 4. Persist WebRTC local IPs to network_reputation table (BUG-06)
      if (forensics?.local_ips && forensics.local_ips.length > 0) {
        for (const localIp of forensics.local_ips.slice(0, 5)) {
          await sql`
            INSERT INTO network_reputation (ip_address, is_local_ip, subnet, first_seen, last_checked)
            VALUES (
              ${localIp}::INET,
              TRUE,
              ${localIp.split(".").slice(0, 3).join(".") + ".0/24"},
              NOW(),
              NOW()
            )
            ON CONFLICT (ip_address) DO UPDATE SET
              last_checked = NOW(),
              is_local_ip  = TRUE
          `.catch(() => {}); // INET cast may fail on malformed IPs — non-fatal
        }
      }

      // 5. Log initial page view
      await sql`
        INSERT INTO visitor_events (session_uuid, event_type, path, timestamp)
        SELECT id, 'page_view', ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      console.log(`[Analytics] Success init for ${sessionId}`);

      // 6. Respond immediately, then broadcast (no more setTimeout race condition — BUG-07)
      res.status(200).json({ success: true });

      runBackground(() =>
        broadcast("ANALYTICS:SIGNAL", {
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
        })
      );

      return;
    }

    // =========================================================
    // ACTION: event
    // =========================================================
    if (action === "event") {
      const parsed = eventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const { sessionId, type, label, value, path } = parsed.data;

      await sql`
        INSERT INTO visitor_events (session_uuid, event_type, event_label, event_value, path, timestamp)
        SELECT id, ${type}, ${label || ""}, ${value || ""}, ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      res.status(200).json({ success: true });

      runBackground(() =>
        broadcast("ANALYTICS:SIGNAL", {
          type: "EVENT",
          sessionId,
          eventType: type,
          label,
          value,
          path,
          timestamp: new Date().toISOString(),
        })
      );

      return;
    }

    // =========================================================
    // ACTION: heartbeat
    // =========================================================
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

        if (biometrics) {
          // Normalize entropy_score: accept both 0-100 (legacy) and 0-1 (current).
          // If value > 1 it was sent in 0-100 range — divide by 100 (BUG-11)
          const rawEntropy = biometrics.entropy_score ?? 0;
          const normalizedEntropy = rawEntropy > 1 ? Math.min(rawEntropy / 100, 1.0) : Math.max(rawEntropy, 0);
          const is_bot_suspect = normalizedEntropy < 0.2;

          await sql`
            INSERT INTO behavioral_biometrics (
              session_id, session_uuid, avg_mouse_velocity, typing_cadence_ms,
              entropy_score, is_bot_verified
            )
            SELECT
              ${sessionId},
              id,
              ${biometrics.mouse_velocity || 0},
              ${biometrics.typing_cadence_ms || 0},
              ${normalizedEntropy},
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

      res.status(200).json({ success: true });

      runBackground(() =>
        broadcast("ANALYTICS:SIGNAL", {
          type: "HEARTBEAT",
          sessionId,
          visitorId,
          timestamp: new Date().toISOString(),
        })
      );

      return;
    }

    // =========================================================
    // ACTION: pageview
    // =========================================================
    if (action === "pageview") {
      const parsed = pageviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid payload schema" });
      }

      const { sessionId, path } = parsed.data;

      await sql`
        INSERT INTO visitor_events (session_uuid, event_type, path, timestamp)
        SELECT id, 'page_view', ${path || "/"}, NOW()
        FROM visitor_sessions WHERE session_id = ${sessionId}
      `;

      res.status(200).json({ success: true });

      runBackground(() =>
        broadcast("ANALYTICS:SIGNAL", {
          type: "PAGE_VIEW",
          sessionId,
          path,
          timestamp: new Date().toISOString(),
        })
      );

      return;
    }

    // =========================================================
    // ACTION: identify
    // =========================================================
    if (action === "identify") {
      const parsed = identifySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid identify payload" });
      }

      const { visitorId, sessionId, email, name, source } = parsed.data;

      // A. Upsert known_entities
      const entities = await sql`
        INSERT INTO known_entities (real_name, email, role, notes, aliases)
        VALUES (
          ${name || "Unknown"},
          ${email.toLowerCase()},
          'Contact Candidate',
          ${`Auto-resolved via ${source || "autofill"} at ${new Date().toISOString()}`},
          ${name ? [name] : []}::VARCHAR[]
        )
        ON CONFLICT (email) DO UPDATE SET
          real_name = CASE
            WHEN known_entities.real_name = 'Unknown' THEN EXCLUDED.real_name
            ELSE known_entities.real_name
          END,
          aliases = (
            SELECT ARRAY(
              SELECT DISTINCT alias_val
              FROM unnest(
                array_append(known_entities.aliases, ${name || null}::VARCHAR)
              ) AS alias_val
              WHERE alias_val IS NOT NULL AND alias_val != 'Unknown'
            )
          ),
          updated_at = NOW()
        RETURNING entity_id
      `;

      if (entities.length === 0 || !visitorId) {
        return res.status(200).json({ success: true });
      }

      const entityId = entities[0].entity_id;

      // B. Link current visitor profile
      await sql`
        UPDATE visitor_profiles
        SET likely_entity_id = ${entityId}
        WHERE visitor_id = ${visitorId}
          AND likely_entity_id IS NULL
      `;

      // C. Compute confidence score with time-decay
      const BASE_WEIGHTS = { autofill: 0.3, form_submit: 0.5, manual: 0.4, autofill_nav: 0.25 };
      const baseWeight = BASE_WEIGHTS[source || "autofill"] || 0.3;

      const correlationStats = await sql`
        SELECT
          COUNT(DISTINCT hardware_hash) FILTER (WHERE hardware_hash IS NOT NULL) as device_count,
          COUNT(DISTINCT ip_address)    FILTER (WHERE ip_address IS NOT NULL) as ip_count
        FROM visitor_profiles
        WHERE likely_entity_id = ${entityId}
      `;

      const deviceBonus = Math.min((correlationStats[0]?.device_count || 0) * 0.15, 0.3);
      const ipBonus     = Math.min((correlationStats[0]?.ip_count || 0) * 0.05, 0.1);

      // Time-decay: fetch last signal timestamp to compute staleness penalty.
      // Half-life of 30 days: signals older than 30 days lose 50% weight, 60 days = 75%, etc.
      const HALF_LIFE_DAYS = 30;
      let decayFactor = 1.0;

      const lastSignal = await sql`
        SELECT MAX(created_at) as latest
        FROM identity_signals
        WHERE entity_id = ${entityId}
          AND signal_type != ${source || "autofill"}
      `.catch(() => []);

      if (lastSignal.length > 0 && lastSignal[0].latest) {
        const daysSinceLastSignal = (Date.now() - new Date(lastSignal[0].latest).getTime()) / (1000 * 60 * 60 * 24);
        // Exponential decay: factor = 2^(-days/half_life)
        decayFactor = Math.pow(2, -(daysSinceLastSignal / HALF_LIFE_DAYS));
        decayFactor = Math.max(decayFactor, 0.1); // Floor at 10% — never fully zero out
      }

      const rawConfidence = baseWeight + deviceBonus + ipBonus;
      const newConfidence = Math.min(rawConfidence * decayFactor, 1.0);

      // D. Log identity signal (use visitor_id string for traceability — BUG-03 clarified)
      await sql`
        INSERT INTO identity_signals (entity_id, visitor_id, signal_type, signal_weight, signal_value)
        VALUES (
          ${entityId},
          ${visitorId},
          ${source || "autofill"},
          ${baseWeight},
          ${JSON.stringify({ email: email.toLowerCase(), source: source || "autofill" })}
        )
      `.catch(() => {});

      // E. Update entity metadata + confidence
      await sql`
        UPDATE known_entities SET
          confidence_score = GREATEST(confidence_score, ${newConfidence}),
          last_seen        = NOW(),
          total_visits     = (
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

      // F. Record confidence in signal_history
      await sql`
        INSERT INTO signal_history (entity_id, confidence, trigger_type, visitor_id, notes)
        VALUES (
          ${entityId},
          ${newConfidence},
          ${source || "autofill"},
          ${visitorId},
          ${`base=${baseWeight.toFixed(2)} device_bonus=${deviceBonus.toFixed(2)} ip_bonus=${ipBonus.toFixed(2)} decay=${decayFactor.toFixed(3)}`}
        )
      `.catch(() => {});

      // G. Log identity_resolved event in visitor_events
      if (sessionId) {
        await sql`
          INSERT INTO visitor_events (session_uuid, event_type, event_label, event_value, path, timestamp)
          SELECT id, 'identity_resolved', ${`autofill:${source || "autofill"}`}, ${email.toLowerCase()}, '/contact', NOW()
          FROM visitor_sessions WHERE session_id = ${sessionId}
          ON CONFLICT DO NOTHING
        `.catch(() => {});
      }

      // H. Respond immediately — retroactive sweep and broadcast are non-blocking (BUG-07, BUG-09)
      res.status(200).json({ success: true });

      // I. Retroactive God Mode sweep — runs AFTER response (BUG-09 fix)
      runBackground(async () => {
        const hardwareRows = await sql`
          SELECT hardware_hash FROM visitor_profiles
          WHERE visitor_id = ${visitorId}
            AND hardware_hash IS NOT NULL
          LIMIT 1
        `;

        if (hardwareRows.length > 0 && hardwareRows[0].hardware_hash) {
          const hwHash = hardwareRows[0].hardware_hash;

          const retroUpdate = await sql`
            UPDATE visitor_profiles
            SET likely_entity_id = ${entityId}
            WHERE hardware_hash = ${hwHash}
              AND likely_entity_id IS NULL
            RETURNING visitor_id
          `;

          if (retroUpdate.length > 0) {
            console.log(
              `[Identity] AUTOFILL GOD MODE: Retroactively linked ${retroUpdate.length} profile(s) to ${email}`
            );

            // Record retroactive sweep in signal_history
            await sql`
              INSERT INTO signal_history (entity_id, confidence, trigger_type, visitor_id, notes)
              VALUES (
                ${entityId},
                ${newConfidence},
                'retroactive',
                ${visitorId},
                ${`Retroactive sweep linked ${retroUpdate.length} profile(s) via hardware_hash`}
              )
            `.catch(() => {});
          }

          // J. Upsert identity_clusters with correct schema (BUG-01 fix)
          await sql`
            INSERT INTO identity_clusters (entity_id, cluster_key, cluster_type, member_count, last_updated)
            VALUES (${entityId}, ${hwHash}, 'hardware', 1, NOW())
            ON CONFLICT (entity_id, cluster_key) DO UPDATE SET
              member_count  = identity_clusters.member_count + 1,
              last_updated  = NOW()
          `.catch(() => {});
        }

        // K. Cross-session stitching: find visitors sharing 4+ matching signals not yet linked
        await sql`
          WITH current_profile AS (
            SELECT hardware_hash, ip_address, timezone_name, platform, gpu_renderer
            FROM visitor_profiles
            WHERE visitor_id = ${visitorId}
            LIMIT 1
          ),
          signal_matches AS (
            SELECT
              vp.visitor_id,
              vp.id,
              (
                (CASE WHEN vp.hardware_hash = cp.hardware_hash AND cp.hardware_hash IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN vp.ip_address = cp.ip_address AND cp.ip_address IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN vp.timezone_name = cp.timezone_name AND cp.timezone_name IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN vp.platform = cp.platform AND cp.platform IS NOT NULL THEN 1 ELSE 0 END) +
                (CASE WHEN vp.gpu_renderer = cp.gpu_renderer AND cp.gpu_renderer IS NOT NULL THEN 1 ELSE 0 END)
              ) AS match_score
            FROM visitor_profiles vp, current_profile cp
            WHERE vp.visitor_id != ${visitorId}
              AND vp.likely_entity_id IS NULL
              AND vp.is_owner = FALSE
          )
          UPDATE visitor_profiles
          SET likely_entity_id = ${entityId}
          WHERE id IN (
            SELECT id FROM signal_matches WHERE match_score >= 4
          )
        `.catch(() => {});

        // L. Broadcast identity resolution event on both channels
        const identityPayload = {
          type: "IDENTITY_RESOLVED",
          method: source || "autofill",
          email,
          name: name || null,
          entityId,
          visitorId,
          confidence: newConfidence,
          timestamp: new Date().toISOString(),
        };
        await broadcast("ANALYTICS:SIGNAL", identityPayload);
        await broadcast("ANALYTICS:IDENTITY_RESOLVED", identityPayload);
      });

      console.log(
        `[Identity] Resolved: ${email} -> entity ${entityId} | confidence: ${newConfidence.toFixed(2)}`
      );

      return;
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    console.error("[Analytics] Tracker Error:", error.message);
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).json({
        error: "INTERNAL_TRACKER_ERROR",
        message: error.message,
      });
    }
  }
}
