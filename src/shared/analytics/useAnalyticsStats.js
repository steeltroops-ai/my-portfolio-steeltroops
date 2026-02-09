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
    refetchInterval: 30000, // Refresh every 30s for live data
  });
};
