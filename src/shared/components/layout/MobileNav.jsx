import { useState, useEffect } from "react";
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

  // Track active section
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;

    const observerOptions = {
      root: null,
      rootMargin: "-50% 0px -50% 0px",
      threshold: 0,
    };

    const observerCallback = (entries) => {
      const intersecting = entries.filter((entry) => entry.isIntersecting);
      if (intersecting.length > 0) {
        setActiveSection(intersecting[0].target.id);
      }
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
    }
  };

  return (
    <nav
      className="xl:hidden fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-8rem)] sm:w-[85%] md:w-[70%] max-w-md"
      aria-label="Mobile navigation"
    >
      <div className="relative bg-gradient-to-br from-white/5 via-white/[0.02] to-transparent backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl border border-white/20">
        {/* Glassmorphism inner glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/5 via-transparent to-transparent"></div>

        {/* Content */}
        <div className="relative px-2 sm:px-3 py-2">
          <ul className="flex justify-between items-center gap-0">
            {sections.map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;

              return (
                <li key={section.id}>
                  <button
                    onClick={() => handleNavClick(section.id)}
                    className={`
                      flex flex-col items-center justify-center gap-0.5 p-1.5 sm:p-2 rounded-lg transition-all duration-300
                      ${
                        isActive
                          ? "bg-purple-500/25 border border-purple-400/50 aspect-square shadow-lg"
                          : "text-neutral-400 hover:text-white hover:bg-white/5"
                      }
                    `}
                    aria-label={section.label}
                    aria-current={isActive ? "true" : undefined}
                  >
                    <Icon
                      size={18}
                      className={`stroke-[1.5] transition-all duration-300 ${
                        isActive
                          ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                          : ""
                      }`}
                    />
                    <span className="text-[8px] font-medium hidden xs:block">
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
