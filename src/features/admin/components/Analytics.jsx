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
  FiMenu,
  FiChevronRight,
} from "react-icons/fi";
import { useAdmin } from "../context/AdminContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSocket } from "@/shared/context/SocketContext";
import { useQueryClient } from "@tanstack/react-query";
import LazySection from "@/shared/components/performance/LazySection";
import EntityDossier from "./EntityDossier";
import ActiveSwimlane from "./ActiveSwimlane";
import AdminPanelHeader from "./shared/AdminPanelHeader";
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

    // 3. Inject Nodes & Calculate Bounds
    let localValidCount = 0;
    const bounds = [];

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

      // 2: Dynamic Threat Matrix Styling (God Mode Visuals)
      const count = loc.count || loc.visit_count || 1;

      // Determine Threat Color
      let color = "#10b981"; // Green (Residential/Safe)
      let label = "SAFE";
      let bgLabel = "rgba(16,185,129,0.1)";

      if (loc.is_owner) {
        color = "#f59e0b"; // Orange (Admin)
        label = "ADMIN";
        bgLabel = "rgba(245,158,11,0.1)";
      } else if (loc.is_bot) {
        color = "#ef4444"; // Red (Scraper/Bot/Threat)
        label = "THREAT";
        bgLabel = "rgba(239,68,68,0.1)";
      } else if (
        count > 50 ||
        loc.isp?.toLowerCase().includes("amazon") ||
        loc.isp?.toLowerCase().includes("google") ||
        loc.isp?.toLowerCase().includes("digitalocean")
      ) {
        // High volume or known datacenter ISPs get marked blue (Corporate/Datacenter)
        color = "#3b82f6"; // Blue (Corporate / Datacenter Node)
        label = "DATACENTER";
        bgLabel = "rgba(59,130,246,0.1)";
      }
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
        <div class="liquid-glass relative overflow-hidden" style="font-family:monospace;color:#fff;min-width:200px;padding:16px;background:rgba(8,8,8,0.95);border:1px solid rgba(255,255,255,0.1);box-shadow:0 15px 45px rgba(0,0,0,0.8);">
          <div class="liquid-glass-highlight"></div>
          <div class="liquid-glass-top-line"></div>
          <div style="position:relative;z-index:10;">
            <div style="border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:900;color:${color};text-transform:uppercase;letter-spacing:2px;font-size:9px;">ENTITY ID: ${visitorId}</span>
              <div style="display:flex;gap:5px;">
                <span style="background:${bgLabel};color:${color};font-size:7px;padding:2px 5px;border-radius:3px;font-weight:900;border:1px solid ${color}4d;letter-spacing:1px;">${label}</span>
              </div>
            </div>
            <div style="display:grid;gap:8px;">
              <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Location: <span style="color:#fff;float:right;font-weight:500;">${loc.city || "PRIVATE"}, ${loc.country || "XX"}</span></div>
              <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:900;">Sessions: <span style="color:#fff;float:right;font-weight:500;">${count}</span></div>
            </div>
            <div style="font-size:8px;margin-top:16px;color:#333;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;display:flex;justify-content:space-between;font-weight:900;letter-spacing:1.5px;">
              <span style="color:rgba(255,255,255,0.2);">LINK_SECURE</span>
              <span style="color:rgba(255,255,255,0.2);">DATA_LOGGED</span>
            </div>
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
    const finalizeMap = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
        if (bounds.length > 0) {
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 14,
          });
        }
      }
    };

    // Multiple resizing triggers to ensure correct rendering
    setTimeout(finalizeMap, 200);
    setTimeout(finalizeMap, 1000);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
    });
    if (mapContainerRef.current)
      resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      // Proper cleanup to prevent memory leaks and "map already initialized" errors
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        clusterGroupRef.current = null;
        hubsLayerRef.current = null;
      }
    };
  }, [locations, topLocations]);

  return (
    <div className="rounded-xl liquid-glass backdrop-blur-none overflow-hidden shadow-2xl relative flex flex-col group mb-8">
      <div className="liquid-glass-top-line" />
      <AdminPanelHeader
        title="GLOBAL_THREAT_MATRIX"
        subtitle="Real-time Geospatial Intelligence Hub"
        icon={FiGlobe}
        iconColorClass="text-emerald-500 animate-pulse"
      />

      {/* Map Viewport - Expanded to Edges */}
      <div className="relative w-full h-[400px] sm:h-[600px] z-0 overflow-hidden border-t border-white/10 bg-[#020202]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Tactical HUD Overlay - Consolidated Metrics */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[401] flex flex-col gap-2 max-w-[calc(100%-24px)]">
          <div className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-black/80 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
              <div className="w-1.5 h-1.5 sm:w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[8px] sm:text-[10px] font-black text-white font-mono tracking-tighter uppercase">
                Satellite Telemetry
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-6 pt-1 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] text-neutral-500 font-black uppercase tracking-tighter">
                  Signal Matrix
                </span>
                <span className="text-[11px] sm:text-sm font-black text-emerald-400 font-mono leading-none mt-0.5">
                  {locations?.length || 0} NODES
                </span>
              </div>
              <div className="flex flex-col border-l border-white/10 pl-3 sm:pl-6">
                <span className="text-[7px] sm:text-[8px] text-neutral-500 font-black uppercase tracking-tighter">
                  Active Hits
                </span>
                <span className="text-[11px] sm:text-sm font-black text-cyan-400 font-mono leading-none mt-0.5">
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

