import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTelemetry } from "@/shared/api/realtime/useTelemetry";
import { toast } from "react-hot-toast";
import React from "react";
import { FiActivity, FiMail, FiCpu, FiCheckCircle } from "react-icons/fi";
import { cacheManager } from "@/lib/cacheManager";

/**
 * useAdminPulse
 *
 * Centralized Intelligence Hook for Admin Real-Time Synchronization.
 * Now uses the transport-agnostic useTelemetry hook instead of raw socket.io.
 */
export const useAdminPulse = () => {
  const queryClient = useQueryClient();

  // 1. ANALYTICS PULSE
  useTelemetry("ANALYTICS:SIGNAL", (data) => {
    console.log("  [Pulse] Analytics Signal:", data.type);

    queryClient.setQueryData(["analytics-stats"], (oldData) => {
      if (!oldData) return oldData;
      const newData = { ...oldData };

      if (data.type === "VISITOR_INIT") {
        newData.stats = {
          ...newData.stats,
          totalVisitors: (newData.stats?.totalVisitors || 0) + 1,
          liveNow: (newData.stats?.liveNow || 0) + 1,
        };
        cacheManager.set("admin-analytics-stats", newData, "analytics");
      }
      return newData;
    });

    if (data.type !== "HEARTBEAT") {
      toast(
        `Active Trace: ${data.city || data.eventType || data.type} (${data.browser || "---"})`,
        {
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
        }
      );
    }
  });

  // 2. MESSAGES PULSE
  useTelemetry("MESSAGES:NEW_INQUIRY", (data) => {
    console.log("  [Pulse] New Inquiry Pulse Received");

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
  useTelemetry("AI:GENERATION_STARTED", (data) => {
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

  useTelemetry("AI:STAGE_COMPLETE", (data) => {
    // Progress updates during multi-stage generation — no UI toast needed,
    // but we log so the AI generator component can pick it up via useTelemetry.
    console.debug("[Pulse] AI stage complete:", data.stage, data.title);
  });

  useTelemetry("AI:GENERATION_FINISHED", (data) => {
    queryClient.invalidateQueries({ queryKey: ["blog"] });
    cacheManager.invalidatePrefix("blog-"); // invalidate all blog caches, not just blog-all-posts-

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
  useTelemetry("ADMIN:POSTS_CHANGED", (data) => {
    console.log("  [Pulse] Posts Changed:", data.action, data.postId);

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
  useTelemetry("SYSTEM:CACHE_PURGE", (data) => {
    console.warn("  [Pulse] System Cache Purge Requested:", data.reason);

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
};
