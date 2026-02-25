import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/shared/context/SocketContext";
import { toast } from "react-hot-toast";
import React from "react";
import { FiActivity, FiMail, FiCpu, FiCheckCircle } from "react-icons/fi";
import { cacheManager } from "@/lib/cacheManager";

/**
 * useAdminPulse
 *
 * Centralized Intelligence Hook for Admin Real-Time Synchronization.
 * Implements the "Pulse" mechanism from ENGINEERING_LOG.md and CACHING.md.
 */
export const useAdminPulse = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // 1. ANALYTICS PULSE
    socket.on("ANALYTICS:SIGNAL", (data) => {
      console.log("  [Pulse] Analytics Signal:", data.type);

      // Update React Query Cache for stats
      queryClient.setQueryData(["analytics-stats"], (oldData) => {
        if (!oldData) return oldData;
        const newData = { ...oldData };

        if (data.type === "VISITOR_INIT") {
          // Optimistic increment
          newData.summary = {
            ...newData.summary,
            total_visitors: (newData.summary?.total_visitors || 0) + 1,
            active_sessions: (newData.summary?.active_sessions || 0) + 1,
          };
          // Update localStorage for persistence
          cacheManager.set("admin-analytics-stats", newData, "analytics");
        }
        return newData;
      });

      // Show toast if allowed
      toast(`Active Trace: ${data.city} (${data.browser})`, {
        icon: <FiActivity className="text-cyan-400" />,
        id: "pulse-analytics",
        duration: 2000,
        style: {
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          border: "1px solid rgba(34,211,238,0.2)",
          fontSize: "11px",
          backdropFilter: "blur(10px)",
        },
      });
    });

    // 2. MESSAGES PULSE
    socket.on("MESSAGES:NEW_INQUIRY", (data) => {
      console.log("  [Pulse] New Inquiry Pulse Received");

      // Invalidate current messages queries
      queryClient.invalidateQueries({ queryKey: ["contactMessages"] });
      cacheManager.invalidatePrefix("admin-messages-");

      toast(
        (t) => (
          <div className="flex flex-col gap-1">
            <p className="font-black text-[9px] text-purple-400 uppercase tracking-widest">
              Incoming Inquiry
            </p>
            <p className="text-xs font-bold">
              {data.name}: {data.subject}
            </p>
          </div>
        ),
        {
          icon: <FiMail className="text-purple-400" />,
          duration: 5000,
          style: {
            background: "rgba(0,0,0,0.9)",
            color: "#fff",
            border: "1px solid rgba(168,85,247,0.3)",
            backdropFilter: "blur(12px)",
          },
        }
      );
    });

    // 3. AI ORCHESTRATION PULSE
    socket.on("AI:GENERATION_STARTED", (data) => {
      toast(`AI Engine: Drafting "${data.topic}"`, {
        icon: <FiCpu className="text-amber-400 animate-pulse" />,
        duration: 4000,
        style: {
          background: "rgba(0,0,0,0.9)",
          color: "#fff",
          border: "1px solid rgba(251,191,36,0.3)",
        },
      });
    });

    socket.on("AI:GENERATION_FINISHED", (data) => {
      // Invalidate blog lists
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      cacheManager.invalidatePrefix("blog-all-posts-");

      toast(`AI Engine: Content Finalized "${data.title}"`, {
        icon: <FiCheckCircle className="text-green-400" />,
        duration: 6000,
        style: {
          background: "rgba(0,0,0,0.9)",
          color: "#fff",
          border: "1px solid rgba(34,197,94,0.3)",
        },
      });
    });

    // 4. CONTENT SYNC PULSE
    socket.on("ADMIN:POSTS_CHANGED", (data) => {
      console.log("  [Pulse] Posts Changed:", data.action, data.postId);

      // Invalidate everything related to blog
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      cacheManager.invalidatePrefix("blog-");

      const verb =
        data.action === "create"
          ? "New post added"
          : data.action === "delete"
            ? "Post removed"
            : "Post updated";

      toast(`${verb}: Syncing dashboard...`, {
        icon: <FiActivity className="text-purple-400" />,
        id: "pulse-posts-sync",
        duration: 2500,
        style: {
          background: "rgba(0,0,0,0.85)",
          color: "#fff",
          border: "1px solid rgba(168,85,247,0.2)",
          fontSize: "11px",
          backdropFilter: "blur(10px)",
        },
      });
    });

    // 5. SYSTEM COMMAND PULSE
    socket.on("SYSTEM:CACHE_PURGE", (data) => {
      console.warn("  [Pulse] System Cache Purge Requested:", data.reason);

      // Force purge all local state
      cacheManager.clearAll();
      queryClient.clear();

      toast.error("System: Cache Re-indexed for Integrity", {
        duration: 5000,
        style: {
          background: "#000",
          color: "#fff",
          border: "1px solid #ef4444",
        },
      });
    });

    return () => {
      socket.off("ANALYTICS:SIGNAL");
      socket.off("MESSAGES:NEW_INQUIRY");
      socket.off("AI:GENERATION_STARTED");
      socket.off("AI:GENERATION_FINISHED");
      socket.off("ADMIN:POSTS_CHANGED");
      socket.off("SYSTEM:CACHE_PURGE");
    };
  }, [socket, isConnected, queryClient]);
};
