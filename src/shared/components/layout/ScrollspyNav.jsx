import { useState, useEffect, useRef } from "react";
import { motion, LayoutGroup } from "framer-motion";
import {
  scrollToElement,
  isGlobalNavigating,
} from "@/shared/utils/scrollHelper";

const sections = [
  { id: "hero", label: "Home" },
  { id: "about", label: "About" },
  { id: "technologies", label: "Tech Stack" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
];

const ScrollspyNav = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const activeRef = useRef("hero");

  const updateActiveSection = (newSection) => {
    if (newSection !== activeRef.current) {
      activeRef.current = newSection;
      setActiveSection(newSection);
    }
  };

  // Handle navigation click to scroll to target section
  const handleNavClick = (sectionId) => {
    updateActiveSection(sectionId);
    scrollToElement(sectionId, { offset: 80 });
  };

  useEffect(() => {
    // Sync state and lock with global navigation events
    const onNavStart = (e) => {
      if (e.detail?.targetId) updateActiveSection(e.detail.targetId);
    };

    window.addEventListener("portfolio-navigation-start", onNavStart);

    // Intersection Observer for scroll-based updates
    const observerOptions = {
      root: null,
      rootMargin: "-45% 0px -45% 0px",
      threshold: [0.1, 0.5, 0.9],
    };

    const observerCallback = (entries) => {
      if (isGlobalNavigating()) return;

      const intersectingEntries = entries.filter(
        (entry) => entry.isIntersecting
      );
      if (intersectingEntries.length > 0) {
        const mostVisible = intersectingEntries.sort(
          (a, b) => b.intersectionRatio - a.intersectionRatio
        )[0];
        updateActiveSection(mostVisible.target.id);
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    const observeSections = () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) observer.observe(element);
      });
    };

    observeSections();

    const mutationObserver = new MutationObserver(observeSections);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("portfolio-navigation-start", onNavStart);
    };
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="hidden xl:block fixed right-3 md:right-4 xl:right-8 top-1/2 -translate-y-1/2 z-[50] pointer-events-none"
    >
      <LayoutGroup id="scrollspy-nav">
        <ul className="flex flex-col gap-1.5 md:gap-2 items-end pointer-events-auto">
          {sections.map((section) => {
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
                      layoutId="active-pill"
                      className="absolute inset-0 bg-purple-500/10 border border-purple-400/50 rounded-full shadow-lg ring-1 ring-white/10"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-20">
                    <span className="text-purple-400/60 font-mono mr-2">
                      {String(
                        sections.findIndex((s) => s.id === section.id) + 1
                      ).padStart(2, "0")}
                    </span>
                    {section.label}
                  </span>
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
