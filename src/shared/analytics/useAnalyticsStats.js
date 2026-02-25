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
      return false;
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
