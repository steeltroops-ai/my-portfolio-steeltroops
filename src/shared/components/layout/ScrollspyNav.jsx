import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Handle navigation click to scroll to target section
  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Disable observer during programmatic scroll
      isScrollingRef.current = true;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Immediately update active section
      setActiveSection(sectionId);

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      // Re-enable observer after scroll completes
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  };

  useEffect(() => {
    // Check if Intersection Observer is supported
    if (!("IntersectionObserver" in window)) {
      console.warn("Intersection Observer not supported");
      return;
    }

    // Configure observer with rootMargin to trigger when section crosses viewport center
    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    // Callback to update activeSection when sections intersect
    const observerCallback = (entries) => {
      // Skip updates during programmatic scrolling
      if (isScrollingRef.current) {
        return;
      }

      // Find the most visible intersecting section
      const intersectingEntries = entries.filter(
        (entry) => entry.isIntersecting
      );

      if (intersectingEntries.length > 0) {
        // If multiple sections are intersecting, pick the first one in document order
        const sortedEntries = intersectingEntries.sort((a, b) => {
          const aIndex = sections.findIndex((s) => s.id === a.target.id);
          const bIndex = sections.findIndex((s) => s.id === b.target.id);
          return aIndex - bIndex;
        });

        setActiveSection(sortedEntries[0].target.id);
      }
    };

    // Create the observer
    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    // Function to find and observe sections
    const observeSections = () => {
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) {
          observer.observe(element);
        }
      });
    };

    // Initial observation attempt
    observeSections();

    // Use MutationObserver to handle lazy-loaded sections
    const mutationObserver = new MutationObserver(() => {
      observeSections();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup function to disconnect observers on unmount
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="hidden xl:block fixed right-3 md:right-4 xl:right-8 top-1/2 -translate-y-1/2 z-40 pointer-events-none"
    >
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
                  focus:outline-none px-2 md:px-3 py-1 md:py-1.5
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
                    layoutId="active-pill-scrollspy"
                    className="absolute inset-0 bg-purple-500/10 border border-purple-400/50 rounded-full shadow-lg ring-1 ring-white/10"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
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
    </nav>
  );
};

export default ScrollspyNav;
