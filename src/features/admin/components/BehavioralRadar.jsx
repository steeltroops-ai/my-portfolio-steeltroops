import { useBiometricRadar } from "@/shared/analytics/useAnalyticsStats";
import { FiMinimize2, FiAlertCircle } from "react-icons/fi";
import AdminPanelHeader from "./shared/AdminPanelHeader";
import { motion } from "framer-motion";

const BehavioralRadar = () => {
  const { data, isLoading } = useBiometricRadar();

  if (isLoading) {
    return (
      <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-2xl relative min-h-[250px] flex items-center justify-center">
        <div className="liquid-glass-top-line" />
        <span className="text-neutral-600 font-mono tracking-widest text-xs uppercase animate-pulse">
          Calibrating Radar...
        </span>
      </div>
    );
  }

  const points = data?.points || [];

  return (
    <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-2xl relative h-full flex flex-col group">
      <div className="liquid-glass-top-line" />
      <AdminPanelHeader
        title="BEHAVIORAL_RADAR"
        subtitle="Turing Matrix Sandbox"
        icon={FiMinimize2}
        iconColorClass="text-rose-400 group-hover:rotate-90 transition-transform duration-700"
      />
      <div className="flex-1 p-5 relative isolate flex flex-col min-h-[250px]">
        {/* Radar Background grid */}
        <div className="absolute inset-5 border-l border-b border-white/10" />
        <div className="absolute inset-5 border border-white/5 rounded-full opacity-20 pointer-events-none" />
        <div className="absolute inset-5 border border-white/5 rounded-full opacity-10 scale-50 pointer-events-none" />
        <div className="absolute inset-5 border border-white/5 rounded-full opacity-5 scale-25 pointer-events-none" />

        {/* Y Axis Label */}
        <div className="absolute top-1/2 -left-2 -translate-y-1/2 -rotate-90 text-[7px] font-mono text-neutral-500 uppercase tracking-widest">
          Mouse Velocity
        </div>
        {/* X Axis Label */}
        <div className="absolute left-1/2 bottom-1 -translate-x-1/2 text-[7px] font-mono text-neutral-500 uppercase tracking-widest">
          Entropy Score (Randomness)
        </div>

        <div className="absolute top-5 right-5 text-right space-y-1">
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
            BOT_SUSPECT (Low Entropy)
          </div>
          <div className="flex items-center gap-2 text-[9px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ORGANIC_HUMAN
          </div>
        </div>

        <div className="relative w-full h-full flex-1">
          {points.length > 0 ? (
            points.map((p, i) => {
              // Map entropy (0-1) to left-right X axis
              // Notice bots have entropy_score ~0-0.2
              const xPos = Math.max(0, Math.min(100, p.entropy_score * 100));

              // Map mouse velocity (0-5000+) to bottom-top Y axis
              const maxVel = 5000;
              const yPos = Math.max(
                0,
                Math.min(100, ((p.avg_mouse_velocity || 0) / maxVel) * 100)
              );

              const isBot =
                p.entropy_score < 0.2 || p.is_bot || p.is_bot_verified;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className="absolute group/node z-10 -translate-x-1/2 translate-y-1/2 placeholder"
                  style={{
                    left: `${xPos}%`,
                    bottom: `${yPos}%`,
                  }}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border border-white/20 transition-transform hover:scale-150 ${
                      isBot
                        ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.6)]"
                        : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    }`}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity bg-black/90 border border-white/10 p-3 rounded pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-md">
                    <p className="text-[10px] text-white font-bold mb-1 border-b border-white/10 pb-1">
                      {p.real_name || "UNKNOWN_NODE"}
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      VSL: {Math.round(p.avg_mouse_velocity || 0)}px/s
                    </p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      ENT: {Number(p.entropy_score || 0).toFixed(3)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-mono text-[10px] uppercase">
              Awaiting Signal Data...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BehavioralRadar;
