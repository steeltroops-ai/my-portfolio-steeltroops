import React from "react";
import {
  FiMonitor,
  FiSmartphone,
  FiTablet,
  FiActivity,
  FiClock,
} from "react-icons/fi";
import { motion } from "framer-motion";

const ActiveSwimlane = ({ sessions = [], onSelectSession }) => {
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

  return (
    <div className="space-y-1">
      {sessions.map((session, index) => (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          key={session.id || index}
          onClick={() => onSelectSession && onSelectSession(session.visitor_id)}
          className="group relative flex items-center h-16 w-full cursor-pointer overflow-hidden transition-all duration-500 cubic-bezier-[0.4,0,0.2,1] focus:outline-none"
        >
          {/* Sidebar-style Highlight Background */}
          <div className="absolute inset-y-1.5 inset-x-2 rounded-lg transition-all duration-500 bg-transparent group-hover:bg-white/5 border border-transparent group-hover:border-white/5" />

          <div className="flex items-center gap-4 px-4 w-full relative z-10">
            {/* Column 1: Device & Network */}
            <div className="flex items-center gap-4 min-w-[160px]">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-neutral-400 group-hover:text-white transition-all">
                {getDeviceIcon(session.device_type)}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate max-w-[100px]">
                  {session.isp || "Unknown Net"}
                </span>
                <span className="text-[9px] text-neutral-500 font-mono tracking-tight">
                  {session.city}, {session.country_code}
                </span>
              </div>
            </div>

            {/* Column 2: Activity Breadcrumb */}
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
              <div className="h-px w-8 bg-white/5" />
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300 transition-colors">
                <span className="text-white/60">/</span>
                <FiActivity size={10} className="text-neutral-600" />
                <span className="truncate max-w-[200px]">
                  {session.last_path || "/"}
                </span>
                {session.total_clicks + session.total_pageviews > 1 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-white/5 text-[8px] font-black text-white/40 border border-white/5">
                    +{session.total_clicks + session.total_pageviews}
                  </span>
                )}
              </div>
            </div>

            {/* Column 3: Status Pulse */}
            <div className="flex flex-col items-end min-w-[100px]">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${new Date() - new Date(session.last_seen) < 300000 ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-neutral-700"}`}
                />
                <span
                  className={`text-[9px] font-black tracking-widest uppercase ${new Date() - new Date(session.last_seen) < 300000 ? "text-emerald-400" : "text-neutral-600"}`}
                >
                  {new Date() - new Date(session.last_seen) < 300000
                    ? "Live"
                    : "Idle"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-600 font-mono">
                <FiClock size={10} />
                {new Date(session.last_seen).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </div>
            </div>
          </div>

          {/* Progress Bar Detail */}
          <div className="absolute bottom-1.5 left-6 right-6 h-[1px] bg-white/5 overflow-hidden rounded-full">
            <div
              className="h-full bg-white/10 transition-all duration-1000"
              style={{
                width: `${Math.min(((session.duration_seconds || 0) / 300) * 100, 100)}%`,
              }}
            />
          </div>
        </motion.div>
      ))}

      {sessions.length === 0 && (
        <div className="p-16 text-center border border-dashed border-white/5 rounded-2xl text-neutral-700 text-[10px] font-mono uppercase tracking-[0.4em]">
          No Active Neural Links
        </div>
      )}
    </div>
  );
};

export default ActiveSwimlane;
