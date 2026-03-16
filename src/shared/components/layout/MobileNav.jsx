import { m, AnimatePresence, LayoutGroup } from "framer-motion";
import { useNavigation } from "@/shared/context/NavigationContext";
import { NAV_SECTIONS } from "@/constants/navigation";

const MobileNav = () => {
  const { activeSection, handleNavClick } = useNavigation();

  return (
    <nav
      className="xl:hidden fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[50] w-[calc(100%-8rem)] sm:w-[85%] md:w-[70%] max-w-md"
      aria-label="Mobile navigation"
    >
      <LayoutGroup id="mobile-nav">
        <div className="relative bg-white/[0.01] backdrop-blur-[4px] rounded-xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/30">
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

          <div className="relative px-2 sm:px-3 py-2">
            <ul className="flex justify-between items-center gap-0">
              {NAV_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                const Icon = section.icon;

                return (
                  <li key={section.id} className="relative">
                    <m.button
                      onClick={() => handleNavClick(section.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className={`
                        relative z-10 flex flex-col items-center justify-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-colors duration-300 touch-manipulation
                        ${
                          isActive
                            ? "text-purple-100"
                            : "text-neutral-400 hover:text-white"
                        }
                      `}
                      aria-label={section.label}
                      aria-current={isActive ? "true" : undefined}
                    >
                      {isActive && (
                        <m.div
                          layoutId="mobile-active-pill"
                          className="absolute inset-0 bg-purple-500/10 border border-purple-400/50 rounded-lg shadow-lg ring-1 ring-white/10"
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 45,
                            mass: 1,
                          }}
                        />
                      )}
                      <Icon
                        size={18}
                        className={`relative z-20 stroke-[1.5] transition-all duration-300 ${
                          isActive
                            ? "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                            : ""
                        }`}
                      />
                      <span className="relative z-20 text-[8px] font-medium hidden xs:block">
                        {section.label}
                      </span>
                    </m.button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </LayoutGroup>
    </nav>
  );
};

export default MobileNav;
