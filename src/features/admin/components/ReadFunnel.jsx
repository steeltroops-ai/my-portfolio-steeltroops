import { useReadFunnel } from "@/shared/analytics/useAnalyticsStats";
import { FiFilter } from "react-icons/fi";
import AdminPanelHeader from "./shared/AdminPanelHeader";

const ReadFunnel = () => {
  const { data, isLoading } = useReadFunnel();

  if (isLoading) {
    return (
      <div className="liquid-glass flex-1 relative min-h-[250px] flex items-center justify-center">
        <span className="text-neutral-600 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse">
          Indexing Funnel
        </span>
      </div>
    );
  }

  const globalFunnel = data?.global_funnel || [];
  const maxVal = Math.max(...globalFunnel.map((s) => s.count), 1);

  return (
    <div className="liquid-glass backdrop-blur-none rounded-xl overflow-hidden shadow-2xl relative h-full flex flex-col group">
      <div className="liquid-glass-top-line" />
      <AdminPanelHeader
        title="CONTENT_RETENTION"
        subtitle="Global Reading Depth Funnel"
        icon={FiFilter}
        iconColorClass="text-purple-400 group-hover:rotate-180 transition-transform duration-700"
      />

      <div className="p-5 space-y-2 flex-1">
        {globalFunnel.map((stage, i) => {
          const pct = Math.round((stage.count / maxVal) * 100) || 0;
          return (
            <div key={i} className="flex flex-col mb-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 group-hover:text-purple-400 transition-colors duration-300">
                  {stage.label}
                </span>
                <span className="text-[11px] font-mono text-white">
                  {stage.count}{" "}
                  <span className="text-neutral-600 text-[8px]">({pct}%)</span>
                </span>
              </div>

              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative border border-transparent hover:border-white/10 transition-colors">
                <div
                  className="h-full bg-gradient-to-r from-purple-500/20 to-purple-400/80 transition-all duration-1000 ease-out"
                  style={{ width: `${pct}%`, opacity: 1 - i * 0.1 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReadFunnel;
