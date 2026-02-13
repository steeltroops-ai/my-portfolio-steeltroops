import { PROJECTS } from "@/constants";
import { m, AnimatePresence } from "framer-motion";
import {
  FaGithub,
  FaChevronDown,
  FaChevronUp,
  FaChevronLeft,
  FaChevronRight,
  FaRocket,
  FaLayerGroup,
} from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";
import { useState } from "react";
import { useAnalytics } from "@/shared/analytics/useAnalytics";

const ProjectCard = ({ project, isExpanded, onToggle }) => {
  const { trackEvent } = useAnalytics();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = project.images || (project.image ? [project.image] : []);
  const hasMultipleImages = images.length > 1;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleToggle = () => {
    if (!isExpanded) {
      trackEvent("projects", "expand", project.title);
    }
    onToggle();
  };
  return (
    <div
      onClick={handleToggle}
      className={`group cursor-pointer flex flex-col relative overflow-hidden rounded-2xl will-change-transform h-full w-full
        bg-transparent backdrop-blur-none border-0
        ${isExpanded ? "shadow-[0_0_80px_-20px_rgba(255,255,255,0.1)]" : "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"}`}
    >
      {/* Liquid Glass Outline - Apple Style Refraction */}
      <div className="absolute inset-0 rounded-2xl border border-white/20 pointer-events-none z-30"></div>

      {/* Internal Glass Highlight (Specular) */}
      <div className="absolute inset-[1px] rounded-[calc(1rem-1.5px)] border border-white/5 pointer-events-none z-30"></div>

      {/* Progressive Glass Background Layer */}
      <div
        className="absolute inset-0 bg-white/[0.01] rounded-2xl pointer-events-none z-0"
        style={{
          maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 60%, transparent 100%)",
        }}
      />
      {/* fading blue - center vertical gradient to bridge sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.03] via-transparent to-transparent pointer-events-none z-0"></div>

      {/* Premium Blur Gradient - Liquid Glass Progressive Blur */}
      <div
        className="absolute inset-0 backdrop-blur-xl pointer-events-none z-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, black 10%, rgba(0,0,0,0.5) 40%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 10%, rgba(0,0,0,0.5) 40%, transparent 100%)",
        }}
      />

      {/* Premium Liquid Accents - Replicating MobileNav/Apple Edge Logic */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-70 group-hover:opacity-100 transition-opacity z-40"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent pointer-events-none z-30"></div>

      {/* Project Image Area with Progressive Mask */}
      <m.div
        layout
        className={`relative overflow-hidden z-10 bg-neutral-900
          ${isExpanded ? "aspect-video h-auto w-full" : "h-[220px] aspect-[4/3]"}`}
        style={{
          maskImage: "linear-gradient(to bottom, black 90%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 90%, transparent 100%)",
        }}
      >
        <AnimatePresence mode="wait">
          <m.img
            key={currentImageIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5 }}
            src={(() => {
              const currentImg = images[isExpanded ? currentImageIndex : 0];
              if (!currentImg && !project.image) return null;
              // If currentImg is a string (external URL), use it directly
              // If it's an object (from vite-imagetools not generating raw srcset string but module), handle it?
              // Actually vite-imagetools with ?as=srcset returns a string "src 300w, src 600w..."
              // But we still need a fallback 'src' for older browsers or if it's just a string URL.

              if (typeof currentImg === "string") {
                if (currentImg.startsWith("http")) {
                  // ... logic for external URLs ...
                  const isDirectImage =
                    /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(currentImg);
                  if (project.url && !hasMultipleImages && !isDirectImage) {
                    const cleanProjectUrl = project.url.replace(/\/$/, "");
                    return `https://api.microlink.io/?url=${encodeURIComponent(cleanProjectUrl)}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&viewport.isMobile=false&viewport.width=1280&viewport.height=720`;
                  }
                  if (!isDirectImage) {
                    const cleanUrl = currentImg.replace(/\/$/, "");
                    return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&viewport.isMobile=false&viewport.width=1280&viewport.height=720`;
                  }
                  return currentImg;
                }
                // It's a srcset string from vite-imagetools (hopefully), or a simple path string if not processed
                // For the 'src' attribute, we need a single source.
                // vite-imagetools ?as=srcset returns the string. We can't easily extract one src.
                // Actually, modern browsers ignore src if srcset is valid and matching.
                // But we should try to give a fallback.
                // If we use 'as=srcset', the import IS the srcset string.
                return currentImg.split(" ")[0]; // Very naive fallback, picks first URL (300w usually)
              }
              return null;
            })()}
            srcSet={(() => {
              const currentImg = images[isExpanded ? currentImageIndex : 0];
              if (
                typeof currentImg === "string" &&
                !currentImg.startsWith("http")
              ) {
                return currentImg; // This is our srcset string
              }
              return undefined;
            })()}
            sizes={
              isExpanded
                ? "(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 80vw"
                : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            }
            fetchPriority={isExpanded ? "high" : "low"}
            loading="lazy"
            width={800}
            height={500}
            alt={
              project.imageAlt ||
              `${project.title} - ${isExpanded ? currentImageIndex + 1 : 1}`
            }
            className={`w-full h-full transition-transform duration-700 ${
              isExpanded
                ? "object-cover object-top"
                : "object-cover object-top group-hover:scale-110"
            }`}
            data-original-url={images[isExpanded ? currentImageIndex : 0]}
            onError={(e) => {
              // ... existing error handler logic ...
              const currentSrc = e.target.src;
              const originalUrl = e.target.getAttribute("data-original-url");

              if (
                !originalUrl ||
                (typeof originalUrl === "string" &&
                  !originalUrl.startsWith("http"))
              ) {
                if (project.image && project.image.startsWith("http")) {
                  e.target.src = project.image;
                } else {
                  e.target.src =
                    "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=800";
                }
                e.target.removeAttribute("srcset"); // Remove broken srcset on error
                return;
              }

              const cleanUrl = originalUrl.replace(/\/$/, "");

              if (currentSrc.includes("microlink.io")) {
                e.target.src = `https://image.thum.io/get/width/1280/crop/720/noanimate/${cleanUrl}`;
              } else {
                e.target.src =
                  project.image ||
                  "https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?q=80&w=800";
              }
            }}
          />
        </AnimatePresence>

        {/* Fallback Placeholder (if no image at all) */}
        {!images[isExpanded ? currentImageIndex : 0] && !project.image && (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 flex items-center justify-center">
            <FaLayerGroup className="text-white/10 text-6xl" />
          </div>
        )}

        {/* Carousel Controls - Only visible when expanded */}
        {hasMultipleImages && isExpanded && (
          <>
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 z-40">
              <button
                onClick={prevImage}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
              >
                <FaChevronLeft className="text-xs" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 z-40">
              <button
                onClick={nextImage}
                className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
              >
                <FaChevronRight className="text-xs" />
              </button>
            </div>
            {/* Carousel Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === currentImageIndex
                      ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      : "w-1 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Softened overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />

        {/* Action Icons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <AnimatePresence>
            {!isExpanded && (
              <m.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex gap-2"
              >
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("projects", "github_click", project.title);
                    }}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                    aria-label={`View ${project.title} source code on GitHub`}
                    title="View Source Code"
                  >
                    <FaGithub
                      className="text-white text-sm"
                      aria-hidden="true"
                    />
                  </a>
                )}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent("projects", "demo_click", project.title);
                    }}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                    aria-label={`Visit ${project.title} live demo`}
                    title="View Live Demo"
                  >
                    <FiGlobe
                      className="text-white text-sm"
                      aria-hidden="true"
                    />
                  </a>
                )}
              </m.div>
            )}
          </AnimatePresence>
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="hidden lg:flex p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20"
              aria-label="Collapse project details"
            >
              <FaChevronUp className="text-sm" />
            </button>
          )}
        </div>

        {/* Title Overlay for Expanded Card */}
        {isExpanded && (
          <div className="absolute bottom-4 left-6 right-6 z-10">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-white text-[9px] font-light uppercase tracking-[0.2em] bg-black-600/30 px-2.5 py-1 rounded-full border border-purple-500/50 backdrop-blur-md shadow-lg ring-1 ring-white/10">
                Project Deep Dive
              </span>
            </m.div>
          </div>
        )}
      </m.div>

      {/* Card Content Area */}
      <div
        className={`px-6 pb-4 pt-2 sm:px-8 sm:pb-6 sm:pt-3 flex-1 flex flex-col relative z-20 text-left ${isExpanded ? "bg-white/[0.01] md:overflow-y-auto" : ""}`}
      >
        {!isExpanded && (
          <div className="mb-2">
            <h3 className="text-lg title-font text-neutral-200 group-hover:text-white transition-colors mb-1 tracking-tight">
              {project.title}
            </h3>
            <div
              className="flex flex-wrap gap-2"
              role="list"
              aria-label="Key technologies"
            >
              {project.technologies.slice(0, 3).map((tech, i) => (
                <span
                  key={i}
                  className="text-[9px] uppercase tracking-wider text-purple-300/80 group-hover:text-purple-300 transition-colors"
                  role="listitem"
                >
                  {tech}
                  {i < 2 ? " •" : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {isExpanded ? (
            <m.div
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full space-y-6"
            >
              {/* Project Title */}
              <div>
                <h3 className="text-xl sm:text-2xl title-font text-white tracking-tight">
                  {project.title}
                </h3>
              </div>

              {/* Organized Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Description Column */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-purple-500/50"></div>
                    <span className="text-[10px] font-light uppercase tracking-[0.2em] text-purple-300 shrink-0">
                      Core Initiatives
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent"></div>
                  </div>
                  <div
                    className="space-y-4"
                    role="list"
                    aria-label="Project description points"
                  >
                    {Array.isArray(project.description) ? (
                      project.description.map((point, i) => (
                        <div
                          key={i}
                          className="flex gap-4 group/item"
                          role="listitem"
                        >
                          <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-white/30 group-hover/item:bg-white/60 transition-colors shrink-0" />
                          <p className="text-sm sm:text-base leading-relaxed text-neutral-300 font-light">
                            {point}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed text-neutral-300 font-light">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Tech Snapshot Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="p-4 md:p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div>
                      <h4 className="text-[10px] font-light uppercase tracking-widest text-neutral-500 mb-3">
                        Tech Stack
                      </h4>
                      <div
                        className="flex flex-wrap gap-2"
                        role="list"
                        aria-label="All technologies used"
                      >
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-light text-white/70 bg-white/5 px-3 py-1 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                            role="listitem"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn flex items-center justify-between px-6 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                          aria-label={`View source code for ${project.title} on GitHub`}
                        >
                          <div className="flex items-center gap-2">
                            <FaGithub className="text-base text-white/70 group-hover/btn:text-white transition-colors" />
                            <span className="text-sm font-light text-white/70 group-hover/btn:text-white transition-colors">
                              Source Code
                            </span>
                          </div>
                          <div className="text-[10px] font-light uppercase tracking-widest text-neutral-500 group-hover/btn:text-neutral-300 transition-colors">
                            GitHub
                          </div>
                        </a>
                      )}

                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/btn flex items-center justify-between px-6 py-2 rounded-xl bg-emerald-500/5 hover:bg-emerald-500/15 transition-all border border-emerald-500/20"
                          aria-label={`View live demo for ${project.title}`}
                        >
                          <div className="flex items-center gap-2">
                            <FiGlobe className="text-sm text-emerald-400/70 group-hover/btn:text-emerald-400 transition-colors" />
                            <span className="text-sm font-light text-emerald-300/70 group-hover/btn:text-emerald-300 transition-colors">
                              Live Demo
                            </span>
                          </div>
                          <div className="text-[10px] font-light uppercase tracking-widest text-emerald-500/50 group-hover/btn:text-emerald-400/50 transition-colors">
                            Preview
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unified Collapse Footer (Symmetrical to Expand button) */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle();
                }}
                className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between cursor-pointer group/close"
                role="button"
                aria-label="Collapse project details"
              >
                <span className="text-[10px] font-light text-neutral-500 uppercase tracking-widest group-hover/close:text-white transition-colors">
                  Collapse Project
                </span>
                <FaChevronUp className="text-neutral-600 group-hover/close:text-white group-hover/close:-translate-y-0.5 transition-all text-[10px]" />
              </div>
            </m.div>
          ) : (
            <m.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <p className="line-clamp-3 text-sm text-neutral-400 font-light leading-relaxed">
                {Array.isArray(project.description)
                  ? project.description[0]
                  : project.description}
              </p>

              <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-white/5 flex items-center justify-between pointer-events-none">
                <span className="text-[9px] font-light text-neutral-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
                  Explore Project
                </span>
                <FaChevronDown className="text-neutral-600 group-hover:text-white group-hover:translate-y-0.5 transition-all text-[9px]" />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Projects = () => {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section className="pb-16 sm:pb-24 lg:pb-32 border-b border-neutral-800 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <h2 className="my-12 sm:my-16 lg:my-24 section-title">
          My <span>Projects</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 auto-rows-min">
          {PROJECTS.map((project, index) => {
            const isExpanded = expandedId === index;
            return (
              <m.div
                layout
                transition={{
                  type: "spring",
                  stiffness: 60,
                  damping: 20,
                  mass: 1,
                }}
                onLayoutAnimationComplete={() => {
                  if (isExpanded) {
                    document
                      .getElementById(`project-${index}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }}
                id={`project-${index}`}
                key={`${project.title}-${index}`}
                className={`relative rounded-2xl
                  ${
                    isExpanded
                      ? "md:col-span-2 md:row-span-2 lg:col-span-2 lg:row-span-2 md:h-[932px] min-h-[800px] h-auto z-50"
                      : "h-[450px] z-0"
                  }`}
              >
                <ProjectCard
                  project={project}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpand(index)}
                />
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
