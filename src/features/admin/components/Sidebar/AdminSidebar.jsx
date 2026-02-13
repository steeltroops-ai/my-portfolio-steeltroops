import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiMail,
  FiSettings,
  FiLogOut,
  FiChevronRight,
  FiChevronLeft,
  FiFileText,
  FiBarChart2,
} from "react-icons/fi";
import { signOut } from "../../services/HybridAuthService";
import { IMAGES } from "@/constants";
import { useQueryClient } from "@tanstack/react-query";
import { fetchStats } from "@/shared/analytics/useAnalyticsStats";
import { fetchContactMessages } from "../../hooks/useContactMessages";
import { getAllPosts } from "../../../blog/services/HybridBlogService";
import { blogQueryKeys } from "../../../blog/hooks/useBlogQueries";

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const prefetchedPaths = useRef(new Set());

  const handlePrefetch = (path) => {
    if (prefetchedPaths.current.has(path)) return;
    prefetchedPaths.current.add(path);

    switch (path) {
      case "/admin/analytics":
        console.log("Priority Prefetch: Analytics");
        import("../Analytics");
        queryClient.prefetchQuery({
          queryKey: ["analytics-stats"],
          queryFn: fetchStats,
          staleTime: 1000 * 60 * 5,
        });
        break;
      case "/admin/messages":
        console.log("Priority Prefetch: Messages");
        import("../MessageCenter");
        queryClient.prefetchQuery({
          queryKey: ["contactMessages", "all"],
          queryFn: () => fetchContactMessages("all"),
          staleTime: 1000 * 60 * 2,
        });
        break;
      case "/admin/dashboard":
        console.log("Priority Prefetch: Dashboard");
        queryClient.prefetchQuery({
          queryKey: blogQueryKeys.allPosts({}),
          queryFn: () => getAllPosts({}),
          staleTime: 1000 * 60 * 2,
        });
        break;
      case "/admin/ai-generator":
        console.log("Priority Prefetch: AI Generator");
        import("../AIBlogGenerator");
        break;
      default:
        break;
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: FiHome },
    { name: "Analytics", path: "/admin/analytics", icon: FiBarChart2 },
    { name: "AI Blogs", path: "/admin/ai-generator", icon: FiFileText },
    { name: "Messages", path: "/admin/messages", icon: FiMail },
  ];

  return (
    <div
      onClick={() => setCollapsed(!collapsed)}
      className={`h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] rounded-none will-change-[width]
        ${collapsed ? "w-16 cursor-pointer" : "w-64"}
        bg-white/5 backdrop-blur-[2px] border-r border-white/10 shadow-2xl
      `}
    >
      {/* Header / Brand */}
      <div className="h-16 flex items-center border-b border-white/5 relative">
        <Link
          to="/"
          onClick={(e) => {
            e.stopPropagation();
            if (collapsed) {
              e.preventDefault();
              setCollapsed(false);
            } else if (window.innerWidth < 1280) {
              setCollapsed(true);
            }
          }}
          className="flex items-center w-full h-full group focus:outline-none"
        >
          {/* Icon Gutter (Fixed 64px) */}
          <div className="w-16 shrink-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 border border-white/10 bg-white/5 overflow-hidden">
              <img
                src={IMAGES.adminLogo}
                alt="MPS"
                className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100"
              />
            </div>
          </div>
          {/* Label Container */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${collapsed ? "w-0 opacity-0 -translate-x-4" : "w-auto opacity-100 translate-x-0"}`}
          >
            <span className="font-bold text-lg text-white tracking-wide whitespace-nowrap ml-1">
              Admin
            </span>
          </div>
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          className="absolute -right-3 top-6 bg-neutral-900 border border-white/10 rounded-full p-1 text-neutral-400 hover:text-white transition-colors shadow-lg z-[60] focus:outline-none"
        >
          {collapsed ? (
            <FiChevronRight size={12} />
          ) : (
            <FiChevronLeft size={12} />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onMouseEnter={() => handlePrefetch(item.path)}
              onFocus={() => handlePrefetch(item.path)}
              onClick={(e) => {
                if (window.innerWidth < 1280) {
                  setCollapsed(true);
                }
                e.stopPropagation();
              }}
              className={`flex items-center h-12 transition-all duration-300 group relative focus:outline-none overflow-hidden
                ${isActive ? "text-white" : "text-neutral-400 hover:text-white"}
              `}
              title={collapsed ? item.name : ""}
            >
              {/* Highlight Background */}
              <div
                className={`absolute inset-y-1.5 inset-x-2 rounded-lg transition-all duration-300 
                ${isActive ? "bg-white/10" : "bg-transparent group-hover:bg-white/5"}`}
              />

              {/* Icon Gutter (Fixed 64px) */}
              <div className="w-16 shrink-0 flex items-center justify-center relative z-10">
                <Icon
                  size={20}
                  className={`transition-colors ${isActive ? "text-white" : "group-hover:text-white"}`}
                />
              </div>

              {/* Label */}
              <div
                className={`relative z-10 transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] ${collapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}
              >
                <span className="font-medium whitespace-nowrap text-sm ml-1">
                  {item.name}
                </span>
              </div>

              {collapsed && isActive && (
                <div className="absolute left-16 ml-2 px-2 py-1 bg-neutral-900/90 backdrop-blur-sm text-white text-[10px] rounded border border-white/10 whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="border-t border-white/5 bg-white/5 py-3">
        {/* Settings */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (collapsed) {
              setCollapsed(false);
              setShowSettings(true);
            } else {
              setShowSettings(!showSettings);
            }
          }}
          className={`w-full flex items-center h-12 transition-all duration-300 group relative focus:outline-none overflow-hidden
            ${showSettings && !collapsed ? "text-white" : "text-neutral-400 hover:text-white"}
          `}
          title="Settings"
        >
          <div
            className={`absolute inset-y-1.5 inset-x-2 rounded-lg transition-all duration-300 
            ${showSettings && !collapsed ? "bg-white/10" : "bg-transparent hover:bg-white/5"}`}
          />

          <div className="w-16 shrink-0 flex items-center justify-center relative z-10">
            <FiSettings size={18} />
          </div>

          <div
            className={`flex flex-1 items-center justify-between pr-4 relative z-10 transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] ${collapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}
          >
            <span className="font-medium text-sm ml-1">Settings</span>
            <span
              className={`text-[10px] transition-transform duration-200 ${showSettings ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </div>
        </button>

        {/* Auto-Save Toggle */}
        <div
          className={`overflow-hidden transition-all duration-500 ${!collapsed && showSettings ? "h-12 opacity-100" : "h-0 opacity-0"}`}
        >
          <div
            className="flex items-center px-4 h-full group cursor-pointer transition-colors hover:bg-white/5"
            onClick={(e) => {
              e.stopPropagation();
              setAutoSaveEnabled(!autoSaveEnabled);
            }}
          >
            <div className="w-8" /> {/* Offset for visual balance */}
            <div className="flex-1 flex items-center justify-between ml-2">
              <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
                Auto-save
              </span>
              <div
                className={`relative w-7 h-4 rounded-full transition-colors duration-200 ${autoSaveEnabled ? "bg-white/80" : "bg-neutral-600"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-black w-3 h-3 rounded-full transition-transform duration-200 ${autoSaveEnabled ? "translate-x-3" : "translate-x-0"}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.innerWidth < 1280) {
              setCollapsed(true);
            }
            handleLogout();
          }}
          className="w-full flex items-center h-12 transition-all duration-300 group relative focus:outline-none overflow-hidden text-neutral-400 hover:text-white"
          title="Sign Out"
        >
          <div className="absolute inset-y-1.5 inset-x-2 rounded-lg transition-all duration-300 bg-transparent hover:bg-white/5" />

          <div className="w-16 shrink-0 flex items-center justify-center relative z-10">
            <FiLogOut
              size={18}
              className="group-hover:scale-105 transition-transform"
            />
          </div>

          <div
            className={`relative z-10 transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] ${collapsed ? "opacity-0 -translate-x-4" : "opacity-100 translate-x-0"}`}
          >
            <span className="font-medium text-sm ml-1">Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
