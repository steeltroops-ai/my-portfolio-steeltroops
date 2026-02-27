/**
 * SSE Transport Adapter
 *
 * Implements the transport interface required by Broadcaster:
 *   { name: string, broadcast(channel, data): void, destroy(): void }
 *
 * Routes all Broadcaster events to the SSE StreamRegistry,
 * which writes them to all connected admin EventSource clients.
 */

import registry from "./streamRegistry.js";

const sseTransport = {
  name: "sse",

  broadcast(channel, data) {
    registry.broadcastAll(channel, data);
  },

  destroy() {
    registry.destroyAll();
  },
};

export default sseTransport;
