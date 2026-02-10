import { useQuery } from "@tanstack/react-query";

const fetchStats = async () => {
  const token = localStorage.getItem("neon_auth_token");
  const res = await fetch("/api/analytics/stats", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: ["analytics-stats"],
    queryFn: fetchStats,
    refetchInterval: 10000, // Refresh every 10s for live data
  });
};

export const useVisitorDetail = (visitorId) => {
  return useQuery({
    queryKey: ["visitor-detail", visitorId],
    queryFn: async () => {
      const token = localStorage.getItem("neon_auth_token");
      const res = await fetch(
        `/api/analytics/stats?action=visitor_detail&visitorId=${visitorId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch visitor detail");
      return res.json();
    },
    enabled: !!visitorId,
  });
};
