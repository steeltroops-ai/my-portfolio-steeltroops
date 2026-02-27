/**
 * Broadcaster: Central Nervous System for Real-Time Events
 *
 * All backend code calls Broadcaster.emit(channel, data).
 * The Broadcaster routes to all registered transports (SSE, and optionally Socket.io).
 * This is the ONLY file backend API routes need to import for real-time functionality.
 *
 * Architecture:
 *   track.js / posts.js / contact.js
 *         |
 *         v
 *   Broadcaster.emit("ANALYTICS:SIGNAL", payload)
 *         |
 *         +---> SSE Registry (streamRegistry.js) ---> EventSource clients
 *         +---> Socket.io (socket-hub.js) [optional, disabled by default]
 */
import { EventEmitter } from "events";

const HEARTBEAT_INTERVAL_MS = 25000;
const MAX_LISTENERS = 200;

class RealtimeBroadcaster extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(MAX_LISTENERS);
    this._transports = [];
    this._heartbeatTimer = null;
    this._started = false;
  }

  /**
   * Register a transport adapter.
   * Each transport must implement: { name: string, broadcast(channel, data): void, destroy(): void }
   */
  registerTransport(transport) {
    if (!transport?.name || typeof transport.broadcast !== "function") {
      throw new Error(
        `Invalid transport: must have 'name' (string) and 'broadcast' (function). Got: ${JSON.stringify(transport)}`
      );
    }
    this._transports.push(transport);
    console.log(`  [Broadcaster] Transport registered: ${transport.name}`);
  }

  /**
   * Remove a transport by name.
   */
  removeTransport(name) {
    const idx = this._transports.findIndex((t) => t.name === name);
    if (idx !== -1) {
      const t = this._transports.splice(idx, 1)[0];
      if (typeof t.destroy === "function") t.destroy();
      console.log(`  [Broadcaster] Transport removed: ${name}`);
    }
  }

  /**
   * Start the heartbeat keep-alive loop.
   * This prevents proxy timeouts (Nginx/Cloudflare 60s idle kill).
   */
  start() {
    if (this._started) return;
    this._started = true;

    this._heartbeatTimer = setInterval(() => {
      this._broadcastToTransports("SYSTEM:HEARTBEAT", {
        type: "ping",
        ts: Date.now(),
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Prevent timer from keeping the process alive
    if (this._heartbeatTimer.unref) this._heartbeatTimer.unref();

    console.log(
      `  [Broadcaster] Started (heartbeat every ${HEARTBEAT_INTERVAL_MS / 1000}s)`
    );
  }

  /**
   * Stop the broadcaster and destroy all transports.
   */
  stop() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
    for (const t of this._transports) {
      if (typeof t.destroy === "function") t.destroy();
    }
    this._transports = [];
    this._started = false;
    console.log("  [Broadcaster] Stopped");
  }

  /**
   * Emit an event to all connected admin clients.
   * This is the ONLY method backend API routes should call.
   */
  broadcast(channel, data) {
    this._broadcastToTransports(channel, data);
  }

  /**
   * Internal: route to all registered transports.
   */
  _broadcastToTransports(channel, data) {
    for (const transport of this._transports) {
      try {
        transport.broadcast(channel, data);
      } catch (err) {
        console.error(
          `  [Broadcaster] Transport '${transport.name}' error:`,
          err.message
        );
      }
    }
  }
}

// Singleton instance -- shared across all API routes via import
const broadcaster = new RealtimeBroadcaster();

export default broadcaster;

/**
 * Drop-in replacement for the old `emitToAdmins` function.
 * Backend API routes can simply change their import path.
 *
 *   BEFORE: import { emitToAdmins } from "../socket-hub.js";
 *   AFTER:  import { emitToAdmins } from "../services/realtime/broadcaster.js";
 */
export const emitToAdmins = (channel, data) => {
  broadcaster.broadcast(channel, data);
};
