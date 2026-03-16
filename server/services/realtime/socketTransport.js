/**
 * Socket.io Transport Adapter (Optional)
 *
 * Implements the transport interface required by Broadcaster:
 *   { name: string, broadcast(channel, data): void, destroy(): void }
 *
 * Routes Broadcaster events to Socket.io admin_vault room.
 * Only active when Socket.io is initialized (local dev).
 * Falls back gracefully to no-op when io is not available.
 */

import { getIO } from "../../socket-hub.js";

const socketTransport = {
  name: "socket.io",

  broadcast(channel, data) {
    const io = getIO();
    if (!io) return; // Socket.io not initialized — skip silently
    io.to("admin_vault").emit(channel, data);
  },

  destroy() {
    // Socket.io lifecycle is managed by socket-hub.js — nothing to destroy here
  },
};

export default socketTransport;
