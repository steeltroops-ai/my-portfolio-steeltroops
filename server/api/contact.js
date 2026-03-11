import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth, checkRateLimit } from "./utils.js";

const sql = neon(process.env.DATABASE_URL || "");

function jsonResponse(res, data, status = 200) {
  res.status(status).json(data);
}

function errorResponse(res, message, status = 500) {
  res.status(status).json({ success: false, error: message });
}

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (!checkRateLimit(req)) {
    return res.status(429).json({ error: "Too many requests. Please wait." });
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { id, action, status, limit = 20, offset = 0 } = req.query;

  try {
    // POST - Submit contact message (public)
    if (req.method === "POST") {
      const {
        name,
        email,
        subject,
        message,
        visitorId,
        _hp,
        submissionDurationMs,
      } = req.body;

      // 0. Intelligent Bot Defense (Server-Side)
      // A. Honeypot Check: If _hp is set, it's a bot.
      if (_hp && _hp.length > 0) {
        console.warn(`[Bot Defense] Honeypot triggered by ${req.ip}`);
        // Return success to confuse the bot, but don't save anything.
        return jsonResponse(
          res,
          { success: true, message: "Message sent!" },
          200
        );
      }

      // B. Velocity Check: If submission was inhumanly fast (< 2s), flag it.
      // We allow a bit of buffer (e.g. 1s) for network latency variations, but < 500ms is definitely a bot.
      // Strict mode: < 2000ms from client.
      if (submissionDurationMs && parseInt(submissionDurationMs) < 1000) {
        console.warn(
          `[Bot Defense] Velocity check failed (${submissionDurationMs}ms) by ${req.ip}`
        );
        return errorResponse(
          res,
          "Suspicious activity detected. Please try again slowly.",
          400
        );
      }

      if (!name || !email || !subject || !message) {
        return errorResponse(res, "All fields are required", 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse(res, "Invalid email format", 400);
      }

      // 1. Save the message (Primary Action)
      const messages = await sql`
        INSERT INTO contact_messages (name, email, subject, message, status)
        VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${subject.trim()}, ${message.trim()}, 'unread')
        RETURNING *
      `;

      // Real-time broadcast for admin
      try {
        const { emitToAdmins } =
          await import("../services/realtime/broadcaster.js");
        emitToAdmins("MESSAGES:NEW_INQUIRY", {
          name: name.trim(),
          subject: subject.trim(),
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // Broadcast failed, ignore
      }

      // 2. Identity Resolution (The "God Mode" Binding)
      if (visitorId) {
        try {
          const { forensicData } = req.body;

          // A. Update current profile with latest forensics if provided
          if (forensicData) {
            await sql`
                UPDATE visitor_profiles SET
                    gpu_renderer = COALESCE(${forensicData.gpu_renderer}, gpu_renderer),
                    canvas_hash = COALESCE(${forensicData.canvas_hash}, canvas_hash),
                    screen_size = COALESCE(${forensicData.screen_resolution}, screen_size),
                    hardware_hash = COALESCE(${forensicData.fingerprint}, hardware_hash)
                WHERE visitor_id = ${visitorId}
              `;
          }

          // B. Create/Update Known Entity (Real Person)
          // We use email as the primary key for identity resolution
          const entities = await sql`
              INSERT INTO known_entities (real_name, email, linkedin_url, role, notes, aliases)
              VALUES (
                ${name.trim()}, 
                ${email.trim().toLowerCase()}, 
                null, 
                'Contact Inquiry', 
                'Auto-resolved via Contact Form',
                ${name.trim() ? [name.trim()] : []}::VARCHAR[]
              )
              ON CONFLICT (email) DO UPDATE SET 
                real_name = CASE WHEN EXCLUDED.real_name != '' THEN EXCLUDED.real_name ELSE known_entities.real_name END,
                aliases = (
                  SELECT ARRAY(
                    SELECT DISTINCT unnest(
                      array_append(known_entities.aliases, ${name.trim() || null}::VARCHAR)
                    ) WHERE unnest IS NOT NULL AND unnest != 'Unknown' AND unnest != ''
                  )
                ),
                updated_at = NOW()
              RETURNING entity_id
          `;

          if (entities.length > 0) {
            const entityId = entities[0].entity_id;
            console.log(`[Identity] Resolved Entity: ${entityId} (${email})`);

            // C. Link Current Visitor
            await sql`
                UPDATE visitor_profiles
                SET likely_entity_id = ${entityId}
                WHERE visitor_id = ${visitorId}
            `;

            // D. Retroactive "God Mode" Linkage
            // Find ALL profiles (past, present, future) that share the same hardware hash
            // and link them to this entity.
            let retroLinkedCount = 0;
            if (forensicData?.fingerprint) {
              const retroUpdate = await sql`
                UPDATE visitor_profiles
                SET likely_entity_id = ${entityId}
                WHERE hardware_hash = ${forensicData.fingerprint}
                AND likely_entity_id IS NULL
                RETURNING visitor_id
              `;
              retroLinkedCount = retroUpdate.length;
              if (retroLinkedCount > 0) {
                console.log(
                  `[Identity] GOD MODE: Retroactively linked ${retroLinkedCount} anonymous profiles to ${email}`
                );
              }
            }

            // E. Compute Confidence Score
            // form_submit = 0.5 base (confirmed human action)
            // +0.25 if hardware fingerprint corroborates device identity
            // +0.10 if visitor session is present (browsing context known)
            const confidenceScore = Math.min(
              1.0,
              0.5 +
                (forensicData?.fingerprint ? 0.25 : 0) +
                (visitorId ? 0.1 : 0)
            );

            // F. Update entity: confidence, last_seen, total_visits, resolution_sources
            await sql`
              UPDATE known_entities SET
                confidence_score = GREATEST(confidence_score, ${confidenceScore}),
                last_seen = NOW(),
                total_visits = total_visits + 1,
                resolution_sources = ARRAY(
                  SELECT DISTINCT unnest(
                    array_append(COALESCE(resolution_sources, ARRAY[]::TEXT[]), 'form_submit')
                  )
                )
              WHERE entity_id = ${entityId}
            `;

            // G. Log identity signal (immutable audit trail)
            await sql`
              INSERT INTO identity_signals
                (entity_id, visitor_id, signal_type, signal_weight, signal_value)
              VALUES (
                ${entityId},
                (SELECT id FROM visitor_profiles WHERE visitor_id = ${visitorId} LIMIT 1),
                'form_submit',
                ${confidenceScore},
                ${JSON.stringify({ email, name: name.trim(), source: "contact_form" })}
              )
            `;

            // H. Upsert identity cluster (group profiles by hardware fingerprint)
            if (forensicData?.fingerprint) {
              await sql`
                INSERT INTO identity_clusters
                  (entity_id, cluster_key, cluster_type, member_count)
                VALUES (${entityId}, ${forensicData.fingerprint}, 'hardware', 1)
                ON CONFLICT (entity_id, cluster_key) DO UPDATE SET
                  member_count = identity_clusters.member_count + 1,
                  last_updated = NOW()
              `;
            }

            // I. Log identity_resolved visitor event
            const sessionRows = await sql`
              SELECT s.id FROM visitor_sessions s
              JOIN visitor_profiles p ON s.visitor_uuid = p.id
              WHERE p.visitor_id = ${visitorId}
              ORDER BY s.start_time DESC LIMIT 1
            `;
            if (sessionRows.length > 0) {
              await sql`
                INSERT INTO visitor_events
                  (session_uuid, event_type, event_label, event_value, path)
                VALUES (
                  ${sessionRows[0].id},
                  'identity_resolved',
                  'form_submit',
                  ${JSON.stringify({ entityId, email, confidenceScore })},
                  '/contact'
                )
              `;
            }

            // J. Broadcast real-time IDENTITY_RESOLVED to admin dashboard
            try {
              const { emitToAdmins: emitIdentity } =
                await import("../services/realtime/broadcaster.js");
              emitIdentity("ANALYTICS:SIGNAL", {
                type: "IDENTITY_RESOLVED",
                entityId,
                name: name.trim(),
                email,
                confidenceScore,
                retroLinkedCount,
                source: "contact_form",
              });
            } catch {
              // Non-blocking: broadcast failure must never break the contact submission
            }
          }
        } catch (identityError) {
          // Non-blocking error
          console.warn(
            "[Identity] Resolution check failed:",
            identityError.message
          );
        }
      }

      return jsonResponse(
        res,
        {
          success: true,
          data: messages[0],
          message: "Message sent successfully!",
        },
        201
      );
    }

    // GET - Get messages (admin only)
    if (req.method === "GET") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset);

      let messages;
      if (status && status !== "all") {
        messages = await sql`
          SELECT * FROM contact_messages 
          WHERE status = ${status}
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      } else {
        messages = await sql`
          SELECT * FROM contact_messages 
          ORDER BY created_at DESC 
          LIMIT ${limitNum} OFFSET ${offsetNum}
        `;
      }

      const countResult =
        await sql`SELECT COUNT(*) as count FROM contact_messages`;

      return jsonResponse(res, {
        success: true,
        data: messages,
        count: parseInt(countResult[0].count),
      });
    }

    // PUT - Update message status (admin only)
    if (req.method === "PUT") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Message ID required", 400);
      }

      const allowedActions = ["read", "replied", "archive"];
      if (!action || !allowedActions.includes(action)) {
        return errorResponse(
          res,
          "Invalid action. Must be read, replied, or archive.",
          400
        );
      }

      const newStatus = action === "archive" ? "archived" : action;

      const { notes } = req.body || {};

      const messages = await sql`
        UPDATE contact_messages SET
          status = ${newStatus},
          admin_notes = COALESCE(${notes}, admin_notes),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

      if (messages.length === 0) {
        return errorResponse(res, "Message not found", 404);
      }

      return jsonResponse(res, { success: true, data: messages[0] });
    }

    // DELETE - Delete message (admin only)
    if (req.method === "DELETE") {
      const session = await verifyAuth(req, sql);
      if (!session || session.role !== "admin") {
        return errorResponse(res, "Unauthorized", 401);
      }

      if (!id) {
        return errorResponse(res, "Message ID required", 400);
      }

      await sql`DELETE FROM contact_messages WHERE id = ${id}`;
      return jsonResponse(res, { success: true });
    }

    return errorResponse(res, "Method not allowed", 405);
  } catch (error) {
    console.error("Contact API error:", error);
    return errorResponse(res, error.message || "Internal server error", 500);
  }
}
