/**
 * SSE Stream Registry
 *
 * Manages active Server-Sent Event client connections.
 * Handles:
 *   - Client registration with unique IDs
 *   - Broadcasting messages to all connected clients
 *   - Automatic cleanup on client disconnect (prevents ghost connection memory leak)
 *   - Connection health monitoring
 */

import crypto from "crypto";

const MAX_CLIENTS = 50; // Safety ceiling for admin SSE connections

class StreamRegistry {
  constructor() {
    /** @type {Map<string, {res: import('http').ServerResponse, connectedAt: number}>} */
    this._clients = new Map();
  }

  /**
   * Register a new SSE client connection.
   * @param {import('http').ServerResponse} res - The HTTP response object to hold open
   * @returns {string} clientId - Unique identifier for this connection
   */
  addClient(res) {
    if (this._clients.size >= MAX_CLIENTS) {
      // Evict oldest connection to prevent unbounded growth
      const oldestKey = this._clients.keys().next().value;
      this.removeClient(oldestKey);
      console.warn(
        `  [SSE Registry] Max clients (${MAX_CLIENTS}) reached. Evicted oldest.`
      );
    }

    const clientId = crypto.randomUUID();

    this._clients.set(clientId, {
      res,
      connectedAt: Date.now(),
    });

    // CRITICAL: Listen for client disconnect to prevent ghost connection memory leak.
    // When the browser tab closes, the TCP connection drops but Node keeps the res object
    // alive in memory indefinitely unless we explicitly clean it up here.
    res.on("close", () => {
      this.removeClient(clientId);
    });

    console.log(
      `  [SSE Registry] Client connected: ${clientId.slice(0, 8)} (total: ${this._clients.size})`
    );
    return clientId;
  }

  /**
   * Remove a client connection from the registry.
   */
  removeClient(clientId) {
    const client = this._clients.get(clientId);
    if (client) {
      // Attempt to end the response if it hasn't been closed yet
      try {
        if (!client.res.writableEnded) {
          client.res.end();
        }
      } catch {
        // Already closed, ignore
      }
      this._clients.delete(clientId);
      console.log(
        `  [SSE Registry] Client disconnected: ${clientId.slice(0, 8)} (total: ${this._clients.size})`
      );
    }
  }

  /**
   * Write an SSE-formatted message to ALL connected clients.
   * @param {string} eventName - The SSE event name (maps to EventSource.addEventListener)
   * @param {object} data - JSON-serializable payload
   */
  broadcastAll(eventName, data) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

    for (const [clientId, client] of this._clients) {
      try {
        if (!client.res.writableEnded) {
          client.res.write(payload);
        } else {
          // Connection is dead but wasn't cleaned up -- fix it now
          this._clients.delete(clientId);
        }
      } catch {
        // Write failed -- client is gone
        this._clients.delete(clientId);
      }
    }
  }

  /**
   * Get current connection count (for health monitoring).
   */
  get size() {
    return this._clients.size;
  }

  /**
   * Destroy all connections and clear the registry.
   */
  destroyAll() {
    for (const [, client] of this._clients) {
      try {
        if (!client.res.writableEnded) client.res.end();
      } catch {
        // Already closed
      }
    }
    this._clients.clear();
    console.log("  [SSE Registry] All connections destroyed");
  }
}

// Singleton
const registry = new StreamRegistry();
export default registry;
