import { useQuery } from "@tanstack/react-query";
import { cacheManager } from "@/lib/cacheManager";

export const fetchStats = async () => {
  const res = await fetch("/api/analytics/stats", {
    credentials: "include", // Use HttpOnly Cookie
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export const useAnalyticsStats = () => {
  const cacheKey = "admin-analytics-stats";
  const cachedData = cacheManager.get(cacheKey, "default");

  return useQuery({
    queryKey: ["analytics-stats"],
    queryFn: async () => {
      const data = await fetchStats();
      if (data) {
        cacheManager.set(cacheKey, data, "default");
      }
      return data;
    },
    initialData: cachedData,
    staleTime: 0, // Enforce Real-Time Performance: Always revalidate on mount
    refetchOnWindowFocus: true,
    retry: 3,
    refetchInterval: (query) => {
      // If error (backend down), poll every 10s to recover
      if (query.state.status === "error") return 10000;
      // 15s polling — SSE is unreliable on serverless (Vercel).
      // This is the primary real-time mechanism.
      return 15000;
    },
  });
};

export const useVisitorDetail = (visitorId) => {
  return useQuery({
    queryKey: ["visitor-detail", visitorId],
    queryFn: async () => {
      const res = await fetch(
        `/api/analytics/stats?action=visitor_detail&visitorId=${visitorId}`,
        {
          credentials: "include", // Use HttpOnly Cookie
        }
      );
      if (!res.ok) throw new Error("Failed to fetch visitor detail");
      return res.json();
    },
    enabled: !!visitorId,
  });
};

export const useContentProfile = (visitorId, entityId) => {
  return useQuery({
    queryKey: ["content-profile", visitorId, entityId],
    queryFn: async () => {
      let queryStr = "";
      if (entityId) queryStr = `&entityId=${entityId}`;
      else if (visitorId) queryStr = `&visitorId=${visitorId}`;
      else throw new Error("Need visitorId or entityId");

      const res = await fetch(
        `/api/analytics/stats?action=content_profile${queryStr}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Failed to fetch content profile");
      return res.json();
    },
    enabled: !!visitorId || !!entityId,
  });
};

export const useBiometricRadar = () => {
  return useQuery({
    queryKey: ["biometric-radar"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/stats?action=biometric_radar", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch biometric radar");
      return res.json();
    },
  });
};

export const useReadFunnel = () => {
  return useQuery({
    queryKey: ["read-funnel"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/stats?action=read_funnel", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch read funnel");
      return res.json();
    },
  });
};

export const useEntityGraph = () => {
  return useQuery({
    queryKey: ["entity-graph"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/stats?action=entity_graph", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch entity graph");
      return res.json();
    },
  });
};
