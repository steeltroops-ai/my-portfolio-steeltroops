import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiMail,
  FiSettings,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiFileText,
} from "react-icons/fi";
import { signOut } from "../../services/HybridAuthService";
import mpsLogo from "../../../../assets/mps.png";

const AdminSidebar = ({ collapsed, setCollapsed }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: FiHome },
    { name: "AI Blogs", path: "/admin/ai-generator", icon: FiFileText },
    { name: "Messages", path: "/admin/messages", icon: FiMail },
  ];

  return (
    <div
      className={`h-screen fixed left-0 top-0 z-50 flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-16" : "w-64"}
        bg-white/5 backdrop-blur-[2px] border-r border-white/10 shadow-2xl
      `}
    >
      {/* Header / Brand */}
      <div className="h-16 flex items-center justify-center border-b border-white/5 relative">
        <Link
          to="/"
          className={`flex items-center gap-3 overflow-hidden group transition-all duration-300 ${collapsed ? "justify-center px-0" : "px-3 w-full"}`}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 border border-white/10 bg-white/5">
            <img
              src={mpsLogo}
              alt="MPS"
              className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100"
            />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg text-white tracking-wide whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity">
              Admin
            </span>
          )}
        </Link>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-neutral-900 border border-white/10 rounded-full p-1 text-neutral-400 hover:text-white transition-colors shadow-lg z-[60]"
        >
          {collapsed ? (
            <FiChevronRight size={12} />
          ) : (
            <FiChevronLeft size={12} />
          )}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-white/10 text-white border border-white/5"
                    : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                }
                ${collapsed ? "justify-center px-2" : ""}
              `}
              title={collapsed ? item.name : ""}
            >
              <Icon
                size={20}
                className={`shrink-0 min-w-[20px] ${isActive ? "text-white" : "group-hover:text-white transition-colors"}`}
              />
              {!collapsed && (
                <span className="font-medium whitespace-nowrap text-sm">
                  {item.name}
                </span>
              )}
              {collapsed && isActive && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-900 text-white text-xs rounded border border-white/10 whitespace-nowrap z-50 pointer-events-none">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Section */}
      <div className="p-3 border-t border-white/5 bg-white/5 backdrop-blur-md">
        {/* Settings */}
        <button
          onClick={() => !collapsed && setShowSettings(!showSettings)}
          className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-2.5 rounded-lg transition-all duration-200 mb-2
            ${showSettings && !collapsed ? "bg-white/5 text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}
          `}
          title="Settings"
        >
          <div className="flex items-center gap-3">
            <FiSettings size={18} />
            {!collapsed && (
              <span className="font-medium text-sm">Settings</span>
            )}
          </div>
          {!collapsed && (
            <span
              className={`text-[10px] transition-transform duration-200 ${showSettings ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          )}
        </button>

        {/* Auto-Save Toggle */}
        {!collapsed && showSettings && (
          <div className="mb-3 pl-3 pr-1 space-y-3 animate-fadeIn">
            <div
              className="flex items-center justify-between group cursor-pointer p-2 rounded hover:bg-white/5 transition-colors"
              onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            >
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
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 group
             ${collapsed ? "justify-center" : ""}
          `}
          title="Sign Out"
        >
          <FiLogOut
            size={18}
            className="group-hover:scale-105 transition-transform"
          />
          {!collapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
