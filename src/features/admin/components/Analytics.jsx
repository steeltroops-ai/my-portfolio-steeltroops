import { useAnalyticsStats } from "@/shared/analytics/useAnalyticsStats";
import {
  FiUsers,
  FiActivity,
  FiGlobe,
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiCompass,
  FiMapPin,
  FiClock,
  FiMousePointer,
  FiZap,
  FiExternalLink,
  FiTarget,
  FiLayers,
} from "react-icons/fi";
import { motion } from "framer-motion";

const Analytics = () => {
  const { data: analyticsData, isLoading, error } = useAnalyticsStats();

  const stats = analyticsData?.stats || {
    liveNow: 0,
    totalVisitors: 0,
    totalSessions: 0,
    pageViews7d: 0,
  };

  const deviceBreakdown = analyticsData?.deviceBreakdown || [];
  const browserBreakdown = analyticsData?.browserBreakdown || [];
  const topLocations = analyticsData?.topLocations || [];
  const topReferrers = analyticsData?.topReferrers || [];
  const topUTMs = analyticsData?.topUTMs || [];
  const topPages = analyticsData?.topPages || [];
  const recentVisitors = analyticsData?.recentVisitors || [];
  const recentActions = analyticsData?.recentActions || [];

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-neutral-400 animate-pulse font-mono tracking-widest text-xs uppercase">
            Synchronizing Matrix Data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <span>⚠️</span>
          <span>Connection Lost: {error.message}</span>
        </div>
      </div>
    );
  }

  const getDeviceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "mobile":
        return <FiSmartphone />;
      case "tablet":
        return <FiTablet />;
      default:
        return <FiMonitor />;
    }
  };

  const getActionColor = (type) => {
    switch (type) {
      case "page_view":
        return "text-blue-400";
      case "click":
        return "text-purple-400";
      case "submit_success":
        return "text-green-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <div className="p-8 space-y-8 pb-32 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
            Intelligence <span className="text-cyan-400">Hub</span>
          </h1>
          <p className="text-neutral-500 font-medium">
            Deep forensic analysis of your digital footprint and visitor
            clusters.
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 group">
          <div className="relative">
            <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-25"></span>
            <span className="relative block w-3 h-3 rounded-full bg-cyan-400"></span>
          </div>
          <span className="text-cyan-400 font-bold tracking-tight">
            {stats.liveNow} Active Entities
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: "Unique Visitors",
            value: stats.totalVisitors,
            icon: <FiUsers />,
            color: "purple",
          },
          {
            label: "Total Sessions",
            value: stats.totalSessions,
            icon: <FiLayers />,
            color: "blue",
          },
          {
            label: "Page Impressions",
            value: stats.pageViews7d,
            icon: <FiActivity />,
            color: "cyan",
          },
          {
            label: "Active Momentum",
            value: stats.liveNow,
            icon: <FiMousePointer />,
            color: "green",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl relative group overflow-hidden"
          >
            <div
              className={`absolute -right-4 -bottom-4 text-white/[0.03] text-8xl transition-transform group-hover:scale-110 duration-500`}
            >
              {item.icon}
            </div>
            <div className={`text-${item.color}-400/80 mb-4 text-xl`}>
              {item.icon}
            </div>
            <div className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">
              {item.label}
            </div>
            <div className="text-4xl font-black text-white tracking-tighter">
              {(item.value || 0).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed Section (Col 8) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Real-time Interaction Feed */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <FiZap className="text-yellow-400" /> Behavioral Stream
              </h3>
              <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-neutral-500 font-mono">
                LIVE UPDATES
              </div>
            </div>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {recentActions.map((action, i) => (
                <div
                  key={i}
                  className="flex gap-4 items-start p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group"
                >
                  <div
                    className={`mt-1 p-2 rounded-xl bg-white/5 ${getActionColor(action.event_type)} group-hover:scale-110 transition-transform`}
                  >
                    <FiMousePointer size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-white">
                        {decodeURIComponent(action.city || "Private Cluster")}
                        <span className="mx-2 text-neutral-700 opacity-50">
                          /
                        </span>
                        <span className={getActionColor(action.event_type)}>
                          {(action.event_type || "").replace(/_/g, " ")}
                        </span>
                      </p>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {action.timestamp
                          ? new Date(action.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })
                          : "--:--:--"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-neutral-400 font-mono">
                        {action.ip_address || "IP Hidden"} • {action.os} •{" "}
                        {action.browser}
                      </span>
                      <span className="text-[10px] text-neutral-500 truncate italic">
                        {action.event_label
                          ? `via ${action.event_label}`
                          : `at ${action.path}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Content & Origin Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pages */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FiExternalLink className="text-cyan-400" /> Content Hotspots
              </h3>
              <div className="space-y-2">
                {topPages.map((page, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] hover:bg-white/5 transition-all text-sm group"
                  >
                    <span className="text-neutral-400 font-mono group-hover:text-cyan-400 truncate max-w-[200px]">
                      {page.path}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-cyan-400/30"
                          style={{
                            width: `${(page.count / (topPages[0]?.count || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-black min-w-[40px] text-right">
                        {page.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Sources */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <FiTarget className="text-purple-400" /> Traffic Ingress
              </h3>
              <div className="space-y-4">
                {topReferrers.length > 0 ? (
                  topReferrers.map((ref, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs text-neutral-400 mb-1">
                        <span className="truncate max-w-[150px]">
                          {decodeURIComponent(
                            (ref.referrer || "").replace("https://", "")
                          )}
                        </span>
                        <span className="text-white font-bold">
                          {ref.count} hits
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400/50"
                          style={{
                            width: `${(ref.count / (topReferrers[0]?.count || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-600 italic text-sm py-4">
                    Direct traffic dominant
                  </p>
                )}

                {topUTMs.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
                      Active Campaigns
                    </p>
                    {topUTMs.map((utm, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-white/5 p-2 rounded-lg mb-2"
                      >
                        <span className="text-xs text-cyan-400 font-mono">
                          {utm.utm_source}
                        </span>
                        <span className="text-xs text-white font-bold">
                          {utm.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar (Col 4) */}
        <div className="xl:col-span-4 space-y-8">
          {/* Geo Distribution */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FiGlobe className="text-blue-400" /> Geo Cluster
            </h3>
            <div className="space-y-5">
              {topLocations.map((loc, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white font-bold">
                        {decodeURIComponent(loc.city || "Private")}
                      </span>
                      <span className="text-neutral-500 text-[10px] uppercase font-bold">
                        {decodeURIComponent(loc.country)}
                      </span>
                    </div>
                    <span className="text-white font-mono">{loc.count}</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(loc.count / (stats.totalVisitors || 1)) * 100}%`,
                      }}
                      className="h-full bg-blue-500/60"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Hardware Map */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FiMonitor className="text-green-400" /> Hardware Distribution
            </h3>
            <div className="space-y-6">
              {deviceBreakdown.map((d, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/5 text-green-400">
                    {getDeviceIcon(d.device_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-bold uppercase tracking-wider">
                      <span>{d.device_type}</span>
                      <span className="text-white font-mono">
                        {Math.round(
                          (d.count / (stats.totalVisitors || 1)) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500/40"
                        style={{
                          width: `${(d.count / (stats.totalVisitors || 1)) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
                Browser Popularity
              </p>
              {browserBreakdown.map((b, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-neutral-400 flex items-center gap-2">
                    <FiCompass className="text-neutral-600" /> {b.browser}
                  </span>
                  <span className="text-white font-bold">{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visitor Forensics Table */}
          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-3xl">
            <h3 className="text-lg font-bold text-white mb-6">Subject Logs</h3>
            <div className="space-y-4">
              {recentVisitors.slice(0, 10).map((v, i) => (
                <div
                  key={i}
                  className="pb-4 border-b border-white/5 last:border-0"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold text-white">
                      {decodeURIComponent(v.city || "Hidden")} Entity
                    </span>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                      {v.visit_count} VISITS
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {v.ip_address || "IP N/A"} • {v.os} •{" "}
                    {v.screen_size || "Unknown Res"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
