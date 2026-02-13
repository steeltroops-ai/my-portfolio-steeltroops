import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Online/Offline Network Detector Hook
 * Automatically refetches queries when network comes back online.
 */
export const useOnlineStatus = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      console.log("Network restored -- refetching active queries...");
      // Only refetch queries that are currently mounted (active)
      // This prevents a thundering herd of requests on reconnect
      queryClient.invalidateQueries({ refetchType: "active" });
    };

    const handleOffline = () => {
      console.log("Network lost -- using cached data.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  return typeof navigator !== "undefined" ? navigator.onLine : true;
};

/**
 * Focus Refetch Hook
 * ==================
 * IMPORTANT: This hook is intentionally DISABLED when useSmartSync is active.
 * useSmartSync already handles visibility-based re-syncing with debouncing.
 * Having both active causes duplicate network requests.
 *
 * This hook is kept for pages that don't use useSmartSync (e.g. static pages).
 */
export const useFocusRefetch = (enabled = false) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        queryClient.invalidateQueries({ refetchType: "active" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, enabled]);
};
