import {
  useAnalyticsStats,
  useVisitorDetail,
} from "@/shared/analytics/useAnalyticsStats";
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
  FiCpu,
  FiX,
  FiDatabase,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

const mapStyles = `
  @keyframes forensic-pulse {
    0% { transform: scale(0.9); opacity: 0.4; }
    50% { transform: scale(1.1); opacity: 0.8; }
    100% { transform: scale(0.9); opacity: 0.4; }
  }
  @keyframes forensic-ping {
    0% { transform: scale(1); opacity: 0.8; }
    70%, 100% { transform: scale(2.5); opacity: 0; }
  }
  .custom-div-icon, .marker-cluster-custom {
    background: transparent !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .leaflet-popup-content-wrapper {
    background: rgba(10, 10, 10, 0.98) !important;
    border: 1px solid rgba(255,255,255,0.15) !important;
    border-radius: 4px !important;
    color: white !important;
    padding: 0 !important;
    box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
  }
  .leaflet-popup-tip {
    background: rgba(10, 10, 10, 0.98) !important;
  }
  .leaflet-container {
    background: #020202 !important;
  }
  @keyframes hub-node-pulse {
    0% { stroke-width: 1; stroke-opacity: 1; }
    100% { stroke-width: 15; stroke-opacity: 0; }
  }
  .hub-node-pulse {
    animation: hub-node-pulse 2s infinite ease-out;
  }
`;

