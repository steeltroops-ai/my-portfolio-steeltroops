/**
 * Hook for Intelligent Synchronization (The "Webhook" Simulator)
 *
 * STRATEGY:
 * 1. Checks a lightweight "Version/Timestamp" endpoint periodically (every 30s)
 * 2. Compares server versions with local cache versions
 * 3. Triggers targeted invalidations ONLY for changed content
 * 4. Stops all activity when tab is hidden
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blogQueryKeys } from "../features/blog/hooks/useBlogQueries";
import { cacheManager } from "../lib/cacheManager";

// --- Configuration ---
// "Real-time" polling interval (2 seconds)
// This is low enough to feel instant but high enough to avoid overwhelming the server
const SYNC_INTERVAL = 2000;
const API_URL = import.meta.env.VITE_API_URL || "";

// --- Helper: Safe Fetch ---
const fetchVersion = async (resource) => {
  try {
    // We append a query param to ask specifically for a lightweight version check
    // If backend doesn't support it, we fallback to a small limit query
    let url = `${API_URL}/api/${resource}?version_check=true&limit=1`;

    // For analytics, we check the stats endpoint
    if (resource === "analytics") {
      url = `${API_URL}/api/analytics/stats?version_check=true`;
    }

    const res = await fetch(url, {
      method: "GET",
      credentials: "include", // Use HttpOnly Cookie
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
};

export const useSmartSync = () => {
  const queryClient = useQueryClient();
  const versionsRef = useRef({
    posts: null,
    messages: null,
    analytics: null,
  });

  useEffect(() => {
    // 1. Initial Sync on Mount
    const sync = async () => {
      // Don't sync if tab is hidden (save battery/data)
      if (document.visibilityState === "hidden") return;

      console.log("[SmartSync] Checking for updates...");

      // --- A. Sync Messages ---
      const msgData = await fetchVersion("contact");
      // Logic: If the total count or latest ID changed, invalidate
      if (msgData?.data) {
        const latestMsg = msgData.data[0];
        const serverVersion = latestMsg
          ? `${latestMsg.id}-${msgData.count || 0}`
          : "0";

        if (
          versionsRef.current.messages &&
          versionsRef.current.messages !== serverVersion
        ) {
          console.log("[SmartSync] New messages detected! Refreshing...");
          queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
          queryClient.invalidateQueries({
            queryKey: ["contactMessages", "unread"],
          });
        }
        versionsRef.current.messages = serverVersion;
      }

      // --- B. Sync Blog Posts ---
      const postData = await fetchVersion("posts");
      if (postData?.data) {
        const latestPost = postData.data[0];
        // Create a hash of the latest post ID + Updated At
        const serverVersion = latestPost
          ? `${latestPost.id}-${latestPost.updated_at}`
          : "0";

        if (
          versionsRef.current.posts &&
          versionsRef.current.posts !== serverVersion
        ) {
          console.log(
            "[SmartSync] content update detected! Refreshing Blog..."
          );
          queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
        }
        versionsRef.current.posts = serverVersion;
      }

      // --- C. Sync Analytics ---
      // specific logic: check total sessions count
      const analyticsData = await fetchVersion("analytics");
      if (analyticsData?.stats) {
        const serverHash = analyticsData.stats.totalSessions;
        if (
          versionsRef.current.analytics &&
          versionsRef.current.analytics !== serverHash
        ) {
          // Only invalidate the stats summary, not the heavy map unless needed
          queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
        }
        versionsRef.current.analytics = serverHash;
      }
    };

    // Run immediately and then interval
    sync();
    const intervalId = setInterval(sync, SYNC_INTERVAL);

    // Pause on blur, Resume on focus (Battery Friendly)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sync(); // Check immediately when user comes back
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [queryClient]);
};
