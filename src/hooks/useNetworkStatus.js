import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Online/Offline Network Detector Hook
 * Automatically refetches queries when network comes back online
 */
export const useOnlineStatus = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Network connection restored - refetching data...");

      // Invalidate all queries to refetch fresh data
      queryClient.invalidateQueries();

      // Show user feedback (optional)
      if (typeof window !== "undefined" && window.showNotification) {
        window.showNotification(
          "You're back online! Refreshing content...",
          "success"
        );
      }
    };

    const handleOffline = () => {
      console.log("Network connection lost - using cached data");

      // Show user feedback (optional)
      if (typeof window !== "undefined" && window.showNotification) {
        window.showNotification(
          "You're offline. Showing cached content.",
          "info"
        );
      }
    };

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Log current status
    console.log(`Network status: ${navigator.onLine ? "online" : "offline"}`);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  return navigator.onLine;
};

/**
 * Focus Refetch Hook
 * Refetches data when user returns to tab (but only if online)
 */
export const useFocusRefetch = (enabled = true) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      // Only refetch if page becomes visible AND user is online
      if (!document.hidden && navigator.onLine) {
        console.log("Tab focused - checking for updates...");
        queryClient.invalidateQueries({
          refetchType: "active", // Only refetch queries that are currently being used
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient, enabled]);
};
