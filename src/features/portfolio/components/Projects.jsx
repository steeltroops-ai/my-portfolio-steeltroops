import { PROJECTS } from "@/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaGithub,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
  FaRocket,
  FaLayerGroup,
} from "react-icons/fa";
import { useState } from "react";

const ProjectCard = ({ project, isExpanded, onToggle }) => {
  return (
    <div
      onClick={onToggle}
      className={`group cursor-pointer flex flex-col h-full relative overflow-hidden rounded-2xl transition-all duration-500
        bg-transparent backdrop-blur-none border-0 z-0
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
      <div
        className={`relative overflow-hidden transition-all duration-700 ease-in-out z-10
          ${isExpanded ? "h-[300px] sm:h-[400px]" : "h-48 sm:h-56 md:h-52"}`}
        style={{
          maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 85%, transparent 100%)",
        }}
      >
        <img
          src={
            project.url
              ? `https://image.thum.io/get/width/1200/crop/800/noanimate/${project.url}`
              : project.image
          }
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            e.target.src = project.image;
          }}
        />
        {/* Softened overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-50" />

        {/* Action Icons Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
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
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                  >
                    <FaGithub className="text-white text-sm" />
                  </a>
                )}
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/20 hover:scale-110 transition-all"
                  >
                    <FaExternalLinkAlt className="text-white text-xs" />
                  </a>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="p-2.5 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 transition-all border border-white/20"
            >
              <FaChevronUp className="text-sm" />
            </button>
          )}
        </div>

        {/* Title Overlay for Expanded Card */}
        {isExpanded && (
          <div className="absolute bottom-8 left-8 right-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1.5"
            >
              <span className="text-white/80 text-[9px] font-bold uppercase tracking-[0.2em] bg-white/5 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
                Project Deep Dive
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white title-font drop-shadow-2xl tracking-tight">
                {project.title}
              </h3>
            </motion.div>
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div
        className={`p-6 sm:p-8 flex-1 flex flex-col relative z-20 ${isExpanded ? "bg-white/[0.01]" : ""}`}
      >
        {!isExpanded && (
          <div className="mb-3">
            <h3 className="text-lg font-bold title-font text-neutral-200 group-hover:text-white transition-colors mb-1 tracking-tight">
              {project.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.technologies.slice(0, 3).map((tech, i) => (
                <span
                  key={i}
                  className="text-[9px] uppercase tracking-wider font-bold text-neutral-400"
                >
                  {tech}
                  {i < 2 ? " •" : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full space-y-8"
            >
              {/* Organized Info Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Description Column */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 shrink-0">
                      Core Initiatives
                    </span>
                  </div>
                  <div className="space-y-4">
                    {Array.isArray(project.description) ? (
                      project.description.map((point, i) => (
                        <div key={i} className="flex gap-4 group/item">
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
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-4">
                        Technical Snapshot
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold text-white/70 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex gap-3">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] transition-all text-xs font-semibold text-white"
                        >
                          <FaGithub /> Source Code
                        </a>
                      )}
                      {project.url && (
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-xs font-semibold text-white border border-white/10"
                        >
                          <FaExternalLinkAlt /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
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

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
                  Explore Project
                </span>
                <FaChevronDown className="text-neutral-600 group-hover:text-white group-hover:translate-y-0.5 transition-all text-[10px]" />
              </div>
            </motion.div>
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
    if (expandedId !== id) {
      setTimeout(() => {
        document
          .getElementById(`project-${id}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }
  };

  return (
    <div
      id="projects"
      className="pb-16 sm:pb-24 lg:pb-32 border-b border-neutral-800 scroll-mt-20"
    >
      <h2 className="my-12 sm:my-16 lg:my-24 section-title">
        My <span>Projects</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 auto-rows-min">
        {PROJECTS.map((project, index) => {
          const isExpanded = expandedId === index;
          return (
            <div
              id={`project-${index}`}
              key={`${project.title}-${index}`}
              className={`transition-all duration-300 ease-out 
                ${isExpanded ? "sm:col-span-2 sm:row-span-2 lg:col-span-2 lg:row-span-2 z-10" : "z-0"}`}
            >
              <ProjectCard
                project={project}
                isExpanded={isExpanded}
                onToggle={() => toggleExpand(index)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Projects;
