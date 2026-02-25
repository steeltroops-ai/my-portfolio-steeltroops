import React from "react";
import { FiX, FiMove } from "react-icons/fi";

/**
 * Reusable Admin Panel Header
 * Matches the sidebar UI/UX philosophy: h-16, bg-white/5, transparent, elegant.
 */
const AdminPanelHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColorClass,
  onClose,
  dragControls,
  className = "",
}) => {
  return (
    <div
      onPointerDown={(e) => dragControls && dragControls.start(e)}
      className={`h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-white/5 relative ${dragControls ? "cursor-move" : ""} ${className}`}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5">
            <Icon
              size={20}
              className={
                iconColorClass ||
                (title === "ENTITY_DOSSIER"
                  ? "text-cyan-400 animate-pulse"
                  : "text-white/80")
              }
            />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[11px] font-black text-white tracking-[0.2em] uppercase leading-none">
            {title}
          </span>
          {subtitle && (
            <span className="text-[9px] text-neutral-500 font-mono tracking-widest mt-1 uppercase">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {dragControls && <FiMove size={12} className="text-white/20" />}
        {onClose && (
          <>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="group relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
              title="Close Panel"
            >
              <FiX
                size={18}
                className="text-neutral-500 group-hover:text-white transition-colors"
              />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanelHeader;
