/**
 * Smart Sync Hook v2
 * ==================
 * Intelligent synchronization that detects content changes on the server
 * and triggers targeted React Query invalidations.
 *
 * Strategy:
 *   - Polls a lightweight endpoint every 30s (only when tab is visible)
 *   - Compares server state with local state using version hashes
 *   - Only invalidates specific query keys that actually changed
 *   - Pauses when tab is hidden (saves battery/data)
 *   - Deduplicates with useFocusRefetch (no double-fire)
 *
 * Previous version polled every 2s (30 req/min) -- that was way too
 * aggressive and wasted mobile data. 30s is the sweet spot.
 */

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { blogQueryKeys } from "../features/blog/hooks/useBlogQueries";
import { cacheManager } from "../lib/cacheManager";

// ---- Configuration ----

const POLL_INTERVAL = 30_000; // 30 seconds when tab is visible
const DEBOUNCE_MS = 2_000; // Min gap between syncs (protects against rapid visibility changes)
const API_URL = import.meta.env.VITE_API_URL || "";

// ---- Lightweight version-check fetcher ----

const fetchVersion = async (resource) => {
  try {
    let url;
    if (resource === "analytics") {
      url = `${API_URL}/api/analytics/stats?version_check=true`;
    } else {
      url = `${API_URL}/api/${resource}?version_check=true&limit=1`;
    }

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      // Prevent this check from being served from HTTP cache
      headers: { "Cache-Control": "no-cache" },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// ---- Hook ----

export const useSmartSync = () => {
  const queryClient = useQueryClient();
  const versionsRef = useRef({ posts: null, messages: null, analytics: null });
  const lastSyncRef = useRef(0);
  const intervalRef = useRef(null);

  const sync = useCallback(async () => {
    // Debounce: don't sync if we just synced
    const now = Date.now();
    if (now - lastSyncRef.current < DEBOUNCE_MS) return;
    lastSyncRef.current = now;

    // Don't sync if tab is hidden
    if (document.visibilityState === "hidden") return;

    // ---- A. Sync Blog Posts ----
    const postData = await fetchVersion("posts");
    if (postData?.data) {
      const latest = postData.data[0];
      const serverVersion = latest ? `${latest.id}-${latest.updated_at}` : "0";

      if (
        versionsRef.current.posts !== null &&
        versionsRef.current.posts !== serverVersion
      ) {
        queryClient.invalidateQueries({ queryKey: blogQueryKeys.all });
        // Also clear localStorage cache for blog data
        cacheManager.invalidatePrefix("blog-");
      }
      versionsRef.current.posts = serverVersion;
    }

    // ---- B. Sync Contact Messages ----
    const msgData = await fetchVersion("contact");
    if (msgData?.data) {
      const latest = msgData.data[0];
      const serverVersion = latest ? `${latest.id}-${msgData.count || 0}` : "0";

      if (
        versionsRef.current.messages !== null &&
        versionsRef.current.messages !== serverVersion
      ) {
        queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      }
      versionsRef.current.messages = serverVersion;
    }

    // ---- C. Sync Analytics ----
    const analyticsData = await fetchVersion("analytics");
    if (analyticsData?.stats) {
      const serverHash = String(analyticsData.stats.totalSessions || 0);
      if (
        versionsRef.current.analytics !== null &&
        versionsRef.current.analytics !== serverHash
      ) {
        queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
      }
      versionsRef.current.analytics = serverHash;
    }
  }, [queryClient]);

  useEffect(() => {
    // Initial sync (delayed to not compete with first paint)
    const startTimer = setTimeout(sync, 3000);

    // Periodic sync while tab is visible
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "visible") {
        sync();
      }
    }, POLL_INTERVAL);

    // Resume sync when tab becomes visible (replaces useFocusRefetch for data)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        sync();
        // Also tell the cacheManager to check for new builds
        cacheManager.forceCheckBuild();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(startTimer);
      clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sync]);
};