const BehavioralStream = ({ actions, showBotTraffic }) => {
  const filteredActions = useMemo(() => {
    return actions.filter((action) => showBotTraffic || !action.is_bot);
  }, [actions, showBotTraffic]);

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
    <div className="space-y-1">
      {filteredActions.map((action, index) => (
        <div
          key={action.id || index}
          className="group relative flex items-center h-16 w-full cursor-default transition-all duration-500 cubic-bezier-[0.4,0,0.2,1]"
        >
          {/* Sidebar-style Detail Highlight */}
          <div className="absolute inset-y-1 inset-x-2 rounded-lg bg-transparent group-hover:bg-white/5 border border-transparent group-hover:border-white/5 transition-all duration-500" />

          {/* Icon Gutter (Matches Sidebar Gutter 64px) */}
          <div className="relative z-10 w-16 shrink-0 flex items-center justify-center">
            <div
              className={`p-2 rounded-lg bg-white/5 ${getActionColor(action.event_type)} border border-white/5 shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10`}
            >
              <FiMousePointer size={14} />
            </div>
          </div>

          {/* Content Area */}
          <div className="relative z-10 flex-1 min-w-0 pr-6 pl-1">
            <div className="flex justify-between items-baseline mb-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                  {decodeURIComponent(action.city || "UNK_CLUSTER")}
                </span>
                <span className="text-[8px] text-neutral-600 font-black uppercase tracking-widest bg-white/5 px-1.5 py-0.5 rounded leading-none">
                  {action.ip_address || "0.0.0.0"}
                </span>
              </div>
              <span className="text-[9px] text-neutral-500 font-mono group-hover:text-white transition-colors">
                {action.timestamp
                  ? new Date(action.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })
                  : "--:--"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`${getActionColor(action.event_type)} uppercase text-[8px] font-black tracking-[0.2em]`}
              >
                {(action.event_type || "").split("_")[0]}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span className="text-[9px] text-neutral-500 font-mono truncate group-hover:text-neutral-400 transition-colors">
                {action.path}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const { data: analyticsData, isLoading, error } = useAnalyticsStats();
  const [visitorFilter, setVisitorFilter] = useState("all");
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [viewMode, setViewMode] = useState("swimlanes");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMapMounted, setIsMapMounted] = useState(false);
  const itemsPerPage = 15;

  const { setIsSidebarCollapsed } = useAdmin();

  // Draggable Scroll Control Logic
  const scrollContainerRef = useRef(null);
  const [isDragScrolling, setIsDragScrolling] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);
  const [dragHasMoved, setDragHasMoved] = useState(false);

  // --- REAL-TIME SOCKET INTEGRATION ---
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleSignal = (data) => {
      // On any analytics signal, invalidate stats to trigger a soft refetch
      // This ensures "Active Now" counts are always logically consistent with DB
      queryClient.invalidateQueries({ queryKey: ["analytics-stats"] });
    };

    socket.on("ANALYTICS:SIGNAL", handleSignal);

    return () => {
      socket.off("ANALYTICS:SIGNAL", handleSignal);
    };
  }, [socket, queryClient]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [visitorFilter]);

  // Performance: Mount map immediately for instant feel
  useEffect(() => {
    setIsMapMounted(true);
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

  const filteredVisitors = useMemo(() => {
    return recentVisitors.filter((v) => {
      if (visitorFilter === "bots") return v.is_bot;
      if (visitorFilter === "resolved") return !v.is_bot && v.visit_count > 5;
      return true;
    });
  }, [recentVisitors, visitorFilter]);

  const startDragScroll = (e) => {
    if (!scrollContainerRef.current) return;
    setIsDragScrolling(true);
    setDragHasMoved(false);
    setDragStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setDragScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const stopDragScroll = () => {
    setIsDragScrolling(false);
    // Delay resetting move flag to allow it to prevent clicks
    setTimeout(() => setDragHasMoved(false), 50);
  };

  const handleDragScroll = (e) => {
    if (!isDragScrolling || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - dragStartX) * 2; // Drag multiplier
    if (Math.abs(walk) > 10) setDragHasMoved(true);
    scrollContainerRef.current.scrollLeft = dragScrollLeft - walk;
  };

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

  // --- PERFORMANCE: SKELETON ENGINE ---
  // Only show skeleton if we have NO data at all (first load, empty cache)
  // If we have data (even stale), show it immediately while background validation occurs
  const showSkeleton = isLoading && !analyticsData;

  if (showSkeleton) {
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
          <FiAlertTriangle className="text-red-500 text-5xl mb-4 mx-auto" />
          <h2 className="text-xl font-bold text-white mb-2 tracking-tighter uppercase">
            Link Terminated
          </h2>
          <p className="text-neutral-500 font-mono text-xs mb-6 uppercase tracking-widest leading-loose max-w-sm mx-auto">
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 pb-32">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="xl:hidden p-1 -ml-1 text-neutral-400 hover:text-white transition-colors"
            >
              <FiMenu size={20} />
            </button>
            Analytics
          </h1>
          <p className="hidden xs:block text-neutral-400 text-[10px] sm:text-sm mt-0.5 sm:mt-1">
            Forensic analysis of your digital footprint.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 group backdrop-blur-[2px] shadow-lg shadow-cyan-500/5 whitespace-nowrap">
          <div className="relative">
            <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-25"></span>
            <span className="relative block w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full bg-cyan-400"></span>
          </div>
          <span className="text-cyan-100/90 text-[10px] sm:text-sm font-medium tracking-tight">
            {stats.liveNow}{" "}
            <span className="hidden xxs:inline">Active Entities</span>
            <span className="inline xxs:hidden">Active</span>
          </span>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
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
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="p-4 sm:p-6 rounded-xl liquid-glass backdrop-blur-none relative group transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center overflow-hidden"
          >
            <div className="liquid-glass-top-line" />
            <div
              className={`text-${item.color}-400/80 mb-2 sm:mb-3 text-lg sm:text-xl relative z-10 transition-transform group-hover:scale-110`}
            >
              {item.icon}
            </div>

            <div className="text-neutral-500 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 relative z-10">
              {item.label}
            </div>

            <div className="text-xl sm:text-3xl font-black text-white tracking-tighter leading-none relative z-10 font-mono">
              {(item.value || 0).toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Feed Section (Col 8) */}
        <div className="xl:col-span-8 space-y-8">
          {/* Forensic Identity Matrix */}
          <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative mb-8">
            <div className="liquid-glass-top-line" />
            <AdminPanelHeader
              title="Forensic Identity Matrix"
              subtitle="Classified Neural Ingress Hub"
              icon={FiDatabase}
              iconColorClass="text-red-400"
            />
            <LazySection placeholderHeight="400px">
              <div className="px-8 py-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto items-end sm:items-center">
                  <div className="flex p-1 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                    {[
                      { id: "all", label: "ALL_NODES" },
                      { id: "resolved", label: "RESOLVED" },
                      { id: "bots", label: "BOT_TRAFFIC" },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setVisitorFilter(btn.id)}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all tracking-widest ${
                          visitorFilter === btn.id
                            ? "bg-white/10 text-white shadow-xl"
                            : "text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-1 sm:flex-none text-right px-6 border-r border-white/5">
                      <p className="text-[8px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-1">
                        Active_Signal
                      </p>
                      <p className="text-xl font-black text-white leading-none">
                        {stats.liveNow}
                      </p>
                    </div>
                    <div className="flex-1 sm:flex-none text-right">
                      <p className="text-[8px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-1">
                        Total_Resolved
                      </p>
                      <p className="text-xl font-black text-cyan-400 leading-none">
                        {stats.totalVisitors}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </LazySection>

            {/* Primary Data Matrix - Maximum Transparency Glass UI */}
            <div
              onMouseDown={startDragScroll}
              onMouseUp={stopDragScroll}
              onMouseLeave={stopDragScroll}
              onMouseMove={handleDragScroll}
              className={`relative border-t border-white/5 flex bg-transparent overflow-hidden ${isDragScrolling ? "cursor-grabbing select-none" : "cursor-grab"}`}
            >
              {/* FIXED COLUMN: Entity Signature (Transparent overlay with subtle fade) */}
              <div className="w-[180px] sm:w-[220px] shrink-0 z-30 border-r border-white/10 bg-gradient-to-r from-black/10 to-transparent backdrop-blur-sm flex flex-col">
                {/* Fixed Header */}
                <div className="px-5 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest bg-white/[0.02] border-b border-white/5 h-[52px] flex items-center">
                  Entity Signature
                </div>
                {/* Fixed Data Rows */}
                <div className="divide-y divide-white/[0.03]">
                  {filteredVisitors
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((v, i) => (
                      <div
                        key={i}
                        className="px-5 py-3 h-[64px] flex items-center bg-transparent group transition-colors hover:bg-white/[0.02]"
                      >
                        <div
                          className="flex items-center gap-2.5 cursor-pointer w-full"
                          onClick={(e) => {
                            if (dragHasMoved) return;
                            e.stopPropagation();
                            setSelectedVisitorId(v.id);
                          }}
                        >
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border border-white/10 ${v.real_name ? "text-purple-400" : "text-neutral-500"}`}
                          >
                            <FiUsers size={12} />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-[10px] font-black group-hover:text-cyan-400 transition-colors truncate uppercase tracking-tight leading-none mb-1 ${v.real_name ? "text-purple-300 shadow-purple-500/50 drop-shadow-md" : "text-white"}`}
                            >
                              {v.real_name ||
                                (v.city ? `${v.city}` : "RESOLVING...")}
                            </p>
                            <p className="text-[7px] text-neutral-600 font-mono truncate tracking-widest uppercase">
                              {v.email ? (
                                <span className="text-purple-400/80">
                                  {v.email}
                                </span>
                              ) : (
                                `${v.country} / ${v.region?.slice(0, 3) || "UNK"}`
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* SCROLLABLE DATA: Ultra-Transparent Container */}
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-x-auto custom-scrollbar relative bg-transparent"
              >
                <div className="min-w-[800px] flex flex-col">
                  {/* Header Row */}
                  <div className="flex bg-white/[0.02] border-b border-white/5 h-[52px]">
                    <div className="w-[15%] min-w-[120px] px-5 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center">
                      Trust Matrix
                    </div>
                    <div className="w-[25%] min-w-[200px] px-5 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center">
                      Ingress Node
                    </div>
                    <div className="w-[25%] min-w-[200px] px-5 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center">
                      Hardware DNA
                    </div>
                    <div className="w-[20%] min-w-[180px] px-5 py-4 text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center">
                      Last Contact
                    </div>
                    <div className="w-[15%] min-w-[100px] px-5 py-4 text-right text-[9px] font-black text-neutral-500 uppercase tracking-widest flex items-center justify-end">
                      Signal
                    </div>
                  </div>

                  {/* Data Rows */}
                  <div className="divide-y divide-white/[0.03]">
                    {filteredVisitors
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage
                      )
                      .map((v, i) => (
                        <div
                          key={i}
                          className="flex h-[64px] items-center hover:bg-white/[0.01] transition-colors"
                        >
                          <div className="w-[15%] min-w-[120px] px-5 py-3 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center gap-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                                v.is_bot
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : v.real_name
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                    : v.visit_count > 5
                                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              }`}
                            >
                              <div
                                className={`w-1 h-1 rounded-full bg-current ${!v.is_bot && (v.visit_count > 5 || v.real_name) ? "animate-pulse" : ""}`}
                              />
                              {v.is_bot
                                ? "BOT_LINK"
                                : v.real_name
                                  ? "RESOLVED_ID"
                                  : v.visit_count > 5
                                    ? "RECURRING"
                                    : "UNKNOWN"}
                            </div>
                          </div>
                          <div className="w-[25%] min-w-[200px] px-5 py-3">
                            <div className="flex flex-col gap-1">
                              <p className="text-[10px] font-bold text-neutral-300 truncate">
                                {(v.last_referrer || "DIRECT TRAFFIC").split(
                                  "/"
                                )[2] || "DIRECT"}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-[7px] px-1 bg-white/5 text-neutral-500 font-mono border border-white/5 rounded">
                                  {v.path}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="w-[25%] min-w-[200px] px-5 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <p className="text-[10px] font-bold text-neutral-300 flex items-center gap-1.5">
                                {v.device_type === "mobile" ? (
                                  <FiSmartphone
                                    size={10}
                                    className="text-cyan-400"
                                  />
                                ) : (
                                  <FiMonitor
                                    size={10}
                                    className="text-green-400"
                                  />
                                )}
                                {v.os}
                              </p>
                              <p className="text-[8px] text-neutral-600 font-mono mt-0.5">
                                {v.ip_address}
                              </p>
                            </div>
                          </div>
                          <div className="w-[20%] min-w-[180px] px-5 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <p className="text-[10px] font-bold text-white uppercase tabular-nums leading-none">
                                {new Date(v.last_seen).toLocaleDateString(
                                  undefined,
                                  { month: "short", day: "2-digit" }
                                )}
                              </p>
                              <p className="text-[8px] text-neutral-600 font-mono mt-1 tabular-nums leading-none">
                                {new Date(v.last_seen).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="w-[15%] min-w-[100px] px-5 py-3 text-right">
                            <button className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-400/5 border border-cyan-400/10 text-[8px] font-black text-cyan-400 hover:bg-cyan-400/20 transition-all uppercase tracking-widest">
                              TRACE{" "}
                              <FiChevronRight
                                size={10}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix Pagination Controls */}
            <div className="p-4 sm:p-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between bg-white/[0.02] gap-4">
              <div className="text-[8px] sm:text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                SIGNATURES {(currentPage - 1) * itemsPerPage + 1} —{" "}
                {Math.min(currentPage * itemsPerPage, recentVisitors.length)} /{" "}
                {recentVisitors.length} RESOLVED
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex-1 sm:flex-none px-6 py-2 rounded bg-white/[0.03] border border-white/5 text-[9px] font-black text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.3em] min-h-[36px]"
                >
                  PREV
                </button>
                <div className="flex gap-1 h-full items-center px-4 border-x border-white/5 hidden xs:flex">
                  <span className="text-cyan-400 font-black text-[10px] font-mono leading-none">
                    {currentPage.toString().padStart(2, "0")}
                  </span>
                  <span className="text-neutral-700 text-[8px] font-black">
                    /
                  </span>
                  <span className="text-neutral-500 font-black text-[9px] font-mono leading-none">
                    {Math.ceil(recentVisitors.length / itemsPerPage)
                      .toString()
                      .padStart(2, "0")}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage * itemsPerPage >= recentVisitors.length}
                  className="flex-1 sm:flex-none px-6 py-2 rounded bg-cyan-400/10 border border-cyan-400/20 text-[9px] font-black text-cyan-400 hover:bg-cyan-400/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all uppercase tracking-[0.3em] min-h-[36px]"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Interaction Feed */}
          <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
            <div className="liquid-glass-top-line" />
            <AdminPanelHeader
              title="BEHAVIORAL_MATRIX"
              subtitle="Live Neural Interaction Feed"
              icon={FiZap}
              iconColorClass="text-yellow-400"
            />
            <div className="px-8 py-5 flex justify-between items-center border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-6">
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/5">
                  <button
                    onClick={() => setViewMode("stream")}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "stream" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Signal_Stream
                  </button>
                  <button
                    onClick={() => setViewMode("swimlanes")}
                    className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-all ${viewMode === "swimlanes" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-neutral-300"}`}
                  >
                    Active_Lanes
                  </button>
                </div>

                <div className="w-px h-4 bg-white/5" />

                <button
                  onClick={() =>
                    setVisitorFilter(visitorFilter === "bots" ? "all" : "bots")
                  }
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all tracking-[0.2em] uppercase border ${
                    visitorFilter === "bots"
                      ? "bg-red-500/10 border-red-500/10 text-red-500"
                      : "bg-white/5 border-white/5 text-neutral-500 hover:text-white"
                  }`}
                >
                  {visitorFilter === "bots" ? "BOTS_VISIBLE" : "HUMANS_ONLY"}
                </button>
              </div>
              <div className="px-4 py-1.5 rounded-lg bg-emerald-500/5 text-[9px] font-black text-emerald-500/80 font-mono tracking-widest border border-emerald-500/10">
                LIVE_RELAY_ACTIVE
              </div>
            </div>

            <div className="p-4">
              {viewMode === "stream" ? (
                <BehavioralStream
                  actions={recentActions}
                  showBotTraffic={visitorFilter === "bots"}
                />
              ) : (
                <div className="text-neutral-500 text-sm p-4">
                  Swimlanes view coming soon...
                </div>
              )}
            </div>
          </div>

          {/* Detailed Content & Origin Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pages */}
            <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
              <div className="liquid-glass-top-line" />
              <AdminPanelHeader
                title="CONTENT_HOTSPOTS"
                subtitle="High-Value Data Streams"
                icon={FiExternalLink}
                iconColorClass="text-cyan-400"
              />
              <div className="p-8 space-y-2">
                {topPages.map((page, i) => (
                  <div
                    key={i}
                    className="flex items-center p-2.5 rounded-lg bg-white/[0.01] hover:bg-white/5 transition-all text-[11px] group border border-transparent hover:border-white/5"
                  >
                    <span className="text-neutral-500 font-mono group-hover:text-cyan-400 truncate flex-1 pr-4">
                      {page.path}
                    </span>
                    <div className="flex items-center gap-4 w-24 sm:w-32 justify-end">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden hidden xs:block">
                        <div
                          className="h-full bg-cyan-400/30"
                          style={{
                            width: `${(page.count / (topPages[0]?.count || 1)) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-white font-black font-mono w-10 text-right">
                        {page.count.toString().padStart(3, "0")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Sources */}
            <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
              <div className="liquid-glass-top-line" />
              <AdminPanelHeader
                title="TRAFFIC_INGRESS"
                subtitle="External Signal Origins"
                icon={FiTarget}
                iconColorClass="text-purple-400"
              />
              <div className="p-8 space-y-4">
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
          <LazySection placeholderHeight="600px">
            {isMapMounted && (
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
            )}
          </LazySection>
          {/* Geo Distribution */}
          <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
            <div className="liquid-glass-top-line" />
            <AdminPanelHeader
              title="GEO_CLUSTERS"
              subtitle="Regional Signal Distribution"
              icon={FiMapPin}
              iconColorClass="text-blue-400"
            />
            <div className="p-8 space-y-6">
              {topLocations.map((loc, i) => (
                <div
                  key={i}
                  className="group p-2 rounded-lg hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5"
                >
                  <div className="flex justify-between items-end mb-1.5">
                    <div className="flex flex-col min-w-0">
                      <span className="text-white font-black text-[10px] uppercase tracking-wider truncate">
                        {decodeURIComponent(loc.city || "PRIVATE")}
                      </span>
                      <span className="text-[7px] text-neutral-600 font-black uppercase tracking-widest mt-0.5">
                        {decodeURIComponent(loc.country)}
                      </span>
                    </div>
                    <span className="text-white font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded leading-none">
                      {loc.count.toString().padStart(2, "0")}
                    </span>
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

          {/* System Architecture */}
          <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative">
            <div className="liquid-glass-top-line" />
            <AdminPanelHeader
              title="SYSTEM_ARCHITECTURE"
              subtitle="Device & Browser Distribution"
              icon={FiCpu}
              iconColorClass="text-green-400"
            />
            <div className="p-8 space-y-6">
              {deviceBreakdown.slice(0, 4).map((d, i) => (
                <div key={i} className="group transition-all">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 text-neutral-500 group-hover:text-white transition-colors">
                        {getDeviceIcon(d.device_type)}
                      </div>
                      <span className="text-white font-black text-[10px] uppercase tracking-wider">
                        {d.device_type}
                      </span>
                    </div>
                    <span className="text-white font-black font-mono text-[10px] tabular-nums">
                      {Math.round((d.count / (stats.totalVisitors || 1)) * 100)}
                      %
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(d.count / (stats.totalVisitors || 1)) * 100}%`,
                      }}
                      className="h-full bg-emerald-500/60"
                    />
                  </div>
                </div>
              ))}

              <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-4">
                  BROWSER_SIGNATURES
                </p>
                {browserBreakdown.slice(0, 5).map((b, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center text-xs group"
                  >
                    <span className="text-neutral-500 flex items-center gap-2 group-hover:text-neutral-300 transition-colors">
                      <FiCompass
                        size={12}
                        className="text-neutral-600 group-hover:text-cyan-400 transition-colors"
                      />
                      <span className="text-[10px] font-mono tracking-tight">
                        {b.browser}
                      </span>
                    </span>
                    <span className="text-white font-black font-mono text-[10px] bg-white/5 px-1.5 py-0.5 rounded">
                      {b.count.toString().padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedVisitorId && (
          <EntityDossier
            visitorId={selectedVisitorId}
            onClose={() => setSelectedVisitorId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Analytics;
