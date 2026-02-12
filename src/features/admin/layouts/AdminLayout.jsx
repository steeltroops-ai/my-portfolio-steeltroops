import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/Sidebar/AdminSidebar";
import { SEOHead } from "@/shared";
import { useQueryClient } from "@tanstack/react-query";
import { fetchStats } from "@/shared/analytics/useAnalyticsStats";
import { fetchContactMessages } from "../hooks/useContactMessages";
import { getAllPosts } from "../../blog/services/HybridBlogService";
import { blogQueryKeys } from "../../blog/hooks/useBlogQueries";
import { useSmartSync } from "../../../hooks/useSmartSync";

const AdminLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1280 : false
  );
  const location = useLocation();
  const queryClient = useQueryClient();

  // Handle auto-collapse on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // GLOBAL SHADOW-LOADER: Prefetch idle admin pages
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Global Shadow-Loader: Analyzing Routes...");
      const currentPath = location.pathname;

      // 1. Prefetch Analytics (if not current)
      if (currentPath !== "/admin/analytics") {
        import("../components/Analytics");
        queryClient.prefetchQuery({
          queryKey: ["analytics-stats"],
          queryFn: fetchStats,
          staleTime: 1000 * 60 * 5,
        });
      }

      // 2. Prefetch Messages (if not current)
      if (currentPath !== "/admin/messages") {
        import("../components/MessageCenter");
        queryClient.prefetchQuery({
          queryKey: ["contactMessages", "all"],
          queryFn: () => fetchContactMessages("all"),
          staleTime: 1000 * 60 * 2,
        });
      }

      // 3. Prefetch Dashboard Posts (if not current)
      if (currentPath !== "/admin/dashboard") {
        queryClient.prefetchQuery({
          queryKey: blogQueryKeys.allPosts({}),
          queryFn: () => getAllPosts({}),
          staleTime: 1000 * 60 * 2,
        });
      }

      // 4. Prefetch AI Generator (Code only)
      if (currentPath !== "/admin/ai-generator") {
        import("../components/AIBlogGenerator");
      }
    }, 1000); // 1s idle delay

    return () => clearTimeout(timer);
  }, [location.pathname, queryClient]);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <SEOHead title="Admin Dashboard" noindex={true} />

      {/* Global Background Effects (Star/Galaxy) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-full bg-black">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-[-10%] h-[1000px] w-[1000px] rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,#fbfbfb36,#000)] opacity-40 animate-pulse-slow"></div>
        </div>
      </div>

      {/* Sidebar */}
      <AdminSidebar
        collapsed={isSidebarCollapsed}
        setCollapsed={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <main
        onClick={() => {
          if (!isSidebarCollapsed && window.innerWidth < 1280) {
            setIsSidebarCollapsed(true);
          }
        }}
        className={`relative z-10 transition-all duration-300 ease-in-out
          ml-16 ${!isSidebarCollapsed ? "xl:ml-64" : ""}
          min-h-screen ${!isSidebarCollapsed && window.innerWidth < 1280 ? "cursor-pointer" : ""}
        `}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
