import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/Sidebar/AdminSidebar";
import { SEOHead } from "@/shared";
import { useQueryClient } from "@tanstack/react-query";
import { fetchStats } from "@/shared/analytics/useAnalyticsStats";
import { fetchContactMessages } from "../hooks/useContactMessages";
import { getAllPosts } from "../../blog/services/HybridBlogService";
import { blogQueryKeys } from "../../blog/hooks/useBlogQueries";
import { IMAGES } from "@/constants";

import { AdminProvider, useAdmin } from "../context/AdminContext";
import { useAdminPulse } from "../hooks/useAdminPulse";
import { RealtimeProvider } from "@/shared/api/realtime/RealtimeProvider";
import { useSmartSync } from "../../../hooks/useSmartSync";

const AdminLayoutContent = () => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useAdmin();
  const location = useLocation();
  const queryClient = useQueryClient();

  // 1. Centralized Real-Time Intelligence
  useAdminPulse();

  // 2. Version-check polling fallback (30s) — keeps data fresh when SSE is unavailable
  useSmartSync();

  // GLOBAL SHADOW-LOADER: Intelligent Pre-heating with Priority Queuing
  useEffect(() => {
    const currentPath = location.pathname;

    // 1. HIGH PRIORITY: Critical JS Bundles based on current context
    const loadCurrentBundle = async () => {
      if (currentPath.includes("analytics"))
        await import("../components/Analytics");
      if (currentPath.includes("messages"))
        await import("../components/MessageCenter");
      if (currentPath.includes("ai-generator"))
        await import("../components/AIBlogGenerator");
    };
    loadCurrentBundle();

    // 2. IDLE PRIORITY: Warm up background modules when CPU/Network is free
    const prefetchBackgroundModules = () => {
      // Governance: Only prefetch on good networks and non-save-data mode
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      const isSlowNetwork =
        connection &&
        (connection.saveData ||
          ["slow-2g", "2g", "3g"].includes(connection.effectiveType));

      if (isSlowNetwork) {
        console.log("⚡ Governance: Slow network detected. Skipping prefetch.");
        return;
      }

      if (!currentPath.includes("analytics")) import("../components/Analytics");
      if (!currentPath.includes("messages"))
        import("../components/MessageCenter");
      if (!currentPath.includes("ai-generator"))
        import("../components/AIBlogGenerator");
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => prefetchBackgroundModules(), {
        timeout: 2000,
      });
    } else {
      setTimeout(prefetchBackgroundModules, 3000);
    }

    // 3. DATA PREFETCHING: Always keep the global cache warm
    // We use a small delay to prioritize the main page render first
    const prefetchData = () => {
      // Analytics Stats
      queryClient.prefetchQuery({
        queryKey: ["analytics-stats"],
        queryFn: fetchStats,
        staleTime: 0, // Always revalidate background data
      });

      // Contact Messages
      queryClient.prefetchQuery({
        queryKey: ["contactMessages", "all"],
        queryFn: () => fetchContactMessages("all"),
        staleTime: 0,
      });

      // Blog Database
      queryClient.prefetchQuery({
        queryKey: blogQueryKeys.allPosts({ limit: 100 }),
        queryFn: () => getAllPosts({ limit: 100 }),
        staleTime: 0,
      });
    };

    const dataTimer = setTimeout(prefetchData, 1500);
    return () => clearTimeout(dataTimer);
  }, [location.pathname, queryClient]);

  // Mobile Swipe Gesture Handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [touchEndY, setTouchEndY] = useState(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    const x = e.targetTouches[0].clientX;
    const y = e.targetTouches[0].clientY;

    // SECURITY/UX: Only allow swiping to OPEN from the left edge when in the content area
    const isInsideContent = e.target.closest("main");
    const isSidebarOpen = !isSidebarCollapsed;

    // If sidebar is CLOSED and we are in the main area, only allow swiping from the extreme left (e.g., < 40px)
    if (!isSidebarOpen && isInsideContent && x > 40) {
      setTouchStart(null);
      return;
    }

    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(x);
    setTouchStartY(y);
  };

  const handleTouchMove = (e) => {
    if (touchStart === null) return;
    setTouchEnd(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (touchStart === null || touchEnd === null || !touchStartY || !touchEndY)
      return;

    const distanceX = touchStart - touchEnd;
    const distanceY = touchStartY - touchEndY;

    // PERFORMANCE: Use primary axis detection to prevent sidebar trigger during vertical scrolls
    if (Math.abs(distanceY) > Math.abs(distanceX)) return;

    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    if (isRightSwipe && window.innerWidth < 1280) {
      setIsSidebarCollapsed(false);
    }
    if (isLeftSwipe && window.innerWidth < 1280) {
      setIsSidebarCollapsed(true);
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-hidden relative admin-viewport-lock"
    >
      <SEOHead title="Admin Dashboard" noindex={true} />

      {/* Global Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)] opacity-40"></div>
        </div>
      </div>

      <div className="flex w-full h-[100dvh] overflow-hidden relative">
        {/* Mobile Backdrop Overlay - Persistent for smooth fade-out */}
        <div
          className={`fixed inset-0 bg-black/60 z-[45] xl:hidden transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] touch-none 
            ${!isSidebarCollapsed ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
          onClick={() => setIsSidebarCollapsed(true)}
        />

        {/* Sidebar Container */}
        <div
          className={`h-full z-50 transition-[width,transform] duration-500 cubic-bezier-[0.4,0,0.2,1] 
            absolute xl:relative inset-y-0 left-0 touch-pan-y
            ${!isSidebarCollapsed ? "translate-x-0 w-64" : "-translate-x-full xl:translate-x-0 w-64 xl:w-16"}
          `}
        >
          <AdminSidebar
            collapsed={isSidebarCollapsed}
            setCollapsed={setIsSidebarCollapsed}
          />
        </div>

        {/* Main Content Area */}
        <main
          data-lenis-prevent
          className={`relative z-10 transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] 
            flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden scrollbar-none admin-content-locked
          `}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  return (
    <RealtimeProvider>
      <AdminProvider>
        <AdminLayoutContent />
      </AdminProvider>
    </RealtimeProvider>
  );
};

export default AdminLayout;