/* Global Threat Map Component - PRO Leaflet Edition (Direct Core) */
const GlobalThreatMap = ({ locations = [], topLocations = [] }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const hubsLayerRef = useRef(null);

  // Debug Data State
  useEffect(() => {
    console.log(
      "[ForensicMap] Data Update:",
      locations?.length,
      "nodes available."
    );
  }, [locations]);

  // Style Injection
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = mapStyles;
    document.head.appendChild(styleSheet);

    // Explicit global anchor for plugins
    if (typeof window !== "undefined") {
      window.L = L;
    }

    return () => {
      if (document.head && styleSheet.parentNode) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize Map Engine
    if (!mapInstanceRef.current) {
      console.log("[ForensicMap] Initializing Engine...");
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 2. Initialize Cluster Group (Library Check)
    if (!clusterGroupRef.current) {
      if (typeof L.markerClusterGroup !== "function") {
        console.warn(
          "[ForensicMap] Cluster library missing. Using discrete nodes."
        );
      } else {
        const markers = L.markerClusterGroup({
          showCoverageOnHover: false,
          spiderfyOnMaxZoom: true,
          iconCreateFunction: (cluster) => {
            const count = cluster.getChildCount();
            let color = "#10b981";
            if (count > 20) color = "#3b82f6";
            if (count > 100) color = "#ef4444";

            return L.divIcon({
              html: `<div style="width:40px;height:40px;position:relative;display:flex;align-items:center;justify-content:center;">
                       <div style="position:absolute;inset:0;background:${color};opacity:0.2;border-radius:50%;animation:forensic-ping 1.5s infinite;"></div>
                       <div style="position:absolute;inset:0;background:${color};opacity:0.4;border-radius:50%;border:1px solid rgba(255,255,255,0.2);"></div>
                       <span style="position:relative;color:#fff;font-family:monospace;font-weight:bold;font-size:10px;">${count}</span>
                     </div>`,
              className: "marker-cluster-custom",
              iconSize: L.point(40, 40),
            });
          },
        });
        map.addLayer(markers);
        clusterGroupRef.current = markers;
      }
    }

    const targetLayer = clusterGroupRef.current || map;
    if (clusterGroupRef.current) clusterGroupRef.current.clearLayers();

    // 2.5 Initialize Hubs Layer (Vector Nodes)
    if (!hubsLayerRef.current) {
      hubsLayerRef.current = L.layerGroup().addTo(map);
    }
    hubsLayerRef.current.clearLayers();

    // 2.6 Inject Hub Nodes (Aggregated City Data)
    topLocations.forEach((hub) => {
      const hLat = parseFloat(hub.lat);
      const hLon = parseFloat(hub.lon);
      if (isNaN(hLat) || isNaN(hLon)) return;

      bounds.push([hLat, hLon]);

      const hubMarker = L.circleMarker([hLat, hLon], {
        radius: Math.min(Math.max(Math.sqrt(hub.count) * 2 + 5, 8), 24),
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        color: "#3b82f6",
        weight: 1,
        className: "hub-node-pulse", // Custom CSS for ring pulse
      }).addTo(hubsLayerRef.current);

      hubMarker.bindTooltip(
        `<div class="font-mono text-[10px] text-white">HUB: ${hub.city?.toUpperCase()} [${hub.count}]</div>`,
        { direction: "top", className: "tactical-tooltip" }
      );
    });

    // 3. Inject Nodes & Calculate Bounds
    let localValidCount = 0;
    const bounds = [];

    console.log("[ForensicMap] Received", locations.length, "raw nodes.");

    locations.forEach((loc, idx) => {
      // 1: Extract and Sanitize Coordinates
      const rawLat = loc.lat ?? loc.latitude;
      const rawLon = loc.lon ?? loc.longitude;
      const lat = parseFloat(rawLat);
      const lon = parseFloat(rawLon);

      if (isNaN(lat) || isNaN(lon)) return;
      if (Math.abs(lat) < 0.1 && Math.abs(lon) < 0.1) return; // Skip [0,0] strictly

      localValidCount++;

      // 2: Dynamic Styling
      const count = loc.count || loc.visit_count || 1;
      const isRecent = loc.last_active
        ? new Date(loc.last_active).getTime() > Date.now() - 3600000
        : true;

      const color = loc.is_owner ? "#f59e0b" : isRecent ? "#10b981" : "#3b82f6";
      const radius = Math.min(Math.max(Math.log2(count) * 4 + 8, 12), 32);

      // 3: HTML Injection for Forensic Markers
      const forensicHtml = `
        <div style="position:relative;display:flex;align-items:center;justify-content:center;width:${radius}px;height:${radius}px;">
          <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.2;animation:forensic-pulse 3s infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.15;animation:forensic-ping 2s infinite;"></div>
          <div style="position:absolute;inset:15%;border-radius:50%;background:${color};box-shadow:0 0 15px ${color};border:1px solid rgba(255,255,255,0.5);"></div>
        </div>`;

      const customIcon = L.divIcon({
        className: "custom-div-icon",
        html: forensicHtml,
        iconSize: [radius, radius],
        iconAnchor: [radius / 2, radius / 2],
        popupAnchor: [0, -radius / 2],
      });

      const visitorId = String(loc.id || "UNK").slice(0, 8);
      const popupContent = `
        <div style="font-family:monospace;color:#fff;min-width:180px;padding:12px;background:#050505;border:1px solid rgba(255,255,255,0.1);box-shadow:0 10px 30px rgba(0,0,0,0.5);">
          <div style="border-bottom:1px solid #333;padding-bottom:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:bold;color:${color};text-transform:uppercase;letter-spacing:1px;font-size:10px;">ENTITY: ${visitorId}</span>
            <div style="display:flex;gap:4px;">
              ${loc.is_owner ? '<span style="background:#f59e0b;color:#000;font-size:7px;padding:1px 3px;border-radius:2px;font-weight:bold;">OWNER</span>' : ""}
              ${loc.is_bot ? '<span style="background:#ef4444;color:#fff;font-size:7px;padding:1px 3px;border-radius:2px;font-weight:bold;">BOT</span>' : ""}
            </div>
          </div>
          <div style="font-size:10px;color:#888;margin-bottom:4px;">REGION: <span style="color:#fff;">${loc.city || "PRIVATE"}, ${loc.country || "XX"}</span></div>
          <div style="font-size:10px;color:#888;margin-bottom:4px;">SESSIONS: <span style="color:#fff;">${count}</span></div>
          <div style="font-size:9px;margin-top:10px;color:#444;border-top:1px solid #222;padding-top:6px;display:flex;justify-content:space-between;">
            <span>LINK SECURE</span>
            <span>DATA LOGGED</span>
          </div>
        </div>`;

      const marker = L.marker([lat, lon], { icon: customIcon });
      marker.bindPopup(popupContent, { closeButton: false });
      targetLayer.addLayer(marker);
      bounds.push([lat, lon]);
    });

    console.log(
      `[ForensicMap] Sat-Link Synced: ${localValidCount} nodes active.`
    );

    // 4. Finalize Viewport
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        if (bounds.length > 0) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 14,
          });
        }
      }
    }, 800);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapContainerRef.current)
      resizeObserver.observe(mapContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [locations]);

  return (
    <div className="rounded-xl liquid-glass backdrop-blur-none relative group mb-8 border border-white/5 shadow-2xl overflow-hidden flex flex-col">
      <div className="liquid-glass-top-line" />

      {/* Sleek Minimal Header - Spaced Internally */}
      <div className="flex justify-between items-start px-8 pt-8 mb-6 relative z-10">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <FiGlobe className="text-emerald-500 animate-pulse" /> Global Threat
            Matrix
          </h3>
          <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest mt-1">
            Real-time geospatial intelligence linkage
          </p>
        </div>
      </div>

      {/* Map Viewport - Expanded to Edges */}
      <div className="relative w-full h-[600px] z-0 overflow-hidden border-t border-white/10 bg-[#020202]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Tactical HUD Overlay - Consolidated Metrics */}
        <div className="absolute top-4 left-4 z-[401] flex flex-col gap-2">
          <div className="px-4 py-2.5 rounded-lg bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black text-white font-mono tracking-tighter uppercase">
                Satellite Telemetry
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-1 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[8px] text-neutral-500 font-black uppercase tracking-tighter">
                  Signal Matrix
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono leading-none mt-0.5">
                  {locations?.length || 0} NODES
                </span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-6">
                <span className="text-[8px] text-neutral-500 font-black uppercase tracking-tighter">
                  Active Hits
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono leading-none mt-0.5">
                  {locations.reduce((acc, curr) => acc + (curr.count || 0), 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-md bg-black/60 border border-white/5 backdrop-blur-sm">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] text-neutral-400 font-mono">
                  Recent
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] text-neutral-400 font-mono">
                  Archive
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[9px] text-neutral-400 font-mono">
                  Owner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CRT Scanline Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[400] opacity-[0.07]"
          style={{
            background:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 3px, 3px 100%",
          }}
        ></div>
        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.95)] z-[400]"></div>
      </div>
    </div>
  );
};

