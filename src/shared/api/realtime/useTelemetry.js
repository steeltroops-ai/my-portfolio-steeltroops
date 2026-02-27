/**
 * useTelemetry: The ONLY hook React components should use for real-time events.
 *
 * Usage:
 *   useTelemetry("ANALYTICS:SIGNAL", (data) => {
 *     console.log("Got signal:", data);
 *   });
 *
 * This hook:
 *   1. Subscribes to a named channel on the RealtimeService singleton.
 *   2. Auto-unsubscribes on component unmount (prevents memory leaks).
 *   3. Uses a stable callback ref so the subscription doesn't churn on re-renders.
 */

import { useEffect, useRef } from "react";
import realtimeService from "./RealtimeService";

export const useTelemetry = (channel, callback) => {
  const callbackRef = useRef(callback);

  // Keep the callback ref fresh on every render without re-subscribing
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!channel) return;

    const handler = (data) => {
      callbackRef.current(data);
    };

    const unsubscribe = realtimeService.on(channel, handler);
    return unsubscribe;
  }, [channel]);
};

/**
 * useTelemetryStatus: Subscribe to connection status changes.
 *
 * Usage:
 *   const status = useTelemetryStatus(); // "connected" | "connecting" | "disconnected"
 */
import { useState } from "react";

export const useTelemetryStatus = () => {
  const [status, setStatus] = useState(realtimeService.status);

  useEffect(() => {
    const unsubscribe = realtimeService.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  return status;
};
