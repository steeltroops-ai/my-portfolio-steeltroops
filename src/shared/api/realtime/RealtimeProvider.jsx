/**
 * RealtimeProvider: React Context wrapper that manages the SSE connection lifecycle.
 *
 * Mounts at the app root (main.jsx). Opens the SSE connection when mounted,
 * closes it when unmounted. Provides connection status to child components
 * via context (optional -- useTelemetry works without it).
 *
 * Replaces SocketProvider in the component tree.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import realtimeService from "./RealtimeService";

const RealtimeContext = createContext({
  isConnected: false,
  status: "disconnected",
});

/**
 * Hook to access the real-time connection context.
 * Returns: { isConnected: boolean, status: string }
 */
export const useRealtime = () => useContext(RealtimeContext);

export const RealtimeProvider = ({ children }) => {
  const [status, setStatus] = useState("disconnected");
  const mountedRef = useRef(false);

  useEffect(() => {
    // Prevent double connection in React StrictMode
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Subscribe to status changes
    const unsubscribe = realtimeService.onStatusChange(setStatus);

    // Open the SSE connection
    realtimeService.connect();

    return () => {
      unsubscribe();
      realtimeService.disconnect();
      mountedRef.current = false;
    };
  }, []);

  const value = {
    isConnected: status === "connected",
    status,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

export default RealtimeProvider;