const Analytics = () => {
  const { data: analyticsData, isLoading, error } = useAnalyticsStats();
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [showBotTraffic, setShowBotTraffic] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMapMounted, setIsMapMounted] = useState(false);
  const itemsPerPage = 15;

  // Performance: Defer heavy map mounting
  useEffect(() => {
    const timer = setTimeout(() => setIsMapMounted(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const stats = analyticsData?.stats || {
    liveNow: 0,
    totalVisitors: 0,
    totalSessions: 0,
    pageViews7d: 0,
    botSessions: 0,
  };

  const deviceBreakdown = analyticsData?.deviceBreakdown || [];
  const browserBreakdown = analyticsData?.browserBreakdown || [];
  const topLocations = analyticsData?.topLocations || [];
  const topReferrers = analyticsData?.topReferrers || [];
  const topUTMs = analyticsData?.topUTMs || [];
  const topPages = analyticsData?.topPages || [];
  const recentVisitors = analyticsData?.recentVisitors || [];
  const recentActions = analyticsData?.recentActions || [];

  // --- PERFORMANCE: SKELETON ENGINE ---
  if (isLoading) {
    return (
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-96 bg-white/5 rounded-lg animate-pulse" />
          </div>
          <div className="h-10 w-44 bg-cyan-500/5 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-6 rounded-xl liquid-glass border border-white/5 bg-white/[0.01]"
            >
              <div className="h-6 w-6 bg-white/5 rounded mb-3 animate-pulse" />
              <div className="h-3 w-16 bg-white/5 rounded mb-2 animate-pulse" />
              <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            <div className="h-[500px] rounded-xl liquid-glass border border-white/5 bg-white/[0.01] animate-pulse" />
            <div className="h-[400px] rounded-xl liquid-glass border border-white/5 bg-white/[0.01] animate-pulse" />
          </div>
          <div className="xl:col-span-4 space-y-8">
            <div className="h-[300px] rounded-xl liquid-glass border border-white/5 bg-white/[0.01] animate-pulse" />
            <div className="h-[300px] rounded-xl liquid-glass border border-white/5 bg-white/[0.01] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <div className="p-12 rounded-2xl bg-red-500/5 border border-red-500/10 backdrop-blur-xl">
          <FiAlertTriangle className="text-red-500 text-5xl mb-4 mx-auto animate-bounce" />
          <h2 className="text-xl font-bold text-white mb-2 tracking-tighter uppercase">
            Link Terminated
          </h2>
          <p className="text-neutral-500 font-mono text-xs mb-6 uppercase tracking-widest">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-500/30 rounded-lg transition-all"
          >
            Protocol Reset
          </button>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Analytics <span className="text-cyan-400">Hub</span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Deep forensic analysis of your digital footprint and visitor
            clusters.
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group backdrop-blur-[2px] shadow-lg shadow-cyan-500/5">
          <div className="relative">
            <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-25"></span>
            <span className="relative block w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          </div>
          <span className="text-cyan-100/90 text-sm font-medium tracking-tight">
            {stats.liveNow} Active Entities
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
            label: "Bot Clusters",
            value: stats.botSessions,
            icon: <FiCpu />,
            color: "red",
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
            className="p-6 rounded-xl liquid-glass backdrop-blur-none relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="liquid-glass-top-line" />
            <div
              className={`absolute -right-4 -bottom-4 text-white/[0.03] text-6xl transition-transform group-hover:scale-110 duration-500`}
            >
              {item.icon}
            </div>
            <div className={`text-${item.color}-400/80 mb-3 text-lg`}>
              {item.icon}
            </div>
            <div className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
              {item.label}
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">
              {(item.value || 0).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed Section (Col 8) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Forensic Identity Matrix */}
          <div className="liquid-glass backdrop-blur-none rounded-xl relative mb-8">
            <div className="liquid-glass-top-line" />
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter flex items-center gap-3">
                  <FiDatabase className="text-red-400" /> Forensic Identity
                  Matrix
                </h2>
                <p className="text-xs text-neutral-500 font-medium">
                  Classified digital residue and hardware-linked entity mapping.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-right px-4 border-r border-white/5">
                  <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">
                    Active Nodes
                  </p>
                  <p className="text-xl font-black text-white">
                    {stats.liveNow}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">
                    Total Resolved
                  </p>
                  <p className="text-xl font-black text-cyan-400">
                    {stats.totalVisitors}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-white/[0.01] border-b border-white/5">
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap sticky left-0 bg-[#000000] z-10 backdrop-blur-md bg-opacity-90">
                      Resolved Entity
                    </th>
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      Trust Score
                    </th>
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      Engagement
                    </th>
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      Traffic Source
                    </th>
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      System DNA
                    </th>
                    <th className="px-4 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      Last Signature
                    </th>
                    <th className="px-4 py-3 text-right text-[9px] font-black text-neutral-500 uppercase tracking-widest whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentVisitors
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((v, i) => (
                      <tr
                        key={i}
                        onClick={() => setSelectedVisitorId(v.id)}
                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 sticky left-0 bg-[#050505] group-hover:bg-[#0a0a0a] transition-colors z-10 border-r border-white/5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform border ${v.real_name ? "bg-purple-500/20 border-purple-500/30 text-purple-300" : "bg-white/5 border-white/5"}`}
                            >
                              <FiUsers size={14} />
                            </div>
                            <div title={v.isp}>
                              <p className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors truncate max-w-[140px] flex items-center gap-1">
                                {v.real_name ||
                                  (v.city
                                    ? `${v.city} Entity`
                                    : "Unknown Entity")}
                                {v.real_name && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                )}
                              </p>
                              <p className="text-[9px] text-neutral-500 font-mono truncate max-w-[140px]">
                                {v.region ? `${v.region}, ` : ""}
                                {v.country}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div
                            className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                              v.is_bot
                                ? "bg-red-500/5 text-red-500 border-red-500/20"
                                : v.visit_count > 5
                                  ? "bg-green-500/5 text-green-400 border-green-500/20"
                                  : "bg-yellow-500/5 text-yellow-400 border-yellow-500/20"
                            }`}
                          >
                            {v.is_bot
                              ? "BOT"
                              : v.visit_count > 5
                                ? "VERIFIED"
                                : "GUEST"}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <div
                              className="flex items-center gap-1.5"
                              title="Total Clicks"
                            >
                              <FiMousePointer
                                size={12}
                                className="text-purple-400"
                              />
                              <span className="text-xs font-bold text-neutral-300">
                                {v.total_clicks || 0}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1.5"
                              title="Page Views"
                            >
                              <FiExternalLink
                                size={12}
                                className="text-blue-400"
                              />
                              <span className="text-xs font-bold text-neutral-300">
                                {v.total_pageviews || 0}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 max-w-[180px]">
                          <div className="flex flex-col gap-0.5">
                            <p
                              className="text-[10px] font-bold text-neutral-300 truncate"
                              title={v.last_referrer}
                            >
                              {(v.last_referrer || "Direct")
                                .replace("https://", "")
                                .replace("www.", "")}
                            </p>
                            <p
                              className="text-[9px] text-neutral-600 font-mono truncate bg-white/5 rounded px-1.5 py-0.5 w-fit max-w-full border border-white/5"
                              title={v.visited_paths}
                            >
                              {v.visited_paths?.split(",")[0]}
                              {v.visited_paths?.split(",").length > 1 &&
                                ` +${v.visited_paths.split(",").length - 1}`}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <p
                              className="text-[10px] font-bold text-neutral-300 flex items-center gap-1.5 truncate max-w-[140px]"
                              title={`${v.os} | ${v.browser} | ${v.gpu_renderer}`}
                            >
                              {v.device_type === "mobile" ? (
                                <FiSmartphone
                                  size={10}
                                  className="text-cyan-400"
                                />
                              ) : v.device_type === "tablet" ? (
                                <FiTablet
                                  size={10}
                                  className="text-purple-400"
                                />
                              ) : (
                                <FiMonitor
                                  size={10}
                                  className="text-green-400"
                                />
                              )}
                              {v.device_model &&
                              v.device_model !== "Unknown Device"
                                ? v.device_model
                                : v.os}
                            </p>
                            <p className="text-[9px] text-neutral-600 font-mono">
                              {v.ip_address}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <p className="text-[10px] font-medium text-white">
                              {new Date(v.last_seen).toLocaleDateString(
                                undefined,
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </p>
                            <p className="text-[9px] text-neutral-600 font-mono">
                              {new Date(v.last_seen).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1">
                            VIEW <FiTarget size={10} />
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Matrix Pagination Controls */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.2em]">
                Showing {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, recentVisitors.length)} of{" "}
                {recentVisitors.length} Resolved Entities
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage * itemsPerPage >= recentVisitors.length}
                  className="px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-black text-cyan-400 hover:bg-cyan-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all uppercase tracking-widest"
                >
                  Next Page
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Interaction Feed */}
          <div className="p-8 rounded-xl liquid-glass backdrop-blur-none relative">
            <div className="liquid-glass-top-line" />
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white flex items-center gap-3">
                <FiZap className="text-yellow-400" /> Behavioral Stream
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowBotTraffic(!showBotTraffic)}
                  className={`px-3 py-1 rounded-full text-[10px] transition-all font-bold tracking-widest uppercase border ${
                    showBotTraffic
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : "bg-white/5 border-white/10 text-neutral-500"
                  }`}
                >
                  {showBotTraffic ? "Bots Visible" : "Humans Only"}
                </button>
                <div className="px-3 py-1 rounded-full bg-white/5 text-[10px] text-neutral-500 font-mono">
                  LIVE UPDATES
                </div>
              </div>
            </div>
            <div
              data-lenis-prevent
              className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar"
            >
              {recentActions
                .filter((action) => showBotTraffic || !action.is_bot)
                .map((action, i) => (
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
                          {action.is_bot && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-[8px] text-red-400 font-black tracking-widest uppercase border border-red-500/20">
                              BOT
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {action.timestamp
                            ? new Date(action.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )
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
            <div className="p-8 rounded-xl liquid-glass backdrop-blur-none relative">
              <div className="liquid-glass-top-line" />
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
            <div className="p-8 rounded-xl liquid-glass backdrop-blur-none relative">
              <div className="liquid-glass-top-line" />
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
          {isMapMounted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            >
              <GlobalThreatMap
                locations={analyticsData?.mapNodes || []}
                topLocations={analyticsData?.topLocations || []}
              />
            </motion.div>
          ) : (
            <div className="h-[500px] rounded-xl liquid-glass border border-white/5 bg-white/[0.01] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <FiGlobe className="text-neutral-700 text-3xl animate-spin-slow" />
                <span className="text-[10px] text-neutral-600 font-mono uppercase tracking-widest">
                  Warming Engines...
                </span>
              </div>
            </div>
          )}
          {/* Geo Distribution */}
          <div className="p-8 rounded-xl liquid-glass backdrop-blur-none relative">
            <div className="liquid-glass-top-line" />
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <FiGlobe className="text-blue-400" /> Geo Cluster
            </h3>
            <div className="space-y-5">
              {topLocations.map((loc, i) => (
                <div key={i} className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <div className="flex items-baseline gap-2">
                      <span
                        className="text-white font-bold truncate max-w-[120px]"
                        title={loc.city}
                      >
                        {decodeURIComponent(loc.city || "Private")}
                      </span>
                      <span className="text-neutral-500 text-[10px] uppercase font-bold truncate max-w-[100px]">
                        {loc.region
                          ? `${decodeURIComponent(loc.region)}, `
                          : ""}
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
          <div className="p-8 rounded-xl liquid-glass backdrop-blur-none relative">
            <div className="liquid-glass-top-line" />
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
        </div>
      </div>

      <AnimatePresence>
        {selectedVisitorId && (
          <VisitorIntelligence
            visitorId={selectedVisitorId}
            onClose={() => setSelectedVisitorId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const VisitorIntelligence = ({ visitorId, onClose }) => {
  const { data: detail, isLoading } = useVisitorDetail(visitorId);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex justify-end bg-black/5 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-[450px] h-full shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col relative overflow-hidden bg-white/[0.01] backdrop-blur-[12px] border-l border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Liquid Glass Global Highlights */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

        {/* Header - Clean & Transparent */}
        <div className="relative p-6 flex justify-between items-start z-10">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)]">
              <FiUsers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white tracking-tight drop-shadow-sm flex items-center gap-2">
                {detail?.profile?.real_name || "Entity Intelligence"}
                {detail?.profile?.real_name && (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-[9px] text-green-400 font-bold tracking-wider border border-green-500/20 uppercase">
                    Verified
                  </span>
                )}
              </h2>
              <div className="flex flex-col gap-0.5 mt-0.5">
                {detail?.profile?.email && (
                  <span className="text-xs text-neutral-300 font-medium tracking-wide">
                    {detail?.profile?.email}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-mono tracking-wide">
                    ID:{" "}
                    {(detail?.profile?.visitor_id || visitorId).slice(0, 12)}...
                  </span>
                  {detail?.profile?.is_bot && (
                    <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-[9px] text-red-400 font-bold tracking-wider border border-red-500/20">
                      BOT
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.05] text-neutral-400 hover:text-white transition-all"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative z-0">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
              <p className="text-cyan-400/60 font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">
                Decrypting...
              </p>
            </div>
          ) : !detail || !detail.profile ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <FiAlertTriangle className="text-red-400/80 text-3xl mb-2" />
              <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                Entity Profile Not Found
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-full border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-neutral-300 text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                Close Dossier
              </button>
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 overscroll-contain"
              data-lenis-prevent
            >
              {/* Critical Stats - Floating Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative p-4 rounded-xl overflow-hidden bg-white/[0.01] border border-white/10 backdrop-blur-sm group hover:bg-white/[0.02] transition-colors">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                  <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
                    Total Visits
                  </p>
                  <p className="text-2xl font-medium text-white">
                    {detail?.profile?.visit_count || 1}
                  </p>
                </div>
                <div className="relative p-4 rounded-xl overflow-hidden bg-white/[0.01] border border-white/10 backdrop-blur-sm group hover:bg-white/[0.02] transition-colors">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
                  <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
                    Engagement Score
                  </p>
                  <p className="text-2xl font-medium text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                    {(detail?.stats?.total_clicks || 0) * 5 +
                      (detail?.stats?.total_pageviews || 0) * 2}
                  </p>
                </div>
              </div>

              {/* Hardware & Network DNA */}
              <div className="space-y-3">
                <h3 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                  <FiCpu className="text-purple-400/80" /> Hardware & Network
                  DNA
                </h3>
                <div className="relative p-5 rounded-xl overflow-hidden bg-white/[0.01] border border-white/10 backdrop-blur-sm">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                  <div className="grid grid-cols-2 gap-y-5 gap-x-4 relative z-10">
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        Device Model
                      </p>
                      <p className="text-xs font-medium text-white flex items-center gap-1.5">
                        {detail?.profile?.device_model || "Generic Device"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        Device Type
                      </p>
                      <p className="text-xs font-medium text-white capitalize">
                        {detail?.profile?.device_type || "Desktop"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        Operating System
                      </p>
                      <p className="text-xs font-medium text-white flex items-center gap-1.5">
                        {detail?.profile?.os === "Mac OS" && (
                          <span className="w-1 h-1 rounded-full bg-white/60" />
                        )}
                        {detail?.profile?.os === "Windows" && (
                          <span className="w-1 h-1 rounded-full bg-blue-400/60" />
                        )}
                        {detail?.profile?.os}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        Browser Engine
                      </p>
                      <p className="text-xs font-medium text-white">
                        {detail?.profile?.browser}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        Screen Resolution
                      </p>
                      <p className="text-xs font-medium text-neutral-300 font-mono tracking-tight">
                        {detail?.profile?.screen_size || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-neutral-500 uppercase mb-1 tracking-wide">
                        IP Address
                      </p>
                      <p className="text-xs font-medium text-neutral-300 font-mono blur-[3px] hover:blur-none transition-all duration-300 cursor-crosshair select-all">
                        {detail?.profile?.ip_address}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 relative z-10">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] text-neutral-500 uppercase tracking-wide">
                        Hardware Fingerprint
                      </p>
                    </div>
                    <p className="text-[10px] font-mono text-neutral-500 break-all bg-black/20 p-2.5 rounded border border-white/5">
                      {detail?.profile?.fingerprint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Geo location */}
              <div className="space-y-3">
                <h3 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                  <FiMapPin className="text-blue-400/80" /> Geolocation
                </h3>
                <div className="relative p-4 rounded-xl overflow-hidden bg-white/[0.01] border border-white/10 backdrop-blur-sm flex items-center gap-4">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-30" />

                  <div className="w-10 h-10 rounded-full bg-blue-500/5 flex items-center justify-center text-blue-400/80 border border-blue-500/10">
                    <FiGlobe size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white mb-0.5 truncate">
                      {detail?.profile?.city || "Unknown City"}
                      <span className="text-neutral-500 font-normal">
                        , {detail?.profile?.region}
                      </span>
                    </p>
                    <p className="text-[10px] text-neutral-500 flex items-center gap-1.5 uppercase tracking-wide mb-1.5">
                      {detail?.profile?.country}{" "}
                      <span className="text-neutral-700">•</span>{" "}
                      {detail?.profile?.isp}
                    </p>

                    {detail?.profile?.latitude &&
                      detail?.profile?.longitude && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${detail?.profile?.latitude},${detail?.profile?.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          <FiExternalLink size={10} /> View Pinpoint
                        </a>
                      )}
                  </div>
                </div>
              </div>

              {/* Interaction Timeline */}
              <div className="space-y-3">
                <h3 className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                  <FiActivity className="text-green-400/80" /> Activity Stream
                </h3>
                <div className="relative border-l border-white/10 ml-3 space-y-4 pb-4 pt-1">
                  {detail?.events?.slice(0, 20).map((event, i) => (
                    <div key={i} className="pl-5 relative group">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[3px] top-2 z-10">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            event.event_type === "click"
                              ? "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                              : event.event_type === "page_view"
                                ? "bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                                : "bg-neutral-500"
                          }`}
                        />
                      </div>

                      <div className="flex justify-between items-start py-1 hover:bg-white/[0.02] rounded px-2 -ml-2 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wide transition-colors ${
                              event.event_type === "click"
                                ? "text-purple-300"
                                : event.event_type === "page_view"
                                  ? "text-blue-300"
                                  : "text-neutral-300"
                            }`}
                          >
                            {(event.event_type || "")
                              .replace("_", " ")
                              .toUpperCase()}
                          </p>
                          <p
                            className="text-[10px] text-neutral-500 font-mono mt-0.5 w-full truncate"
                            title={event.path || event.event_label}
                          >
                            {event.path || event.event_label}
                          </p>
                        </div>
                        <span className="text-[9px] text-neutral-600 font-mono whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Analytics;
