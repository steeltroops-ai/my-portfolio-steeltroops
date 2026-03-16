import { motion, LayoutGroup } from "framer-motion";
import { useNavigation } from "@/shared/context/NavigationContext";
import { NAV_SECTIONS } from "@/constants/navigation";

const ScrollspyNav = () => {
  const { activeSection, handleNavClick } = useNavigation();

  return (
    <nav
      aria-label="Page sections"
      className="hidden xl:block fixed right-3 md:right-4 xl:right-8 top-1/2 -translate-y-1/2 z-[50] pointer-events-none"
    >
      <LayoutGroup id="scrollspy-nav">
        <ul className="flex flex-col gap-1.5 md:gap-2 items-end pointer-events-auto">
          {NAV_SECTIONS.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <li key={section.id} className="relative w-auto group">
                <a
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(section.id);
                  }}
                   className={`
                    relative z-10 block text-[10px] md:text-xs xl:text-sm whitespace-nowrap transition-colors duration-300 cursor-pointer
                    focus:outline-none px-2 md:px-3 py-1 md:py-1.5 touch-manipulation
                    ${
                      isActive
                        ? "text-purple-100 font-medium"
                        : "text-neutral-400 font-normal hover:text-neutral-200"
                    }
                  `}
                  aria-current={isActive ? "true" : "false"}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-pill"
                      className="absolute inset-0 bg-purple-500/15 border border-purple-400/60 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <motion.span
                    className="relative z-20 flex items-center"
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-purple-400/60 font-mono mr-2 text-[10px]">
                      {String(
                        NAV_SECTIONS.findIndex((s) => s.id === section.id) + 1
                      ).padStart(2, "0")}
                    </span>
                    {section.label}
                  </motion.span>
                </a>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>
    </nav>
  );
};

export default ScrollspyNav;
