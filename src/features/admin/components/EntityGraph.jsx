import { useEntityGraph } from "@/shared/analytics/useAnalyticsStats";
import {
  FiLink,
  FiShield,
  FiCpu,
  FiMonitor,
  FiAlertCircle,
} from "react-icons/fi";
import AdminPanelHeader from "./shared/AdminPanelHeader";

const EntityGraph = () => {
  const { data, isLoading } = useEntityGraph();

  if (isLoading) {
    return (
      <div className="liquid-glass flex-1 relative min-h-[200px] flex items-center justify-center">
        <span className="text-neutral-600 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse">
          Correlating Nodes
        </span>
      </div>
    );
  }

  // Extract all high-confidence entities and enable native scrolling for dense datasets
  const entities = (data?.entities || []).slice(0, 20);
  const deviceNodes = data?.device_nodes || [];

  return (
    <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative flex flex-col group">
      <div className="liquid-glass-top-line" />
      <AdminPanelHeader
        title="IDENTITY_RADAR"
        subtitle="Cross-Device Correlation Graph"
        icon={FiLink}
        iconColorClass="text-amber-400 group-hover:animate-pulse"
      />
      <div className="p-4 flex flex-col gap-3 w-full max-h-[350px] overflow-y-auto custom-scrollbar">
        {entities.length > 0 ? (
          entities.map((ent, i) => {
            const linkedNodes = deviceNodes.filter(
              (n) => String(n.entity_id) === String(ent.entity_id)
            );

            // Compute Correlation Reason
            const activeIPs = new Set(
              linkedNodes.map((n) => n.ip_address).filter(Boolean)
            );
            const activeHashes = new Set(
              linkedNodes.map((n) => n.fingerprint).filter(Boolean)
            );

            let matchReason = "Form Autofill";
            if (activeHashes.size === 1 && linkedNodes.length > 1) {
              matchReason = "Identical Hardware Hash";
            } else if (activeIPs.size === 1 && linkedNodes.length > 1) {
              matchReason = "Static IP Match";
            } else if (ent.resolution_sources?.length > 0) {
              // Convert backend array elements like "form_submit", "autofill" into clean UI format
              matchReason = ent.resolution_sources
                .map((s) =>
                  s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
                )
                .join(" + ");
            }

            return (
              <div
                key={i}
                className="group/item border border-white/5 rounded-lg p-3 hover:bg-white/[0.02] transition-colors bg-white/[0.01] flex flex-col shrink-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${ent.confidence_score > 0.6 ? "bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]" : "bg-white/5 text-neutral-500"}`}
                    >
                      <FiShield size={12} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-white tracking-widest leading-none">
                        {ent.real_name || "UNKNOWN_NODE"}
                      </h4>
                      <p className="text-[8px] font-mono text-neutral-500 truncate max-w-[150px] mt-0.5">
                        {ent.email}
                      </p>
                      {ent.aliases && ent.aliases.length > 0 && (
                        <p className="text-[7px] font-mono text-cyan-500/60 truncate max-w-[150px] mt-1 tracking-widest flex gap-1">
                          <span className="text-neutral-600">AKA:</span>
                          {ent.aliases.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-[9px] font-mono text-white mb-0.5 border border-white/10 px-1 py-0.5 rounded bg-black/20">
                      {(ent.confidence_score * 100).toFixed(0)}% MATCH
                    </div>
                    <span className="text-[7px] uppercase tracking-widest font-mono text-amber-500/70">
                      Via: {matchReason}
                    </span>
                  </div>
                </div>

                {/* Highly compressed horizontal node graph */}
                <div className="flex flex-wrap gap-1.5 mt-1 pt-2 border-t border-white/5">
                  {linkedNodes.slice(0, 4).map((node, dIdx) => (
                    <div
                      key={dIdx}
                      className="flex items-center gap-1.5 text-[8px] font-mono opacity-80 hover:opacity-100 p-1 px-1.5 rounded bg-white/[0.02] border border-white/5 whitespace-nowrap"
                    >
                      {node.device_type === "mobile" ? (
                        <FiMonitor size={8} className="text-amber-400" />
                      ) : (
                        <FiCpu size={8} className="text-amber-400" />
                      )}
                      <span className="text-neutral-300 uppercase">
                        {node.os?.slice(0, 5)} / {node.browser?.slice(0, 8)}
                      </span>
                      <span className="text-emerald-500/50 pl-1 border-l border-white/10">
                        {node.fingerprint?.slice(0, 6) || "NO_HW"}
                      </span>
                    </div>
                  ))}
                  {linkedNodes.length > 4 && (
                    <div className="flex items-center justify-center text-[7px] font-mono text-neutral-500 px-1 border border-white/5 rounded">
                      +{linkedNodes.length - 4} nodes
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 flex items-center justify-center text-neutral-600 font-mono text-[9px] uppercase tracking-widest">
            Insufficient Graph Resolution Data
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityGraph;
