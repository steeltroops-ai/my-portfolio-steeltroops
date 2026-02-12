import { useState, useEffect, useRef } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  FiHome,
  FiUser,
  FiCpu,
  FiBriefcase,
  FiFolder,
  FiMail,
} from "react-icons/fi";

const sections = [
  { id: "hero", label: "Home", icon: FiHome },
  { id: "about", label: "About", icon: FiUser },
  { id: "technologies", label: "Tech Stack", icon: FiCpu },
  { id: "experience", label: "Experience", icon: FiBriefcase },
  { id: "projects", label: "Projects", icon: FiFolder },
  { id: "contact", label: "Contact", icon: FiMail },
];

const MobileNav = () => {
  const [activeSection, setActiveSection] = useState("hero");

  // Ref for cleanup and state management
  const observerRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Track active section
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -20% 0px", // Tighter margin for better accuracy
      threshold: 0.1,
    };

    const observerCallback = (entries) => {
      // Skip if programmatically scrolling to avoid stutter
      if (isScrollingRef.current) return;

      const visibleSections = entries.filter((entry) => entry.isIntersecting);

      if (visibleSections.length > 0) {
        // Sort by intersection ratio to find the "most visible" section
        const mostVisible = visibleSections.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio
        )[0];

        if (mostVisible?.target?.id) {
          setActiveSection(mostVisible.target.id);
        }
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );
    observerRef.current = observer;

    const observeSections = () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) observer.observe(element);
      });
    };

    // Initial observation
    observeSections();

    // Re-observe when DOM changes (for lazy loaded sections)
    // Debounced to avoid performance hits
    let timeoutId;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(observeSections, 500);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      clearTimeout(timeoutId);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleNavClick = (sectionId) => {
    // Lock observer
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    setActiveSection(sectionId);

    if (sectionId === "hero") {
      // Special case for Home: Scroll to absolute top
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        // Calculate offset to account for any fixed headers if needed,
        // but scrollIntoView is usually enough. block: 'start' aligns it to top.
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    // Unlock observer after animation
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 1000);
  };

  return (
    <nav
      className="xl:hidden fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-8rem)] sm:w-[85%] md:w-[70%] max-w-md"
      aria-label="Mobile navigation"
    >
      <div className="relative bg-white/[0.01] backdrop-blur-[4px] rounded-xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/30">
        {/* Liquid highlight - mimics light on water surface */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>

        {/* Content */}
        <div className="relative px-2 sm:px-3 py-2">
          <ul className="flex justify-between items-center gap-0">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <li key={section.id} className="relative">
                  <button
                    onClick={() => handleNavClick(section.id)}
                    className={`
                      relative z-10 flex flex-col items-center justify-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-colors duration-300
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
                        layoutId="active-pill-mobile"
                        className="absolute inset-0 bg-purple-500/10 border border-purple-400/50 rounded-lg shadow-lg ring-1 ring-white/10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
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
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
