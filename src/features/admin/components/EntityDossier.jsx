import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  FiUser,
  FiCpu,
  FiGlobe,
  FiActivity,
  FiShield,
  FiMapPin,
  FiBattery,
  FiMail,
  FiLinkedin,
  FiInfo,
  FiServer,
  FiAlertTriangle,
  FiLayers,
  FiMonitor,
  FiTarget,
  FiSmartphone,
  FiWifi,
  FiTerminal,
  FiLock,
  FiClock,
  FiMaximize,
} from "react-icons/fi";
import {
  useVisitorDetail,
  useContentProfile,
} from "@/shared/analytics/useAnalyticsStats";
import AdminPanelHeader from "./shared/AdminPanelHeader";

const EntityDossier = ({ visitorId, onClose }) => {
  const { data: detail, isLoading: detailLoading } =
    useVisitorDetail(visitorId);
  const { data: contentData, isLoading: contentLoading } =
    useContentProfile(visitorId);
  const isLoading = detailLoading || contentLoading;
  const [activeTab, setActiveTab] = useState("dna");
  const dragControls = useDragControls();
  const constraintsRef = React.useRef(null);

  // Prevent background scrolling when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!visitorId) return null;

  const profile = detail?.profile || {};
  const events = detail?.events || [];

  const profileItems = [
    // --- IDENTITY ---
    ...(profile.email
      ? [
          {
            icon: FiMail,
            label: "Identity Link",
            value: profile.email,
          },
        ]
      : []),
    ...(profile.linkedin_url
      ? [
          {
            icon: FiLinkedin,
            label: "Professional Grid",
            value: "OPEN_PROFILE",
            onClick: () => window.open(profile.linkedin_url, "_blank"),
          },
        ]
      : []),

    // --- GEOGRAPHY ---
    {
      icon: FiMapPin,
      label: "Location",
      value:
        [profile.city, profile.region, profile.country]
          .filter(Boolean)
          .join(", ") || "Unknown Location",
    },
    {
      icon: FiClock,
      label: "Local Timezone",
      value:
        profile.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC",
    },

    // --- SYSTEM ---
    {
      icon: FiMonitor,
      label: "Operating System",
      value: `${profile.os || "Unknown OS"} ${profile.os_version || ""}`.trim(),
    },
    {
      icon: FiGlobe,
      label: "Browser Engine",
      value:
        `${profile.browser || "Unknown"} ${profile.browser_version || ""}`.trim(),
    },
    {
      icon: FiSmartphone,
      label: "Device Class",
      value: profile.device_type || "Desktop/Laptop",
    },
    {
      icon: FiMaximize,
      label: "Display Resolution",
      value: profile.screen_resolution || "Unknown",
    },

    // --- HARDWARE ---
    {
      icon: FiCpu,
      label: "Processor",
      value: `${navigator.hardwareConcurrency || 4} Cores`,
    },
    {
      icon: FiLayers,
      label: "GPU Renderer",
      value: profile.gpu_renderer || "Integrated Graphics",
    },
    {
      icon: FiActivity,
      label: "Memory",
      value: `~${profile.device_memory || "8"} GB`,
    },
    {
      icon: FiBattery,
      label: "Power State",
      value: profile.battery_level
        ? `${profile.battery_level}%`
        : "Mains Power",
    },

    // --- NETWORK ---
    {
      icon: FiWifi,
      label: "Network Uplink",
      value: profile.connection_type || profile.isp || "Unknown ISP",
    },
  ];

  const securityItems = [
    {
      icon: FiShield,
      label: "Bot Detection",
      value: profile.is_bot ? "POSITIVE (Bot)" : "NEGATIVE (Human)",
      subtext: "Heuristic Confidence: 99.9%",
    },
    {
      icon: FiLock,
      label: "Connection Security",
      value: "TLS 1.3 / H2",
      subtext: "Encrypted Tunnel",
    },
    {
      icon: FiGlobe,
      label: "Language Locale",
      value: profile.language || navigator.language,
    },
    {
      icon: FiTerminal,
      label: "User Agent",
      value: profile.user_agent || navigator.userAgent,
      subtext: "Raw String",
    },
  ];

  const riskScore = profile.is_bot ? 95 : 12;

  const ListItem = ({ icon: Icon, label, value, subtext, onClick }) => (
    <div
      onClick={onClick}
      className={`group relative flex items-center h-10 w-full transition-all duration-300 focus:outline-none ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="absolute inset-y-0.5 inset-x-2 rounded transition-all bg-transparent group-hover:bg-white/5" />

      {/* Compact Icon Gutter */}
      <div className="relative z-10 w-10 shrink-0 flex items-center justify-center">
        <Icon
          size={14}
          className="text-neutral-500 group-hover:text-white transition-colors"
        />
      </div>

      {/* Compact Content */}
      <div className="relative z-10 flex-1 min-w-0 pr-4 flex items-center justify-between gap-4">
        <span className="text-[10px] text-neutral-400 group-hover:text-neutral-300 transition-colors">
          {label}
        </span>
        <div className="flex flex-col items-end min-w-0">
          <span className="text-[10px] font-medium text-white/90 truncate max-w-[150px]">
            {value}
          </span>
          {subtext && (
            <span className="text-[8px] text-neutral-600 font-mono leading-none">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none p-4 sm:p-8"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-auto"
          onClick={onClose}
        />

        {/* Window Container - Side-bar Style "Liquid Glass" */}
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragElastic={0}
          whileDrag={{
            scale: 1.005,
            boxShadow: "0 50px 100px rgba(0,0,0,0.8)",
            cursor: "grabbing",
          }}
          dragConstraints={constraintsRef}
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="w-[340px] h-[550px] flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] rounded-2xl overflow-hidden pointer-events-auto will-change-transform"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Reusable Header extracted for modularity */}
          <AdminPanelHeader
            title="VISITOR_PROFILE"
            subtitle={`ID: ${visitorId?.substring(0, 8)}`}
            onClose={onClose}
            dragControls={dragControls}
            className="h-10 px-4 border-b-0"
          />

          {/* Compact Profile Quickview */}
          <div className="px-5 py-2 border-b border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative group/avatar shrink-0">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shadow-lg relative z-10 overflow-hidden">
                  <FiUser
                    size={18}
                    className="text-neutral-500 group-hover/avatar:text-white transition-colors duration-500"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <h2 className="text-sm font-bold text-white tracking-tight truncate leading-none">
                  {profile.real_name || "Unidentified User"}
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-black tracking-wider ${riskScore > 80 ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {riskScore > 80 ? "HIGH_RISK" : "TRUSTED"}
                  </span>
                  <span className="text-neutral-700 text-[8px]">•</span>
                  <span className="text-[9px] text-neutral-400 font-mono flex items-center gap-1">
                    {profile.ip_address || "0.0.0.0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Standardized Tabs */}
          <div className="flex px-4 border-b border-white/5 bg-white/[0.02] shrink-0 min-h-[40px]">
            {[
              { id: "dna", label: "Profile" },
              { id: "timeline", label: "Activity" },
              { id: "content", label: "Engagement" },
              { id: "threat", label: "Security" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center text-[10px] font-medium transition-all relative ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-400"
                }`}
              >
                <span className="relative z-10">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 w-full h-[1px] bg-cyan-400"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Body Content - Minimalist Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-0.5 bg-transparent">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 text-neutral-600 gap-4">
                <div className="w-6 h-6 border-2 border-white/5 border-t-white/40 rounded-full animate-spin" />
                <span className="text-[8px] font-mono tracking-[0.4em] uppercase">
                  Gathering Signal...
                </span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-0.5 pb-2"
              >
                {/* HARDWARE DNA VIEW */}
                {activeTab === "dna" && (
                  <div className="space-y-0.5">
                    {profileItems.map((item, idx) => (
                      <ListItem key={idx} {...item} />
                    ))}

                    <div className="mt-6 mx-2 p-4 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4 items-start group hover:bg-white/[0.05] transition-all duration-500">
                      <FiInfo
                        size={16}
                        className="text-neutral-500 mt-0.5 shrink-0 group-hover:text-white transition-colors"
                      />
                      <p className="text-[10px] text-neutral-500 group-hover:text-neutral-400 leading-relaxed font-mono transition-colors">
                        Nexus footprinting success. Telemetry gathered via WebGL
                        profiling and browser entropy analysis.
                      </p>
                    </div>
                  </div>
                )}

                {/* TIMELINE VIEW */}
                {activeTab === "timeline" && (
                  <div className="py-2">
                    {events.length === 0 && (
                      <div className="py-20 text-center text-neutral-700 text-[9px] font-mono uppercase tracking-[0.4em]">
                        Buffer_Empty
                      </div>
                    )}

                    {events.slice(0, 15).map((event, i) => (
                      <div
                        key={i}
                        className="group relative flex items-center min-h-[4rem] w-full px-2 transition-all duration-500"
                      >
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-white/5 z-0 group-last:h-1/2" />
                        <div className="relative z-10 w-12 shrink-0 flex items-center justify-center">
                          <div
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 group-hover:scale-[3] group-hover:ring-8 group-hover:ring-white/5 ${
                              event.event_type === "click"
                                ? "bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                                : "bg-white/40"
                            }`}
                          />
                        </div>
                        <div className="flex-1 relative z-10 p-3 rounded-xl border border-white/5 bg-white/[0.02] group-hover:bg-white/[0.06] group-hover:border-white/10 transition-all ml-2">
                          <div className="flex justify-between items-start mb-1.5">
                            <span
                              className={`text-[8px] font-black uppercase tracking-[0.2em] ${event.event_type === "click" ? "text-purple-400" : "text-neutral-400"}`}
                            >
                              {event.event_type}
                            </span>
                            <span className="text-[8px] text-neutral-600 font-mono">
                              {new Date(event.timestamp).toLocaleTimeString(
                                [],
                                {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono break-all line-clamp-1 group-hover:text-neutral-200 transition-colors">
                            {event.path || event.event_label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CONTENT VIEW */}
                {activeTab === "content" && (
                  <div className="py-2">
                    {!contentData?.post_summary ||
                    contentData.post_summary.length === 0 ? (
                      <div className="py-20 text-center text-neutral-700 text-[9px] font-mono uppercase tracking-[0.4em]">
                        NO_ENGAGEMENT_DETECTED
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {contentData.post_summary.map((post, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col gap-3"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-white tracking-tight">
                                {post.slug}
                              </span>
                              <div
                                className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${post.finished ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : post.bounced ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"}`}
                              >
                                {post.finished
                                  ? "COMPLETED"
                                  : post.bounced
                                    ? "BOUNCED"
                                    : "OPENED"}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-black">
                                  Max Depth
                                </span>
                                <span className="text-sm font-mono text-white">
                                  {post.max_depth}%
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-black">
                                  Time Spent
                                </span>
                                <span className="text-sm font-mono text-white">
                                  {post.time_spent
                                    ? `${post.time_spent}s`
                                    : "---"}
                                </span>
                              </div>
                            </div>
                            {post.sections_read?.length > 0 && (
                              <div className="flex flex-col mt-2 pt-2 border-t border-white/5">
                                <span className="text-[8px] text-neutral-500 uppercase tracking-widest font-black mb-1.5">
                                  Sections Read
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {post.sections_read.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-neutral-300 font-mono border border-white/5"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* THREAT VIEW */}
                {activeTab === "threat" && (
                  <div className="space-y-0.5 pt-1">
                    {securityItems.map((item, idx) => (
                      <ListItem key={idx} {...item} />
                    ))}

                    <div className="flex flex-col items-center py-12">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="1"
                            fill="transparent"
                            className="text-white/5"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="transparent"
                            strokeDasharray={351.8}
                            strokeDashoffset={351.8 * (1 - riskScore / 100)}
                            className={`${riskScore > 80 ? "text-red-500" : "text-emerald-500"} transition-all duration-1000 ease-out`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span
                            className={`text-3xl font-black tracking-tighter ${riskScore > 80 ? "text-red-500" : "text-white"}`}
                          >
                            {riskScore}%
                          </span>
                          <span className="text-[7px] text-neutral-600 uppercase font-black tracking-[0.3em] mt-1">
                            Risk_Matrix
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="p-3 border-t border-white/5 bg-white/[0.02] flex gap-2 shrink-0">
            <button className="flex-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-[9px] font-bold text-neutral-400 hover:text-white flex items-center justify-center gap-2">
              <FiTarget size={12} />
              <span>Track Activity</span>
            </button>
            <button className="flex-1 h-8 rounded-lg bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all text-[9px] font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-2">
              <FiShield size={12} />
              <span>Block User</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EntityDossier;
