/**
 * SSE Connect Endpoint: /api/realtime/stream
 *
 * Admin clients open an EventSource connection to this endpoint.
 * The endpoint:
 *   1. Verifies admin authentication via HttpOnly cookie
 *   2. Sets SSE headers (Content-Type, Cache-Control, Connection)
 *   3. Registers the response in the StreamRegistry
 *   4. Initializes the Broadcaster with SSE transport on first connection
 *
 * Security: Only authenticated admin users can connect.
 * The endpoint never closes the response -- it stays open until
 * the client disconnects (handled by StreamRegistry).
 */

import { neon } from "@neondatabase/serverless";
import { setCorsHeaders, verifyAuth } from "../utils.js";
import registry from "../../services/realtime/streamRegistry.js";
import broadcaster from "../../services/realtime/broadcaster.js";
import sseTransport from "../../services/realtime/sseTransport.js";

const sql = neon(process.env.DATABASE_URL || "");

// Ensure SSE transport is registered exactly once
let _transportInitialized = false;
function ensureTransport() {
  if (_transportInitialized) return;
  broadcaster.registerTransport(sseTransport);
  broadcaster.start();
  _transportInitialized = true;
}

export default async function handler(req, res) {
  setCorsHeaders(res, req);

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  // 1. Authenticate: only admins can open an SSE stream
  try {
    const session = await verifyAuth(req, sql);
    if (!session || session.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } catch (err) {
    return res.status(401).json({ error: "Auth failed" });
  }

  // 2. Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable Nginx response buffering
  });

  // 3. Send initial connection confirmation event
  res.write(
    `event: SYSTEM:CONNECTED\ndata: ${JSON.stringify({ status: "connected", ts: Date.now() })}\n\n`
  );

  // 4. Register this client in the stream registry
  ensureTransport();
  registry.addClient(res);

  // 5. Flush to ensure the browser receives the initial event immediately
  if (typeof res.flush === "function") res.flush();
}
