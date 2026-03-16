/**
 * RealtimeService: Frontend Connection Engine
 *
 * Manages the raw SSE (EventSource) connection to the backend.
 * Normalizes connection lifecycle events into a standard pub/sub interface.
 * Uses native EventTarget for zero-dependency internal event routing.
 *
 * The UI never touches this directly. It is consumed via useTelemetry().
 *
 * Connection Recovery:
 *   EventSource natively auto-reconnects with exponential backoff.
 *   We normalize the lifecycle events for the UI layer.
 */

const SSE_ENDPOINT = "/api/realtime/stream";
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 20;

class RealtimeService {
  constructor() {
    /** @type {EventSource | null} */
    this._source = null;
    this._listeners = new Map(); // channel -> Set<callback>
    this._status = "disconnected"; // disconnected | connecting | connected
    this._statusListeners = new Set();
    this._reconnectAttempts = 0;
    this._reconnectTimer = null;
    this._destroyed = false;
  }

  /**
   * Open the SSE connection.
   * Safe to call multiple times -- will no-op if already connected.
   */
  connect() {
    if (this._destroyed) return;
    if (this._source) return; // Already connected or connecting

    this._setStatus("connecting");

    const source = new EventSource(SSE_ENDPOINT, {
      withCredentials: true, // Send HttpOnly cookie for auth
    });

    source.onopen = () => {
      this._reconnectAttempts = 0;
      this._setStatus("connected");
      console.log("  [Telemetry] SSE uplink established");
    };

    source.onerror = () => {
      // EventSource auto-reconnects, but we track state for the UI
      if (source.readyState === EventSource.CLOSED) {
        this._setStatus("disconnected");
        this._source = null;
        this._attemptReconnect();
      } else {
        // readyState === CONNECTING -- browser is auto-reconnecting
        this._setStatus("connecting");
      }
    };

    // Listen for the backend's initial confirmation event
    source.addEventListener("SYSTEM:CONNECTED", (e) => {
      try {
        const data = JSON.parse(e.data);
        this._dispatch("SYSTEM:CONNECTED", data);
      } catch {}
    });

    // Listen for heartbeat keep-alive events
    source.addEventListener("SYSTEM:HEARTBEAT", () => {
      // Heartbeat received -- connection is alive. No action needed.
    });

    // Register all known event channels.
    // SSE requires explicit addEventListener for named events.
    const channels = [
      "ANALYTICS:SIGNAL",
      "ANALYTICS:IDENTITY_RESOLVED",
      "MESSAGES:NEW_INQUIRY",
      "AI:GENERATION_STARTED",
      "AI:STAGE_COMPLETE",
      "AI:GENERATION_FINISHED",
      "ADMIN:POSTS_CHANGED",
      "SYSTEM:CACHE_PURGE",
    ];

    for (const channel of channels) {
      source.addEventListener(channel, (e) => {
        try {
          const data = JSON.parse(e.data);
          this._dispatch(channel, data);
        } catch {}
      });
    }

    this._source = source;
  }

  /**
   * Attempt reconnection with backoff.
   */
  _attemptReconnect() {
    if (this._destroyed) return;
    if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.warn("  [Telemetry] Max reconnect attempts reached. Giving up.");
      return;
    }

    this._reconnectAttempts++;
    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(1.5, this._reconnectAttempts - 1),
      30000
    );

    console.log(
      `  [Telemetry] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this._reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    );

    this._reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Close the SSE connection and clean up.
   */
  disconnect() {
    if (this._source) {
      this._source.close();
      this._source = null;
    }
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    this._setStatus("disconnected");
    console.log("  [Telemetry] SSE uplink severed");
  }

  /**
   * Permanently destroy this service instance.
   */
  destroy() {
    this._destroyed = true;
    this.disconnect();
    this._listeners.clear();
    this._statusListeners.clear();
  }

  /**
   * Subscribe to a named event channel.
   * @param {string} channel - Event name (e.g., "ANALYTICS:SIGNAL")
   * @param {function} callback - Handler function receiving the parsed data
   * @returns {function} unsubscribe function
   */
  on(channel, callback) {
    if (!this._listeners.has(channel)) {
      this._listeners.set(channel, new Set());
    }
    this._listeners.get(channel).add(callback);

    // Return unsubscribe function
    return () => {
      const set = this._listeners.get(channel);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this._listeners.delete(channel);
      }
    };
  }

  /**
   * Subscribe to connection status changes.
   * @param {function} callback - Receives status string: "connected" | "connecting" | "disconnected"
   * @returns {function} unsubscribe function
   */
  onStatusChange(callback) {
    this._statusListeners.add(callback);
    // Immediately fire with current status
    callback(this._status);
    return () => this._statusListeners.delete(callback);
  }

  /**
   * Get current connection status.
   */
  get status() {
    return this._status;
  }

  /**
   * Get whether the connection is currently active.
   */
  get isConnected() {
    return this._status === "connected";
  }

  // --- Internal ---

  _setStatus(status) {
    if (this._status === status) return;
    this._status = status;
    for (const cb of this._statusListeners) {
      try {
        cb(status);
      } catch {}
    }
  }

  _dispatch(channel, data) {
    const listeners = this._listeners.get(channel);
    if (!listeners) return;
    for (const cb of listeners) {
      try {
        cb(data);
      } catch (err) {
        console.error(`  [Telemetry] Listener error on ${channel}:`, err);
      }
    }
  }
}

// Singleton -- shared across all React components via useTelemetry
const realtimeService = new RealtimeService();
export default realtimeService;
